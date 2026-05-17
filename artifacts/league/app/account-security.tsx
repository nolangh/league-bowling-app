import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Switch, Alert, ActivityIndicator, Platform,
  Modal, Pressable, KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { SvgXml } from "react-native-svg";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Section = "email" | "password" | "mfa-setup" | null;

export default function AccountSecurityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    user, session, signOut,
    biometricAvailable, biometricEnabled, biometricType,
    mfaEnabled,
    enableBiometric, disableBiometric,
    updateEmail, updatePassword,
    enrollMFA, verifyMFAEnrollment, unenrollMFA,
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

  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaVerifiedFactorId, setMfaVerifiedFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  useEffect(() => { refreshMFAState(); }, []);

  useEffect(() => {
    if (mfaEnabled) {
      supabase_getFactorId().then(setMfaVerifiedFactorId).catch(() => {});
    }
  }, [mfaEnabled]);

  async function supabase_getFactorId(): Promise<string> {
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase.auth.mfa.listFactors();
    return (data?.totp ?? []).find((f) => f.status === "verified")?.id ?? "";
  }

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

  const handleMFAEnable = async () => {
    setLoading(true); setError(""); setSuccess("");
    try {
      const { qrCode, secret, factorId } = await enrollMFA();
      setMfaQrCode(qrCode); setMfaSecret(secret); setMfaFactorId(factorId);
      setOpen("mfa-setup");
    } catch (e: any) { setError(e.message ?? "Could not start 2FA setup."); }
    finally { setLoading(false); }
  };

  const handleMFAVerify = async () => {
    const clean = mfaCode.replace(/\s/g, "");
    if (clean.length !== 6) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await verifyMFAEnrollment(mfaFactorId, clean);
      setMfaVerifiedFactorId(mfaFactorId);
      setSuccess("Two-factor authentication is now enabled.");
      setOpen(null); setMfaQrCode(""); setMfaSecret(""); setMfaCode("");
    } catch (e: any) { setError(e.message ?? "Invalid code. Try again."); setMfaCode(""); }
    finally { setLoading(false); }
  };

  const handleMFADisable = () => {
    Alert.alert(
      "Disable 2FA",
      "This will remove two-factor authentication from your account. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable", style: "destructive",
          onPress: async () => {
            if (!mfaVerifiedFactorId) return;
            try {
              await unenrollMFA(mfaVerifiedFactorId);
              setMfaVerifiedFactorId(""); setOpen(null);
            } catch (e: any) { setError(e.message ?? "Could not disable 2FA."); }
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

  const qrSvgXml = React.useMemo(() => {
    if (!mfaQrCode) return "";
    try {
      const prefix = "data:image/svg+xml;base64,";
      if (mfaQrCode.startsWith(prefix)) return atob(mfaQrCode.slice(prefix.length));
      return mfaQrCode;
    } catch { return ""; }
  }, [mfaQrCode]);

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
              <Feather name="shield" size={17} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>Authenticator App</Text>
              <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                {mfaEnabled ? "Enabled — TOTP" : "Disabled"}
              </Text>
            </View>
            {loading && !open ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Switch
                value={mfaEnabled}
                onValueChange={(val) => val ? handleMFAEnable() : handleMFADisable()}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            )}
          </View>

          {open === "mfa-setup" && !!qrSvgXml && (
            <View style={[styles.expandArea, { borderTopColor: colors.border, gap: 16 }]}>
              <Text style={[styles.expandTitle, { color: colors.foreground }]}>Scan this QR code</Text>
              <Text style={[styles.expandBody, { color: colors.mutedForeground }]}>
                Open your authenticator app (e.g. Google Authenticator, Authy) and scan the QR code below.
              </Text>
              <View style={[styles.qrWrapper, { backgroundColor: "#fff" }]}>
                <SvgXml xml={qrSvgXml} width={200} height={200} />
              </View>
              <Text style={[styles.secretLabel, { color: colors.mutedForeground }]}>Or enter this key manually:</Text>
              <View style={[styles.secretBox, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.secretText, { color: colors.foreground }]} selectable>{mfaSecret}</Text>
              </View>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.secondary }]}
                placeholder="Enter 6-digit code"
                placeholderTextColor={colors.mutedForeground}
                value={mfaCode}
                onChangeText={(t) => { setMfaCode(t.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleMFAVerify}
                disabled={loading || mfaCode.length < 6}
                activeOpacity={0.85}
              >
                {loading ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : (
                  <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>Activate 2FA</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {biometricAvailable && (
          <>
            <Text style={[styles.section, { color: colors.mutedForeground }]}>BIOMETRIC LOGIN</Text>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={[styles.settingsRow, { borderBottomColor: "transparent" }]}>
                <View style={[styles.rowIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name={biometricType === "face" ? "aperture" : ("fingerprint" as any)} size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    {biometricType === "face" ? "Face ID" : "Fingerprint"}
                  </Text>
                  <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>
                    {biometricEnabled ? "Enabled — sign in without your password" : "Tap to set up quick sign-in"}
                  </Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </>
        )}

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
