'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchThread, replyToThread, acceptReply, createEscalation, fetchProfile } from '../../../services/api';
import { supabase } from '../../../lib/supabase';
import { 
  Send, 
  User, 
  ChevronLeft,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Bot,
  UserCheck,
  Check,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function ThreadDetailPage({ params }: { params: { id: string } }) {
  const threadId = params.id;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState<any>(null);
  const [newReply, setNewReply] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Escalation flow state
  const [escalating, setEscalating] = useState(false);
  const [escalateSuccess, setEscalateSuccess] = useState(false);

  const loadData = async () => {
    try {
      const data = await fetchThread(threadId);
      setThread(data);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profile = await fetchProfile();
        setCurrentUser(profile);
      } else {
        setCurrentUser({
          id: null,
          email: 'student@samagama.ai',
          role: 'Student'
        });
      }
    } catch (e) {
      console.error('Failed to load thread details:', e);
    }
  };

  useEffect(() => {
    loadData();
    
    // Auto-refresh chat logs every 4 seconds in background to simulate live responses
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [threadId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.replies]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    setLoading(true);
    try {
      await replyToThread(threadId, newReply.trim());
      setNewReply('');
      await loadData();
    } catch (err) {
      console.error('Failed to submit reply:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    setEscalating(true);
    try {
      await createEscalation(threadId, "Student requested human assistance from chat timelines.");
      setEscalateSuccess(true);
      setTimeout(async () => {
        setEscalateSuccess(false);
        await loadData();
      }, 1000);
    } catch (err) {
      console.error('Failed to escalate ticket:', err);
    } finally {
      setEscalating(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!thread.replies || thread.replies.length === 0) return;
    
    // Find the latest reply to mark as the accepted resolution reply
    const lastReply = thread.replies[thread.replies.length - 1];
    try {
      await acceptReply(threadId, lastReply.id);
      await loadData();
    } catch (err) {
      console.error('Failed to resolve thread:', err);
    }
  };

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-2">
        <div className="h-6 w-6 border-2 border-indigo-500/10 border-t-indigo-650 rounded-full animate-spin" />
        <p className="text-slate-450 text-[11px] font-medium">Loading Chat logs...</p>
      </div>
    );
  }

  const isThreadOwner = currentUser?.id === thread.user_id;
  const isPrivilegedUser = currentUser?.role === 'Mentor' || currentUser?.role === 'Admin';
  const canResolve = isThreadOwner || isPrivilegedUser;
  const studentEmail = thread.user_email ? thread.user_email.split('@')[0] : 'Student';

  return (
    <div className="space-y-4 animate-in fade-in duration-300 font-sans max-w-2xl mx-auto pb-12 flex flex-col h-[calc(100vh-8rem)]">
      
      {/* Back Breadcrumb & Header Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 bg-slate-50/20">
        <Link 
          href="/community" 
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors select-none"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>All Chats</span>
        </Link>

        {/* Ticket Resolve button */}
        {thread.status !== 'resolved' && canResolve && (
          <button
            onClick={handleMarkResolved}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center space-x-1"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Mark Resolved</span>
          </button>
        )}
      </div>

      {/* Main Support Chat Timeline Box */}
      <div className="flex-1 border border-slate-250/70 rounded-3xl bg-white shadow-xs overflow-hidden flex flex-col">
        
        {/* Chat Header Status */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="space-y-0.5 truncate pr-4">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
              {thread.title}
            </h3>
            <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Category: {thread.category_name || 'General'}</span>
              <span>•</span>
              <span>Asked by {studentEmail}</span>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="flex-shrink-0">
            {thread.status === 'resolved' ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-bold">
                <Check className="h-2.5 w-2.5" />
                <span>RESOLVED</span>
              </span>
            ) : thread.status === 'escalated' ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-bold">
                <Clock className="h-2.5 w-2.5 animate-spin" />
                <span>MENTOR QUEUED</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 text-[9px] font-bold">
                <Bot className="h-2.5 w-2.5" />
                <span>AI ASSISTING</span>
              </span>
            )}
          </div>
        </div>

        {/* Message Log Timeline */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/15">
          
          {/* Bot initialized line */}
          <div className="flex items-center justify-center">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-200/40 text-[9px] font-bold text-slate-400 tracking-wide uppercase">
              🤖 VINS Bot Connection initialized
            </span>
          </div>

          {/* Student Original Doubt Bubble */}
          <div className="flex items-start justify-end space-x-2.5 max-w-[85%] ml-auto">
            <div className="space-y-1 text-right">
              <div className="p-4 rounded-2xl rounded-tr-none shadow-xs text-xs sm:text-sm bg-slate-900 border border-slate-900 text-white text-left leading-relaxed font-medium select-text">
                {thread.content}
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide pr-1">
                {studentEmail} (Student)
              </span>
            </div>
            <div className="h-7 w-7 rounded-full bg-slate-200 border border-slate-350 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-slate-600" />
            </div>
          </div>

          {/* Replies Timeline */}
          {thread.replies && thread.replies.map((reply: any) => {
            const isBot = reply.user_id === null;
            const isAccepted = reply.is_accepted;
            const isMentor = reply.is_verified_mentor || reply.user_role === 'Mentor' || reply.user_role === 'Admin';
            const replierName = reply.user_email ? reply.user_email.split('@')[0] : 'Mentor';

            // VINS AI Bot: left-aligned, blue bubble
            if (isBot) {
              return (
                <div key={reply.id} className="flex items-start space-x-2.5 max-w-[85%] animate-in fade-in duration-200">
                  <div className="h-7 w-7 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-indigo-650" />
                  </div>
                  <div className="space-y-1">
                    <div className="bg-indigo-50/50 border border-indigo-150 p-4 rounded-2xl rounded-tl-none shadow-xs text-xs sm:text-sm text-slate-800 leading-relaxed font-medium select-text whitespace-pre-wrap">
                      {reply.content}
                    </div>
                    <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wide pl-1.5">
                      VINS AI Assistant
                    </span>
                  </div>
                </div>
              );
            }

            // Live Human Mentor: left-aligned, amber bubble
            if (isMentor) {
              return (
                <div key={reply.id} className="flex items-start space-x-2.5 max-w-[85%] animate-in fade-in duration-200">
                  <div className="h-7 w-7 rounded-full bg-amber-50 border border-amber-150 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="space-y-1">
                    <div className={`p-4 rounded-2xl rounded-tl-none shadow-xs text-xs sm:text-sm leading-relaxed font-medium select-text border ${
                      isAccepted
                        ? 'bg-emerald-50 border-emerald-250 text-slate-800'
                        : 'bg-amber-50/40 border-amber-150 text-slate-850'
                    }`}>
                      {reply.content}
                    </div>
                    <div className="flex items-center space-x-1.5 pl-1.5 text-[9px] font-bold uppercase tracking-wide">
                      <span className="text-amber-600">
                        Live Mentor ({replierName})
                      </span>
                      {isAccepted && (
                        <span className="text-emerald-600 flex items-center space-x-0.5">
                          <Check className="h-3 w-3" />
                          <span>Solution</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Other Peers/Students: right-aligned, white bubble
            const isSelf = reply.user_id === currentUser?.id;
            return (
              <div 
                key={reply.id} 
                className={`flex items-start space-x-2.5 max-w-[85%] animate-in fade-in duration-200 ${
                  isSelf ? 'ml-auto justify-end' : 'mr-auto'
                }`}
              >
                {!isSelf && (
                  <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                )}
                
                <div className={`space-y-1 ${isSelf ? 'text-right' : ''}`}>
                  <div className={`p-4 rounded-2xl shadow-xs text-xs sm:text-sm text-slate-700 leading-relaxed font-medium text-left border ${
                    isSelf ? 'rounded-tr-none bg-slate-100 border-slate-200' : 'rounded-tl-none bg-white border-slate-250/70'
                  }`}>
                    {reply.content}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide px-1.5 block">
                    {isSelf ? 'You' : replierName} (Student)
                  </span>
                </div>

                {isSelf && (
                  <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-250 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-slate-450" />
                  </div>
                )}
              </div>
            );
          })}

          <div ref={chatEndRef} />
        </div>

        {/* Dynamic Escalation Banner at Bottom of chat panel */}
        {thread.status === 'unresolved' && (
          <div className="mx-4 mb-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200 select-none">
            <div className="space-y-0.5">
              <h5 className="font-extrabold text-xs text-indigo-950 flex items-center space-x-1">
                <HelpCircle className="h-4 w-4 text-indigo-650 flex-shrink-0" />
                <span>AI response not sufficient?</span>
              </h5>
              <p className="text-[10px] text-slate-500 leading-normal font-medium max-w-sm">
                If the automated guides did not resolve your doubt, request a live human mentor to join the chat queue.
              </p>
            </div>
            <button
              onClick={handleEscalate}
              disabled={escalating}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-xl cursor-pointer shadow-xs transition-colors self-start sm:self-center"
            >
              {escalating ? 'Summoning...' : 'Summon Mentor'}
            </button>
          </div>
        )}

        {/* Escalated notification Banner */}
        {thread.status === 'escalated' && (
          <div className="mx-4 mb-3 p-3.5 rounded-2xl bg-rose-50/50 border border-rose-150 flex items-center space-x-2.5 animate-in slide-in-from-bottom-2 duration-200 select-none">
            <Clock className="h-4.5 w-4.5 text-rose-550 flex-shrink-0 animate-spin" />
            <p className="text-[10px] text-rose-800 leading-relaxed font-bold">
              MENTOR SUMMONED: A live staff administrator will join this chat log shortly to resolve your doubt.
            </p>
          </div>
        )}

        {/* Resolution notification banner */}
        {thread.status === 'resolved' && (
          <div className="mx-4 mb-3 p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-150 flex items-center space-x-2.5 animate-in slide-in-from-bottom-2 duration-200 select-none">
            <CheckCircle className="h-4.5 w-4.5 text-emerald-600 flex-shrink-0" />
            <p className="text-[10px] text-emerald-800 leading-relaxed font-bold">
              RESOLVED: This doubt has been marked resolved. If you have another doubt, feel free to open a new chat.
            </p>
          </div>
        )}

        {/* Reply Message Input Box */}
        <form onSubmit={handleReplySubmit} className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2">
          <input
            type="text"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            disabled={loading || !currentUser?.id || thread.status === 'resolved'}
            placeholder={
              !currentUser?.id 
                ? "Please log in to respond" 
                : thread.status === 'resolved'
                ? "Chat is resolved"
                : "Type your reply message here..."
            }
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-indigo-650 transition-colors font-medium"
          />
          <button
            type="submit"
            disabled={loading || !newReply.trim() || !currentUser?.id || thread.status === 'resolved'}
            className="bg-slate-900 hover:bg-slate-850 disabled:opacity-50 text-white font-semibold p-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
