import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, getRankColor } from "@/context/AppContext";
import { RankBadge } from "@/components/RankBadge";
import { AlleyPicker } from "@/components/AlleyPicker";
import { useSubscription } from "@/lib/revenuecat";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, games, setUserPro, updateSpecs, setHomeAlley } = useApp();
  const { isSubscribed, offerings, purchase, isPurchasing, restore, isRestoring, isConfigured } = useSubscription();

  const [proModalVisible, setProModalVisible] = useState(false);
  const [purchaseConfirmVisible, setPurchaseConfirmVisible] = useState(false);
  const [specsModalVisible, setSpecsModalVisible] = useState(false);
  const [alleyPickerOpen, setAlleyPickerOpen] = useState(false);
  const [draftRevRate, setDraftRevRate] = useState("");
  const [draftBallSpeed, setDraftBallSpeed] = useState("");
  const [draftAxisTilt, setDraftAxisTilt] = useState("");
  const [draftAxisRotation, setDraftAxisRotation] = useState("");
  const [draftPapOver, setDraftPapOver] = useState("");
  const [draftPapUp, setDraftPapUp] = useState("");
  const [draftRelease, setDraftRelease] = useState("");
  const [draftGrip, setDraftGrip] = useState("");
  const [draftHand, setDraftHand] = useState("");

  const rankColor = getRankColor(user.rank);
  const xpPct = user.xp / user.xpToNext;
  const totalChallenges = (user.wins ?? 0) + (user.losses ?? 0);
  const winRate = totalChallenges > 0 ? Math.round(((user.wins ?? 0) / totalChallenges) * 100) : 0;

  const currentOffering = offerings?.current;
  const packageToPurchase = currentOffering?.availablePackages[0];
  const priceString = packageToPurchase?.product?.priceString ?? "$4.99";

  const handleUpgrade = () => {
    if (!isConfigured) {
      setUserPro(true);
      setProModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    setPurchaseConfirmVisible(true);
  };

  const confirmPurchase = async () => {
    if (!packageToPurchase) return;
    setPurchaseConfirmVisible(false);
    try {
      await purchase(packageToPurchase);
      setUserPro(true);
      setProModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (e?.code !== "1") {
        // Non-cancel error
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  const openSpecsModal = () => {
    setDraftRevRate(user.revRate != null ? String(user.revRate) : "");
    setDraftBallSpeed(user.ballSpeed != null ? String(user.ballSpeed) : "");
    setDraftAxisTilt(user.axisTilt != null ? String(user.axisTilt) : "");
    setDraftAxisRotation(user.axisRotation != null ? String(user.axisRotation) : "");
    setDraftPapOver(user.papOver ?? "");
    setDraftPapUp(user.papUp ?? "");
    setDraftRelease(user.releaseStyle ?? "");
    setDraftGrip(user.gripStyle ?? "");
    setDraftHand(user.dominantHand ?? "");
    setSpecsModalVisible(true);
  };

  const saveSpecs = async () => {
    await updateSpecs({
      revRate:      draftRevRate      ? parseInt(draftRevRate, 10)        : null,
      ballSpeed:    draftBallSpeed    ? parseFloat(draftBallSpeed)         : null,
      axisTilt:     draftAxisTilt     ? parseInt(draftAxisTilt, 10)        : null,
      axisRotation: draftAxisRotation ? parseInt(draftAxisRotation, 10)    : null,
      papOver:      draftPapOver.trim()  || null,
      papUp:        draftPapUp.trim()    || null,
      releaseStyle: draftRelease        || null,
      gripStyle:    draftGrip           || null,
      dominantHand: draftHand           || null,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSpecsModalVisible(false);
  };

  const STATS = [
    { label: "CAREER AVG", value: user.careerAvg },
    { label: "HIGH GAME", value: user.highGame },
    { label: "TOTAL GAMES", value: user.totalGames },
    { label: "BSR", value: user.bsr },
  ];

  const PRO_FEATURES = [
    { icon: "zap" as const, text: "Unlimited skill challenges" },
    { icon: "shield" as const, text: "AI score verification" },
    { icon: "bar-chart-2" as const, text: "Advanced BSR analytics" },
    { icon: "users" as const, text: "Private league creation" },
    { icon: "star" as const, text: "Pro badge on your profile" },
    { icon: "trending-up" as const, text: "Priority skill matching" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero */}
        <View style={[styles.heroSection, { paddingTop: 20 }]}>
          <View style={[styles.avatarLarge, { backgroundColor: "#1a3c2a" }]}>
            <Text style={styles.avatarLargeText}>
              {user.name.split(" ").map((n) => n[0]).join("")}
            </Text>
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: colors.foreground }]}>{user.name}</Text>
              {(isSubscribed || user.isPro) && (
                <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.proBadgeText, { color: colors.primaryForeground }]}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={[styles.username, { color: colors.mutedForeground }]}>@{user.username}</Text>
            <RankBadge rank={user.rank} />
          </View>
          {!(isSubscribed || user.isPro) && (
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
              onPress={() => setProModalVisible(true)}
              activeOpacity={0.85}
            >
              <Feather name="star" size={14} color={colors.primaryForeground} />
              <Text style={[styles.upgradeBtnText, { color: colors.primaryForeground }]}>Go Pro</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* XP Bar */}
        <View style={[styles.xpSection, { backgroundColor: colors.card }]}>
          <View style={styles.xpHeader}>
            <Text style={[styles.xpLabel, { color: colors.mutedForeground }]}>LEVEL {user.level}</Text>
            <Text style={[styles.xpCount, { color: colors.foreground }]}>
              {user.xp.toLocaleString()} / {user.xpToNext.toLocaleString()} XP
            </Text>
          </View>
          <View style={[styles.xpBar, { backgroundColor: colors.secondary }]}>
            <View style={[styles.xpFill, { width: `${xpPct * 100}%` as any, backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STATS.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Challenge Record */}
        <View style={[styles.recordCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.recordTitle, { color: colors.mutedForeground }]}>CHALLENGE RECORD</Text>
          <View style={styles.recordRow}>
            <View style={styles.recordStat}>
              <Text style={[styles.recordValue, { color: "#22c55e" }]}>{user.wins ?? 0}</Text>
              <Text style={[styles.recordLabel, { color: colors.mutedForeground }]}>WINS</Text>
            </View>
            <View style={[styles.recordDivider, { backgroundColor: colors.border }]} />
            <View style={styles.recordStat}>
              <Text style={[styles.recordValue, { color: "#ef4444" }]}>{user.losses ?? 0}</Text>
              <Text style={[styles.recordLabel, { color: colors.mutedForeground }]}>LOSSES</Text>
            </View>
            <View style={[styles.recordDivider, { backgroundColor: colors.border }]} />
            <View style={styles.recordStat}>
              <Text style={[styles.recordValue, { color: colors.foreground }]}>{winRate}%</Text>
              <Text style={[styles.recordLabel, { color: colors.mutedForeground }]}>WIN RATE</Text>
            </View>
          </View>
          <View style={[styles.earningsRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.earningsLabel, { color: colors.mutedForeground }]}>BSR RATING</Text>
            <Text style={[styles.earningsValue, { color: colors.primary }]}>
              {user.bsr}
            </Text>
          </View>
        </View>

        {/* Team */}
        <View style={[styles.teamCard, { backgroundColor: colors.darkCard }]}>
          <Feather name="shield" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.teamLabel, { color: colors.primary }]}>TEAM</Text>
            <Text style={[styles.teamName, { color: "#ffffff" }]}>{user.team}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </View>

        {/* Home Alley */}
        <TouchableOpacity
          style={[styles.homeAlleyCard, { backgroundColor: colors.card }]}
          onPress={() => setAlleyPickerOpen(true)}
          activeOpacity={0.85}
        >
          <View style={[styles.homeAlleyIconBox, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="home" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.homeAlleyLabel, { color: colors.mutedForeground }]}>HOME ALLEY</Text>
            {user.homeAlleyName ? (
              <Text style={[styles.homeAlleyName, { color: colors.foreground }]} numberOfLines={1}>
                {user.homeAlleyName}
              </Text>
            ) : (
              <Text style={[styles.homeAlleyEmpty, { color: colors.mutedForeground }]}>
                Tap to set your home alley
              </Text>
            )}
          </View>
          {user.homeAlleyName ? (
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); setHomeAlley(null); Haptics.selectionAsync(); }}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : (
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          )}
        </TouchableOpacity>

        {/* Recent Games Preview */}
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENT GAMES</Text>
          {games.slice(0, 3).map((g) => (
            <View key={g.id} style={[styles.gameRow, { backgroundColor: colors.card }]}>
              <View style={[styles.gameScoreBox, { backgroundColor: colors.primary }]}>
                <Text style={[styles.gameScore, { color: colors.primaryForeground }]}>{g.score}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gameAlley, { color: colors.foreground }]}>{g.alley}</Text>
                <Text style={[styles.gameMeta, { color: colors.mutedForeground }]}>{g.date} · {g.oilPattern}</Text>
              </View>
              {g.verified && <Feather name="check-circle" size={16} color={colors.primary} />}
            </View>
          ))}
        </View>

        {/* Bowling Specs */}
        <TouchableOpacity
          style={[styles.specsCard, { backgroundColor: colors.card }]}
          onPress={openSpecsModal}
          activeOpacity={0.85}
        >
          <View style={styles.specsCardHeader}>
            <View style={styles.specsCardTitleRow}>
              <View style={[styles.specsIconBox, { backgroundColor: colors.primary + "22" }]}>
                <Feather name="activity" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.specsCardTitle, { color: colors.foreground }]}>My Bowling Specs</Text>
            </View>
            <Feather name="edit-2" size={15} color={colors.mutedForeground} />
          </View>
          {(user.revRate || user.ballSpeed || user.axisTilt || user.axisRotation || user.papOver || user.releaseStyle) ? (
            <View style={styles.specsGrid}>
              {user.revRate != null && (
                <View style={[styles.specsChip, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.specsChipVal, { color: colors.foreground }]}>{user.revRate}</Text>
                  <Text style={[styles.specsChipLabel, { color: colors.mutedForeground }]}>rev/min</Text>
                </View>
              )}
              {user.ballSpeed != null && (
                <View style={[styles.specsChip, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.specsChipVal, { color: colors.foreground }]}>{user.ballSpeed}</Text>
                  <Text style={[styles.specsChipLabel, { color: colors.mutedForeground }]}>mph</Text>
                </View>
              )}
              {user.axisTilt != null && (
                <View style={[styles.specsChip, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.specsChipVal, { color: colors.foreground }]}>{user.axisTilt}°</Text>
                  <Text style={[styles.specsChipLabel, { color: colors.mutedForeground }]}>tilt</Text>
                </View>
              )}
              {user.axisRotation != null && (
                <View style={[styles.specsChip, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.specsChipVal, { color: colors.foreground }]}>{user.axisRotation}°</Text>
                  <Text style={[styles.specsChipLabel, { color: colors.mutedForeground }]}>rotation</Text>
                </View>
              )}
              {user.papOver && (
                <View style={[styles.specsChip, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.specsChipVal, { color: colors.foreground }]}>{user.papOver}{user.papUp ? ` × ${user.papUp}` : ""}</Text>
                  <Text style={[styles.specsChipLabel, { color: colors.mutedForeground }]}>PAP</Text>
                </View>
              )}
              {user.releaseStyle && (
                <View style={[styles.specsChip, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.specsChipVal, { color: colors.primary }]}>{user.releaseStyle}</Text>
                  <Text style={[styles.specsChipLabel, { color: colors.primary + "99" }]}>release</Text>
                </View>
              )}
              {user.gripStyle && (
                <View style={[styles.specsChip, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.specsChipVal, { color: colors.foreground }]}>{user.gripStyle}</Text>
                  <Text style={[styles.specsChipLabel, { color: colors.mutedForeground }]}>grip</Text>
                </View>
              )}
              {user.dominantHand && (
                <View style={[styles.specsChip, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.specsChipVal, { color: colors.foreground }]}>{user.dominantHand}</Text>
                  <Text style={[styles.specsChipLabel, { color: colors.mutedForeground }]}>hand</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={[styles.specsEmpty, { color: colors.mutedForeground }]}>
              Tap to add your rev rate, PAP, axis tilt and more — useful for drilling balls.
            </Text>
          )}
        </TouchableOpacity>

        {/* Friends & Social */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          {[
            { icon: "circle" as const, label: "Ball Arsenal", href: "/arsenal" as const },
            { icon: "users" as const, label: "Friends", href: "/friends" as const },
            { icon: "shield" as const, label: "Security & Account", href: "/account-security" as const },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.settingsRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => { if (item.href) router.push(item.href as any); }}
            >
              <Feather name={item.icon} size={18} color={colors.primary} />
              <Text style={[styles.settingsLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Settings */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          {[
            { icon: "bell" as const, label: "Notifications" },
            { icon: "shield" as const, label: "Privacy" },
            { icon: "help-circle" as const, label: "Help & Support" },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.settingsRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Feather name={item.icon} size={18} color={colors.mutedForeground} />
              <Text style={[styles.settingsLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Pro Upgrade Modal */}
      <Modal visible={proModalVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setProModalVisible(false)}>
          <Pressable style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={[styles.proHeader, { backgroundColor: colors.darkCard }]}>
              <View style={[styles.proIconBig, { backgroundColor: colors.primary }]}>
                <Feather name="star" size={28} color={colors.primaryForeground} />
              </View>
              <Text style={[styles.proTitle, { color: "#ffffff" }]}>League Pro</Text>
              <Text style={[styles.proPrice, { color: colors.primary }]}>
                {priceString}<Text style={styles.proFreq}>/month</Text>
              </Text>
            </View>
            <View style={styles.featureList}>
              {PRO_FEATURES.map((f) => (
                <View key={f.text} style={styles.featureRow}>
                  <View style={[styles.featureIconBox, { backgroundColor: colors.primary + "22" }]}>
                    <Feather name={f.icon} size={14} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.proBtn, { backgroundColor: colors.primary }]}
              onPress={handleUpgrade}
              disabled={isPurchasing}
              activeOpacity={0.85}
            >
              <Text style={[styles.proBtnText, { color: colors.primaryForeground }]}>
                {isPurchasing ? "Processing..." : `Start Pro — ${priceString}/mo`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn} disabled={isRestoring}>
              <Text style={[styles.restoreText, { color: colors.mutedForeground }]}>
                {isRestoring ? "Restoring..." : "Restore Purchases"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Purchase Confirmation Modal */}
      <Modal visible={purchaseConfirmVisible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setPurchaseConfirmVisible(false)}>
          <Pressable style={[styles.confirmCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Confirm Purchase</Text>
            <Text style={[styles.confirmText, { color: colors.mutedForeground }]}>
              Subscribe to League Pro for {priceString}/month?
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { backgroundColor: colors.secondary }]}
                onPress={() => setPurchaseConfirmVisible(false)}
              >
                <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmOkBtn, { backgroundColor: colors.primary }]}
                onPress={confirmPurchase}
              >
                <Text style={[styles.confirmOkText, { color: colors.primaryForeground }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bowling Specs Edit Modal */}
      <Modal visible={specsModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <Pressable style={styles.overlay} onPress={() => setSpecsModalVisible(false)}>
            <Pressable style={[styles.specsSheet, { backgroundColor: colors.card }]}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Bowling Specs</Text>
              <Text style={[styles.sheetNote, { color: colors.mutedForeground }]}>
                These are private to you — handy for drilling new balls or sharing with your pro shop.
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 8 }}>
                {/* Dominant Hand */}
                <View style={styles.specGroup}>
                  <Text style={[styles.specGroupLabel, { color: colors.mutedForeground }]}>DOMINANT HAND</Text>
                  <View style={styles.pillRow}>
                    {["Right", "Left"].map((h) => (
                      <TouchableOpacity
                        key={h}
                        style={[styles.specPill, { backgroundColor: draftHand === h ? colors.primary : colors.secondary, borderColor: draftHand === h ? colors.primary : colors.border }]}
                        onPress={() => setDraftHand(h)}
                      >
                        <Text style={[styles.specPillText, { color: draftHand === h ? colors.primaryForeground : colors.foreground }]}>{h}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Release Style */}
                <View style={styles.specGroup}>
                  <Text style={[styles.specGroupLabel, { color: colors.mutedForeground }]}>RELEASE STYLE</Text>
                  <View style={styles.pillRow}>
                    {["Stroker", "Tweener", "Cranker", "Two-Handed"].map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.specPill, { backgroundColor: draftRelease === r ? colors.primary : colors.secondary, borderColor: draftRelease === r ? colors.primary : colors.border }]}
                        onPress={() => setDraftRelease(r)}
                      >
                        <Text style={[styles.specPillText, { color: draftRelease === r ? colors.primaryForeground : colors.foreground }]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Grip Style */}
                <View style={styles.specGroup}>
                  <Text style={[styles.specGroupLabel, { color: colors.mutedForeground }]}>GRIP STYLE</Text>
                  <View style={styles.pillRow}>
                    {["Fingertip", "Conventional", "Sarge Easter"].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.specPill, { backgroundColor: draftGrip === g ? colors.primary : colors.secondary, borderColor: draftGrip === g ? colors.primary : colors.border }]}
                        onPress={() => setDraftGrip(g)}
                      >
                        <Text style={[styles.specPillText, { color: draftGrip === g ? colors.primaryForeground : colors.foreground }]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Numbers row: Rev Rate + Ball Speed */}
                <View style={styles.specNumRow}>
                  <View style={[styles.specNumBlock, { flex: 1 }]}>
                    <Text style={[styles.specGroupLabel, { color: colors.mutedForeground }]}>REV RATE (rpm)</Text>
                    <TextInput
                      style={[styles.specInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                      placeholder="e.g. 320"
                      placeholderTextColor={colors.mutedForeground}
                      value={draftRevRate}
                      onChangeText={setDraftRevRate}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.specNumBlock, { flex: 1 }]}>
                    <Text style={[styles.specGroupLabel, { color: colors.mutedForeground }]}>BALL SPEED (mph)</Text>
                    <TextInput
                      style={[styles.specInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                      placeholder="e.g. 17.5"
                      placeholderTextColor={colors.mutedForeground}
                      value={draftBallSpeed}
                      onChangeText={setDraftBallSpeed}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                {/* Numbers row: Axis Tilt + Axis Rotation */}
                <View style={styles.specNumRow}>
                  <View style={[styles.specNumBlock, { flex: 1 }]}>
                    <Text style={[styles.specGroupLabel, { color: colors.mutedForeground }]}>AXIS TILT (°)</Text>
                    <TextInput
                      style={[styles.specInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                      placeholder="e.g. 15"
                      placeholderTextColor={colors.mutedForeground}
                      value={draftAxisTilt}
                      onChangeText={setDraftAxisTilt}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.specNumBlock, { flex: 1 }]}>
                    <Text style={[styles.specGroupLabel, { color: colors.mutedForeground }]}>AXIS ROTATION (°)</Text>
                    <TextInput
                      style={[styles.specInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                      placeholder="e.g. 45"
                      placeholderTextColor={colors.mutedForeground}
                      value={draftAxisRotation}
                      onChangeText={setDraftAxisRotation}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* PAP */}
                <View style={styles.specGroup}>
                  <Text style={[styles.specGroupLabel, { color: colors.mutedForeground }]}>POSITIVE AXIS POINT (PAP)</Text>
                  <View style={styles.specNumRow}>
                    <View style={[styles.specNumBlock, { flex: 1 }]}>
                      <Text style={[styles.specGroupLabel, { color: colors.mutedForeground, fontSize: 9 }]}>OVER</Text>
                      <TextInput
                        style={[styles.specInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                        placeholder='e.g. 4 5/8"'
                        placeholderTextColor={colors.mutedForeground}
                        value={draftPapOver}
                        onChangeText={setDraftPapOver}
                        autoCapitalize="none"
                      />
                    </View>
                    <View style={[styles.specNumBlock, { flex: 1 }]}>
                      <Text style={[styles.specGroupLabel, { color: colors.mutedForeground, fontSize: 9 }]}>UP</Text>
                      <TextInput
                        style={[styles.specInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                        placeholder='e.g. 5/8"'
                        placeholderTextColor={colors.mutedForeground}
                        value={draftPapUp}
                        onChangeText={setDraftPapUp}
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
                onPress={saveSpecs}
                activeOpacity={0.85}
              >
                <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Specs</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSpecsModalVisible(false)} style={styles.cancelBtn}>
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <AlleyPicker
        visible={alleyPickerOpen}
        onClose={() => setAlleyPickerOpen(false)}
        onPick={(a) => setHomeAlley(a)}
        title="Set Home Alley"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 12, paddingHorizontal: 16 },
  heroSection: { flexDirection: "row", alignItems: "center", gap: 14, paddingBottom: 4 },
  avatarLarge: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  avatarLargeText: { color: "#ffffff", fontSize: 24, fontFamily: "BarlowCondensed_800ExtraBold" },
  heroInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  displayName: { fontSize: 22, fontFamily: "BarlowCondensed_800ExtraBold" },
  proBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  proBadgeText: { fontSize: 10, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.5 },
  username: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  upgradeBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  upgradeBtnText: { fontSize: 14, fontFamily: "BarlowCondensed_700Bold" },
  xpSection: { borderRadius: 16, padding: 14, gap: 10 },
  xpHeader: { flexDirection: "row", justifyContent: "space-between" },
  xpLabel: { fontSize: 11, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.5 },
  xpCount: { fontSize: 12, fontFamily: "BarlowCondensed_600SemiBold" },
  xpBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", borderRadius: 16, padding: 14, alignItems: "center", gap: 4 },
  statValue: { fontSize: 34, fontFamily: "BarlowCondensed_800ExtraBold" },
  statLabel: { fontSize: 9, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.8 },
  // Challenge Record
  recordCard: { borderRadius: 16, padding: 16, gap: 12 },
  recordTitle: { fontSize: 11, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1 },
  recordRow: { flexDirection: "row", alignItems: "center" },
  recordStat: { flex: 1, alignItems: "center", gap: 4 },
  recordDivider: { width: 1, height: 40 },
  recordValue: { fontSize: 36, fontFamily: "BarlowCondensed_800ExtraBold" },
  recordLabel: { fontSize: 9, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.8 },
  earningsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1 },
  earningsLabel: { fontSize: 11, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1 },
  earningsValue: { fontSize: 22, fontFamily: "BarlowCondensed_800ExtraBold" },
  // Team
  teamCard: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  teamLabel: { fontSize: 9, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.8 },
  teamName: { fontSize: 18, fontFamily: "BarlowCondensed_700Bold" },
  homeAlleyCard: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  homeAlleyIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  homeAlleyLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  homeAlleyName: { fontSize: 15, fontWeight: "700" },
  homeAlleyEmpty: { fontSize: 13, fontWeight: "500" },
  // Recent Games
  recentSection: { gap: 8 },
  sectionTitle: { fontSize: 12, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1 },
  gameRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12 },
  gameScoreBox: { width: 46, height: 46, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  gameScore: { fontSize: 20, fontFamily: "BarlowCondensed_800ExtraBold" },
  gameAlley: { fontSize: 13, fontFamily: "BarlowCondensed_700Bold" },
  gameMeta: { fontSize: 11, marginTop: 2, fontFamily: "DMSans_400Regular" },
  // Payment
  paymentCard: { borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  paymentIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  paymentLabel: { fontSize: 9, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.8, marginBottom: 2 },
  paymentValue: { fontSize: 14, fontFamily: "DMSans_500Medium" },
  // Settings
  settingsCard: { borderRadius: 16, overflow: "hidden", marginBottom: 8 },
  settingsRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  settingsLabel: { flex: 1, fontSize: 15, fontFamily: "DMSans_500Medium" },
  // Modals
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  bottomSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    overflow: "hidden",
    gap: 0,
  },
  paymentSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 14,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  sheetTitle: { fontSize: 24, fontFamily: "BarlowCondensed_800ExtraBold" },
  sheetNote: { fontSize: 13, lineHeight: 20, fontFamily: "DMSans_400Regular" },
  fieldLabel: { fontSize: 11, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1 },
  providerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  providerPill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 9 },
  providerPillText: { fontSize: 14, fontFamily: "BarlowCondensed_600SemiBold" },
  handleInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
  },
  saveBtn: { borderRadius: 50, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontFamily: "BarlowCondensed_700Bold" },
  cancelBtn: { alignItems: "center", paddingVertical: 6 },
  cancelBtnText: { fontSize: 14, fontFamily: "DMSans_500Medium" },
  // Pro modal
  proHeader: { alignItems: "center", padding: 28, gap: 10 },
  proIconBig: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  proTitle: { fontSize: 28, fontFamily: "BarlowCondensed_800ExtraBold" },
  proPrice: { fontSize: 38, fontFamily: "BarlowCondensed_800ExtraBold" },
  proFreq: { fontSize: 16, fontFamily: "DMSans_400Regular" },
  featureList: { padding: 20, gap: 12 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  featureText: { fontSize: 15, fontFamily: "DMSans_500Medium" },
  proBtn: { marginHorizontal: 20, borderRadius: 50, paddingVertical: 16, alignItems: "center" },
  proBtnText: { fontSize: 16, fontFamily: "BarlowCondensed_700Bold" },
  restoreBtn: { alignItems: "center", paddingVertical: 14 },
  restoreText: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  // Purchase confirm
  confirmCard: { margin: 32, borderRadius: 24, padding: 24, gap: 12, alignItems: "center" },
  confirmTitle: { fontSize: 22, fontFamily: "BarlowCondensed_800ExtraBold" },
  confirmText: { fontSize: 14, textAlign: "center", lineHeight: 20, fontFamily: "DMSans_400Regular" },
  confirmBtns: { flexDirection: "row", gap: 12, width: "100%", marginTop: 8 },
  confirmCancelBtn: { flex: 1, borderRadius: 50, paddingVertical: 14, alignItems: "center" },
  confirmCancelText: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold" },
  confirmOkBtn: { flex: 1, borderRadius: 50, paddingVertical: 14, alignItems: "center" },
  confirmOkText: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold" },
  // Bowling Specs card
  specsCard: { borderRadius: 16, padding: 16, gap: 12 },
  specsCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  specsCardTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  specsIconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  specsCardTitle: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold" },
  specsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specsChip: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center", minWidth: 64 },
  specsChipVal: { fontSize: 18, fontFamily: "BarlowCondensed_800ExtraBold" },
  specsChipLabel: { fontSize: 9, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.5 },
  specsEmpty: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 18 },
  // Bowling Specs modal
  specsSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 14,
    maxHeight: "90%",
  },
  specGroup: { gap: 8 },
  specGroupLabel: { fontSize: 11, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specPill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 9 },
  specPillText: { fontSize: 14, fontFamily: "BarlowCondensed_600SemiBold" },
  specNumRow: { flexDirection: "row", gap: 10 },
  specNumBlock: { gap: 6 },
  specInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
  },
});
