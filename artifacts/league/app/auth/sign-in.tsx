import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Sign In Failed", err.message ?? "Please check your credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.hero}>
          <View style={[styles.logoBall, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>🎳</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>LEAGUE</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Welcome back, bowler
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>EMAIL</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder="your@email.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.replace("/auth/sign-up")}
          >
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
              Don't have an account?{" "}
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: "space-between" },
  hero: { alignItems: "center", gap: 12 },
  logoBall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logoText: { fontSize: 36 },
  title: { fontSize: 36, fontWeight: "900", letterSpacing: 4 },
  subtitle: { fontSize: 15, fontWeight: "500" },
  form: { gap: 12 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: -4 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "500",
  },
  btn: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { fontSize: 16, fontWeight: "800" },
  switchBtn: { alignItems: "center", paddingVertical: 8 },
  switchText: { fontSize: 14 },
});
