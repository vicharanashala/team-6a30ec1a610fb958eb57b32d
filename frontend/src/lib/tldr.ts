import { FAQEntry } from "../data/campus-faq";
import staticTldrs from "../tldr.json";

/** Static TLDR lookup — key is FAQ id. Missing ids fall through to the algorithm. */
const staticTLDR: Record<string, { headline: string; pairs: KeyValue[]; action: string }> =
  staticTldrs as Record<string, { headline: string; pairs: KeyValue[]; action: string }>;

export type KeyValue = {
  icon: string;
  label: string;
  value: string;
};

export type TLDR = {
  headline: string;
  pairs: KeyValue[];
  action: string;
};

function sentences(text: string): string[] {
  const cleaned = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned.match(/[^.!?]+[.!?]+/g) || []).map(s => s.trim()).filter(s => s.length > 15);
}

type Label = { icon: string; label: string; signals: string[] };
const labels: Label[] = [
  { icon: "📅", label: "Duration", signals: ["months", "weeks", "duration of", "lasts for", "takes about", "runs for", "period of"] },
  { icon: "⏰", label: "Deadline", signals: ["deadline", "due date", "must finish", "must end", "cut-off", "last date", "finish by", "end by", "complete by"] },
  { icon: "⚠️", label: "Warning", signals: ["cannot", "must not", "not allowed", "prohibited", "warning", "consequence", "withdrawal", "removed", "blacklist", "penalty", "strictly not"] },
  { icon: "💡", label: "Tip", signals: ["recommend", "suggest", "best to", "advise", "pro tip", "strongly recommend", "ideally"] },
  { icon: "📋", label: "Requirement", signals: ["required", "need to", "must have", "prerequisite", "eligibility", "eligible", "open to", "you must", "you need"] },
  { icon: "💰", label: "Cost", signals: ["free of", "no charge", "no cost", "unpaid", "no stipend", "charge nothing", "completely free", "free —"] },
  { icon: "🏆", label: "Outcome", signals: ["certificate", "you will receive", "you will get", "you earn", "completes your", "earns the"] },
  { icon: "📌", label: "Rule", signals: ["simple rule", "rule:", "strictly", "mandatory", "code of conduct"] },
  { icon: "🔄", label: "Alternative", signals: ["alternative", "alternatively", "otherwise", "or you can", "another way", "instead of"] },
];

function classify(sentence: string): string[] {
  const lower = sentence.toLowerCase();
  const matched: string[] = [];
  for (const l of labels) {
    if (matched.includes(l.label)) continue;
    const hitCount = l.signals.filter(sig => lower.includes(sig)).length;
    if (hitCount > 0) matched.push(l.label);
  }
  return matched;
}

function extractHeadline(faq: FAQEntry, sents: string[]): string {
  const q = faq.question.toLowerCase();

  for (const s of sents) {
    const lower = s.toLowerCase();
    if (lower.includes("here's") || lower.includes("in short") || lower.includes("basically") || lower.includes("the key"))
      return trimLen(s);
  }

  if (/^(can|is|are|do|does|will|should|would|could|has|have)\s/i.test(q)) {
    const first = sents[0] || "";
    if (/yes|no|not|never|always|only/i.test(first.substring(0, 40)))
      return trimLen(first);
  }

  return trimLen(sents[0] || clean(faq.answer).substring(0, 120));
}

function isSimilarTo(a: string, b: string): boolean {
  if (!a || !b) return false;
  const short = a.length < b.length ? a : b;
  const long = a.length < b.length ? b : a;
  return long.toLowerCase().startsWith(short.substring(0, 40).toLowerCase());
}

function extractAction(sents: string[], avoid: string): string {
  const signals = [
    "contact", "email", "send", "submit", "upload", "download", "visit",
    "log in", "check", "reply", "reach out", "apply", "register", "sign",
    "confirm", "accept", "request", "escalate", "notify", "start",
    "choose", "select", "fill", "go to", "click", "open",
    "tell your", "ask", "use", "make sure", "defer", "opt in",
  ];

  const trimmed = (s: string) => s.replace(/^[,\s]+/, "").trim();

  for (const s of sents) {
    const lower = s.toLowerCase();
    const found = signals.some(sig => lower.includes(sig));
    if (found && s.length < 200 && !isSimilarTo(s, avoid)) return trimmed(s);
  }

  for (let i = sents.length - 1; i >= 0; i--) {
    const s = sents[i];
    if (!isSimilarTo(s, avoid) && s.length > 25 && s.length < 200) return trimmed(s);
  }

  const fallback = sents.find(s => !isSimilarTo(s, avoid));
  return fallback ? trimmed(fallback) : "";
}

function trimLen(s: string, max = 130): string {
  if (s.length <= max) return s;
  return s.substring(0, max - 3).trimEnd() + "...";
}

export function generateTLDR(faq: FAQEntry): TLDR | null {
  if (faq.answer.length <= 150) return null;

  /* ── 1. Static override ─────────────────────────────────────────────────── */
  const known = staticTLDR[faq.id];
  if (known) {
    return { headline: known.headline, pairs: known.pairs, action: known.action };
  }

  /* ── 2. Algorithmic fallback ───────────────────────────────────────────── */

  const sents = sentences(faq.answer);
  if (sents.length < 2) return null;

  const headline = extractHeadline(faq, sents);

  const scored: { sentence: string; labels: string[]; score: number }[] = [];
  for (const s of sents) {
    const matchedLabels = classify(s);
    if (matchedLabels.length > 0) {
      const score = matchedLabels.length + (s.length < 180 ? 1 : 0);
      scored.push({ sentence: s, labels: matchedLabels, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const usedLabels = new Set<string>();
  const pairs: KeyValue[] = [];
  for (const item of scored) {
    const label = item.labels[0];
    if (usedLabels.has(label)) continue;
    if (isSimilarTo(item.sentence, headline)) continue;
    const match = labels.find(l => l.label === label);
    if (!match) continue;
    usedLabels.add(label);
    pairs.push({ icon: match.icon, label: match.label, value: trimLen(item.sentence, 150) });
    if (pairs.length >= 4) break;
  }

  if (pairs.length < 2) {
    const body = sents.filter(s => !isSimilarTo(s, headline));
    for (const s of body) {
      if (pairs.length >= 4) break;
      if (pairs.some(p => isSimilarTo(p.value, s))) continue;
      pairs.push({ icon: "•", label: "", value: trimLen(s, 150) });
    }
  }

  const action = extractAction(sents, headline);

  return { headline, pairs, action };
}

function clean(text: string): string {
  return text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}
