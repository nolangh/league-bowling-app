import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp, type Challenge } from "@/context/AppContext";
import { RankBadge } from "@/components/RankBadge";
import { ChallengeCard } from "@/components/ChallengeCard";

type Tab = "open" | "mine" | "accepted" | "history";

const TAB_LABELS: Record<Tab, string> = {
  open: "OPEN",
  mine: "MY POSTS",
  accepted: "ACTIVE",
  history: "HISTORY",
};

export default function ChallengesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    challenges, myActiveChallenges, acceptedChallenges, completedChallenges,
    postChallenge, acceptChallenge, deleteChallenge, completeChallenge,
  } = useApp();

  const [tab, setTab] = useState<Tab>("open");
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [postScore, setPostScore] = useState("");
  const [postStake, setPostStake] = useState(25);
  const [postModalVisible, setPostModalVisible] = useState(false);

  const tabData: Record<Tab, Challenge[]> = {
    open: challenges,
    mine: myActiveChallenges,
    accepted: acceptedChallenges,
    history: completedChallenges,
  };

  const handleAccept = (c: Challenge) => { setSelectedChallenge(c); setAcceptModalVisible(true); };

  const confirmAccept = () => {
    if (selectedChallenge) {
      acceptChallenge(selectedChallenge.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setAcceptModalVisible(false);
    setSelectedChallenge(null);
  };

  const handleMarkResult = (c: Challenge) => { setSelectedChallenge(c); setResultModalVisible(true); };

  const confirmResult = async (result: "won" | "lost") => {
    if (selectedChallenge) {
      await completeChallenge(selectedChallenge.id, result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setResultModalVisible(false);
    setSelectedChallenge(null);
  };

  const handleDelete = (c: Challenge) => {
    deleteChallenge(c.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePost = () => {
    const score = parseInt(postScore);
    if (!score || score < 100 || score > 300) return;
    postChallenge(score, postStake);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPostModalVisible(false);
    setPostScore("");
    setPostStake(25);
    setTab("mine");
  };

  const STAKES = [10, 25, 50, 75, 100, 150, 200];

  const EMPTY: Record<Tab, { icon: keyof typeof Feather.glyphMap; text: string }> = {
    open: { icon: "zap-off", text: "No open challenges right now" },
    mine: { icon: "target", text: "Post a challenge to get started" },
    accepted: { icon: "activity", text: "Accept a challenge to see it here" },
    history: { icon: "archive", text: "Completed challenges appear here" },
  };

  const currentList = tabData[tab];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }} />
      {/* Header */}
      <View style={[styles.header, { paddingTop: 12, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>CHALLENGES</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Skill-based money matches
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.postBtn, { backgroundColor: colors.primary }]}
          onPress={() => setPostModalVisible(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color={colors.primaryForeground} />
          <Text style={[styles.postBtnText, { color: colors.primaryForeground }]}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabScrollRow, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.tabScrollContent, { borderBottomColor: colors.border }]}
      >
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => {
          const count = t !== "open" ? tabData[t].length : 0;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && { borderBottomColor: colors.primary }]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.foreground : colors.mutedForeground }]}>
                {TAB_LABELS[t]}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.tabBadgeText, { color: colors.primaryForeground }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {currentList.length === 0 ? (
          <View style={styles.empty}>
            <Feather name={EMPTY[tab].icon} size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{EMPTY[tab].text}</Text>
          </View>
        ) : (
          currentList.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              onAccept={tab === "open" ? () => handleAccept(c) : undefined}
              isOwn={tab === "mine"}
              onDelete={tab === "mine" && c.status === "open" ? () => handleDelete(c) : undefined}
              onMarkResult={tab === "accepted" ? () => handleMarkResult(c) : undefined}
              result={tab === "history" ? c.result : undefined}
            />
          ))
        )}
      </ScrollView>

      {/* Accept Modal */}
      <Modal visible={acceptModalVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setAcceptModalVisible(false)}>
          <Pressable style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            {selectedChallenge && (
              <>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Accept Challenge?</Text>
                <View style={[styles.challengePreview, { backgroundColor: colors.secondary }]}>
                  <View style={[styles.avatar, { backgroundColor: selectedChallenge.avatarColor }]}>
                    <Text style={styles.avatarText}>{selectedChallenge.initials}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.challengePreviewName, { color: colors.foreground }]}>
                      {selectedChallenge.username}
                    </Text>
                    <RankBadge rank={selectedChallenge.rank} />
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={[styles.challengePreviewScore, { color: colors.foreground }]}>
                      {selectedChallenge.postedScore}
                    </Text>
                    <Text style={[styles.stakeAmount, { color: colors.primary }]}>
                      ${selectedChallenge.stake}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.sheetNote, { color: colors.mutedForeground }]}>
                  You'll be matched when your game score is verified. Funds are held in escrow until the match resolves.
                </Text>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                  onPress={confirmAccept}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.confirmBtnText, { color: colors.primaryForeground }]}>
                    Accept — ${selectedChallenge.stake} stake
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setAcceptModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Mark Result Modal */}
      <Modal visible={resultModalVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setResultModalVisible(false)}>
          <Pressable style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Mark Result</Text>
            {selectedChallenge && (
              <>
                <View style={[styles.challengePreview, { backgroundColor: colors.secondary }]}>
                  <View style={[styles.avatar, { backgroundColor: selectedChallenge.avatarColor }]}>
                    <Text style={styles.avatarText}>{selectedChallenge.initials}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.challengePreviewName, { color: colors.foreground }]}>
                      vs {selectedChallenge.username}
                    </Text>
                    <Text style={[styles.stakeAmount, { color: colors.primary }]}>
                      ${selectedChallenge.stake} stake
                    </Text>
                  </View>
                  <Text style={[styles.challengePreviewScore, { color: colors.foreground }]}>
                    {selectedChallenge.postedScore}
                  </Text>
                </View>
                <Text style={[styles.sheetNote, { color: colors.mutedForeground }]}>
                  Record your honest result. Stats and earnings update immediately.
                </Text>
                <View style={styles.resultBtns}>
                  <TouchableOpacity
                    style={[styles.resultBtn, { backgroundColor: "#22c55e" }]}
                    onPress={() => confirmResult("won")}
                    activeOpacity={0.85}
                  >
                    <Feather name="trending-up" size={20} color="#fff" />
                    <Text style={styles.resultBtnText}>I WON</Text>
                    <Text style={styles.resultBtnSub}>+${selectedChallenge.stake}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resultBtn, { backgroundColor: "#ef4444" }]}
                    onPress={() => confirmResult("lost")}
                    activeOpacity={0.85}
                  >
                    <Feather name="trending-down" size={20} color="#fff" />
                    <Text style={styles.resultBtnText}>I LOST</Text>
                    <Text style={styles.resultBtnSub}>-${selectedChallenge.stake}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setResultModalVisible(false)} style={styles.cancelBtn}>
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Post Challenge Modal */}
      <Modal visible={postModalVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setPostModalVisible(false)}>
          <Pressable style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Post a Challenge</Text>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>YOUR SCORE</Text>
            <TextInput
              style={[styles.scoreInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
              placeholder="e.g. 265"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              value={postScore}
              onChangeText={setPostScore}
              maxLength={3}
            />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>STAKE AMOUNT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stakePicker}>
              {STAKES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.stakePill,
                    {
                      backgroundColor: postStake === s ? colors.primary : colors.secondary,
                      borderColor: postStake === s ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setPostStake(s)}
                >
                  <Text style={[styles.stakePillText, { color: postStake === s ? colors.primaryForeground : colors.foreground }]}>
                    ${s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.confirmBtn, {
                backgroundColor:
                  postScore && parseInt(postScore) >= 100 && parseInt(postScore) <= 300
                    ? colors.primary : colors.muted,
              }]}
              onPress={handlePost}
              activeOpacity={0.85}
            >
              <Text style={[styles.confirmBtnText, { color: colors.primaryForeground }]}>
                Post Challenge
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPostModalVisible(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
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
  headerTitle: { fontSize: 34, fontFamily: "BarlowCondensed_800ExtraBold", letterSpacing: 2 },
  headerSub: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2, letterSpacing: 0.3 },
  postBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50 },
  postBtnText: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold" },
  tabScrollRow: { flexGrow: 0 },
  tabScrollContent: { paddingHorizontal: 12, borderBottomWidth: 1 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 12, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1 },
  tabBadge: { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, justifyContent: "center", alignItems: "center" },
  tabBadgeText: { fontSize: 9, fontFamily: "BarlowCondensed_700Bold" },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "DMSans_500Medium" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  bottomSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 24, fontFamily: "BarlowCondensed_800ExtraBold" },
  challengePreview: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontFamily: "BarlowCondensed_700Bold", fontSize: 15 },
  challengePreviewName: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold" },
  challengePreviewScore: { fontSize: 26, fontFamily: "BarlowCondensed_800ExtraBold" },
  stakeAmount: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold" },
  sheetNote: { fontSize: 13, lineHeight: 20, fontFamily: "DMSans_400Regular" },
  confirmBtn: { borderRadius: 50, paddingVertical: 16, alignItems: "center" },
  confirmBtnText: { fontSize: 16, fontFamily: "BarlowCondensed_700Bold" },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelBtnText: { fontSize: 14, fontFamily: "DMSans_500Medium" },
  fieldLabel: { fontSize: 11, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1 },
  scoreInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 22,
    fontFamily: "BarlowCondensed_700Bold",
    textAlign: "center",
  },
  stakePicker: { marginBottom: 4 },
  stakePill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 18, paddingVertical: 10, marginRight: 8 },
  stakePillText: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold" },
  resultBtns: { flexDirection: "row", gap: 12 },
  resultBtn: { flex: 1, borderRadius: 16, padding: 18, alignItems: "center", gap: 6 },
  resultBtnText: { fontSize: 20, fontFamily: "BarlowCondensed_800ExtraBold", color: "#fff" },
  resultBtnSub: { fontSize: 13, fontFamily: "BarlowCondensed_600SemiBold", color: "rgba(255,255,255,0.85)" },
});
