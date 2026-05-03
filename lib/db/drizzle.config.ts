import { defineConfig } from "drizzle-kit";
import path from "path";

const url =
  process.env.SUPABASE_DB_URL ??
  (process.env.SUPABASE_DB_PASSWORD
    ? `postgresql://postgres.wtgphatzheodjsqznedg:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
    : process.env.DATABASE_URL);

if (!url) {
  throw new Error("No database URL configured");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: { url },
});
