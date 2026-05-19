import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Schedule = "weekly" | "monthly" | null;

export function ScheduledReportModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { user, updateReportSchedule, sendReportNow } = useApp();

  const [schedule, setSchedule] = useState<Schedule>(user.reportSchedule ?? null);
  const [email, setEmail] = useState(user.reportEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (visible) {
      setSchedule(user.reportSchedule ?? null);
      setEmail(user.reportEmail ?? "");
      setSavedMsg("");
    }
  }, [visible, user.reportSchedule, user.reportEmail]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateReportSchedule(schedule, email.trim() || null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedMsg("Schedule saved!");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleSendNow = async () => {
    setSending(true);
    try {
      const result = await sendReportNow();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Report sent!", `Your stat report was sent to ${result.sentTo}.`);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not send report");
    } finally {
      setSending(false);
    }
  };

  const isDirty =
    schedule !== (user.reportSchedule ?? null) ||
    (email.trim() || null) !== (user.reportEmail ?? null);

  const s = StyleSheet.create({
    overlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
    sheet:       { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 40, maxHeight: "90%" },
    handle:      { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
    header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 4 },
    title:       { fontSize: 18, fontWeight: "700" },
    closeBtn:    { padding: 4 },
    subtitle:    { fontSize: 13, paddingHorizontal: 20, marginBottom: 20 },
    sectionLabel:{ fontSize: 11, fontWeight: "700", letterSpacing: 0.8, paddingHorizontal: 20, marginBottom: 10 },
    optionRow:   { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 20 },
    optionCard:  { flex: 1, borderRadius: 16, borderWidth: 1.5, padding: 16, alignItems: "center", gap: 6 },
    optionIcon:  { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    optionLabel: { fontSize: 14, fontWeight: "700" },
    optionSub:   { fontSize: 11, textAlign: "center" },
    offCard:     { marginHorizontal: 20, borderRadius: 16, borderWidth: 1.5, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
    offIcon:     { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    offLabel:    { fontSize: 14, fontWeight: "600" },
    emailSection:{ paddingHorizontal: 20, marginBottom: 24 },
    inputLabel:  { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 8 },
    input:       { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
    inputHint:   { fontSize: 12, marginTop: 6 },
    footer:      { paddingHorizontal: 20, gap: 10 },
    saveBtn:     { paddingVertical: 15, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
    saveBtnText: { fontSize: 16, fontWeight: "700" },
    sendBtn:     { paddingVertical: 13, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, borderWidth: 1.5 },
    sendBtnText: { fontSize: 14, fontWeight: "600" },
    savedBadge:  { alignItems: "center", paddingVertical: 6 },
    savedText:   { fontSize: 13, fontWeight: "600" },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable style={s.overlay} onPress={onClose}>
          <Pressable style={[s.sheet, { backgroundColor: colors.card }]}>
            <View style={[s.handle, { backgroundColor: colors.border }]} />

            <View style={s.header}>
              <Text style={[s.title, { color: colors.foreground }]}>Scheduled Reports</Text>
              <TouchableOpacity style={s.closeBtn} onPress={onClose}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[s.subtitle, { color: colors.mutedForeground }]}>
              Receive your stats by email automatically — career avg, high game, and a full CSV.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
              <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>FREQUENCY</Text>

              <View style={s.optionRow}>
                {(["weekly", "monthly"] as const).map((opt) => {
                  const active = schedule === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        s.optionCard,
                        {
                          backgroundColor: active ? colors.primary + "18" : colors.background,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => { setSchedule(opt); Haptics.selectionAsync(); }}
                      activeOpacity={0.75}
                    >
                      <View style={[s.optionIcon, { backgroundColor: active ? colors.primary + "28" : colors.secondary }]}>
                        <Feather
                          name={opt === "weekly" ? "calendar" : "clock"}
                          size={18}
                          color={active ? colors.primary : colors.mutedForeground}
                        />
                      </View>
                      <Text style={[s.optionLabel, { color: active ? colors.primary : colors.foreground }]}>
                        {opt === "weekly" ? "Weekly" : "Monthly"}
                      </Text>
                      <Text style={[s.optionSub, { color: colors.mutedForeground }]}>
                        {opt === "weekly" ? "Every Monday" : "1st of the month"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[
                  s.offCard,
                  {
                    backgroundColor: schedule === null ? colors.secondary : "transparent",
                    borderColor: schedule === null ? colors.border : colors.border + "66",
                  },
                ]}
                onPress={() => { setSchedule(null); Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <View style={[s.offIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="bell-off" size={16} color={colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.offLabel, { color: schedule === null ? colors.foreground : colors.mutedForeground }]}>
                    Off
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
                    Don't send scheduled reports
                  </Text>
                </View>
                {schedule === null && (
                  <Feather name="check" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>

              <View style={s.emailSection}>
                <Text style={[s.inputLabel, { color: colors.mutedForeground }]}>DELIVERY EMAIL</Text>
                <TextInput
                  style={[s.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={[s.inputHint, { color: colors.mutedForeground }]}>
                  Leave blank to use your account email.
                </Text>
              </View>

              <View style={s.footer}>
                {savedMsg ? (
                  <View style={s.savedBadge}>
                    <Text style={[s.savedText, { color: colors.primary }]}>
                      <Feather name="check" size={13} color={colors.primary} /> {savedMsg}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[
                    s.saveBtn,
                    { backgroundColor: isDirty ? colors.primary : colors.border, opacity: saving ? 0.7 : 1 },
                  ]}
                  onPress={handleSave}
                  disabled={saving || !isDirty}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <Feather name="check" size={16} color={isDirty ? colors.primaryForeground : colors.mutedForeground} />
                  )}
                  <Text style={[s.saveBtnText, { color: isDirty ? colors.primaryForeground : colors.mutedForeground }]}>
                    {saving ? "Saving…" : "Save Schedule"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.sendBtn, { borderColor: colors.border, opacity: sending ? 0.7 : 1 }]}
                  onPress={handleSendNow}
                  disabled={sending}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Feather name="send" size={15} color={colors.primary} />
                  )}
                  <Text style={[s.sendBtnText, { color: colors.primary }]}>
                    {sending ? "Sending…" : "Send report now"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
