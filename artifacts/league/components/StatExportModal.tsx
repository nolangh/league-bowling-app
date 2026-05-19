import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

type SectionKey = "profile" | "games" | "balls";

const BALL_GAME_COLS = ["date", "score", "alley", "oilPattern"] as const;
type BallGameCol = (typeof BALL_GAME_COLS)[number];
const BALL_GAME_HEADERS: Record<BallGameCol, string> = {
  date: "Date",
  score: "Score",
  alley: "Alley",
  oilPattern: "Oil Pattern",
};
type GameLike = ReturnType<typeof useApp>["games"][number];
const BALL_GAME_GETTERS: Record<BallGameCol, (g: GameLike) => string | number | null | undefined> = {
  date: (g) => g.date,
  score: (g) => g.score,
  alley: (g) => g.alley,
  oilPattern: (g) => g.oilPattern,
};

type ProfileField = {
  key: string;
  label: string;
  getValue: (u: ReturnType<typeof useApp>["user"]) => string | number | null | undefined;
};

type GameField = {
  key: string;
  header: string;
  getValue: (g: ReturnType<typeof useApp>["games"][number]) => string | number | boolean | null | undefined;
};

type BallField = {
  key: string;
  header: string;
  getValue: (b: ReturnType<typeof useApp>["balls"][number]) => string | number | boolean | null | undefined;
};

const PROFILE_FIELDS: ProfileField[] = [
  { key: "rank",        label: "Rank",          getValue: (u) => u.rank },
  { key: "level",       label: "Level",         getValue: (u) => u.level },
  { key: "careerAvg",   label: "Career Average", getValue: (u) => u.careerAvg },
  { key: "highGame",    label: "High Game",     getValue: (u) => u.highGame },
  { key: "totalGames",  label: "Total Games",   getValue: (u) => u.totalGames },
  { key: "bsr",         label: "BSR Rating",    getValue: (u) => u.bsr },
  { key: "wins",        label: "Wins",          getValue: (u) => u.wins ?? 0 },
  { key: "losses",      label: "Losses",        getValue: (u) => u.losses ?? 0 },
  { key: "winRate",     label: "Win Rate (%)",  getValue: (u) => {
    const t = (u.wins ?? 0) + (u.losses ?? 0);
    return t > 0 ? Math.round(((u.wins ?? 0) / t) * 100) : 0;
  }},
  { key: "xp",          label: "XP",            getValue: (u) => u.xp },
  { key: "revRate",     label: "Rev Rate (rpm)", getValue: (u) => u.revRate },
  { key: "ballSpeed",   label: "Ball Speed (mph)", getValue: (u) => u.ballSpeed },
  { key: "axisTilt",    label: "Axis Tilt (°)", getValue: (u) => u.axisTilt },
  { key: "axisRotation",label: "Axis Rotation (°)", getValue: (u) => u.axisRotation },
  { key: "pap",         label: "PAP",           getValue: (u) => u.papOver ? `${u.papOver}${u.papUp ? ` × ${u.papUp}` : ""}` : null },
  { key: "releaseStyle",label: "Release Style", getValue: (u) => u.releaseStyle },
  { key: "gripStyle",   label: "Grip Style",    getValue: (u) => u.gripStyle },
  { key: "dominantHand",label: "Dominant Hand", getValue: (u) => u.dominantHand },
  { key: "homeAlley",   label: "Home Alley",    getValue: (u) => u.homeAlleyName },
  { key: "team",        label: "Team",          getValue: (u) => u.team },
];

const GAME_FIELDS: GameField[] = [
  { key: "date",        header: "Date",         getValue: (g) => g.date },
  { key: "score",       header: "Score",        getValue: (g) => g.score },
  { key: "alley",       header: "Alley",        getValue: (g) => g.alley },
  { key: "oilPattern",  header: "Oil Pattern",  getValue: (g) => g.oilPattern },
  { key: "ballUsed",    header: "Ball Used",    getValue: (g) => g.ballUsed },
  { key: "notes",       header: "Notes",        getValue: (g) => g.notes },
  { key: "verified",    header: "Verified",     getValue: (g) => g.verified ? "Yes" : "No" },
  { key: "entryMethod", header: "Entry Method", getValue: (g) => (g as any).entryMethod ?? "" },
];

const BALL_FIELDS: BallField[] = [
  { key: "name",          header: "Ball Name",      getValue: (b) => b.name },
  { key: "brand",         header: "Brand",          getValue: (b) => b.brand },
  { key: "weight",        header: "Weight (lbs)",   getValue: (b) => b.weight },
  { key: "color",         header: "Color",          getValue: (b) => b.color },
  { key: "coverstock",    header: "Coverstock",     getValue: (b) => b.coverstock },
  { key: "core",          header: "Core",           getValue: (b) => b.core },
  { key: "drillingLayout",header: "Drilling Layout",getValue: (b) => (b as any).drillingLayout },
  { key: "surface",       header: "Surface",        getValue: (b) => (b as any).surface },
  { key: "span",          header: "Span",           getValue: (b) => (b as any).span },
  { key: "pitch",         header: "Pitch",          getValue: (b) => (b as any).pitch },
  { key: "notes",         header: "Notes",          getValue: (b) => b.notes },
  { key: "isActive",      header: "Active",         getValue: (b) => (b as any).isActive ? "Yes" : "No" },
];

function csvCell(val: string | number | boolean | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(
  user: ReturnType<typeof useApp>["user"],
  games: ReturnType<typeof useApp>["games"],
  balls: ReturnType<typeof useApp>["balls"],
  sections: Record<SectionKey, boolean>,
  profileFields: Set<string>,
  gameFields: Set<string>,
  ballFields: Set<string>,
  perBallBreakdown: boolean,
): string {
  const parts: string[] = [];

  if (sections.profile && profileFields.size > 0) {
    parts.push("# Player Stats");
    parts.push("Field,Value");
    for (const f of PROFILE_FIELDS) {
      if (!profileFields.has(f.key)) continue;
      const val = f.getValue(user);
      if (val == null || val === "") continue;
      parts.push(`${csvCell(f.label)},${csvCell(val)}`);
    }
    parts.push("");
  }

  if (sections.games && gameFields.size > 0 && games.length > 0) {
    const activeCols = GAME_FIELDS.filter((f) => gameFields.has(f.key));
    parts.push("# Game History");
    parts.push(activeCols.map((f) => csvCell(f.header)).join(","));
    for (const g of games) {
      parts.push(activeCols.map((f) => csvCell(f.getValue(g))).join(","));
    }
    parts.push("");
  }

  if (sections.balls && ballFields.size > 0 && balls.length > 0) {
    const activeCols = BALL_FIELDS.filter((f) => ballFields.has(f.key));
    parts.push("# Ball Arsenal");
    parts.push(activeCols.map((f) => csvCell(f.header)).join(","));
    for (const b of balls) {
      parts.push(activeCols.map((f) => csvCell(f.getValue(b))).join(","));

      if (perBallBreakdown) {
        const ballGames = games.filter((g) => {
          if (g.ballId != null) return String(g.ballId) === b.id;
          return g.ballUsed === b.name;
        });
        if (ballGames.length > 0) {
          parts.push(BALL_GAME_COLS.map((c) => csvCell(BALL_GAME_HEADERS[c])).join(","));
          for (const g of ballGames) {
            parts.push(
              BALL_GAME_COLS.map((c) => csvCell(BALL_GAME_GETTERS[c](g))).join(",")
            );
          }
        }
      }
    }
    parts.push("");
  }

  return parts.join("\n");
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function StatExportModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { user, games, balls } = useApp();

  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    profile: true,
    games: true,
    balls: true,
  });

  const [profileFields, setProfileFields] = useState<Set<string>>(
    () => new Set(PROFILE_FIELDS.map((f) => f.key))
  );
  const [gameFields, setGameFields] = useState<Set<string>>(
    () => new Set(GAME_FIELDS.map((f) => f.key))
  );
  const [ballFields, setBallFields] = useState<Set<string>>(
    () => new Set(BALL_FIELDS.map((f) => f.key))
  );

  const [perBallBreakdown, setPerBallBreakdown] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [expanded, setExpanded] = useState<SectionKey | null>(null);

  const toggleSection = (s: SectionKey) =>
    setSections((prev) => ({ ...prev, [s]: !prev[s] }));

  const toggleField = (
    set: Set<string>,
    setFn: React.Dispatch<React.SetStateAction<Set<string>>>,
    key: string
  ) => {
    setFn((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAll = (
    fields: { key: string }[],
    set: Set<string>,
    setFn: React.Dispatch<React.SetStateAction<Set<string>>>
  ) => {
    const allSelected = fields.every((f) => set.has(f.key));
    setFn(allSelected ? new Set() : new Set(fields.map((f) => f.key)));
  };

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    try {
      const csv = buildCsv(user, games, balls, sections, profileFields, gameFields, ballFields, perBallBreakdown);
      if (!csv.trim()) return;

      const filename = `league_stats_${user.username}_${new Date().toISOString().slice(0, 10)}.csv`;
      const file = new File(Paths.cache, filename);
      file.write(csv);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export Stats CSV",
          UTI: "public.comma-separated-values-text",
        });
      }
    } finally {
      setExporting(false);
    }
  };

  const totalSelected = [
    sections.profile ? profileFields.size : 0,
    sections.games && games.length > 0 ? (gameFields.size > 0 ? 1 : 0) : 0,
    sections.balls && balls.length > 0 ? (ballFields.size > 0 ? 1 : 0) : 0,
  ].reduce((a, b) => a + b, 0);

  const canExport = totalSelected > 0;

  const sectionConfig: { key: SectionKey; icon: keyof typeof Feather.glyphMap; label: string; count: string }[] = [
    { key: "profile", icon: "user",   label: "Player Stats",  count: `${profileFields.size}/${PROFILE_FIELDS.length} fields` },
    { key: "games",   icon: "list",   label: "Game History",  count: `${gameFields.size}/${GAME_FIELDS.length} cols · ${games.length} games` },
    { key: "balls",   icon: "circle", label: "Ball Arsenal",  count: `${ballFields.size}/${BALL_FIELDS.length} cols · ${balls.length} balls` },
  ];

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 40, maxHeight: "90%" },
    handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 4 },
    title: { fontSize: 18, fontWeight: "700" },
    closeBtn: { padding: 4 },
    subtitle: { fontSize: 13, paddingHorizontal: 20, marginBottom: 16 },
    sectionRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 12, borderBottomWidth: 1 },
    sectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    sectionInfo: { flex: 1 },
    sectionLabel: { fontSize: 15, fontWeight: "600" },
    sectionCount: { fontSize: 12, marginTop: 1 },
    toggleRow: { padding: 20, gap: 8 },
    toggleLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
    allToggle: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: "flex-start", marginBottom: 8 },
    allToggleText: { fontSize: 13, fontWeight: "600" },
    fieldGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 13 },
    footer: { paddingHorizontal: 20, paddingTop: 16, gap: 10 },
    exportBtn: { paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
    exportBtnText: { fontSize: 16, fontWeight: "700" },
    breakdownRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
    breakdownInfo: { flex: 1 },
    breakdownLabel: { fontSize: 14, fontWeight: "600" },
    breakdownSub: { fontSize: 12, marginTop: 2 },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: colors.card }]}>
          <View style={[s.handle, { backgroundColor: colors.border }]} />

          <View style={s.header}>
            <Text style={[s.title, { color: colors.foreground }]}>Export Stats</Text>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
            Choose what to include in your CSV export.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {sectionConfig.map(({ key, icon, label, count }) => (
              <View key={key}>
                {/* Section header row */}
                <TouchableOpacity
                  style={[s.sectionRow, { borderBottomColor: colors.border }]}
                  onPress={() => setExpanded(expanded === key ? null : key)}
                  activeOpacity={0.75}
                >
                  <View style={[s.sectionIcon, { backgroundColor: sections[key] ? colors.primary + "22" : colors.secondary }]}>
                    <Feather name={icon} size={16} color={sections[key] ? colors.primary : colors.mutedForeground} />
                  </View>
                  <View style={s.sectionInfo}>
                    <Text style={[s.sectionLabel, { color: sections[key] ? colors.foreground : colors.mutedForeground }]}>{label}</Text>
                    <Text style={[s.sectionCount, { color: colors.mutedForeground }]}>{count}</Text>
                  </View>

                  {/* Include toggle */}
                  <TouchableOpacity
                    onPress={() => { toggleSection(key); Haptics.selectionAsync(); }}
                    hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    style={{ padding: 4 }}
                  >
                    <View style={[
                      { width: 44, height: 26, borderRadius: 13, padding: 2, justifyContent: "center" },
                      { backgroundColor: sections[key] ? colors.primary : colors.border }
                    ]}>
                      <View style={[
                        { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" },
                        { alignSelf: sections[key] ? "flex-end" : "flex-start" }
                      ]} />
                    </View>
                  </TouchableOpacity>

                  <Feather
                    name={expanded === key ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.mutedForeground}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>

                {/* Expanded field picker */}
                {expanded === key && sections[key] && (
                  <View style={[s.toggleRow, { backgroundColor: colors.background }]}>
                    {key === "profile" && (
                      <>
                        <TouchableOpacity
                          style={[s.allToggle, { backgroundColor: colors.primary + "18" }]}
                          onPress={() => { toggleAll(PROFILE_FIELDS, profileFields, setProfileFields); Haptics.selectionAsync(); }}
                        >
                          <Feather
                            name={PROFILE_FIELDS.every((f) => profileFields.has(f.key)) ? "check-square" : "square"}
                            size={14}
                            color={colors.primary}
                          />
                          <Text style={[s.allToggleText, { color: colors.primary }]}>
                            {PROFILE_FIELDS.every((f) => profileFields.has(f.key)) ? "Deselect all" : "Select all"}
                          </Text>
                        </TouchableOpacity>
                        <View style={s.fieldGrid}>
                          {PROFILE_FIELDS.map((f) => {
                            const active = profileFields.has(f.key);
                            return (
                              <TouchableOpacity
                                key={f.key}
                                style={[s.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "18" : "transparent" }]}
                                onPress={() => { toggleField(profileFields, setProfileFields, f.key); Haptics.selectionAsync(); }}
                              >
                                <Feather name={active ? "check-square" : "square"} size={12} color={active ? colors.primary : colors.mutedForeground} />
                                <Text style={[s.chipText, { color: active ? colors.primary : colors.foreground }]}>{f.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    )}

                    {key === "games" && (
                      <>
                        <TouchableOpacity
                          style={[s.allToggle, { backgroundColor: colors.primary + "18" }]}
                          onPress={() => { toggleAll(GAME_FIELDS, gameFields, setGameFields); Haptics.selectionAsync(); }}
                        >
                          <Feather
                            name={GAME_FIELDS.every((f) => gameFields.has(f.key)) ? "check-square" : "square"}
                            size={14}
                            color={colors.primary}
                          />
                          <Text style={[s.allToggleText, { color: colors.primary }]}>
                            {GAME_FIELDS.every((f) => gameFields.has(f.key)) ? "Deselect all" : "Select all"}
                          </Text>
                        </TouchableOpacity>
                        <View style={s.fieldGrid}>
                          {GAME_FIELDS.map((f) => {
                            const active = gameFields.has(f.key);
                            return (
                              <TouchableOpacity
                                key={f.key}
                                style={[s.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "18" : "transparent" }]}
                                onPress={() => { toggleField(gameFields, setGameFields, f.key); Haptics.selectionAsync(); }}
                              >
                                <Feather name={active ? "check-square" : "square"} size={12} color={active ? colors.primary : colors.mutedForeground} />
                                <Text style={[s.chipText, { color: active ? colors.primary : colors.foreground }]}>{f.header}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    )}

                    {key === "balls" && (
                      <>
                        <TouchableOpacity
                          style={[s.allToggle, { backgroundColor: colors.primary + "18" }]}
                          onPress={() => { toggleAll(BALL_FIELDS, ballFields, setBallFields); Haptics.selectionAsync(); }}
                        >
                          <Feather
                            name={BALL_FIELDS.every((f) => ballFields.has(f.key)) ? "check-square" : "square"}
                            size={14}
                            color={colors.primary}
                          />
                          <Text style={[s.allToggleText, { color: colors.primary }]}>
                            {BALL_FIELDS.every((f) => ballFields.has(f.key)) ? "Deselect all" : "Select all"}
                          </Text>
                        </TouchableOpacity>
                        <View style={s.fieldGrid}>
                          {BALL_FIELDS.map((f) => {
                            const active = ballFields.has(f.key);
                            return (
                              <TouchableOpacity
                                key={f.key}
                                style={[s.chip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary + "18" : "transparent" }]}
                                onPress={() => { toggleField(ballFields, setBallFields, f.key); Haptics.selectionAsync(); }}
                              >
                                <Feather name={active ? "check-square" : "square"} size={12} color={active ? colors.primary : colors.mutedForeground} />
                                <Text style={[s.chipText, { color: active ? colors.primary : colors.foreground }]}>{f.header}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        <View style={[s.breakdownRow, { borderTopColor: colors.border }]}>
                          <View style={s.breakdownInfo}>
                            <Text style={[s.breakdownLabel, { color: colors.foreground }]}>Include per-ball game breakdown</Text>
                            <Text style={[s.breakdownSub, { color: colors.mutedForeground }]}>
                              Each ball is followed by its game rows (date, score, alley, oil pattern)
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => { setPerBallBreakdown((v) => !v); Haptics.selectionAsync(); }}
                            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                            style={{ padding: 4 }}
                          >
                            <View style={[
                              { width: 44, height: 26, borderRadius: 13, padding: 2, justifyContent: "center" },
                              { backgroundColor: perBallBreakdown ? colors.primary : colors.border }
                            ]}>
                              <View style={[
                                { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" },
                                { alignSelf: perBallBreakdown ? "flex-end" : "flex-start" }
                              ]} />
                            </View>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity
              style={[s.exportBtn, { backgroundColor: canExport ? colors.primary : colors.border, opacity: exporting ? 0.7 : 1 }]}
              onPress={handleExport}
              disabled={!canExport || exporting}
              activeOpacity={0.85}
            >
              {exporting
                ? <ActivityIndicator size="small" color={colors.primaryForeground} />
                : <Feather name="download" size={18} color={canExport ? colors.primaryForeground : colors.mutedForeground} />
              }
              <Text style={[s.exportBtnText, { color: canExport ? colors.primaryForeground : colors.mutedForeground }]}>
                {exporting ? "Exporting…" : "Export CSV"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
