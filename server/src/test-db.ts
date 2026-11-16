import { db } from "./prisma/db.js";

try {
  const authors = await db.orm.public.Author.all();
  console.log("Підключення до PostgreSQL успішне!");
  console.log("Авторів у базі:", authors.length);
} catch (error) {
  console.error("Помилка підключення:", error);
} finally {
  await db.close();
}