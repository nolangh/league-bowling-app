import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { supabaseAdmin } from "../lib/supabase";
import { MOCK_USER, TEST_USER_ID } from "./testUtils";

vi.mock("../middlewares/supabaseAuth", () => ({
  supabaseAuthMiddleware: vi.fn((req: any, _res: any, next: () => void) => {
    req.userId = TEST_USER_ID;
    req.authId = "test-auth-uuid-0001";
    next();
  }),
}));

describe("Users routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/users/me", () => {
    it("returns the current user profile", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: MOCK_USER, error: null }),
      } as any);

      const res = await request(app).get("/api/users/me");
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(TEST_USER_ID);
      expect(res.body.username).toBe("STRIKER_AC");
      expect(res.body.name).toBe("Alex Chen");
      expect(res.body.rank).toBe("Legend");
      expect(res.body.level).toBe(42);
      expect(res.body.xp).toBe(12450);
      expect(res.body.xpToNext).toBe(15000);
      expect(res.body.isPro).toBe(false);
      expect(res.body.careerAvg).toBe(218);
      expect(res.body.highGame).toBe(278);
      expect(res.body.totalGames).toBe(12);
      expect(res.body.team).toBe("Strike Force");
      expect(res.body.rating).toBe(1842);
    });

    it("returns 404 when user is not found", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "No rows" } }),
      } as any);

      const res = await request(app).get("/api/users/me");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("User not found");
    });

    it("returns camelCase field names in response", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: MOCK_USER, error: null }),
      } as any);

      const res = await request(app).get("/api/users/me");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("xpToNext");
      expect(res.body).toHaveProperty("isPro");
      expect(res.body).toHaveProperty("careerAvg");
      expect(res.body).toHaveProperty("highGame");
      expect(res.body).toHaveProperty("totalGames");
      expect(res.body).not.toHaveProperty("xp_to_next");
      expect(res.body).not.toHaveProperty("is_pro");
    });
  });

  describe("PATCH /api/users/me", () => {
    it("updates user name", async () => {
      const updated = { ...MOCK_USER, name: "Alex Updated" };
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      } as any);

      const res = await request(app)
        .patch("/api/users/me")
        .send({ name: "Alex Updated" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Alex Updated");
    });

    it("updates isPro flag", async () => {
      const updated = { ...MOCK_USER, is_pro: true };
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      } as any);

      const res = await request(app)
        .patch("/api/users/me")
        .send({ isPro: true });
      expect(res.status).toBe(200);
      expect(res.body.isPro).toBe(true);
    });

    it("updates team name", async () => {
      const updated = { ...MOCK_USER, team: "Bowling Crew" };
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      } as any);

      const res = await request(app)
        .patch("/api/users/me")
        .send({ team: "Bowling Crew" });
      expect(res.status).toBe(200);
      expect(res.body.team).toBe("Bowling Crew");
    });

    it("returns 400 for invalid body (non-boolean isPro)", async () => {
      const res = await request(app)
        .patch("/api/users/me")
        .send({ isPro: "yes-please" });
      expect(res.status).toBe(400);
    });

    it("returns 404 when user not found during update", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      } as any);

      const res = await request(app)
        .patch("/api/users/me")
        .send({ name: "Ghost" });
      expect(res.status).toBe(404);
    });
  });
});
