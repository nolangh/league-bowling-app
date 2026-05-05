import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Redirect, Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
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

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "bolt", selected: "bolt.fill" }} />
        <Label>Challenges</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="moments">
        <Icon sf={{ default: "play.square", selected: "play.square.fill" }} />
        <Label>Moments</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="log">
        <Icon sf={{ default: "plus.square", selected: "plus.square.fill" }} />
        <Label>Log</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="leaderboard">
        <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
        <Label>Ranking</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="leagues">
        <Icon sf={{ default: "trophy", selected: "trophy.fill" }} />
        <Label>Leagues</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
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
      <Tabs.Screen
        name="index"
        options={{
          title: "Challenges",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="bolt" tintColor={color} size={22} /> : <Feather name="zap" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="moments"
        options={{
          title: "Moments",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="play.square" tintColor={color} size={22} /> : <Feather name="play-circle" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: "Log",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="plus.square" tintColor={color} size={22} /> : <Feather name="plus-square" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: "Ranking",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="chart.bar" tintColor={color} size={22} /> : <Feather name="bar-chart-2" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          title: "Leagues",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="trophy" tintColor={color} size={22} /> : <Feather name="award" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person" tintColor={color} size={22} /> : <Feather name="user" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <AuthGuard>
      <AppProvider>
        {isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />}
      </AppProvider>
    </AuthGuard>
  );
}
