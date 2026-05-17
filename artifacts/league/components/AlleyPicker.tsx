import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";
import type { AlleyPlace } from "@/context/AppContext";

interface Props {
  visible: boolean;
  onClose: () => void;
  onPick: (alley: AlleyPlace) => void;
  title?: string;
}

export function AlleyPicker({ visible, onClose, onPick, title = "Find Bowling Alley" }: Props) {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlleyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedGps, setUsedGps] = useState(false);

  const reset = () => {
    setQuery(""); setResults([]); setLoading(false); setError(null); setUsedGps(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleNearMe = useCallback(async () => {
    setError(null);
    setLoading(true);
    setUsedGps(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setError("Location permission needed to find nearby alleys");
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const res = await api.get<{ results: AlleyPlace[] }>(
        `/alleys/search?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}`
      );
      setResults(res.results);
      if (res.results.length === 0) {
        setError("No bowling alleys found within 50km. Try searching by name.");
      }
    } catch (e) {
      setError((e as Error).message ?? "Could not find nearby alleys");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setError(null);
    setLoading(true);
    setUsedGps(false);
    try {
      let coords: { lat: number; lng: number } | null = null;
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        }
      } catch { /* no location bias */ }
      const params = new URLSearchParams({ q: query.trim() });
      if (coords) {
        params.set("lat", String(coords.lat));
        params.set("lng", String(coords.lng));
      }
      const res = await api.get<{ results: AlleyPlace[] }>(`/alleys/search?${params}`);
      setResults(res.results);
      if (res.results.length === 0) setError("No matches found");
    } catch (e) {
      setError((e as Error).message ?? "Search failed");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handlePick = (alley: AlleyPlace) => {
    Haptics.selectionAsync();
    onPick(alley);
    handleClose();
  };

  const handleManualAdd = () => {
    if (!query.trim()) return;
    handlePick({
      name: query.trim(),
      address: null,
      lat: null as unknown as number,
      lng: null as unknown as number,
      osmId: `manual/${Date.now()}`,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.gpsBtn, { backgroundColor: colors.primary }]}
              onPress={handleNearMe}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Feather name="navigation" size={16} color={colors.primaryForeground} />
              <Text style={[styles.gpsBtnText, { color: colors.primaryForeground }]}>
                Find alleys near me
              </Text>
            </TouchableOpacity>

            <Text style={[styles.divider, { color: colors.mutedForeground }]}>OR SEARCH BY NAME</Text>

            <View style={[styles.searchRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.searchInput, { color: colors.foreground }]}
                placeholder="e.g. Bowlero Midtown"
                placeholderTextColor={colors.mutedForeground}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <Feather name="x-circle" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {loading && (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  {usedGps ? "Searching nearby…" : "Searching…"}
                </Text>
              </View>
            )}

            {error && !loading && (
              <View style={[styles.errorBox, { backgroundColor: "#ff3b3015" }]}>
                <Feather name="alert-circle" size={14} color="#ff3b30" />
                <Text style={{ color: "#ff3b30", fontSize: 13, flex: 1 }}>{error}</Text>
              </View>
            )}

            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {results.map((r) => (
                <TouchableOpacity
                  key={r.osmId}
                  style={[styles.resultRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => handlePick(r)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.resultIcon, { backgroundColor: colors.primary + "22" }]}>
                    <Feather name="map-pin" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultName, { color: colors.foreground }]} numberOfLines={1}>
                      {r.name}
                    </Text>
                    {r.address && (
                      <Text style={[styles.resultAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {r.address}
                      </Text>
                    )}
                  </View>
                  {r.distanceKm != null && (
                    <Text style={[styles.distance, { color: colors.mutedForeground }]}>
                      {r.distanceKm < 1 ? `${Math.round(r.distanceKm * 1000)}m` : `${r.distanceKm.toFixed(1)}km`}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {query.trim().length > 0 && !loading && (
              <TouchableOpacity
                style={[styles.manualBtn, { borderColor: colors.border }]}
                onPress={handleManualAdd}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={14} color={colors.foreground} />
                <Text style={[styles.manualText, { color: colors.foreground }]}>
                  Can't find it? Use "{query.trim()}"
                </Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14, paddingBottom: 34 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  gpsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 16 },
  gpsBtnText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  divider: { fontSize: 11, letterSpacing: 1, fontWeight: "600", textAlign: "center", marginTop: 4 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  loadingBlock: { alignItems: "center", paddingVertical: 16, gap: 8 },
  loadingText: { fontSize: 13 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  resultIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  resultName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  resultAddr: { fontSize: 12, marginTop: 2 },
  distance: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  manualBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderStyle: "dashed" },
  manualText: { fontSize: 13, fontWeight: "500", fontFamily: "Inter_500Medium" },
});
