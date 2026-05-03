import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getRankColor, type Rank } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  rank: Rank;
  small?: boolean;
}

export function RankBadge({ rank, small = false }: Props) {
  const rankColor = getRankColor(rank);
  const colors = useColors();

  return (
    <View
      style={[
        styles.badge,
        small && styles.badgeSmall,
        { backgroundColor: rankColor + "22", borderColor: rankColor + "44" },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          small && styles.badgeTextSmall,
          { color: rankColor },
        ]}
      >
        {rank.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  badgeTextSmall: {
    fontSize: 9,
  },
});
