"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Copy,
  FileText,
  GraduationCap,
  HelpCircle,
  Map,
  MessageCircle,
  MessagesSquare,
  Monitor,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  CampusTopic,
  FAQEntry,
  campusTopics,
  searchCampusFaqs,
  topicForFaq,
  topicsBySlug,
} from "../../data/campus-faq";
import { generateTLDR, type TLDR } from "../../lib/tldr";

const PAGE_SIZE = 8;

const iconMap = {
  award: Award,
  badge: BadgeCheck,
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  compass: Compass,
  file: FileText,
  graduation: GraduationCap,
  messages: MessagesSquare,
  monitor: Monitor,
  shield: ShieldCheck,
  sparkles: Sparkles,
  trophy: Trophy,
  users: Users,
};

const tldrCache: Record<string, TLDR | null> = {};

// ─── Pinch-zoom state (stored in refs — no re-renders during gestures) ───
function usePinchZoom() {
  const scaleRef = useRef(1);
  const lastPinchRef = useRef<number | null>(null);

  function attachZoom(el: HTMLElement) {
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      const next = Math.min(Math.max(scaleRef.current + delta, 0.8), 3);
      scaleRef.current = next;
      applyTransform(el, scaleRef.current);
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        lastPinchRef.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || lastPinchRef.current === null) return;
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - lastPinchRef.current) * 0.005;
      const next = Math.min(Math.max(scaleRef.current + delta, 0.8), 3);
      scaleRef.current = next;
      applyTransform(el, scaleRef.current);
      lastPinchRef.current = dist;
    }
    function onTouchEnd() { lastPinchRef.current = null; }

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }

  return attachZoom;
}

function applyTransform(el: HTMLElement, scale: number) {
  el.style.transform = `scale(${scale})`;
  el.style.transformOrigin = "center center";
}

function getTLDR(faq: FAQEntry): TLDR | null {
  if (!(faq.id in tldrCache)) {
    tldrCache[faq.id] = generateTLDR(faq);
  }
  return tldrCache[faq.id];
}

const cloudPositions = [
  "md:left-[2%] md:top-[8%]",
  "md:left-[34%] md:top-[2%]",
  "md:right-[1%] md:top-[12%]",
  "md:left-[10%] md:top-[42%]",
  "md:right-[8%] md:top-[43%]",
  "md:left-[2%] md:bottom-[7%]",
  "md:left-[37%] md:bottom-[2%]",
  "md:right-[1%] md:bottom-[9%]",
];

function iconFor(topic: CampusTopic) {
  return iconMap[topic.icon as keyof typeof iconMap] ?? HelpCircle;
}

function SidebarNav({
  selectedTopic,
  onChoose,
}: {
  selectedTopic?: CampusTopic;
  onChoose: (topic: CampusTopic) => void;
}) {
  return (
    <nav className="flex h-full flex-col py-5">
      <div className="mb-3 border-b border-[#ebe5d9] px-4 pb-3">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#66806c]">Campus Guide</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {campusTopics.map((topic) => {
          const Icon = iconFor(topic);
          const isActive = selectedTopic?.slug === topic.slug;
          return (
            <button
              key={topic.slug}
              onClick={() => onChoose(topic)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition
                ${isActive
                  ? "bg-[#f0ebe0] font-extrabold text-[#263b34]"
                  : "font-semibold text-[#5a6b60] hover:bg-[#f5f1e8] hover:text-[#263b34]"
                }`}
              style={isActive ? { borderLeft: `3px solid ${topic.color}`, paddingLeft: "9px" } : {}}
            >
              <span className="shrink-0" style={{ color: topic.color }}>
                <Icon size={16} strokeWidth={2.5} />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs">{topic.label}</span>
              <span className="shrink-0 text-[10px] font-bold text-[#8f9d8f]">{topic.faqs.length}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TLDRBlock({ tldr }: { tldr: TLDR }) {
  return (
    <div className="mb-5 overflow-hidden rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-amber-50/60">
      <div className="border-b border-amber-200/60 bg-amber-100/50 px-5 py-3">
        <span className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">TL;DR</span>
      </div>
      <div className="space-y-3.5 px-5 py-4">
        <p className="text-base font-bold leading-snug text-amber-900">{tldr.headline}</p>
        {tldr.pairs.length > 0 && (
          <div className="space-y-2">
            {tldr.pairs.map((pair, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-base">{pair.icon}</span>
                <div className="min-w-0 flex-1">
                  <span className="mr-2 text-[11px] font-extrabold uppercase tracking-wider text-amber-700">{pair.label}</span>
                  <span className="text-sm font-medium leading-relaxed text-amber-900/85">{pair.value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200/70 bg-white/70 px-4 py-3">
          <span className="mt-0.5 shrink-0 text-base">➡️</span>
          <span className="text-sm font-medium leading-relaxed text-amber-900/85">{tldr.action}</span>
        </div>
      </div>
    </div>
  );
}

function SimilarQuestions({
  selectedFaq,
  selectedTopic,
  openAccordion,
  onToggle,
}: {
  selectedFaq: FAQEntry;
  selectedTopic: CampusTopic;
  openAccordion: string | null;
  onToggle: (id: string | null) => void;
}) {
  const sectionPrefix = selectedFaq.id.split(".")[0];
  const allFaqs = campusTopics.flatMap((t) => t.faqs);
  const similar = allFaqs.filter(
    (f) =>
      f.id !== selectedFaq.id &&
      f.id.startsWith(sectionPrefix + ".")
  );

  if (similar.length === 0) return null;

  return (
    <div className="mt-5 rounded-2xl border border-[#e5dfd2] bg-[#faf8f2] p-4">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="text-[10px] font-extrabold uppercase tracking-[0.18em]"
          style={{ color: selectedTopic.color }}
        >
          Similar Questions
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
      </div>

      <div className="space-y-2">
        {similar.slice(0, 3).map((faq) => {
          const isOpen = openAccordion === faq.id;
          return (
            <div key={faq.id} className={`sim-row${isOpen ? " open" : ""}`}>
              <div
                className="sim-header"
                onClick={() => onToggle(isOpen ? null : faq.id)}
              >
                <span className="sim-dot" />
                <span className="sim-question">{faq.question}</span>
                <svg
                  className="sim-chevron"
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="4 6 8 10 12 6" />
                </svg>
              </div>

              <div className="sim-divider" />

              <div className={`sim-body${isOpen ? " open" : ""}`}>
                <div className="sim-content">
                  {(() => {
                    const tldr = getTLDR(faq);
                    if (!tldr) {
                      return (
                        <p className="text-[14px] leading-relaxed font-medium text-slate-700 font-answer">
                          {faq.answer}
                        </p>
                      );
                    }
                    return (
                      <>
                        <div className="sim-tldr">
                          <span className="sim-tldr-label">TL;DR</span>
                          <p className="sim-tldr-headline">{tldr.headline}</p>
                          {tldr.pairs.length > 0 && (
                            <div className="sim-tldr-pairs">
                              {tldr.pairs.map((pair, i) => (
                                <div key={i} className="sim-tldr-pair">
                                  <span className="sim-tldr-icon">{pair.icon}</span>
                                  <span className="sim-tldr-pair-text">
                                    {pair.label}: {pair.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {tldr.action && (
                            <div className="sim-tldr-action">
                              <span className="sim-tldr-icon">➡️</span>
                              <span className="sim-tldr-pair-text">{tldr.action}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[14px] leading-relaxed font-medium text-slate-700 font-answer">
                          {faq.answer}
                        </p>
                      </>
                    );
                  })()}

                  <div className="sim-footer">
                    <span className="sim-footer-id">
                      {faq.id} · {selectedTopic.label}
                    </span>
                    <button
                      className="sim-full-faq"
                      onClick={(e) => {
                        e.stopPropagation();
                        const topic = topicForFaq(faq);
                        if (topic) {
                          const params = new URLSearchParams();
                          params.set("topic", topic.slug);
                          params.set("faq", faq.id);
                          window.location.href = `/faq?${params}`;
                        }
                      }}
                    >
                      Full FAQ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RichAnswer({ text }: { text: string }) {
  const decoded = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

  return (
    <>
      {decoded.split(/(\*\*.*?\*\*)/g).map((part, index) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={index} className="font-extrabold text-slate-700">{part.slice(2, -2)}</strong>
          : part
      )}
    </>
  );
}

function CampusIllustration({
  selectedTopic,
  onSelect,
  compact = false,
}: {
  selectedTopic?: CampusTopic;
  onSelect?: (topic: CampusTopic) => void;
  compact?: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const attachZoom = usePinchZoom();

  useEffect(() => {
    if (mapRef.current) {
      return attachZoom(mapRef.current);
    }
  }, [attachZoom]);

  return (
    <div
      ref={mapRef}
      className={`relative overflow-hidden rounded-[2rem] border border-[#d9dccd] bg-[#f4f2e6] shadow-[0_24px_70px_rgba(75,83,62,0.12)] touch-pan-x ${compact ? "h-44 md:h-[620px]" : "h-[60vh] md:h-[620px]"}`}
      style={{ willChange: "transform" }}
    >
      <Image
        src="/iit-ropar-faq-map.png"
        alt="Illustrated map of IIT Ropar campus knowledge locations"
        fill
        unoptimized
        priority={!compact}
        sizes="100vw"
        className="h-full w-full object-cover"
      />
      {onSelect && (
        <div className="absolute inset-0">
          {campusTopics.map((topic) => {
            const Icon = iconFor(topic);
            const isSelected = selectedTopic?.slug === topic.slug;
            return (
              <button
                key={topic.slug}
                aria-label={`${topic.label}, ${topic.faqs.length} questions`}
                onClick={() => onSelect(topic)}
                className={`campus-hotspot group absolute flex flex-col items-center outline-none ${isSelected ? "is-selected" : ""}`}
                style={{ left: `${topic.location.x}%`, top: `${topic.location.y}%`, transform: "translate(-50%, -50%)" }}
              >
                {/* Icon — touch target ≥ 44px on mobile */}
                <span
                  className="flex items-center justify-center rounded-full border-[3px] bg-[#fffdf8] shadow-sm transition group-hover:scale-110 group-focus:scale-110"
                  style={{
                    borderColor: topic.color,
                    color: topic.color,
                    width: "clamp(40px, 8vw, 48px)",
                    height: "clamp(40px, 8vw, 48px)",
                  }}
                >
                  <Icon size={compact ? 15 : 19} strokeWidth={2.5} />
                </span>
                {/* Label — collapses gracefully on small screens */}
                <span className="mt-1 hidden w-full min-w-0 rounded-xl border border-[#ded8c9] bg-[#fffdf9]/95 px-1.5 py-1 text-center shadow-sm backdrop-blur-sm sm:block">
                  <span className="block truncate text-[10px] font-extrabold leading-3 text-[#31413a] md:text-[11px] md:leading-4">
                    {topic.label}
                  </span>
                  <span className="block hidden text-[9px] font-semibold leading-2 text-[#748078] md:block">
                    {topic.faqs.length} qs
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#647468] shadow-sm backdrop-blur md:left-5 md:top-5 md:text-[10px] md:px-4 md:py-2">
        IIT Ropar Knowledge Map
      </div>
    </div>
  );
}

function SearchDialog({
  open,
  onClose,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  onChoose: (faq: FAQEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchCampusFaqs(query), [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[#26332d]/25 px-4 pt-20 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search campus FAQs"
            className="w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-[#e2ddd0] bg-[#fffdf8] shadow-2xl"
            initial={{ opacity: 0, y: -18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
          >
            <div className="flex items-center gap-3 border-b border-[#ebe6d9] px-5 py-4">
              <Search className="h-5 w-5 text-[#6d806e]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search NOC, ViBe, certificates, campus locations..."
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
              <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-[#f3eee3] hover:text-slate-700" aria-label="Close search">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[430px] overflow-y-auto p-3">
              {!query.trim() && <p className="px-3 py-8 text-center text-sm text-slate-500">Search across all 142 verified questions and 14 campus locations.</p>}
              {query.trim() && !results.length && <p className="px-3 py-8 text-center text-sm text-slate-500">No matching FAQ found. Try a shorter keyword.</p>}
              {results.map(({ faq, topic }) => topic && (
                <button
                  key={faq.id}
                  onClick={() => onChoose(faq)}
                  className="group flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[#f6f2e8] focus:bg-[#f6f2e8] focus:outline-none"
                >
                  <span className="mt-0.5 rounded-xl p-2" style={{ backgroundColor: topic.softColor, color: topic.color }}>
                    <Map className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-800">{faq.question}</span>
                    <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">{topic.label} · {faq.id}</span>
                  </span>
                  <ArrowRight className="mt-2 h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600" />
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FAQExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");
  const faqParam = searchParams.get("faq");
  const initialFaq = faqParam;
  const faqFromQuery = initialFaq ? campusTopics.flatMap((topic) => topic.faqs).find((faq) => faq.id === initialFaq) : undefined;
  const initialTopic = topicsBySlug.get(searchParams.get("topic") ?? "") ?? (faqFromQuery ? topicForFaq(faqFromQuery) : undefined);
  const [selectedTopic, setSelectedTopic] = useState<CampusTopic | undefined>(initialTopic);
  const [selectedFaq, setSelectedFaq] = useState<FAQEntry | undefined>(faqFromQuery);
  const [page, setPage] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const sidebarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  function showSidebar() {
    if (sidebarTimerRef.current) clearTimeout(sidebarTimerRef.current);
    setSidebarVisible(true);
  }

  function hideSidebar() {
    sidebarTimerRef.current = setTimeout(() => setSidebarVisible(false), 250);
  }

  const totalPages = selectedTopic ? Math.ceil(selectedTopic.faqs.length / PAGE_SIZE) : 0;
  const visibleFaqs = selectedTopic?.faqs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? [];

  const setUrl = useCallback((topic?: CampusTopic, faq?: FAQEntry) => {
    const params = new URLSearchParams();
    if (topic) params.set("topic", topic.slug);
    if (faq) params.set("faq", faq.id);
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  }, [pathname, router]);

  function chooseTopic(topic: CampusTopic) {
    setSelectedTopic(topic);
    setSelectedFaq(undefined);
    setPage(0);
    setUrl(topic);
  }

  function chooseFaq(faq: FAQEntry) {
    const topic = topicForFaq(faq);
    if (!topic) return;
    const faqPage = Math.floor(topic.faqs.findIndex((item) => item.id === faq.id) / PAGE_SIZE);
    setSelectedTopic(topic);
    setPage(Math.max(0, faqPage));
    setSelectedFaq(faq);
    setSearchOpen(false);
    setUrl(topic, faq);
  }

  function closeFaq() {
    setSelectedFaq(undefined);
    setCopied(false);
    setUrl(selectedTopic);
  }

  function returnToMap() {
    setSelectedTopic(undefined);
    setSelectedFaq(undefined);
    setPage(0);
    setUrl();
  }

  async function copyLink() {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = link;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  useEffect(() => {
    const faq = faqParam ? campusTopics.flatMap((topic) => topic.faqs).find((item) => item.id === faqParam) : undefined;
    const topic = topicsBySlug.get(topicParam ?? "") ?? (faq ? topicForFaq(faq) : undefined);
    setSelectedTopic(topic);
    setSelectedFaq(faq);
    setCopied(false);
    setPage(topic && faq ? Math.max(0, Math.floor(topic.faqs.findIndex((item) => item.id === faq.id) / PAGE_SIZE)) : 0);
  }, [faqParam, topicParam]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        if (searchOpen) setSearchOpen(false);
        else if (selectedFaq) {
          setSelectedFaq(undefined);
          setCopied(false);
          setUrl(selectedTopic);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [searchOpen, selectedFaq, selectedTopic, setUrl]);

  useEffect(() => {
    if (selectedFaq) window.setTimeout(() => answerRef.current?.focus(), 80);
  }, [selectedFaq]);

  return (
    <div className="-mx-4 -my-8 min-h-screen overflow-x-hidden bg-[#faf8f2] px-4 py-10 text-slate-800">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dfe2d3] bg-white/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#66806c]">
              <Compass className="h-3.5 w-3.5" /> Vicharanashala Student Guide
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#263b34] sm:text-6xl">Explore your internship campus.</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
              Every stop opens a verified collection of answers. Pick a place on the IIT Ropar knowledge map or search across all 142 questions.
            </p>
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#e1dccf] bg-white px-4 py-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:w-[340px]"
          >
            <span className="flex items-center gap-3 text-sm font-semibold text-slate-500"><Search className="h-4 w-4 text-[#66806c]" />Search the map</span>
            <span className="rounded-md bg-[#f4f0e7] px-2 py-1 text-[10px] font-bold text-slate-400">Ctrl K</span>
          </button>
        </div>

        {!selectedTopic ? (
          <>
            {/* Map: always interactive, full height on mobile, desktop height on md+ */}
            <div className="hidden md:block"><CampusIllustration onSelect={chooseTopic} /></div>
            <div className="md:hidden">
              <CampusIllustration onSelect={chooseTopic} />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 md:hidden">
              {campusTopics.map((topic) => {
                const Icon = iconFor(topic);
                return (
                  <button key={topic.slug} onClick={() => chooseTopic(topic)} className="flex items-center gap-3 rounded-2xl border border-[#e3ded2] bg-white p-4 text-left shadow-sm">
                    <span className="rounded-xl p-2.5" style={{ color: topic.color, backgroundColor: topic.softColor }}><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-800">{topic.label}</span><span className="mt-0.5 block text-xs text-slate-500">{topic.section}</span></span>
                    <span className="text-xs font-bold text-slate-400">{topic.faqs.length}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[2rem] border border-[#dfddd2] bg-[#f2f4e8] p-4 shadow-[0_24px_70px_rgba(75,83,62,0.12)] sm:p-6">
            {/* Background map strip on desktop (visible but dimmed) */}
            <div className="absolute inset-0 opacity-[0.15] hidden md:block"><CampusIllustration selectedTopic={selectedTopic} compact /></div>
            <div className="relative z-10">
              <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/70 bg-white/85 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <button onClick={returnToMap} className="rounded-full border border-[#e6e1d6] bg-white p-2 text-slate-500 transition hover:text-slate-900" aria-label="Back to campus map"><ArrowLeft className="h-4 w-4" /></button>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: selectedTopic.color }}>FAQ section</span>
                    <h2 className="mt-1 text-xl font-black text-[#293d36] sm:text-2xl">{selectedTopic.section}</h2>
                    <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-slate-500">{selectedTopic.description}</p>
                  </div>
                </div>
                <span className="self-start whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold" style={{ color: selectedTopic.color, backgroundColor: selectedTopic.softColor }}>{selectedTopic.faqs.length} verified answers</span>
              </div>

              {/* Mobile: tappable FAQ card list */}
              <div className="mt-5 space-y-3 md:hidden">
                {visibleFaqs.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => chooseFaq(faq)}
                    className={`w-full rounded-2xl border border-[#e5dfd2] bg-white/95 p-4 text-left shadow-sm transition active:scale-[0.98] ${
                      selectedFaq && selectedFaq.id !== faq.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider" style={{ color: selectedTopic.color }}>
                        {faq.id}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {selectedTopic.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-bold leading-5 text-slate-700 line-clamp-2">
                      {faq.question}
                    </p>
                    {/* Show truncated answer on mobile */}
                    <p className="mt-2 line-clamp-2 text-xs text-slate-500 leading-relaxed font-answer">
                      {faq.answer.replace(/<[^>]+>/g, "").replace(/\*\*/g, "").slice(0, 120)}...
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Tap to read more
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <BookOpen className="h-3 w-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop: floating cloud bubbles */}
              <div className="relative mt-5 hidden min-h-[530px] md:block">
                {visibleFaqs.map((faq, index) => (
                  <motion.button
                    key={faq.id}
                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                    animate={{ opacity: selectedFaq && selectedFaq.id !== faq.id ? 0.4 : 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.045 }}
                    onClick={() => chooseFaq(faq)}
                    className={`faq-cloud absolute w-[29%] rounded-[1.75rem] border border-white/90 bg-white/90 p-4 text-left shadow-[0_14px_30px_rgba(80,90,76,0.12)] transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-white/80 ${
                      cloudPositions[index]
                    }`}
                    style={{ animationDelay: `${index * -0.7}s` }}
                  >
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider" style={{ color: selectedTopic.color }}>{faq.id}</span>
                    <span className="mt-1 block text-sm font-bold leading-5 text-slate-700">{faq.question}</span>
                  </motion.button>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} className="rounded-full border border-[#ded9cd] bg-white p-2 text-slate-600 disabled:opacity-35" aria-label="Previous questions"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cloud {page + 1} of {totalPages}</span>
                  <button onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={page === totalPages - 1} className="rounded-full border border-[#ded9cd] bg-white p-2 text-slate-600 disabled:opacity-35" aria-label="Next questions"><ChevronRight className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </motion.section>
        )}

        <div className="mt-7 flex flex-col gap-4 rounded-[1.5rem] border border-[#e5dfd2] bg-white/75 p-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-3xl text-xs font-medium leading-5">Map locations organize the knowledge thematically. They are not the physical offices responsible for each topic.</p>
          <Link href="/community" className="flex shrink-0 items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#657e69] transition hover:text-[#31483e]">Still unsure? Ask the community <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <div className="fixed left-0 top-0 z-30 hidden h-full w-4 md:block" onMouseEnter={showSidebar} />

      <AnimatePresence>
        {sidebarVisible && (
          <motion.aside
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-0 top-0 z-40 hidden h-screen w-56 border-r border-[#e2ddd0] bg-[#fffdf8] shadow-xl md:block"
            onMouseEnter={showSidebar}
            onMouseLeave={hideSidebar}
          >
            <SidebarNav selectedTopic={selectedTopic} onChoose={chooseTopic} />
          </motion.aside>
        )}
      </AnimatePresence>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} onChoose={chooseFaq} />

      <AnimatePresence>
        {selectedFaq && selectedTopic && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-[#26332d]/25 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && closeFaq()}>
            <motion.div
              ref={answerRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={selectedFaq.question}
              className="max-h-[82vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-[#e1dcd0] bg-[#fffdf8] p-5 shadow-2xl outline-none sm:p-7"
              initial={{ opacity: 0, y: 25, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ color: selectedTopic.color }}>{selectedTopic.label} · FAQ {selectedFaq.id}</span>
                  <h3 className="mt-2 text-xl font-black leading-tight text-[#293d36] sm:text-2xl">{selectedFaq.question}</h3>
                </div>
                <button onClick={closeFaq} className="shrink-0 rounded-full bg-[#f4f0e7] p-2 text-slate-500 transition hover:text-slate-900" aria-label="Close answer"><X className="h-4 w-4" /></button>
              </div>
              {getTLDR(selectedFaq) && (
                <div className="mt-5">
                  <TLDRBlock tldr={getTLDR(selectedFaq)!} />
                </div>
              )}
              <p className="mt-5 whitespace-pre-line text-sm font-medium leading-7 text-slate-900 sm:text-[15px] font-answer"><RichAnswer text={selectedFaq.answer} /></p>

              <SimilarQuestions
                selectedFaq={selectedFaq}
                selectedTopic={selectedTopic}
                openAccordion={openAccordion}
                onToggle={setOpenAccordion}
              />
              <div className="mt-6 flex flex-col gap-3 border-t border-[#ebe5d9] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">Verified from the Samagama FAQ</span>
                <button onClick={copyLink} className="flex items-center gap-2 self-start rounded-full border border-[#e0dbcf] bg-white px-4 py-2 text-xs font-extrabold text-slate-600 transition hover:bg-[#f7f3eb]">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Link copied" : "Copy link"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  return <Suspense fallback={<div className="py-20 text-center text-sm font-semibold text-slate-500">Loading campus map...</div>}><FAQExperience /></Suspense>;
}
