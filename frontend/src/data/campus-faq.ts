import rawFaqs from "../../../faq.json";

export type FAQEntry = {
  id: string;
  section: string;
  question: string;
  answer: string;
};

export type CampusLocation = {
  name: string;
  x: number;
  y: number;
};

export type CampusTopic = {
  slug: string;
  label: string;
  section: string;
  location: CampusLocation;
  description: string;
  color: string;
  softColor: string;
  icon: string;
  faqs: FAQEntry[];
};

type CampusTopicDefinition = Omit<CampusTopic, "faqs">;

export const faqEntries = rawFaqs as FAQEntry[];

const topicDefinitions: CampusTopicDefinition[] = [
  {
    slug: "internship",
    label: "Internship",
    section: "About the internship",
    location: { name: "Spiral", x: 48, y: 17 },
    description: "Begin at the campus landmark with the essentials of the Vicharanashala internship.",
    color: "#d97757",
    softColor: "#fff1eb",
    icon: "compass",
  },
  {
    slug: "dates",
    label: "Timing & Dates",
    section: "Timing and dates",
    location: { name: "IIT Ropar Road / Main Entrance", x: 65, y: 13 },
    description: "Plan your route through start dates, duration, exams, and attendance rules.",
    color: "#d49a3a",
    softColor: "#fff8e6",
    icon: "calendar",
  },
  {
    slug: "noc",
    label: "NOC",
    section: "NOC (No Objection Certificate)",
    location: { name: "Admin Block", x: 69, y: 28 },
    description: "Find the paperwork path for signatures, formats, uploads, and verification.",
    color: "#cf6d75",
    softColor: "#fff0f1",
    icon: "file",
  },
  {
    slug: "selection",
    label: "Selection & Offer Letter",
    section: "Selection, offer letter, and certificate",
    location: { name: "Lecture Hall Complex", x: 84, y: 31 },
    description: "Understand selection, offer letters, acceptance, and the certificate journey.",
    color: "#8267ad",
    softColor: "#f5f0ff",
    icon: "award",
  },
  {
    slug: "work",
    label: "Work & Mentorship",
    section: "Work, mentorship, and projects",
    location: { name: "Mechanical Block", x: 38, y: 31 },
    description: "Explore project expectations, mentorship, working hours, and contribution paths.",
    color: "#3d8b80",
    softColor: "#eaf9f6",
    icon: "briefcase",
  },
  {
    slug: "conduct",
    label: "Code of Conduct",
    section: "Code of conduct — communication channels",
    location: { name: "Utility Block", x: 34, y: 62 },
    description: "Check which communication channels are official and how to stay connected safely.",
    color: "#a06a4f",
    softColor: "#faf0eb",
    icon: "shield",
  },
  {
    slug: "interviews",
    label: "Interviews",
    section: "Interviews Related",
    location: { name: "Electrical Block", x: 54, y: 49 },
    description: "Resolve interview-status questions and dashboard follow-ups.",
    color: "#d98e36",
    softColor: "#fff5e8",
    icon: "messages",
  },
  {
    slug: "certificates",
    label: "Certificate",
    section: "Certificate",
    location: { name: "M. Visvesvaraya Building", x: 58, y: 63 },
    description: "Learn how completion certificates are issued and what they contain.",
    color: "#6e8b58",
    softColor: "#f2f8ed",
    icon: "badge",
  },
  {
    slug: "rosetta",
    label: "Rosetta Journal",
    section: "Rosetta — your internship journal",
    location: { name: "Nalanda Library", x: 43, y: 57 },
    description: "Visit the journal collection for Rosetta routines, submissions, and reflection.",
    color: "#837052",
    softColor: "#f8f3ea",
    icon: "book",
  },
  {
    slug: "coursework",
    label: "Phase 1 Coursework",
    section: "Phase 1 — coursework, Vibe LMS, and live sessions",
    location: { name: "Chemistry Block", x: 33, y: 48 },
    description: "Navigate Phase 1 registration, coursework, sessions, and exemptions.",
    color: "#438694",
    softColor: "#eaf7fa",
    icon: "graduation",
  },
  {
    slug: "yaksha",
    label: "Yaksha Chat",
    section: "Yaksha Chat Related",
    location: { name: "IT Centre", x: 42, y: 83 },
    description: "Troubleshoot the Yaksha chat and get back into the conversation.",
    color: "#5c77b8",
    softColor: "#edf2ff",
    icon: "sparkles",
  },
  {
    slug: "vibe",
    label: "ViBe Platform",
    section: "ViBe Platform",
    location: { name: "CS Block", x: 64, y: 50 },
    description: "Solve ViBe login, course, video, proctoring, and platform questions.",
    color: "#6178b3",
    softColor: "#edf2ff",
    icon: "monitor",
  },
  {
    slug: "teams",
    label: "Team Formation",
    section: "Team Formation",
    location: { name: "Student Activity Centre", x: 88, y: 71 },
    description: "Gather at the student hub for team formation, matching, and collaboration rules.",
    color: "#bc6866",
    softColor: "#fff0ef",
    icon: "users",
  },
];

export const campusTopics: CampusTopic[] = topicDefinitions.map((topic) => ({
  ...topic,
  faqs: faqEntries.filter((faq) => faq.section === topic.section),
}));

export const topicsBySlug = new Map(campusTopics.map((topic) => [topic.slug, topic]));

export function topicForFaq(faq: FAQEntry) {
  return campusTopics.find((topic) => topic.section === faq.section);
}

function tokens(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

export function searchCampusFaqs(query: string) {
  const queryTokens = tokens(query);
  if (!queryTokens.length) return [];

  return faqEntries
    .map((faq) => {
      const topic = topicForFaq(faq);
      const question = faq.question.toLowerCase();
      const haystack = [
        faq.question,
        faq.answer,
        faq.section,
        topic?.location.name ?? "",
      ].join(" ").toLowerCase();
      const score = queryTokens.reduce((total, token) => {
        if (!haystack.includes(token)) return total;
        return total + (question.includes(token) ? 4 : 1);
      }, 0);
      return { faq, topic, score };
    })
    .filter((result) => result.score > 0 && result.topic)
    .sort((a, b) => b.score - a.score || a.faq.id.localeCompare(b.faq.id, undefined, { numeric: true }))
    .slice(0, 8);
}
