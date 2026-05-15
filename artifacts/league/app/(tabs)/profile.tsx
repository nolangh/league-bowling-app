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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, getRankColor } from "@/context/AppContext";
import { RankBadge } from "@/components/RankBadge";
import { useSubscription } from "@/lib/revenuecat";

const PAYMENT_PROVIDERS = ["Venmo", "Cash App", "Zelle", "PayPal", "Apple Pay"];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, games, setUserPro, updatePaymentInfo } = useApp();
  const { isSubscribed, offerings, purchase, isPurchasing, restore, isRestoring, isConfigured } = useSubscription();

  const [proModalVisible, setProModalVisible] = useState(false);
  const [purchaseConfirmVisible, setPurchaseConfirmVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(user.paymentProvider ?? "");
  const [paymentHandle, setPaymentHandle] = useState(user.paymentHandle ?? "");

  const rankColor = getRankColor(user.rank);
  const xpPct = user.xp / user.xpToNext;
  const totalChallenges = (user.wins ?? 0) + (user.losses ?? 0);
  const winRate = totalChallenges > 0 ? Math.round(((user.wins ?? 0) / totalChallenges) * 100) : 0;
  const earnings = user.earnings ?? 0;

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

  const handleSavePayment = async () => {
    if (!selectedProvider || !paymentHandle.trim()) return;
    await updatePaymentInfo(selectedProvider, paymentHandle.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPaymentModalVisible(false);
  };

  const openPaymentModal = () => {
    setSelectedProvider(user.paymentProvider ?? "");
    setPaymentHandle(user.paymentHandle ?? "");
    setPaymentModalVisible(true);
  };

  const STATS = [
    { label: "CAREER AVG", value: user.careerAvg },
    { label: "HIGH GAME", value: user.highGame },
    { label: "TOTAL GAMES", value: user.totalGames },
    { label: "RATING", value: user.rating },
  ];

  const PRO_FEATURES = [
    { icon: "zap" as const, text: "Unlimited money challenges" },
    { icon: "shield" as const, text: "AI score verification" },
    { icon: "bar-chart-2" as const, text: "Advanced analytics" },
    { icon: "users" as const, text: "Private league creation" },
    { icon: "star" as const, text: "Pro badge on your profile" },
    { icon: "trending-up" as const, text: "Priority skill matching" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero */}
        <View style={[styles.heroSection, { paddingTop: insets.top + 20 }]}>
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
            <Text style={[styles.earningsLabel, { color: colors.mutedForeground }]}>NET EARNINGS</Text>
            <Text style={[styles.earningsValue, { color: earnings >= 0 ? "#22c55e" : "#ef4444" }]}>
              {earnings >= 0 ? "+" : ""}${Math.abs(earnings).toFixed(2)}
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

        {/* Payment Method */}
        <TouchableOpacity
          style={[styles.paymentCard, { backgroundColor: colors.card }]}
          onPress={openPaymentModal}
          activeOpacity={0.85}
        >
          <View style={[styles.paymentIconBox, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="dollar-sign" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.paymentLabel, { color: colors.mutedForeground }]}>PAYMENT METHOD</Text>
            <Text style={[styles.paymentValue, { color: user.paymentProvider ? colors.foreground : colors.mutedForeground }]}>
              {user.paymentProvider
                ? `${user.paymentProvider}  ·  @${user.paymentHandle}`
                : "Tap to connect your payment"}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Friends & Social */}
        <View style={[styles.settingsCard, { backgroundColor: colors.card }]}>
          {[
            { icon: "users" as const, label: "Friends", href: "/friends" as const },
            { icon: "bookmark" as const, label: "Saved Posts", href: null },
          ].map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.settingsRow, i < 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
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

      {/* Payment Method Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setPaymentModalVisible(false)}>
          <Pressable style={[styles.paymentSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Payment Method</Text>
            <Text style={[styles.sheetNote, { color: colors.mutedForeground }]}>
              Let other bowlers know how to pay you after winning a challenge.
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>SELECT PROVIDER</Text>
            <View style={styles.providerGrid}>
              {PAYMENT_PROVIDERS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.providerPill,
                    {
                      backgroundColor: selectedProvider === p ? colors.primary : colors.secondary,
                      borderColor: selectedProvider === p ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedProvider(p)}
                >
                  <Text style={[styles.providerPillText, { color: selectedProvider === p ? colors.primaryForeground : colors.foreground }]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedProvider !== "" && (
              <>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>YOUR HANDLE</Text>
                <TextInput
                  style={[styles.handleInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                  placeholder={selectedProvider === "Zelle" ? "Phone or email" : "@username"}
                  placeholderTextColor={colors.mutedForeground}
                  value={paymentHandle}
                  onChangeText={setPaymentHandle}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, {
                backgroundColor: selectedProvider && paymentHandle.trim() ? colors.primary : colors.muted,
              }]}
              onPress={handleSavePayment}
              activeOpacity={0.85}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save Payment Info</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPaymentModalVisible(false)} style={styles.cancelBtn}>
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
});
