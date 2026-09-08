import request from "supertest";
import app from "../app";

// ✅ MOCK DO BANCO
jest.mock("pg", () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

const { Pool } = require("pg");
const pool = new Pool();

// ✅ MOCK process.exit
let exitMock: jest.SpyInstance;

beforeAll(() => {
  // silencia logs
  jest.spyOn(console, "error").mockImplementation(() => {});

  // mock do exit
  exitMock = jest
    .spyOn(process, "exit")
    .mockImplementation((() => {}) as any);
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe("API Endpoints", () => {
  // ✅ /
  it("GET / should return hello world", async () => {
    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  // ✅ /healthcheck OK
  it("GET /healthcheck should return ok", async () => {
    pool.query.mockResolvedValueOnce({});

    const res = await request(app).get("/healthcheck");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  // ❌ /healthcheck FAIL
  // it("GET /healthcheck should return unhealthy", async () => {
  //   pool.query.mockRejectedValueOnce(new Error("DB error"));

  //   const res = await request(app).get("/healthcheck");

  //   expect(res.status).toBe(500);
  //   expect(res.body.status).toBe("unhealthy");
  // });

  // ✅ /database OK
  it("POST /database should insert data", async () => {
    pool.query
      .mockResolvedValueOnce({}) // create table
      .mockResolvedValueOnce({
        rows: [{ id: 1, created_at: new Date() }],
      });

    const res = await request(app).post("/database");

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Data saved successfully");
  });

  // ❌ /database FAIL
  it("POST /database should fail", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).post("/database");

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });

  // 💥 /break
  it("GET /break should trigger exit", async () => {
    const res = await request(app).get("/break");

    expect(res.status).toBe(200);

    // espera o setTimeout
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(exitMock).toHaveBeenCalledWith(1);
  });
});

  // ✅ /compound-interest OK
  it("POST /compound-interest should calculate correctly", async () => {
    const res = await request(app)
      .post("/compound-interest")
      .send({
        initialAmount: 1000,
        monthlyContribution: 500,
        interestRate: 12,
        years: 10,
      });

    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty("totalInvested");
    expect(res.body).toHaveProperty("totalInterest");
    expect(res.body).toHaveProperty("finalAmount");

    expect(res.body.finalAmount).toBeGreaterThan(
      res.body.totalInvested
    );
  });

  // ❌ /compound-interest FAIL
  it("POST /compound-interest should fail", async () => {

    // força erro proposital
    const originalToFixed = Number.prototype.toFixed;

    jest
      .spyOn(Number.prototype, "toFixed")
      .mockImplementation(() => {
        throw new Error("calculation error");
      });

    const res = await request(app)
      .post("/compound-interest")
      .send({
        initialAmount: 1000,
        monthlyContribution: 500,
        interestRate: 12,
        years: 10,
      });

    expect(res.status).toBe(500);

    expect(res.body.error).toBe(
      "Failed to calculate compound interest"
    );

    Number.prototype.toFixed = originalToFixed;
  });

  // ✅ /save-simulation OK
  it("POST /save-simulation should save simulation", async () => {

    pool.query
      .mockResolvedValueOnce({}) // create table
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: "Retirement",
          },
        ],
      });

    const res = await request(app)
      .post("/save-simulation")
      .send({
        name: "Retirement",
        initialAmount: 1000,
        monthlyContribution: 500,
        interestRate: 12,
        years: 10,
        totalInvested: 61000,
        totalInterest: 55000,
        finalAmount: 116000,
      });

    expect(res.status).toBe(201);

    expect(res.body.message).toBe(
      "Simulation saved successfully"
    );

    expect(res.body.data.name).toBe("Retirement");
  });

  // ❌ /save-simulation FAIL
  it("POST /save-simulation should fail", async () => {

    pool.query.mockRejectedValueOnce(
      new Error("DB error")
    );

    const res = await request(app)
      .post("/save-simulation")
      .send({
        name: "Retirement",
      });

    expect(res.status).toBe(500);

    expect(res.body.error).toBe(
      "Failed to save simulation"
    );
  });