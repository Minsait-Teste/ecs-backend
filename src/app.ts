import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Pool } from "pg";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Configuração do banco (RDS / Postgres)
 * Em produção, tudo vem de ENV
 */

const pool = new Pool({
  host: process.env.DB_HOST,
  // port: Number(process.env.DB_PORT || 5432),
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: false, // em prod pode virar true dependendo da config do RDS
});

/**
 * ENDPOINT /
 * Hello World
 */
app.get("/", (_req: Request, res: Response) => {
  res.json({
    message: "Hello World from ECS backend 🚀",
  });
});

/**
 * ENDPOINT /healthcheck
 * Usado por ALB / ECS Health Check
 */
app.get("/healthcheck", async (_req: Request, res: Response) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Healthcheck failed:", error);
    res.status(500).json({ status: "unhealthy" });
  }
});

/**
 * ENDPOINT /database
 * Insere algo simples no banco
 */
app.post("/database", async (_req: Request, res: Response) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_data (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const result = await pool.query(
      "INSERT INTO test_data DEFAULT VALUES RETURNING id, created_at"
    );

    res.status(201).json({
      message: "Data saved successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({
      error: "Failed to save data in database",
    });
  }
});

/**
 * ENDPOINT /break
 * QUEBRA A APLICAÇÃO DE PROPÓSITO 💥
 * Ideal para testar:
 * - ECS restart
 * - ALB health check
 * - Auto Healing
 */
app.get("/break", (_req: Request, res: Response) => {
  res.json({
    message: "Application will crash now 💣",
  });

  // Garante que a resposta foi enviada antes de quebrar
  setTimeout(() => {
    console.error("💥 Application crashed intentionally");
    process.exit(1); // Mata o container
  }, 100);
});

// Teste de coverage
app.post("/calc", (req, res) => {
  const { a, b, op } = req.body;

  if (op === "sum") {
    return res.json({ result: a + b });
  }

  if (op === "sub") {
    return res.json({ result: a - b });
  }

  if (op === "mul") {
    return res.json({ result: a * b });
  }

  if (op === "div") {
    if (b === 0) {
      return res.status(400).json({ error: "division by zero" });
    }
    return res.json({ result: a / b });
  }

  return res.status(400).json({ error: "invalid operation" });
});

export default app;