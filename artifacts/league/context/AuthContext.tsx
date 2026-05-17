import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const BIO_KEY = "league_bio_creds";

export type OAuthProvider = "google" | "facebook" | "discord";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  needsPasswordRecovery: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricType: "face" | "fingerprint" | null;
  mfaEnabled: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ mfaRequired: boolean; factorId?: string }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ mfaRequired: boolean; factorId?: string }>;
  signInWithBiometric: () => Promise<{ mfaRequired: boolean; factorId?: string }>;
  signOut: () => Promise<void>;
  enableBiometric: (email: string, password: string) => Promise<void>;
  disableBiometric: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  enrollMFA: () => Promise<{ qrCode: string; secret: string; factorId: string }>;
  verifyMFAEnrollment: (factorId: string, code: string) => Promise<void>;
  unenrollMFA: (factorId: string) => Promise<void>;
  challengeMFA: (factorId: string, code: string) => Promise<void>;
  clearPasswordRecovery: () => void;
  refreshMFAState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function checkMFAEnabled(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.mfa.listFactors();
    return (data?.totp ?? []).filter((f) => f.status === "verified").length > 0;
  } catch {
    return false;
  }
}

async function getMFAChallenge(): Promise<{ required: boolean; factorId?: string }> {
  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.nextLevel === "aal2" && data.currentLevel !== "aal2") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = (factors?.totp ?? []).find((f) => f.status === "verified");
      return { required: true, factorId: totp?.id };
    }
    return { required: false };
  } catch {
    return { required: false };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordRecovery, setNeedsPasswordRecovery] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) checkMFAEnabled().then(setMfaEnabled);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === "PASSWORD_RECOVERY") setNeedsPasswordRecovery(true);
      if (session) checkMFAEnabled().then(setMfaEnabled);
      else setMfaEnabled(false);
    });

    const safetyTimeout = setTimeout(() => setLoading(false), 5000);

    if (Platform.OS !== "web") {
      Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        LocalAuthentication.supportedAuthenticationTypesAsync(),
        SecureStore.getItemAsync(BIO_KEY),
      ]).then(([hasHardware, isEnrolled, types, stored]) => {
        const available = hasHardware && isEnrolled;
        setBiometricAvailable(available);
        setBiometricEnabled(available && stored !== null);
        const isFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
        setBiometricType(available ? (isFace ? "face" : "fingerprint") : null);
      }).catch(() => {});
    }

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, full_name: username } },
    });
    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ mfaRequired: boolean; factorId?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
    const mfa = await getMFAChallenge();
    return { mfaRequired: mfa.required, factorId: mfa.factorId };
  };

  const signInWithOAuth = async (provider: OAuthProvider): Promise<{ mfaRequired: boolean; factorId?: string }> => {
    const redirectUri = Linking.createURL("/");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUri, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data.url) throw new Error("No OAuth URL returned");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    if (result.type === "success") {
      await supabase.auth.exchangeCodeForSession(result.url);
      const mfa = await getMFAChallenge();
      return { mfaRequired: mfa.required, factorId: mfa.factorId };
    }
    throw new Error("OAuth sign-in was cancelled");
  };

  const signInWithBiometric = async (): Promise<{ mfaRequired: boolean; factorId?: string }> => {
    const stored = await SecureStore.getItemAsync(BIO_KEY);
    if (!stored) throw new Error("No biometric credentials stored");

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: biometricType === "face" ? "Use Face ID to sign in" : "Use fingerprint to sign in",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    if (!auth.success) throw new Error("Biometric authentication failed");

    const { email, password } = JSON.parse(stored) as { email: string; password: string };
    return signIn(email, password);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const enableBiometric = async (email: string, password: string) => {
    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm your identity to enable biometric login",
      cancelLabel: "Cancel",
    });
    if (!auth.success) throw new Error("Biometric confirmation failed");
    await SecureStore.setItemAsync(BIO_KEY, JSON.stringify({ email, password }));
    setBiometricEnabled(true);
  };

  const disableBiometric = async () => {
    await SecureStore.deleteItemAsync(BIO_KEY);
    setBiometricEnabled(false);
  };

  const resetPassword = async (email: string) => {
    const redirectTo = Linking.createURL("/auth/update-password");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setNeedsPasswordRecovery(false);
  };

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  };

  const enrollMFA = async (): Promise<{ qrCode: string; secret: string; factorId: string }> => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) throw error;
    return {
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      factorId: data.id,
    };
  };

  const verifyMFAEnrollment = async (factorId: string, code: string) => {
    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) throw challengeErr;
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });
    if (error) throw error;
    setMfaEnabled(true);
  };

  const unenrollMFA = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    setMfaEnabled(false);
  };

  const challengeMFA = async (factorId: string, code: string) => {
    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) throw challengeErr;
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });
    if (error) throw error;
  };

  const clearPasswordRecovery = () => setNeedsPasswordRecovery(false);

  const refreshMFAState = async () => {
    const enabled = await checkMFAEnabled();
    setMfaEnabled(enabled);
  };

  return (
    <AuthContext.Provider
      value={{
        session, user, loading, needsPasswordRecovery,
        biometricAvailable, biometricEnabled, biometricType, mfaEnabled,
        signUp, signIn, signInWithOAuth, signInWithBiometric, signOut,
        enableBiometric, disableBiometric,
        resetPassword, updatePassword, updateEmail,
        enrollMFA, verifyMFAEnrollment, unenrollMFA, challengeMFA,
        clearPasswordRecovery, refreshMFAState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
