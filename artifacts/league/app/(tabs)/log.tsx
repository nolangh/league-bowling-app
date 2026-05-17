import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, type Game, type Ball } from "@/context/AppContext";

const OIL_PATTERNS = ["House Shot", "Sport Shot", "Challenge Pattern", "PBA Shot", "Other"];
const ALLEYS = [
  "Bowlero Midtown",
  "AMF Pro Bowl",
  "Kings Bowl",
  "Sunset Lanes",
  "Other",
];

function GameRow({ game }: { game: Game }) {
  const colors = useColors();
  const date = new Date(game.date);
  const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <View style={[styles.gameRow, { backgroundColor: colors.card }]}>
      <View style={[styles.scoreBox, { backgroundColor: colors.primary }]}>
        <Text style={[styles.scoreBoxNum, { color: colors.primaryForeground }]}>{game.score}</Text>
      </View>
      <View style={styles.gameInfo}>
        <Text style={[styles.gameName, { color: colors.foreground }]}>{game.alley}</Text>
        <Text style={[styles.gameMeta, { color: colors.mutedForeground }]}>
          {formatted} · {game.oilPattern}
        </Text>
        {game.ballUsed ? (
          <Text style={[styles.gameBall, { color: colors.mutedForeground }]}>
            <Feather name="circle" size={10} /> {game.ballUsed}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        {game.verified && (
          <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="check-circle" size={10} color={colors.primary} />
            <Text style={[styles.verifiedText, { color: colors.primary }]}>VERIFIED</Text>
          </View>
        )}
        {game.notes ? (
          <Feather name="file-text" size={14} color={colors.mutedForeground} />
        ) : null}
      </View>
    </View>
  );
}

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { games, logGame, user, balls } = useApp();
  const router = useRouter();
  const activeBalls = balls.filter((b) => b.isActive);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [scoreInput, setScoreInput] = useState("");
  const [alley, setAlley] = useState(ALLEYS[0]);
  const [oilPattern, setOilPattern] = useState(OIL_PATTERNS[0]);
  const [selectedBall, setSelectedBall] = useState<Ball | null>(null);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"score" | "details" | "verifying">("score");

  const recent5 = games.slice(0, 5);
  const recentAvg =
    recent5.length > 0
      ? Math.round(recent5.reduce((s, g) => s + g.score, 0) / recent5.length)
      : 0;

  const handleSubmit = async () => {
    const score = parseInt(scoreInput);
    if (!score || score < 100 || score > 300) return;
    setStep("verifying");
    setIsLogging(true);
    await new Promise((r) => setTimeout(r, 2200));
    await logGame({
      score,
      date: new Date().toISOString().split("T")[0],
      alley,
      oilPattern,
      ballUsed: selectedBall?.name ?? "",
      ballId: selectedBall ? Number(selectedBall.id) : null,
      notes,
      verified: true,
    } as any);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLogging(false);
    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setScoreInput("");
    setAlley(ALLEYS[0]);
    setOilPattern(OIL_PATTERNS[0]);
    setSelectedBall(null);
    setNotes("");
    setStep("score");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }} />
      <View style={[styles.header, { paddingTop: 12, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>SCORE LOG</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {games.length} games tracked
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.logBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus-square" size={16} color={colors.primaryForeground} />
          <Text style={[styles.logBtnText, { color: colors.primaryForeground }]}>Log Game</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsRow, { paddingHorizontal: 16, gap: 12 }]}>
        {[
          { label: "CAREER AVG", value: user.careerAvg, unit: "" },
          { label: "HIGH GAME", value: user.highGame, unit: "" },
          { label: "LAST 5 AVG", value: recentAvg, unit: "" },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENT GAMES</Text>
        {games.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="activity" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No games logged yet
            </Text>
          </View>
        ) : (
          games.map((g) => <GameRow key={g.id} game={g} />)
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <Pressable style={styles.overlay} onPress={() => { setModalVisible(false); resetForm(); }}>
          <Pressable style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {step === "verifying" ? (
              <View style={styles.verifyingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.verifyingTitle, { color: colors.foreground }]}>
                  AI Verifying Score
                </Text>
                <Text style={[styles.verifyingText, { color: colors.mutedForeground }]}>
                  Checking scorecard integrity...
                </Text>
              </View>
            ) : step === "score" ? (
              <>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Log a Game</Text>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>FINAL SCORE</Text>
                <TextInput
                  style={[styles.bigInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                  placeholder="200"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  value={scoreInput}
                  onChangeText={setScoreInput}
                  maxLength={3}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.nextBtn, {
                    backgroundColor: scoreInput && parseInt(scoreInput) >= 100 && parseInt(scoreInput) <= 300 ? colors.primary : colors.muted
                  }]}
                  onPress={() => setStep("details")}
                  disabled={!scoreInput || parseInt(scoreInput) < 100 || parseInt(scoreInput) > 300}
                >
                  <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Score: <Text style={{ color: colors.primary }}>{scoreInput}</Text>
                </Text>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ALLEY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
                  {ALLEYS.map((a) => (
                    <TouchableOpacity key={a} style={[styles.optionPill, { backgroundColor: alley === a ? colors.foreground : colors.secondary, borderColor: alley === a ? colors.foreground : colors.border }]} onPress={() => setAlley(a)}>
                      <Text style={[styles.optionPillText, { color: alley === a ? colors.background : colors.foreground }]}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>OIL PATTERN</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
                  {OIL_PATTERNS.map((p) => (
                    <TouchableOpacity key={p} style={[styles.optionPill, { backgroundColor: oilPattern === p ? colors.foreground : colors.secondary, borderColor: oilPattern === p ? colors.foreground : colors.border }]} onPress={() => setOilPattern(p)}>
                      <Text style={[styles.optionPillText, { color: oilPattern === p ? colors.background : colors.foreground }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 0 }]}>BALL USED</Text>
                  <TouchableOpacity
                    onPress={() => { setModalVisible(false); resetForm(); router.push("/arsenal/new"); }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary, letterSpacing: 0.5 }}>+ ADD BALL</Text>
                  </TouchableOpacity>
                </View>
                {activeBalls.length === 0 ? (
                  <TouchableOpacity
                    style={[styles.optionPill, { backgroundColor: colors.secondary, borderColor: colors.border, alignSelf: "flex-start", marginTop: 4 }]}
                    onPress={() => { setModalVisible(false); resetForm(); router.push("/arsenal" as any); }}
                  >
                    <Text style={[styles.optionPillText, { color: colors.mutedForeground }]}>No balls in your arsenal — tap to add one</Text>
                  </TouchableOpacity>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
                    <TouchableOpacity
                      style={[styles.optionPill, { backgroundColor: selectedBall === null ? colors.foreground : colors.secondary, borderColor: selectedBall === null ? colors.foreground : colors.border }]}
                      onPress={() => setSelectedBall(null)}
                    >
                      <Text style={[styles.optionPillText, { color: selectedBall === null ? colors.background : colors.foreground }]}>None</Text>
                    </TouchableOpacity>
                    {activeBalls.map((b) => {
                      const sel = selectedBall?.id === b.id;
                      return (
                        <TouchableOpacity key={b.id} style={[styles.optionPill, { backgroundColor: sel ? colors.foreground : colors.secondary, borderColor: sel ? colors.foreground : colors.border }]} onPress={() => setSelectedBall(b)}>
                          <Text style={[styles.optionPillText, { color: sel ? colors.background : colors.foreground }]}>{b.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
                <TouchableOpacity
                  style={[styles.nextBtn, { backgroundColor: "#ff5f1f" }]}
                  onPress={handleSubmit}
                  disabled={isLogging}
                >
                  <Text style={[styles.nextBtnText, { color: "#ffffff" }]}>
                    Submit & Verify
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: 1.5 },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2, letterSpacing: 0.5 },
  logBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50 },
  logBtnText: { fontSize: 14, fontWeight: "700" },
  statsRow: { flexDirection: "row", marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 4 },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  list: { paddingHorizontal: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },
  gameRow: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, padding: 14 },
  scoreBox: { width: 54, height: 54, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  scoreBoxNum: { fontSize: 20, fontWeight: "800" },
  gameInfo: { flex: 1, gap: 3 },
  gameName: { fontSize: 14, fontWeight: "700" },
  gameMeta: { fontSize: 12 },
  gameBall: { fontSize: 12 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 50 },
  verifiedText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  bottomSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 12,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "90%",
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 4 },
  bigInput: { borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 36, fontWeight: "800", textAlign: "center" },
  nextBtn: { borderRadius: 50, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  nextBtnText: { fontSize: 15, fontWeight: "800" },
  optionRow: { marginBottom: 4 },
  optionPill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  optionPillText: { fontSize: 13, fontWeight: "600" },
  verifyingContainer: { alignItems: "center", gap: 16, paddingVertical: 40 },
  verifyingTitle: { fontSize: 20, fontWeight: "800" },
  verifyingText: { fontSize: 14 },
});
