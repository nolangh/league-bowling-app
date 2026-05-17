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

export default function UpdatePasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updatePassword, clearPasswordRecovery } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!password || !confirm) return "Please fill in both fields.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  };

  const handleUpdate = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.successBox, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.primary + "25" }]}>
            <Feather name="check" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Password updated!</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Your password has been changed successfully.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, width: "100%" }]}
            onPress={() => { clearPasswordRecovery(); router.replace("/(tabs)"); }}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Continue to App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: colors.card }]}>
            <Feather name="key" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>New Password</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Choose a strong password for your account.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>NEW PASSWORD</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(""); }}
            secureTextEntry
            autoComplete="new-password"
            autoFocus
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>CONFIRM PASSWORD</Text>
          <TextInput
            style={[styles.input, { borderColor: error ? "#ef4444" : colors.border, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            value={confirm}
            onChangeText={(t) => { setConfirm(t); setError(""); }}
            secureTextEntry
            autoComplete="new-password"
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleUpdate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  backBtn: { paddingBottom: 16, alignSelf: "flex-start" },
  hero: { alignItems: "center", gap: 12, paddingTop: 16, paddingBottom: 32 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 32, fontFamily: "BarlowCondensed_800ExtraBold", letterSpacing: 2 },
  subtitle: { fontSize: 15, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 22 },
  form: { gap: 12 },
  label: { fontSize: 11, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1.2, marginBottom: -4 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: "DMSans_500Medium" },
  errorText: { color: "#ef4444", fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: -4 },
  btn: { borderRadius: 50, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  btnText: { fontSize: 17, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.5 },
  successBox: { flex: 1, paddingHorizontal: 32, justifyContent: "center", alignItems: "center", gap: 16 },
  successIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center" },
});
