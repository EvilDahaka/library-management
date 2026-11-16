
import { Router } from "express";
import { db } from "../prisma/db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const readers = await db.orm.public.Reader.all();
    res.json(readers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Помилка отримання читачів" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { fullName, email, readerType, groupName, phone } = req.body;

    if (!fullName?.trim() || !["STUDENT", "TEACHER"].includes(readerType)) {
      res.status(400).json({ message: "Перевірте дані читача" });
      return;
    }

    const reader = await db.orm.public.Reader.create({
      fullName: fullName.trim(),
      email: email || null,
      readerType,
      groupName: groupName || null,
      phone: phone || null,
    });

    res.status(201).json(reader);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося додати читача. Перевірте електронну пошту.",
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { fullName, email, readerType, groupName, phone } = req.body;

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !fullName?.trim() ||
      !["STUDENT", "TEACHER"].includes(readerType)
    ) {
      res.status(400).json({ message: "Некоректні дані читача" });
      return;
    }

    const reader = await db.orm.public.Reader.where({ id }).update({
      fullName: fullName.trim(),
      email: email || null,
      readerType,
      groupName: groupName || null,
      phone: phone || null,
    });

    if (!reader) {
      res.status(404).json({ message: "Читача не знайдено" });
      return;
    }

    res.json(reader);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Помилка редагування читача" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ message: "Некоректний ID" });
      return;
    }

    const reader = await db.orm.public.Reader.where({ id }).delete();

    if (!reader) {
      res.status(404).json({ message: "Читача не знайдено" });
      return;
    }

    res.json({ message: "Читача видалено" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Не вдалося видалити читача. Можливо, він має записи про видачу книг.",
    });
  }
});

export default router;
