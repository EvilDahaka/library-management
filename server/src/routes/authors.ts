
import { Router } from "express";
import { db } from "../prisma/db.js";

const router = Router();

// Отримати всіх авторів
router.get("/", async (_req, res) => {
  try {
    const authors = await db.orm.public.Author.all();
    res.json(authors);
  } catch {
    res.status(500).json({ message: "Помилка отримання авторів" });
  }
});

// Додати автора
router.post("/", async (req, res) => {
  try {
    const { fullName, biography } = req.body;

    if (!fullName) {
      res.status(400).json({ message: "Вкажіть ім'я автора" });
      return;
    }

    const author = await db.orm.public.Author.create({
      fullName,
      biography: biography || null,
    });

    res.status(201).json(author);
  } catch {
    res.status(500).json({ message: "Помилка створення автора" });
  }
});

// Редагувати автора
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { fullName, biography } = req.body;

    const author = await db.orm.public.Author
      .where({ id })
      .update({ fullName, biography: biography || null });

    if (!author) {
      res.status(404).json({ message: "Автора не знайдено" });
      return;
    }

    res.json(author);
  } catch {
    res.status(500).json({ message: "Помилка редагування автора" });
  }
});

// Видалити автора
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const author = await db.orm.public.Author
      .where({ id })
      .delete();

    if (!author) {
      res.status(404).json({ message: "Автора не знайдено" });
      return;
    }

    res.json({ message: "Автора видалено" });
  } catch {
    res.status(500).json({
      message: "Не вдалося видалити автора. Можливо, до нього прив'язані книги.",
    });
  }
});

export default router;
