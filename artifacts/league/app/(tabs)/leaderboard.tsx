import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { RankBadge } from "@/components/RankBadge";
import { api } from "@/lib/api";
import type { Rank } from "@/context/AppContext";

interface LeaderboardEntry {
  position: number;
  id: number;
  username: string;
  name: string;
  rank: Rank;
  rankColor: string;
  rating: number;
  careerAvg: number;
  highGame: number;
  totalGames: number;
  isPro: boolean;
  team: string;
  initials: string;
  avatarColor: string;
  isMe: boolean;
}

type FilterType = "global" | "friends" | "team";

const MEDAL_COLORS = ["#f5c842", "#c0c0c0", "#cd7f32"];

function PositionBadge({ position, isMe }: { position: number; isMe: boolean }) {
  const colors = useColors();
  const medalColor = position <= 3 ? MEDAL_COLORS[position - 1] : null;

  if (medalColor) {
    return (
      <View style={[styles.medal, { backgroundColor: medalColor + "22", borderColor: medalColor }]}>
        <Text style={[styles.medalText, { color: medalColor }]}>{position}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.posNumber, { backgroundColor: isMe ? colors.primary + "22" : "transparent" }]}>
      <Text style={[styles.posText, { color: isMe ? colors.primary : colors.mutedForeground }]}>
        {position}
      </Text>
    </View>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const colors = useColors();

  return (
    <View style={[
      styles.row,
      { backgroundColor: entry.isMe ? colors.primary + "12" : colors.card,
        borderColor: entry.isMe ? colors.primary : "transparent",
        borderWidth: entry.isMe ? 1.5 : 0 }
    ]}>
      <PositionBadge position={entry.position} isMe={entry.isMe} />

      <View style={[styles.rowAvatar, { backgroundColor: entry.avatarColor }]}>
        <Text style={styles.rowAvatarText}>{entry.initials}</Text>
      </View>

      <View style={styles.rowInfo}>
        <View style={styles.rowNameLine}>
          <Text style={[styles.rowUsername, { color: colors.foreground }]}>{entry.username}</Text>
          {entry.isPro && (
            <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.proBadgeText, { color: colors.primaryForeground }]}>PRO</Text>
            </View>
          )}
          {entry.isMe && (
            <View style={[styles.meBadge, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.meBadgeText, { color: colors.primary }]}>YOU</Text>
            </View>
          )}
        </View>
        <RankBadge rank={entry.rank} small />
      </View>

      <View style={styles.rowStats}>
        <Text style={[styles.rowRating, { color: colors.foreground }]}>{entry.rating}</Text>
        <Text style={[styles.rowStatLabel, { color: colors.mutedForeground }]}>RATING</Text>
        <Text style={[styles.rowAvg, { color: colors.mutedForeground }]}>avg {entry.careerAvg}</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>("global");
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLeaderboard = useCallback(async (f: FilterType, q?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter: f });
      if (q) params.append("q", q);
      const data = await api.get<LeaderboardEntry[]>(`/leaderboard?${params.toString()}`);
      setEntries(data);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!showSearch) fetchLeaderboard(filter);
  }, [filter, showSearch]);

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!text.trim()) { fetchLeaderboard("global"); return; }
    searchTimeout.current = setTimeout(() => fetchLeaderboard("global", text), 400);
  };

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: "global", label: "Global", icon: "globe" },
    { key: "friends", label: "Friends", icon: "users" },
    { key: "team", label: "My Team", icon: "shield" },
  ];

  const myEntry = entries.find((e) => e.isMe);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>RANKINGS</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {filter === "friends" ? "Among your circle" : filter === "team" ? "Your team standings" : "Best in the world"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.searchBtn, { backgroundColor: colors.card }]}
            onPress={() => { setShowSearch(!showSearch); setSearchText(""); }}
          >
            <Feather name={showSearch ? "x" : "search"} size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {showSearch ? (
          <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Find a bowler…"
              placeholderTextColor={colors.mutedForeground}
              value={searchText}
              onChangeText={handleSearch}
              autoFocus
            />
          </View>
        ) : (
          <View style={styles.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterBtn, {
                  backgroundColor: filter === f.key ? colors.foreground : colors.card,
                  flex: 1,
                }]}
                onPress={() => setFilter(f.key)}
              >
                <Feather name={f.icon as any} size={13} color={filter === f.key ? colors.background : colors.mutedForeground} />
                <Text style={[styles.filterBtnText, { color: filter === f.key ? colors.background : colors.mutedForeground }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {myEntry && !showSearch && (
        <View style={[styles.myPosition, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.myPositionLabel, { color: colors.primary }]}>YOUR POSITION</Text>
          <View style={styles.myPositionRow}>
            <Text style={[styles.myPositionNum, { color: colors.primary }]}>#{myEntry.position}</Text>
            <Text style={[styles.myPositionRating, { color: colors.foreground }]}>
              {myEntry.rating} rating · {myEntry.careerAvg} avg
            </Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {entries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="bar-chart-2" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {filter === "friends" ? "Add friends to see how you compare" : "No results found"}
              </Text>
            </View>
          ) : (
            entries.map((entry) => <LeaderboardRow key={entry.id} entry={entry} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTitle: { fontSize: 34, fontFamily: "BarlowCondensed_800ExtraBold", letterSpacing: 2 },
  headerSub: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2, letterSpacing: 0.3 },
  searchBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center", marginTop: 4 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500" },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 14 },
  filterBtnText: { fontSize: 13, fontFamily: "BarlowCondensed_600SemiBold" },
  myPosition: { marginHorizontal: 20, marginBottom: 12, borderRadius: 16, padding: 14 },
  myPositionLabel: { fontSize: 10, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1 },
  myPositionRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 4 },
  myPositionNum: { fontSize: 34, fontFamily: "BarlowCondensed_800ExtraBold" },
  myPositionRating: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 8 },
  emptyContainer: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500", textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, padding: 14 },
  medal: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, justifyContent: "center", alignItems: "center" },
  medalText: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold" },
  posNumber: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  posText: { fontSize: 14, fontWeight: "700" },
  rowAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  rowAvatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  rowInfo: { flex: 1, gap: 4 },
  rowNameLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowUsername: { fontSize: 16, fontFamily: "BarlowCondensed_700Bold" },
  proBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 50 },
  proBadgeText: { fontSize: 9, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.5 },
  meBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 50 },
  meBadgeText: { fontSize: 9, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.5 },
  rowStats: { alignItems: "flex-end", gap: 2 },
  rowRating: { fontSize: 22, fontFamily: "BarlowCondensed_800ExtraBold" },
  rowStatLabel: { fontSize: 8, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.5 },
  rowAvg: { fontSize: 11, fontFamily: "DMSans_400Regular" },
});
