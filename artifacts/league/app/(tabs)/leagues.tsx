import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp, type League } from "@/context/AppContext";

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "#a8c870",
  INTERMEDIATE: "#60c8ff",
  ADVANCED: "#f5c842",
  EXPERT: "#c8a8e8",
};

function LeagueCard({ league, onJoin }: { league: League; onJoin: () => void }) {
  const colors = useColors();
  const levelColor = LEVEL_COLORS[league.level] ?? colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <View style={styles.nameRow}>
            <Text style={[styles.leagueName, { color: colors.foreground }]}>{league.name}</Text>
            {league.type === "private" && (
              <View style={[styles.privateBadge, { backgroundColor: colors.muted }]}>
                <Feather name="lock" size={10} color={colors.mutedForeground} />
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.levelPill, { backgroundColor: levelColor + "22" }]}>
              <Text style={[styles.levelText, { color: levelColor }]}>{league.level}</Text>
            </View>
            <Text style={[styles.members, { color: colors.mutedForeground }]}>
              <Feather name="users" size={11} /> {league.members} members
            </Text>
          </View>
        </View>
        <View style={styles.cardTopRight}>
          <Text style={[styles.avgLabel, { color: colors.mutedForeground }]}>AVG</Text>
          <Text style={[styles.avgScore, { color: colors.foreground }]}>{league.avgScore}</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.mutedForeground }]}>{league.description}</Text>

      {league.weeklyChallenge && (
        <View style={[styles.weeklyChallenge, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="zap" size={12} color={colors.primary} />
          <Text style={[styles.weeklyText, { color: colors.primary }]}>{league.weeklyChallenge}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.joinBtn,
          {
            backgroundColor: league.type === "private" ? colors.secondary : colors.primary,
            borderWidth: league.type === "private" ? 1 : 0,
            borderColor: colors.border,
          },
        ]}
        onPress={onJoin}
        activeOpacity={0.85}
      >
        <Text
          style={[
            styles.joinBtnText,
            {
              color:
                league.type === "private" ? colors.foreground : colors.primaryForeground,
            },
          ]}
        >
          {league.type === "private" ? "Request to Join" : "Join League"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function LeaguesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { leagues, joinLeague } = useApp();
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [joinedLeague, setJoinedLeague] = useState<League | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const filtered =
    filter === "all" ? leagues : leagues.filter((l) => l.type === filter);

  const handleJoin = (league: League) => {
    joinLeague(league.id);
    setJoinedLeague(league);
    setSuccessVisible(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }} />
      <View style={[styles.header, { paddingTop: 12, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>LEAGUES</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Find your crew
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: colors.card }]}>
          <Text style={[styles.countText, { color: colors.foreground }]}>{leagues.length}</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(["all", "public", "private"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === f ? colors.foreground : colors.card,
                borderColor: filter === f ? colors.foreground : colors.border,
              },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? colors.background : colors.mutedForeground },
              ]}
            >
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((l) => (
          <LeagueCard key={l.id} league={l} onJoin={() => handleJoin(l)} />
        ))}
      </ScrollView>

      <Modal visible={successVisible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setSuccessVisible(false)}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <View style={[styles.successIcon, { backgroundColor: colors.primary }]}>
              <Feather name="check" size={28} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              {joinedLeague?.type === "private" ? "Request Sent!" : "Joined!"}
            </Text>
            <Text style={[styles.successText, { color: colors.mutedForeground }]}>
              {joinedLeague?.type === "private"
                ? `Your request to join ${joinedLeague?.name} has been sent.`
                : `Welcome to ${joinedLeague?.name}! Get out there and bowl.`}
            </Text>
            <TouchableOpacity
              style={[styles.successBtn, { backgroundColor: colors.primary }]}
              onPress={() => setSuccessVisible(false)}
            >
              <Text style={[styles.successBtnText, { color: colors.primaryForeground }]}>Done</Text>
            </TouchableOpacity>
          </View>
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
  countBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  countText: { fontSize: 16, fontWeight: "800" },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterPill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 },
  filterText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 20, padding: 16, gap: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTopLeft: { flex: 1, gap: 6 },
  cardTopRight: { alignItems: "flex-end" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  leagueName: { fontSize: 16, fontWeight: "800" },
  privateBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  levelText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  members: { fontSize: 12, fontWeight: "500" },
  avgLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  avgScore: { fontSize: 24, fontWeight: "800" },
  description: { fontSize: 14, lineHeight: 20 },
  weeklyChallenge: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 12, borderRadius: 12 },
  weeklyText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  joinBtn: { borderRadius: 50, paddingVertical: 14, alignItems: "center" },
  joinBtnText: { fontSize: 14, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  successCard: { borderRadius: 24, padding: 28, alignItems: "center", gap: 12, width: "100%" },
  successIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  successBtn: { borderRadius: 50, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  successBtnText: { fontSize: 15, fontWeight: "800" },
});
