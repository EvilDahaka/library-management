
import { Router } from "express";
import { db } from "../prisma/db.js";

const router = Router();

// Отримання видач разом із даними читача, книги та примірника
async function getEnrichedLoans() {
  const [loans, readers, copies, books] = await Promise.all([
    db.orm.public.Loan.all(),
    db.orm.public.Reader.all(),
    db.orm.public.BookCopy.all(),
    db.orm.public.Book.all(),
  ]);

  return loans.map((loan) => {
    const reader = readers.find((item) => item.id === loan.readerId);
    const copy = copies.find((item) => item.id === loan.bookCopyId);
    const book = books.find((item) => item.id === copy?.bookId);

    return {
      ...loan,
      readerName: reader?.fullName ?? "Невідомий читач",
      inventoryNumber: copy?.inventoryNumber ?? "—",
      bookTitle: book?.title ?? "Невідома книга",
    };
  });
}

// Усі записи про видачу
router.get("/", async (_req, res) => {
  try {
    const loans = await getEnrichedLoans();
    res.json(loans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Помилка отримання видач" });
  }
});

// Прострочені книги
router.get("/overdue", async (_req, res) => {
  try {
    const loans = await db.orm.public.Loan.all();
    const now = new Date();

    const overdueLoans = loans.filter(
      (loan) =>
        (loan.status === "ACTIVE" || loan.status === "OVERDUE") &&
        new Date(loan.dueDate) < now,
    );

    // Оновлюємо статус прострочених видач
    for (const loan of overdueLoans) {
      if (loan.status === "ACTIVE") {
        await db.orm.public.Loan
          .where({ id: loan.id })
          .update({ status: "OVERDUE" });
      }
    }

    const updatedLoans = await getEnrichedLoans();

    const overdue = updatedLoans.filter(
      (loan) =>
        loan.status === "OVERDUE" &&
        new Date(loan.dueDate) < now,
    );

    res.json(overdue);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Помилка отримання прострочених видач",
    });
  }
});

// Видати книгу читачеві
router.post("/", async (req, res) => {
  try {
    const { readerId, bookCopyId, dueDate } = req.body;

    if (
      !Number.isInteger(Number(readerId)) ||
      Number(readerId) <= 0 ||
      !Number.isInteger(Number(bookCopyId)) ||
      Number(bookCopyId) <= 0 ||
      !dueDate ||
      Number.isNaN(new Date(dueDate).getTime())
    ) {
      res.status(400).json({ message: "Перевірте дані видачі" });
      return;
    }

    const deadline = new Date(dueDate);

    if (deadline <= new Date()) {
      res.status(400).json({
        message: "Дата повернення має бути в майбутньому",
      });
      return;
    }

    const loan = await db.transaction(async (tx) => {
      const copy = await tx.orm.public.BookCopy
        .where({ id: Number(bookCopyId) })
        .forUpdate()
        .first();

      if (!copy) {
        throw new Error("COPY_NOT_FOUND");
      }

      if (copy.status !== "AVAILABLE") {
        throw new Error("COPY_NOT_AVAILABLE");
      }

      const reader = await tx.orm.public.Reader
        .where({ id: Number(readerId) })
        .first();

      if (!reader) {
        throw new Error("READER_NOT_FOUND");
      }

      const newLoan = await tx.orm.public.Loan.create({
        readerId: Number(readerId),
        bookCopyId: Number(bookCopyId),
        dueDate: deadline,
      });

      await tx.orm.public.BookCopy
        .where({ id: Number(bookCopyId) })
        .update({ status: "BORROWED" });

      return newLoan;
    });

    res.status(201).json({
      message: "Книгу успішно видано",
      loan,
    });
  } catch (error) {
    if (error instanceof Error) {
      const messages: Record<string, string> = {
        COPY_NOT_FOUND: "Примірник не знайдено",
        COPY_NOT_AVAILABLE: "Цей примірник зараз недоступний",
        READER_NOT_FOUND: "Читача не знайдено",
      };

      if (messages[error.message]) {
        res.status(400).json({ message: messages[error.message] });
        return;
      }
    }

    console.error(error);
    res.status(500).json({
      message: "Помилка під час видачі книги",
    });
  }
});

// Повернути книгу
router.post("/:id/return", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: "Некоректний ID видачі" });
      return;
    }

    const result = await db.transaction(async (tx) => {
      const loan = await tx.orm.public.Loan
        .where({ id })
        .forUpdate()
        .first();

      if (!loan) {
        throw new Error("LOAN_NOT_FOUND");
      }

      if (loan.status !== "ACTIVE" && loan.status !== "OVERDUE") {
        throw new Error("LOAN_ALREADY_RETURNED");
      }

      await tx.orm.public.Loan.where({ id }).update({
        status: "RETURNED",
        returnDate: new Date(),
      });

      await tx.orm.public.BookCopy
        .where({ id: loan.bookCopyId })
        .update({ status: "AVAILABLE" });

      return { message: "Книгу успішно повернуто" };
    });

    res.json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "LOAN_NOT_FOUND") {
        res.status(404).json({ message: "Видачу не знайдено" });
        return;
      }

      if (error.message === "LOAN_ALREADY_RETURNED") {
        res.status(400).json({
          message: "Цю книгу вже повернули",
        });
        return;
      }
    }

    console.error(error);
    res.status(500).json({
      message: "Помилка під час повернення книги",
    });
  }
});

export default router;
