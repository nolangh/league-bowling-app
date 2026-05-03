import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { supabaseAdmin } from "../lib/supabase";
import { MOCK_LEAGUE, TEST_USER_ID } from "./testUtils";

vi.mock("../middlewares/supabaseAuth", () => ({
  supabaseAuthMiddleware: vi.fn((req: any, _res: any, next: () => void) => {
    req.userId = TEST_USER_ID;
    req.authId = "test-auth-uuid-0001";
    next();
  }),
}));

describe("Leagues routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/leagues", () => {
    it("returns all leagues with joined status", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [MOCK_LEAGUE], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any);

      const res = await request(app).get("/api/leagues");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Thunder Alley Pro");
      expect(res.body[0].members).toBe(24);
      expect(res.body[0].joined).toBe(false);
    });

    it("marks league as joined when user is a member", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [MOCK_LEAGUE], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: [{ league_id: MOCK_LEAGUE.id }],
            error: null,
          }),
        } as any);

      const res = await request(app).get("/api/leagues");
      expect(res.status).toBe(200);
      expect(res.body[0].joined).toBe(true);
    });

    it("returns camelCase fields", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [MOCK_LEAGUE], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any);

      const res = await request(app).get("/api/leagues");
      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty("avgScore");
      expect(res.body[0]).toHaveProperty("weeklyChallenge");
      expect(res.body[0]).not.toHaveProperty("avg_score");
      expect(res.body[0]).not.toHaveProperty("weekly_challenge");
    });

    it("returns empty array when no leagues exist", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any);

      const res = await request(app).get("/api/leagues");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("returns leagues with correct type and level fields", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [MOCK_LEAGUE], error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        } as any);

      const res = await request(app).get("/api/leagues");
      expect(res.status).toBe(200);
      expect(res.body[0].type).toBe("public");
      expect(res.body[0].level).toBe("ADVANCED");
      expect(res.body[0].avgScore).toBe(215);
    });
  });

  describe("POST /api/leagues/:id/join", () => {
    it("joins a league and increments member count", async () => {
      const updated = { ...MOCK_LEAGUE, members: 25 };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_LEAGUE, error: null }),
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
          single: vi.fn().mockResolvedValue({ data: updated, error: null }),
        } as any);

      const res = await request(app).post("/api/leagues/40/join");
      expect(res.status).toBe(200);
      expect(res.body.joined).toBe(true);
      expect(res.body.members).toBe(25);
    });

    it("is idempotent — joining an already-joined league succeeds", async () => {
      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_LEAGUE, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: 1 }, error: null }),
        } as any);

      const res = await request(app).post("/api/leagues/40/join");
      expect(res.status).toBe(200);
      expect(res.body.joined).toBe(true);
    });

    it("returns 404 when league does not exist", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      } as any);

      const res = await request(app).post("/api/leagues/9999/join");
      expect(res.status).toBe(404);
    });

    it("returns 400 for non-numeric league id", async () => {
      const res = await request(app).post("/api/leagues/badid/join");
      expect(res.status).toBe(400);
    });

    it("returns the correct league name after joining", async () => {
      const updated = { ...MOCK_LEAGUE, members: 25 };

      vi.mocked(supabaseAdmin.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: MOCK_LEAGUE, error: null }),
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
          single: vi.fn().mockResolvedValue({ data: updated, error: null }),
        } as any);

      const res = await request(app).post("/api/leagues/40/join");
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Thunder Alley Pro");
    });
  });
});
