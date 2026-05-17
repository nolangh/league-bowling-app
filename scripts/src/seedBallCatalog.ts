/**
 * Creates the ball_catalog table via the Supabase Management API (DDL can't go
 * through PostgREST) then seeds it with ~130 popular bowling balls.
 * Run: pnpm --filter @workspace/scripts run seed:ball-catalog
 */

const PROJECT_REF = "wtgphatzheodjsqznedg";
const MGMT_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL ?? `https://${PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!ACCESS_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN is required");
  process.exit(1);
}

async function runSql(query: string) {
  const res = await fetch(MGMT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL failed (${res.status}): ${text}`);
  }
  return res.json();
}

function esc(s: string | null): string {
  if (s === null) return "NULL";
  return `'${s.replace(/'/g, "''")}'`;
}

async function upsertBalls(balls: BallRecord[]) {
  // Use the Management API for inserts so we don't depend on the
  // PostgREST schema cache (which can lag after DDL).
  const rows = balls
    .map(
      (b) =>
        `(${esc(b.brand)},${esc(b.model)},${esc(b.coverstock_type)},${esc(b.coverstock_name)},` +
        `${esc(b.core_name)},${esc(b.core_type)},${esc(b.default_surface)},${b.min_weight},${b.max_weight})`
    )
    .join(",\n  ");

  await runSql(`
    INSERT INTO ball_catalog
      (brand, model, coverstock_type, coverstock_name, core_name, core_type, default_surface, min_weight, max_weight)
    VALUES
      ${rows}
    ON CONFLICT (brand, model) DO UPDATE SET
      coverstock_type  = EXCLUDED.coverstock_type,
      coverstock_name  = EXCLUDED.coverstock_name,
      core_name        = EXCLUDED.core_name,
      core_type        = EXCLUDED.core_type,
      default_surface  = EXCLUDED.default_surface,
      min_weight       = EXCLUDED.min_weight,
      max_weight       = EXCLUDED.max_weight;
  `);
}

type BallRecord = {
  brand: string;
  model: string;
  coverstock_type: string;
  coverstock_name: string | null;
  core_name: string | null;
  core_type: string;
  default_surface: string | null;
  min_weight: number;
  max_weight: number;
};

const BALLS: BallRecord[] = [
  // ── STORM ──────────────────────────────────────────────────────────────────
  { brand: "Storm", model: "Proton Physix", coverstock_type: "Solid Reactive", coverstock_name: "Quantum EV-NE", core_name: "Ergo", core_type: "Asymmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Phaze II", coverstock_type: "Pearl Reactive", coverstock_name: "TX-16 Pearl", core_name: "Velocity", core_type: "Asymmetric", default_surface: "3000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Phaze III", coverstock_type: "Hybrid Reactive", coverstock_name: "TX-16", core_name: "Velocity", core_type: "Asymmetric", default_surface: "2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Phaze 4", coverstock_type: "Pearl Reactive", coverstock_name: "NRG-P2", core_name: "Velocity+", core_type: "Asymmetric", default_surface: "4000 LSS", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Nova", coverstock_type: "Pearl Reactive", coverstock_name: "R2S Pearl Reactive", core_name: "Progression ELC", core_type: "Asymmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Hy-Road", coverstock_type: "Solid Reactive", coverstock_name: "R2S Solid", core_name: "Traction Differential", core_type: "Asymmetric", default_surface: "1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Hy-Road Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "R2S Pearl", core_name: "Traction Differential", core_type: "Asymmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Hy-Road X", coverstock_type: "Hybrid Reactive", coverstock_name: "R2X Hybrid", core_name: "Traction Differential", core_type: "Asymmetric", default_surface: "2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Crux Prime", coverstock_type: "Pearl Reactive", coverstock_name: "TX-16 Pearl Reactive", core_name: "Ergo", core_type: "Asymmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Marvel Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "R2S Pearl", core_name: "Downton ELC", core_type: "Asymmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Alpha Physix", coverstock_type: "Hybrid Reactive", coverstock_name: "NRG Hybrid", core_name: "Ergo+", core_type: "Asymmetric", default_surface: "500/2000/4000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Electrify Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "MX-Pearl", core_name: "Origin", core_type: "Symmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Spectre", coverstock_type: "Hybrid Reactive", coverstock_name: "R3X Hybrid", core_name: "Spectre", core_type: "Symmetric", default_surface: "2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Match Up Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "MX-Pearl Reactive", core_name: "RAD4", core_type: "Symmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Axiom Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "TX-16 Pearl", core_name: "Axiom", core_type: "Asymmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Physix", coverstock_type: "Hybrid Reactive", coverstock_name: "NeX Solid", core_name: "Ergo+", core_type: "Asymmetric", default_surface: "500/2000/4000 Abralon", min_weight: 12, max_weight: 16 },

  // ── ROTO GRIP ──────────────────────────────────────────────────────────────
  { brand: "Roto Grip", model: "Hustle HYB", coverstock_type: "Hybrid Reactive", coverstock_name: "MicroTrax-S18", core_name: "Hustle", core_type: "Symmetric", default_surface: "2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "Hustle INK", coverstock_type: "Solid Reactive", coverstock_name: "MicroTrax-S18 Solid", core_name: "Hustle", core_type: "Symmetric", default_surface: "1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "Hustle PBR", coverstock_type: "Pearl Reactive", coverstock_name: "MicroTrax-P18 Pearl", core_name: "Hustle", core_type: "Symmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "Idol", coverstock_type: "Solid Reactive", coverstock_name: "MicroTrax-S18 Solid", core_name: "Ikon", core_type: "Symmetric", default_surface: "1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "Idol Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "MicroTrax-P18 Pearl", core_name: "Ikon", core_type: "Symmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "Idol Synergy", coverstock_type: "Hybrid Reactive", coverstock_name: "MicroTrax-S18 Hybrid", core_name: "Ikon", core_type: "Symmetric", default_surface: "2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "UFO Alert", coverstock_type: "Pearl Reactive", coverstock_name: "eTrax-P18 Pearl", core_name: "Nucleus", core_type: "Asymmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "RST X-1", coverstock_type: "Solid Reactive", coverstock_name: "eTrax-S18 Solid", core_name: "Nucleus", core_type: "Asymmetric", default_surface: "500/1500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "Hyper Cell Fused", coverstock_type: "Solid Reactive", coverstock_name: "eTrax-S18 Solid", core_name: "Hyper Cell", core_type: "Asymmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "Gem", coverstock_type: "Pearl Reactive", coverstock_name: "MicroTrax-P18 Pearl", core_name: "eCorce", core_type: "Symmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "Exotic Cell", coverstock_type: "Hybrid Reactive", coverstock_name: "eTrax-S18 Hybrid", core_name: "Nucleus", core_type: "Asymmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "Halo", coverstock_type: "Pearl Reactive", coverstock_name: "eTrax-P18 Pearl", core_name: "Nucleus", core_type: "Asymmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },

  // ── HAMMER ─────────────────────────────────────────────────────────────────
  { brand: "Hammer", model: "Black Widow 3.0", coverstock_type: "Solid Reactive", coverstock_name: "Gas Mask Solid", core_name: "Gas Mask", core_type: "Asymmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Black Widow 2.0 Ghost", coverstock_type: "Pearl Reactive", coverstock_name: "Aggression Pearl CFI", core_name: "Gas Mask", core_type: "Asymmetric", default_surface: "Smooth", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Black Widow Vibe", coverstock_type: "Pearl Reactive", coverstock_name: "Aggression HFT Pearl CFI", core_name: "Gas Mask", core_type: "Asymmetric", default_surface: "Smooth", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Scandal", coverstock_type: "Solid Reactive", coverstock_name: "Semtex HFT Solid CFI", core_name: "Scandal", core_type: "Asymmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Scandal S", coverstock_type: "Hybrid Reactive", coverstock_name: "Semtex HFT Hybrid CFI", core_name: "Scandal", core_type: "Asymmetric", default_surface: "1000/1500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Gauntlet Fever", coverstock_type: "Hybrid Reactive", coverstock_name: "Semtex CFI Hybrid", core_name: "Gauntlet", core_type: "Asymmetric", default_surface: "1000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Obsession", coverstock_type: "Solid Reactive", coverstock_name: "Semtex HFT Solid CFI", core_name: "Obsession", core_type: "Asymmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Web", coverstock_type: "Solid Reactive", coverstock_name: "Aggression Solid CFI", core_name: "Web", core_type: "Symmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Web Tour", coverstock_type: "Hybrid Reactive", coverstock_name: "Aggression CFI Hybrid", core_name: "Web", core_type: "Symmetric", default_surface: "1000/1500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Web Tour Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "Aggression Pearl CFI", core_name: "Web", core_type: "Symmetric", default_surface: "Smooth", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Diesel Torque", coverstock_type: "Hybrid Reactive", coverstock_name: "Aggression CFI Hybrid", core_name: "Diesel", core_type: "Asymmetric", default_surface: "1000/1500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Widow Nomad", coverstock_type: "Hybrid Reactive", coverstock_name: "Aggression CFI Hybrid", core_name: "Gas Mask", core_type: "Asymmetric", default_surface: "1000/1500/2000 Abralon", min_weight: 12, max_weight: 16 },

  // ── BRUNSWICK ──────────────────────────────────────────────────────────────
  { brand: "Brunswick", model: "Quantum Cobalt", coverstock_type: "Solid Reactive", coverstock_name: "Quantum EV-NE", core_name: "Quantum", core_type: "Symmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Brunswick", model: "Quantum EVO", coverstock_type: "Hybrid Reactive", coverstock_name: "EVO Hybrid", core_name: "Quantum", core_type: "Symmetric", default_surface: "2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Brunswick", model: "Aura Vision", coverstock_type: "Pearl Reactive", coverstock_name: "Activator+ Pearl", core_name: "Magnitude 035", core_type: "Asymmetric", default_surface: "Factory Polish", min_weight: 12, max_weight: 16 },
  { brand: "Brunswick", model: "Aura Quantum", coverstock_type: "Hybrid Reactive", coverstock_name: "Activator+ Hybrid", core_name: "Magnitude 035", core_type: "Asymmetric", default_surface: "1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Brunswick", model: "Magnitude 035", coverstock_type: "Solid Reactive", coverstock_name: "Magnitude Solid", core_name: "Magnitude 035", core_type: "Asymmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Brunswick", model: "Zenith", coverstock_type: "Solid Reactive", coverstock_name: "Activator+ Solid", core_name: "Zenith", core_type: "Asymmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Brunswick", model: "Zenith Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "Activator+ Pearl", core_name: "Zenith", core_type: "Asymmetric", default_surface: "Factory Polish", min_weight: 12, max_weight: 16 },
  { brand: "Brunswick", model: "Rhino", coverstock_type: "Solid Reactive", coverstock_name: "R-16 Solid", core_name: "Magnitude 035", core_type: "Symmetric", default_surface: "360 Sanded", min_weight: 10, max_weight: 16 },
  { brand: "Brunswick", model: "Twist", coverstock_type: "Pearl Reactive", coverstock_name: "X-Factor Pearl", core_name: "Twist", core_type: "Symmetric", default_surface: "Factory Finish", min_weight: 10, max_weight: 16 },
  { brand: "Brunswick", model: "Prism Solid", coverstock_type: "Solid Reactive", coverstock_name: "Activator+ Solid", core_name: "Magnitude 035", core_type: "Symmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Brunswick", model: "Fuze", coverstock_type: "Hybrid Reactive", coverstock_name: "EVO Hybrid", core_name: "Magnitude 035", core_type: "Asymmetric", default_surface: "1500 Abralon", min_weight: 12, max_weight: 16 },

  // ── MOTIV ──────────────────────────────────────────────────────────────────
  { brand: "Motiv", model: "Forge Fire", coverstock_type: "Solid Reactive", coverstock_name: "Coercion HVX", core_name: "Forge", core_type: "Asymmetric", default_surface: "4000 Grit LSS", min_weight: 12, max_weight: 16 },
  { brand: "Motiv", model: "Forge Ember", coverstock_type: "Pearl Reactive", coverstock_name: "Turmoil MFS Pearl", core_name: "Forge", core_type: "Asymmetric", default_surface: "4000 Grit UHS", min_weight: 12, max_weight: 16 },
  { brand: "Motiv", model: "Trident Nemesis", coverstock_type: "Solid Reactive", coverstock_name: "Coercion HVX", core_name: "Trident", core_type: "Asymmetric", default_surface: "4000 Grit LSS", min_weight: 12, max_weight: 16 },
  { brand: "Motiv", model: "Trident Quest", coverstock_type: "Pearl Reactive", coverstock_name: "Turmoil MFS Pearl", core_name: "Trident", core_type: "Asymmetric", default_surface: "4000 Grit UHS", min_weight: 12, max_weight: 16 },
  { brand: "Motiv", model: "Jackal Legacy", coverstock_type: "Solid Reactive", coverstock_name: "Coercion MXC", core_name: "Jackal", core_type: "Asymmetric", default_surface: "2000 Grit LSS", min_weight: 12, max_weight: 16 },
  { brand: "Motiv", model: "Jackal Ghost", coverstock_type: "Hybrid Reactive", coverstock_name: "Coercion MXHC Hybrid", core_name: "Jackal", core_type: "Asymmetric", default_surface: "2000 Grit LSS", min_weight: 12, max_weight: 16 },
  { brand: "Motiv", model: "Fatal Venom", coverstock_type: "Solid Reactive", coverstock_name: "Coercion XC2 Solid", core_name: "Venom", core_type: "Asymmetric", default_surface: "2000 Grit LSS", min_weight: 12, max_weight: 16 },
  { brand: "Motiv", model: "Venom Shock", coverstock_type: "Pearl Reactive", coverstock_name: "Turmoil Pearl", core_name: "Venom", core_type: "Asymmetric", default_surface: "4000 Grit UHS", min_weight: 12, max_weight: 16 },
  { brand: "Motiv", model: "Hydra", coverstock_type: "Solid Reactive", coverstock_name: "Coercion HV3 Solid", core_name: "Hydra", core_type: "Asymmetric", default_surface: "2000 Grit LSS", min_weight: 12, max_weight: 16 },
  { brand: "Motiv", model: "Sky Raptor", coverstock_type: "Pearl Reactive", coverstock_name: "Turmoil MFS Pearl", core_name: "Raptor", core_type: "Symmetric", default_surface: "4000 Grit UHS", min_weight: 12, max_weight: 16 },
  { brand: "Motiv", model: "Rogue Assassin", coverstock_type: "Solid Reactive", coverstock_name: "Coercion HVX Solid", core_name: "Assassin", core_type: "Asymmetric", default_surface: "2000 Grit LSS", min_weight: 12, max_weight: 16 },

  // ── DV8 ────────────────────────────────────────────────────────────────────
  { brand: "DV8", model: "Pitbull Bite", coverstock_type: "Solid Reactive", coverstock_name: "Semtex HFT Solid", core_name: "Pitbull", core_type: "Asymmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "DV8", model: "Pitbull Lock", coverstock_type: "Hybrid Reactive", coverstock_name: "Semtex CFI Hybrid", core_name: "Pitbull", core_type: "Asymmetric", default_surface: "1000/1500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "DV8", model: "Pitbull Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "Aggression Pearl CFI", core_name: "Pitbull", core_type: "Asymmetric", default_surface: "Smooth", min_weight: 12, max_weight: 16 },
  { brand: "DV8", model: "Marauder Max", coverstock_type: "Solid Reactive", coverstock_name: "Semtex HFT Solid CFI", core_name: "Marauder", core_type: "Asymmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "DV8", model: "Thug", coverstock_type: "Hybrid Reactive", coverstock_name: "Semtex CFI Hybrid", core_name: "Thug", core_type: "Asymmetric", default_surface: "1000/1500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "DV8", model: "Creed Allure", coverstock_type: "Pearl Reactive", coverstock_name: "Aggression Pearl CFI", core_name: "Creed", core_type: "Symmetric", default_surface: "Smooth", min_weight: 12, max_weight: 16 },
  { brand: "DV8", model: "Collision", coverstock_type: "Solid Reactive", coverstock_name: "Semtex CFI Solid", core_name: "Collision", core_type: "Symmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "DV8", model: "Savage Survivor", coverstock_type: "Hybrid Reactive", coverstock_name: "Aggression CFI Hybrid", core_name: "Savage", core_type: "Asymmetric", default_surface: "1000/1500/2000 Abralon", min_weight: 12, max_weight: 16 },

  // ── EBONITE ────────────────────────────────────────────────────────────────
  { brand: "Ebonite", model: "Cyclone", coverstock_type: "Pearl Reactive", coverstock_name: "Nexgen Pearl", core_name: "ChoS2", core_type: "Symmetric", default_surface: "Factory Finish", min_weight: 10, max_weight: 16 },
  { brand: "Ebonite", model: "Cyclone Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "Nexgen Pearl Plus", core_name: "ChoS2", core_type: "Symmetric", default_surface: "Factory Finish", min_weight: 10, max_weight: 16 },
  { brand: "Ebonite", model: "Game Breaker 4", coverstock_type: "Solid Reactive", coverstock_name: "GB 10.0", core_name: "GB 18.0", core_type: "Asymmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Ebonite", model: "Game Breaker 3", coverstock_type: "Hybrid Reactive", coverstock_name: "GB 12.0 Hybrid", core_name: "GB 18.0", core_type: "Asymmetric", default_surface: "1000/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Ebonite", model: "Choice", coverstock_type: "Solid Reactive", coverstock_name: "GB 10.0 Solid", core_name: "ChoS2", core_type: "Symmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Ebonite", model: "Pivot Plus", coverstock_type: "Hybrid Reactive", coverstock_name: "GB 10.0 Hybrid", core_name: "Pivot", core_type: "Asymmetric", default_surface: "1000/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Ebonite", model: "Maverick", coverstock_type: "Solid Reactive", coverstock_name: "GB 14.0 Solid", core_name: "Maverick", core_type: "Asymmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Ebonite", model: "Innovate", coverstock_type: "Pearl Reactive", coverstock_name: "GB 14.0 Pearl", core_name: "Innovate", core_type: "Asymmetric", default_surface: "Factory Polish", min_weight: 12, max_weight: 16 },

  // ── TRACK ──────────────────────────────────────────────────────────────────
  { brand: "Track", model: "A10 Solid", coverstock_type: "Solid Reactive", coverstock_name: "Activator+ Solid", core_name: "A-Gravity", core_type: "Asymmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Track", model: "A10 Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "Activator+ Pearl", core_name: "A-Gravity", core_type: "Asymmetric", default_surface: "Factory Polish", min_weight: 12, max_weight: 16 },
  { brand: "Track", model: "300C", coverstock_type: "Solid Reactive", coverstock_name: "Activator+ Hybrid", core_name: "300C", core_type: "Symmetric", default_surface: "1000/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Track", model: "Alias", coverstock_type: "Pearl Reactive", coverstock_name: "Activator+ Pearl", core_name: "Alias", core_type: "Asymmetric", default_surface: "Factory Polish", min_weight: 12, max_weight: 16 },
  { brand: "Track", model: "Frenzy", coverstock_type: "Pearl Reactive", coverstock_name: "MicroTrax-P18 Pearl", core_name: "Frenzy", core_type: "Symmetric", default_surface: "Reacta Gloss", min_weight: 10, max_weight: 16 },

  // ── COLUMBIA 300 ───────────────────────────────────────────────────────────
  { brand: "Columbia 300", model: "Messenger", coverstock_type: "Solid Reactive", coverstock_name: "Messenger Solid", core_name: "Messenger", core_type: "Asymmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Columbia 300", model: "Messenger Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "Messenger Pearl", core_name: "Messenger", core_type: "Asymmetric", default_surface: "Smooth", min_weight: 12, max_weight: 16 },
  { brand: "Columbia 300", model: "Authority Solid", coverstock_type: "Solid Reactive", coverstock_name: "Authority Solid", core_name: "Authority", core_type: "Symmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Columbia 300", model: "Nitrous", coverstock_type: "Hybrid Reactive", coverstock_name: "Nitrous Hybrid", core_name: "Nitrous", core_type: "Asymmetric", default_surface: "1000/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Columbia 300", model: "Beast", coverstock_type: "Pearl Reactive", coverstock_name: "Beast Pearl", core_name: "Beast", core_type: "Symmetric", default_surface: "Smooth", min_weight: 10, max_weight: 16 },
  { brand: "Columbia 300", model: "White Dot", coverstock_type: "Plastic", coverstock_name: "Polyester", core_name: "White Dot", core_type: "Symmetric", default_surface: "Factory Finish", min_weight: 6, max_weight: 16 },

  // ── 900 GLOBAL ─────────────────────────────────────────────────────────────
  { brand: "900 Global", model: "Zen", coverstock_type: "Solid Reactive", coverstock_name: "HK22 Solid", core_name: "Meditate", core_type: "Symmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "900 Global", model: "Zen Soul", coverstock_type: "Pearl Reactive", coverstock_name: "HK22 Pearl", core_name: "Meditate", core_type: "Symmetric", default_surface: "Smooth", min_weight: 12, max_weight: 16 },
  { brand: "900 Global", model: "Dream On", coverstock_type: "Pearl Reactive", coverstock_name: "R2X Pearl", core_name: "Dreamforce", core_type: "Asymmetric", default_surface: "4000 LSS", min_weight: 12, max_weight: 16 },
  { brand: "900 Global", model: "Wolverine", coverstock_type: "Hybrid Reactive", coverstock_name: "EVO Hybrid", core_name: "Wolverine", core_type: "Asymmetric", default_surface: "2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "900 Global", model: "Boost", coverstock_type: "Hybrid Reactive", coverstock_name: "HK22 Hybrid", core_name: "Boost", core_type: "Symmetric", default_surface: "1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "900 Global", model: "Sure Thing", coverstock_type: "Solid Reactive", coverstock_name: "HK22 Solid", core_name: "Sure Thing", core_type: "Symmetric", default_surface: "1000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "900 Global", model: "Reality", coverstock_type: "Solid Reactive", coverstock_name: "R2X Solid", core_name: "Reality", core_type: "Asymmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },

  // ── GLOBAL 900 (Radical) ───────────────────────────────────────────────────
  { brand: "Radical", model: "Conspiracy Theory", coverstock_type: "Solid Reactive", coverstock_name: "Conspiracy Solid", core_name: "Conspiracy", core_type: "Asymmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Radical", model: "Squatch", coverstock_type: "Solid Reactive", coverstock_name: "Squatch Solid", core_name: "Squatch", core_type: "Asymmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Radical", model: "Yeti", coverstock_type: "Pearl Reactive", coverstock_name: "Yeti Pearl", core_name: "Yeti", core_type: "Symmetric", default_surface: "Smooth", min_weight: 12, max_weight: 16 },

  // ── LEGEND (bowling ball brands) ───────────────────────────────────────────
  { brand: "Lane #1", model: "Omega Crux", coverstock_type: "Solid Reactive", coverstock_name: "Omega Solid", core_name: "Crux", core_type: "Asymmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Lane #1", model: "Burner", coverstock_type: "Pearl Reactive", coverstock_name: "Fireball Pearl", core_name: "Inferno", core_type: "Symmetric", default_surface: "Smooth", min_weight: 12, max_weight: 16 },

  // ── ABS / QUANTUM (Japanese market) ────────────────────────────────────────
  { brand: "ABS", model: "Punisher", coverstock_type: "Solid Reactive", coverstock_name: "GSV-1", core_name: "Punisher", core_type: "Asymmetric", default_surface: "1000/2000 Abralon", min_weight: 12, max_weight: 16 },

  // ── STORM spare ball ───────────────────────────────────────────────────────
  { brand: "Storm", model: "Hy-Road Nano", coverstock_type: "Solid Reactive", coverstock_name: "R2S Nano", core_name: "Traction Differential", core_type: "Asymmetric", default_surface: "1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Tropical Surge", coverstock_type: "Pearl Reactive", coverstock_name: "Surge Pearl", core_name: "Incline", core_type: "Symmetric", default_surface: "Factory Polish", min_weight: 10, max_weight: 16 },

  // ── Classic / entry-level ──────────────────────────────────────────────────
  { brand: "Storm", model: "Mix", coverstock_type: "Plastic", coverstock_name: "Storm Polyester", core_name: "Incline", core_type: "Symmetric", default_surface: "Factory Finish", min_weight: 6, max_weight: 16 },
  { brand: "Hammer", model: "Staple", coverstock_type: "Plastic", coverstock_name: "Polyester", core_name: "Staple", core_type: "Symmetric", default_surface: "Factory Finish", min_weight: 10, max_weight: 16 },
  { brand: "Motiv", model: "Venom Shock Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "Turmoil Pearl", core_name: "Venom", core_type: "Asymmetric", default_surface: "4000 Grit UHS", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Summit", coverstock_type: "Solid Reactive", coverstock_name: "Summit Solid", core_name: "Gravity", core_type: "Symmetric", default_surface: "1000/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Summit Peak", coverstock_type: "Pearl Reactive", coverstock_name: "Summit Pearl", core_name: "Gravity", core_type: "Symmetric", default_surface: "3000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Roto Grip", model: "Bowling Ball", coverstock_type: "Plastic", coverstock_name: "Polyester", core_name: "Spare", core_type: "Symmetric", default_surface: "Factory Finish", min_weight: 6, max_weight: 16 },

  // ── STORM newer releases ───────────────────────────────────────────────────
  { brand: "Storm", model: "Fate", coverstock_type: "Hybrid Reactive", coverstock_name: "TX-16 Hybrid", core_name: "Velocity", core_type: "Asymmetric", default_surface: "2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Locks", coverstock_type: "Solid Reactive", coverstock_name: "R3X Solid", core_name: "Locks", core_type: "Symmetric", default_surface: "1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Storm", model: "Timeless", coverstock_type: "Pearl Reactive", coverstock_name: "TX-16 Pearl Reactive", core_name: "Timeless", core_type: "Asymmetric", default_surface: "Reacta Gloss", min_weight: 12, max_weight: 16 },

  // ── MOTIV newer releases ───────────────────────────────────────────────────
  { brand: "Motiv", model: "Primal Rage", coverstock_type: "Solid Reactive", coverstock_name: "Coercion HVX Solid", core_name: "Raptor", core_type: "Asymmetric", default_surface: "4000 Grit LSS", min_weight: 12, max_weight: 16 },
  { brand: "Motiv", model: "Nuclear Cell", coverstock_type: "Solid Reactive", coverstock_name: "Coercion HVX", core_name: "Nucleus", core_type: "Asymmetric", default_surface: "2000 Grit LSS", min_weight: 12, max_weight: 16 },

  // ── BRUNSWICK newer ────────────────────────────────────────────────────────
  { brand: "Brunswick", model: "Fuze Solid", coverstock_type: "Solid Reactive", coverstock_name: "Activator+ Solid", core_name: "Fuze", core_type: "Asymmetric", default_surface: "500/2000 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Brunswick", model: "Veritas Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "Activator+ Pearl", core_name: "Magnitude 035", core_type: "Asymmetric", default_surface: "Factory Polish", min_weight: 12, max_weight: 16 },

  // ── HAMMER newer ───────────────────────────────────────────────────────────
  { brand: "Hammer", model: "Arson XT", coverstock_type: "Solid Reactive", coverstock_name: "Arson Solid CFI", core_name: "Arson", core_type: "Asymmetric", default_surface: "500/1000/1500 Abralon", min_weight: 12, max_weight: 16 },
  { brand: "Hammer", model: "Arson Pearl", coverstock_type: "Pearl Reactive", coverstock_name: "Aggression Pearl CFI", core_name: "Arson", core_type: "Asymmetric", default_surface: "Smooth", min_weight: 12, max_weight: 16 },
];

async function main() {
  console.log("Creating ball_catalog table...");
  await runSql(`
    CREATE TABLE IF NOT EXISTS ball_catalog (
      id SERIAL PRIMARY KEY,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      coverstock_type TEXT,
      coverstock_name TEXT,
      core_name TEXT,
      core_type TEXT,
      default_surface TEXT,
      min_weight INTEGER NOT NULL DEFAULT 12,
      max_weight INTEGER NOT NULL DEFAULT 16,
      UNIQUE(brand, model)
    );

    ALTER TABLE ball_catalog ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ball_catalog' AND policyname = 'ball_catalog_public_read'
      ) THEN
        CREATE POLICY ball_catalog_public_read ON ball_catalog FOR SELECT USING (true);
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS idx_ball_catalog_brand ON ball_catalog(lower(brand));
    CREATE INDEX IF NOT EXISTS idx_ball_catalog_model ON ball_catalog(lower(model));
  `);
  console.log("Table ready.");

  console.log(`Seeding ${BALLS.length} balls...`);
  await upsertBalls(BALLS);
  console.log("Done.");
}

main().catch((e) => { console.error(e); process.exit(1); });
