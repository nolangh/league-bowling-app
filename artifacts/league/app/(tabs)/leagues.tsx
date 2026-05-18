import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, type League, type CreateLeagueInput } from "@/context/AppContext";

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: "#a8c870",
  INTERMEDIATE: "#60c8ff",
  ADVANCED: "#f5c842",
  EXPERT: "#c8a8e8",
};

const LEVEL_OPTIONS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

function LeagueCard({
  league,
  onJoin,
  onPress,
}: {
  league: League;
  onJoin: () => void;
  onPress: () => void;
}) {
  const colors = useColors();
  const levelColor = LEVEL_COLORS[league.level] ?? colors.primary;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <View style={styles.nameRow}>
            <Text style={[styles.leagueName, { color: colors.foreground }]}>{league.name}</Text>
            {league.type === "private" && (
              <View style={[styles.privateBadge, { backgroundColor: colors.muted }]}>
                <Feather name="lock" size={10} color={colors.mutedForeground} />
              </View>
            )}
            {league.joined && (
              <View style={[styles.joinedBadge, { backgroundColor: colors.primary + "22" }]}>
                <Text style={[styles.joinedBadgeText, { color: colors.primary }]}>JOINED</Text>
              </View>
            )}
            {league.myRole === "admin" && (
              <View style={[styles.adminBadge, { backgroundColor: "#f5c84222" }]}>
                <Text style={[styles.adminBadgeText, { color: "#c8a000" }]}>ADMIN</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.levelPill, { backgroundColor: levelColor + "22" }]}>
              <Text style={[styles.levelText, { color: levelColor }]}>{league.level}</Text>
            </View>
            <Text style={[styles.members, { color: colors.mutedForeground }]}>
              <Feather name="users" size={11} /> {league.members} members
            </Text>
          </View>
        </View>
        <View style={styles.cardTopRight}>
          <Text style={[styles.avgLabel, { color: colors.mutedForeground }]}>AVG</Text>
          <Text style={[styles.avgScore, { color: colors.foreground }]}>{league.avgScore}</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.mutedForeground }]}>{league.description}</Text>

      {league.weeklyChallenge && (
        <View style={[styles.weeklyChallenge, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="zap" size={12} color={colors.primary} />
          <Text style={[styles.weeklyText, { color: colors.primary }]}>{league.weeklyChallenge}</Text>
        </View>
      )}

      {!league.joined && (
        <TouchableOpacity
          style={[
            styles.joinBtn,
            {
              backgroundColor: league.type === "private" ? colors.secondary : colors.primary,
              borderWidth: league.type === "private" ? 1 : 0,
              borderColor: colors.border,
            },
          ]}
          onPress={(e) => { e.stopPropagation(); onJoin(); }}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.joinBtnText,
              { color: league.type === "private" ? colors.foreground : colors.primaryForeground },
            ]}
          >
            {league.type === "private" ? "Request to Join" : "Join League"}
          </Text>
        </TouchableOpacity>
      )}

      {league.joined && (
        <View style={[styles.viewBtn, { backgroundColor: colors.foreground + "0d" }]}>
          <Text style={[styles.viewBtnText, { color: colors.foreground }]}>View League</Text>
          <Feather name="chevron-right" size={14} color={colors.foreground} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const POINT_SYSTEM_LABELS: Record<string, string> = {
  standard: "Standard (2 pts/game, 1 pt/series)",
  petersen: "Petersen Points",
  head_to_head: "Head-to-Head (win/loss)",
  total_pins: "Total Pins",
};

const MEET_DAYS_LIST = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

function CreateLeagueWizard({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: CreateLeagueInput) => Promise<void>;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [format, setFormat] = useState<"casual" | "traditional">("casual");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"public" | "private">("public");
  const [level, setLevel] = useState("INTERMEDIATE");

  const [teamSize, setTeamSize] = useState(4);
  const [seasonStart, setSeasonStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [seasonWeeks, setSeasonWeeks] = useState(12);
  const [meetDay, setMeetDay] = useState("wednesday");
  const [meetTime, setMeetTime] = useState("19:00");

  const [scoringType, setScoringType] = useState<"scratch" | "handicap">("handicap");
  const [handicapBase, setHandicapBase] = useState(220);
  const [handicapPercent, setHandicapPercent] = useState(80);
  const [pointSystem, setPointSystem] = useState("standard");
  const [absenteeScore, setAbsenteeScore] = useState(140);

  const [weeklyChallenge, setWeeklyChallenge] = useState("");
  const [fees, setFees] = useState("");
  const [rules, setRules] = useState("");

  const defaultSeasonStart = () => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  };

  const reset = () => {
    setStep(0); setError(""); setSubmitting(false);
    setFormat("casual");
    setName(""); setDescription(""); setType("public"); setLevel("INTERMEDIATE");
    setTeamSize(4); setSeasonStart(defaultSeasonStart()); setSeasonWeeks(12);
    setMeetDay("wednesday"); setMeetTime("19:00");
    setScoringType("handicap"); setHandicapBase(220); setHandicapPercent(80);
    setPointSystem("standard"); setAbsenteeScore(140);
    setWeeklyChallenge(""); setFees(""); setRules("");
  };

  const handleClose = () => { reset(); onClose(); };

  const steps = format === "traditional"
    ? ["Format", "Basics", "Team & Schedule", "Scoring", "Extras", "Review"]
    : ["Format", "Basics", "Extras", "Review"];

  const validateBasics = () => {
    if (!name.trim()) { setError("League name is required."); return false; }
    if (!description.trim()) { setError("Description is required."); return false; }
    return true;
  };

  const validateSchedule = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(seasonStart)) { setError("Season start must be YYYY-MM-DD."); return false; }
    if (!/^\d{2}:\d{2}$/.test(meetTime)) { setError("Meet time must be HH:MM (24-hour)."); return false; }
    return true;
  };

  const goNext = () => {
    setError("");
    const stepName = steps[step];
    if (stepName === "Basics" && !validateBasics()) return;
    if (stepName === "Team & Schedule" && !validateSchedule()) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const goBack = () => { setError(""); setStep((s) => Math.max(0, s - 1)); };

  const handleCreate = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload: CreateLeagueInput = {
        name: name.trim(),
        description: description.trim(),
        type, level, format,
        weeklyChallenge: weeklyChallenge.trim() || undefined,
        fees: fees.trim() || undefined,
        rules: rules.trim() || undefined,
      };
      if (format === "traditional") {
        Object.assign(payload, {
          teamSize, seasonStart, seasonWeeks, meetDay, meetTime, scoringType,
          pointSystem, absenteeScore,
          ...(scoringType === "handicap" ? { handicapBase, handicapPercent } : {}),
        });
      }
      await onCreate(payload);
      reset();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create league.");
    }
    setSubmitting(false);
  };

  const currentStepName = steps[step];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }} />

        <View style={[createStyles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={[createStyles.title, { color: colors.foreground }]}>Create League</Text>
            <Text style={[createStyles.stepLabel, { color: colors.mutedForeground }]}>
              Step {step + 1} of {steps.length} · {currentStepName}
            </Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        <View style={[createStyles.progress, { backgroundColor: colors.muted }]}>
          <View style={[createStyles.progressFill, { backgroundColor: colors.primary, width: `${((step + 1) / steps.length) * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={[createStyles.body, { paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">

          {currentStepName === "Format" && (
            <View style={{ gap: 12 }}>
              <Text style={[createStyles.stepTitle, { color: colors.foreground }]}>How will this league run?</Text>
              <Text style={[createStyles.stepSub, { color: colors.mutedForeground }]}>You can change other details later — but format is fixed once created.</Text>
              {([
                { key: "casual", icon: "users" as const, title: "Casual / Social", body: "Open group for friends or community. No fixed schedule or teams." },
                { key: "traditional", icon: "award" as const, title: "Traditional League", body: "Weekly team play with handicap, points, and standings (USBC-style)." },
              ] as const).map((opt) => {
                const active = format === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[createStyles.formatCard, {
                      backgroundColor: active ? colors.primary + "1a" : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    }]}
                    onPress={() => setFormat(opt.key)}
                    activeOpacity={0.85}
                  >
                    <View style={[createStyles.formatIcon, { backgroundColor: active ? colors.primary : colors.muted }]}>
                      <Feather name={opt.icon} size={20} color={active ? colors.primaryForeground : colors.mutedForeground} />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[createStyles.formatTitle, { color: colors.foreground }]}>{opt.title}</Text>
                      <Text style={[createStyles.formatBody, { color: colors.mutedForeground }]}>{opt.body}</Text>
                    </View>
                    {active && <Feather name="check-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {currentStepName === "Basics" && (
            <View>
              <Text style={[createStyles.label, { color: colors.foreground }]}>League Name *</Text>
              <TextInput
                style={[createStyles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g. Thunder Lanes Elite"
                placeholderTextColor={colors.mutedForeground}
                value={name} onChangeText={setName} maxLength={100}
              />

              <Text style={[createStyles.label, { color: colors.foreground }]}>Description *</Text>
              <TextInput
                style={[createStyles.input, createStyles.multiline, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="What's this league about?"
                placeholderTextColor={colors.mutedForeground}
                value={description} onChangeText={setDescription} multiline maxLength={500}
              />

              <Text style={[createStyles.label, { color: colors.foreground }]}>Visibility</Text>
              <View style={createStyles.toggleRow}>
                {(["public", "private"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[createStyles.toggleBtn, {
                      backgroundColor: type === t ? colors.foreground : colors.card,
                      borderColor: type === t ? colors.foreground : colors.border,
                    }]}
                    onPress={() => setType(t)}
                  >
                    <Feather name={t === "public" ? "globe" : "lock"} size={13} color={type === t ? colors.background : colors.mutedForeground} />
                    <Text style={[createStyles.toggleText, { color: type === t ? colors.background : colors.foreground }]}>
                      {t === "public" ? "Public" : "Private"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[createStyles.label, { color: colors.foreground }]}>Skill Level</Text>
              <View style={createStyles.levelGrid}>
                {LEVEL_OPTIONS.map((l) => {
                  const lc = LEVEL_COLORS[l] ?? colors.primary;
                  const active = level === l;
                  return (
                    <TouchableOpacity
                      key={l}
                      style={[createStyles.levelBtn, {
                        backgroundColor: active ? lc + "33" : colors.card,
                        borderColor: active ? lc : colors.border,
                      }]}
                      onPress={() => setLevel(l)}
                    >
                      <Text style={[createStyles.levelBtnText, { color: active ? lc : colors.mutedForeground }]}>{l}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {currentStepName === "Team & Schedule" && (
            <View>
              <Text style={[createStyles.label, { color: colors.foreground }]}>Team Size (bowlers per team)</Text>
              <View style={createStyles.pillRow}>
                {[2,3,4,5].map((n) => {
                  const active = teamSize === n;
                  return (
                    <TouchableOpacity
                      key={n}
                      style={[createStyles.smallPill, {
                        backgroundColor: active ? colors.foreground : colors.card,
                        borderColor: active ? colors.foreground : colors.border,
                      }]}
                      onPress={() => setTeamSize(n)}
                    >
                      <Text style={[createStyles.smallPillText, { color: active ? colors.background : colors.foreground }]}>{n}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[createStyles.label, { color: colors.foreground }]}>Season Start (YYYY-MM-DD)</Text>
              <TextInput
                style={[createStyles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="2026-06-01"
                placeholderTextColor={colors.mutedForeground}
                value={seasonStart} onChangeText={setSeasonStart} maxLength={10} autoCapitalize="none"
              />

              <Text style={[createStyles.label, { color: colors.foreground }]}>Season Length (weeks)</Text>
              <View style={createStyles.pillRow}>
                {[8, 10, 12, 16, 20, 32].map((w) => {
                  const active = seasonWeeks === w;
                  return (
                    <TouchableOpacity
                      key={w}
                      style={[createStyles.smallPill, {
                        backgroundColor: active ? colors.foreground : colors.card,
                        borderColor: active ? colors.foreground : colors.border,
                      }]}
                      onPress={() => setSeasonWeeks(w)}
                    >
                      <Text style={[createStyles.smallPillText, { color: active ? colors.background : colors.foreground }]}>{w}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[createStyles.label, { color: colors.foreground }]}>Meet Day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {MEET_DAYS_LIST.map((d) => {
                  const active = meetDay === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[createStyles.smallPill, {
                        backgroundColor: active ? colors.foreground : colors.card,
                        borderColor: active ? colors.foreground : colors.border,
                      }]}
                      onPress={() => setMeetDay(d)}
                    >
                      <Text style={[createStyles.smallPillText, { color: active ? colors.background : colors.foreground }]}>
                        {d.slice(0,3).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[createStyles.label, { color: colors.foreground }]}>Meet Time (24h, HH:MM)</Text>
              <TextInput
                style={[createStyles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="19:00"
                placeholderTextColor={colors.mutedForeground}
                value={meetTime} onChangeText={setMeetTime} maxLength={5} autoCapitalize="none"
              />
            </View>
          )}

          {currentStepName === "Scoring" && (
            <View>
              <Text style={[createStyles.label, { color: colors.foreground }]}>Scoring Type</Text>
              <View style={createStyles.toggleRow}>
                {(["scratch", "handicap"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[createStyles.toggleBtn, {
                      backgroundColor: scoringType === t ? colors.foreground : colors.card,
                      borderColor: scoringType === t ? colors.foreground : colors.border,
                    }]}
                    onPress={() => setScoringType(t)}
                  >
                    <Text style={[createStyles.toggleText, { color: scoringType === t ? colors.background : colors.foreground }]}>
                      {t === "scratch" ? "Scratch" : "Handicap"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[createStyles.helperText, { color: colors.mutedForeground }]}>
                {scoringType === "scratch"
                  ? "Raw scores only — best for similar skill levels."
                  : "Lower averages get a bonus to make games competitive."}
              </Text>

              {scoringType === "handicap" && (
                <>
                  <Text style={[createStyles.label, { color: colors.foreground }]}>Handicap Base (target score)</Text>
                  <View style={createStyles.pillRow}>
                    {[200, 210, 220, 230, 240].map((n) => {
                      const active = handicapBase === n;
                      return (
                        <TouchableOpacity
                          key={n}
                          style={[createStyles.smallPill, {
                            backgroundColor: active ? colors.foreground : colors.card,
                            borderColor: active ? colors.foreground : colors.border,
                          }]}
                          onPress={() => setHandicapBase(n)}
                        >
                          <Text style={[createStyles.smallPillText, { color: active ? colors.background : colors.foreground }]}>{n}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[createStyles.label, { color: colors.foreground }]}>Handicap Percentage</Text>
                  <View style={createStyles.pillRow}>
                    {[70, 80, 90, 100].map((n) => {
                      const active = handicapPercent === n;
                      return (
                        <TouchableOpacity
                          key={n}
                          style={[createStyles.smallPill, {
                            backgroundColor: active ? colors.foreground : colors.card,
                            borderColor: active ? colors.foreground : colors.border,
                          }]}
                          onPress={() => setHandicapPercent(n)}
                        >
                          <Text style={[createStyles.smallPillText, { color: active ? colors.background : colors.foreground }]}>{n}%</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={[createStyles.helperText, { color: colors.mutedForeground }]}>
                    Common USBC handicap: ({handicapBase} − avg) × {handicapPercent}%
                  </Text>
                </>
              )}

              <Text style={[createStyles.label, { color: colors.foreground }]}>Point System</Text>
              <View style={{ gap: 8 }}>
                {Object.entries(POINT_SYSTEM_LABELS).map(([key, label]) => {
                  const active = pointSystem === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[createStyles.optionRow, {
                        backgroundColor: active ? colors.primary + "1a" : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      }]}
                      onPress={() => setPointSystem(key)}
                    >
                      <Feather name={active ? "check-circle" : "circle"} size={16} color={active ? colors.primary : colors.mutedForeground} />
                      <Text style={[createStyles.optionRowText, { color: colors.foreground }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[createStyles.label, { color: colors.foreground }]}>Absentee Score</Text>
              <View style={createStyles.pillRow}>
                {[0, 120, 140, 160, 180].map((n) => {
                  const active = absenteeScore === n;
                  return (
                    <TouchableOpacity
                      key={n}
                      style={[createStyles.smallPill, {
                        backgroundColor: active ? colors.foreground : colors.card,
                        borderColor: active ? colors.foreground : colors.border,
                      }]}
                      onPress={() => setAbsenteeScore(n)}
                    >
                      <Text style={[createStyles.smallPillText, { color: active ? colors.background : colors.foreground }]}>
                        {n === 0 ? "None" : n}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[createStyles.helperText, { color: colors.mutedForeground }]}>
                Default score used when a bowler is absent (without sub).
              </Text>
            </View>
          )}

          {currentStepName === "Extras" && (
            <View>
              <Text style={[createStyles.label, { color: colors.foreground }]}>Weekly Challenge <Text style={{ color: colors.mutedForeground, fontWeight: "400" }}>(optional)</Text></Text>
              <TextInput
                style={[createStyles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g. Hit 5 spares without stepping"
                placeholderTextColor={colors.mutedForeground}
                value={weeklyChallenge} onChangeText={setWeeklyChallenge} maxLength={200}
              />

              <Text style={[createStyles.label, { color: colors.foreground }]}>Fees <Text style={{ color: colors.mutedForeground, fontWeight: "400" }}>(optional)</Text></Text>
              <TextInput
                style={[createStyles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                placeholder="e.g. $15/week — $10 lanes + $5 prize fund"
                placeholderTextColor={colors.mutedForeground}
                value={fees} onChangeText={setFees} maxLength={300}
              />

              <Text style={[createStyles.label, { color: colors.foreground }]}>House Rules <Text style={{ color: colors.mutedForeground, fontWeight: "400" }}>(optional)</Text></Text>
              <TextInput
                style={[createStyles.input, createStyles.multiline, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border, minHeight: 120 }]}
                placeholder="Eligibility, playoffs, absentee policy, etc."
                placeholderTextColor={colors.mutedForeground}
                value={rules} onChangeText={setRules} multiline maxLength={2000}
              />
            </View>
          )}

          {currentStepName === "Review" && (
            <View style={{ gap: 10 }}>
              <Text style={[createStyles.stepTitle, { color: colors.foreground }]}>Looks good?</Text>
              <View style={[createStyles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ReviewRow label="Format" value={format === "traditional" ? "Traditional League" : "Casual / Social"} />
                <ReviewRow label="Name" value={name} />
                <ReviewRow label="Type" value={type === "public" ? "Public" : "Private"} />
                <ReviewRow label="Level" value={level} />
                {format === "traditional" && (
                  <>
                    <ReviewRow label="Team Size" value={`${teamSize} bowlers`} />
                    <ReviewRow label="Season" value={`${seasonWeeks} weeks starting ${seasonStart}`} />
                    <ReviewRow label="Meets" value={`${meetDay.slice(0,1).toUpperCase()}${meetDay.slice(1)}s at ${meetTime}`} />
                    <ReviewRow label="Scoring" value={scoringType === "handicap" ? `Handicap (${handicapPercent}% of ${handicapBase})` : "Scratch"} />
                    <ReviewRow label="Points" value={POINT_SYSTEM_LABELS[pointSystem]} />
                    <ReviewRow label="Absentee" value={absenteeScore === 0 ? "None" : String(absenteeScore)} />
                  </>
                )}
                {weeklyChallenge && <ReviewRow label="Weekly Challenge" value={weeklyChallenge} />}
                {fees && <ReviewRow label="Fees" value={fees} />}
              </View>
            </View>
          )}

          {error ? <Text style={createStyles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={[createStyles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          {step > 0 && (
            <TouchableOpacity
              style={[createStyles.footerBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
              onPress={goBack}
              disabled={submitting}
            >
              <Feather name="arrow-left" size={16} color={colors.foreground} />
              <Text style={[createStyles.footerBtnText, { color: colors.foreground }]}>Back</Text>
            </TouchableOpacity>
          )}
          {currentStepName !== "Review" ? (
            <TouchableOpacity
              style={[createStyles.footerBtn, { backgroundColor: colors.primary, flex: 1 }]}
              onPress={goNext}
            >
              <Text style={[createStyles.footerBtnText, { color: colors.primaryForeground }]}>Continue</Text>
              <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[createStyles.footerBtn, { backgroundColor: colors.primary, flex: 1, opacity: submitting ? 0.7 : 1 }]}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.primaryForeground} size="small" />
              ) : (
                <>
                  <Feather name="check" size={16} color={colors.primaryForeground} />
                  <Text style={[createStyles.footerBtnText, { color: colors.primaryForeground }]}>Create League</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={createStyles.reviewRow}>
      <Text style={[createStyles.reviewLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[createStyles.reviewValue, { color: colors.foreground }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

export default function LeaguesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { leagues, joinLeague, createLeague, searchLeagues } = useApp();
  const [filter, setFilter] = useState<"all" | "public" | "private">("all");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [joinedLeague, setJoinedLeague] = useState<League | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      await searchLeagues(query, filter);
      setSearching(false);
    }, query ? 300 : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter]);

  const handleJoin = (league: League) => {
    joinLeague(league.id);
    setJoinedLeague(league);
    setSuccessVisible(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCreate = async (input: Parameters<typeof createLeague>[0]) => {
    const created = await createLeague(input);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push(`/leagues/${created.id}` as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }} />
      <View style={[styles.header, { paddingTop: 12, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>LEAGUES</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Find your crew</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary }]}
            onPress={() => setCreateVisible(true)}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={16} color={colors.primaryForeground} />
            <Text style={[styles.createBtnText, { color: colors.primaryForeground }]}>Create</Text>
          </TouchableOpacity>
          <View style={[styles.countBadge, { backgroundColor: colors.card }]}>
            <Text style={[styles.countText, { color: colors.foreground }]}>{leagues.length}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search leagues by name, level, or vibe…"
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {searching && query.length > 0 ? (
          <Feather name="loader" size={16} color={colors.mutedForeground} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Feather name="x-circle" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {(["all", "public", "private"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === f ? colors.foreground : colors.card,
                borderColor: filter === f ? colors.foreground : colors.border,
              },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? colors.background : colors.mutedForeground },
              ]}
            >
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {leagues.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="shield" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No leagues found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {query ? `Nothing matches "${query}"` : "Create one to get started"}
            </Text>
          </View>
        ) : (
          leagues.map((l) => (
            <LeagueCard
              key={l.id}
              league={l}
              onJoin={() => handleJoin(l)}
              onPress={() => router.push(`/leagues/${l.id}` as any)}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={successVisible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setSuccessVisible(false)}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <View style={[styles.successIcon, { backgroundColor: colors.primary }]}>
              <Feather name="check" size={28} color={colors.primaryForeground} />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              {joinedLeague?.type === "private" ? "Request Sent!" : "Joined!"}
            </Text>
            <Text style={[styles.successText, { color: colors.mutedForeground }]}>
              {joinedLeague?.type === "private"
                ? `Your request to join ${joinedLeague?.name} has been sent.`
                : `Welcome to ${joinedLeague?.name}! Get out there and bowl.`}
            </Text>
            <TouchableOpacity
              style={[styles.successBtn, { backgroundColor: colors.primary }]}
              onPress={() => setSuccessVisible(false)}
            >
              <Text style={[styles.successBtnText, { color: colors.primaryForeground }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <CreateLeagueWizard
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreate={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", letterSpacing: 1.5 },
  headerSub: { fontSize: 12, fontWeight: "500", marginTop: 2, letterSpacing: 0.5 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  createBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  createBtnText: { fontSize: 13, fontWeight: "700" },
  countBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  countText: { fontSize: 16, fontWeight: "800" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500", padding: 0 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyText: { fontSize: 13, fontWeight: "500" },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterPill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 },
  filterText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  list: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 20, padding: 16, gap: 12 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTopLeft: { flex: 1, gap: 6 },
  cardTopRight: { alignItems: "flex-end" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  leagueName: { fontSize: 16, fontWeight: "800" },
  privateBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  joinedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  joinedBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  adminBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  adminBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  levelText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  members: { fontSize: 12, fontWeight: "500" },
  avgLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  avgScore: { fontSize: 24, fontWeight: "800" },
  description: { fontSize: 14, lineHeight: 20 },
  weeklyChallenge: { flexDirection: "row", gap: 8, alignItems: "flex-start", padding: 12, borderRadius: 12 },
  weeklyText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  joinBtn: { borderRadius: 50, paddingVertical: 14, alignItems: "center" },
  joinBtnText: { fontSize: 14, fontWeight: "700" },
  viewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 50, paddingVertical: 12 },
  viewBtnText: { fontSize: 14, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  successCard: { borderRadius: 24, padding: 28, alignItems: "center", gap: 12, width: "100%" },
  successIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  successBtn: { borderRadius: 50, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8 },
  successBtnText: { fontSize: 15, fontWeight: "800" },
});

const createStyles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 17, fontWeight: "800" },
  stepLabel: { fontSize: 11, fontWeight: "600", marginTop: 3, letterSpacing: 0.3 },
  progress: { height: 3, width: "100%" },
  progressFill: { height: 3 },
  body: { paddingHorizontal: 20, paddingTop: 20, gap: 6 },
  stepTitle: { fontSize: 20, fontWeight: "800", marginTop: 4 },
  stepSub: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3, marginBottom: 6, marginTop: 16 },
  helperText: { fontSize: 12, lineHeight: 17, marginTop: 6, fontStyle: "italic" },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  multiline: { height: 90, textAlignVertical: "top" },
  toggleRow: { flexDirection: "row", gap: 10 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 12 },
  toggleText: { fontSize: 14, fontWeight: "700" },
  levelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  levelBtn: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 },
  levelBtnText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  smallPill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 9, minWidth: 56, alignItems: "center" },
  smallPillText: { fontSize: 13, fontWeight: "700" },
  formatCard: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 2, borderRadius: 18, padding: 16 },
  formatIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  formatTitle: { fontSize: 15, fontWeight: "800" },
  formatBody: { fontSize: 13, lineHeight: 18 },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  optionRowText: { fontSize: 14, fontWeight: "600", flex: 1 },
  reviewCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  reviewRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  reviewLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase", flexShrink: 0 },
  reviewValue: { fontSize: 14, fontWeight: "600", flex: 1, textAlign: "right" },
  error: { color: "#e05050", fontSize: 13, fontWeight: "600", marginTop: 12, paddingHorizontal: 4 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
  footerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 50, paddingHorizontal: 22, paddingVertical: 14 },
  footerBtnText: { fontSize: 15, fontWeight: "800" },
});
