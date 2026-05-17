import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, type Game, type Ball, type FrameData } from "@/context/AppContext";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type LocationMeta = {
  latitude: number;
  longitude: number;
  locationName: string;
  capturedAt: string;
};

type Step =
  | "method"
  | "frames"
  | "analyzing"
  | "confirm"
  | "details"
  | "verifying";

const OIL_PATTERNS = ["House Shot", "Sport Shot", "Challenge Pattern", "PBA Shot", "Other"];
const ALLEYS = ["Bowlero Midtown", "AMF Pro Bowl", "Kings Bowl", "Sunset Lanes", "Other"];

const EMPTY_FRAMES: FrameData[] = Array.from({ length: 10 }, () => ({
  ball1: null,
  ball2: null,
  ball3: null,
}));

// ─── Bowling scoring logic ────────────────────────────────────────────────────

function isStrike(f: FrameData) {
  return f.ball1 === 10;
}

function isSpare(f: FrameData) {
  return f.ball1 !== null && f.ball1 !== 10 && f.ball2 !== null && f.ball1 + f.ball2 === 10;
}

function getRolls(frames: FrameData[]): number[] {
  const rolls: number[] = [];
  frames.forEach((f, i) => {
    if (f.ball1 !== null) rolls.push(f.ball1);
    if (i < 9) {
      if (!isStrike(f) && f.ball2 !== null) rolls.push(f.ball2);
    } else {
      if (f.ball2 !== null) rolls.push(f.ball2);
      if (f.ball3 !== null) rolls.push(f.ball3);
    }
  });
  return rolls;
}

export function calcFrameScores(frames: FrameData[]): (number | null)[] {
  const rolls = getRolls(frames);
  const scores: (number | null)[] = [];
  let ri = 0;

  for (let f = 0; f < 10; f++) {
    const frame = frames[f];
    if (frame.ball1 === null) {
      scores.push(null);
      continue;
    }

    if (f === 9) {
      const b1 = rolls[ri] ?? 0;
      const b2 = rolls[ri + 1] ?? 0;
      const b3 = rolls[ri + 2] ?? 0;
      const prev = f > 0 ? (scores[f - 1] ?? 0) : 0;
      const hasBonus = isStrike(frame) || isSpare(frame);
      if (hasBonus && frame.ball3 === null) {
        scores.push(null);
      } else if (!hasBonus && frame.ball2 === null) {
        scores.push(null);
      } else {
        scores.push(prev + b1 + b2 + (hasBonus ? b3 : 0));
      }
    } else if (isStrike(frame)) {
      if (rolls[ri + 1] === undefined || rolls[ri + 2] === undefined) {
        scores.push(null);
      } else {
        const prev = f > 0 ? (scores[f - 1] ?? 0) : 0;
        scores.push(prev + 10 + (rolls[ri + 1] ?? 0) + (rolls[ri + 2] ?? 0));
      }
      ri++;
      continue;
    } else if (isSpare(frame)) {
      if (frame.ball2 === null || rolls[ri + 2] === undefined) {
        scores.push(null);
      } else {
        const prev = f > 0 ? (scores[f - 1] ?? 0) : 0;
        scores.push(prev + 10 + (rolls[ri + 2] ?? 0));
      }
      ri += 2;
      continue;
    } else {
      if (frame.ball2 === null) {
        scores.push(null);
      } else {
        const prev = f > 0 ? (scores[f - 1] ?? 0) : 0;
        scores.push(prev + (frame.ball1 ?? 0) + (frame.ball2 ?? 0));
      }
      ri += 2;
      continue;
    }
    ri += isStrike(frame) ? 1 : 2;
  }
  return scores;
}

function totalScore(frames: FrameData[]): number {
  const scores = calcFrameScores(frames);
  for (let i = 9; i >= 0; i--) {
    if (scores[i] !== null) return scores[i] as number;
  }
  return 0;
}

function isFrameComplete(frame: FrameData, frameIndex: number): boolean {
  if (frameIndex < 9) {
    if (frame.ball1 === null) return false;
    if (isStrike(frame)) return true;
    return frame.ball2 !== null;
  } else {
    if (frame.ball1 === null || frame.ball2 === null) return false;
    if (isStrike(frame) || isSpare(frame)) return frame.ball3 !== null;
    return true;
  }
}

function allFramesComplete(frames: FrameData[]): boolean {
  return frames.every((f, i) => isFrameComplete(f, i));
}

function displayBall(val: number | null, prev: number | null, isFirst: boolean): string {
  if (val === null) return "";
  if (val === 10 && isFirst) return "X";
  if (!isFirst && prev !== null && prev + val === 10) return "/";
  if (val === 0) return "-";
  return String(val);
}

// ─── Game row ─────────────────────────────────────────────────────────────────

function GameRow({ game }: { game: Game }) {
  const colors = useColors();
  const date = new Date(game.date);
  const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <View style={[styles.gameRow, { backgroundColor: colors.card }]}>
      <View style={[styles.scoreBox, { backgroundColor: colors.primary }]}>
        <Text style={[styles.scoreBoxNum, { color: colors.primaryForeground }]}>{game.score}</Text>
      </View>
      <View style={styles.gameInfo}>
        <Text style={[styles.gameName, { color: colors.foreground }]}>{game.alley}</Text>
        <Text style={[styles.gameMeta, { color: colors.mutedForeground }]}>
          {formatted} · {game.oilPattern}
        </Text>
        {game.ballUsed ? (
          <Text style={[styles.gameBall, { color: colors.mutedForeground }]}>
            <Feather name="circle" size={10} /> {game.ballUsed}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        {game.verified && (
          <View style={[styles.verifiedBadge, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="check-circle" size={10} color={colors.primary} />
            <Text style={[styles.verifiedText, { color: colors.primary }]}>VERIFIED</Text>
          </View>
        )}
        {game.notes ? (
          <Feather name="file-text" size={14} color={colors.mutedForeground} />
        ) : null}
      </View>
    </View>
  );
}

// ─── Scorecard grid ───────────────────────────────────────────────────────────

function ScorecardGrid({
  frames,
  activeFrame,
  activeBall,
  frameScores,
  colors,
}: {
  frames: FrameData[];
  activeFrame: number;
  activeBall: 1 | 2 | 3;
  frameScores: (number | null)[];
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
      <View>
        <View style={styles.scorecardRow}>
          {frames.map((frame, i) => {
            const isActive = i === activeFrame;
            const isLast = i === 9;
            const strike = isStrike(frame);
            const spare = isSpare(frame);
            return (
              <View
                key={i}
                style={[
                  styles.frameCell,
                  isLast && styles.frameCellLast,
                  isActive && { borderColor: colors.primary, borderWidth: 2 },
                  { borderColor: isActive ? colors.primary : colors.border },
                ]}
              >
                <Text style={[styles.frameNum, { color: colors.mutedForeground }]}>{i + 1}</Text>
                <View style={styles.ballRow}>
                  {isLast ? (
                    <>
                      <View style={[styles.ballBox, activeBall === 1 && isActive && { backgroundColor: colors.primary + "33" }]}>
                        <Text style={[styles.ballText, frame.ball1 === 10 && { color: colors.primary, fontWeight: "800" }, { color: colors.foreground }]}>
                          {displayBall(frame.ball1, null, true)}
                        </Text>
                      </View>
                      <View style={[styles.ballBox, activeBall === 2 && isActive && { backgroundColor: colors.primary + "33" }]}>
                        <Text style={[styles.ballText, { color: frame.ball1 === 10 && frame.ball2 === 10 ? colors.primary : (isSpare({ ...frame, ball1: frame.ball1 }) ? "#ff9500" : colors.foreground) }]}>
                          {displayBall(frame.ball2, frame.ball1, frame.ball2 === 10)}
                        </Text>
                      </View>
                      <View style={[styles.ballBox, activeBall === 3 && isActive && { backgroundColor: colors.primary + "33" }]}>
                        <Text style={[styles.ballText, { color: colors.foreground }]}>
                          {frame.ball3 !== null ? displayBall(frame.ball3, null, frame.ball3 === 10) : ""}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={[styles.ballBox, activeBall === 1 && isActive && { backgroundColor: colors.primary + "33" }]}>
                        <Text style={[styles.ballText, { color: strike ? colors.primary : colors.foreground, fontWeight: strike ? "800" : "600" }]}>
                          {strike ? "" : displayBall(frame.ball1, null, true)}
                        </Text>
                      </View>
                      <View style={[styles.ballBox, activeBall === 2 && isActive && { backgroundColor: colors.primary + "33" }]}>
                        <Text style={[styles.ballText, { color: strike ? colors.primary : spare ? "#ff9500" : colors.foreground, fontWeight: (strike || spare) ? "800" : "600" }]}>
                          {strike ? "X" : displayBall(frame.ball2, frame.ball1, false)}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
                <Text style={[styles.frameScore, { color: colors.foreground }]}>
                  {frameScores[i] !== null ? String(frameScores[i]) : ""}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Pin keypad ───────────────────────────────────────────────────────────────

function PinKeypad({
  onPin,
  onBack,
  maxPins,
  allowSpare,
  colors,
}: {
  onPin: (n: number) => void;
  onBack: () => void;
  maxPins: number;
  allowSpare: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const valid = Array.from({ length: maxPins + 1 }, (_, i) => i);

  return (
    <View style={styles.keypad}>
      <View style={styles.keypadGrid}>
        {valid.map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.keyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => { Haptics.selectionAsync(); onPin(n); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyBtnText, { color: colors.foreground }]}>
              {n === 10 ? "X" : String(n)}
            </Text>
          </TouchableOpacity>
        ))}
        {allowSpare && (
          <TouchableOpacity
            style={[styles.keyBtn, { backgroundColor: "#ff950022", borderColor: "#ff9500" }]}
            onPress={() => { Haptics.selectionAsync(); onPin(-1); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.keyBtnText, { color: "#ff9500", fontWeight: "800" }]}>/</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.keyBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => { Haptics.selectionAsync(); onBack(); }}
          activeOpacity={0.7}
        >
          <Feather name="delete" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { games, logGame, user, balls } = useApp();
  const router = useRouter();
  const activeBalls = balls.filter((b) => b.isActive);

  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState<Step>("method");

  // Frame state
  const [frames, setFrames] = useState<FrameData[]>(EMPTY_FRAMES);
  const [activeFrame, setActiveFrame] = useState(0);
  const [activeBall, setActiveBall] = useState<1 | 2 | 3>(1);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationMeta, setLocationMeta] = useState<LocationMeta | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Details state
  const [alley, setAlley] = useState(ALLEYS[0]);
  const [oilPattern, setOilPattern] = useState(OIL_PATTERNS[0]);
  const [selectedBall, setSelectedBall] = useState<Ball | null>(null);
  const [notes, setNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  const frameScores = calcFrameScores(frames);
  const currentTotal = totalScore(frames);
  const done = allFramesComplete(frames);

  const recent5 = games.slice(0, 5);
  const recentAvg =
    recent5.length > 0
      ? Math.round(recent5.reduce((s, g) => s + g.score, 0) / recent5.length)
      : 0;

  const resetAll = useCallback(() => {
    setFrames(EMPTY_FRAMES);
    setActiveFrame(0);
    setActiveBall(1);
    setPhotoUri(null);
    setLocationMeta(null);
    setAnalyzeError(null);
    setAlley(ALLEYS[0]);
    setOilPattern(OIL_PATTERNS[0]);
    setSelectedBall(null);
    setNotes("");
    setStep("method");
    setIsLogging(false);
  }, []);

  // ── Navigation helpers ────────────────────────────────────────────────────

  const advanceCursor = useCallback((newFrames: FrameData[], fi: number, ball: 1 | 2 | 3) => {
    const frame = newFrames[fi];
    if (ball === 1) {
      if (fi < 9 && isStrike(frame)) {
        if (fi < 9) { setActiveFrame(fi + 1); setActiveBall(1); }
      } else {
        setActiveFrame(fi); setActiveBall(2);
      }
    } else if (ball === 2) {
      if (fi === 9) {
        const needBall3 = isStrike(frame) || (frame.ball1 !== null && frame.ball2 !== null && frame.ball1 + frame.ball2 === 10);
        if (needBall3) { setActiveFrame(9); setActiveBall(3); }
      } else {
        if (fi + 1 < 10) { setActiveFrame(fi + 1); setActiveBall(1); }
      }
    }
  }, []);

  const handlePin = useCallback((n: number) => {
    setFrames((prev) => {
      const next = prev.map((f) => ({ ...f }));
      const f = next[activeFrame];

      if (activeBall === 1) {
        f.ball1 = n === 10 ? 10 : n;
        f.ball2 = null;
        f.ball3 = null;
      } else if (activeBall === 2) {
        if (n === -1) {
          f.ball2 = activeFrame < 9 ? (10 - (f.ball1 ?? 0)) : (10 - (f.ball1 ?? 0));
        } else {
          f.ball2 = n;
        }
        f.ball3 = null;
      } else {
        f.ball3 = n === -1 ? (10 - (f.ball2 ?? 0)) : n;
      }

      advanceCursor(next, activeFrame, activeBall);
      return next;
    });
    Haptics.selectionAsync();
  }, [activeFrame, activeBall, advanceCursor]);

  const handleBack = useCallback(() => {
    setFrames((prev) => {
      const next = prev.map((f) => ({ ...f }));
      if (activeBall === 3) {
        next[activeFrame].ball3 = null;
        setActiveBall(2);
      } else if (activeBall === 2) {
        next[activeFrame].ball2 = null;
        setActiveBall(1);
      } else if (activeFrame > 0) {
        const prevFi = activeFrame - 1;
        const prevF = next[prevFi];
        if (prevFi < 9 && isStrike(prevF)) {
          next[prevFi].ball1 = null;
          setActiveFrame(prevFi); setActiveBall(1);
        } else {
          next[prevFi].ball2 = null;
          setActiveFrame(prevFi); setActiveBall(2);
        }
      }
      return next;
    });
  }, [activeFrame, activeBall]);

  const getMaxPins = useCallback((): number => {
    const f = frames[activeFrame];
    if (activeBall === 1) return 10;
    if (activeBall === 2) {
      if (activeFrame === 9 && f.ball1 === 10) return 10;
      return 10 - (f.ball1 ?? 0);
    }
    if (activeBall === 3) {
      if (f.ball2 === 10) return 10;
      return 10 - (f.ball2 ?? 0);
    }
    return 10;
  }, [frames, activeFrame, activeBall]);

  const getAllowSpare = useCallback((): boolean => {
    const f = frames[activeFrame];
    if (activeBall === 2 && f.ball1 !== null && f.ball1 < 10) return true;
    if (activeBall === 3 && f.ball2 !== null && f.ball2 < 10 && (f.ball1 === 10 || (f.ball1 !== null && f.ball2 !== null && f.ball1 + f.ball2 === 10))) return true;
    return false;
  }, [frames, activeFrame, activeBall]);

  // ── Photo scorecard flow ──────────────────────────────────────────────────

  const handlePhotoScorecard = async () => {
    try {
      const [camPerm, locPerm] = await Promise.all([
        ImagePicker.requestCameraPermissionsAsync(),
        Location.requestForegroundPermissionsAsync(),
      ]);

      if (camPerm.status !== "granted") {
        Alert.alert("Camera Permission", "Camera access is needed to photograph your scorecard.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        quality: 0.85,
        base64: true,
        exif: false,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setPhotoUri(asset.uri);
      setStep("analyzing");
      setAnalyzeError(null);

      let locMeta: LocationMeta | null = null;
      if (locPerm.status === "granted") {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          let locationName = "Unknown location";
          try {
            const [place] = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            if (place) {
              const parts = [place.name, place.city, place.region].filter(Boolean);
              locationName = parts.join(", ");
            }
          } catch { /* ignore reverse geocode errors */ }
          locMeta = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            locationName,
            capturedAt: new Date().toISOString(),
          };
          setLocationMeta(locMeta);
        } catch { /* location failed, not blocking */ }
      }

      // Send to AI
      const base64 = asset.base64;
      if (!base64) {
        setAnalyzeError("Could not read image data");
        setStep("method");
        return;
      }

      let data: {
        frames?: { ball1: number | null; ball2: number | null; ball3: number | null }[];
        confidence?: string;
      };
      try {
        data = await api.post<typeof data>("/games/scorecard/analyze", {
          imageBase64: base64,
          mimeType: "image/jpeg",
        });
      } catch (apiErr) {
        setAnalyzeError((apiErr as Error).message ?? "Analysis failed");
        setStep("method");
        return;
      }

      if (data.frames && data.frames.length === 10) {
        const newFrames = data.frames.map((f) => ({
          ball1: f.ball1,
          ball2: f.ball2,
          ball3: f.ball3,
        })) as FrameData[];
        setFrames(newFrames);
        // Find last incomplete frame for cursor
        const lastDone = newFrames.findLastIndex((f, i) => isFrameComplete(f, i));
        setActiveFrame(Math.min(lastDone + 1, 9));
        setActiveBall(1);
      } else {
        setAnalyzeError("Could not extract frame data from scorecard");
        setStep("method");
        return;
      }

      setStep("confirm");
    } catch (err) {
      setAnalyzeError("Something went wrong. Try again.");
      setStep("method");
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setStep("verifying");
    setIsLogging(true);

    // Upload scorecard image if we have one
    let scorecardImageUrl: string | null = null;
    if (photoUri) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id;
        const ext = "jpg";
        const path = `${userId}/${Date.now()}.${ext}`;
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const { error: uploadErr } = await supabase.storage
          .from("scorecards")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("scorecards").getPublicUrl(path);
          scorecardImageUrl = urlData?.publicUrl ?? null;
        }
      } catch { /* non-blocking */ }
    }

    await new Promise((r) => setTimeout(r, 2000));

    const score = currentTotal;
    await logGame({
      score,
      date: new Date().toISOString().split("T")[0],
      alley,
      oilPattern,
      ballUsed: selectedBall?.name ?? "",
      ballId: selectedBall ? Number(selectedBall.id) : null,
      notes,
      verified: !!photoUri,
      frames,
      scorecardImageUrl,
      latitude: locationMeta?.latitude ?? null,
      longitude: locationMeta?.longitude ?? null,
      locationName: locationMeta?.locationName ?? null,
      capturedAt: locationMeta?.capturedAt ?? null,
      entryMethod: photoUri ? "photo" : "manual",
    } as Parameters<typeof logGame>[0]);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsLogging(false);
    setModalVisible(false);
    resetAll();
  };

  // ── Render sheet content ──────────────────────────────────────────────────

  const renderContent = () => {
    if (step === "verifying") {
      return (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.sheetTitle, { color: colors.foreground, marginTop: 16 }]}>
            {photoUri ? "Saving scorecard…" : "Logging game…"}
          </Text>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            {photoUri ? "Attaching verified scorecard & location" : "Calculating XP & updating stats"}
          </Text>
        </View>
      );
    }

    if (step === "analyzing") {
      return (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.sheetTitle, { color: colors.foreground, marginTop: 16 }]}>
            Reading Scorecard…
          </Text>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
            AI is extracting your frame scores
          </Text>
          {locationMeta && (
            <View style={[styles.locationBadge, { backgroundColor: colors.card }]}>
              <Feather name="map-pin" size={12} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
                {locationMeta.locationName}
              </Text>
            </View>
          )}
        </View>
      );
    }

    if (step === "method") {
      return (
        <>
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Log a Game</Text>
          {analyzeError && (
            <View style={[styles.errorBanner, { backgroundColor: "#ff3b3022" }]}>
              <Feather name="alert-circle" size={14} color="#ff3b30" />
              <Text style={{ color: "#ff3b30", fontSize: 13, flex: 1 }}>{analyzeError}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.methodCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
            onPress={() => setStep("frames")}
            activeOpacity={0.85}
          >
            <View style={[styles.methodIcon, { backgroundColor: colors.primary + "22" }]}>
              <Feather name="grid" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodTitle, { color: colors.foreground }]}>Frame by Frame</Text>
              <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>
                Enter each frame manually · Auto-calculates total
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handlePhotoScorecard}
            activeOpacity={0.85}
          >
            <View style={[styles.methodIcon, { backgroundColor: colors.card }]}>
              <Feather name="camera" size={24} color={colors.foreground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodTitle, { color: colors.foreground }]}>Photo Scorecard</Text>
              <Text style={[styles.methodSub, { color: colors.mutedForeground }]}>
                Snap your scorecard · AI reads frames · GPS verified
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </>
      );
    }

    if (step === "frames" || step === "confirm") {
      const isConfirm = step === "confirm";
      return (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={() => setStep(isConfirm ? "method" : "method")}>
              <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: colors.foreground, marginBottom: 0 }]}>
              {isConfirm ? "Confirm Scorecard" : "Frame Entry"}
            </Text>
            <View style={{ width: 20 }} />
          </View>

          {isConfirm && photoUri && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Image source={{ uri: photoUri }} style={styles.photoThumb} contentFit="cover" />
              <View style={{ flex: 1, gap: 4 }}>
                {locationMeta && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Feather name="map-pin" size={11} color={colors.primary} />
                    <Text style={[styles.locationText, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {locationMeta.locationName}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Feather name="clock" size={11} color={colors.mutedForeground} />
                  <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
                    {locationMeta ? new Date(locationMeta.capturedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Feather name="shield" size={11} color={colors.primary} />
                  <Text style={[styles.locationText, { color: colors.primary, fontWeight: "700" }]}>GPS Verified</Text>
                </View>
              </View>
            </View>
          )}

          <View style={[styles.totalRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>CURRENT TOTAL</Text>
            <Text style={[styles.totalNum, { color: currentTotal > 0 ? colors.primary : colors.mutedForeground }]}>
              {currentTotal > 0 ? currentTotal : "—"}
            </Text>
          </View>

          <ScorecardGrid
            frames={frames}
            activeFrame={activeFrame}
            activeBall={activeBall}
            frameScores={frameScores}
            colors={colors}
          />

          <PinKeypad
            onPin={handlePin}
            onBack={handleBack}
            maxPins={getMaxPins()}
            allowSpare={getAllowSpare()}
            colors={colors}
          />

          <TouchableOpacity
            style={[
              styles.nextBtn,
              { backgroundColor: done ? colors.primary : colors.muted },
            ]}
            onPress={() => done && setStep("details")}
            disabled={!done}
            activeOpacity={0.85}
          >
            <Text style={[styles.nextBtnText, { color: done ? colors.primaryForeground : colors.mutedForeground }]}>
              {isConfirm ? `Looks Good — ${currentTotal} pts` : `Continue — ${currentTotal} pts`}
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    if (step === "details") {
      return (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={() => setStep(photoUri ? "confirm" : "frames")}>
              <Feather name="arrow-left" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: colors.foreground, marginBottom: 0 }]}>
              Game Details
            </Text>
            <View style={{ width: 20 }} />
          </View>

          <View style={[styles.totalRow, { backgroundColor: colors.card }]}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>FINAL SCORE</Text>
            <Text style={[styles.totalNum, { color: colors.primary }]}>{currentTotal}</Text>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>ALLEY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
            {ALLEYS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.optionPill, { backgroundColor: alley === a ? colors.foreground : colors.secondary, borderColor: alley === a ? colors.foreground : colors.border }]}
                onPress={() => setAlley(a)}
              >
                <Text style={[styles.optionPillText, { color: alley === a ? colors.background : colors.foreground }]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>OIL PATTERN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
            {OIL_PATTERNS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.optionPill, { backgroundColor: oilPattern === p ? colors.foreground : colors.secondary, borderColor: oilPattern === p ? colors.foreground : colors.border }]}
                onPress={() => setOilPattern(p)}
              >
                <Text style={[styles.optionPillText, { color: oilPattern === p ? colors.background : colors.foreground }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 0 }]}>BALL USED</Text>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetAll(); router.push("/arsenal/new"); }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.primary, letterSpacing: 0.5 }}>+ ADD BALL</Text>
            </TouchableOpacity>
          </View>
          {activeBalls.length === 0 ? (
            <TouchableOpacity
              style={[styles.optionPill, { backgroundColor: colors.secondary, borderColor: colors.border, alignSelf: "flex-start", marginTop: 4 }]}
              onPress={() => { setModalVisible(false); resetAll(); router.push("/arsenal" as any); }}
            >
              <Text style={[styles.optionPillText, { color: colors.mutedForeground }]}>No balls in arsenal — tap to add</Text>
            </TouchableOpacity>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.optionPill, { backgroundColor: selectedBall === null ? colors.foreground : colors.secondary, borderColor: selectedBall === null ? colors.foreground : colors.border }]}
                onPress={() => setSelectedBall(null)}
              >
                <Text style={[styles.optionPillText, { color: selectedBall === null ? colors.background : colors.foreground }]}>None</Text>
              </TouchableOpacity>
              {activeBalls.map((b) => {
                const sel = selectedBall?.id === b.id;
                return (
                  <TouchableOpacity key={b.id} style={[styles.optionPill, { backgroundColor: sel ? colors.foreground : colors.secondary, borderColor: sel ? colors.foreground : colors.border }]} onPress={() => setSelectedBall(b)}>
                    <Text style={[styles.optionPillText, { color: sel ? colors.background : colors.foreground }]}>{b.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primary, marginTop: 8 }]}
            onPress={handleSubmit}
            disabled={isLogging}
            activeOpacity={0.85}
          >
            <Feather name="check-circle" size={16} color={colors.primaryForeground} />
            <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>
              {photoUri ? "Submit Verified Score" : "Submit Score"}
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    return null;
  };

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }} />
      <View style={[styles.header, { paddingTop: 12, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>SCORE LOG</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {games.length} games tracked
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.logBtn, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus-square" size={16} color={colors.primaryForeground} />
          <Text style={[styles.logBtnText, { color: colors.primaryForeground }]}>Log Game</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsRow, { paddingHorizontal: 16, gap: 12 }]}>
        {[
          { label: "CAREER AVG", value: user.careerAvg },
          { label: "HIGH GAME", value: user.highGame },
          { label: "LAST 5 AVG", value: recentAvg },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENT GAMES</Text>
        {games.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="activity" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No games logged yet</Text>
          </View>
        ) : (
          games.map((g) => <GameRow key={g.id} game={g} />)
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { if (!isLogging) { setModalVisible(false); resetAll(); } }}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => { if (!isLogging && step !== "analyzing" && step !== "verifying") { setModalVisible(false); resetAll(); } }}
        >
          <Pressable style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ gap: 14, paddingBottom: Platform.OS === "ios" ? insets.bottom + 16 : 24 }}>
                {renderContent()}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: 1.5 },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2, letterSpacing: 0.5 },
  logBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 50 },
  logBtnText: { fontSize: 14, fontWeight: "700" },
  statsRow: { flexDirection: "row", marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: "center", gap: 4 },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  list: { paddingHorizontal: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 4 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },
  gameRow: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, padding: 14 },
  scoreBox: { width: 54, height: 54, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  scoreBoxNum: { fontSize: 20, fontWeight: "800" },
  gameInfo: { flex: 1, gap: 3 },
  gameName: { fontSize: 14, fontWeight: "700" },
  gameMeta: { fontSize: 12 },
  gameBall: { fontSize: 12 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 50 },
  verifiedText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  bottomSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: "92%" },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: "800" },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginTop: 4 },
  nextBtn: { borderRadius: 50, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  nextBtnText: { fontSize: 15, fontWeight: "800" },
  optionRow: { marginBottom: 4 },
  optionPill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  optionPillText: { fontSize: 13, fontWeight: "600" },
  centerBlock: { alignItems: "center", paddingVertical: 48, gap: 8 },
  // Method cards
  methodCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 20, padding: 18, borderWidth: 1.5 },
  methodIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  methodTitle: { fontSize: 16, fontWeight: "700" },
  methodSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  // Scorecard
  scorecardRow: { flexDirection: "row", gap: 4, paddingVertical: 8 },
  frameCell: { width: 46, borderRadius: 10, borderWidth: 1, padding: 4, alignItems: "center", gap: 2 },
  frameCellLast: { width: 62 },
  frameNum: { fontSize: 8, fontWeight: "700", letterSpacing: 0.5 },
  ballRow: { flexDirection: "row", gap: 2 },
  ballBox: { width: 18, height: 18, borderRadius: 4, justifyContent: "center", alignItems: "center" },
  ballText: { fontSize: 11, fontWeight: "600" },
  frameScore: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  // Keypad
  keypad: { gap: 8 },
  keypadGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  keyBtn: { width: 56, height: 48, borderRadius: 12, borderWidth: 1, justifyContent: "center", alignItems: "center" },
  keyBtnText: { fontSize: 18, fontWeight: "700" },
  // Total row
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12 },
  totalLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  totalNum: { fontSize: 36, fontWeight: "900" },
  // Photo / location
  photoThumb: { width: 72, height: 54, borderRadius: 10 },
  locationBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 50, marginTop: 8 },
  locationText: { fontSize: 12 },
  // Error
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12 },
});
