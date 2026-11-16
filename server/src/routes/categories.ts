
import { Router } from "express";
import { db } from "../prisma/db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const categories = await db.orm.public.Category.all();
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Помилка отримання категорій" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      res.status(400).json({ message: "Вкажіть назву категорії" });
      return;
    }

    const category = await db.orm.public.Category.create({
      name: name.trim(),
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося створити категорію. Можливо, така назва вже існує.",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    if (!Number.isInteger(id) || id <= 0 || !name?.trim()) {
      res.status(400).json({ message: "Некоректні дані" });
      return;
    }

    const category = await db.orm.public.Category.where({ id }).update({
      name: name.trim(),
    });

    if (!category) {
      res.status(404).json({ message: "Категорію не знайдено" });
      return;
    }

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Помилка редагування категорії" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: "Некоректний ID" });
      return;
    }

    const category = await db.orm.public.Category.where({ id }).delete();

    if (!category) {
      res.status(404).json({ message: "Категорію не знайдено" });
      return;
    }

    res.json({ message: "Категорію видалено" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося видалити категорію. Можливо, до неї прив'язані книги.",
    });
  }
});

export default router;
