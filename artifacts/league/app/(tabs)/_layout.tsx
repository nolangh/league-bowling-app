import { BlurView } from "expo-blur";
import { Redirect, Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Platform, StyleSheet, View, useColorScheme } from "react-native";

import { AppProvider } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const colors = useColors();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/auth/sign-in" />;
  }

  return <>{children}</>;
}

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: "zap",
  moments: "play-circle",
  log: "plus-square",
  leaderboard: "bar-chart-2",
  leagues: "award",
  profile: "user",
};

const TAB_TITLES: Record<string, string> = {
  index: "Challenges",
  moments: "Moments",
  log: "Log",
  leaderboard: "Ranking",
  leagues: "Leagues",
  profile: "Profile",
};

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <AuthGuard>
      <AppProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.mutedForeground,
            tabBarStyle: {
              position: "absolute",
              backgroundColor: isIOS ? "transparent" : colors.background,
              borderTopWidth: isWeb ? 1 : 0,
              borderTopColor: colors.border,
              elevation: 0,
              ...(isWeb ? { height: 84 } : {}),
            },
            tabBarBackground: () =>
              isIOS ? (
                <BlurView
                  intensity={100}
                  tint={isDark ? "dark" : "light"}
                  style={StyleSheet.absoluteFill}
                />
              ) : isWeb ? (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
              ) : null,
            tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
          }}
        >
          {Object.entries(TAB_TITLES).map(([name, title]) => (
            <Tabs.Screen
              key={name}
              name={name}
              options={{
                title,
                tabBarIcon: ({ color }) => (
                  <Feather name={TAB_ICONS[name]} size={22} color={color} />
                ),
              }}
            />
          ))}
        </Tabs>
      </AppProvider>
    </AuthGuard>
  );
}
