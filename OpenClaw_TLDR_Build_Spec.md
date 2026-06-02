# OpenClaw Build Specification: FAQ TLDR Feature

## Project Overview

**Feature:** TLDR (Too Long; Didn't Read) summaries for FAQ system  
**Target System:** Vicharanashala Internship Hub FAQ Website  
**Build Tool:** OpenClaw with frontier model (Claude, GPT-4, etc.)  
**Input Data:** faq.json (126 FAQs)  
**Output:** Production-ready web feature with enhanced FAQ display

---

## Build Context for OpenClaw

This specification is optimized for **OpenClaw autonomous building**. The frontier model should:
1. Read and understand the complete specification
2. Analyze the input FAQ data structure
3. Generate production-ready code (HTML/CSS/JavaScript)
4. Implement all features in a single cohesive build
5. Self-test against success criteria before delivering

---

## Input Files Required

### 1. faq.json
**Location:** Provide this file to OpenClaw  
**Structure:**
```json
[
  {
    "id": "1.1",
    "section": "About the internship",
    "question": "What is the Vicharanashala internship?",
    "answer": "A two-month internship run by Vicharanashala..."
  },
  // ... 125 more FAQs
]
```

**Data Facts:**
- Total FAQs: 126
- Average answer length: 450 characters
- 67 FAQs (53%) need TLDR based on detection criteria

---

## Core Feature Requirements

### Feature 1: TLDR Detection Algorithm

**Objective:** Automatically identify which FAQs need TLDR summaries.

**Implementation:**
```javascript
/**
 * Determines if an FAQ needs a TLDR summary
 * @param {Object} faq - FAQ object with id, question, answer fields
 * @returns {boolean} - true if FAQ needs TLDR
 */
function needsTLDR(faq) {
  // Criterion 1: Long answer (>400 characters)
  const isLong = faq.answer.length > 400;

  // Criterion 2: Action-oriented question
  const actionKeywords = [
    'how do i', 'how to', 'what should i', 'when do i', 'can i', 
    'do i need', 'submit', 'upload', 'download', 'register', 
    'sign', 'confirm', 'accept'
  ];
  const isActionOriented = actionKeywords.some(keyword => 
    faq.question.toLowerCase().includes(keyword)
  );

  // Criterion 3: Multi-step procedure (>8 sentences)
  const sentenceCount = (faq.answer.match(/\.(?=\s|$)/g) || []).length;
  const hasMultipleSteps = sentenceCount > 8;

  // Return true if ANY criterion is met
  return isLong || (isActionOriented && hasMultipleSteps);
}
```

**Expected Result:** 67 out of 126 FAQs should be flagged with `needs_tldr: true`

**Test Cases:**
```javascript
// Should return true (long answer)
needsTLDR({
  id: "4.7",
  question: "How do I accept the offer letter?",
  answer: "Once your formal offer letter arrives..." // 1544 chars
}); // => true

// Should return true (action-oriented + multi-step)
needsTLDR({
  id: "3.8",
  question: "How do I download and upload the NOC?",
  answer: "Both happen on your dashboard. Step 1... Step 2..." // 874 chars, 12 sentences
}); // => true

// Should return false (short, simple)
needsTLDR({
  id: "5.4",
  question: "Is there a stipend?",
  answer: "No. The internship is unpaid." // 31 chars
}); // => false
```

---

### Feature 2: TLDR Data Structure

**Objective:** Define flexible TLDR schema that adapts to different FAQ types.

**TypeScript Interface:**
```typescript
interface TLDR {
  // PRIMARY CONTENT (use what fits the FAQ type):
  steps?: string[];              // Sequential action steps
  quick_answer?: string;         // One-line answer
  short_answer?: string;         // Brief summary (2-3 sentences)
  quick_fixes?: string[];        // Troubleshooting steps
  paths?: string[];              // Alternative routes
  phases?: string[];             // Sequential stages
  benefits?: string[];           // Advantages/reasons
  official_channels?: string[];  // Approved methods
  internship_courses?: string[]; // Course-specific rules

  // SUPPORTING CONTEXT (optional):
  warning?: string;              // Critical warning (RED box)
  note?: string;                 // Pro tip (BLUE box)
  alternative?: string;          // Alternative method
  timeline?: string;             // Expected timeframe
  confirmation?: string;         // What to expect after action
  escalate?: string;             // What to do if stuck
  recommendation?: string;       // Suggested approach
  consequences?: string;         // What happens if violated
  rule?: string;                 // Simple rule to remember
  duration?: string;             // How long something takes
  location?: string;             // Where to find something
  can_change?: string;           // Whether changeable
  to_complete?: string;          // Requirements to finish
  extras?: string;               // Optional/bonus items
  if_broken?: string;            // Next step if fixes fail
  after_approval?: string;       // Post-approval process
  iitm_courses?: string;         // Alternative course rules
  how_to_tell?: string;          // How to distinguish
}
```

**Storage Format:**
```javascript
// Enhanced FAQ object structure
{
  id: "4.7",
  section: "Selection, offer letter, and certificate",
  question: "How do I accept the offer letter?",
  answer: "Once your formal offer letter arrives...",
  needs_tldr: true,              // Flagged by detection algorithm
  answer_length: 1544,           // Character count
  tldr: {                        // TLDR data (if exists)
    steps: [...],
    warning: "...",
    timeline: "..."
  }
}
```

---

### Feature 3: 10 Priority TLDR Templates

**Objective:** Provide complete TLDR data for 10 most important FAQs.

**Implementation:** Hard-code these TLDR objects in your initial build.

#### TLDR 1: Multi-Step Procedure
```javascript
const TLDR_4_7 = {
  id: "4.7",
  tldr: {
    steps: [
      "Reply to email from: no-reply@vicharanashala.ai",
      "Copy-paste the EXACT acceptance statement (see full answer below)",
      "Fill in your full name and today's date",
      "Send within 5 days of receiving offer letter"
    ],
    warning: "Must use exact wording - paraphrasing = withdrawal",
    alternative: "Or download PDF \u2192 Sign \u2192 Scan \u2192 Attach to reply",
    timeline: "Processed manually within 24-48 hours"
  }
};
```

#### TLDR 2: Troubleshooting Guide
```javascript
const TLDR_12_2 = {
  id: "12.2",
  tldr: {
    quick_fixes: [
      "Verify you're logged in with REGISTERED email",
      "Log out \u2192 Log back in",
      "Switch to personal WiFi (not college network)",
      "Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)"
    ],
    if_broken: "Try advanced steps in full answer below",
    escalate: "Still stuck? Type 'escalate' in Yaksha chat"
  }
};
```

#### TLDR 3: Policy/Decision
```javascript
const TLDR_2_1 = {
  id: "2.1",
  tldr: {
    quick_answer: "Anytime in 2026, BUT must finish by December 31, 2026",
    duration: "2 months + optional 1-month grace period",
    recommendation: "Start in May\u2013July for full cohort experience",
    benefits: [
      "Full cohort networking & peer support",
      "TAs available full-time (part-time after July)",
      "Training delivered with live discussions"
    ],
    warning: "Late start = Solo experience, lighter support, no buffer time"
  }
};
```

#### TLDR 4: Yes/No with Context
```javascript
const TLDR_6_1 = {
  id: "6.1",
  tldr: {
    short_answer: "NO - Strictly prohibited",
    official_channels: [
      "Yaksha chat on samagama.in (type 'escalate' for humans)",
      "Email: no-reply@vicharanashala.ai (outbound only)",
      "Moderated WhatsApp troubleshooting group (invite-only)"
    ],
    consequences: "Withdrawal, removal, blacklisting, college notification",
    rule: "If we didn't invite you through samagama.in, it's not official"
  }
};
```

#### TLDR 5: Phases Explanation
```javascript
const TLDR_1_3 = {
  id: "1.3",
  tldr: {
    phases: [
      "\ud83e\udd4d Bronze (Phase 1): Training period at start",
      "\ud83e\udd48 Silver (Phase 2): Main project work - REQUIRED for certificate",
      "\ud83e\udd47 Gold (Phase 3): Recognition for meaningful standalone contribution",
      "\ud83d\udc8e Platinum (Phase 4): Lab visit invitation + travel stipend"
    ],
    to_complete: "Bronze + Silver = Certificate",
    extras: "Gold & Platinum are bonus recognitions, not required"
  }
};
```

#### TLDR 6: Multiple Paths
```javascript
const TLDR_4_3 = {
  id: "4.3",
  tldr: {
    paths: [
      "Path 1 (Formal): After NOC verified + dates confirmed \u2192 within 1 hour",
      "Path 2 (Tentative): Upload self-declaration \u2192 instant offer letter"
    ],
    timeline: "Usually within 1 hour after both requirements met",
    location: "Download from dashboard at samagama.in (not email)",
    warning: "Check spam/promotions if notification email missing"
  }
};
```

#### TLDR 7: Email Procedure
```javascript
const TLDR_3_7 = {
  id: "3.7",
  tldr: {
    steps: [
      "Download 'text NOC (email path)' from your dashboard",
      "Fill your details \u2192 Email file to your HOD",
      "HOD forwards email to: sudarshan@iitrpr.ac.in",
      "Subject line: 'NOC for my student <Your Full Name>'"
    ],
    warning: "HOD must use official college email (not Gmail/personal)",
    note: "Forward = signature (no physical sign needed)",
    timeline: "Confirmation in 24-48 hours"
  }
};
```

#### TLDR 8: Upload Procedure
```javascript
const TLDR_3_8 = {
  id: "3.8",
  tldr: {
    steps: [
      "Log in to samagama.in dashboard",
      "Find NOC section (3 locations: header bar / NOC card / Result message)",
      "Click 'Download blank NOC' \u2192 Save PDF",
      "Get it signed + stamped by HOD",
      "Click 'Upload signed NOC PDF' \u2192 Select file (max 1 MB)"
    ],
    confirmation: "Green confirmation appears on same card once uploaded",
    note: "Use dashboard buttons only (not chat)"
  }
};
```

#### TLDR 9: Modification Procedure
```javascript
const TLDR_4_16 = {
  id: "4.16",
  tldr: {
    can_change: "Yes, but requires HOD approval after offer letter issued",
    steps: [
      "HOD sends email to: harshdeep.r@vicharanashala.ai",
      "CC: sudarshan@iitrpr.ac.in",
      "Subject: 'Date change request \u2014 <Your Full Name> \u2014 Vicharanashala Summership 2026'",
      "Body: Reason + new start/end dates"
    ],
    after_approval: "Dashboard unlocks \u2192 Re-save dates \u2192 New offer letter issued",
    warning: "Student requests not accepted - must come from NOC signatory"
  }
};
```

#### TLDR 10: Rules Comparison
```javascript
const TLDR_12_17 = {
  id: "12.17",
  tldr: {
    short_answer: "No - proctoring varies by course",
    internship_courses: [
      "Mandatory webcam on",
      "No phones/devices visible",
      "Face must be visible",
      "Auto-pause if violations detected"
    ],
    iitm_courses: "Different, stricter proctoring rules (check course-specific instructions)",
    how_to_tell: "Look at course title and institutional badge on course card"
  }
};
```

**TLDR Map Object:**
```javascript
const TLDR_MAP = {
  "4.7": TLDR_4_7.tldr,
  "3.7": TLDR_3_7.tldr,
  "2.1": TLDR_2_1.tldr,
  "12.2": TLDR_12_2.tldr,
  "4.3": TLDR_4_3.tldr,
  "12.17": TLDR_12_17.tldr,
  "3.8": TLDR_3_8.tldr,
  "4.16": TLDR_4_16.tldr,
  "6.1": TLDR_6_1.tldr,
  "1.3": TLDR_1_3.tldr
};
```

---

### Feature 3b (Optional): Auto-Generated TLDR Fallback

**Objective:** Provide basic TLDR for the remaining 57 flagged FAQs that lack handcrafted templates.

**Recommendation:** Implement this as a fallback. It raises the "With TLDR" count from 10 to up to 67, providing a uniform UX across all flagged FAQs. Tag auto-generated TLDRs with `autoGenerated: true` so the UI can distinguish handcrafted (gold badge) from automatic (silver badge).

**Implementation:**
```javascript
/**
 * Auto-generate a basic TLDR for FAQs without handcrafted templates.
 * Uses two strategies: step extraction or sentence summarization.
 * @param {Object} faq - FAQ object with id, question, answer
 * @returns {Object|null} - TLDR data object or null if generation fails
 */
function autoGenerateTLDR(faq) {
  const answer = faq.answer;

  // Strategy 1: Extract numbered or bullet-pointed steps
  const lines = answer.split('\n').filter(l => l.trim());
  const steps = lines.filter(l =>
    /^\d+[\.)]/.test(l) ||
    /^[-*\u2022]/.test(l) ||
    /^(step|click|open|go to|select|enter|type|choose|download|upload)/i.test(l)
  );
  if (steps.length > 1) {
    return { steps: steps.slice(0, 5), autoGenerated: true };
  }

  // Strategy 2: Take first 2 sentences as summary
  const sentences = answer.match(/[^.!?]+[.!?]+/g) || [answer];
  const summary = sentences.slice(0, 2).join(' ').trim();
  if (summary.length > 40) {
    return { short_answer: summary, autoGenerated: true };
  }

  return null;
}

function processFAQs(rawFaqs) {
  return rawFaqs.map(faq => {
    const needs_tldr = needsTLDR(faq);
    const answer_length = faq.answer.length;

    // Prefer handcrafted template, fall back to auto-generation
    let tldr = TLDR_MAP[faq.id] || null;
    if (!tldr && needs_tldr) {
      tldr = autoGenerateTLDR(faq);
    }

    return {
      ...faq,
      needs_tldr,
      answer_length,
      tldr
    };
  });
}
```

**Tradeoff Analysis:**
| Aspect | Handcrafted Only (10) | With Auto-Gen (up to 67) |
|--------|----------------------|--------------------------|
| Quality | High — manually reviewed | Medium — may miss nuance |
| Coverage | 10/126 (8%) | 67/126 (53%) |
| Filter usefulness | "With TLDR" = expert-curated only | "With TLDR" = any summary available |
| Maintenance | Add templates manually | Auto-generated, zero maintenance |

**Recommendation:** Implement auto-generation for the best user experience. Label auto-generated TLDRs subtly (e.g., "Auto-summarized" tooltip) so users know it's not handcrafted.

---

### Feature 4: Visual Design System

**Objective:** Create visually distinct TLDR sections with clear hierarchy.

#### Color Palette
```css
:root {
  /* TLDR Section */
  --tldr-bg: #fffbeb;           /* Light yellow/cream */
  --tldr-border: #fbbf24;       /* Gold */
  --tldr-title: #92400e;        /* Dark brown */

  /* Warning Box */
  --warning-bg: #fef2f2;        /* Light red */
  --warning-border: #ef4444;    /* Red */

  /* Note Box */
  --note-bg: #eff6ff;           /* Light blue */
  --note-border: #3b82f6;       /* Blue */

  /* Checkmarks & Icons */
  --checkmark-color: #10b981;   /* Green */
  --expand-icon: #cbd5e0;       /* Light gray */

  /* Badges */
  --badge-has-tldr: #fbbf24;    /* Yellow/gold */
  --badge-needs-tldr: #ef4444;  /* Red */

  /* FAQ Cards */
  --card-bg: #ffffff;           /* White */
  --card-border: #e2e8f0;       /* Light gray */
  --card-border-hover: #cbd5e1; /* Medium gray */
  --card-shadow: rgba(0,0,0,0.08);
  --card-shadow-hover: rgba(0,0,0,0.12);

  /* Text */
  --text-primary: #1e293b;      /* Dark gray */
  --text-secondary: #475569;    /* Medium gray */
  --text-muted: #64748b;        /* Light gray */

  /* Focus */
  --focus-ring: rgba(59,130,246,0.4); /* Blue focus outline */
}
```

#### Component Styles

**Page Layout & Header:**
```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  background: #f8fafc;
  color: var(--text-primary);
  line-height: 1.6;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
}

.container {
  max-width: 840px;
  width: 100%;
}

.header {
  margin-bottom: 28px;
}

.header h1 {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.header p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 4px;
}
```

**Stats Dashboard:**
```css
.stats {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 120px;
  background: var(--card-bg);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px var(--card-shadow);
  border: 1px solid var(--card-border);
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

.stat-sublabel {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-top: 1px;
}

.stat-card.total .stat-number { color: var(--text-primary); }
.stat-card.needs .stat-number { color: var(--warning-border); }
.stat-card.done .stat-number { color: var(--checkmark-color); }
```

**Search & Filter Toolbar:**
```css
.filter-section {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: stretch;
}

.search-box {
  flex: 1;
  min-width: 180px;
  padding: 11px 14px;
  border-radius: 12px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  font-size: 0.85rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.search-box:focus {
  border-color: var(--tldr-border);
  box-shadow: 0 0 0 3px rgba(251,191,36,0.15);
}

.filter-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 11px 16px;
  border-radius: 12px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  user-select: none;
}

.filter-btn:hover {
  background: #f8fafc;
  color: var(--text-secondary);
}

.filter-btn.active {
  background: var(--text-primary);
  color: white;
  border-color: var(--text-primary);
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}
```

**Result Meta (showing count):**
```css
.result-meta {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 12px;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.result-meta .highlight {
  color: #f59e0b;
  font-weight: 700;
}
```

**FAQ Cards:**
```css
.faq-item {
  background: var(--card-bg);
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px var(--card-shadow);
  overflow: hidden;
  transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
  border: 1px solid transparent;
}

.faq-item:hover {
  box-shadow: 0 4px 14px var(--card-shadow-hover);
  transform: translateY(-2px);
  border-color: var(--card-border-hover);
}

.faq-header {
  padding: 20px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
  border-bottom: 1px solid var(--card-border);
  transition: background 0.12s;
  user-select: none;
  gap: 12px;
}

.faq-header:hover {
  background: #f2f2f2;
}

.faq-header-left {
  flex: 1;
  min-width: 0;
}

.faq-id {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 2px;
}

.faq-section {
  font-size: 0.66rem;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 320px;
}

.faq-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.expand-icon {
  font-size: 1.2rem;
  color: var(--expand-icon);
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.faq-item.expanded .expand-icon {
  transform: rotate(180deg);
}
```

**TLDR Section:**
```css
.tldr-section {
  background: var(--tldr-bg);
  border-left: 4px solid var(--tldr-border);
  padding: 20px;
  margin: 20px;
  border-radius: 6px;
}

.tldr-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.tldr-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.tldr-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--tldr-title);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tldr-section-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 12px 0 5px;
}
```

**Steps List:**
```css
.tldr-steps {
  list-style: none;
  padding: 0;
  margin-bottom: 15px;
}

.tldr-steps li {
  padding: 8px 0;
  padding-left: 28px;
  position: relative;
  line-height: 1.6;
  font-size: 0.88rem;
  color: var(--text-primary);
}

.tldr-steps li::before {
  content: "\2713";
  position: absolute;
  left: 2px;
  top: 8px;
  color: var(--checkmark-color);
  font-weight: 700;
  font-size: 1.1rem;
}
```

**Warning Box:**
```css
.tldr-warning {
  background: var(--warning-bg);
  border-left: 4px solid var(--warning-border);
  padding: 12px;
  margin-top: 10px;
  border-radius: 4px;
  font-size: 0.88rem;
  font-weight: 500;
  color: #991b1b;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.tldr-warning::before {
  content: "\26A0\FE0F ";
  font-size: 1rem;
  flex-shrink: 0;
}
```

**Note Box:**
```css
.tldr-note {
  background: var(--note-bg);
  border-left: 4px solid var(--note-border);
  padding: 12px;
  margin-top: 10px;
  border-radius: 4px;
  font-size: 0.88rem;
  color: #1e40af;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.tldr-note::before {
  content: "\D83D\DCA1 ";
  font-size: 1rem;
  flex-shrink: 0;
}
```

**Quick Answer / Short Answer:**
```css
.tldr-quick-answer {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  padding: 4px 0 12px;
}

.tldr-short-answer {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 4px 0 10px;
}
```

**Badges:**
```css
.tldr-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.tldr-badge.has-tldr {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.tldr-badge.needs-tldr {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.tldr-badge.auto-tldr {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}
```

**Original Answer:**
```css
.original-answer {
  padding: 0 20px 20px;
}

.answer-header {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.answer-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.7;
  white-space: pre-wrap;
}
```

**Collapsible Content Animation:**
```css
.faq-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.faq-item.expanded .faq-content {
  max-height: 5000px;
}
```

**Empty State & Loading:**
```css
.no-results,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.no-results h3,
.empty-state h3 {
  font-size: 1.1rem;
  margin-bottom: 6px;
  color: var(--text-secondary);
}

.no-results p,
.empty-state p {
  font-size: 0.88rem;
}

.loading {
  text-align: center;
  padding: 70px 20px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.loading .spinner {
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 3px solid var(--card-border);
  border-top-color: var(--tldr-border);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Focus & Accessibility:**
```css
.faq-header:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: -2px;
  border-radius: 8px 8px 0 0;
}

.filter-btn:focus-visible,
.search-box:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px;
}
```

**Responsive Design (mobile down to 375px):**
```css
@media (max-width: 600px) {
  body { padding: 12px; }
  
  .header h1 { font-size: 1.3rem; }
  .header p { font-size: 0.8rem; }
  
  .stats { gap: 8px; }
  .stat-card { padding: 12px 14px; min-width: 90px; }
  .stat-number { font-size: 1.3rem; }
  .stat-label { font-size: 0.6rem; }
  
  .filter-section { flex-direction: column; }
  .filter-buttons { width: 100%; }
  .filter-btn { flex: 1; text-align: center; padding: 10px 8px; font-size: 0.7rem; }
  
  .faq-header { padding: 14px 16px; }
  .faq-title { font-size: 0.82rem; }
  
  .tldr-section { padding: 14px; margin: 14px; }
  .tldr-steps li { font-size: 0.82rem; padding-left: 24px; }
  .tldr-warning,
  .tldr-note { font-size: 0.82rem; padding: 10px; }
  
  .original-answer { padding: 0 14px 14px; }
  .answer-text { font-size: 0.8rem; }
}
```

#### Layout Structure
```html
<!-- Single FAQ Card Structure -->
<div class="faq-item" data-id="4.7">
  <!-- Header (always visible) -->
  <div class="faq-header" onclick="toggleFAQ('4.7')"
       role="button" tabindex="0"
       aria-expanded="false"
       aria-controls="faq-content-4-7">
    <div class="faq-header-left">
      <div class="faq-id">ID: 4.7</div>
      <div class="faq-section">📂 Selection, offer letter, and certificate</div>
      <div class="faq-title">
        How do I accept the offer letter?
        <span class="tldr-badge has-tldr" aria-label="Has TLDR summary">HAS TLDR</span>
      </div>
    </div>
    <div class="expand-icon" aria-hidden="true">▼</div>
  </div>

  <!-- Content (expandable) -->
  <div class="faq-content" id="faq-content-4-7" role="region" aria-label="FAQ content">
    <!-- TLDR Section (if exists) -->
    <div class="tldr-section">
      <div class="tldr-header">
        <span class="tldr-icon" aria-hidden="true">⚡</span>
        <span class="tldr-title">TLDR - Quick Action</span>
      </div>

      <!-- Steps -->
      <ul class="tldr-steps">
        <li>Reply to email from: no-reply@vicharanashala.ai</li>
        <li>Copy-paste the EXACT acceptance statement</li>
        <li>Fill in your full name and today's date</li>
        <li>Send within 5 days</li>
      </ul>

      <!-- Warning -->
      <div class="tldr-warning">
        Must use exact wording - paraphrasing = withdrawal
      </div>

      <!-- Note -->
      <div class="tldr-note">
        Or download PDF → Sign → Scan → Attach to reply
      </div>

      <!-- Timeline -->
      <div class="tldr-note" style="margin-top:8px;">
        ⏱️ Processed manually within 24-48 hours
      </div>
    </div>

    <!-- Original Answer (always present) -->
    <div class="original-answer">
      <div class="answer-header">📄 Full Answer (Original)</div>
      <div class="answer-text">
        Once your formal offer letter arrives, accepting it has a precise form...
      </div>
    </div>
  </div>
</div>
```

**Important: FAQ IDs contain dots (e.g., "4.7").** Use `CSS.escape()` when querying by ID:
```javascript
function toggleFAQ(faqId) {
  const faqItem = document.querySelector(`[data-id="${CSS.escape(faqId)}"]`);
  // ...
}
```

---

### Feature 5: TLDR Rendering Logic

**Objective:** Dynamically render TLDR sections based on data structure.

**JavaScript Function:**
```javascript
/**
 * Escape HTML to prevent XSS.
 * Works in all modern browsers.
 * @param {string} str - Raw string
 * @returns {string} - HTML-safe string
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Renders TLDR section HTML from TLDR data object
 * @param {Object} tldr - TLDR data object
 * @returns {string} - HTML string for TLDR section
 */
function renderTLDR(tldr) {
  if (!tldr) return '';

  let html = `
    <div class="tldr-section">
      <div class="tldr-header">
        <span class="tldr-icon" aria-hidden="true">⚡</span>
        <span class="tldr-title">TLDR - Quick Action</span>
      </div>
  `;

  // Render quick answer (one-liner)
  if (tldr.quick_answer) {
    html += `<div class="tldr-quick-answer">📅 ${escapeHTML(tldr.quick_answer)}</div>`;
  }

  // Render short answer (2-3 sentence summary)
  if (tldr.short_answer) {
    html += `<div class="tldr-short-answer">🎯 ${escapeHTML(tldr.short_answer)}</div>`;
  }

  // Render sequential action steps (green checkmarks)
  if (tldr.steps && tldr.steps.length > 0) {
    html += '<ul class="tldr-steps">';
    tldr.steps.forEach(step => {
      html += `<li>${escapeHTML(step)}</li>`;
    });
    html += '</ul>';
  }

  // Render troubleshooting quick fixes (green checkmarks, with label)
  if (tldr.quick_fixes && tldr.quick_fixes.length > 0) {
    html += '<div class="tldr-section-label">🔧 Quick Fixes - Try in order:</div>';
    html += '<ul class="tldr-steps">';
    tldr.quick_fixes.forEach(fix => {
      html += `<li>${escapeHTML(fix)}</li>`;
    });
    html += '</ul>';
  }

  // Render alternative paths (green checkmarks)
  if (tldr.paths && tldr.paths.length > 0) {
    html += '<div class="tldr-section-label">📍 Available Paths:</div>';
    html += '<ul class="tldr-steps">';
    tldr.paths.forEach(path => {
      html += `<li>${escapeHTML(path)}</li>`;
    });
    html += '</ul>';
  }

  // Render phases (green checkmarks)
  if (tldr.phases && tldr.phases.length > 0) {
    html += '<div class="tldr-section-label">📊 Phases:</div>';
    html += '<ul class="tldr-steps">';
    tldr.phases.forEach(phase => {
      html += `<li>${escapeHTML(phase)}</li>`;
    });
    html += '</ul>';
  }

  // Render benefits (green checkmarks)
  if (tldr.benefits && tldr.benefits.length > 0) {
    html += '<div class="tldr-section-label">✅ Benefits:</div>';
    html += '<ul class="tldr-steps">';
    tldr.benefits.forEach(benefit => {
      html += `<li>${escapeHTML(benefit)}</li>`;
    });
    html += '</ul>';
  }

  // Render official channels
  if (tldr.official_channels && tldr.official_channels.length > 0) {
    html += '<div class="tldr-section-label">✅ Official Channels ONLY:</div>';
    html += '<ul class="tldr-steps">';
    tldr.official_channels.forEach(channel => {
      html += `<li>${escapeHTML(channel)}</li>`;
    });
    html += '</ul>';
  }

  // Render internship course-specific rules
  if (tldr.internship_courses && tldr.internship_courses.length > 0) {
    html += '<div class="tldr-section-label">📚 Internship Courses:</div>';
    html += '<ul class="tldr-steps">';
    tldr.internship_courses.forEach(rule => {
      html += `<li>${escapeHTML(rule)}</li>`;
    });
    html += '</ul>';
  }

  // Render supporting fields as notes (blue boxes with labeled icons)
  const supportingFields = [
    { key: 'duration', icon: '⏱️', label: 'Duration:' },
    { key: 'recommendation', icon: '🎯', label: 'Recommended:' },
    { key: 'location', icon: '📥', label: 'Location:' },
    { key: 'can_change', icon: '🎯', label: 'Can you change?' },
    { key: 'to_complete', icon: '✅', label: 'To complete:' },
    { key: 'confirmation', icon: '✅', label: 'Confirmation:' },
    { key: 'after_approval', icon: '✅', label: 'After approval:' },
    { key: 'iitm_courses', icon: '🎓', label: 'IITM BS Courses:' },
    { key: 'how_to_tell', icon: '💡', label: 'How to tell:' }
  ];

  supportingFields.forEach(field => {
    if (tldr[field.key]) {
      html += `<div class="tldr-note" style="margin-top:8px;">${field.icon} <strong>${field.label}</strong> ${escapeHTML(tldr[field.key])}</div>`;
    }
  });

  // Render warning (red box, always prominent)
  if (tldr.warning) {
    html += `<div class="tldr-warning"><strong>CRITICAL:</strong> ${escapeHTML(tldr.warning)}</div>`;
  }

  // Render consequences (red box)
  if (tldr.consequences) {
    html += `<div class="tldr-warning" style="margin-top:6px;"><strong>Consequences:</strong> ${escapeHTML(tldr.consequences)}</div>`;
  }

  // Render notes and contextual info (blue boxes)
  const noteFields = [
    { key: 'note', prefix: 'Pro Tip:' },
    { key: 'alternative', prefix: 'Alternative:' },
    { key: 'timeline', icon: '⏱️', prefix: '' },
    { key: 'extras', prefix: 'Note:' },
    { key: 'rule', prefix: 'Simple Rule:' },
    { key: 'if_broken', prefix: '💡 If still broken:' },
    { key: 'escalate', icon: '🆘', prefix: '' }
  ];

  noteFields.forEach(field => {
    if (tldr[field.key]) {
      const icon = field.icon || '💡';
      html += `<div class="tldr-note" style="margin-top:6px;">${icon} ${field.prefix ? `<strong>${field.prefix}</strong> ` : ''}${escapeHTML(tldr[field.key])}</div>`;
    }
  });

  html += '</div>';
  return html;
}
```

---

### Feature 6: Search & Filter System

**Objective:** Enable real-time search and filtering of FAQs.

**Search Implementation:**
```javascript
/**
 * Search FAQs by keyword across multiple fields
 * @param {string} searchTerm - Search query
 * @param {Array} faqs - Array of FAQ objects
 * @returns {Array} - Filtered FAQ array
 */
function searchFAQs(searchTerm, faqs) {
  if (!searchTerm || searchTerm.trim() === '') {
    return faqs;
  }

  const term = searchTerm.toLowerCase().trim();

  return faqs.filter(faq => {
    return (
      faq.id.toLowerCase().includes(term) ||
      faq.question.toLowerCase().includes(term) ||
      faq.answer.toLowerCase().includes(term) ||
      faq.section.toLowerCase().includes(term)
    );
  });
}
```

**Debounced Search (safe — passes term into callback to avoid race conditions):**
```javascript
let searchTimeout;

function debouncedSearch(searchTerm, faqs, callback) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const results = searchFAQs(searchTerm, faqs);
    callback(results, searchTerm);
  }, 300);
}
```

**Filter Implementation:**
```javascript
/**
 * Filter FAQs by type
 * @param {Array} faqs - Array of FAQ objects
 * @param {string} filterType - 'all', 'tldr', or 'needs'
 * @returns {Array} - Filtered FAQ array
 */
function filterFAQs(faqs, filterType) {
  switch(filterType) {
    case 'tldr':
      // Show only FAQs that have TLDR data
      return faqs.filter(faq => faq.tldr);

    case 'needs':
      // Show only FAQs flagged as needing TLDR (all 67 flagged FAQs)
      return faqs.filter(faq => faq.needs_tldr);

    case 'all':
    default:
      return faqs;
  }
}
```

**Combined Search + Filter:**
```javascript
/**
 * Apply both search and filter, returning the final displayed list.
 * @param {Array} faqs - Full FAQ array
 * @param {string} searchTerm - Search query
 * @param {string} filterType - 'all', 'tldr', or 'needs'
 * @returns {Array} - Filtered + searched FAQ array
 */
function applySearchAndFilter(faqs, searchTerm, filterType) {
  let results = faqs;

  // Apply filter first
  results = filterFAQs(results, filterType);

  // Then apply search
  if (searchTerm && searchTerm.trim() !== '') {
    results = searchFAQs(searchTerm, results);
  }

  return results;
}
```

---

### Feature 7: Stats Dashboard

**Objective:** Show real-time statistics about FAQ data.

**Stats Calculation:**
```javascript
/**
 * Calculate FAQ statistics based on all FAQs.
 * @param {Array} allFaqs - Complete FAQ array
 * @returns {Object} - Stats object
 */
function calculateStats(allFaqs) {
  const totalFaqs = allFaqs.length;
  const needsTldr = allFaqs.filter(f => f.needs_tldr).length;
  const hasTldr = allFaqs.filter(f => f.tldr).length;

  return {
    total: totalFaqs,
    needsTldr: needsTldr,
    hasTldr: hasTldr,
    needsPercent: Math.round((needsTldr / totalFaqs) * 100),
    hasPercent: Math.round((hasTldr / totalFaqs) * 100)
  };
}
```

**Stats Display HTML:**
```html
<div class="stats">
  <div class="stat-card total">
    <div class="stat-number" id="totalFaqs">126</div>
    <div class="stat-label">Total FAQs</div>
  </div>

  <div class="stat-card needs">
    <div class="stat-number" id="needsTldr">67</div>
    <div class="stat-label">Need TLDR</div>
    <div class="stat-sublabel" id="needsPercent">53%</div>
  </div>

  <div class="stat-card done">
    <div class="stat-number" id="hasTldr">10</div>
    <div class="stat-label">With TLDR</div>
    <div class="stat-sublabel" id="hasPercent">8%</div>
  </div>
</div>
```

**Update Stats Function:**
```javascript
function updateStats(stats) {
  document.getElementById('totalFaqs').textContent = stats.total;
  document.getElementById('needsTldr').textContent = stats.needsTldr;
  document.getElementById('hasTldr').textContent = stats.hasTldr;
  document.getElementById('needsPercent').textContent = stats.needsPercent + '%';
  document.getElementById('hasPercent').textContent = stats.hasPercent + '%';
}
```

---

### Feature 8: FAQ Expand/Collapse

**Objective:** Smooth accordion-style expansion of FAQ cards with accessibility support.

**Toggle Function:**
```javascript
/**
 * Toggle FAQ card expansion with keyboard support
 * @param {string} faqId - FAQ ID to toggle
 */
function toggleFAQ(faqId) {
  const escapedId = CSS.escape(faqId);
  const faqItem = document.querySelector(`[data-id="${escapedId}"]`);

  if (!faqItem) return;

  const isExpanded = faqItem.classList.contains('expanded');
  const header = faqItem.querySelector('.faq-header');
  const content = faqItem.querySelector('.faq-content');

  if (isExpanded) {
    faqItem.classList.remove('expanded');
    if (header) header.setAttribute('aria-expanded', 'false');
  } else {
    // Optional: Close other FAQs (accordion behavior)
    // Uncomment for single-open mode:
    // document.querySelectorAll('.faq-item.expanded').forEach(item => {
    //   item.classList.remove('expanded');
    //   const h = item.querySelector('.faq-header');
    //   if (h) h.setAttribute('aria-expanded', 'false');
    // });

    faqItem.classList.add('expanded');
    if (header) header.setAttribute('aria-expanded', 'true');
  }
}

/**
 * Handle keyboard events on FAQ headers
 */
function handleFAQKeydown(event, faqId) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggleFAQ(faqId);
  }
}
```

**CSS for Animation:**
```css
.faq-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.faq-item.expanded .faq-content {
  max-height: 5000px; /* Large enough for any FAQ */
}
```

---

### Feature 9: Complete FAQ Rendering

**Objective:** Render all FAQs with proper structure, badges, and event handlers.

**Main Render Function:**
```javascript
/**
 * Render all FAQs to the page
 * @param {Array} faqs - Array of FAQ objects to display
 * @param {Array} allFaqs - Complete FAQ array (for stats)
 */
function renderFAQs(faqs, allFaqs) {
  const container = document.getElementById('faqContainer');

  if (!faqs || faqs.length === 0) {
    container.innerHTML = `
      <div class="no-results" role="status">
        <p>🔍 No FAQs match your current search or filter.</p>
      </div>
    `;
    return;
  }

  const html = faqs.map(faq => {
    // Determine badge
    let badge = '';
    let badgeLabel = '';
    if (faq.tldr) {
      if (faq.tldr.autoGenerated) {
        badge = '<span class="tldr-badge auto-tldr" aria-label="Auto-generated TLDR summary">AUTO TLDR</span>';
        badgeLabel = 'AUTO TLDR';
      } else {
        badge = '<span class="tldr-badge has-tldr" aria-label="Has handcrafted TLDR summary">HAS TLDR</span>';
        badgeLabel = 'HAS TLDR';
      }
    } else if (faq.needs_tldr) {
      badge = '<span class="tldr-badge needs-tldr" aria-label="Needs TLDR summary">NEEDS TLDR</span>';
      badgeLabel = 'NEEDS TLDR';
    }

    const contentId = 'faq-content-' + faq.id.replace(/\./g, '-');

    return `
      <div class="faq-item" data-id="${faq.id}">
        <div class="faq-header" onclick="toggleFAQ('${faq.id}')"
             onkeydown="handleFAQKeydown(event, '${faq.id}')"
             role="button" tabindex="0"
             aria-expanded="false"
             aria-controls="${contentId}">
          <div class="faq-header-left">
            <div class="faq-id">ID: ${faq.id}</div>
            <div class="faq-section">📂 ${escapeHTML(faq.section)}</div>
            <div class="faq-title">
              ${escapeHTML(faq.question)}
              ${badge}
            </div>
          </div>
          <div class="expand-icon" aria-hidden="true">▼</div>
        </div>

        <div class="faq-content" id="${contentId}" role="region" aria-label="Answer for: ${escapeHTML(faq.question)}">
          ${renderTLDR(faq.tldr)}

          <div class="original-answer">
            <div class="answer-header">📄 Full Answer (Original)</div>
            <div class="answer-text">${escapeHTML(faq.answer)}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}
```

---

### Feature 10: Main Application Logic

**Objective:** Tie everything together in a cohesive application.

**Complete App Structure:**
```javascript
// Global state
let allFAQs = [];
let currentFilter = 'all';
let currentSearch = '';

/**
 * Initialize the application
 */
async function initApp() {
  try {
    // Show loading state
    document.getElementById('faqContainer').innerHTML =
      '<div class="loading"><div class="spinner"></div><br>Loading FAQs...</div>';

    // Load FAQ data (prefer fetch for smaller HTML size)
    const response = await fetch('faq.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const rawFaqs = await response.json();

    // Process FAQs (detection, templates, auto-generation)
    allFAQs = processFAQs(rawFaqs);

    // Verify detection
    const detected = allFAQs.filter(f => f.needs_tldr).length;
    const withTLDR = allFAQs.filter(f => f.tldr).length;
    console.log(`TLDR Detection: ${detected}/${allFAQs.length} flagged`);
    console.log(`TLDR Templates: ${withTLDR}/${allFAQs.length} have TLDR`);

    // Initial render
    renderApp();

    // Set up event listeners
    setupEventListeners();

  } catch (error) {
    console.error('Failed to load FAQs:', error);
    document.getElementById('faqContainer').innerHTML = `
      <div class="empty-state" role="alert">
        <p>❌ Failed to load FAQs: ${escapeHTML(error.message)}</p>
        <p>Make sure faq.json is in the same folder.</p>
      </div>
    `;
  }
}

/**
 * Process raw FAQ data (detection + templates + auto-generation)
 */
function processFAQs(rawFaqs) {
  return rawFaqs.map(faq => {
    const needs_tldr = needsTLDR(faq);
    const answer_length = faq.answer.length;
    let tldr = TLDR_MAP[faq.id] || null;

    // Auto-generate fallback for flagged FAQs without handcrafted templates
    if (!tldr && needs_tldr) {
      tldr = autoGenerateTLDR(faq);
    }

    return {
      ...faq,
      needs_tldr,
      answer_length,
      tldr
    };
  });
}

/**
 * Render the complete application (stats + FAQ list)
 */
function renderApp() {
  // Apply current filter and search
  const displayedFaqs = applySearchAndFilter(allFAQs, currentSearch, currentFilter);

  // Calculate and update stats
  const stats = calculateStats(allFAQs);
  updateStats(stats);

  // Render FAQs
  renderFAQs(displayedFaqs, allFAQs);

  // Update result meta
  const meta = document.getElementById('resultMeta');
  if (meta) {
    if (displayedFaqs.length === allFAQs.length) {
      meta.innerHTML = `<span>Showing <span class="highlight">all ${allFAQs.length}</span> FAQs</span>`;
    } else {
      meta.innerHTML = `<span>Showing <span class="highlight">${displayedFaqs.length}</span> of ${allFAQs.length} FAQs</span>`;
    }
  }
}

/**
 * Set up event listeners (search + filter buttons)
 */
function setupEventListeners() {
  // Search box
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.addEventListener('input', (e) => {
      currentSearch = e.target.value;
      // Safe debounce: passes term into callback, no race condition
      debouncedSearch(currentSearch, allFAQs, (results, term) => {
        // Re-apply search with the captured term against the filtered list
        const filtered = filterFAQs(allFAQs, currentFilter);
        const searched = searchFAQs(term, filtered);
        const stats = calculateStats(allFAQs);
        updateStats(stats);
        renderFAQs(searched, allFAQs);
        const meta = document.getElementById('resultMeta');
        if (meta) {
          if (searched.length === allFAQs.length) {
            meta.innerHTML = `<span>Showing <span class="highlight">all ${allFAQs.length}</span> FAQs</span>`;
          } else {
            meta.innerHTML = `<span>Showing <span class="highlight">${searched.length}</span> of ${allFAQs.length} FAQs</span>`;
          }
        }
      });
    });
  }

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update active state
      document.querySelectorAll('.filter-btn').forEach(b =>
        b.classList.remove('active')
      );
      e.currentTarget.classList.add('active');

      // Update filter and re-render
      currentFilter = e.currentTarget.dataset.filter;
      renderApp();
    });
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initApp);
```

---

## Complete File Structure

**Output Files:**
```
/tldr-feature/
├── index.html              # Main HTML file (standalone, all CSS+JS embedded)
├── faq.json                # FAQ data (126 FAQs) — fetched at runtime
└── README.md               # Documentation
```

**Important:** Generate a **SINGLE** standalone `index.html` file with all CSS embedded in a `<style>` block and all JavaScript embedded in a `<script>` block. Fetch `faq.json` at runtime rather than embedding 82KB of JSON data.

---

## HTML Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FAQ TLDR — Vicharanashala Internship Hub</title>

  <style>
    /* Embed ALL CSS here */
    /* Use complete styles from Feature 4 above */
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>⚡ FAQ TLDR</h1>
      <p>Quick summaries for long FAQ answers</p>
    </div>

    <!-- Stats Dashboard -->
    <div class="stats">
      <!-- Feature 7 HTML -->
    </div>

    <!-- Result meta (showing count) -->
    <div class="result-meta" id="resultMeta"></div>

    <!-- Search + Filter -->
    <div class="filter-section">
      <input type="text" class="search-box" id="searchBox"
             placeholder="🔍 Search questions, answers, sections, or ID..."
             autocomplete="off">

      <div class="filter-buttons">
        <button class="filter-btn active" data-filter="all" type="button">All FAQs</button>
        <button class="filter-btn" data-filter="tldr" type="button">⚡ With TLDR</button>
        <button class="filter-btn" data-filter="needs" type="button">📝 Needs TLDR</button>
      </div>
    </div>

    <!-- FAQ Container -->
    <div id="faqContainer">
      <div class="loading"><div class="spinner"></div><br>Loading 126 FAQs...</div>
    </div>
  </div>

  <script>
    /* Embed ALL JavaScript here */
    /* Use all functions from Features 1-10 above */

    // 1. needsTLDR()
    // 2. autoGenerateTLDR()
    // 3. TLDR_MAP with 10 templates
    // 4. escapeHTML()
    // 5. renderTLDR()
    // 6. searchFAQs()
    // 7. debouncedSearch()
    // 8. filterFAQs()
    // 9. applySearchAndFilter()
    // 10. calculateStats()
    // 11. updateStats()
    // 12. toggleFAQ()
    // 13. handleFAQKeydown()
    // 14. renderFAQs()
    // 15. processFAQs()
    // 16. renderApp()
    // 17. setupEventListeners()
    // 18. initApp()

    // Do NOT embed faq.json — fetch it at runtime
  </script>
</body>
</html>
```

---

## OpenClaw Build Instructions

### Step 1: Data Processing
1. Load `faq.json` (126 FAQs)
2. Run `needsTLDR()` on each FAQ
3. Flag 67 FAQs with `needs_tldr: true`
4. Add TLDR data from `TLDR_MAP` to 10 priority FAQs
5. Run `autoGenerateTLDR()` as fallback for remaining flagged FAQs

### Step 2: Generate HTML Structure
1. Create header with title
2. Create stats dashboard (3 stat cards)
3. Create search box + filter buttons
4. Create FAQ container

### Step 3: Implement JavaScript Logic
1. FAQ processing function (with auto-generation)
2. TLDR rendering function (handle all 20+ TLDR field types)
3. Search function (debounced, 300ms, race-condition-safe)
4. Filter function (all/tldr/needs)
5. Stats calculation and update
6. FAQ expand/collapse toggle (with keyboard + ARIA support)
7. Main app initialization with error handling

### Step 4: Apply Styles
1. Color palette (CSS variables)
2. Page layout and header
3. Stats dashboard
4. Search bar and filter buttons
5. TLDR section styling (gold background, left border)
6. Warning/note boxes (red/blue with icons via ::before)
7. FAQ card styles (shadow, hover lift, border)
8. Expand animation (max-height with cubic-bezier)
9. Badges (handcrafted TLDR, auto TLDR, needs TLDR)
10. Empty state and loading spinner
11. Focus indicators for keyboard navigation
12. Responsive design (mobile down to 375px)

### Step 5: Testing
1. Verify 67 FAQs flagged with `needs_tldr`
2. Check 10 FAQs have handcrafted TLDR data
3. Check remaining flagged FAQs have auto-generated TLDR
4. Test search with "NOC", "ViBe", "offer letter"
5. Test filters (all/tldr/needs) and verify counts
6. Test expand/collapse animation — smooth 0.5s
7. Test keyboard navigation (Tab + Enter/Space)
8. Test on mobile (375px width)
9. Verify stats update correctly
10. Verify no console errors

---

## Success Criteria Checklist

Build is successful when ALL of these are true:

- [ ] **67 FAQs flagged** with `needs_tldr: true`
- [ ] **10 FAQs have handcrafted TLDR** data matching the templates
- [ ] **Auto-generated TLDR** for remaining 57 flagged FAQs (optional but recommended)
- [ ] **TLDR renders** with gold background (`#fffbeb`) and 4px left border (`#fbbf24`)
- [ ] **Steps show green checkmarks** using `::before` with `✓` Unicode character
- [ ] **Warnings show red boxes** with `⚠️` icon via `::before`
- [ ] **Notes show blue boxes** with `💡` icon via `::before`
- [ ] **Original answer always visible** below TLDR section
- [ ] **Search works** — case-insensitive, across question, answer, section, and ID
- [ ] **Filters work** — All (126), TLDR (10+), Needs (67)
- [ ] **Stats accurate** — Total, Needs, Has counts match expected values
- [ ] **Expand animation smooth** — 0.5s cubic-bezier transition
- [ ] **Keyboard accessible** — Tab to focus, Enter/Space to toggle, `aria-expanded` updates
- [ ] **Mobile responsive** — works on 375px width
- [ ] **No console errors** — clean JavaScript execution
- [ ] **Load time < 1 second** — fast initial render
- [ ] **Single file** — standalone HTML with embedded CSS/JS

---

## Edge Cases to Handle

1. **FAQ with no TLDR** — Show only original answer (no TLDR section rendered)
2. **Empty search** — Show all FAQs (respect current filter)
3. **No search results** — Show "No FAQs match your search" message with `role="status"`
4. **Very long answer (>2000 chars)** — Original answer scrollable, TLDR provides summary
5. **Special characters in FAQ data** — Always use `escapeHTML()` to prevent XSS
6. **FAQ IDs with dots (e.g., "4.7")** — Use `CSS.escape()` in `querySelector`
7. **Mobile keyboard opening** — Search box doesn't cause layout jump (fixed in viewport)
8. **Multiple spaces in search** — Trim search input with `.trim()`
9. **Case sensitivity** — Search is case-insensitive (`.toLowerCase()`)
10. **Network failure loading faq.json** — Show error message with `role="alert"`
11. **Auto-generated TLDR fails** — FAQ still displays full answer without TLDR section

---

## Performance Optimization

1. **Debounced search** — 300ms delay after typing stops (avoids re-render on every keystroke)
2. **No virtual scrolling needed** — 126 FAQs is small enough for direct DOM rendering
3. **CSS transitions** — Use `transform` and `max-height` for GPU-accelerated animations
4. **Minimal DOM manipulation** — Re-render only when search or filter changes
5. **No external dependencies** — Pure vanilla JavaScript (zero kB, faster load)
6. **Fetch at runtime** — Don't embed 82KB JSON in HTML (faster initial parse)

---

## Browser Compatibility

**Must work on:**
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅
- Mobile Chrome/Safari (iOS 14+, Android 10+) ✅

**No support needed:**
- Internet Explorer ❌
- Opera Mini ❌

---

## Accessibility (WCAG 2.1 AA)

1. **Keyboard navigation** — Tab through FAQ cards, Enter/Space to expand
2. **ARIA attributes**:
   - `role="button"` on FAQ headers
   - `aria-expanded="true"` / `"false"` on toggle
   - `aria-controls` pointing to content region ID
   - `role="region"` on content area with `aria-label`
   - `role="status"` on empty state / no results
   - `role="alert"` on error state
   - `aria-hidden="true"` on decorative icons (expand icon, emoji used decoratively)
   - `aria-label` on badges for screen reader context
3. **Color contrast** — All text meets 4.5:1 ratio against background
4. **Focus indicators** — Visible `:focus-visible` outline on interactive elements
5. **Semantic HTML** — Proper heading hierarchy, list elements for steps

```html
<!-- Accessible FAQ card example -->
<div class="faq-item" data-id="4.7">
  <div class="faq-header" onclick="toggleFAQ('4.7')"
       onkeydown="handleFAQKeydown(event, '4.7')"
       role="button" tabindex="0"
       aria-expanded="false"
       aria-controls="faq-content-4-7">
    ...
    <div class="expand-icon" aria-hidden="true">▼</div>
  </div>
  <div class="faq-content" id="faq-content-4-7"
       role="region" aria-label="Answer for: How do I accept the offer letter?">
    ...
  </div>
</div>
```

---

## Final Notes for OpenClaw

**Priorities:**
1. Get the 10 TLDR templates rendering correctly first
2. Then implement search, filter, and auto-generation
3. Finally polish mobile responsiveness and accessibility

**Common Pitfalls:**
- Don't make TLDR too long (defeats the purpose — keep under 150 words)
- Always show original answer (students need source verification)
- Use exact color codes provided (`#fffbeb`, `#fbbf24`, etc.) for visual consistency
- Test on mobile (many students use phones as primary device)
- Remember `CSS.escape()` for FAQ IDs containing dots
- Always call `escapeHTML()` when injecting user/FAQ content into HTML

**Quality Indicators:**
- TLDR is visually distinct (gold background stands out against white card)
- Steps are scannable (green checkmarks guide the eye vertically)
- Warnings are prominent (red boxes with ⚠️ icon grab attention)
- Transitions are smooth (0.5s cubic-bezier for polished feel)
- Search feels instant (debounced, < 100ms response)
- Stats update in real-time as filters change

---

## Expected Build Time

**OpenClaw with Frontier Model:**
- Data processing: 5-10 minutes
- HTML structure: 10-15 minutes
- JavaScript logic: 25-35 minutes
- CSS styling: 20-25 minutes
- Testing & debugging: 15-20 minutes

**Total: 75-105 minutes for complete build**

---

END OF SPECIFICATION

**This specification is complete and ready for OpenClaw autonomous building.**
