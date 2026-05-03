import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("Seeding Supabase...");

  // Seed NPC users (upsert by username)
  const { data: users, error: userErr } = await supabase
    .from("users")
    .upsert([
      { username: "KING_PINS", name: "Marcus Williams", rank: "Kingpin", level: 87, xp: 94200, xp_to_next: 100000, is_pro: true, career_avg: 241, high_game: 300, total_games: 1842, team: "Strike Force", rating: 2341 },
      { username: "SPARE_QUEEN", name: "Jasmine Park", rank: "Legend", level: 63, xp: 45800, xp_to_next: 50000, is_pro: true, career_avg: 228, high_game: 299, total_games: 1203, team: "Solo", rating: 1998 },
      { username: "GUTTER_KING", name: "Tyler Brooks", rank: "Diamond I", level: 41, xp: 28400, xp_to_next: 30000, is_pro: false, career_avg: 198, high_game: 289, total_games: 847, team: "Solo", rating: 1654 },
      { username: "STRIKE_NOVA", name: "Priya Sharma", rank: "Platinum I", level: 52, xp: 38100, xp_to_next: 40000, is_pro: true, career_avg: 215, high_game: 295, total_games: 1024, team: "Nova Crew", rating: 1876 },
      { username: "BOWL_MASTER", name: "Derek Johnson", rank: "Expert", level: 29, xp: 14200, xp_to_next: 20000, is_pro: false, career_avg: 182, high_game: 278, total_games: 512, team: "Solo", rating: 1423 },
    ], { onConflict: "username" })
    .select("id, username");

  if (userErr) { console.error("Users error:", userErr.message); process.exit(1); }
  console.log("Users seeded:", users?.map(u => `${u.id}:${u.username}`).join(", "));

  const byUsername = Object.fromEntries(users!.map(u => [u.username, u.id]));

  // Seed challenges
  const { error: challErr } = await supabase.from("challenges").upsert([
    { user_id: byUsername["KING_PINS"], username: "KING_PINS", rank: "Kingpin", rank_color: "#ff6b35", posted_score: 267, stake: 50, status: "open", initials: "KI", avatar_color: "#3a1a0a", is_pro: true },
    { user_id: byUsername["SPARE_QUEEN"], username: "SPARE_QUEEN", rank: "Legend", rank_color: "#9fe870", posted_score: 245, stake: 25, status: "open", initials: "SP", avatar_color: "#1a3c2a", is_pro: true },
    { user_id: byUsername["GUTTER_KING"], username: "GUTTER_KING", rank: "Diamond I", rank_color: "#60c8ff", posted_score: 231, stake: 100, status: "open", initials: "GU", avatar_color: "#0a1a3a", is_pro: false },
    { user_id: byUsername["STRIKE_NOVA"], username: "STRIKE_NOVA", rank: "Platinum I", rank_color: "#c8a8e8", posted_score: 258, stake: 75, status: "open", initials: "ST", avatar_color: "#2a1a3a", is_pro: true },
    { user_id: byUsername["BOWL_MASTER"], username: "BOWL_MASTER", rank: "Expert", rank_color: "#f5c842", posted_score: 214, stake: 10, status: "open", initials: "BO", avatar_color: "#3a2a0a", is_pro: false },
  ]);
  if (challErr) console.error("Challenges error:", challErr.message);
  else console.log("Challenges seeded");

  // Seed moments
  const { error: momErr } = await supabase.from("moments").upsert([
    { user_id: byUsername["KING_PINS"], username: "KING_PINS", rank: "Kingpin", rank_color: "#ff6b35", content: "Just shot a 300 on the house shot. 12 strikes, zero misses. The lanes were playing perfect tonight!", score: 300, type: "game", likes: 47, comments: 8, initials: "KI", avatar_color: "#3a1a0a" },
    { user_id: byUsername["SPARE_QUEEN"], username: "SPARE_QUEEN", rank: "Legend", rank_color: "#9fe870", content: "Anyone else struggling with the new oil pattern at Sunset Lanes? Tried 4 different balls and still can't find the pocket consistently.", score: null, type: "advice", likes: 23, comments: 12, initials: "SP", avatar_color: "#1a3c2a" },
    { user_id: byUsername["STRIKE_NOVA"], username: "STRIKE_NOVA", rank: "Platinum I", rank_color: "#c8a8e8", content: "Just accepted a $75 challenge against GUTTER_KING. Practicing all week for this. Wish me luck!", score: null, type: "challenge", likes: 31, comments: 6, initials: "ST", avatar_color: "#2a1a3a" },
    { user_id: byUsername["GUTTER_KING"], username: "GUTTER_KING", rank: "Diamond I", rank_color: "#60c8ff", content: "New high game - 289! Left a 7-10 split in the 10th or it would have been 300. So close.", score: 289, type: "game", likes: 58, comments: 14, initials: "GU", avatar_color: "#0a1a3a" },
    { user_id: byUsername["BOWL_MASTER"], username: "BOWL_MASTER", rank: "Expert", rank_color: "#f5c842", content: "Pro tip: on house shots, play the 2nd arrow and let the ball skid through the heads. Works every time for me.", score: null, type: "advice", likes: 19, comments: 9, initials: "BO", avatar_color: "#3a2a0a" },
  ]);
  if (momErr) console.error("Moments error:", momErr.message);
  else console.log("Moments seeded");

  console.log("Done! Supabase seed complete.");
}

seed().catch(console.error);
