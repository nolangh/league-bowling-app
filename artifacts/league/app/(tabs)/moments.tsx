import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, type Moment } from "@/context/AppContext";
import { RankBadge } from "@/components/RankBadge";
import { api } from "@/lib/api";

type FilterKey = "all" | "game" | "challenge" | "advice";

const TYPE_ICONS: Record<string, string> = {
  strike: "zap", game: "activity", challenge: "dollar-sign", advice: "message-circle",
};

function TagPill({ tag, onPress }: { tag: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={[styles.tagPill, { backgroundColor: colors.primary + "22" }]}>
      <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
    </TouchableOpacity>
  );
}

function MomentCard({
  moment,
  onLike,
  onDislike,
  onSave,
  onComment,
  onTagPress,
}: {
  moment: Moment;
  onLike: () => void;
  onDislike: () => void;
  onSave: () => void;
  onComment: () => void;
  onTagPress: (tag: string) => void;
}) {
  const colors = useColors();
  const typeColor: Record<string, string> = {
    strike: colors.primary, game: "#60c8ff", challenge: "#f5c842", advice: colors.mutedForeground,
  };
  const tColor = typeColor[moment.type] ?? colors.mutedForeground;
  const iconName = TYPE_ICONS[moment.type] ?? "circle";

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: moment.avatarColor }]}>
          <Text style={styles.avatarText}>{moment.initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.userRow}>
            <Text style={[styles.username, { color: colors.foreground }]}>{moment.username}</Text>
            <View style={[styles.typePill, { backgroundColor: tColor + "22" }]}>
              <Feather name={iconName as any} size={10} color={tColor} />
              <Text style={[styles.typeText, { color: tColor }]}>{moment.type.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.rankRow}>
            <RankBadge rank={moment.rank} small />
            <Text style={[styles.timeAgo, { color: colors.mutedForeground }]}>{moment.timeAgo}</Text>
          </View>
        </View>
      </View>

      {moment.score !== undefined && (
        <View style={[styles.scoreChip, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.scoreChipNumber, { color: colors.primary }]}>{moment.score}</Text>
          <Text style={[styles.scoreChipLabel, { color: colors.primary }]}>pts</Text>
        </View>
      )}

      <Text style={[styles.content, { color: colors.foreground }]}>{moment.content}</Text>

      {moment.tags && moment.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {moment.tags.map((tag) => (
            <TagPill key={tag} tag={tag} onPress={() => onTagPress(tag)} />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike} activeOpacity={0.7}>
          <Feather name="heart" size={17} color={moment.liked ? "#ef4444" : colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: moment.liked ? "#ef4444" : colors.mutedForeground }]}>
            {moment.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onDislike} activeOpacity={0.7}>
          <Feather name="thumbs-down" size={17} color={moment.disliked ? "#f97316" : colors.mutedForeground} />
          {moment.dislikes > 0 && (
            <Text style={[styles.actionCount, { color: moment.disliked ? "#f97316" : colors.mutedForeground }]}>
              {moment.dislikes}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onComment} activeOpacity={0.7}>
          <Feather name="message-circle" size={17} color={colors.mutedForeground} />
          <Text style={[styles.actionCount, { color: colors.mutedForeground }]}>{moment.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onSave} activeOpacity={0.7}>
          <Feather name={moment.saved ? "bookmark" : "bookmark"} size={17}
            color={moment.saved ? colors.primary : colors.mutedForeground} />
          {moment.saves > 0 && (
            <Text style={[styles.actionCount, { color: moment.saved ? colors.primary : colors.mutedForeground }]}>
              {moment.saves}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PostComposer({ visible, onClose, onPost }: {
  visible: boolean;
  onClose: () => void;
  onPost: (content: string, type: Moment["type"], score?: number, tags?: string[]) => void;
}) {
  const colors = useColors();
  const [content, setContent] = useState("");
  const [type, setType] = useState<Moment["type"]>("advice");
  const [score, setScore] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const types: { key: Moment["type"]; label: string; icon: string }[] = [
    { key: "advice", label: "Tip", icon: "message-circle" },
    { key: "game", label: "Game", icon: "activity" },
    { key: "strike", label: "Strike", icon: "zap" },
    { key: "challenge", label: "Challenge", icon: "dollar-sign" },
  ];

  const handlePost = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    const tagMatches = content.match(/#(\w+)/g) ?? [];
    const tags = tagMatches.map((t) => t.slice(1).toLowerCase());
    const parsedScore = score && !isNaN(parseInt(score)) ? parseInt(score) : undefined;
    onPost(content.trim(), type, parsedScore, tags);
    setContent("");
    setScore("");
    setType("advice");
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={[styles.composerSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.composerTitle, { color: colors.foreground }]}>New Post</Text>

            <View style={styles.typeRow}>
              {types.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeBtn, { backgroundColor: type === t.key ? colors.primary : colors.secondary }]}
                  onPress={() => setType(t.key)}
                  activeOpacity={0.8}
                >
                  <Feather name={t.icon as any} size={12} color={type === t.key ? colors.primaryForeground : colors.mutedForeground} />
                  <Text style={[styles.typeBtnText, { color: type === t.key ? colors.primaryForeground : colors.mutedForeground }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.composerInput, { backgroundColor: colors.secondary, color: colors.foreground }]}
              placeholder="What's happening at the lanes? Use #hashtags and @mentions"
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={500}
              value={content}
              onChangeText={setContent}
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{content.length}/500</Text>

            {(type === "game" || type === "strike") && (
              <TextInput
                style={[styles.scoreInput, { backgroundColor: colors.secondary, color: colors.foreground }]}
                placeholder="Score (optional)"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                maxLength={3}
                value={score}
                onChangeText={setScore}
              />
            )}

            <TouchableOpacity
              style={[styles.postBtn, { backgroundColor: content.trim() ? colors.primary : colors.secondary }]}
              onPress={handlePost}
              disabled={!content.trim() || submitting}
              activeOpacity={0.85}
            >
              <Text style={[styles.postBtnText, { color: content.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                {submitting ? "Posting..." : "Post"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SaveModal({ visible, onClose, onSave, momentId }: {
  visible: boolean;
  onClose: () => void;
  onSave: (listId?: number) => void;
  momentId: string;
}) {
  const colors = useColors();
  const [lists, setLists] = useState<{ id: number; name: string; count: number }[]>([]);
  const [newListName, setNewListName] = useState("");
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible) {
      api.get<{ id: number; name: string; count: number }[]>("/saves/lists")
        .then(setLists)
        .catch(() => {});
    }
  }, [visible]);

  const createAndSave = async () => {
    if (!newListName.trim()) return;
    try {
      const list = await api.post<{ id: number; name: string }>("/saves/lists", { name: newListName.trim() });
      onSave(list.id);
      setNewListName("");
    } catch { onSave(); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.saveSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.composerTitle, { color: colors.foreground }]}>Save to List</Text>

          <TouchableOpacity style={[styles.saveListRow, { borderBottomColor: colors.border }]} onPress={() => onSave()}>
            <Feather name="bookmark" size={18} color={colors.primary} />
            <Text style={[styles.saveListName, { color: colors.foreground }]}>Quick Save</Text>
          </TouchableOpacity>

          {lists.map((l) => (
            <TouchableOpacity key={l.id} style={[styles.saveListRow, { borderBottomColor: colors.border }]} onPress={() => onSave(l.id)}>
              <Feather name="folder" size={18} color={colors.mutedForeground} />
              <Text style={[styles.saveListName, { color: colors.foreground }]}>{l.name}</Text>
              <Text style={[styles.saveListCount, { color: colors.mutedForeground }]}>{l.count}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.newListRow}>
            <TextInput
              style={[styles.newListInput, { backgroundColor: colors.secondary, color: colors.foreground }]}
              placeholder="New list name…"
              placeholderTextColor={colors.mutedForeground}
              value={newListName}
              onChangeText={setNewListName}
            />
            <TouchableOpacity style={[styles.newListBtn, { backgroundColor: colors.primary }]} onPress={createAndSave}>
              <Feather name="plus" size={16} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function MomentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { moments, toggleLikeMoment, toggleDislikeMoment, saveMoment, unsaveMoment, postMoment } = useApp();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchText, setSearchText] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [composerVisible, setComposerVisible] = useState(false);
  const [saveModal, setSaveModal] = useState<{ visible: boolean; momentId: string }>({ visible: false, momentId: "" });
  const [searchResults, setSearchResults] = useState<Moment[]>([]);
  const [searching, setSearching] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    setActiveTag(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!text.trim()) { setSearchResults([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await api.get<any[]>(`/moments/search?q=${encodeURIComponent(text)}`);
        setSearchResults(results.map((m) => ({
          ...m, id: String(m.id), rank: m.rank, tags: m.tags ?? [],
          dislikes: m.dislikes ?? 0, saves: m.saves ?? 0,
          disliked: m.disliked ?? false, saved: m.saved ?? false,
        })));
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 400);
  }, []);

  const handleTagPress = useCallback((tag: string) => {
    setActiveTag(tag);
    setSearchText("");
    setShowSearch(false);
  }, []);

  const clearTag = () => setActiveTag(null);

  const typeFilters = [
    { key: "all" as FilterKey, label: "ALL" },
    { key: "game" as FilterKey, label: "GAMES" },
    { key: "challenge" as FilterKey, label: "CHALLENGES" },
    { key: "advice" as FilterKey, label: "TIPS" },
  ];

  const displayMoments = searchText.trim()
    ? searchResults
    : activeTag
    ? moments.filter((m) => m.tags.includes(activeTag))
    : filter === "all"
    ? moments
    : moments.filter((m) => m.type === filter || (filter === "game" && m.type === "strike"));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>MOMENTS</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>The bowling community</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.card }]}
              onPress={() => { setShowSearch(!showSearch); setSearchText(""); setSearchResults([]); }}
            >
              <Feather name="search" size={18} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: colors.primary }]}
              onPress={() => setComposerVisible(true)}
            >
              <Feather name="edit-2" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Search posts or #hashtags…"
              placeholderTextColor={colors.mutedForeground}
              value={searchText}
              onChangeText={handleSearch}
              autoFocus
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchText(""); setSearchResults([]); }}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTag && (
          <View style={styles.activeTagRow}>
            <View style={[styles.activeTagPill, { backgroundColor: colors.primary }]}>
              <Text style={[styles.activeTagText, { color: colors.primaryForeground }]}>#{activeTag}</Text>
              <TouchableOpacity onPress={clearTag}>
                <Feather name="x" size={12} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {!showSearch && !activeTag && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          {typeFilters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, {
                backgroundColor: filter === f.key ? colors.foreground : colors.card,
                borderColor: filter === f.key ? colors.foreground : colors.border,
              }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, { color: filter === f.key ? colors.background : colors.mutedForeground }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {searching && (
          <Text style={[styles.searchingText, { color: colors.mutedForeground }]}>Searching…</Text>
        )}
        {!searching && displayMoments.length === 0 && (searchText || activeTag) && (
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No posts found</Text>
        )}
        {displayMoments.map((m) => (
          <MomentCard
            key={m.id}
            moment={m}
            onLike={() => { toggleLikeMoment(m.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            onDislike={() => { toggleDislikeMoment(m.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            onSave={() => {
              if (m.saved) { unsaveMoment(m.id); } else { setSaveModal({ visible: true, momentId: m.id }); }
            }}
            onComment={() => router.push(`/moment/${m.id}`)}
            onTagPress={handleTagPress}
          />
        ))}
      </ScrollView>

      <PostComposer
        visible={composerVisible}
        onClose={() => setComposerVisible(false)}
        onPost={postMoment}
      />

      <SaveModal
        visible={saveModal.visible}
        momentId={saveModal.momentId}
        onClose={() => setSaveModal({ visible: false, momentId: "" })}
        onSave={(listId) => {
          saveMoment(saveModal.momentId, listId);
          setSaveModal({ visible: false, momentId: "" });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTitle: { fontSize: 34, fontFamily: "BarlowCondensed_800ExtraBold", letterSpacing: 2 },
  headerSub: { fontSize: 12, fontFamily: "DMSans_400Regular", marginTop: 2, letterSpacing: 0.3 },
  headerActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: "500" },
  activeTagRow: { flexDirection: "row" },
  activeTagPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  activeTagText: { fontSize: 14, fontFamily: "BarlowCondensed_700Bold" },
  filterRow: { marginBottom: 8 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 4, gap: 8, alignItems: "center" },
  filterPill: { borderWidth: 1, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 8 },
  filterText: { fontSize: 12, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.5 },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },
  searchingText: { textAlign: "center", paddingTop: 20, fontSize: 14 },
  emptyText: { textAlign: "center", paddingTop: 40, fontSize: 15, fontWeight: "500" },
  card: { borderRadius: 20, padding: 16, gap: 12 },
  cardHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontFamily: "BarlowCondensed_700Bold", fontSize: 15 },
  userInfo: { flex: 1, gap: 4 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { fontSize: 15, fontFamily: "BarlowCondensed_700Bold" },
  typePill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  typeText: { fontSize: 9, fontFamily: "BarlowCondensed_600SemiBold", letterSpacing: 0.5 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeAgo: { fontSize: 12, fontFamily: "DMSans_400Regular" },
  scoreChip: { flexDirection: "row", alignItems: "baseline", gap: 4, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50 },
  scoreChipNumber: { fontSize: 24, fontFamily: "BarlowCondensed_800ExtraBold" },
  scoreChipLabel: { fontSize: 12, fontFamily: "BarlowCondensed_600SemiBold" },
  content: { fontSize: 15, lineHeight: 22, fontFamily: "DMSans_400Regular" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  tagText: { fontSize: 12, fontFamily: "BarlowCondensed_600SemiBold" },
  actions: { flexDirection: "row", gap: 16, paddingTop: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, fontWeight: "600" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  composerSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14 },
  saveSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 0 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  composerTitle: { fontSize: 18, fontWeight: "800" },
  typeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 50 },
  typeBtnText: { fontSize: 12, fontWeight: "700" },
  composerInput: { borderRadius: 14, padding: 14, fontSize: 15, minHeight: 100, textAlignVertical: "top" },
  charCount: { fontSize: 11, textAlign: "right" },
  scoreInput: { borderRadius: 12, padding: 12, fontSize: 15 },
  postBtn: { borderRadius: 50, paddingVertical: 14, alignItems: "center" },
  postBtnText: { fontSize: 15, fontWeight: "800" },
  saveListRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  saveListName: { flex: 1, fontSize: 15, fontWeight: "600" },
  saveListCount: { fontSize: 13 },
  newListRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  newListInput: { flex: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  newListBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
});
