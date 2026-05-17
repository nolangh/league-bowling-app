import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function MFAChallengeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { challengeMFA, signOut } = useAuth();
  const { factorId } = useLocalSearchParams<{ factorId: string }>();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleVerify = async () => {
    const clean = code.replace(/\s/g, "");
    if (clean.length !== 6) { setError("Enter the 6-digit code from your authenticator app."); return; }
    setError("");
    setLoading(true);
    try {
      await challengeMFA(factorId as string, clean);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message ?? "Invalid code. Try again.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try { await signOut(); } catch {}
    router.replace("/auth/sign-in");
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: colors.card }]}>
            <Feather name="shield" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>Two-Factor Auth</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Enter the 6-digit code from your authenticator app to continue.
          </Text>
        </View>

        <View style={styles.codeArea}>
          <TextInput
            ref={inputRef}
            style={[styles.codeInput, { borderColor: error ? "#ef4444" : colors.primary, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder="000000"
            placeholderTextColor={colors.border}
            value={code}
            onChangeText={(t) => { setCode(t.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            textAlign="center"
          />
          {!!error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleVerify}
            disabled={loading || code.length < 6}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Verify</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel — Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 32, justifyContent: "space-between" },
  hero: { alignItems: "center", gap: 14 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 30, fontFamily: "BarlowCondensed_800ExtraBold", letterSpacing: 2 },
  subtitle: { fontSize: 15, fontFamily: "DMSans_400Regular", textAlign: "center", lineHeight: 22 },
  codeArea: { alignItems: "center", gap: 10 },
  codeInput: {
    borderWidth: 2, borderRadius: 18, paddingVertical: 20, paddingHorizontal: 16,
    fontSize: 36, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 14, width: "100%",
  },
  errorText: { color: "#ef4444", fontSize: 13, fontFamily: "DMSans_400Regular" },
  actions: { gap: 12 },
  btn: { borderRadius: 50, paddingVertical: 16, alignItems: "center" },
  btnText: { fontSize: 17, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.5 },
  cancelBtn: { alignItems: "center", paddingVertical: 8 },
  cancelText: { fontSize: 14, fontFamily: "DMSans_400Regular" },
});
