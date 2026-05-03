import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { supabaseAdmin } from "../lib/supabase";
import { MOCK_USER, MOCK_GAME, TEST_USER_ID } from "./testUtils";

vi.mock("../middlewares/supabaseAuth", () => ({
  supabaseAuthMiddleware: vi.fn((req: any, _res: any, next: () => void) => {
    req.userId = TEST_USER_ID;
    req.authId = "test-auth-uuid-0001";
    next();
  }),
}));

describe("Games routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/games", () => {
    it("returns list of games for the current user", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [MOCK_GAME], error: null }),
      } as any);

      const res = await request(app).get("/api/games");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].score).toBe(245);
      expect(res.body[0].alley).toBe("Thunder Lanes");
    });

    it("returns camelCase field names", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [MOCK_GAME], error: null }),
      } as any);

      const res = await request(app).get("/api/games");
      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty("oilPattern");
      expect(res.body[0]).toHaveProperty("ballUsed");
      expect(res.body[0]).not.toHaveProperty("oil_pattern");
      expect(res.body[0]).not.toHaveProperty("ball_used");
    });

    it("returns an empty array when user has no games", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const res = await request(app).get("/api/games");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns 500 on database error", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      } as any);

      const res = await request(app).get("/api/games");
      expect(res.status).toBe(500);
    });
  });

  describe("POST /api/games", () => {
    const validGamePayload = {
      score: 245,
      date: "2024-06-15",
      alley: "Thunder Lanes",
      oilPattern: "House Shot",
      ballUsed: "Storm Hy-Road",
      notes: "Good game",
      verified: false,
    };

    it("creates a new game and returns it", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_GAME, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [{ score: 245 }], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_USER, error: null }),
        } as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);

      const res = await request(app).post("/api/games").send(validGamePayload);
      expect(res.status).toBe(201);
      expect(res.body.score).toBe(245);
      expect(res.body.alley).toBe("Thunder Lanes");
    });

    it("returns 400 when score is missing", async () => {
      const res = await request(app)
        .post("/api/games")
        .send({ date: "2024-06-15", alley: "Lanes" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when score is out of range (>300)", async () => {
      const res = await request(app)
        .post("/api/games")
        .send({ ...validGamePayload, score: 301 });
      expect(res.status).toBe(400);
    });

    it("returns 400 when score is negative", async () => {
      const res = await request(app)
        .post("/api/games")
        .send({ ...validGamePayload, score: -1 });
      expect(res.status).toBe(400);
    });

    it("returns 400 when date is missing", async () => {
      const res = await request(app)
        .post("/api/games")
        .send({ score: 200, alley: "Lanes" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when body is empty", async () => {
      const res = await request(app).post("/api/games").send({});
      expect(res.status).toBe(400);
    });

    it("accepts a perfect game score of 300", async () => {
      const perfectGame = { ...MOCK_GAME, score: 300 };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: perfectGame, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [{ score: 300 }], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_USER, error: null }),
        } as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);

      const res = await request(app)
        .post("/api/games")
        .send({ ...validGamePayload, score: 300 });
      expect(res.status).toBe(201);
      expect(res.body.score).toBe(300);
    });
  });
});
