'use client';

import React, { useState, useEffect } from 'react';
import { fetchEscalations, resolveEscalation, fetchAnalytics, fetchCategories } from '../../services/api';
import { 
  ShieldAlert, 
  Sparkles, 
  Search, 
  RefreshCw,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Resolution/FAQ promotion state
  const [selectedEscalation, setSelectedEscalation] = useState<any>(null);
  const [promoteToFaq, setPromoteToFaq] = useState(false);
  const [faqCategory, setFaqCategory] = useState('general');
  const [resolutionSuccess, setResolutionSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [escData, analData, catData] = await Promise.all([
        fetchEscalations('pending'),
        fetchAnalytics(),
        fetchCategories()
      ]);
      setEscalations(escData);
      setAnalytics(analData);
      setCategories(catData);
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscalation) return;

    setLoading(true);
    try {
      await resolveEscalation(
        selectedEscalation.id, 
        'resolved', 
        promoteToFaq, 
        faqCategory
      );
      
      setResolutionSuccess(true);
      setTimeout(() => {
        setResolutionSuccess(false);
        setSelectedEscalation(null);
        setPromoteToFaq(false);
        setFaqCategory('general');
        loadData();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
            <ShieldAlert className="h-5.5 w-5.5 text-indigo-650" />
            <span>Admin Control Panel</span>
          </h2>
          <p className="text-xs text-slate-500">
            Monitor search query logs, resolve student escalations, and expand the FAQ knowledge vault.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center space-x-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Analytics summary cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Searches</span>
            <p className="text-2xl font-extrabold text-slate-800">{analytics.total_searches}</p>
            <span className="text-[10px] text-slate-500 font-medium block">Avg Match score: {analytics.avg_search_similarity}</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450">Deflected Queries</span>
            <p className="text-2xl font-extrabold text-emerald-600">{analytics.deflected_queries}</p>
            <span className="text-[10px] text-slate-500 font-medium block">Auto-resolved by AI bot</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450">Peer Discussions</span>
            <p className="text-2xl font-extrabold text-indigo-650">{analytics.total_threads}</p>
            <span className="text-[10px] text-slate-500 font-medium block">Resolved: {analytics.resolved_threads} | Open: {analytics.unresolved_threads}</span>
          </div>

          <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-sm space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-rose-500">Pending Escalations</span>
            <p className="text-2xl font-extrabold text-rose-600">{analytics.pending_escalations}</p>
            <span className="text-[10px] text-slate-500 font-medium block">Awaiting human review</span>
          </div>
        </div>
      )}

      {/* Escalations and Top Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Escalations queue */}
        <div className="lg:col-span-2 space-y-3.5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-450 pl-0.5 block">
            Escalation Tickets Queue ({escalations.length})
          </span>

          {escalations.length > 0 ? (
            <div className="space-y-3">
              {escalations.map((esc) => (
                <div
                  key={esc.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center space-x-2 text-[9px] text-slate-400 font-bold uppercase">
                        <span className="text-slate-500">{esc.thread_author_email}</span>
                        <span>•</span>
                        <span>Weight: {esc.priority_score}</span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-snug">{esc.thread_title}</h4>
                      <div className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100/50 px-2 py-0.5 rounded-lg">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Reason: {esc.reason}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedEscalation(esc)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-450 text-xs">
              All student escalations have been resolved. Excellent work!
            </div>
          )}
        </div>

        {/* Top searched terms list */}
        <div className="space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-450 pl-0.5 block">
            Top Search Query Logs
          </span>
          {analytics && analytics.top_queries ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="space-y-3.5">
                {analytics.top_queries.map((q: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="truncate">{q.query.toUpperCase()}</span>
                      <span className="text-[10px] text-slate-450">{q.count} hits</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/30">
                      <div 
                        className="bg-indigo-650 h-full rounded-full" 
                        style={{ width: `${Math.min(100, (q.count / (analytics.top_queries[0]?.count || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-450 text-xs">
              No search logs registered yet.
            </div>
          )}
        </div>

      </div>

      {/* Resolution Drawer Overlay */}
      {selectedEscalation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form 
            onSubmit={handleResolveEscalation} 
            className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 font-sans"
          >
            <div className="flex items-center space-x-2 text-indigo-650 border-b border-slate-100 pb-3">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="font-extrabold text-sm text-slate-900">Resolve Escalation Ticket</h3>
            </div>

            {resolutionSuccess ? (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl text-center text-xs font-bold">
                Ticket resolved successfully. Updating records...
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Thread Subject</span>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug">{selectedEscalation.thread_title}</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      id="promote"
                      checked={promoteToFaq}
                      onChange={(e) => setPromoteToFaq(e.target.checked)}
                      className="h-4 w-4 accent-indigo-650 cursor-pointer"
                    />
                    <label htmlFor="promote" className="text-xs font-bold text-slate-650 cursor-pointer select-none">
                      Promote resolved answer to official FAQ
                    </label>
                  </div>

                  {promoteToFaq && (
                    <div className="space-y-3.5 p-3 bg-slate-50/50 rounded-xl border border-slate-200/80 animate-in slide-in-from-top-2 duration-150">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-450 mb-1">
                          Select Target Category
                        </label>
                        <select
                          value={faqCategory}
                          onChange={(e) => setFaqCategory(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-600 p-2.5 rounded-lg text-xs focus:outline-none focus:border-indigo-650 font-bold"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[10px] text-slate-450 font-medium leading-relaxed">
                        This creates a new permanent FAQ record. The system will automatically compute and register its vector embedding.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2.5 pt-3.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedEscalation(null)}
                    className="bg-white hover:bg-slate-50 text-slate-500 text-xs font-semibold py-2 px-4 rounded-xl border border-slate-250 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-850 text-white text-xs font-semibold py-2 px-4.5 rounded-xl transition-colors cursor-pointer"
                  >
                    Resolve ticket
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
