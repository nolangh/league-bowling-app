import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable, Platform } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  selectedStake: number;
  onSelect: (stake: number) => void;
}

const STAKES = [10, 25, 50, 75, 100, 150, 200, 500];

export function StakeModal({ visible, onClose, selectedStake, onSelect }: Props) {
  const colors = useColors();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.foreground }]}>Select Stake</Text>
          <View style={styles.grid}>
            {STAKES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.pill,
                  {
                    backgroundColor: selectedStake === s ? colors.primary : colors.secondary,
                    borderColor: selectedStake === s ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => { onSelect(s); onClose(); }}
              >
                <Text style={[styles.pillText, { color: selectedStake === s ? colors.primaryForeground : colors.foreground }]}>
                  ${s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },
  title: { fontSize: 20, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 20, paddingVertical: 12 },
  pillText: { fontSize: 16, fontWeight: "700" },
});
