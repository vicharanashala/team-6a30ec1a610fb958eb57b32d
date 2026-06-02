'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { askAI, createThread, fetchCategories } from '../services/api';
import { 
  Sparkles, 
  Send, 
  RotateCcw, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export default function AskDoubtsPage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Card states
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);

  const handleAsk = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await askAI(question, selectedCategory || undefined, force);
      setResponse(data);
      setIsFlipped(true);
    } catch (err: any) {
      console.error(err);
      setError('Could not reach the AI support engine. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIsFlipped(false);
    // Delay clearing text until flip transition completes for visual comfort
    setTimeout(() => {
      setQuestion('');
      setResponse(null);
      setError(null);
    }, 300);
  };

  const handlePostToCommunity = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const categorySlug = selectedCategory || 'general';
      const cat = categories.find(c => c.slug === categorySlug) || categories[0];
      const categoryId = cat ? cat.id : '';
      
      const thread = await createThread(
        question.length > 55 ? `${question.slice(0, 55)}...` : question,
        question,
        categoryId,
        [categorySlug]
      );
      
      router.push(`/community/${thread.id}`);
    } catch (e) {
      console.error(e);
      setError('Failed to create community discussion thread.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] max-w-4xl mx-auto px-4 py-8 select-none font-sans">
      
      {/* Page Title & Slogan */}
      <div className="text-center space-y-2 mb-8 animate-in fade-in duration-300">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Got a Doubt? Ask VINS AI.
        </h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Get verified, direct information about your NOC, badges, certificates, dates, or coursework instantly.
        </p>
      </div>

      {/* 3D Flip Card Container */}
      <div className="w-full max-w-xl h-[400px] perspective-1000">
        <div className={`relative w-full h-full duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* FRONT OF THE CARD (Question Input) */}
          <div className="absolute inset-0 w-full h-full backface-hidden bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-100/50 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center space-x-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Verified Knowledge Engine</span>
                </span>
                
                {/* Category select inside front of card */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="">ALL TOPICS</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-450 pl-0.5">
                  Your Question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask anything, e.g. 'Can my HOD sign the NOC by email?' or 'When does my internship end?'..."
                  className="w-full h-44 bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-650/20 focus:border-indigo-650 transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-150/40">
              <span className="text-[10px] text-slate-400 font-medium">Powered by Gemini + pgvector</span>
              <button
                onClick={(e) => handleAsk(e)}
                disabled={loading || !question.trim()}
                className="bg-slate-900 hover:bg-slate-850 disabled:opacity-50 text-white font-semibold text-xs px-5 py-3 rounded-xl flex items-center space-x-1.5 shadow-md shadow-slate-900/10 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="h-3 w-3 border border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Ask AI</span>
                    <Send className="h-3 w-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* BACK OF THE CARD (Answer Presentation) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-100/50 p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
            
            {/* Scrollable Response body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {response && (
                <>
                  {/* Metadata Header */}
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                    <span className="flex items-center space-x-1.5 text-indigo-650">
                      <Sparkles className="h-3 w-3" />
                      <span>RAG AI Answer</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded ${
                      response.confidence === 'high' 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {response.confidence === 'high' ? 'High Confidence (90%+)' : 'Review suggested links'}
                    </span>
                  </div>

                  {/* Duplicate Alert */}
                  {response.possible_duplicate && (
                    <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl flex items-start space-x-2.5">
                      <AlertTriangle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h5 className="text-[11px] font-bold text-amber-700">Duplicate discussion thread exists:</h5>
                        <a 
                          href={`/community/${response.possible_duplicate.id}`}
                          className="text-[10px] text-indigo-650 hover:underline font-semibold flex items-center space-x-1"
                        >
                          <span>&ldquo;{response.possible_duplicate.title}&rdquo;</span>
                          <ChevronRight className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* High Confidence direct answer */}
                  {response.confidence === 'high' && response.ai_answer ? (
                    <div className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium pr-1">
                      {response.ai_answer}
                    </div>
                  ) : (
                    /* Low/Medium Confidence matching links */
                    <div className="space-y-3">
                      <div className="flex items-center space-x-1.5 text-slate-500">
                        <BookOpen className="h-4 w-4" />
                        <h4 className="text-xs font-bold">Recommended FAQ links:</h4>
                      </div>
                      
                      <div className="space-y-2">
                        {response.faq_matches.slice(0, 2).map((match: any, idx: number) => (
                          <div key={match.id} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-1.5">
                            <h5 className="text-xs font-bold text-slate-800 leading-snug">{match.question}</h5>
                            <p className="text-[11px] text-slate-500 leading-relaxed">{match.answer}</p>
                          </div>
                        ))}
                      </div>

                      {response.confidence === 'medium' && (
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-medium">Still want AI assistance?</span>
                          <button
                            onClick={(e) => handleAsk(e, true)}
                            disabled={loading}
                            className="text-[10px] font-bold text-indigo-650 hover:underline uppercase tracking-wide cursor-pointer"
                          >
                            Generate Answer Anyway
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Actions of Flipped Card */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-150/40">
              
              {/* If confidence is low, offer to ask community */}
              {response?.confidence === 'low' ? (
                <button
                  onClick={handlePostToCommunity}
                  disabled={loading}
                  className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-650 hover:text-indigo-850 cursor-pointer"
                >
                  <span>Post to peer forum</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">Is this resolved?</span>
              )}

              <button
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-150 text-slate-650 border border-slate-200/40 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Ask another doubt</span>
              </button>
            </div>
          </div>

        </div>
      </div>
      
      {/* Small UI helper links */}
      <div className="flex items-center space-x-4 mt-6 text-xs text-slate-450 font-medium animate-in fade-in duration-300">
        <a href="/faq" className="hover:underline hover:text-slate-800">Browse Full FAQ Catalog</a>
        <span>•</span>
        <a href="/community" className="hover:underline hover:text-slate-800">Go to Peer Forum</a>
      </div>
    </div>
  );
}
