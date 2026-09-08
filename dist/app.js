var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
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
    ssl: {
        rejectUnauthorized: false
    }
});
/**
 * ENDPOINT /
 * Hello World
 */
app.get("/", (_req, res) => {
    res.json({
        message: "Hello World from ECS backend 🚀",
    });
});
/**
 * ENDPOINT /healthcheck
 * Usado por ALB / ECS Health Check
 */
app.get("/healthcheck", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(200).json({ status: "ok" });
    }
    catch (error) {
        console.error("Healthcheck failed:", error);
        res.status(500).json({ status: "unhealthy" });
    }
}));
// app.get("/healthcheck", async (_req: Request, res: Response) => {
//   try {
//     await pool.query("SELECT 1");
//     res.status(200).json({ status: "ok" });
//   } catch (error) {
//     console.error("Healthcheck failed:", error);
//     res.status(500).json({ status: "unhealthy" });
//   }
// });
/**
 * ENDPOINT /database
 * Insere algo simples no banco
 */
app.post("/database", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield pool.query(`
      CREATE TABLE IF NOT EXISTS test_data (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
        const result = yield pool.query("INSERT INTO test_data DEFAULT VALUES RETURNING id, created_at");
        res.status(201).json({
            message: "Data saved successfully",
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error("Database error:", error);
        res.status(500).json({
            error: "Failed to save data in database",
        });
    }
}));
/**
 * ENDPOINT /break
 * QUEBRA A APLICAÇÃO DE PROPÓSITO 💥
 */
app.get("/break", (_req, res) => {
    res.json({
        message: "Application will crash now 💣",
    });
    // Garante que a resposta foi enviada antes de quebrar
    setTimeout(() => {
        console.error("💥 Application crashed intentionally");
        process.exit(1); // Mata o container
    }, 100);
});
/**
 * ENDPOINT /compound-interest
 * Calcula juros compostos
 */
app.post("/compound-interest", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { initialAmount, monthlyContribution, interestRate, years, } = req.body;
        // Juros mensal
        const monthlyRate = interestRate / 100 / 12;
        // Total de meses
        const months = years * 12;
        let finalAmount = initialAmount;
        for (let i = 0; i < months; i++) {
            finalAmount =
                (finalAmount + monthlyContribution) *
                    (1 + monthlyRate);
        }
        const totalInvested = initialAmount +
            monthlyContribution * months;
        const totalInterest = finalAmount - totalInvested;
        res.json({
            totalInvested: Number(totalInvested.toFixed(2)),
            totalInterest: Number(totalInterest.toFixed(2)),
            finalAmount: Number(finalAmount.toFixed(2)),
        });
    }
    catch (error) {
        console.error("Compound interest error:", error);
        res.status(500).json({
            error: "Failed to calculate compound interest",
        });
    }
}));
/**
 * ENDPOINT /save-simulation TESTE DO CODE QL
 * Salva simulação no banco
 */
app.post("/save-simulation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield pool.query(`
      CREATE TABLE IF NOT EXISTS saved_simulations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        initial_amount NUMERIC NOT NULL,
        monthly_contribution NUMERIC NOT NULL,
        interest_rate NUMERIC NOT NULL,
        years NUMERIC NOT NULL,
        total_invested NUMERIC NOT NULL,
        total_interest NUMERIC NOT NULL,
        final_amount NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
        const { name, initialAmount, monthlyContribution, interestRate, years, totalInvested, totalInterest, finalAmount, } = req.body;
        const result = yield pool.query(`
      INSERT INTO saved_simulations (
        name,
        initial_amount,
        monthly_contribution,
        interest_rate,
        years,
        total_invested,
        total_interest,
        final_amount
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *;
      `, [
            name,
            initialAmount,
            monthlyContribution,
            interestRate,
            years,
            totalInvested,
            totalInterest,
            finalAmount,
        ]);
        res.status(201).json({
            message: "Simulation saved successfully",
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error("Save simulation error:", error);
        res.status(500).json({
            error: "Failed to save simulation",
        });
    }
}));
// Teste de coverage
// app.post("/calc", (req, res) => {
//   const { a, b, op } = req.body;
//   if (op === "sum") {
//     return res.json({ result: a + b });
//   }
//   if (op === "sub") {
//     return res.json({ result: a - b });
//   }
//   if (op === "mul") {
//     return res.json({ result: a * b });
//   }
//   if (op === "div") {
//     if (b === 0) {
//       return res.status(400).json({ error: "division by zero" });
//     }
//     return res.json({ result: a / b });
//   }
//   return res.status(400).json({ error: "invalid operation" });
// });
export default app;
