import React, { useState } from "react";
import {
  MessageSquare,
  Heart,
  ThumbsDown,
  Bookmark,
  Send,
  Search,
  Share2,
  Tag,
  Sparkles,
  Flame,
  Award,
  Filter,
} from "lucide-react";
import type { Moment, MomentComment, UserProfile } from "../types";
import { RankBadge } from "./RankBadge";

interface MomentsTabProps {
  moments: Moment[];
  user: UserProfile;
  onPostMoment: (content: string, score?: number, type?: string) => Promise<void>;
  onLikeMoment: (id: string) => Promise<void>;
  onDislikeMoment: (id: string) => Promise<void>;
  onSaveMoment: (id: string) => Promise<void>;
  onFetchComments: (momentId: string) => Promise<MomentComment[]>;
  onPostComment: (momentId: string, content: string) => Promise<void>;
}

export const MomentsTab: React.FC<MomentsTabProps> = ({
  moments,
  user,
  onPostMoment,
  onLikeMoment,
  onDislikeMoment,
  onSaveMoment,
  onFetchComments,
  onPostComment,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newScore, setNewScore] = useState("");
  const [newType, setNewType] = useState<"game" | "strike" | "advice" | "gear" | "challenge">("game");

  // Comment Thread Modal State
  const [activeCommentsMoment, setActiveCommentsMoment] = useState<Moment | null>(null);
  const [commentList, setCommentList] = useState<MomentComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const tags = [
    "all",
    "perfect300",
    "clean",
    "oilpattern",
    "strategy",
    "arsenal",
    "hammerbowling",
    "challenge",
    "bowlingtips",
  ];

  const filteredMoments = moments.filter((m) => {
    const matchesTag =
      selectedTag === "all" ||
      m.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
    const matchesSearch =
      !searchQuery ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  const handleOpenComments = async (m: Moment) => {
    setActiveCommentsMoment(m);
    setLoadingComments(true);
    try {
      const data = await onFetchComments(m.id);
      setCommentList(data);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!activeCommentsMoment || !newCommentText.trim()) return;
    await onPostComment(activeCommentsMoment.id, newCommentText.trim());
    setNewCommentText("");
    const updated = await onFetchComments(activeCommentsMoment.id);
    setCommentList(updated);
  };

  const handleCreatePost = async () => {
    if (!newContent.trim()) return;
    const scoreVal = newScore ? parseInt(newScore) : undefined;
    await onPostMoment(newContent.trim(), scoreVal, newType);
    setNewContent("");
    setNewScore("");
    setComposerOpen(false);
  };

  return (
    <div id="moments-tab-content" className="space-y-6">
      {/* Feed Controls Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="moments-search-input"
              type="text"
              placeholder="Search feed, #hashtags, or bowlers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:bg-white"
            />
          </div>

          <button
            id="open-moment-composer-btn"
            onClick={() => setComposerOpen(!composerOpen)}
            className="px-4 py-2 bg-[#9fe870] hover:bg-[#8fd860] text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Share Moment
          </button>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-stone-400 mr-1 shrink-0" />
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedTag === t
                  ? "bg-[#141512] text-[#9fe870] font-extrabold shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {t === "all" ? "🔥 All Posts" : `#${t}`}
            </button>
          ))}
        </div>
      </div>

      {/* Post Composer Drawer / Inline Form */}
      {composerOpen && (
        <div className="bg-white rounded-2xl p-5 border-2 border-[#9fe870] shadow-md animate-in fade-in duration-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#9fe870] text-black font-extrabold flex items-center justify-center text-xs">
                AC
              </div>
              <span className="text-xs font-extrabold text-stone-900">Post a Bowling Moment</span>
            </div>
            <button
              onClick={() => setComposerOpen(false)}
              className="text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <textarea
            id="moment-composer-textarea"
            rows={3}
            placeholder="What happened on the lanes? Share a high game, oil pattern insight, or ball reaction review... (use #hashtags)"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full text-xs p-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:bg-white"
          />

          {/* Post Attributes (Score + Type) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-500">Score (optional):</span>
                <input
                  type="number"
                  min="0"
                  max="300"
                  placeholder="300"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  className="w-16 px-2 py-1 text-xs font-bold bg-stone-100 border border-stone-200 rounded-lg text-center"
                />
              </div>

              <div className="flex items-center gap-1">
                {(["game", "strike", "advice", "gear"] as const).map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setNewType(tp)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase cursor-pointer ${
                      newType === tp
                        ? "bg-[#141512] text-[#9fe870]"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {tp}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="submit-moment-btn"
              disabled={!newContent.trim()}
              onClick={handleCreatePost}
              className="px-5 py-2 bg-[#9fe870] hover:bg-[#8fd860] disabled:opacity-40 text-black text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Publish Post (+75 XP)
            </button>
          </div>
        </div>
      )}

      {/* Feed List */}
      <div className="space-y-4">
        {filteredMoments.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-stone-200 p-8">
            <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-600">No moments found for this filter</p>
            <p className="text-xs text-stone-400 mt-1">Try another search or publish your own!</p>
          </div>
        ) : (
          filteredMoments.map((m) => (
            <article
              key={m.id}
              id={`moment-card-${m.id}`}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200/90 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shadow-sm"
                    style={{ backgroundColor: m.avatarColor || "#2a3a5c" }}
                  >
                    {m.initials || m.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-stone-900">@{m.username}</span>
                      {m.name && <span className="text-xs text-stone-500 font-medium hidden sm:inline">({m.name})</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RankBadge rank={m.rank} size="sm" />
                      <span className="text-[11px] text-stone-400">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>

                {m.score && (
                  <div className="bg-[#141512] text-white px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#9fe870]" />
                    <span className="text-[10px] uppercase font-bold text-[#9fe870]">GAME SCORE</span>
                    <span className="font-display text-xl font-extrabold leading-none">{m.score}</span>
                  </div>
                )}
              </div>

              {/* Content Body */}
              <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-line font-medium">
                {m.content}
              </p>

              {/* Tags */}
              {m.tags && m.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {m.tags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTag(t)}
                      className="px-2 py-0.5 text-[11px] font-bold bg-stone-100 text-stone-600 hover:bg-[#9fe870]/20 hover:text-black rounded-md transition-colors cursor-pointer"
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}

              {/* Interactive Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs text-stone-500">
                <div className="flex items-center gap-4">
                  {/* Like Button */}
                  <button
                    id={`like-moment-${m.id}`}
                    onClick={() => onLikeMoment(m.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      m.isLiked
                        ? "bg-rose-50 text-rose-600 font-extrabold"
                        : "hover:bg-stone-100 text-stone-600"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${m.isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                    <span>{m.likes}</span>
                  </button>

                  {/* Dislike Button */}
                  <button
                    id={`dislike-moment-${m.id}`}
                    onClick={() => onDislikeMoment(m.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      m.isDisliked
                        ? "bg-stone-200 text-stone-900 font-extrabold"
                        : "hover:bg-stone-100 text-stone-400"
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    {m.dislikes > 0 && <span>{m.dislikes}</span>}
                  </button>

                  {/* Comments Button */}
                  <button
                    id={`comment-moment-${m.id}`}
                    onClick={() => handleOpenComments(m)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-stone-100 text-stone-600 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{m.commentsCount} Comments</span>
                  </button>
                </div>

                {/* Save to List Bookmark */}
                <button
                  id={`save-moment-${m.id}`}
                  onClick={() => onSaveMoment(m.id)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    m.isSaved ? "text-[#166534] bg-emerald-50" : "text-stone-400 hover:text-stone-700"
                  }`}
                  title={m.isSaved ? "Saved" : "Save moment"}
                >
                  <Bookmark className={`w-4 h-4 ${m.isSaved ? "fill-emerald-600" : ""}`} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Comment Thread Modal */}
      {activeCommentsMoment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-stone-200 shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-extrabold text-[#166534] uppercase tracking-wider">
                  MOMENT DISCUSSION
                </span>
                <h3 className="font-display text-2xl font-black text-stone-900 uppercase">
                  @{activeCommentsMoment.username}'S THREAD
                </h3>
              </div>
              <button
                onClick={() => setActiveCommentsMoment(null)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Original Post Preview */}
            <div className="bg-stone-50 p-3.5 rounded-2xl my-3 text-xs text-stone-700 border border-stone-100">
              <span className="font-bold text-stone-900">@{activeCommentsMoment.username}: </span>
              {activeCommentsMoment.content}
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
              {loadingComments ? (
                <p className="text-xs text-stone-400 text-center py-8">Loading comments...</p>
              ) : commentList.length === 0 ? (
                <p className="text-xs text-stone-400 text-center py-8">
                  No comments yet. Be the first to start the banter!
                </p>
              ) : (
                commentList.map((c) => (
                  <div key={c.id} className="bg-white p-3 rounded-xl border border-stone-100 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white"
                          style={{ backgroundColor: c.avatarColor || "#2a3a5c" }}
                        >
                          {c.initials}
                        </div>
                        <span className="text-xs font-bold text-stone-900">@{c.username}</span>
                        <RankBadge rank={c.rank} size="sm" />
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 pl-8">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input */}
            <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
              <input
                id="comment-input-field"
                type="text"
                placeholder="Write a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendComment();
                }}
                className="flex-1 text-xs px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9fe870] focus:bg-white"
              />
              <button
                id="send-comment-btn"
                disabled={!newCommentText.trim()}
                onClick={handleSendComment}
                className="p-2.5 bg-[#9fe870] hover:bg-[#8fd860] disabled:opacity-40 text-black rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
