"use client";

export type Reply = {
  id: string;
  author: string;
  content: string;
  createdAt: number;
};

export type StoredThread = {
  id: string;
  title: string;
  content: string;
  author: string;
  categorySlug: string;
  tags: string[];
  replies: Reply[];
  createdAt: number;
  viewCount: number;
  isPinned: boolean;
  isLocked: boolean;
};

const STORAGE_KEY = "samagama-forum-threads";
const VERSION_KEY = "samagama-forum-version";
const VERSION = 2;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const sampleThreads: StoredThread[] = [
  {
    id: "welcome",
    title: "Welcome to the Community Discussion Forum!",
    content: "Hello everyone! **Welcome to the Community Discussion Forum!**\n\nThis is the official discussion forum for the **Vicharanashala Internship** at *IIT Ropar*. Here you can:\n\n- Ask questions about the internship\n- Share insights and tips with fellow interns\n- Get help from mentors and admins\n- Discuss projects, coursework, and more\n\n---\n\n### Quick tips:\n1. Use **search** before posting — your question may already be answered\n2. Choose the right **category** for your thread\n3. Be **respectful** and helpful\n4. You can use **Markdown** to format your posts (bold, lists, code, etc.)\n\n---\n\n> *\"The best way to learn is to teach. The best way to grow is to help others grow.\"*\n\nHappy discussing! 🚀",
    author: "Vicharanashala Admin",
    categorySlug: "general",
    tags: ["welcome", "guidelines"],
    replies: [],
    createdAt: Date.now() - 3600000 * 24,
    viewCount: 0,
    isPinned: true,
    isLocked: false,
  },
];

function loadAll(): StoredThread[] {
  if (typeof window === "undefined") return sampleThreads;
  try {
    const ver = localStorage.getItem(VERSION_KEY);
    if (ver !== String(VERSION)) {
      localStorage.setItem(VERSION_KEY, String(VERSION));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleThreads));
      return sampleThreads;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredThread[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleThreads));
  return sampleThreads;
}

export function getAllThreads(): StoredThread[] {
  return loadAll();
}

export function getThreadById(id: string): StoredThread | undefined {
  return loadAll().find((t) => t.id === id);
}

export function createThread(title: string, content: string, author: string, categorySlug: string, tags: string[]): StoredThread {
  const threads = loadAll();
  const thread: StoredThread = {
    id: generateId(),
    title,
    content,
    author: author || "Student",
    categorySlug,
    tags,
    replies: [],
    createdAt: Date.now(),
    viewCount: 0,
    isPinned: false,
    isLocked: false,
  };
  threads.unshift(thread);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  return thread;
}

export function addReply(threadId: string, author: string, content: string): Reply | null {
  const threads = loadAll();
  const idx = threads.findIndex((t) => t.id === threadId);
  if (idx === -1) return null;
  const reply: Reply = { id: generateId(), author: author || "Student", content, createdAt: Date.now() };
  threads[idx].replies.push(reply);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  return reply;
}

export function incrementViews(threadId: string): void {
  const threads = loadAll();
  const idx = threads.findIndex((t) => t.id === threadId);
  if (idx === -1) return;
  threads[idx].viewCount += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
}
