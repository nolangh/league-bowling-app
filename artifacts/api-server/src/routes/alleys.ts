import { Router, type IRouter } from "express";

const router: IRouter = Router();

const USER_AGENT = "LeagueBowlingApp/1.0 (contact: support@league.app)";

type AlleyResult = {
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  osmId: string;
  distanceKm?: number | null;
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatAddress(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"],
    tags["addr:state"],
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

async function searchNearby(lat: number, lng: number, radiusKm: number): Promise<AlleyResult[]> {
  const radiusM = Math.round(radiusKm * 1000);
  // Overpass: bowling alleys tagged as leisure=bowling_alley or sport=10pin
  const query = `[out:json][timeout:15];
(
  node["leisure"="bowling_alley"](around:${radiusM},${lat},${lng});
  way["leisure"="bowling_alley"](around:${radiusM},${lat},${lng});
  node["sport"="10pin"](around:${radiusM},${lat},${lng});
  way["sport"="10pin"](around:${radiusM},${lat},${lng});
);
out center tags;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass returned ${res.status}`);

  const data = (await res.json()) as {
    elements: Array<{
      type: string;
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };

  const results: AlleyResult[] = [];
  const seen = new Set<string>();

  for (const el of data.elements) {
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat === undefined || elLng === undefined) continue;
    const name = el.tags?.["name"] ?? el.tags?.["operator"] ?? "Bowling Alley";
    const osmId = `${el.type}/${el.id}`;
    if (seen.has(name + osmId)) continue;
    seen.add(name + osmId);
    results.push({
      name,
      address: formatAddress(el.tags),
      lat: elLat,
      lng: elLng,
      osmId,
      distanceKm: Number(haversineKm(lat, lng, elLat, elLng).toFixed(2)),
    });
  }

  results.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  return results.slice(0, 25);
}

async function searchByText(q: string, lat?: number, lng?: number): Promise<AlleyResult[]> {
  const params = new URLSearchParams({
    q: `${q} bowling`,
    format: "json",
    addressdetails: "1",
    limit: "15",
  });
  if (lat !== undefined && lng !== undefined) {
    const delta = 1.0;
    params.set("viewbox", `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`);
    params.set("bounded", "0");
  }

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);

  const data = (await res.json()) as Array<{
    place_id: number;
    osm_type?: string;
    osm_id?: number;
    display_name: string;
    lat: string;
    lon: string;
    name?: string;
    address?: Record<string, string>;
  }>;

  return data.map((p) => {
    const elLat = parseFloat(p.lat);
    const elLng = parseFloat(p.lon);
    const name = p.name ?? p.display_name.split(",")[0];
    const addressParts = [
      p.address?.["house_number"],
      p.address?.["road"],
      p.address?.["city"] ?? p.address?.["town"] ?? p.address?.["village"],
      p.address?.["state"],
    ].filter(Boolean);
    return {
      name,
      address: addressParts.length > 0 ? addressParts.join(" ") : p.display_name,
      lat: elLat,
      lng: elLng,
      osmId: p.osm_type && p.osm_id ? `${p.osm_type}/${p.osm_id}` : `place/${p.place_id}`,
      distanceKm:
        lat !== undefined && lng !== undefined
          ? Number(haversineKm(lat, lng, elLat, elLng).toFixed(2))
          : null,
    };
  });
}

router.get("/alleys/search", async (req, res): Promise<void> => {
  const qRaw = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const q = qRaw.replace(/[^\p{L}\p{N}\s'.,&-]/gu, "");

  let lat: number | undefined;
  let lng: number | undefined;
  if (req.query.lat !== undefined) {
    const v = parseFloat(String(req.query.lat));
    if (!Number.isFinite(v) || v < -90 || v > 90) {
      res.status(400).json({ error: "Invalid lat (must be a number in [-90, 90])" });
      return;
    }
    lat = v;
  }
  if (req.query.lng !== undefined) {
    const v = parseFloat(String(req.query.lng));
    if (!Number.isFinite(v) || v < -180 || v > 180) {
      res.status(400).json({ error: "Invalid lng (must be a number in [-180, 180])" });
      return;
    }
    lng = v;
  }

  if (!q && (lat === undefined || lng === undefined)) {
    res.status(400).json({ error: "Provide either q (text) or lat+lng (nearby)" });
    return;
  }

  try {
    let results: AlleyResult[];
    if (q) {
      results = await searchByText(q, lat, lng);
    } else {
      results = await searchNearby(lat as number, lng as number, 50);
    }
    res.json({ results });
  } catch (err) {
    req.log.error({ err }, "Alley search failed");
    res.status(502).json({ error: "Alley search failed", results: [] });
  }
});

export default router;
