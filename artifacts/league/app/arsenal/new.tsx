import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { uploadMedia } from "@/lib/media";
import { api } from "@/lib/api";

const WEIGHTS = [10, 11, 12, 13, 14, 15, 16];
const COVERSTOCKS = ["Solid Reactive", "Pearl Reactive", "Hybrid Reactive", "Urethane", "Plastic"];

type CatalogBall = {
  id: number;
  brand: string;
  model: string;
  coverstockType: string | null;
  coverstockName: string | null;
  coreName: string | null;
  coreType: string | null;
  defaultSurface: string | null;
  minWeight: number;
  maxWeight: number;
};

export default function NewBallScreen() {
  const colors = useColors();
  const router = useRouter();
  const { createBall } = useApp();

  // ── catalog search ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogResults, setCatalogResults] = useState<CatalogBall[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length < 2) {
      setCatalogResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.get<CatalogBall[]>(
          `/balls/catalog/search?q=${encodeURIComponent(searchQuery)}`
        );
        setCatalogResults(results);
        setShowResults(results.length > 0);
      } catch {
        setCatalogResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [searchQuery]);

  const applyBall = (ball: CatalogBall) => {
    setName(`${ball.brand} ${ball.model}`);
    setBrand(ball.brand);
    if (ball.coverstockType) setCoverstock(ball.coverstockType);
    const coreParts = [ball.coreName, ball.coreType].filter(Boolean);
    if (coreParts.length) setCore(coreParts.join(" · "));
    if (ball.defaultSurface) setSurface(ball.defaultSurface);
    const defaultWeight = Math.min(16, Math.max(ball.minWeight, 15));
    setWeight(defaultWeight);
    setSearchQuery("");
    setCatalogResults([]);
    setShowResults(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // ── form fields ─────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [weight, setWeight] = useState<number | null>(15);
  const [color, setColor] = useState("");
  const [coverstock, setCoverstock] = useState("");
  const [core, setCore] = useState("");
  const [drillingLayout, setDrillingLayout] = useState("");
  const [span, setSpan] = useState("");
  const [pitch, setPitch] = useState("");
  const [surface, setSurface] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to pick an image.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled || !res.assets[0]) return;
    setUploading(true);
    try {
      const url = await uploadMedia(res.assets[0].uri, "image", "balls");
      setImageUrl(url);
    } catch (e: any) {
      Alert.alert("Upload failed", e?.message ?? "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Give your ball a name (e.g. \"Storm Phaze II\").");
      return;
    }
    setSaving(true);
    try {
      await createBall({
        name: name.trim(),
        brand: brand.trim() || null,
        weight,
        color: color.trim() || null,
        coverstock: coverstock || null,
        core: core.trim() || null,
        drillingLayout: drillingLayout.trim() || null,
        span: span.trim() || null,
        pitch: pitch.trim() || null,
        surface: surface.trim() || null,
        notes: notes.trim() || null,
        imageUrl,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn't save", e?.message ?? "Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Catalog search ──────────────────────────────────────────────── */}
        <View style={[styles.searchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.searchRow}>
            <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search ball catalog (e.g. Storm Phaze)…"
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color={colors.primary} />}
            {searchQuery.length > 0 && !searching && (
              <TouchableOpacity onPress={() => { setSearchQuery(""); setShowResults(false); }}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.searchHint, { color: colors.mutedForeground }]}>
            Select a ball to auto-fill specs — then customise as needed
          </Text>
        </View>

        {/* ── Catalog results dropdown ─────────────────────────────────── */}
        {showResults && (
          <View style={[styles.resultsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <FlatList
              data={catalogResults}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={[styles.resultDivider, { backgroundColor: colors.border }]} />
              )}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultRow}
                  onPress={() => applyBall(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resultMain}>
                    <Text style={[styles.resultName, { color: colors.foreground }]}>
                      {item.brand} {item.model}
                    </Text>
                    <Text style={[styles.resultSub, { color: colors.mutedForeground }]}>
                      {[item.coverstockType, item.coreType ? `${item.coreType} Core` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ── Image picker ─────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.85}>
          <View style={[styles.imageBox, { backgroundColor: color || colors.card, borderColor: colors.border }]}>
            {uploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : imageUrl ? (
              <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
            ) : (
              <>
                <Feather name="camera" size={24} color={colors.mutedForeground} />
                <Text style={[styles.imageHint, { color: colors.mutedForeground }]}>Add photo</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        <Field label="Name" value={name} onChangeText={setName} placeholder="Storm Phaze II" />
        <Field label="Brand" value={brand} onChangeText={setBrand} placeholder="Storm" />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>WEIGHT (lbs)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {WEIGHTS.map((w) => (
              <TouchableOpacity
                key={w}
                style={[
                  styles.pill,
                  {
                    backgroundColor: weight === w ? colors.primary : colors.card,
                    borderColor: weight === w ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setWeight(w)}
              >
                <Text style={[styles.pillText, { color: weight === w ? colors.primaryForeground : colors.foreground }]}>
                  {w}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Field label="Color" value={color} onChangeText={setColor} placeholder="#ff5f1f or 'red & black'" />

        <Text style={[styles.label, { color: colors.mutedForeground }]}>COVERSTOCK</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {COVERSTOCKS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.pill,
                  {
                    backgroundColor: coverstock === c ? colors.primary : colors.card,
                    borderColor: coverstock === c ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setCoverstock(c)}
              >
                <Text style={[styles.pillText, { color: coverstock === c ? colors.primaryForeground : colors.foreground }]}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Field label="Core" value={core} onChangeText={setCore} placeholder="Ergo · Asymmetric" />
        <Field label="Surface" value={surface} onChangeText={setSurface} placeholder="2000 grit Abralon / Factory Polish" />
        <Field label="Drilling Layout" value={drillingLayout} onChangeText={setDrillingLayout} placeholder='e.g. "60° x 4.5″ x 35°"' />
        <Field label="Span" value={span} onChangeText={setSpan} placeholder='e.g. "4 1/2″ middle / 4 5/16″ ring"' />
        <Field label="Pitch" value={pitch} onChangeText={setPitch} placeholder='e.g. "1/4″ FW, 1/8″ LF"' />
        <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Anything else…" multiline />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={save}
          disabled={saving}
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
            {saving ? "Saving…" : "Add to Arsenal"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const colors = useColors();
  return (
    <>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{props.label.toUpperCase()}</Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            color: colors.foreground,
            borderColor: colors.border,
            minHeight: props.multiline ? 70 : 44,
            textAlignVertical: props.multiline ? "top" : "center",
          },
        ]}
        placeholder={props.placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={props.value}
        onChangeText={props.onChangeText}
        multiline={props.multiline}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 60, gap: 4 },

  searchCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  searchRow: { flexDirection: "row", alignItems: "center" },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  searchHint: { fontSize: 11, fontWeight: "500" },

  resultsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  resultMain: { flex: 1 },
  resultName: { fontSize: 14, fontWeight: "700" },
  resultSub: { fontSize: 12, marginTop: 1 },
  resultDivider: { height: 1 },

  imagePicker: { alignItems: "center", marginBottom: 16 },
  imageBox: {
    width: 120, height: 120, borderRadius: 60, borderWidth: 1,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  imageHint: { fontSize: 11, marginTop: 4, fontWeight: "600" },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 4, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: 12 },
  pill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 9 },
  pillText: { fontSize: 13, fontWeight: "600" },
  saveBtn: { marginTop: 16, paddingVertical: 16, borderRadius: 50, alignItems: "center" },
  saveBtnText: { fontSize: 15, fontWeight: "800" },
});
