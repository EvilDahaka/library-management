
import { Router } from "express";
import { db } from "../prisma/db.js";

const router = Router();

// Усі примірники
router.get("/", async (_req, res) => {
  try {
    const copies = await db.orm.public.BookCopy.all();
    res.json(copies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Помилка отримання примірників" });
  }
});

// Додати примірник
router.post("/", async (req, res) => {
  try {
    const { inventoryNumber, bookId } = req.body;

    if (!inventoryNumber?.trim() || !Number.isInteger(Number(bookId))) {
      res.status(400).json({ message: "Перевірте інвентарний номер та книгу" });
      return;
    }

    const copy = await db.orm.public.BookCopy.create({
      inventoryNumber: inventoryNumber.trim(),
      bookId: Number(bookId),
    });

    res.status(201).json(copy);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося додати примірник. Перевірте інвентарний номер і книгу.",
    });
  }
});

// Видалити примірник
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: "Некоректний ID" });
      return;
    }

    const copy = await db.orm.public.BookCopy.where({ id }).delete();

    if (!copy) {
      res.status(404).json({ message: "Примірник не знайдено" });
      return;
    }

    res.json({ message: "Примірник видалено" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося видалити примірник. Можливо, він має історію видач.",
    });
  }
});

export default router;
