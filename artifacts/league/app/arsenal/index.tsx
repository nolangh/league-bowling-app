import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp, type Ball } from "@/context/AppContext";

function BallCard({ ball, onPress }: { ball: Ball; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.swatch, { backgroundColor: ball.color || "#444" }]}>
        {ball.imageUrl ? (
          <Image source={{ uri: ball.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        ) : (
          <Feather name="circle" size={28} color="#fff" />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {ball.name}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {[ball.brand, ball.weight ? `${ball.weight} lb` : null, ball.coverstock]
            .filter(Boolean)
            .join(" · ") || "Tap to add details"}
        </Text>
        {!ball.isActive && (
          <Text style={[styles.archived, { color: colors.mutedForeground }]}>Archived</Text>
        )}
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function ArsenalScreen() {
  const colors = useColors();
  const router = useRouter();
  const { balls, refreshBalls } = useApp();

  useEffect(() => { refreshBalls(); }, []);

  const active = balls.filter((b) => b.isActive);
  const archived = balls.filter((b) => !b.isActive);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Ball Arsenal</Text>
            <Text style={[styles.sub, { color: colors.mutedForeground }]}>
              {balls.length} {balls.length === 1 ? "ball" : "balls"} in your bag
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/arsenal/new");
            }}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={16} color={colors.primaryForeground} />
            <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>Add Ball</Text>
          </TouchableOpacity>
        </View>

        {balls.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="circle" size={56} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No balls yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add your bowling balls with their drilling specs, weight, and coverstock to track
              per-ball performance over time.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/arsenal/new")}
            >
              <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
                Add Your First Ball
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={[styles.section, { color: colors.mutedForeground }]}>ACTIVE</Text>
                <View style={{ gap: 10 }}>
                  {active.map((b) => (
                    <BallCard key={b.id} ball={b} onPress={() => router.push(`/arsenal/${b.id}` as any)} />
                  ))}
                </View>
              </>
            )}
            {archived.length > 0 && (
              <>
                <Text style={[styles.section, { color: colors.mutedForeground, marginTop: 20 }]}>ARCHIVED</Text>
                <View style={{ gap: 10 }}>
                  {archived.map((b) => (
                    <BallCard key={b.id} ball={b} onPress={() => router.push(`/arsenal/${b.id}` as any)} />
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: 0.5 },
  sub: { fontSize: 13, marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 50 },
  addBtnText: { fontSize: 13, fontWeight: "700" },
  section: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 12, borderRadius: 18 },
  swatch: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  name: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 12, marginTop: 2 },
  archived: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginTop: 2 },
  empty: { alignItems: "center", paddingHorizontal: 24, paddingTop: 60, gap: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  emptyBtn: { marginTop: 10, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50 },
  emptyBtnText: { fontSize: 14, fontWeight: "700" },
});
