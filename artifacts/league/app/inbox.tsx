import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

const TYPE_META: Record<string, { icon: string; color: (c: ReturnType<typeof useColors>) => string; label: (n: AppNotification) => string }> = {
  like:     { icon: "heart",        color: (c) => "#ef4444", label: () => "liked your post"   },
  reaction: { icon: "smile",        color: (c) => c.orange,  label: (n) => `reacted ${n.emoji ?? ""} to your post` },
  comment:  { icon: "message-circle", color: (c) => c.primary, label: () => "commented on your post" },
  share:    { icon: "send",         color: (c) => "#60c8ff", label: () => "shared a post with you" },
};

type AppNotification = {
  id: string;
  type: string;
  fromUsername: string;
  fromInitials: string;
  fromAvatarColor: string;
  momentId?: string;
  momentPreview?: string;
  emoji?: string;
  message?: string;
  read: boolean;
  timeAgo: string;
};

export default function InboxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { inbox, inboxCount, markInboxRead, fetchInbox } = useApp();
  const [loading, setLoading] = useState(inbox.length === 0);

  useEffect(() => {
    fetchInbox().finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async () => {
    await markInboxRead();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }} />

      <View style={[styles.header, { paddingTop: 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>INBOX</Text>
          {inboxCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.orange }]}>
              <Text style={styles.badgeText}>{inboxCount > 99 ? "99+" : inboxCount}</Text>
            </View>
          )}
        </View>
        {inboxCount > 0 ? (
          <TouchableOpacity onPress={handleMarkRead} style={styles.readAllBtn}>
            <Text style={[styles.readAllText, { color: colors.primary }]}>Mark read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 72 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : inbox.length === 0 ? (
        <View style={styles.center}>
          <Feather name="inbox" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>All caught up</Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Likes, comments, reactions, and shared posts will appear here
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {inbox.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.like;
            return (
              <TouchableOpacity
                key={n.id}
                activeOpacity={n.momentId ? 0.7 : 1}
                onPress={() => {
                  if (n.momentId) router.push(`/moment/${n.momentId}` as any);
                }}
                style={[
                  styles.item,
                  {
                    backgroundColor: n.read ? colors.card : colors.primary + "18",
                    borderColor: n.read ? "transparent" : colors.primary + "44",
                  },
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: n.fromAvatarColor }]}>
                  <Text style={styles.avatarText}>{n.fromInitials}</Text>
                </View>

                <View style={styles.itemBody}>
                  <View style={styles.itemRow}>
                    <View style={[styles.typeIcon, { backgroundColor: meta.color(colors) + "22" }]}>
                      <Feather name={meta.icon as any} size={12} color={meta.color(colors)} />
                    </View>
                    <Text style={[styles.username, { color: colors.foreground }]}>{n.fromUsername}</Text>
                    <Text style={[styles.action, { color: colors.mutedForeground }]}>
                      {" "}{meta.label(n)}
                    </Text>
                  </View>

                  {n.momentPreview && (
                    <Text
                      style={[styles.preview, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      "{n.momentPreview}"
                    </Text>
                  )}

                  {n.message && (
                    <Text style={[styles.message, { color: colors.foreground }]} numberOfLines={2}>
                      {n.message}
                    </Text>
                  )}

                  <Text style={[styles.timeAgo, { color: colors.mutedForeground }]}>{n.timeAgo}</Text>
                </View>

                {!n.read && <View style={[styles.dot, { backgroundColor: colors.orange }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 28, fontFamily: "BarlowCondensed_800ExtraBold", letterSpacing: 2 },
  badge: {
    borderRadius: 50,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  readAllBtn: { width: 72, alignItems: "flex-end" },
  readAllText: { fontSize: 13, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontFamily: "BarlowCondensed_700Bold", marginTop: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, fontFamily: "DMSans_400Regular" },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 8 },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  avatarText: { color: "#fff", fontFamily: "BarlowCondensed_700Bold", fontSize: 14 },
  itemBody: { flex: 1, gap: 4 },
  itemRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  typeIcon: { width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 6 },
  username: { fontSize: 14, fontFamily: "BarlowCondensed_700Bold" },
  action: { fontSize: 13, fontFamily: "DMSans_400Regular" },
  preview: { fontSize: 12, fontFamily: "DMSans_400Regular", fontStyle: "italic", marginTop: 2 },
  message: { fontSize: 13, fontFamily: "DMSans_400Regular", marginTop: 2 },
  timeAgo: { fontSize: 11, fontFamily: "DMSans_400Regular", marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, flexShrink: 0 },
});
