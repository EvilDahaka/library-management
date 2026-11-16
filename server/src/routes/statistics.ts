
import { Router } from "express";
import { db } from "../prisma/db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [
      books,
      authors,
      categories,
      readers,
      copies,
      loans,
    ] = await Promise.all([
      db.orm.public.Book.all(),
      db.orm.public.Author.all(),
      db.orm.public.Category.all(),
      db.orm.public.Reader.all(),
      db.orm.public.BookCopy.all(),
      db.orm.public.Loan.all(),
    ]);

    const now = new Date();

    const activeLoans = loans.filter(
      (loan) => loan.status === "ACTIVE",
    );

    const overdueLoans = activeLoans.filter(
      (loan) => new Date(loan.dueDate) < now,
    );

    const returnedLoans = loans.filter(
      (loan) => loan.status === "RETURNED",
    );

    const availableCopies = copies.filter(
      (copy) => copy.status === "AVAILABLE",
    );

    const borrowedCopies = copies.filter(
      (copy) => copy.status === "BORROWED",
    );

    res.json({
      books: books.length,
      authors: authors.length,
      categories: categories.length,
      readers: readers.length,
      copies: copies.length,
      availableCopies: availableCopies.length,
      borrowedCopies: borrowedCopies.length,
      activeLoans: activeLoans.length,
      overdueLoans: overdueLoans.length,
      returnedLoans: returnedLoans.length,
    });
  } catch (error) {
    console.error("Statistics error:", error);
    res.status(500).json({
      message: "Не вдалося отримати статистику",
    });
  }
});

export default router;
