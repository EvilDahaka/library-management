import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRouter from "./routes/auth.js";
import { authMiddleware } from "./middleware/auth.js";
import authorsRouter from "./routes/authors.js";
import categoriesRouter from "./routes/categories.js";
import readersRouter from "./routes/readers.js";
import booksRouter from "./routes/books.js";
import copiesRouter from "./routes/copies.js";
import loansRouter from "./routes/loans.js";
import statisticsRouter from "./routes/statistics.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Перевірка сервера — доступна без авторизації
app.get("/api/health", (_req, res) => {
  res.json({
    status: "success",
    message: "Library Management API is running!",
  });
});

// Маршрути авторизації: статус, первинне налаштування, вхід
app.use("/api/auth", authRouter);

// Усі маршрути нижче потребують чинного токена
app.use("/api", authMiddleware);

app.use("/api/authors", authorsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/readers", readersRouter);
app.use("/api/books", booksRouter);
app.use("/api/copies", copiesRouter);
app.use("/api/loans", loansRouter);
app.use("/api/statistics", statisticsRouter);

// Невідомі маршрути
app.use((_req, res) => {
  res.status(404).json({ message: "Маршрут не знайдено" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
