import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { supabaseAuthMiddleware } from "../middlewares/supabaseAuth";
import { supabaseAdmin } from "../lib/supabase";
import { MOCK_USER, TEST_AUTH_ID } from "./testUtils";

describe("supabaseAuthMiddleware", () => {
  let miniApp: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    miniApp = express();
    miniApp.use(express.json());
    miniApp.use(supabaseAuthMiddleware);
    miniApp.get("/test", (req, res) => {
      res.json({ userId: req.userId, authId: req.authId });
    });
  });

  it("returns 401 when no Authorization header", async () => {
    const res = await request(miniApp).get("/test");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing authorization header");
  });

  it("returns 401 when Authorization header is not Bearer", async () => {
    const res = await request(miniApp)
      .get("/test")
      .set("Authorization", "Basic sometoken");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Missing authorization header");
  });

  it("returns 401 when token is invalid", async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
      data: { user: null } as any,
      error: { message: "Invalid token" } as any,
    });

    const res = await request(miniApp)
      .get("/test")
      .set("Authorization", "Bearer bad-token");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid or expired token");
  });

  it("attaches userId and authId when token is valid and user exists", async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: TEST_AUTH_ID, email: "test@league.app", user_metadata: {} } } as any,
      error: null,
    });

    const fromMock = vi.mocked(supabaseAdmin.from);
    fromMock.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: 42 }, error: null }),
    } as any);

    const res = await request(miniApp)
      .get("/test")
      .set("Authorization", "Bearer valid-token");
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(42);
    expect(res.body.authId).toBe(TEST_AUTH_ID);
  });

  it("auto-creates user on first login when user row does not exist", async () => {
    vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValueOnce({
      data: { user: { id: TEST_AUTH_ID, email: "newbowler@example.com", user_metadata: {} } } as any,
      error: null,
    });

    const fromMock = vi.mocked(supabaseAdmin.from);

    fromMock.mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as any);

    fromMock.mockReturnValueOnce({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 99 }, error: null }),
    } as any);

    const res = await request(miniApp)
      .get("/test")
      .set("Authorization", "Bearer valid-token");
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(99);
  });

  it("skips auth check for /healthz route", async () => {
    const healthApp = express();
    healthApp.use(supabaseAuthMiddleware);
    healthApp.get("/healthz", (_req, res) => res.json({ ok: true }));

    const res = await request(healthApp).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
