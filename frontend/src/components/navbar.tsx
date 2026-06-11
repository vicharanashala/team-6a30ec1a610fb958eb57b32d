'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { fetchProfile } from '../services/api';
import { 
  Sparkles, 
  HelpCircle, 
  Users, 
  ShieldAlert, 
  Award,
  RefreshCw,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profile = await fetchProfile();
        setUser(profile);
      } else {
        setUser({
          email: 'student@samagama.ai',
          role: 'Student',
          reputation_points: 15
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  useEffect(() => {
    loadProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });
    return () => subscription.unsubscribe();
  }, []);

  const switchRole = async (targetRole: 'Student' | 'Trusted Contributor' | 'Mentor' | 'Admin') => {
    setLoading(true);
    try {
      let mockEmail = '';
      if (targetRole === 'Student') mockEmail = 'student@samagama.ai';
      else if (targetRole === 'Trusted Contributor') mockEmail = 'trusted@samagama.ai';
      else if (targetRole === 'Mentor') mockEmail = 'mentor@samagama.ai';
      else if (targetRole === 'Admin') mockEmail = 'admin@samagama.ai';

      const { data: { session } } = await supabase.auth.getSession();
      const mockPassword = 'Password123!';
      
      let authSession = session;
      if (!session || session.user.email !== mockEmail) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: mockEmail,
          password: mockPassword
        });
        
        if (signInError) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: mockEmail,
            password: mockPassword
          });
          if (!signUpError) authSession = signUpData.session;
        } else {
          authSession = signInData.session;
        }
      }

      if (authSession?.access_token) {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        await fetch(`${API_BASE_URL}/auth/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authSession.access_token}`
          }
        });
        
        await fetch(`${API_BASE_URL}/threads/vote`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey(),
            'Authorization': `Bearer ${authSession.access_token}`
          },
          body: JSON.stringify({ 
            role: targetRole, 
            reputation_points: targetRole === 'Trusted Contributor' ? 120 : targetRole === 'Mentor' ? 500 : targetRole === 'Admin' ? 1000 : 15 
          })
        });
      }

      await loadProfile();
      setShowRoleSwitcher(false);
    } catch (e) {
      console.error('Failed to switch role:', e);
    } finally {
      setLoading(false);
    }
  };

  const supabaseAnonKey = () => {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzZHpzc3h5cm9tZXF0cHl2aG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTEwMjYsImV4cCI6MjA5NTE4NzAyNn0.T2mCOw-sgZt-Znpri8sEvF_mtSF3IuiSN4QitYi9Bw8';
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser({
      email: 'student@samagama.ai',
      role: 'Student',
      reputation_points: 15
    });
  };

  const navItems = [
    { name: 'Smart FAQ', href: '/faq', icon: HelpCircle },
    { name: 'Ask Doubts', href: '/', icon: Sparkles },
    { name: 'Peer Support', href: '/community', icon: Users },
  ];

  if (user?.role === 'Admin' || user?.role === 'Mentor') {
    navItems.push({ name: 'Admin panel', href: '/admin', icon: ShieldAlert });
  }

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 border-b border-slate-200/50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand logo */}
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-650 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-650/20">
            V
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 tracking-tight block">VINS Help OS</span>
            <span className="text-[9px] text-slate-450 block -mt-1">Vicharanashala Lab</span>
          </div>
        </div>

        {/* Center Nav tabs */}
        <nav className="hidden sm:flex items-center space-x-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/5'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <nav className="flex flex-col p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Right user widget */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors"
              >
                <span className="max-w-[120px] truncate">{user.email.split('@')[0]}</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-650 font-bold text-[9px] uppercase">
                  {user.role}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                    Testing Personas
                  </div>
                  {(['Student', 'Trusted Contributor', 'Mentor', 'Admin'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => switchRole(role)}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                        user.role === role
                          ? 'bg-indigo-50 text-indigo-750 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 my-1" />
                  <div className="px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-450">
                    <span className="flex items-center space-x-1">
                      <Award className="h-3.5 w-3.5 text-amber-500" />
                      <span>{user.reputation_points} pts</span>
                    </span>
                    <button 
                      onClick={handleLogout}
                      className="text-rose-600 hover:underline flex items-center space-x-1"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">Loading profile...</div>
          )}
        </div>
      </div>
    </header>
  );
}
