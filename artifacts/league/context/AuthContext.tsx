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
  mfaPhone: string | null;
  mfaFactorId: string | null;
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
  enrollPhoneMFA: (phone: string) => Promise<{ factorId: string; challengeId: string }>;
  sendMFACode: (factorId: string) => Promise<{ challengeId: string }>;
  verifyMFA: (factorId: string, challengeId: string, code: string) => Promise<void>;
  unenrollMFA: (factorId: string) => Promise<void>;
  clearPasswordRecovery: () => void;
  refreshMFAState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// (Legacy TOTP helper removed — League now uses SMS-based phone MFA.)

async function getVerifiedPhoneFactor(): Promise<{ id: string; phone: string | null } | null> {
  try {
    const { data } = await supabase.auth.mfa.listFactors();
    const all = (data as any)?.all ?? [...((data as any)?.phone ?? []), ...((data as any)?.totp ?? [])];
    const phone = all.find((f: any) => f.factor_type === "phone" && f.status === "verified");
    if (!phone) return null;
    return { id: phone.id, phone: phone.phone ?? phone.friendly_name ?? null };
  } catch {
    return null;
  }
}

async function checkMFAState(): Promise<{ enabled: boolean; phone: string | null; factorId: string | null }> {
  const f = await getVerifiedPhoneFactor();
  return { enabled: !!f, phone: f?.phone ?? null, factorId: f?.id ?? null };
}

async function getMFAChallenge(): Promise<{ required: boolean; factorId?: string }> {
  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.nextLevel === "aal2" && data.currentLevel !== "aal2") {
      const f = await getVerifiedPhoneFactor();
      return { required: true, factorId: f?.id };
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
  const [mfaPhone, setMfaPhone] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);

  const applyMFAState = (s: { enabled: boolean; phone: string | null; factorId: string | null }) => {
    setMfaEnabled(s.enabled); setMfaPhone(s.phone); setMfaFactorId(s.factorId);
  };

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) checkMFAState().then(applyMFAState);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === "PASSWORD_RECOVERY") setNeedsPasswordRecovery(true);
      if (session) checkMFAState().then(applyMFAState);
      else applyMFAState({ enabled: false, phone: null, factorId: null });
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
        // Always report the device's preferred biometric type, even if not yet enrolled,
        // so the UI can guide the user to enable it in device settings.
        setBiometricType(isFace ? "face" : "fingerprint");
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

  const enrollPhoneMFA = async (phone: string): Promise<{ factorId: string; challengeId: string }> => {
    // Clean up any previous unverified phone factor for the same number to avoid duplicates.
    try {
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const all = (existing as any)?.all ?? [...((existing as any)?.phone ?? [])];
      for (const f of all) {
        if (f.factor_type === "phone" && f.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
    } catch { /* non-fatal */ }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "phone" as any,
      phone,
      friendlyName: `Phone ${phone}`,
    } as any);
    if (error) throw error;
    const factorId = (data as any).id;

    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr) throw chErr;
    return { factorId, challengeId: ch.id };
  };

  const sendMFACode = async (factorId: string): Promise<{ challengeId: string }> => {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) throw error;
    return { challengeId: data.id };
  };

  const verifyMFA = async (factorId: string, challengeId: string, code: string) => {
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (error) throw error;
    const state = await checkMFAState();
    applyMFAState(state);
  };

  const unenrollMFA = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    // Re-read factors from the server so the local state reflects reality
    // (the user may still have another verified factor on file).
    const state = await checkMFAState();
    applyMFAState(state);
  };

  const clearPasswordRecovery = () => setNeedsPasswordRecovery(false);

  const refreshMFAState = async () => {
    const state = await checkMFAState();
    applyMFAState(state);
  };

  return (
    <AuthContext.Provider
      value={{
        session, user, loading, needsPasswordRecovery,
        biometricAvailable, biometricEnabled, biometricType,
        mfaEnabled, mfaPhone, mfaFactorId,
        signUp, signIn, signInWithOAuth, signInWithBiometric, signOut,
        enableBiometric, disableBiometric,
        resetPassword, updatePassword, updateEmail,
        enrollPhoneMFA, sendMFACode, verifyMFA, unenrollMFA,
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
