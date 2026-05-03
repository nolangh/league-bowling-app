import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../middlewares/supabaseAuth", () => ({
  supabaseAuthMiddleware: vi.fn((req: any, _res: any, next: () => void) => {
    req.userId = 1;
    req.authId = "test-auth-uuid-0001";
    next();
  }),
}));

describe("GET /api/healthz", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("returns JSON content-type", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  it("returns 404 for unknown api routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
  });
});
