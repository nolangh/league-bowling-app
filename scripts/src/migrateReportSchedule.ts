const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN!;

const PROJECT_REF = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");

async function runSql(query: string) {
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
  if (!res.ok) {
    console.error("SQL error:", JSON.stringify(data));
    process.exit(1);
  }
  return data;
}

async function main() {
  console.log("Adding report_schedule and report_email columns to users table...");

  await runSql(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS report_schedule TEXT
        CHECK (report_schedule IN ('weekly', 'monthly')),
      ADD COLUMN IF NOT EXISTS report_email TEXT,
      ADD COLUMN IF NOT EXISTS last_report_sent_at TIMESTAMPTZ;
  `);

  console.log("Migration complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });
