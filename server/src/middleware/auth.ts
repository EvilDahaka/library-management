import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "LIBRARIAN";
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Потрібна авторизація" });
    return;
  }

  const token = authorization.slice("Bearer ".length);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ message: "JWT_SECRET не налаштовано у файлі .env" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload & {
      userId: number;
      fullName: string;
      email: string;
      role: "ADMIN" | "LIBRARIAN";
    };

    if (!payload.userId || !payload.fullName || !payload.email || !payload.role) {
      res.status(401).json({ message: "Недійсний токен авторизації" });
      return;
    }

    req.user = {
      id: payload.userId,
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch {
    res.status(401).json({ message: "Сеанс завершився. Увійдіть повторно" });
  }
}
