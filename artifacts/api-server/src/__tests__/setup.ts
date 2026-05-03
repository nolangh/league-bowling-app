import { vi } from "vitest";

vi.mock("../lib/supabase", () => {
  const supabaseAdmin = {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: { message: "no user" } })
      ),
    },
  };
  return { supabaseAdmin };
});
