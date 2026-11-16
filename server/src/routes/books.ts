
import { Router } from "express";
import { db } from "../prisma/db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const books = await db.orm.public.Book.all();
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Помилка отримання книг" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      title,
      isbn,
      publishYear,
      description,
      authorId,
      categoryId,
    } = req.body;

    if (
      !title?.trim() ||
      !Number.isInteger(Number(authorId)) ||
      !Number.isInteger(Number(categoryId))
    ) {
      res.status(400).json({ message: "Перевірте дані книги" });
      return;
    }

    const book = await db.orm.public.Book.create({
      title: title.trim(),
      isbn: isbn || null,
      publishYear: publishYear ? Number(publishYear) : null,
      description: description || null,
      authorId: Number(authorId),
      categoryId: Number(categoryId),
    });

    res.status(201).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Не вдалося додати книгу" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      title,
      isbn,
      publishYear,
      description,
      authorId,
      categoryId,
    } = req.body;

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !title?.trim() ||
      !Number.isInteger(Number(authorId)) ||
      !Number.isInteger(Number(categoryId))
    ) {
      res.status(400).json({ message: "Некоректні дані книги" });
      return;
    }

    const book = await db.orm.public.Book.where({ id }).update({
      title: title.trim(),
      isbn: isbn || null,
      publishYear: publishYear ? Number(publishYear) : null,
      description: description || null,
      authorId: Number(authorId),
      categoryId: Number(categoryId),
    });

    if (!book) {
      res.status(404).json({ message: "Книгу не знайдено" });
      return;
    }

    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Помилка редагування книги" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: "Некоректний ID" });
      return;
    }

    const book = await db.orm.public.Book.where({ id }).delete();

    if (!book) {
      res.status(404).json({ message: "Книгу не знайдено" });
      return;
    }

    res.json({ message: "Книгу видалено" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося видалити книгу. Перевірте наявність примірників.",
    });
  }
});

export default router;
