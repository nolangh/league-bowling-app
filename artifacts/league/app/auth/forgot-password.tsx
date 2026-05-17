import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setError("");
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        {sent ? (
          <View style={styles.successBox}>
            <View style={[styles.successIcon, { backgroundColor: colors.primary + "25" }]}>
              <Feather name="mail" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>Check your inbox</Text>
            <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
              We sent a password reset link to{"\n"}
              <Text style={{ color: colors.foreground, fontFamily: "DMSans_600SemiBold" }}>{email}</Text>
            </Text>
            <Text style={[styles.successHint, { color: colors.mutedForeground }]}>
              Tap the link in the email to set a new password. Check your spam folder if you don't see it.
            </Text>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, marginTop: 8 }]}
              onPress={() => router.replace("/auth/sign-in")}
              activeOpacity={0.85}
            >
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.hero}>
              <View style={[styles.iconCircle, { backgroundColor: colors.card }]}>
                <Feather name="lock" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Reset Password</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Enter your email and we'll send you a reset link.
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL ADDRESS</Text>
              <TextInput
                style={[styles.input, { borderColor: error ? "#ef4444" : colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={(t) => { setEmail(t); setError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoFocus
              />
              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
                onPress={handleReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.switchBtn} onPress={() => router.back()}>
                <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
                  Remembered it?{" "}
                  <Text style={{ color: colors.primary, fontFamily: "DMSans_600SemiBold" }}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  backBtn: { paddingBottom: 16, alignSelf: "flex-start" },
  content: { flex: 1, justifyContent: "space-between" },
  hero: { alignItems: "center", gap: 12, paddingTop: 24 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 32, fontFamily: "BarlowCondensed_800ExtraBold", letterSpacing: 2 },
  subtitle: { fontSize: 15, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 22 },
  form: { gap: 12 },
  label: { fontSize: 11, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1.2, marginBottom: -4 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: "DMSans_500Medium" },
  errorText: { color: "#ef4444", fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: -4 },
  btn: { borderRadius: 50, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  btnText: { fontSize: 17, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.5 },
  switchBtn: { alignItems: "center", paddingVertical: 8 },
  switchText: { fontSize: 14, fontFamily: "DMSans_400Regular" },
  successBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16, paddingHorizontal: 8 },
  successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
  successTitle: { fontSize: 28, fontFamily: "BarlowCondensed_800ExtraBold", letterSpacing: 1 },
  successBody: { fontSize: 15, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 24 },
  successHint: { fontSize: 13, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 20 },
});
