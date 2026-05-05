import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useApp, getRankColor } from "@/context/AppContext";
import { RankBadge } from "@/components/RankBadge";
import { api } from "@/lib/api";

type PublicUser = {
  id: number;
  username: string;
  name: string;
  rank: string;
  level: number;
  careerAvg: number;
  highGame: number;
  totalGames: number;
  team: string;
  rating: number;
  isPro: boolean;
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sendFriendRequest } = useApp();

  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<PublicUser>(`/users/${id}`)
      .then(setProfile)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddFriend = async () => {
    if (!profile) return;
    setRequesting(true);
    try {
      await sendFriendRequest(profile.id);
      setRequested(true);
    } catch {
      // ignore
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          {error ?? "User not found"}
        </Text>
      </View>
    );
  }

  const rankColor = getRankColor(profile.rank);
  const initials = profile.username.slice(0, 2);

  const STATS = [
    { label: "CAREER AVG", value: profile.careerAvg },
    { label: "HIGH GAME", value: profile.highGame },
    { label: "TOTAL GAMES", value: profile.totalGames },
    { label: "RATING", value: profile.rating },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: 24 }]}>
        <View style={[styles.avatar, { backgroundColor: "#1a3c2a" }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.heroInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>{profile.name}</Text>
            {profile.isPro && (
              <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.proBadgeText, { color: colors.primaryForeground }]}>PRO</Text>
              </View>
            )}
          </View>
          <Text style={[styles.username, { color: colors.mutedForeground }]}>@{profile.username}</Text>
          <RankBadge rank={profile.rank as any} />
        </View>
        <TouchableOpacity
          style={[
            styles.addBtn,
            {
              backgroundColor: requested ? colors.card : colors.primary,
              borderWidth: requested ? 1 : 0,
              borderColor: colors.border,
            },
          ]}
          onPress={handleAddFriend}
          disabled={requesting || requested}
          activeOpacity={0.85}
        >
          {requesting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <>
              <Feather
                name={requested ? "check" : "user-plus"}
                size={14}
                color={requested ? colors.mutedForeground : colors.primaryForeground}
              />
              <Text
                style={[
                  styles.addBtnText,
                  { color: requested ? colors.mutedForeground : colors.primaryForeground },
                ]}
              >
                {requested ? "Requested" : "Add Friend"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Level */}
      <View style={[styles.levelBadge, { backgroundColor: colors.card }]}>
        <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>LEVEL</Text>
        <Text style={[styles.levelValue, { color: colors.foreground }]}>{profile.level}</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        {STATS.map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Team */}
      <View style={[styles.teamCard, { backgroundColor: "#1a1a16" }]}>
        <Feather name="shield" size={18} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.teamLabel, { color: colors.primary }]}>TEAM</Text>
          <Text style={[styles.teamName, { color: "#ffffff" }]}>{profile.team}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 15 },
  content: { paddingHorizontal: 20, gap: 14 },
  hero: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "800", color: "#9fe870" },
  heroInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 20, fontWeight: "800" },
  username: { fontSize: 13, fontWeight: "500" },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: { fontSize: 10, fontWeight: "800" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 50,
  },
  addBtnText: { fontSize: 13, fontWeight: "700" },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
  },
  levelLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  levelValue: { fontSize: 20, fontWeight: "800" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderRadius: 16,
  },
  teamLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  teamName: { fontSize: 17, fontWeight: "700" },
});
