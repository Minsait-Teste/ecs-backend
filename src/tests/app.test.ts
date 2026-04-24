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
  it("GET /healthcheck should return unhealthy", async () => {
    pool.query.mockRejectedValueOnce(new Error("DB error"));

    const res = await request(app).get("/healthcheck");

    expect(res.status).toBe(500);
    expect(res.body.status).toBe("unhealthy");
  });

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