import { supabase } from '../lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function fetchProfile() {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/auth/profile`, { headers });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function fetchFAQs(category?: string) {
  const url = new URL(`${API_BASE_URL}/faqs`);
  if (category) url.searchParams.append('category', category);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch FAQs');
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE_URL}/faqs/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function searchFAQs(q: string, category?: string) {
  const url = new URL(`${API_BASE_URL}/faqs/search`);
  url.searchParams.append('q', q);
  if (category) url.searchParams.append('category', category);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to search FAQs');
  return res.json();
}

export async function askAI(question: string, categorySlug?: string, forceGeneration = false) {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/ai/ask`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ question, category_slug: categorySlug, force_generation: forceGeneration }),
  });
  if (!res.ok) throw new Error('Failed to get response from AI');
  return res.json();
}

export async function fetchThreads(category?: string, sort = 'recent', q?: string) {
  const url = new URL(`${API_BASE_URL}/threads`);
  url.searchParams.append('sort', sort);
  if (category) url.searchParams.append('category', category);
  if (q) url.searchParams.append('q', q);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch threads');
  return res.json();
}

export async function fetchThread(id: string) {
  const res = await fetch(`${API_BASE_URL}/threads/${id}`);
  if (!res.ok) throw new Error('Failed to fetch thread');
  return res.json();
}

export async function createThread(title: string, content: string, categoryId: string, tags: string[] = []) {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/threads`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title, content, category_id: categoryId, tags }),
  });
  if (!res.ok) throw new Error('Failed to create thread');
  return res.json();
}

export async function replyToThread(threadId: string, content: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/threads/${threadId}/replies`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('Failed to submit reply');
  return res.json();
}

export async function voteItem(itemId: string, itemType: 'thread' | 'reply', voteValue: 1 | -1) {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/threads/vote`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ item_id: itemId, item_type: itemType, vote_value: voteValue }),
  });
  if (!res.ok) throw new Error('Failed to vote');
  return res.json();
}

export async function acceptReply(threadId: string, replyId: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/threads/${threadId}/accept-reply?reply_id=${replyId}`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Failed to accept reply');
  return res.json();
}

export async function fetchEscalations(status = 'pending') {
  const headers = await getHeaders();
  const url = new URL(`${API_BASE_URL}/escalations`);
  url.searchParams.append('status', status);
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error('Failed to fetch escalations');
  return res.json();
}

export async function createEscalation(threadId: string, reason: string) {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/escalations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ thread_id: threadId, reason }),
  });
  if (!res.ok) throw new Error('Failed to submit escalation');
  return res.json();
}

export async function resolveEscalation(
  id: string,
  resolutionStatus: 'reviewing' | 'resolved',
  convertToFaq = false,
  faqCategorySlug = 'general'
) {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/escalations/${id}/resolve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      resolution_status: resolutionStatus,
      convert_to_faq: convertToFaq,
      faq_category_slug: faqCategorySlug,
    }),
  });
  if (!res.ok) throw new Error('Failed to resolve escalation');
  return res.json();
}

export async function fetchAnalytics() {
  const headers = await getHeaders();
  const res = await fetch(`${API_BASE_URL}/analytics`, { headers });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}
