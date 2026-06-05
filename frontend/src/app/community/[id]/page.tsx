"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getThreadById, addReply, incrementViews, getAllThreads } from "../store";
import type { StoredThread } from "../store";

const colors = [
  "from-blue-500 to-blue-700",
  "from-emerald-500 to-emerald-700",
  "from-red-400 to-red-600",
  "from-amber-500 to-amber-700",
  "from-cyan-500 to-cyan-700",
  "from-violet-500 to-violet-700",
  "from-pink-500 to-pink-700",
  "from-teal-500 to-teal-700",
];

function stringToColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function relativeTime(raw: number): string {
  const diff = Date.now() - raw;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ThreadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [replyText, setReplyText] = useState("");
  const [thread, setThread] = useState<StoredThread | null>(null);
  const [related, setRelated] = useState<StoredThread[]>([]);

  useEffect(() => {
    if (!params?.id) return;
    const t = getThreadById(params.id as string);
    setThread(t ?? null);
    if (t) incrementViews(t.id);
    const all = getAllThreads();
    setRelated(all.filter((th) => th.id !== t?.id && th.categorySlug === t?.categorySlug).slice(0, 5));
  }, [params?.id]);

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !thread) return;
    addReply(thread.id, "Student", replyText.trim());
    setReplyText("");
    setThread(getThreadById(thread.id) ?? null);
  };

  if (!params?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <p className="text-sm text-slate-500">No thread ID provided.</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4">
        <p className="text-sm font-medium text-slate-600">Thread not found</p>
        <button onClick={() => router.push("/community")} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Back to community</button>
      </div>
    );
  }

  return (
    <div className="forum-root">
      <header className="forum-header">
        <div className="forum-header-left">
          <button onClick={() => router.push("/community")} className="forum-back-btn" aria-label="Back to community">
            <ArrowLeft size={16} />
          </button>
          <div className="forum-logo">Sama<span>gama</span></div>
        </div>
        <div className="forum-path">
          <span>{thread.categorySlug}</span>
          <span className="forum-path-sep">/</span>
          <span className="forum-path-label">{thread.title.slice(0, 40)}…</span>
        </div>
        <div className="forum-user">
          <span className="forum-user-label">A</span>
          <div className="forum-avatar">AP</div>
        </div>
      </header>

      <div className="forum-wrap">
        <nav className="forum-index">
          <div className="forum-index-section">
            <div className="forum-index-head">Related</div>
            {related.map((t) => (
              <button key={t.id} onClick={() => router.push(`/community/${t.id}`)} className="forum-index-link">
                {t.title.slice(0, 30)}…
              </button>
            ))}
          </div>
        </nav>

        <div className="forum-main">
          <div className="topic-head">
            {thread.isPinned && <div className="topic-tag">Pinned</div>}
            <h1 className="topic-title">{thread.title}</h1>
            <div className="topic-meta">
              <span className="topic-meta-sep">·</span>
              {thread.replies.length} replies
              <span className="topic-meta-sep">·</span>
              {thread.viewCount} views
            </div>
          </div>

          <div className="post">
            <div className="post-byline">
              <div className={`post-av bg-gradient-to-br ${stringToColor(thread.author)}`}>
                {thread.author.charAt(0)}
              </div>
              <div className="post-who">
                {thread.author}
                <span className="post-role">student</span>
              </div>
              <div className="post-when">
                <span className="post-num">#1</span>
                <span className="post-when-sep">·</span>
                {relativeTime(thread.createdAt)}
              </div>
            </div>

            <div className="post-body">
              <div className="post-intro font-answer md-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{thread.content}</ReactMarkdown>
              </div>
            </div>

            <div className="post-actions">
              <span className="post-stat">{thread.replies.length} replies</span>
              <span className="post-stat">{thread.viewCount} views</span>
              <span className="post-spacer" />
              <button className="post-action-btn">Bookmark</button>
            </div>
          </div>

          {thread.replies.map((reply) => (
            <div key={reply.id} className="post">
              <div className="post-byline">
                <div className={`post-av bg-gradient-to-br ${stringToColor(reply.author)}`}>
                  {reply.author.charAt(0)}
                </div>
                <div className="post-who">
                  {reply.author}
                  {reply.author.includes("Mentor") || reply.author.includes("Admin") ? <span className="post-role">staff</span> : <span className="post-role" style={{ color: "var(--forum-text4)" }}>student</span>}
                </div>
                <div className="post-when">
                  <span className="post-when-sep">·</span>
                  {relativeTime(reply.createdAt)}
                </div>
              </div>
              <div className="post-body">
                <div className="font-answer md-content" style={{ fontSize: "15px", lineHeight: "1.8", color: "var(--forum-text2)" }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {!thread.isLocked && (
            <div className="reply-box">
              <textarea
                className="reply-textarea"
                placeholder="Write a reply…"
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="reply-actions">
                <span className="reply-hint">Markdown supported</span>
                <button onClick={handleReply} className={`reply-submit ${replyText.trim() ? "active" : ""}`} disabled={!replyText.trim()}>Post Reply</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
