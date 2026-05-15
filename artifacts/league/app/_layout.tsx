import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/barlow-condensed";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from "@expo-google-fonts/dm-sans";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { initializeRevenueCat, SubscriptionProvider } from "@/lib/revenuecat";
import { useColors } from "@/hooks/useColors";

if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

const queryClient = new QueryClient();

try {
  initializeRevenueCat();
} catch (err: any) {
  console.log("RevenueCat:", err?.message);
}

function RootLayoutNav() {
  const colors = useColors();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
      <Stack.Screen
        name="moment/[id]"
        options={{
          headerShown: true,
          title: "Post",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="friends"
        options={{
          headerShown: true,
          title: "Friends",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="user/[id]"
        options={{
          headerShown: true,
          title: "Profile",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (Platform.OS !== "web" && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // On web: render immediately — SplashScreen not used, fonts load in background
  // On native: wait for fonts before revealing the app
  if (Platform.OS !== "web" && !fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" translucent />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SubscriptionProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SubscriptionProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
