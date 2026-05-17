import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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

const REPORT_TYPES: { value: string; label: string; icon: string; description: string }[] = [
  { value: "fake_score",            label: "Fake Score",         icon: "alert-triangle", description: "Inflated or fabricated bowling scores" },
  { value: "challenge_fraud",       label: "Challenge Fraud",    icon: "dollar-sign",    description: "Refusing to pay out or rigging challenges" },
  { value: "spam",                  label: "Spam",               icon: "zap-off",        description: "Flooding the feed with junk posts" },
  { value: "inappropriate_content", label: "Inappropriate",      icon: "eye-off",        description: "Offensive or banned content" },
  { value: "harassment",            label: "Harassment",         icon: "user-x",         description: "Targeting or bullying another player" },
  { value: "other",                 label: "Other",              icon: "more-horizontal", description: "Something not listed here" },
];

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

  const [reportVisible, setReportVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

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

  const openReport = () => {
    setSelectedType(null);
    setReportReason("");
    setReportDone(false);
    setReportVisible(true);
  };

  const handleSubmitReport = async () => {
    if (!profile || !selectedType) return;
    setReporting(true);
    try {
      await api.post("/reports", {
        reportedUserId: profile.id,
        type: selectedType,
        reason: reportReason.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setReportDone(true);
    } catch (e: any) {
      Alert.alert("Report Failed", e.message ?? "Could not submit report. Try again.");
    } finally {
      setReporting(false);
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
    { label: "HIGH GAME",  value: profile.highGame },
    { label: "TOTAL GAMES",value: profile.totalGames },
    { label: "RATING",     value: profile.rating },
  ];

  return (
    <>
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

          <View style={styles.heroActions}>
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
                  <Text style={[styles.addBtnText, { color: requested ? colors.mutedForeground : colors.primaryForeground }]}>
                    {requested ? "Requested" : "Add Friend"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.reportBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={openReport}
              activeOpacity={0.7}
            >
              <Feather name="flag" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
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

      {/* Report Modal */}
      <Modal visible={reportVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <Pressable style={styles.overlay} onPress={() => !reporting && setReportVisible(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

              {reportDone ? (
                <View style={styles.doneBox}>
                  <View style={[styles.doneIcon, { backgroundColor: colors.primary + "25" }]}>
                    <Feather name="check" size={28} color={colors.primary} />
                  </View>
                  <Text style={[styles.doneTitle, { color: colors.foreground }]}>Report Submitted</Text>
                  <Text style={[styles.doneBody, { color: colors.mutedForeground }]}>
                    Thanks for keeping League fair. We'll review @{profile.username}'s account and take action if needed.
                  </Text>
                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setReportVisible(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.sheetHeader}>
                    <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                      Report @{profile.username}
                    </Text>
                    <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
                      Select the reason that best describes the issue.
                    </Text>
                  </View>

                  <View style={styles.typeGrid}>
                    {REPORT_TYPES.map((rt) => {
                      const selected = selectedType === rt.value;
                      return (
                        <TouchableOpacity
                          key={rt.value}
                          style={[
                            styles.typeCard,
                            {
                              backgroundColor: selected ? colors.primary + "18" : colors.secondary,
                              borderColor: selected ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => setSelectedType(rt.value)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.typeIconWrap, { backgroundColor: selected ? colors.primary + "30" : colors.card }]}>
                            <Feather name={rt.icon as any} size={15} color={selected ? colors.primary : colors.mutedForeground} />
                          </View>
                          <Text style={[styles.typeLabel, { color: selected ? colors.primary : colors.foreground }]}>
                            {rt.label}
                          </Text>
                          <Text style={[styles.typeDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                            {rt.description}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TextInput
                    style={[styles.reasonInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                    placeholder="Add more details… (optional)"
                    placeholderTextColor={colors.mutedForeground}
                    value={reportReason}
                    onChangeText={setReportReason}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      { backgroundColor: selectedType ? "#ef4444" : colors.secondary, opacity: reporting ? 0.7 : 1 },
                    ]}
                    onPress={handleSubmitReport}
                    disabled={!selectedType || reporting}
                    activeOpacity={0.85}
                  >
                    {reporting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={[styles.submitBtnText, { color: selectedType ? "#fff" : colors.mutedForeground }]}>
                        Submit Report
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 15 },
  content: { paddingHorizontal: 20, gap: 14 },
  hero: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 22, fontWeight: "800", color: "#9fe870" },
  heroInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 20, fontWeight: "800" },
  username: { fontSize: 13, fontWeight: "500" },
  proBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  proBadgeText: { fontSize: 10, fontWeight: "800" },
  heroActions: { gap: 8, alignItems: "flex-end" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 50 },
  addBtnText: { fontSize: 13, fontWeight: "700" },
  reportBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  levelBadge: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, borderRadius: 16 },
  levelLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  levelValue: { fontSize: 20, fontWeight: "800" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", borderRadius: 16, padding: 16, gap: 4 },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  teamCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderRadius: 16 },
  teamLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  teamName: { fontSize: 17, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 16 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  sheetHeader: { gap: 4 },
  sheetTitle: { fontSize: 20, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.5 },
  sheetSubtitle: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 18 },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeCard: {
    width: "47.5%", borderRadius: 14, borderWidth: 1.5,
    padding: 12, gap: 6,
  },
  typeIconWrap: { width: 30, height: 30, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  typeLabel: { fontSize: 13, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.3 },
  typeDesc: { fontSize: 11, fontFamily: "DMSans_400Regular", lineHeight: 15 },
  reasonInput: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 14, fontFamily: "DMSans_400Regular", minHeight: 80 },
  submitBtn: { borderRadius: 50, paddingVertical: 15, alignItems: "center" },
  submitBtnText: { fontSize: 16, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.5 },
  doneBox: { alignItems: "center", gap: 14, paddingVertical: 12 },
  doneIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  doneTitle: { fontSize: 22, fontFamily: "BarlowCondensed_800ExtraBold", letterSpacing: 1 },
  doneBody: { fontSize: 14, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 22 },
});
