import React, { useState, useEffect, useCallback } from "react";
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
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { RankBadge } from "@/components/RankBadge";
import { useApp, type League, type LeagueMember, type LeagueAnnouncement, type Rank } from "@/context/AppContext";
import { api } from "@/lib/api";

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "#a8c870",
  INTERMEDIATE: "#60c8ff",
  ADVANCED: "#f5c842",
  EXPERT: "#c8a8e8",
};

type Tab = "announcements" | "members";

const POINT_SYSTEM_LABELS: Record<string, string> = {
  standard: "Standard",
  petersen: "Petersen Points",
  head_to_head: "Head-to-Head",
  total_pins: "Total Pins",
};
function pointSystemLabel(key: string): string {
  return POINT_SYSTEM_LABELS[key] ?? key;
}

function InfoChip({ icon, label, value }: { icon: React.ComponentProps<typeof Feather>["name"]; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.infoChip, { backgroundColor: colors.background }]}>
      <Feather name={icon} size={12} color={colors.mutedForeground} />
      <View style={{ flex: 1, gap: 1 }}>
        <Text style={[styles.infoChipLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoChipValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

function MemberRow({
  member,
  isAdmin,
  isMe,
  onKick,
  onToggleRole,
}: {
  member: LeagueMember;
  isAdmin: boolean;
  isMe: boolean;
  onKick: () => void;
  onToggleRole: () => void;
}) {
  const colors = useColors();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={[memberStyles.row, { backgroundColor: colors.card }]}>
      <View style={[memberStyles.avatar, { backgroundColor: colors.primary + "33" }]}>
        <Text style={[memberStyles.avatarText, { color: colors.primary }]}>
          {member.username.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={memberStyles.info}>
        <View style={memberStyles.nameRow}>
          <Text style={[memberStyles.username, { color: colors.foreground }]}>@{member.username}</Text>
          {member.role === "admin" && (
            <View style={[memberStyles.roleBadge, { backgroundColor: "#f5c84222" }]}>
              <Text style={[memberStyles.roleText, { color: "#c8a000" }]}>ADMIN</Text>
            </View>
          )}
          {isMe && (
            <View style={[memberStyles.roleBadge, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[memberStyles.roleText, { color: colors.primary }]}>YOU</Text>
            </View>
          )}
        </View>
        <View style={memberStyles.statsRow}>
          <RankBadge rank={member.rank as Rank} small />
          <Text style={[memberStyles.stat, { color: colors.mutedForeground }]}>AVG {member.careerAvg}</Text>
          <Text style={[memberStyles.stat, { color: colors.mutedForeground }]}>HIGH {member.highGame}</Text>
        </View>
      </View>
      {isAdmin && !isMe && (
        <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Feather name="more-vertical" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      <Modal visible={menuOpen} transparent animationType="fade">
        <Pressable style={memberStyles.overlay} onPress={() => setMenuOpen(false)}>
          <View style={[memberStyles.menu, { backgroundColor: colors.card }]}>
            <Text style={[memberStyles.menuName, { color: colors.foreground }]}>@{member.username}</Text>
            <TouchableOpacity
              style={memberStyles.menuItem}
              onPress={() => { setMenuOpen(false); onToggleRole(); }}
            >
              <Feather name="shield" size={16} color={colors.foreground} />
              <Text style={[memberStyles.menuItemText, { color: colors.foreground }]}>
                {member.role === "admin" ? "Remove Admin" : "Make Admin"}
              </Text>
            </TouchableOpacity>
            <View style={[memberStyles.menuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity
              style={memberStyles.menuItem}
              onPress={() => { setMenuOpen(false); onKick(); }}
            >
              <Feather name="user-x" size={16} color="#e05050" />
              <Text style={[memberStyles.menuItemText, { color: "#e05050" }]}>Remove from League</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function AnnouncementCard({ ann }: { ann: LeagueAnnouncement }) {
  const colors = useColors();
  const date = new Date(ann.createdAt);
  const timeStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <View style={[annStyles.card, { backgroundColor: colors.card }]}>
      <View style={annStyles.header}>
        <View style={[annStyles.avatar, { backgroundColor: colors.primary + "33" }]}>
          <Text style={[annStyles.avatarText, { color: colors.primary }]}>
            {ann.username.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={annStyles.meta}>
          <Text style={[annStyles.username, { color: colors.foreground }]}>@{ann.username}</Text>
          <View style={annStyles.metaRow}>
            <RankBadge rank={ann.rank as Rank} small />
            <Text style={[annStyles.time, { color: colors.mutedForeground }]}>{timeStr}</Text>
          </View>
        </View>
        <View style={[annStyles.megaphone, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="volume-2" size={14} color={colors.primary} />
        </View>
      </View>
      <Text style={[annStyles.content, { color: colors.foreground }]}>{ann.content}</Text>
    </View>
  );
}

export default function LeagueDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { leagues, joinLeague, leaveLeague, user } = useApp();

  const league = leagues.find((l) => l.id === id);
  const isAdmin = league?.myRole === "admin";
  const isJoined = league?.joined ?? false;

  const [tab, setTab] = useState<Tab>("announcements");
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [announcements, setAnnouncements] = useState<LeagueAnnouncement[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingAnn, setLoadingAnn] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [annComposerVisible, setAnnComposerVisible] = useState(false);
  const [annText, setAnnText] = useState("");
  const [postingAnn, setPostingAnn] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!id) return;
    setLoadingMembers(true);
    try {
      const data = await api.get<LeagueMember[]>(`/leagues/${id}/members`);
      setMembers(data);
    } catch { setMembers([]); }
    setLoadingMembers(false);
  }, [id]);

  const fetchAnnouncements = useCallback(async () => {
    if (!id) return;
    setLoadingAnn(true);
    try {
      const data = await api.get<LeagueAnnouncement[]>(`/leagues/${id}/announcements`);
      setAnnouncements(data);
    } catch { setAnnouncements([]); }
    setLoadingAnn(false);
  }, [id]);

  useEffect(() => {
    fetchAnnouncements();
    fetchMembers();
  }, [fetchAnnouncements, fetchMembers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAnnouncements(), fetchMembers()]);
    setRefreshing(false);
  };

  const handleJoin = () => {
    joinLeague(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLeave = () => {
    Alert.alert(
      "Leave League",
      `Are you sure you want to leave ${league?.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveLeague(id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.back();
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "Could not leave league.");
            }
          },
        },
      ]
    );
  };

  const handlePostAnnouncement = async () => {
    if (!annText.trim() || postingAnn) return;
    setPostingAnn(true);
    try {
      const data = await api.post<LeagueAnnouncement>(`/leagues/${id}/announcements`, { content: annText.trim() });
      setAnnouncements((prev) => [data, ...prev]);
      setAnnText("");
      setAnnComposerVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to post announcement.");
    }
    setPostingAnn(false);
  };

  const handleKickMember = (member: LeagueMember) => {
    Alert.alert(
      "Remove Member",
      `Remove @${member.username} from this league?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/leagues/${id}/members/${member.userId}`);
              setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (e: any) {
              Alert.alert("Error", e?.message ?? "Could not remove member.");
            }
          },
        },
      ]
    );
  };

  const handleToggleRole = async (member: LeagueMember) => {
    const newRole = member.role === "admin" ? "member" : "admin";
    try {
      await api.patch(`/leagues/${id}/members/${member.userId}/role`, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => m.userId === member.userId ? { ...m, role: newRole } : m)
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not update role.");
    }
  };

  if (!league) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const levelColor = LEVEL_COLORS[league.level] ?? colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{league.name}</Text>
          <View style={styles.headerMeta}>
            <View style={[styles.levelPill, { backgroundColor: levelColor + "22" }]}>
              <Text style={[styles.levelText, { color: levelColor }]}>{league.level}</Text>
            </View>
            {league.type === "private" && <Feather name="lock" size={12} color={colors.mutedForeground} />}
          </View>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.card }]}>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: colors.foreground }]}>{league.members}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>MEMBERS</Text>
            </View>
            <View style={[styles.heroStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: colors.foreground }]}>{league.avgScore}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>AVG SCORE</Text>
            </View>
            <View style={[styles.heroStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatVal, { color: colors.foreground }]}>{announcements.length}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.mutedForeground }]}>POSTS</Text>
            </View>
          </View>
          <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>{league.description}</Text>
          {league.weeklyChallenge && (
            <View style={[styles.weeklyChallenge, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="zap" size={13} color={colors.primary} />
              <Text style={[styles.weeklyText, { color: colors.primary }]}>{league.weeklyChallenge}</Text>
            </View>
          )}

          {league.format === "traditional" && (
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.infoCardHeader}>
                <Feather name="award" size={14} color={colors.primary} />
                <Text style={[styles.infoCardTitle, { color: colors.foreground }]}>Traditional League</Text>
              </View>
              <View style={styles.infoGrid}>
                {league.teamSize != null && (
                  <InfoChip icon="users" label="TEAM" value={`${league.teamSize} bowlers`} />
                )}
                {league.seasonWeeks != null && (
                  <InfoChip icon="calendar" label="SEASON" value={`${league.seasonWeeks} weeks${league.seasonStart ? ` from ${league.seasonStart}` : ""}`} />
                )}
                {league.meetDay && league.meetTime && (
                  <InfoChip icon="clock" label="MEETS" value={`${league.meetDay.charAt(0).toUpperCase()}${league.meetDay.slice(1)}s · ${league.meetTime}`} />
                )}
                {league.scoringType && (
                  <InfoChip
                    icon="bar-chart-2"
                    label="SCORING"
                    value={league.scoringType === "handicap"
                      ? `Handicap${league.handicapPercent != null && league.handicapBase != null ? ` (${league.handicapPercent}% of ${league.handicapBase})` : ""}`
                      : "Scratch"}
                  />
                )}
                {league.pointSystem && (
                  <InfoChip icon="target" label="POINTS" value={pointSystemLabel(league.pointSystem)} />
                )}
                {league.absenteeScore != null && league.absenteeScore > 0 && (
                  <InfoChip icon="user-x" label="ABSENTEE" value={String(league.absenteeScore)} />
                )}
              </View>
            </View>
          )}

          {(league.fees || league.rules) && (
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {league.fees && (
                <View style={{ gap: 4 }}>
                  <View style={styles.infoCardHeader}>
                    <Feather name="dollar-sign" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.infoSubTitle, { color: colors.mutedForeground }]}>FEES</Text>
                  </View>
                  <Text style={[styles.infoBody, { color: colors.foreground }]}>{league.fees}</Text>
                </View>
              )}
              {league.rules && (
                <View style={{ gap: 4, marginTop: league.fees ? 12 : 0 }}>
                  <View style={styles.infoCardHeader}>
                    <Feather name="book-open" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.infoSubTitle, { color: colors.mutedForeground }]}>HOUSE RULES</Text>
                  </View>
                  <Text style={[styles.infoBody, { color: colors.foreground }]}>{league.rules}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.actionRow}>
            {!isJoined ? (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={handleJoin}
                activeOpacity={0.85}
              >
                <Feather name="user-plus" size={15} color={colors.primaryForeground} />
                <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                  {league.type === "private" ? "Request to Join" : "Join League"}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                {isAdmin && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary, flex: 1 }]}
                    onPress={() => { setTab("announcements"); setAnnComposerVisible(true); }}
                    activeOpacity={0.85}
                  >
                    <Feather name="volume-2" size={15} color={colors.primaryForeground} />
                    <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Announce</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}
                  onPress={handleLeave}
                  activeOpacity={0.85}
                >
                  <Feather name="log-out" size={15} color={colors.mutedForeground} />
                  <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Leave</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["announcements", "members"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
                {t === "announcements" ? `POSTS` : `MEMBERS`}
              </Text>
              <View style={[styles.tabCount, { backgroundColor: tab === t ? colors.primary + "22" : colors.muted }]}>
                <Text style={[styles.tabCountText, { color: tab === t ? colors.primary : colors.mutedForeground }]}>
                  {t === "announcements" ? announcements.length : members.length}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "announcements" && (
          <View style={styles.section}>
            {loadingAnn ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
            ) : announcements.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="volume-x" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No announcements yet</Text>
                {isAdmin && (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Tap "Announce" to post to your league.
                  </Text>
                )}
              </View>
            ) : (
              announcements.map((a) => <AnnouncementCard key={a.id} ann={a} />)
            )}
          </View>
        )}

        {tab === "members" && (
          <View style={styles.section}>
            {loadingMembers ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
            ) : members.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="users" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No members yet</Text>
              </View>
            ) : (
              members.map((m) => (
                <MemberRow
                  key={m.userId}
                  member={m}
                  isAdmin={isAdmin}
                  isMe={user?.id === m.userId}
                  onKick={() => handleKickMember(m)}
                  onToggleRole={() => handleToggleRole(m)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={annComposerVisible} transparent animationType="slide" presentationStyle="overFullScreen">
        <Pressable style={annComposerStyles.backdrop} onPress={() => setAnnComposerVisible(false)} />
        <View style={[annComposerStyles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[annComposerStyles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setAnnComposerVisible(false)}>
              <Feather name="x" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[annComposerStyles.title, { color: colors.foreground }]}>New Announcement</Text>
            <TouchableOpacity
              onPress={handlePostAnnouncement}
              disabled={!annText.trim() || postingAnn}
              style={[annComposerStyles.postBtn, { backgroundColor: colors.primary, opacity: !annText.trim() || postingAnn ? 0.5 : 1 }]}
            >
              {postingAnn ? (
                <ActivityIndicator color={colors.primaryForeground} size="small" />
              ) : (
                <Text style={[annComposerStyles.postBtnText, { color: colors.primaryForeground }]}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={[annComposerStyles.input, { color: colors.foreground }]}
            placeholder={`Announce something to ${league.name}…`}
            placeholderTextColor={colors.mutedForeground}
            value={annText}
            onChangeText={setAnnText}
            multiline
            autoFocus
            maxLength={500}
          />
          <Text style={[annComposerStyles.charCount, { color: colors.mutedForeground }]}>{annText.length}/500</Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerCenter: { flex: 1, alignItems: "center", marginHorizontal: 12 },
  headerTitle: { fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  levelPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50 },
  levelText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  body: { padding: 16, gap: 12 },
  heroCard: { borderRadius: 20, padding: 18, gap: 14 },
  heroStats: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, alignItems: "center", gap: 4 },
  heroStatVal: { fontSize: 26, fontWeight: "800" },
  heroStatLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  heroStatDivider: { width: 1, height: 36 },
  heroDesc: { fontSize: 14, lineHeight: 20 },
  weeklyChallenge: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 12, borderRadius: 12 },
  weeklyText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 50, paddingVertical: 13, paddingHorizontal: 20 },
  actionBtnText: { fontSize: 14, fontWeight: "700" },
  tabBar: { flexDirection: "row", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13 },
  tabText: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  tabCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 50 },
  tabCountText: { fontSize: 11, fontWeight: "700" },
  section: { gap: 10 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyText: { fontSize: 13, textAlign: "center", paddingHorizontal: 32, lineHeight: 18 },
  infoCard: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 12 },
  infoCardHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoCardTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
  infoSubTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  infoBody: { fontSize: 13, lineHeight: 19 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  infoChip: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, minWidth: "47%", flexGrow: 1 },
  infoChipLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  infoChipValue: { fontSize: 12, fontWeight: "700" },
});

const memberStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 15, fontWeight: "800" },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  username: { fontSize: 14, fontWeight: "700" },
  roleBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 50 },
  roleText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stat: { fontSize: 12, fontWeight: "600" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end", alignItems: "center", paddingHorizontal: 16, paddingBottom: 32 },
  menu: { borderRadius: 20, padding: 8, width: "100%", gap: 2 },
  menuName: { fontSize: 14, fontWeight: "700", paddingHorizontal: 14, paddingVertical: 10 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  menuItemText: { fontSize: 15, fontWeight: "600" },
  menuDivider: { height: 1, marginHorizontal: 14 },
});

const annStyles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 14, fontWeight: "800" },
  meta: { flex: 1, gap: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { fontSize: 14, fontWeight: "700" },
  time: { fontSize: 12, fontWeight: "500" },
  megaphone: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  content: { fontSize: 15, lineHeight: 22 },
});

const annComposerStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, minHeight: 240 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottomWidth: 1, marginBottom: 14 },
  title: { fontSize: 16, fontWeight: "800" },
  postBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 50 },
  postBtnText: { fontSize: 14, fontWeight: "800" },
  input: { fontSize: 16, lineHeight: 24, minHeight: 100, textAlignVertical: "top" },
  charCount: { fontSize: 12, textAlign: "right", marginTop: 8 },
});
