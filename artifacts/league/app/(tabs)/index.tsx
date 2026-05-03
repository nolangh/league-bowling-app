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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp, type Challenge } from "@/context/AppContext";
import { RankBadge } from "@/components/RankBadge";
import { ChallengeCard } from "@/components/ChallengeCard";
import { StakeModal } from "@/components/StakeModal";

export default function ChallengesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { challenges, myActiveChallenges, user, postChallenge, acceptChallenge } = useApp();
  const [tab, setTab] = useState<"open" | "mine">("open");
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [postScore, setPostScore] = useState("");
  const [postStake, setPostStake] = useState(25);
  const [postModalVisible, setPostModalVisible] = useState(false);

  const handleAccept = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setAcceptModalVisible(true);
  };

  const confirmAccept = () => {
    if (selectedChallenge) {
      acceptChallenge(selectedChallenge.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setAcceptModalVisible(false);
    setSelectedChallenge(null);
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
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

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(["open", "mine"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === t ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {t === "open" ? "OPEN CHALLENGES" : "MY CHALLENGES"}
            </Text>
            {tab === t && (
              <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "open" ? (
          challenges.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="zap-off" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No open challenges right now
              </Text>
            </View>
          ) : (
            challenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} onAccept={() => handleAccept(c)} />
            ))
          )
        ) : myActiveChallenges.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="target" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Post a challenge to get started
            </Text>
          </View>
        ) : (
          myActiveChallenges.map((c) => (
            <ChallengeCard key={c.id} challenge={c} isOwn />
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
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Accept Challenge?
                </Text>
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
                  <Text
                    style={[
                      styles.stakePillText,
                      { color: postStake === s ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    ${s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    postScore && parseInt(postScore) >= 100 && parseInt(postScore) <= 300
                      ? colors.primary
                      : colors.muted,
                },
              ]}
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
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: 1.5 },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2, letterSpacing: 0.5 },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
  },
  postBtnText: { fontSize: 14, fontWeight: "700" },
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12, position: "relative" },
  tabActive: {},
  tabText: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  tabUnderline: { position: "absolute", bottom: 0, height: 2, left: 0, right: 0 },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  bottomSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontWeight: "800" },
  challengePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  challengePreviewName: { fontSize: 14, fontWeight: "700" },
  challengePreviewScore: { fontSize: 22, fontWeight: "800" },
  stakeAmount: { fontSize: 14, fontWeight: "700" },
  sheetNote: { fontSize: 13, lineHeight: 20 },
  confirmBtn: { borderRadius: 50, paddingVertical: 16, alignItems: "center" },
  confirmBtnText: { fontSize: 15, fontWeight: "800" },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelBtnText: { fontSize: 14, fontWeight: "600" },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  scoreInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  stakePicker: { marginBottom: 4 },
  stakePill: {
    borderWidth: 1,
    borderRadius: 50,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 8,
  },
  stakePillText: { fontSize: 14, fontWeight: "700" },
});
