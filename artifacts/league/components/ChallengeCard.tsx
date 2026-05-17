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
  onDelete?: () => void;
  onMarkResult?: () => void;
  result?: "won" | "lost";
}

export function ChallengeCard({ challenge, onAccept, isOwn = false, onDelete, onMarkResult, result }: Props) {
  const colors = useColors();

  const bsrChange = challenge.bsrChange;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      {/* Result Banner */}
      {result && (
        <View
          style={[
            styles.resultBanner,
            {
              backgroundColor: result === "won" ? "#22c55e18" : "#ef444418",
              borderColor: result === "won" ? "#22c55e55" : "#ef444455",
            },
          ]}
        >
          <Feather
            name={result === "won" ? "trending-up" : "trending-down"}
            size={14}
            color={result === "won" ? "#22c55e" : "#ef4444"}
          />
          <Text style={[styles.resultText, { color: result === "won" ? "#22c55e" : "#ef4444" }]}>
            {result === "won" ? "WON" : "LOST"}
            {bsrChange !== undefined && (
              `  ${bsrChange >= 0 ? "+" : ""}${bsrChange} BSR`
            )}
          </Text>
          {challenge.acceptorUsername && (
            <Text style={[styles.resultOpponent, { color: colors.mutedForeground }]}>
              vs {challenge.acceptorUsername}
            </Text>
          )}
        </View>
      )}

      {/* Top Row */}
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
        {onDelete ? (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onDelete();
            }}
          >
            <Feather name="trash-2" size={15} color="#ef4444" />
          </TouchableOpacity>
        ) : (
          <Text style={[styles.timeAgo, { color: colors.mutedForeground }]}>{challenge.timeAgo}</Text>
        )}
      </View>

      {/* Notes */}
      {challenge.notes ? (
        <Text style={[styles.notes, { color: colors.mutedForeground }]} numberOfLines={2}>
          {challenge.notes}
        </Text>
      ) : null}

      {/* Bottom Row */}
      <View style={styles.bottomRow}>
        <View style={styles.scoreSection}>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>SCORE POSTED</Text>
          <Text style={[styles.score, { color: colors.foreground }]}>{challenge.postedScore}</Text>
        </View>

        {/* BSR badge */}
        <View style={[styles.bsrSection, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
          <Text style={[styles.bsrLabel, { color: colors.mutedForeground }]}>BSR</Text>
          <Text style={[styles.bsrValue, { color: colors.primary }]}>{challenge.posterBsr ?? "—"}</Text>
        </View>

        {/* Action button */}
        {onMarkResult ? (
          <TouchableOpacity
            style={[styles.markResultBtn, { backgroundColor: "#ff5f1f18", borderColor: "#ff5f1f55" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onMarkResult();
            }}
            activeOpacity={0.85}
          >
            <Feather name="flag" size={13} color="#ff5f1f" />
            <Text style={[styles.markResultBtnText, { color: "#ff5f1f" }]}>Submit Score</Text>
          </TouchableOpacity>
        ) : !isOwn && !result ? (
          <TouchableOpacity
            style={[styles.acceptBtn, { backgroundColor: "#ff5f1f" }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onAccept?.();
            }}
            activeOpacity={0.85}
          >
            <Feather name="zap" size={14} color="#ffffff" />
            <Text style={[styles.acceptBtnText, { color: "#ffffff" }]}>Accept</Text>
          </TouchableOpacity>
        ) : isOwn && !result ? (
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: challenge.status === "open" ? "#ff5f1f22" : "#f59e0b22",
                borderColor: challenge.status === "open" ? "#ff5f1f66" : "#f59e0b44",
              },
            ]}
          >
            <Feather
              name={challenge.status === "open" ? "circle" : "activity"}
              size={11}
              color={challenge.status === "open" ? "#ff5f1f" : "#f59e0b"}
            />
            <Text
              style={[
                styles.statusBadgeText,
                { color: challenge.status === "open" ? "#ff5f1f" : "#f59e0b" },
              ]}
            >
              {challenge.status === "open" ? "OPEN" : "ACTIVE"}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, gap: 14 },
  resultBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  resultText: { fontSize: 13, fontFamily: "BarlowCondensed_700Bold", flex: 1 },
  resultOpponent: { fontSize: 11, fontFamily: "DMSans_400Regular" },
  topRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontFamily: "BarlowCondensed_700Bold", fontSize: 15 },
  userSection: { flex: 1, gap: 4 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { fontSize: 16, fontFamily: "BarlowCondensed_700Bold" },
  proBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 50 },
  proBadgeText: { fontSize: 9, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.5 },
  timeAgo: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#ef444420",
    justifyContent: "center", alignItems: "center",
  },
  notes: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 18, marginTop: -4 },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  scoreSection: { flex: 1, gap: 2 },
  scoreLabel: { fontSize: 9, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.8 },
  score: { fontSize: 34, fontFamily: "BarlowCondensed_800ExtraBold" },
  bsrSection: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  bsrLabel: { fontSize: 9, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.8 },
  bsrValue: { fontSize: 20, fontFamily: "BarlowCondensed_800ExtraBold" },
  acceptBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 50 },
  acceptBtnText: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold" },
  markResultBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 50, borderWidth: 1,
  },
  markResultBtnText: { fontSize: 13, fontFamily: "BarlowCondensed_600SemiBold" },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 50, borderWidth: 1,
  },
  statusBadgeText: { fontSize: 11, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.5 },
});
