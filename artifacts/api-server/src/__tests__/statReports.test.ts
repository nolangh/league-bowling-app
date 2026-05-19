import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";
import { supabaseAdmin } from "../lib/supabase";
import * as reportEmail from "../lib/reportEmail";

vi.mock("../middlewares/supabaseAuth", () => ({
  supabaseAuthMiddleware: vi.fn((req: any, _res: any, next: () => void) => {
    req.userId = 1;
    req.authId = "test-auth-uuid-0001";
    next();
  }),
}));

vi.mock("../lib/reportEmail", () => ({
  sendReportEmail: vi.fn(() => Promise.resolve()),
}));

const mockFrom = supabaseAdmin.from as ReturnType<typeof vi.fn>;
const mockSendReportEmail = reportEmail.sendReportEmail as ReturnType<typeof vi.fn>;

const CRON_SECRET = "test-cron-secret-xyz";

beforeEach(() => {
  process.env.CRON_SECRET = CRON_SECRET;
  vi.clearAllMocks();
  mockSendReportEmail.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Dispatch auth guard
// ---------------------------------------------------------------------------

describe("POST /api/stat-reports/dispatch — auth guard", () => {
  it("returns 401 with no Authorization header", async () => {
    const res = await request(app).post("/api/stat-reports/dispatch");
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong CRON_SECRET", async () => {
    const res = await request(app)
      .post("/api/stat-reports/dispatch")
      .set("Authorization", "Bearer wrong-secret");
    expect(res.status).toBe(401);
  });

  it("passes with correct CRON_SECRET and returns metrics when no candidates", async () => {
    mockFrom.mockImplementation(() => {
      const chain: any = {
        select: vi.fn(() => chain),
        eq:     vi.fn(() => chain),
        not:    vi.fn(() => chain),
        update: vi.fn(() => chain),
        order:  vi.fn(() => chain),
        limit:  vi.fn(() => chain),
      };
      chain.then = (fn: (v: { data: never[]; error: null }) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(fn);
      return chain;
    });

    const res = await request(app)
      .post("/api/stat-reports/dispatch")
      .set("Authorization", `Bearer ${CRON_SECRET}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sent).toBe(0);
    expect(typeof res.body.candidates).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// Dispatch does not stamp last_report_sent_at when send fails
// ---------------------------------------------------------------------------

describe("POST /api/stat-reports/dispatch — failure does not stamp timestamp", () => {
  it("increments failed and skips update when sendReportEmail throws", async () => {
    // sendReportEmail throws (e.g. SMTP not configured)
    mockSendReportEmail.mockRejectedValue(new Error("SMTP not configured"));

    // Track update calls
    const updateChain: any = {
      eq:  vi.fn().mockReturnThis(),
      then: (fn: (v: { data: null; error: null }) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(fn),
    };
    const updateFn = vi.fn(() => updateChain);

    // One due candidate returned
    const candidate = {
      id: 42,
      username: "bowler1",
      name: "Bowler One",
      career_avg: 180,
      high_game: 280,
      total_games: 50,
      wins: 20,
      losses: 10,
      bsr: 1300,
      rank: "Amateur",
      report_schedule: "weekly",
      report_email: "bowler1@example.com",
      last_report_sent_at: null,
      auth_id: "auth-uuid-42",
    };

    // games query chain
    const gamesChain: any = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      order:  vi.fn().mockReturnThis(),
      limit:  vi.fn().mockReturnThis(),
      then: (fn: (v: { data: never[]; error: null }) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(fn),
    };

    let fromCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        fromCallCount++;
        if (fromCallCount === 1) {
          // First call: fetch candidates
          const chain: any = {
            select: vi.fn().mockReturnThis(),
            eq:     vi.fn().mockReturnThis(),
            not:    vi.fn().mockReturnThis(),
            update: updateFn,
            then: (fn: (v: { data: typeof candidate[]; error: null }) => unknown) =>
              Promise.resolve({ data: [candidate], error: null }).then(fn),
          };
          return chain;
        }
        // Subsequent users.update — return updateChain
        return { update: updateFn };
      }
      if (table === "games") return gamesChain;
      return {};
    });

    // supabaseAdmin.auth.admin.getUserById
    (supabaseAdmin.auth as any).admin = {
      getUserById: vi.fn().mockResolvedValue({
        data: { user: { email: "bowler1@example.com" } },
      }),
    };

    const res = await request(app)
      .post("/api/stat-reports/dispatch")
      .set("Authorization", `Bearer ${CRON_SECRET}`);

    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(0);
    expect(res.body.failed).toBe(1);
    // The update setting last_report_sent_at must NOT have been called
    expect(updateFn).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GET /api/stat-reports/schedule
// ---------------------------------------------------------------------------

describe("GET /api/stat-reports/schedule", () => {
  it("returns schedule settings for current user", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { report_schedule: "weekly", report_email: "test@example.com", is_pro: true },
        error: null,
      }),
    });

    const res = await request(app).get("/api/stat-reports/schedule");
    expect(res.status).toBe(200);
    expect(res.body.schedule).toBe("weekly");
    expect(res.body.email).toBe("test@example.com");
    expect(res.body.isPro).toBe(true);
  });

  it("returns 404 when user not found", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
    });

    const res = await request(app).get("/api/stat-reports/schedule");
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/stat-reports/schedule
// ---------------------------------------------------------------------------

describe("PATCH /api/stat-reports/schedule", () => {
  it("rejects non-Pro user trying to enable schedule", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { is_pro: false }, error: null }),
    });

    const res = await request(app)
      .patch("/api/stat-reports/schedule")
      .send({ schedule: "weekly" });

    expect(res.status).toBe(403);
  });

  it("allows non-Pro user to turn off schedule", async () => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    chain.single
      .mockResolvedValueOnce({ data: { is_pro: false }, error: null })
      .mockResolvedValueOnce({ data: { report_schedule: null, report_email: null, is_pro: false }, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .patch("/api/stat-reports/schedule")
      .send({ schedule: null });

    expect(res.status).toBe(200);
    expect(res.body.schedule).toBeNull();
  });

  it("allows Pro user to enable weekly schedule", async () => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq:     vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    chain.single
      .mockResolvedValueOnce({ data: { is_pro: true }, error: null })
      .mockResolvedValueOnce({ data: { report_schedule: "weekly", report_email: null, is_pro: true }, error: null });
    mockFrom.mockReturnValue(chain);

    const res = await request(app)
      .patch("/api/stat-reports/schedule")
      .send({ schedule: "weekly" });

    expect(res.status).toBe(200);
    expect(res.body.schedule).toBe("weekly");
    expect(res.body.isPro).toBe(true);
  });

  it("rejects invalid schedule value", async () => {
    const res = await request(app)
      .patch("/api/stat-reports/schedule")
      .send({ schedule: "daily" });

    expect(res.status).toBe(400);
  });
});
