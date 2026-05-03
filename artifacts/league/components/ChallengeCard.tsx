import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { type Challenge } from "@/context/AppContext";
import { RankBadge } from "@/components/RankBadge";

interface Props {
  challenge: Challenge;
  onAccept?: () => void;
  isOwn?: boolean;
}

export function ChallengeCard({ challenge, onAccept, isOwn = false }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: challenge.avatarColor }]}>
          <Text style={styles.avatarText}>{challenge.initials}</Text>
        </View>
        <View style={styles.userSection}>
          <View style={styles.userRow}>
            <Text style={[styles.username, { color: colors.foreground }]}>{challenge.username}</Text>
            {challenge.isPro && (
              <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.proBadgeText, { color: colors.primaryForeground }]}>PRO</Text>
              </View>
            )}
          </View>
          <RankBadge rank={challenge.rank} small />
        </View>
        {!isOwn && (
          <Text style={[styles.timeAgo, { color: colors.mutedForeground }]}>{challenge.timeAgo}</Text>
        )}
      </View>

      {isOwn && challenge.description && (
        <View style={[styles.progressSection, { backgroundColor: colors.secondary }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              {challenge.description}
            </Text>
            <Text style={[styles.progressPct, { color: colors.foreground }]}>
              {Math.round((challenge.progress ?? 0) * 100)}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(challenge.progress ?? 0) * 100}%` as any,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.bottomRow}>
        <View style={styles.scoreSection}>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>SCORE POSTED</Text>
          <Text style={[styles.score, { color: colors.foreground }]}>{challenge.postedScore}</Text>
        </View>
        <View style={styles.stakeSection}>
          <Text style={[styles.stakeLabel, { color: colors.mutedForeground }]}>STAKE</Text>
          <Text style={[styles.stake, { color: colors.primary }]}>${challenge.stake}</Text>
        </View>
        {!isOwn ? (
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAccept?.();
            }}
            activeOpacity={0.85}
          >
            <Feather name="zap" size={14} color={colors.primaryForeground} />
            <Text style={[styles.acceptBtnText, { color: colors.primaryForeground }]}>Accept</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.activeBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
            <Feather name="activity" size={12} color={colors.primary} />
            <Text style={[styles.activeBadgeText, { color: colors.primary }]}>ACTIVE</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, gap: 14 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  userSection: { flex: 1, gap: 4 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { fontSize: 14, fontWeight: "700" },
  proBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 50 },
  proBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  timeAgo: { fontSize: 12 },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  scoreSection: { flex: 1, gap: 2 },
  scoreLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  score: { fontSize: 28, fontWeight: "800" },
  stakeSection: { alignItems: "center", gap: 2 },
  stakeLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  stake: { fontSize: 20, fontWeight: "800" },
  acceptBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 50 },
  acceptBtnText: { fontSize: 14, fontWeight: "700" },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1 },
  activeBadgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  progressSection: { borderRadius: 12, padding: 12, gap: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  progressPct: { fontSize: 11, fontWeight: "700" },
  progressBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
});
