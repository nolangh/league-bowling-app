import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, type League } from "@/context/AppContext";

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "#a8c870",
  INTERMEDIATE: "#60c8ff",
  ADVANCED: "#f5c842",
  EXPERT: "#c8a8e8",
};

const LEVEL_OPTIONS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

function LeagueCard({
  league,
  onJoin,
  onPress,
}: {
  league: League;
  onJoin: () => void;
  onPress: () => void;
}) {
  const colors = useColors();
  const levelColor = LEVEL_COLORS[league.level] ?? colors.primary;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <View style={styles.nameRow}>
            <Text style={[styles.leagueName, { color: colors.foreground }]}>{league.name}</Text>
            {league.type === "private" && (
              <View style={[styles.privateBadge, { backgroundColor: colors.muted }]}>
                <Feather name="lock" size={10} color={colors.mutedForeground} />
              </View>
            )}
            {league.joined && (
              <View style={[styles.joinedBadge, { backgroundColor: colors.primary + "22" }]}>
                <Text style={[styles.joinedBadgeText, { color: colors.primary }]}>JOINED</Text>
              </View>
            )}
            {league.myRole === "admin" && (
              <View style={[styles.adminBadge, { backgroundColor: "#f5c84222" }]}>
                <Text style={[styles.adminBadgeText, { color: "#c8a000" }]}>ADMIN</Text>
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

      {!league.joined && (
        <TouchableOpacity
          style={[
            styles.joinBtn,
            {
              backgroundColor: league.type === "private" ? colors.secondary : colors.primary,
              borderWidth: league.type === "private" ? 1 : 0,
              borderColor: colors.border,
            },
          ]}
          onPress={(e) => { e.stopPropagation(); onJoin(); }}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.joinBtnText,
              { color: league.type === "private" ? colors.foreground : colors.primaryForeground },
            ]}
          >
            {league.type === "private" ? "Request to Join" : "Join League"}
          </Text>
        </TouchableOpacity>
      )}

      {league.joined && (
        <View style={[styles.viewBtn, { backgroundColor: colors.foreground + "0d" }]}>
          <Text style={[styles.viewBtnText, { color: colors.foreground }]}>View League</Text>
          <Feather name="chevron-right" size={14} color={colors.foreground} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function CreateLeagueModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; description: string; type: "public" | "private"; level: string; weeklyChallenge?: string }) => Promise<void>;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [level, setLevel] = useState("INTERMEDIATE");
  const [weeklyChallenge, setWeeklyChallenge] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setName(""); setDescription(""); setType("public");
    setLevel("INTERMEDIATE"); setWeeklyChallenge(""); setError("");
  };

  const handleCreate = async () => {
    if (!name.trim() || !description.trim()) { setError("Name and description are required."); return; }
    setSubmitting(true);
    setError("");
    try {
      await onCreate({ name: name.trim(), description: description.trim(), type, level, weeklyChallenge: weeklyChallenge.trim() || undefined });
      reset();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create league.");
    }
    setSubmitting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }} />
        <View style={[createStyles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[createStyles.title, { color: colors.foreground }]}>Create League</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView contentContainerStyle={[createStyles.body, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
          <Text style={[createStyles.label, { color: colors.foreground }]}>League Name *</Text>
          <TextInput
            style={[createStyles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="e.g. Thunder Lanes Elite"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            maxLength={60}
          />

          <Text style={[createStyles.label, { color: colors.foreground }]}>Description *</Text>
          <TextInput
            style={[createStyles.input, createStyles.multiline, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="What's this league about?"
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={200}
          />

          <Text style={[createStyles.label, { color: colors.foreground }]}>Type</Text>
          <View style={createStyles.toggleRow}>
            {(["public", "private"] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[createStyles.toggleBtn, {
                  backgroundColor: type === t ? colors.foreground : colors.card,
                  borderColor: type === t ? colors.foreground : colors.border,
                }]}
                onPress={() => setType(t)}
              >
                <Feather name={t === "public" ? "globe" : "lock"} size={13} color={type === t ? colors.background : colors.mutedForeground} />
                <Text style={[createStyles.toggleText, { color: type === t ? colors.background : colors.foreground }]}>
                  {t === "public" ? "Public" : "Private"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[createStyles.label, { color: colors.foreground }]}>Skill Level</Text>
          <View style={createStyles.levelGrid}>
            {LEVEL_OPTIONS.map((l) => {
              const lc = LEVEL_COLORS[l] ?? colors.primary;
              const active = level === l;
              return (
                <TouchableOpacity
                  key={l}
                  style={[createStyles.levelBtn, {
                    backgroundColor: active ? lc + "33" : colors.card,
                    borderColor: active ? lc : colors.border,
                  }]}
                  onPress={() => setLevel(l)}
                >
                  <Text style={[createStyles.levelBtnText, { color: active ? lc : colors.mutedForeground }]}>{l}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[createStyles.label, { color: colors.foreground }]}>Weekly Challenge <Text style={{ color: colors.mutedForeground, fontWeight: "400" }}>(optional)</Text></Text>
          <TextInput
            style={[createStyles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
            placeholder="e.g. Hit 5 spares without stepping"
            placeholderTextColor={colors.mutedForeground}
            value={weeklyChallenge}
            onChangeText={setWeeklyChallenge}
            maxLength={120}
          />

          {error ? <Text style={createStyles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[createStyles.createBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
            onPress={handleCreate}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <Text style={[createStyles.createBtnText, { color: colors.primaryForeground }]}>Create League</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function LeaguesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { leagues, joinLeague, createLeague, searchLeagues } = useApp();
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [joinedLeague, setJoinedLeague] = useState<League | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      await searchLeagues(query, filter);
      setSearching(false);
    }, query ? 300 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter]);

  const handleJoin = (league: League) => {
    joinLeague(league.id);
    setJoinedLeague(league);
    setSuccessVisible(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCreate = async (input: Parameters<typeof createLeague>[0]) => {
    const created = await createLeague(input);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push(`/leagues/${created.id}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }} />
      <View style={[styles.header, { paddingTop: 12, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>LEAGUES</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Find your crew</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => setCreateVisible(true)}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={16} color={colors.primaryForeground} />
            <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>Create</Text>
          </TouchableOpacity>
          <View style={[styles.countBadge, { backgroundColor: colors.card }]}>
            <Text style={[styles.countText, { color: colors.foreground }]}>{leagues.length}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search leagues by name, level, or vibe…"
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searching && query.length > 0 ? (
          <Feather name="loader" size={16} color={colors.mutedForeground} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Feather name="x-circle" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : null}
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
        {leagues.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="shield" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No leagues found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {query ? `Nothing matches "${query}"` : "Create one to get started"}
            </Text>
          </View>
        ) : (
          leagues.map((l) => (
            <LeagueCard
              key={l.id}
              league={l}
              onJoin={() => handleJoin(l)}
              onPress={() => router.push(`/leagues/${l.id}` as any)}
            />
          ))
        )}
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

      <CreateLeagueModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreate={handleCreate}
      />
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  createBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  createBtnText: { fontSize: 13, fontWeight: "700" },
  countBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  countText: { fontSize: 16, fontWeight: "800" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500", padding: 0 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 13, fontWeight: "500" },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterPill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 },
  filterText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 20, padding: 16, gap: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTopLeft: { flex: 1, gap: 6 },
  cardTopRight: { alignItems: "flex-end" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  leagueName: { fontSize: 16, fontWeight: "800" },
  privateBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  joinedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  joinedBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  adminBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  adminBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
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
  viewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 50, paddingVertical: 12 },
  viewBtnText: { fontSize: 14, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  successCard: { borderRadius: 24, padding: 28, alignItems: "center", gap: 12, width: "100%" },
  successIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  successBtn: { borderRadius: 50, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  successBtnText: { fontSize: 15, fontWeight: "800" },
});

const createStyles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: "800" },
  body: { paddingHorizontal: 20, paddingTop: 24, gap: 6 },
  label: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3, marginBottom: 4, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  multiline: { height: 80, textAlignVertical: "top" },
  toggleRow: { flexDirection: "row", gap: 10 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 12 },
  toggleText: { fontSize: 14, fontWeight: "700" },
  levelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  levelBtn: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 },
  levelBtnText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  error: { color: "#e05050", fontSize: 13, fontWeight: "600", marginTop: 8 },
  createBtn: { borderRadius: 50, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  createBtnText: { fontSize: 15, fontWeight: "800" },
});
