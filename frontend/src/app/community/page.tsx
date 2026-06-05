"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X } from "lucide-react";
import { campusTopics } from "../../data/campus-faq";
import { getAllThreads, createThread } from "./store";
import type { StoredThread } from "./store";
import type { ForumView } from "./types";

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

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/>\s+/g, "")
    .replace(/[-*+]\s+/g, "")
    .replace(/\n{2,}/g, " ")
    .trim();
}

function excerpt(text: string, max = 130): string {
  const plain = stripMarkdown(text);
  return plain.length > max ? plain.slice(0, max).trimEnd() + "…" : plain;
}

export default function CommunityPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<StoredThread[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ForumView>("latest");
  const [searchQuery, setSearchQuery] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const loadThreads = useCallback(() => {
    setThreads(getAllThreads());
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const categories = useMemo(() => {
    const general = { slug: "general", label: "General", description: "General discussion", color: "#888", softColor: "#f0f0f0", topicCount: threads.filter((th) => th.categorySlug === "general").length };
    return [general, ...campusTopics.map((t) => ({
      slug: t.slug,
      label: t.label,
      description: t.description,
      color: t.color,
      softColor: t.softColor,
      topicCount: threads.filter((th) => th.categorySlug === t.slug).length,
    }))];
  }, [threads]);

  const filteredThreads = useMemo(() => {
    let result = threads;
    if (activeCategory) {
      result = result.filter((t) => t.categorySlug === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q));
    }
    result = result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
    return result;
  }, [threads, activeCategory, searchQuery]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    createThread(newTitle.trim(), newContent.trim(), "Student", newCategory || "general", []);
    setNewTitle("");
    setNewContent("");
    setNewCategory("");
    setShowCreate(false);
    loadThreads();
  };

  const handleViewChange = useCallback((view: ForumView) => {
    setActiveView(view);
  }, []);

  return (
    <div className="forum-root">
      <header className="forum-header">
        <div className="forum-header-left">
          <div className="forum-logo">Sama<span>gama</span></div>
        </div>
        <div className="forum-path">
          <span>{activeCategory ? categories.find((c) => c.slug === activeCategory)?.label ?? "Category" : "All topics"}</span>
          {activeCategory && (
            <>
              <span className="forum-path-sep">/</span>
              <span className="forum-path-label">{filteredThreads.length} topics</span>
            </>
          )}
        </div>
        <div className="forum-user">
          <span className="forum-user-label">A</span>
          <div className="forum-avatar">AP</div>
        </div>
      </header>

      <div className="forum-wrap">
        <nav className="forum-index">
          <div className="forum-index-section">
            <div className="forum-index-head">Categories</div>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory((prev) => (prev === cat.slug ? null : cat.slug))}
                className={`forum-index-link ${activeCategory === cat.slug ? "active" : ""}`}
              >
                <span className="forum-index-dot" style={{ backgroundColor: cat.color }} />
                {cat.label}
                <span className="forum-index-count">{cat.topicCount}</span>
              </button>
            ))}
          </div>
          <div className="forum-index-section">
            <div className="forum-index-head">Views</div>
            {(["latest", "new", "votes", "top"] as ForumView[]).map((v) => (
              <button
                key={v}
                onClick={() => handleViewChange(v)}
                className={`forum-index-link capitalize ${activeView === v ? "active" : ""}`}
              >
                {v === "latest" ? "Latest" : v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </nav>

        <div className="forum-main">
          <div className="topic-head">
            <div className="topic-tag">{activeCategory ? categories.find((c) => c.slug === activeCategory)?.label ?? "Category" : "Community"}</div>
            <div className="flex items-center justify-between gap-4">
              <h1 className="topic-title">
                {activeCategory ? categories.find((c) => c.slug === activeCategory)?.label ?? "Topics" : "All topics"}
              </h1>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--forum-border)] px-3 py-1.5 text-sm font-medium text-[var(--forum-text2)] transition hover:bg-[var(--forum-surface)] hover:text-[var(--forum-accent)]"
              >
                <Plus size={15} />
                New Thread
              </button>
            </div>
            <div className="topic-meta">
              {filteredThreads.length} {filteredThreads.length === 1 ? "topic" : "topics"}
              <span className="topic-meta-sep">·</span>
              Sorted by {activeView}
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--forum-text4)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics…"
              className="w-full border border-[var(--forum-border)] rounded-lg bg-transparent pl-10 pr-4 py-2 text-sm text-[var(--forum-text)] placeholder:text-[var(--forum-text4)] outline-none transition focus:border-[var(--forum-accent)]"
            />
          </div>

          {filteredThreads.length === 0 ? (
            <div className="forum-empty"><p>{searchQuery ? "No matching topics" : "No topics yet"}</p></div>
          ) : (
            filteredThreads.map((thread) => (
              <div
                key={thread.id}
                className="topic-row"
                onClick={() => router.push(`/community/${thread.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") router.push(`/community/${thread.id}`); }}
              >
                <div className="tr-main">
                  <div className="tr-title-line">
                    {thread.isPinned && <span className="tr-pin">Pinned</span>}
                    <span className="tr-title">{thread.title}</span>
                  </div>
                  <p className="tr-excerpt">{excerpt(thread.content)}</p>
                  <div className="tr-tags">
                    <span className="tr-tag">{thread.author}</span>
                    {thread.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="tr-tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="tr-stats">
                  <div className="tr-stat">{thread.replies.length}</div>
                  <div className="tr-stat views">{thread.viewCount >= 1000 ? `${(thread.viewCount / 1000).toFixed(1)}k` : thread.viewCount}</div>
                  <div className="tr-stat activity">{relativeTime(thread.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4">
          <div className="absolute inset-0" onClick={() => setShowCreate(false)} />
          <form onSubmit={handleCreate} className="relative w-full max-w-lg rounded-xl border border-[var(--forum-border)] bg-[var(--forum-bg)] p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--forum-text)]">Create a new thread</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="text-[var(--forum-text4)] transition hover:text-[var(--forum-text2)]">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Thread title"
                required
                className="w-full rounded-lg border border-[var(--forum-border)] bg-transparent px-3 py-2 text-sm text-[var(--forum-text)] placeholder:text-[var(--forum-text4)] outline-none transition focus:border-[var(--forum-accent)]"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg border border-[var(--forum-border)] bg-transparent px-3 py-2 text-sm text-[var(--forum-text)] outline-none transition focus:border-[var(--forum-accent)]"
              >
                <option value="">Select category</option>
                <option value="general">General</option>
                {campusTopics.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.label}</option>
                ))}
              </select>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write your post…"
                rows={5}
                required
                className="w-full rounded-lg border border-[var(--forum-border)] bg-transparent px-3 py-2 text-sm text-[var(--forum-text)] placeholder:text-[var(--forum-text4)] outline-none transition focus:border-[var(--forum-accent)] resize-y"
              />
              <p className="text-[11px] text-[var(--forum-text4)]">Markdown supported: **bold**, *italic*, `code`, [links](url), lists</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-[var(--forum-border)] px-4 py-1.5 text-sm text-[var(--forum-text3)] transition hover:bg-[var(--forum-surface)]">Cancel</button>
              <button type="submit" disabled={!newTitle.trim() || !newContent.trim()} className="rounded-lg bg-[var(--forum-accent)] px-4 py-1.5 text-sm font-medium text-white transition disabled:opacity-50">Post Thread</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
