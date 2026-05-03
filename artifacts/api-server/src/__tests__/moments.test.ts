import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { supabaseAdmin } from "../lib/supabase";
import { MOCK_USER, MOCK_MOMENT } from "./testUtils";

vi.mock("../middlewares/supabaseAuth", () => ({
  supabaseAuthMiddleware: vi.fn((req: any, _res: any, next: () => void) => {
    req.userId = 1;
    req.authId = "test-auth-uuid-0001";
    next();
  }),
}));

describe("Moments routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/moments", () => {
    it("returns the social feed with liked status", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [MOCK_MOMENT], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);

      const res = await request(app).get("/api/moments");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].username).toBe("KING_PINS");
      expect(res.body[0].content).toBe("Shot a 289 tonight!");
      expect(res.body[0].score).toBe(289);
      expect(res.body[0].liked).toBe(false);
    });

    it("shows liked=true when current user has liked the moment", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [MOCK_MOMENT], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        } as any);

      const res = await request(app).get("/api/moments");
      expect(res.status).toBe(200);
      expect(res.body[0].liked).toBe(true);
    });

    it("includes timeAgo field", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [MOCK_MOMENT], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);

      const res = await request(app).get("/api/moments");
      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty("timeAgo");
    });

    it("returns camelCase fields", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [MOCK_MOMENT], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);

      const res = await request(app).get("/api/moments");
      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty("rankColor");
      expect(res.body[0]).toHaveProperty("avatarColor");
      expect(res.body[0]).not.toHaveProperty("rank_color");
      expect(res.body[0]).not.toHaveProperty("avatar_color");
    });

    it("returns empty array when no moments exist", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      } as any);

      const res = await request(app).get("/api/moments");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("POST /api/moments", () => {
    it("creates a new moment post", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_USER, error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_MOMENT, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);

      const res = await request(app)
        .post("/api/moments")
        .send({ content: "Shot a 289 tonight!", type: "game", score: 289 });
      expect(res.status).toBe(201);
      expect(res.body.content).toBe("Shot a 289 tonight!");
    });

    it("creates a moment without score", async () => {
      const momentNoScore = { ...MOCK_MOMENT, score: null };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_USER, error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: momentNoScore, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);

      const res = await request(app)
        .post("/api/moments")
        .send({ content: "General advice about bowling.", type: "advice" });
      expect(res.status).toBe(201);
    });

    it("returns 400 when content is missing", async () => {
      const res = await request(app)
        .post("/api/moments")
        .send({ type: "game" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when type is missing", async () => {
      const res = await request(app)
        .post("/api/moments")
        .send({ content: "Some content" });
      expect(res.status).toBe(400);
    });

    it("returns 404 when user not found", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      } as any);

      const res = await request(app)
        .post("/api/moments")
        .send({ content: "Test", type: "game" });
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/moments/:id/like", () => {
    it("likes a moment and increments like count", async () => {
      const liked = { ...MOCK_MOMENT, likes: 6 };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_MOMENT, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: liked, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        } as any);

      const res = await request(app).post("/api/moments/30/like");
      expect(res.status).toBe(200);
      expect(res.body.likes).toBe(6);
      expect(res.body.liked).toBe(true);
    });

    it("is idempotent — does not double-like", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_MOMENT, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 99 }, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 99 }, error: null }),
        } as any);

      const res = await request(app).post("/api/moments/30/like");
      expect(res.status).toBe(200);
      expect(res.body.likes).toBe(5);
    });

    it("returns 400 for non-numeric moment id", async () => {
      const res = await request(app).post("/api/moments/abc/like");
      expect(res.status).toBe(400);
    });

    it("returns 404 when moment not found", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      } as any);

      const res = await request(app).post("/api/moments/9999/like");
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/moments/:id/like", () => {
    it("unlikes a moment and decrements like count", async () => {
      const unliked = { ...MOCK_MOMENT, likes: 4 };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_MOMENT, error: null }),
        } as any)
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
        } as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: unliked, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);

      const res = await request(app).delete("/api/moments/30/like");
      expect(res.status).toBe(200);
      expect(res.body.likes).toBe(4);
      expect(res.body.liked).toBe(false);
    });

    it("returns 404 when moment not found", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      } as any);

      const res = await request(app).delete("/api/moments/9999/like");
      expect(res.status).toBe(404);
    });

    it("returns 400 for non-numeric moment id", async () => {
      const res = await request(app).delete("/api/moments/notanid/like");
      expect(res.status).toBe(400);
    });

    it("does not go below zero likes", async () => {
      const zeroLikes = { ...MOCK_MOMENT, likes: 0 };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: zeroLikes, error: null }),
        } as any)
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null }),
        } as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: zeroLikes, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        } as any);

      const res = await request(app).delete("/api/moments/30/like");
      expect(res.status).toBe(200);
      expect(res.body.likes).toBeGreaterThanOrEqual(0);
    });
  });
});
