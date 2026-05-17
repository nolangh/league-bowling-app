import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";

import { useColors } from "@/hooks/useColors";
import { RankBadge } from "@/components/RankBadge";
import { useApp, type Moment, type Comment, type Rank } from "@/context/AppContext";
import { api } from "@/lib/api";

type ApiMoment = {
  id: number; userId?: number; username: string; rank: string; rankColor: string;
  content: string; score?: number | null; type: string;
  likes: number; comments: number; dislikes?: number; saves?: number; tags?: string[];
  timeAgo: string; liked: boolean; disliked?: boolean; saved?: boolean;
  initials: string; avatarColor: string;
  mediaUrl?: string | null; mediaType?: string | null;
  createdAt?: string;
};

function MomentVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 16, marginTop: 4, backgroundColor: "#000" }}
      contentFit="cover"
      nativeControls
    />
  );
}

type ApiComment = {
  id: number; momentId: number; userId: number; username: string;
  initials: string; avatarColor: string; rank: string; rankColor: string;
  content: string; timeAgo: string; isOwn: boolean;
};

export default function MomentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { moments, toggleLikeMoment, toggleDislikeMoment, saveMoment, unsaveMoment } = useApp();

  const [moment, setMoment] = useState<Moment | null>(
    moments.find((m) => m.id === id) ?? null
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (id) {
      fetchMoment();
      fetchComments();
    }
  }, [id]);

  const fetchMoment = async () => {
    try {
      const data = await api.get<ApiMoment>(`/moments/${id}`);
      setMoment({
        id: String(data.id),
        userId: data.userId,
        username: data.username,
        rank: data.rank as Rank,
        rankColor: data.rankColor,
        content: data.content,
        score: data.score ?? undefined,
        type: data.type as Moment["type"],
        likes: data.likes,
        comments: data.comments,
        dislikes: data.dislikes ?? 0,
        saves: data.saves ?? 0,
        tags: data.tags ?? [],
        timeAgo: data.timeAgo,
        liked: data.liked,
        disliked: data.disliked ?? false,
        saved: data.saved ?? false,
        initials: data.initials,
        avatarColor: data.avatarColor,
        mediaUrl: data.mediaUrl ?? null,
        mediaType: data.mediaType ?? null,
        createdAt: data.createdAt,
      });
    } catch { /* keep local state */ }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const data = await api.get<ApiComment[]>(`/moments/${id}/comments`);
      setComments(
        data.map((c) => ({
          id: String(c.id),
          momentId: String(c.momentId),
          userId: c.userId,
          username: c.username,
          initials: c.initials,
          avatarColor: c.avatarColor,
          rank: c.rank as Rank,
          rankColor: c.rankColor,
          content: c.content,
          timeAgo: c.timeAgo,
          isOwn: c.isOwn,
        }))
      );
    } catch { setComments([]); }
    setLoadingComments(false);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    const text = commentText.trim();
    setCommentText("");
    try {
      const data = await api.post<ApiComment>(`/moments/${id}/comments`, { content: text });
      const newComment: Comment = {
        id: String(data.id),
        momentId: String(data.momentId),
        userId: data.userId,
        username: data.username,
        initials: data.initials,
        avatarColor: data.avatarColor,
        rank: data.rank as Rank,
        rankColor: data.rankColor,
        content: data.content,
        timeAgo: data.timeAgo,
        isOwn: true,
      };
      setComments((prev) => [...prev, newComment]);
      setMoment((prev) => prev ? { ...prev, comments: prev.comments + 1 } : prev);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch { setCommentText(text); }
    setSubmitting(false);
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!comment.isOwn) return;
    await api.delete(`/moments/${id}/comments/${comment.id}`);
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
    setMoment((prev) => prev ? { ...prev, comments: Math.max(0, prev.comments - 1) } : prev);
  };

  if (!moment) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const typeColor: Record<string, string> = {
    strike: colors.primary, game: "#60c8ff", challenge: "#f5c842", advice: colors.mutedForeground,
  };
  const tColor = typeColor[moment.type] ?? colors.mutedForeground;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Post card */}
        <View style={[styles.postCard, { backgroundColor: colors.card }]}>
          <View style={styles.postHeader}>
            <View style={[styles.avatar, { backgroundColor: moment.avatarColor }]}>
              <Text style={styles.avatarText}>{moment.initials}</Text>
            </View>
            <View style={styles.postHeaderInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.postUsername, { color: colors.foreground }]}>{moment.username}</Text>
                <View style={[styles.typePill, { backgroundColor: tColor + "22" }]}>
                  <Text style={[styles.typeText, { color: tColor }]}>{moment.type.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.rankTimeRow}>
                <RankBadge rank={moment.rank} small />
                <Text style={[styles.timeAgo, { color: colors.mutedForeground }]}>{moment.timeAgo}</Text>
              </View>
            </View>
          </View>

          {moment.score !== undefined && (
            <View style={[styles.scoreChip, { backgroundColor: colors.primary + "22" }]}>
              <Text style={[styles.scoreNum, { color: colors.primary }]}>{moment.score}</Text>
              <Text style={[styles.scoreLabel, { color: colors.primary }]}>pts</Text>
            </View>
          )}

          <Text style={[styles.postContent, { color: colors.foreground }]}>{moment.content}</Text>

          {moment.mediaUrl ? (
            moment.mediaType === "video" ? (
              <MomentVideo url={moment.mediaUrl} />
            ) : (
              <ExpoImage
                source={{ uri: moment.mediaUrl }}
                style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 16, marginTop: 4, backgroundColor: "#000" }}
                contentFit="cover"
                transition={200}
              />
            )
          ) : null}

          {moment.tags && moment.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {moment.tags.map((tag) => (
                <View key={tag} style={[styles.tagPill, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => { toggleLikeMoment(moment.id); setMoment((prev) => prev ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : prev); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Feather name="heart" size={20} color={moment.liked ? "#ef4444" : colors.mutedForeground} />
              <Text style={[styles.actionCount, { color: moment.liked ? "#ef4444" : colors.mutedForeground }]}>{moment.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => { toggleDislikeMoment(moment.id); setMoment((prev) => prev ? { ...prev, disliked: !prev.disliked, dislikes: prev.disliked ? prev.dislikes - 1 : prev.dislikes + 1 } : prev); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Feather name="thumbs-down" size={20} color={moment.disliked ? "#f97316" : colors.mutedForeground} />
              {(moment.dislikes ?? 0) > 0 && (
                <Text style={[styles.actionCount, { color: moment.disliked ? "#f97316" : colors.mutedForeground }]}>{moment.dislikes}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.actionBtn}>
              <Feather name="message-circle" size={20} color={colors.primary} />
              <Text style={[styles.actionCount, { color: colors.primary }]}>{moment.comments}</Text>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => { moment.saved ? unsaveMoment(moment.id) : saveMoment(moment.id); setMoment((prev) => prev ? { ...prev, saved: !prev.saved } : prev); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Feather name="bookmark" size={20} color={moment.saved ? colors.primary : colors.mutedForeground} />
              {(moment.saves ?? 0) > 0 && (
                <Text style={[styles.actionCount, { color: moment.saved ? colors.primary : colors.mutedForeground }]}>{moment.saves}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments section */}
        <Text style={[styles.commentsLabel, { color: colors.mutedForeground }]}>
          COMMENTS {comments.length > 0 ? `· ${comments.length}` : ""}
        </Text>

        {loadingComments ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
        ) : comments.length === 0 ? (
          <Text style={[styles.noComments, { color: colors.mutedForeground }]}>Be the first to comment</Text>
        ) : (
          comments.map((comment) => (
            <View key={comment.id} style={[styles.commentCard, { backgroundColor: colors.card }]}>
              <View style={[styles.commentAvatar, { backgroundColor: comment.avatarColor }]}>
                <Text style={styles.commentAvatarText}>{comment.initials}</Text>
              </View>
              <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentUsername, { color: colors.foreground }]}>{comment.username}</Text>
                  <RankBadge rank={comment.rank} small />
                  <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>{comment.timeAgo}</Text>
                </View>
                <Text style={[styles.commentContent, { color: colors.foreground }]}>{comment.content}</Text>
              </View>
              {comment.isOwn && (
                <TouchableOpacity onPress={() => handleDeleteComment(comment)} style={styles.deleteBtn}>
                  <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Comment input */}
      <View style={[styles.inputBar, { backgroundColor: colors.card, paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={[styles.commentInput, { backgroundColor: colors.secondary, color: colors.foreground }]}
          placeholder="Add a comment…"
          placeholderTextColor={colors.mutedForeground}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={300}
          returnKeyType="send"
          onSubmitEditing={handleSubmitComment}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: commentText.trim() ? colors.primary : colors.secondary }]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Feather name="send" size={16} color={commentText.trim() ? colors.primaryForeground : colors.mutedForeground} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  postCard: { borderRadius: 20, padding: 16, gap: 12 },
  postHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  postHeaderInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  postUsername: { fontSize: 15, fontWeight: "700" },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 50 },
  typeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  rankTimeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  timeAgo: { fontSize: 12 },
  scoreChip: { flexDirection: "row", alignItems: "baseline", gap: 4, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50 },
  scoreNum: { fontSize: 26, fontWeight: "800" },
  scoreLabel: { fontSize: 13, fontWeight: "600" },
  postContent: { fontSize: 16, lineHeight: 24 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
  tagText: { fontSize: 12, fontWeight: "600" },
  divider: { height: 1 },
  actions: { flexDirection: "row", gap: 20 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontSize: 14, fontWeight: "600" },
  commentsLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, paddingHorizontal: 4 },
  noComments: { textAlign: "center", paddingTop: 20, fontSize: 14, fontWeight: "500" },
  commentCard: { flexDirection: "row", gap: 10, borderRadius: 16, padding: 12, alignItems: "flex-start" },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  commentAvatarText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  commentBody: { flex: 1, gap: 4 },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  commentUsername: { fontSize: 13, fontWeight: "700" },
  commentTime: { fontSize: 11 },
  commentContent: { fontSize: 14, lineHeight: 20 },
  deleteBtn: { padding: 4 },
  inputBar: { padding: 12, paddingTop: 8, flexDirection: "row", gap: 10, alignItems: "flex-end" },
  commentInput: { flex: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
});
