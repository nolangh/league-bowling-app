import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { supabaseAdmin } from "../lib/supabase";
import { MOCK_USER, MOCK_CHALLENGE, TEST_USER_ID } from "./testUtils";

vi.mock("../middlewares/supabaseAuth", () => ({
  supabaseAuthMiddleware: vi.fn((req: any, _res: any, next: () => void) => {
    req.userId = TEST_USER_ID;
    req.authId = "test-auth-uuid-0001";
    next();
  }),
}));

describe("Challenges routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/challenges", () => {
    it("returns open challenges from other users", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [MOCK_CHALLENGE], error: null }),
      } as any);

      const res = await request(app).get("/api/challenges");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].username).toBe("KING_PINS");
      expect(res.body[0].postedScore).toBe(267);
      expect(res.body[0].stake).toBe(50);
      expect(res.body[0].status).toBe("open");
    });

    it("includes timeAgo field in response", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [MOCK_CHALLENGE], error: null }),
      } as any);

      const res = await request(app).get("/api/challenges");
      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty("timeAgo");
      expect(typeof res.body[0].timeAgo).toBe("string");
    });

    it("returns camelCase fields", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [MOCK_CHALLENGE], error: null }),
      } as any);

      const res = await request(app).get("/api/challenges");
      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty("postedScore");
      expect(res.body[0]).toHaveProperty("rankColor");
      expect(res.body[0]).toHaveProperty("avatarColor");
      expect(res.body[0]).toHaveProperty("isPro");
      expect(res.body[0]).not.toHaveProperty("posted_score");
      expect(res.body[0]).not.toHaveProperty("rank_color");
    });

    it("returns empty array when no challenges", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const res = await request(app).get("/api/challenges");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("GET /api/challenges/my", () => {
    it("returns the current user's own challenges", async () => {
      const myChallenge = { ...MOCK_CHALLENGE, user_id: TEST_USER_ID, username: "STRIKER_AC" };

      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [myChallenge], error: null }),
      } as any);

      const res = await request(app).get("/api/challenges/my");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].username).toBe("STRIKER_AC");
    });
  });

  describe("POST /api/challenges", () => {
    it("creates a new challenge for the current user", async () => {
      const newChallenge = {
        ...MOCK_CHALLENGE,
        user_id: TEST_USER_ID,
        username: "STRIKER_AC",
        posted_score: 220,
        stake: 25,
      };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_USER, error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: newChallenge, error: null }),
        } as any);

      const res = await request(app)
        .post("/api/challenges")
        .send({ postedScore: 220, stake: 25 });
      expect(res.status).toBe(201);
      expect(res.body.postedScore).toBe(220);
      expect(res.body.stake).toBe(25);
    });

    it("returns 400 when postedScore is missing", async () => {
      const res = await request(app)
        .post("/api/challenges")
        .send({ stake: 25 });
      expect(res.status).toBe(400);
    });

    it("returns 400 when stake is missing", async () => {
      const res = await request(app)
        .post("/api/challenges")
        .send({ postedScore: 220 });
      expect(res.status).toBe(400);
    });

    it("returns 400 for empty body", async () => {
      const res = await request(app).post("/api/challenges").send({});
      expect(res.status).toBe(400);
    });

    it("returns 404 when user is not found", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      } as any);

      const res = await request(app)
        .post("/api/challenges")
        .send({ postedScore: 220, stake: 25 });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/challenges/:id/accept", () => {
    it("accepts an open challenge and sets status to active", async () => {
      const accepted = { ...MOCK_CHALLENGE, status: "active" };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_CHALLENGE, error: null }),
        } as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: accepted, error: null }),
        } as any);

      const res = await request(app).post("/api/challenges/20/accept");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("active");
    });

    it("returns 400 for non-numeric challenge id", async () => {
      const res = await request(app).post("/api/challenges/abc/accept");
      expect(res.status).toBe(400);
    });

    it("returns 404 when challenge does not exist", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      } as any);

      const res = await request(app).post("/api/challenges/9999/accept");
      expect(res.status).toBe(404);
    });
  });
});
