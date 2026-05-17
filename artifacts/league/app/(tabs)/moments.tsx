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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, type Moment, type Friend } from "@/context/AppContext";
import { RankBadge } from "@/components/RankBadge";
import { api } from "@/lib/api";

type FilterKey = "all" | "saved" | "game" | "challenge" | "advice";

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
  onReact,
  onShare,
}: {
  moment: Moment;
  onLike: () => void;
  onDislike: () => void;
  onSave: () => void;
  onComment: () => void;
  onTagPress: (tag: string) => void;
  onReact: (emoji: string | null) => void;
  onShare: () => void;
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

      <View style={styles.reactions}>
        {(["❤️", "🔥", "🎳", "👏"] as const).map((emoji) => (
          <TouchableOpacity
            key={emoji}
            onPress={() => onReact(moment.userReaction === emoji ? null : emoji)}
            style={[
              styles.reactionBtn,
              moment.userReaction === emoji && { backgroundColor: colors.primary + "30" },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
          <Feather name="bookmark" size={17} color={moment.saved ? colors.primary : colors.mutedForeground} />
          {moment.saves > 0 && (
            <Text style={[styles.actionCount, { color: moment.saved ? colors.primary : colors.mutedForeground }]}>
              {moment.saves}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { marginLeft: "auto" }]} onPress={onShare} activeOpacity={0.7}>
          <Feather name="send" size={17} color={colors.mutedForeground} />
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

function ShareModal({ visible, onClose, onShare }: {
  visible: boolean;
  onClose: () => void;
  onShare: (userIds: number[], message?: string) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setSelected(new Set());
    setMessage("");
    api.get<Friend[]>("/friends")
      .then((data) => setFriends(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible]);

  const toggle = (userId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId); else next.add(userId);
      return next;
    });
  };

  const handleSend = () => {
    if (selected.size === 0) return;
    onShare(Array.from(selected), message.trim() || undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={[styles.shareSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.composerTitle, { color: colors.foreground }]}>Send to Friends</Text>

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : friends.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.mutedForeground, textAlign: "center", paddingVertical: 20 }]}>
                Add friends to share posts with them
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
                {friends.map((f) => {
                  const isSelected = selected.has(f.userId);
                  return (
                    <TouchableOpacity
                      key={f.userId}
                      style={[styles.friendRow, { borderBottomColor: colors.border }]}
                      onPress={() => toggle(f.userId)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.friendAvatar, { backgroundColor: f.avatarColor }]}>
                        <Text style={styles.avatarText}>{f.initials}</Text>
                      </View>
                      <Text style={[styles.friendName, { color: colors.foreground }]}>{f.username}</Text>
                      <View style={[
                        styles.checkbox,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary : "transparent",
                        },
                      ]}>
                        {isSelected && <Feather name="check" size={12} color={colors.primaryForeground} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TextInput
              style={[styles.composerInput, { backgroundColor: colors.secondary, color: colors.foreground, minHeight: 50 }]}
              placeholder="Add a message… (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={message}
              onChangeText={setMessage}
              maxLength={120}
            />

            <TouchableOpacity
              style={[styles.postBtn, { backgroundColor: selected.size > 0 ? colors.primary : colors.secondary }]}
              onPress={handleSend}
              disabled={selected.size === 0}
              activeOpacity={0.85}
            >
              <Text style={[styles.postBtnText, { color: selected.size > 0 ? colors.primaryForeground : colors.mutedForeground }]}>
                {selected.size > 0 ? `Send to ${selected.size} friend${selected.size > 1 ? "s" : ""}` : "Select friends"}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function MomentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { moments, toggleLikeMoment, toggleDislikeMoment, saveMoment, unsaveMoment, postMoment, inboxCount, reactToMoment, shareMoment } = useApp();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchText, setSearchText] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [composerVisible, setComposerVisible] = useState(false);
  const [saveModal, setSaveModal] = useState<{ visible: boolean; momentId: string }>({ visible: false, momentId: "" });
  const [shareModal, setShareModal] = useState<{ visible: boolean; momentId: string }>({ visible: false, momentId: "" });
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
    { key: "all" as FilterKey, label: "ALL", icon: null },
    { key: "saved" as FilterKey, label: "SAVED", icon: "bookmark" as const },
    { key: "game" as FilterKey, label: "GAMES", icon: null },
    { key: "challenge" as FilterKey, label: "CHALLENGES", icon: null },
    { key: "advice" as FilterKey, label: "TIPS", icon: null },
  ];

  const displayMoments = searchText.trim()
    ? searchResults
    : activeTag
    ? moments.filter((m) => m.tags.includes(activeTag))
    : filter === "all"
    ? moments
    : filter === "saved"
    ? moments.filter((m) => m.saved)
    : moments.filter((m) => m.type === filter || (filter === "game" && m.type === "strike"));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background }} />
      <View style={[styles.header, { paddingTop: 12, backgroundColor: colors.background }]}>
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
              style={[styles.headerBtn, { backgroundColor: colors.card }]}
              onPress={() => router.push("/inbox" as any)}
            >
              <Feather name="bell" size={18} color={colors.foreground} />
              {inboxCount > 0 && (
                <View style={[styles.bellBadge, { backgroundColor: colors.orange }]}>
                  <Text style={styles.bellBadgeText}>{inboxCount > 9 ? "9+" : inboxCount}</Text>
                </View>
              )}
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
          {typeFilters.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, {
                  flexDirection: "row", alignItems: "center", gap: 5,
                  backgroundColor: active ? colors.foreground : colors.card,
                  borderColor: active ? colors.foreground : colors.border,
                }]}
                onPress={() => setFilter(f.key)}
              >
                {f.icon && (
                  <Feather name={f.icon} size={11} color={active ? colors.background : colors.mutedForeground} />
                )}
                <Text style={[styles.filterText, { color: active ? colors.background : colors.mutedForeground }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
        {!searching && displayMoments.length === 0 && !searchText && !activeTag && filter === "saved" && (
          <View style={{ alignItems: "center", paddingTop: 60, gap: 8 }}>
            <Feather name="bookmark" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.foreground, paddingTop: 4 }]}>No saved posts yet</Text>
            <Text style={[{ color: colors.mutedForeground, fontSize: 13, textAlign: "center", paddingHorizontal: 40 }]}>
              Tap the bookmark on any post to save it here.
            </Text>
          </View>
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
            onComment={() => router.push(`/moment/${m.id}` as any)}
            onTagPress={handleTagPress}
            onReact={(emoji) => { reactToMoment(m.id, emoji); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            onShare={() => setShareModal({ visible: true, momentId: m.id })}
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

      <ShareModal
        visible={shareModal.visible}
        onClose={() => setShareModal({ visible: false, momentId: "" })}
        onShare={(userIds, message) => {
          shareMoment(shareModal.momentId, userIds, message);
          setShareModal({ visible: false, momentId: "" });
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
  reactions: { flexDirection: "row", gap: 4, paddingTop: 2 },
  reactionBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 50 },
  reactionEmoji: { fontSize: 18 },
  actions: { flexDirection: "row", gap: 16, paddingTop: 4, alignItems: "center" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, fontWeight: "600" },
  bellBadge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    justifyContent: "center", alignItems: "center", paddingHorizontal: 3,
  },
  bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  shareSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14 },
  friendRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  friendAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: "center", alignItems: "center" },
  friendName: { flex: 1, fontSize: 15, fontFamily: "BarlowCondensed_700Bold" },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: "center", alignItems: "center" },
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
