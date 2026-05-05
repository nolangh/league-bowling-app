const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN!;
const PROJECT_REF = "wtgphatzheodjsqznedg";

async function runSQL(query: string) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function main() {
  console.log("Running schema migration...");

  await runSQL(`
    CREATE TABLE IF NOT EXISTS friends (
      id BIGSERIAL PRIMARY KEY,
      requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      addressee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','blocked')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(requester_id, addressee_id)
    );
  `);
  console.log("✓ friends table");

  await runSQL(`
    CREATE TABLE IF NOT EXISTS comments (
      id BIGSERIAL PRIMARY KEY,
      moment_id BIGINT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      initials TEXT NOT NULL DEFAULT '?',
      avatar_color TEXT NOT NULL DEFAULT '#1a3c2a',
      rank TEXT NOT NULL DEFAULT 'Rookie',
      rank_color TEXT NOT NULL DEFAULT '#a0a0a0',
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✓ comments table");

  await runSQL(`
    CREATE TABLE IF NOT EXISTS save_lists (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✓ save_lists table");

  await runSQL(`
    CREATE TABLE IF NOT EXISTS moment_saves (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      moment_id BIGINT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
      list_id BIGINT REFERENCES save_lists(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, moment_id)
    );
  `);
  console.log("✓ moment_saves table");

  await runSQL(`
    CREATE TABLE IF NOT EXISTS moment_dislikes (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      moment_id BIGINT NOT NULL REFERENCES moments(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, moment_id)
    );
  `);
  console.log("✓ moment_dislikes table");

  await runSQL(`
    ALTER TABLE moments
      ADD COLUMN IF NOT EXISTS dislike_count INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS comment_count INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS save_count INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
  `);
  console.log("✓ moments columns extended");

  await runSQL(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS push_token TEXT,
      ADD COLUMN IF NOT EXISTS friends_count INT NOT NULL DEFAULT 0;
  `);
  console.log("✓ users columns extended");

  await runSQL(`
    CREATE INDEX IF NOT EXISTS idx_friends_requester ON friends(requester_id);
    CREATE INDEX IF NOT EXISTS idx_friends_addressee ON friends(addressee_id);
    CREATE INDEX IF NOT EXISTS idx_comments_moment ON comments(moment_id);
    CREATE INDEX IF NOT EXISTS idx_moment_saves_user ON moment_saves(user_id);
    CREATE INDEX IF NOT EXISTS idx_moment_dislikes_moment ON moment_dislikes(moment_id);
  `);
  console.log("✓ indexes");

  await runSQL(`
    ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
    ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
    ALTER TABLE save_lists ENABLE ROW LEVEL SECURITY;
    ALTER TABLE moment_saves ENABLE ROW LEVEL SECURITY;
    ALTER TABLE moment_dislikes ENABLE ROW LEVEL SECURITY;

    CREATE POLICY IF NOT EXISTS "service_role_all_friends" ON friends FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY IF NOT EXISTS "service_role_all_comments" ON comments FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY IF NOT EXISTS "service_role_all_save_lists" ON save_lists FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY IF NOT EXISTS "service_role_all_moment_saves" ON moment_saves FOR ALL TO service_role USING (true) WITH CHECK (true);
    CREATE POLICY IF NOT EXISTS "service_role_all_moment_dislikes" ON moment_dislikes FOR ALL TO service_role USING (true) WITH CHECK (true);
  `);
  console.log("✓ RLS policies");

  console.log("\n✅ Migration complete!");
}

main().catch((err) => { console.error(err); process.exit(1); });
