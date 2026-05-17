import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Switch, Alert, ActivityIndicator, Platform,
  Modal, Pressable, KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Section = "email" | "password" | "mfa-phone" | "mfa-verify" | null;

export default function AccountSecurityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    user, signOut,
    biometricAvailable, biometricEnabled, biometricType,
    mfaEnabled, mfaPhone, mfaFactorId,
    enableBiometric, disableBiometric,
    updateEmail, updatePassword,
    enrollPhoneMFA, sendMFACode, verifyMFA, unenrollMFA,
    refreshMFAState,
  } = useAuth();

  const [bioModalVisible, setBioModalVisible] = useState(false);
  const [bioPassword, setBioPassword] = useState("");
  const [bioStep, setBioStep] = useState<"password" | "verifying" | "success">("password");
  const [bioError, setBioError] = useState("");

  const [open, setOpen] = useState<Section>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [emailDraft, setEmailDraft] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [mfaPhoneDraft, setMfaPhoneDraft] = useState("");
  const [mfaPendingFactorId, setMfaPendingFactorId] = useState("");
  const [mfaChallengeId, setMfaChallengeId] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaResending, setMfaResending] = useState(false);

  useEffect(() => { refreshMFAState(); }, []);

  const toggle = (section: Section) => {
    setOpen((prev) => prev === section ? null : section);
    setError(""); setSuccess("");
  };

  const handleEmailChange = async () => {
    if (!emailDraft.trim()) { setError("Enter a new email address."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await updateEmail(emailDraft.trim().toLowerCase());
      setSuccess("Check your new email address for a confirmation link.");
      setEmailDraft(""); setOpen(null);
    } catch (e: any) { setError(e.message ?? "Failed to update email."); }
    finally { setLoading(false); }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) { setError("Fill in both password fields."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await updatePassword(newPassword);
      setSuccess("Password updated successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setOpen(null);
    } catch (e: any) { setError(e.message ?? "Failed to update password."); }
    finally { setLoading(false); }
  };

  const handleMFAStart = () => {
    setError(""); setSuccess("");
    setMfaPhoneDraft(""); setMfaCode(""); setMfaPendingFactorId(""); setMfaChallengeId("");
    setOpen("mfa-phone");
  };

  const handleMFASendCode = async () => {
    const phone = mfaPhoneDraft.trim();
    // Accept E.164 (e.g. +14155551234). 8–15 digits after the +.
    if (!/^\+\d{8,15}$/.test(phone)) {
      setError("Enter your phone in international format, e.g. +14155551234.");
      return;
    }
    setLoading(true); setError(""); setSuccess("");
    try {
      const { factorId, challengeId } = await enrollPhoneMFA(phone);
      setMfaPendingFactorId(factorId);
      setMfaChallengeId(challengeId);
      setOpen("mfa-verify");
      setSuccess(`We texted a 6-digit code to ${phone}.`);
    } catch (e: any) {
      setError(e.message ?? "Could not send verification code. Make sure SMS is enabled in your Supabase project.");
    } finally { setLoading(false); }
  };

  const handleMFAResend = async () => {
    if (!mfaPendingFactorId) return;
    setMfaResending(true); setError(""); setSuccess("");
    try {
      const { challengeId } = await sendMFACode(mfaPendingFactorId);
      setMfaChallengeId(challengeId);
      setSuccess("New code sent.");
      setMfaCode("");
    } catch (e: any) {
      setError(e.message ?? "Could not resend code.");
    } finally { setMfaResending(false); }
  };

  const handleMFAVerify = async () => {
    const clean = mfaCode.replace(/\s/g, "");
    if (clean.length !== 6) { setError("Enter the 6-digit code we texted you."); return; }
    if (!mfaPendingFactorId || !mfaChallengeId) { setError("Verification session expired. Tap Resend code."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await verifyMFA(mfaPendingFactorId, mfaChallengeId, clean);
      setSuccess("Two-factor authentication is now enabled.");
      setOpen(null);
      setMfaPhoneDraft(""); setMfaCode(""); setMfaPendingFactorId(""); setMfaChallengeId("");
    } catch (e: any) {
      setError(e.message ?? "Invalid code. Try again.");
      setMfaCode("");
    } finally { setLoading(false); }
  };

  const handleMFADisable = () => {
    Alert.alert(
      "Disable 2FA",
      "This will remove SMS two-factor authentication from your account. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable", style: "destructive",
          onPress: async () => {
            if (!mfaFactorId) return;
            setLoading(true); setError(""); setSuccess("");
            try {
              await unenrollMFA(mfaFactorId);
              setOpen(null);
              setSuccess("Two-factor authentication disabled.");
            } catch (e: any) {
              setError(e.message ?? "Could not disable 2FA.");
            } finally { setLoading(false); }
          },
        },
      ]
    );
  };

  const handleBiometricToggle = (val: boolean) => {
    if (val) {
      setBioPassword(""); setBioError(""); setBioStep("password");
      setBioModalVisible(true);
    } else {
      Alert.alert(
        "Disable Biometric Login",
        "You'll need to use your password to sign in next time. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable", style: "destructive",
            onPress: async () => {
              try { await disableBiometric(); }
              catch (e: any) { Alert.alert("Error", e.message ?? "Could not disable biometric login."); }
            },
          },
        ]
      );
    }
  };

  const handleConfirmBiometric = async () => {
    const email = user?.email ?? "";
    if (!bioPassword) { setBioError("Enter your current password."); return; }
    if (!email) { setBioError("No email on file for this account."); return; }
    setBioStep("verifying"); setBioError("");
    try {
      await enableBiometric(email, bioPassword);
      setBioStep("success");
      setBioPassword("");
      setTimeout(() => setBioModalVisible(false), 1400);
    } catch (e: any) {
      setBioError(e.message ?? "Could not enable biometric login.");
      setBioStep("password");
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of League?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out", style: "destructive",
          onPress: async () => {
            try { await signOut(); router.replace("/auth/sign-in"); }
            catch (e: any) { Alert.alert("Error", e.message ?? "Could not sign out."); }
          },
        },
      ]
    );
  };

  const Row = ({ icon, label, value, onPress, color }: {
    icon: string; label: string; value?: string; onPress: () => void; color?: string;
  }) => (
    <TouchableOpacity
      style={[styles.settingsRow, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: (color ?? colors.primary) + "20" }]}>
        <Feather name={icon as any} size={17} color={color ?? colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {!!value && <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Security & Account</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        {(!!error || !!success) && (
          <View style={[styles.banner, { backgroundColor: error ? "#ef444420" : colors.primary + "20" }]}>
            <Feather name={error ? "alert-circle" : "check-circle"} size={15} color={error ? "#ef4444" : colors.primary} />
            <Text style={[styles.bannerText, { color: error ? "#ef4444" : colors.primary }]}>{error || success}</Text>
          </View>
        )}

        <Text style={[styles.section, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Row
            icon="mail"
            label="Change Email"
            value={user?.email ?? ""}
            onPress={() => toggle("email")}
          />
          {open === "email" && (
            <View style={[styles.expandArea, { borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                placeholder="New email address"
                placeholderTextColor={colors.mutedForeground}
                value={emailDraft}
                onChangeText={setEmailDraft}
                keyboardType="email-address"
                autoCapitalize="none"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleEmailChange}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : (
                  <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Send Confirmation</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Row
            icon="key"
            label="Change Password"
            onPress={() => toggle("password")}
          />
          {open === "password" && (
            <View style={[styles.expandArea, { borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                placeholder="New password (min 8 chars)"
                placeholderTextColor={colors.mutedForeground}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoFocus
              />
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                placeholder="Confirm new password"
                placeholderTextColor={colors.mutedForeground}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handlePasswordChange}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : (
                  <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={[styles.section, { color: colors.mutedForeground }]}>TWO-FACTOR AUTHENTICATION</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.settingsRow, { borderBottomColor: "transparent" }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="message-square" size={17} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>SMS Text Code</Text>
              <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                {mfaEnabled
                  ? `Enabled${mfaPhone ? ` — ${mfaPhone}` : ""}`
                  : "We'll text you a code at sign-in"}
              </Text>
            </View>
            {loading && !open ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Switch
                value={mfaEnabled || open === "mfa-phone" || open === "mfa-verify"}
                onValueChange={(val) => val ? handleMFAStart() : handleMFADisable()}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            )}
          </View>

          {open === "mfa-phone" && (
            <View style={[styles.expandArea, { borderTopColor: colors.border, gap: 12 }]}>
              <Text style={[styles.expandTitle, { color: colors.foreground }]}>Add your phone number</Text>
              <Text style={[styles.expandBody, { color: colors.mutedForeground }]}>
                Enter your number in international format. We'll text you a 6-digit code to confirm.
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                placeholder="+1 415 555 1234"
                placeholderTextColor={colors.mutedForeground}
                value={mfaPhoneDraft}
                onChangeText={(t) => { setMfaPhoneDraft(t); setError(""); }}
                keyboardType="phone-pad"
                autoFocus
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleMFASendCode}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : (
                  <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Send code</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {open === "mfa-verify" && (
            <View style={[styles.expandArea, { borderTopColor: colors.border, gap: 12 }]}>
              <Text style={[styles.expandTitle, { color: colors.foreground }]}>Enter the 6-digit code</Text>
              <Text style={[styles.expandBody, { color: colors.mutedForeground }]}>
                We texted a code to {mfaPhoneDraft || "your phone"}. It may take a moment to arrive.
              </Text>
              <TextInput
                style={[styles.input, {
                  borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary,
                  textAlign: "center", fontSize: 22, letterSpacing: 8,
                }]}
                placeholder="000000"
                placeholderTextColor={colors.border}
                value={mfaCode}
                onChangeText={(t) => { setMfaCode(t.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleMFAVerify}
                disabled={loading || mfaCode.length < 6}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : (
                  <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Verify & enable</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleMFAResend}
                disabled={mfaResending}
                style={{ paddingVertical: 6, alignSelf: "center" }}
              >
                <Text style={[{ color: colors.primary, fontFamily: "DMSans_500Medium", fontSize: 14 }]}>
                  {mfaResending ? "Sending…" : "Resend code"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={[styles.section, { color: colors.mutedForeground }]}>BIOMETRIC LOGIN</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.settingsRow, { borderBottomColor: "transparent" }]}>
            <View style={[styles.rowIcon, {
              backgroundColor: biometricAvailable ? colors.primary + "20" : colors.border + "60",
            }]}>
              <Feather
                name={biometricType === "face" ? "aperture" : ("fingerprint" as any)}
                size={17}
                color={biometricAvailable ? colors.primary : colors.mutedForeground}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                {biometricType === "face" ? "Face ID" : biometricType === "fingerprint" ? "Fingerprint" : "Biometric Login"}
              </Text>
              <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                {Platform.OS === "web"
                  ? "Open League on your phone to set this up"
                  : !biometricAvailable
                  ? "Enable Face ID or fingerprint in your device settings first"
                  : biometricEnabled
                  ? "Enabled — sign in without your password"
                  : "Tap to set up quick sign-in"}
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              disabled={!biometricAvailable}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={[styles.section, { color: colors.mutedForeground }]}>SESSION</Text>
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: "#ef4444" + "15", borderColor: "#ef4444" + "40" }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={17} color="#ef4444" />
          <Text style={[styles.signOutText, { color: "#ef4444" }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={bioModalVisible} transparent animationType="slide" onRequestClose={() => setBioModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <Pressable
            style={styles.bioOverlay}
            onPress={() => bioStep !== "verifying" && setBioModalVisible(false)}
          >
            <Pressable style={[styles.bioSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
              <View style={[styles.bioHandle, { backgroundColor: colors.border }]} />

              {bioStep === "success" ? (
                <View style={styles.bioSuccess}>
                  <View style={[styles.bioIconBig, { backgroundColor: colors.primary + "25" }]}>
                    <Feather name="check" size={32} color={colors.primary} />
                  </View>
                  <Text style={[styles.bioTitle, { color: colors.foreground }]}>You're all set</Text>
                  <Text style={[styles.bioBody, { color: colors.mutedForeground }]}>
                    Next time you open League, you can sign in with {biometricType === "face" ? "Face ID" : "your fingerprint"}.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={[styles.bioIconBig, { backgroundColor: colors.primary + "25", alignSelf: "center" }]}>
                    <Feather name={biometricType === "face" ? "aperture" : ("fingerprint" as any)} size={32} color={colors.primary} />
                  </View>
                  <Text style={[styles.bioTitle, { color: colors.foreground, textAlign: "center" }]}>
                    Enable {biometricType === "face" ? "Face ID" : "Fingerprint"}
                  </Text>
                  <Text style={[styles.bioBody, { color: colors.mutedForeground, textAlign: "center" }]}>
                    Confirm your current password. We'll securely store your sign-in so you can use {biometricType === "face" ? "Face ID" : "your fingerprint"} next time.
                  </Text>

                  <View style={[styles.bioEmailRow, { backgroundColor: colors.secondary }]}>
                    <Feather name="mail" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.bioEmailText, { color: colors.foreground }]} numberOfLines={1}>
                      {user?.email ?? "your account"}
                    </Text>
                  </View>

                  <TextInput
                    style={[styles.input, { borderColor: bioError ? "#ef4444" : colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                    placeholder="Current password"
                    placeholderTextColor={colors.mutedForeground}
                    value={bioPassword}
                    onChangeText={(t) => { setBioPassword(t); setBioError(""); }}
                    secureTextEntry
                    autoFocus
                    editable={bioStep !== "verifying"}
                  />

                  {!!bioError && (
                    <View style={[styles.bioErrorRow]}>
                      <Feather name="alert-circle" size={13} color="#ef4444" />
                      <Text style={[styles.bioErrorText, { color: "#ef4444" }]}>{bioError}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: bioStep === "verifying" ? 0.7 : 1 }]}
                    onPress={handleConfirmBiometric}
                    disabled={bioStep === "verifying"}
                    activeOpacity={0.85}
                  >
                    {bioStep === "verifying" ? (
                      <ActivityIndicator color={colors.primaryForeground} size="small" />
                    ) : (
                      <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
                        Enable {biometricType === "face" ? "Face ID" : "Fingerprint"}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setBioModalVisible(false)} disabled={bioStep === "verifying"} style={{ paddingVertical: 6 }}>
                    <Text style={[styles.bioCancelText, { color: colors.mutedForeground }]}>Not now</Text>
                  </TouchableOpacity>
                </>
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 0 },
  section: { fontSize: 11, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1.5, marginBottom: 8, marginTop: 20 },
  card: { borderRadius: 20, overflow: "hidden", marginBottom: 4 },
  settingsRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  rowIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  rowLabel: { fontSize: 15, fontFamily: "DMSans_500Medium" },
  rowValue: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 1 },
  expandArea: { padding: 16, gap: 10, borderTopWidth: 1 },
  expandTitle: { fontSize: 16, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.5 },
  expandBody: { fontSize: 13, fontFamily: "DMSans_400Regular", lineHeight: 20 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "DMSans_500Medium" },
  actionBtn: { borderRadius: 50, paddingVertical: 14, alignItems: "center" },
  actionBtnText: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.5 },
  qrWrapper: { alignSelf: "center", borderRadius: 12, padding: 12 },
  secretLabel: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  secretBox: { borderRadius: 10, padding: 12 },
  secretText: { fontSize: 14, fontFamily: "DMSans_500Medium", letterSpacing: 2, textAlign: "center" },
  banner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginBottom: 4 },
  bannerText: { flex: 1, fontSize: 13, fontFamily: "DMSans_400Regular" },
  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 20, borderWidth: 1,
  },
  signOutText: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.8 },
  bioOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  bioSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, gap: 14 },
  bioHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  bioIconBig: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  bioTitle: { fontSize: 22, fontFamily: "BarlowCondensed_800ExtraBold", letterSpacing: 0.5 },
  bioBody: { fontSize: 14, fontFamily: "DMSans_400Regular", lineHeight: 21 },
  bioEmailRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, marginTop: 4,
  },
  bioEmailText: { flex: 1, fontSize: 14, fontFamily: "DMSans_500Medium" },
  bioErrorRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 2 },
  bioErrorText: { fontSize: 13, fontFamily: "DMSans_500Medium", flex: 1 },
  bioCancelText: { fontSize: 14, fontFamily: "DMSans_500Medium", textAlign: "center" },
  bioSuccess: { alignItems: "center", gap: 14, paddingVertical: 8 },
});
