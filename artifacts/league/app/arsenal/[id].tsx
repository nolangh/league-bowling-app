import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";

type BallDetail = {
  ball: {
    id: string; name: string; brand: string | null; weight: number | null;
    color: string | null; coverstock: string | null; core: string | null;
    drillingLayout: string | null; span: string | null; pitch: string | null;
    surface: string | null; notes: string | null; imageUrl: string | null; isActive: boolean;
  };
  stats: { totalGames: number; avgScore: number; highGame: number };
  recentGames: { id: string; score: number; date: string; alley: string; oilPattern: string }[];
};

export default function BallDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteBall, updateBall } = useApp();
  const [data, setData] = useState<BallDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get<BallDetail>(`/balls/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Ball not found.</Text>
      </View>
    );
  }

  const { ball, stats, recentGames } = data;

  const onDelete = () => {
    Alert.alert(
      "Delete this ball?",
      "Linked games will keep their score but lose the ball reference.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteBall(ball.id);
            router.back();
          },
        },
      ],
    );
  };

  const toggleArchive = async () => {
    await updateBall(ball.id, { isActive: !ball.isActive });
    setData({ ...data, ball: { ...ball, isActive: !ball.isActive } });
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroRow}>
        <View style={[styles.bigSwatch, { backgroundColor: ball.color || "#444" }]}>
          {ball.imageUrl ? (
            <Image source={{ uri: ball.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          ) : (
            <Feather name="circle" size={42} color="#fff" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.foreground }]}>{ball.name}</Text>
          {ball.brand && (
            <Text style={[styles.brand, { color: colors.mutedForeground }]}>{ball.brand}</Text>
          )}
          {ball.weight && (
            <View style={[styles.weightPill, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.weightText, { color: colors.primary }]}>{ball.weight} lbs</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "GAMES", value: stats.totalGames },
          { label: "AVG", value: stats.avgScore },
          { label: "HIGH", value: stats.highGame },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Specs */}
      <Text style={[styles.section, { color: colors.mutedForeground }]}>SPECS</Text>
      <View style={[styles.specsCard, { backgroundColor: colors.card }]}>
        <SpecRow label="Coverstock" value={ball.coverstock} />
        <SpecRow label="Core" value={ball.core} />
        <SpecRow label="Drilling Layout" value={ball.drillingLayout} />
        <SpecRow label="Span" value={ball.span} />
        <SpecRow label="Pitch" value={ball.pitch} />
        <SpecRow label="Surface" value={ball.surface} />
        {ball.notes && <SpecRow label="Notes" value={ball.notes} />}
      </View>

      {/* Recent games */}
      <Text style={[styles.section, { color: colors.mutedForeground, marginTop: 18 }]}>
        RECENT GAMES WITH THIS BALL
      </Text>
      {recentGames.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>
          No games logged with this ball yet. Pick it next time you log a score.
        </Text>
      ) : (
        <View style={{ gap: 8 }}>
          {recentGames.map((g) => (
            <View key={g.id} style={[styles.gameRow, { backgroundColor: colors.card }]}>
              <View style={[styles.scoreBox, { backgroundColor: colors.primary }]}>
                <Text style={[styles.scoreNum, { color: colors.primaryForeground }]}>{g.score}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gameAlley, { color: colors.foreground }]}>{g.alley || "—"}</Text>
                <Text style={[styles.gameMeta, { color: colors.mutedForeground }]}>
                  {g.date} · {g.oilPattern}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={toggleArchive}
        >
          <Feather name={ball.isActive ? "archive" : "rotate-ccw"} size={16} color={colors.foreground} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>
            {ball.isActive ? "Archive" : "Reactivate"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#ef444422", borderColor: "#ef4444" }]}
          onPress={onDelete}
        >
          <Feather name="trash-2" size={16} color="#ef4444" />
          <Text style={[styles.actionText, { color: "#ef4444" }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SpecRow({ label, value }: { label: string; value: string | null | undefined }) {
  const colors = useColors();
  if (!value) {
    return (
      <View style={styles.specRow}>
        <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.specVal, { color: colors.mutedForeground }]}>—</Text>
      </View>
    );
  }
  return (
    <View style={styles.specRow}>
      <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.specVal, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 60 },
  heroRow: { flexDirection: "row", gap: 16, alignItems: "center", marginBottom: 18 },
  bigSwatch: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  name: { fontSize: 22, fontWeight: "800" },
  brand: { fontSize: 13, marginTop: 2 },
  weightPill: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  weightText: { fontSize: 12, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, padding: 14, borderRadius: 16, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  section: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 18, marginBottom: 8 },
  specsCard: { borderRadius: 18, padding: 4 },
  specRow: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, gap: 12, alignItems: "flex-start" },
  specLabel: { fontSize: 12, fontWeight: "600", width: 110 },
  specVal: { fontSize: 13, flex: 1 },
  empty: { fontSize: 13, textAlign: "center", paddingVertical: 16 },
  gameRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14 },
  scoreBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  scoreNum: { fontSize: 16, fontWeight: "800" },
  gameAlley: { fontSize: 14, fontWeight: "700" },
  gameMeta: { fontSize: 12, marginTop: 2 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 50, borderWidth: 1 },
  actionText: { fontSize: 13, fontWeight: "700" },
});
