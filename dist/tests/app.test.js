var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
let exitMock;
beforeAll(() => {
    // silencia logs
    jest.spyOn(console, "error").mockImplementation(() => { });
    // mock do exit
    exitMock = jest
        .spyOn(process, "exit")
        .mockImplementation((() => { }));
});
afterEach(() => {
    jest.clearAllMocks();
});
afterAll(() => {
    jest.restoreAllMocks();
});
describe("API Endpoints", () => {
    // ✅ /
    it("GET / should return hello world", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield request(app).get("/");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message");
    }));
    // ✅ /healthcheck OK
    it("GET /healthcheck should return ok", () => __awaiter(void 0, void 0, void 0, function* () {
        pool.query.mockResolvedValueOnce({});
        const res = yield request(app).get("/healthcheck");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    }));
    // ❌ /healthcheck FAIL
    it("GET /healthcheck should return unhealthy", () => __awaiter(void 0, void 0, void 0, function* () {
        pool.query.mockRejectedValueOnce(new Error("DB error"));
        const res = yield request(app).get("/healthcheck");
        expect(res.status).toBe(500);
        expect(res.body.status).toBe("unhealthy");
    }));
    // ✅ /database OK
    it("POST /database should insert data", () => __awaiter(void 0, void 0, void 0, function* () {
        pool.query
            .mockResolvedValueOnce({}) // create table
            .mockResolvedValueOnce({
            rows: [{ id: 1, created_at: new Date() }],
        });
        const res = yield request(app).post("/database");
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Data saved successfully");
    }));
    // ❌ /database FAIL
    it("POST /database should fail", () => __awaiter(void 0, void 0, void 0, function* () {
        pool.query.mockRejectedValueOnce(new Error("DB error"));
        const res = yield request(app).post("/database");
        expect(res.status).toBe(500);
        expect(res.body.error).toBeDefined();
    }));
    // 💥 /break
    it("GET /break should trigger exit", () => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield request(app).get("/break");
        expect(res.status).toBe(200);
        // espera o setTimeout
        yield new Promise((resolve) => setTimeout(resolve, 150));
        expect(exitMock).toHaveBeenCalledWith(1);
    }));
});
