import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp, type Moment } from "@/context/AppContext";
import { RankBadge } from "@/components/RankBadge";

function MomentCard({ moment, onLike }: { moment: Moment; onLike: () => void }) {
  const colors = useColors();

  const typeIcon = {
    strike: "zap" as const,
    game: "activity" as const,
    challenge: "dollar-sign" as const,
    advice: "message-circle" as const,
  }[moment.type];

  const typeColor = {
    strike: colors.primary,
    game: "#60c8ff",
    challenge: "#f5c842",
    advice: colors.mutedForeground,
  }[moment.type];

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: moment.avatarColor }]}>
          <Text style={styles.avatarText}>{moment.initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userRow}>
            <Text style={[styles.username, { color: colors.foreground }]}>{moment.username}</Text>
            <View style={[styles.typePill, { backgroundColor: typeColor + "22" }]}>
              <Feather name={typeIcon} size={10} color={typeColor} />
              <Text style={[styles.typeText, { color: typeColor }]}>
                {moment.type.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.rankRow}>
            <RankBadge rank={moment.rank} small />
            <Text style={[styles.timeAgo, { color: colors.mutedForeground }]}>{moment.timeAgo}</Text>
          </View>
        </View>
      </View>

      {moment.score !== undefined && (
        <View style={[styles.scoreChip, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.scoreChipNumber, { color: colors.primary }]}>{moment.score}</Text>
          <Text style={[styles.scoreChipLabel, { color: colors.primary }]}>pts</Text>
        </View>
      )}

      <Text style={[styles.content, { color: colors.foreground }]}>{moment.content}</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike} activeOpacity={0.7}>
          <Feather
            name="heart"
            size={18}
            color={moment.liked ? "#ef4444" : colors.mutedForeground}
          />
          <Text
            style={[
              styles.actionCount,
              { color: moment.liked ? "#ef4444" : colors.mutedForeground },
            ]}
          >
            {moment.likes}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Feather name="message-circle" size={18} color={colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>
            {moment.comments}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Feather name="share-2" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MomentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { moments, toggleLikeMoment } = useApp();
  const [filter, setFilter] = useState<"all" | "game" | "challenge" | "advice">("all");

  const filters = [
    { key: "all", label: "ALL" },
    { key: "game", label: "GAMES" },
    { key: "challenge", label: "CHALLENGES" },
    { key: "advice", label: "ADVICE" },
  ] as const;

  const filtered = filter === "all" ? moments : moments.filter((m) => m.type === filter || (filter === "game" && m.type === "strike"));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>MOMENTS</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          The bowling community feed
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === f.key ? colors.foreground : colors.card,
                borderColor: filter === f.key ? colors.foreground : colors.border,
              },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.key ? colors.background : colors.mutedForeground },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((m) => (
          <MomentCard
            key={m.id}
            moment={m}
            onLike={() => {
              toggleLikeMoment(m.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: 1.5 },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2, letterSpacing: 0.5 },
  filterRow: { flexGrow: 0, marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterPill: {
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },
  card: { borderRadius: 20, padding: 16, gap: 12 },
  cardHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  userInfo: { flex: 1, gap: 4 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { fontSize: 14, fontWeight: "700" },
  typePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  typeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeAgo: { fontSize: 12 },
  scoreChip: { flexDirection: "row", alignItems: "baseline", gap: 4, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  scoreChipNumber: { fontSize: 22, fontWeight: "800" },
  scoreChipLabel: { fontSize: 12, fontWeight: "600" },
  content: { fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: "row", gap: 20, paddingTop: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontSize: 13, fontWeight: "600" },
});
