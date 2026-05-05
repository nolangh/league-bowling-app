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
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (username.length < 3) {
      Alert.alert("Error", "Username must be at least 3 characters");
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, username.toUpperCase());
      // Session is set immediately — expo-router's AuthGuard will redirect to tabs
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Sign Up Failed", err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={[styles.logoBall, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>🎳</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>LEAGUE</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Create your bowler profile
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

          <Text style={[styles.label, { color: colors.mutedForeground }]}>BOWLER TAG</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder="Striker_AC"
            placeholderTextColor={colors.mutedForeground}
            value={username}
            onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, ""))}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={16}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>CONFIRM PASSWORD</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
            placeholder="••••••••"
            placeholderTextColor={colors.mutedForeground}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => router.replace("/auth/sign-in")}
          >
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
              Already have an account?{" "}
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { paddingHorizontal: 24, gap: 0 },
  hero: { alignItems: "center", gap: 12, marginBottom: 36 },
  logoBall: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  logoText: { fontSize: 32 },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: 4 },
  subtitle: { fontSize: 14, fontWeight: "500" },
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
