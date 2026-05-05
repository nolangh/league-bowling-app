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
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { RankBadge } from "@/components/RankBadge";
import { useApp, type Friend, type Rank } from "@/context/AppContext";
import { api } from "@/lib/api";

type Tab = "friends" | "requests" | "find";

interface FriendRequest {
  requestId: number;
  userId: number;
  username: string;
  name: string;
  rank: Rank;
  rankColor: string;
  rating: number;
  careerAvg: number;
  isPro: boolean;
  initials: string;
  avatarColor: string;
  timeAgo: string;
}

interface SearchResult {
  id: number;
  username: string;
  name: string;
  rank: Rank;
  rankColor: string;
  rating: number;
  careerAvg: number;
  highGame: number;
  isPro: boolean;
  initials: string;
  avatarColor: string;
  friendStatus: string | null;
}

function FriendCard({ friend, onRemove }: { friend: Friend; onRemove: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={[styles.cardAvatar, { backgroundColor: friend.avatarColor }]}>
        <Text style={styles.cardAvatarText}>{friend.initials}</Text>
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={[styles.cardUsername, { color: colors.foreground }]}>{friend.username}</Text>
          {friend.isPro && (
            <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.proBadgeText, { color: colors.primaryForeground }]}>PRO</Text>
            </View>
          )}
        </View>
        <RankBadge rank={friend.rank} small />
        <Text style={[styles.cardStats, { color: colors.mutedForeground }]}>
          {friend.rating} rating · avg {friend.careerAvg}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.removeBtn, { backgroundColor: colors.secondary }]}
        onPress={onRemove}
        activeOpacity={0.7}
      >
        <Feather name="user-minus" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

function RequestCard({ request, onAccept, onDecline }: {
  request: FriendRequest;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={[styles.cardAvatar, { backgroundColor: request.avatarColor }]}>
        <Text style={styles.cardAvatarText}>{request.initials}</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardUsername, { color: colors.foreground }]}>{request.username}</Text>
        <RankBadge rank={request.rank} small />
        <Text style={[styles.timeAgo, { color: colors.mutedForeground }]}>{request.timeAgo}</Text>
      </View>
      <View style={styles.requestBtns}>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
          onPress={onAccept}
          activeOpacity={0.8}
        >
          <Feather name="check" size={16} color={colors.primaryForeground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.declineBtn, { backgroundColor: colors.secondary }]}
          onPress={onDecline}
          activeOpacity={0.8}
        >
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SearchResultCard({ result, onRequest }: { result: SearchResult; onRequest: () => void }) {
  const colors = useColors();
  const [sent, setSent] = useState(result.friendStatus === "pending");
  const isFriend = result.friendStatus === "accepted";

  const statusLabel = isFriend ? "Friends" : sent ? "Requested" : "Add Friend";
  const statusColor = isFriend ? colors.primary : sent ? colors.mutedForeground : colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={[styles.cardAvatar, { backgroundColor: result.avatarColor }]}>
        <Text style={styles.cardAvatarText}>{result.initials}</Text>
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={[styles.cardUsername, { color: colors.foreground }]}>{result.username}</Text>
          {result.isPro && (
            <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.proBadgeText, { color: colors.primaryForeground }]}>PRO</Text>
            </View>
          )}
        </View>
        <RankBadge rank={result.rank} small />
        <Text style={[styles.cardStats, { color: colors.mutedForeground }]}>
          {result.rating} rating · avg {result.careerAvg}
        </Text>
      </View>
      {!isFriend && (
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: sent ? colors.secondary : colors.primary }]}
          onPress={() => {
            if (!sent) { onRequest(); setSent(true); }
          }}
          disabled={sent}
          activeOpacity={0.8}
        >
          <Feather name={sent ? "check" : "user-plus"} size={14} color={sent ? colors.mutedForeground : colors.primaryForeground} />
          <Text style={[styles.addBtnText, { color: sent ? colors.mutedForeground : colors.primaryForeground }]}>
            {sent ? "Sent" : "Add"}
          </Text>
        </TouchableOpacity>
      )}
      {isFriend && (
        <View style={[styles.friendsChip, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="check" size={12} color={colors.primary} />
          <Text style={[styles.friendsChipText, { color: colors.primary }]}>Friends</Text>
        </View>
      )}
    </View>
  );
}

export default function FriendsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sendFriendRequest, acceptFriendRequest, removeFriend } = useApp();

  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const data = await api.get<Friend[]>("/friends");
      setFriends(data);
    } catch { setFriends([]); }
    setLoading(false);
  };

  const loadRequests = async () => {
    try {
      const data = await api.get<FriendRequest[]>("/friends/requests");
      setRequests(data);
    } catch { setRequests([]); }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!text.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await api.get<SearchResult[]>(`/users/search?q=${encodeURIComponent(text)}`);
        setSearchResults(data);
      } catch { setSearchResults([]); }
    }, 400);
  };

  const handleAccept = async (request: FriendRequest) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await acceptFriendRequest(request.userId);
    setRequests((prev) => prev.filter((r) => r.requestId !== request.requestId));
    await loadFriends();
  };

  const handleDecline = async (request: FriendRequest) => {
    await api.delete(`/friends/${request.userId}`);
    setRequests((prev) => prev.filter((r) => r.requestId !== request.requestId));
  };

  const handleRemove = async (friend: Friend) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await removeFriend(friend.userId);
    setFriends((prev) => prev.filter((f) => f.userId !== friend.userId));
  };

  const tabs: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: "friends", label: "Friends", icon: "users", badge: friends.length },
    { key: "requests", label: "Requests", icon: "user-plus", badge: requests.length > 0 ? requests.length : undefined },
    { key: "find", label: "Find People", icon: "search" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>FRIENDS</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Your bowling circle</Text>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, { borderBottomColor: tab === t.key ? colors.primary : "transparent", borderBottomWidth: 2 }]}
            onPress={() => setTab(t.key)}
          >
            <Feather name={t.icon as any} size={15} color={tab === t.key ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabBtnText, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
            {t.badge !== undefined && t.badge > 0 && (
              <View style={[styles.badge, { backgroundColor: tab === "requests" ? "#ef4444" : colors.primary }]}>
                <Text style={styles.badgeText}>{t.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {tab === "find" && (
        <View style={[styles.searchBar, { backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 8 }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search by username…"
            placeholderTextColor={colors.mutedForeground}
            value={searchText}
            onChangeText={handleSearch}
            autoFocus
          />
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {tab === "friends" && (
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No friends yet</Text>
              <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>Go to Find People to add bowlers</Text>
            </View>
          ) : friends.map((f) => (
            <FriendCard key={f.userId} friend={f} onRemove={() => handleRemove(f)} />
          ))
        )}

        {tab === "requests" && (
          requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="user-plus" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No pending requests</Text>
            </View>
          ) : requests.map((r) => (
            <RequestCard
              key={r.requestId}
              request={r}
              onAccept={() => handleAccept(r)}
              onDecline={() => handleDecline(r)}
            />
          ))
        )}

        {tab === "find" && (
          searchText.trim() === "" ? (
            <View style={styles.emptyContainer}>
              <Feather name="search" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Search for bowlers by username</Text>
            </View>
          ) : searchResults.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground, textAlign: "center", marginTop: 40 }]}>No results</Text>
          ) : searchResults.map((r) => (
            <SearchResultCard
              key={r.id}
              result={r}
              onRequest={() => sendFriendRequest(r.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: 1.5 },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2, letterSpacing: 0.5 },
  tabRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 0 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  tabBtnText: { fontSize: 12, fontWeight: "700" },
  badge: { minWidth: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center", paddingHorizontal: 4 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: "600" },
  emptySubText: { fontSize: 13 },
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, padding: 14 },
  cardAvatar: { width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center" },
  cardAvatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cardInfo: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardUsername: { fontSize: 14, fontWeight: "700" },
  cardStats: { fontSize: 12 },
  timeAgo: { fontSize: 12 },
  proBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 50 },
  proBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  removeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  requestBtns: { flexDirection: "row", gap: 8 },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  declineBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50 },
  addBtnText: { fontSize: 12, fontWeight: "700" },
  friendsChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 50 },
  friendsChipText: { fontSize: 12, fontWeight: "700" },
});
