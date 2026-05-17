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
import { FontAwesome, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useAuth, OAuthProvider } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const SOCIAL: { provider: OAuthProvider; label: string; bg: string; fg: string }[] = [
  { provider: "google",   label: "Google",   bg: "#fff",    fg: "#3c3c3c" },
  { provider: "facebook", label: "Facebook", bg: "#1877F2", fg: "#fff" },
  { provider: "discord",  label: "Discord",  bg: "#5865F2", fg: "#fff" },
];

function SocialIcon({ provider, color }: { provider: OAuthProvider; color: string }) {
  if (provider === "google")   return <FontAwesome name="google" size={17} color={color} />;
  if (provider === "facebook") return <FontAwesome name="facebook" size={17} color={color} />;
  if (provider === "discord")  return <MaterialCommunityIcons name={"discord" as any} size={17} color={color} />;
  return null;
}

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, signInWithOAuth, signInWithBiometric, biometricAvailable, biometricEnabled, biometricType } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [bioLoading, setBioLoading] = useState(false);

  const afterSignIn = (mfaRequired: boolean, factorId?: string) => {
    if (mfaRequired && factorId) {
      router.replace({ pathname: "/auth/mfa-challenge" as any, params: { factorId } });
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await signIn(email.trim().toLowerCase(), password);
      afterSignIn(result.mfaRequired, result.factorId);
    } catch (err: any) {
      Alert.alert("Sign In Failed", err.message ?? "Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    try {
      const result = await signInWithOAuth(provider);
      afterSignIn(result.mfaRequired, result.factorId);
    } catch (err: any) {
      if (!err.message?.includes("cancelled")) {
        Alert.alert("Sign In Failed", err.message ?? "Something went wrong.");
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleBiometric = async () => {
    setBioLoading(true);
    try {
      const result = await signInWithBiometric();
      afterSignIn(result.mfaRequired, result.factorId);
    } catch (err: any) {
      Alert.alert("Biometric Failed", err.message ?? "Could not authenticate.");
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <View style={[styles.logoBall, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>🎳</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>LEAGUE</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Welcome back, bowler</Text>
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

          <View style={styles.passwordHeader}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
            <TouchableOpacity onPress={() => router.push("/auth/forgot-password" as any)}>
              <Text style={[styles.forgotLink, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
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

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or continue with</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.socialRow}>
            {SOCIAL.map(({ provider, label, bg, fg }) => (
              <TouchableOpacity
                key={provider}
                style={[styles.socialBtn, { backgroundColor: bg, borderColor: colors.border, borderWidth: bg === "#fff" ? 1 : 0 }]}
                onPress={() => handleOAuth(provider)}
                disabled={oauthLoading !== null}
                activeOpacity={0.8}
              >
                {oauthLoading === provider ? (
                  <ActivityIndicator color={fg} size="small" />
                ) : (
                  <>
                    <SocialIcon provider={provider} color={fg} />
                    <Text style={[styles.socialLabel, { color: fg }]}>{label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {biometricAvailable && biometricEnabled && (
            <TouchableOpacity
              style={[styles.bioBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleBiometric}
              disabled={bioLoading}
              activeOpacity={0.8}
            >
              {bioLoading ? (
                <ActivityIndicator color={colors.foreground} size="small" />
              ) : (
                <>
                  <Feather
                    name={biometricType === "face" ? "aperture" : "fingerprint" as any}
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[styles.bioLabel, { color: colors.foreground }]}>
                    {biometricType === "face" ? "Use Face ID" : "Use Fingerprint"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.switchBtn} onPress={() => router.replace("/auth/sign-up")}>
            <Text style={[styles.switchText, { color: colors.mutedForeground }]}>
              Don't have an account?{" "}
              <Text style={{ color: colors.primary, fontFamily: "DMSans_600SemiBold" }}>Sign Up</Text>
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
  logoBall: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  logoText: { fontSize: 36 },
  title: { fontSize: 42, fontFamily: "BarlowCondensed_800ExtraBold", letterSpacing: 5 },
  subtitle: { fontSize: 15, fontFamily: "DMSans_400Regular" },
  form: { gap: 12 },
  passwordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 11, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 1.2 },
  forgotLink: { fontSize: 12, fontFamily: "DMSans_500Medium" },
  input: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, fontFamily: "DMSans_500Medium",
  },
  btn: { borderRadius: 50, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  btnText: { fontSize: 17, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.5 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  socialRow: { flexDirection: "row", gap: 8 },
  socialBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 50,
  },
  socialLabel: { fontSize: 13, fontFamily: "DMSans_600SemiBold" },
  bioBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 14, borderRadius: 50, borderWidth: 1,
  },
  bioLabel: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold", letterSpacing: 0.3 },
  switchBtn: { alignItems: "center", paddingVertical: 8 },
  switchText: { fontSize: 14, fontFamily: "DMSans_400Regular" },
});
