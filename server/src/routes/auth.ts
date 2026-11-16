import { Router, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../prisma/db.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET не налаштовано у файлі .env");
  }
  return secret;
}

// Чи потрібно створити першого користувача
router.get("/status", async (_req: Request, res: Response) => {
  try {
    const users = await db.orm.public.User.all();
    res.json({ setupRequired: users.length === 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Не вдалося перевірити стан авторизації" });
  }
});

// Одноразове створення першого адміністратора
router.post("/setup", async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body as {
      fullName?: string;
      email?: string;
      password?: string;
    };

    if (!fullName?.trim() || !email?.trim() || !password) {
      res.status(400).json({ message: "Заповніть усі поля" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: "Пароль має містити щонайменше 8 символів" });
      return;
    }

    const users = await db.orm.public.User.all();
    if (users.length > 0) {
      res.status(403).json({ message: "Першого адміністратора вже створено" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.orm.public.User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "ADMIN",
    });

    const token = jwt.sign(
      { userId: user.id, fullName: user.fullName, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: "1d" },
    );

    res.status(201).json({
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Не вдалося створити адміністратора" });
  }
});

// Вхід до системи
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email?.trim() || !password) {
      res.status(400).json({ message: "Введіть email і пароль" });
      return;
    }

    const user = await db.orm.public.User
      .where({ email: email.trim().toLowerCase() })
      .first();

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ message: "Неправильний email або пароль" });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, fullName: user.fullName, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: "1d" },
    );

    res.json({
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Помилка під час входу в систему" });
  }
});

// Перевірка поточного користувача
router.get("/me", authMiddleware, (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: "Необхідно увійти в систему" });
    return;
  }
  res.json({ user: req.user });
});

export default router;
