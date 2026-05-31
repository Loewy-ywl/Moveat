import { useState, useEffect, useCallback } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Recommendations from "./pages/Recommendations";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import DietRecord from "./pages/DietRecord";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(!!localStorage.getItem('moveat_guest_id'));
  const [authChecked, setAuthChecked] = useState(false);

  const clearGuestState = useCallback(() => {
    localStorage.removeItem('moveat_guest_id');
    localStorage.removeItem('moveat_guest_name');
    localStorage.removeItem('moveat_guest_activity');
    localStorage.removeItem('moveat_guest_profile');
    localStorage.removeItem('moveat_guest_diet_logs');
    setIsGuest(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          console.error('获取会话失败:', error.message);
          setUser(null);
        } else {
          const currentUser = session?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            clearGuestState();
          }
        }
      } catch (err) {
        console.error('初始化认证出错:', err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setAuthChecked(true);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        clearGuestState();
      }
    });

    const handleGuestChange = () => {
      if (!mounted) return;
      setIsGuest(!!localStorage.getItem('moveat_guest_id'));
    };
    window.addEventListener('moveat-guest-change', handleGuestChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('moveat-guest-change', handleGuestChange);
    };
  }, [clearGuestState]);

  const isLoggedIn = user || isGuest;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-center" offset={60} />
        <HashRouter>
          <Routes>
            <Route path="/" element={!authChecked || !isLoggedIn ? <Index /> : <Navigate to="/home" />} />
            <Route path="/login" element={!authChecked || !isLoggedIn ? <Login /> : <Navigate to="/home" />} />
            <Route path="/register" element={!authChecked || !isLoggedIn ? <Register /> : <Navigate to="/home" />} />
            <Route path="/onboarding" element={isLoggedIn ? <Onboarding /> : <Navigate to="/login" />} />
            <Route path="/home" element={isLoggedIn ? <Home /> : <Navigate to="/login" />} />
            <Route path="/recommend" element={isLoggedIn ? <Recommendations /> : <Navigate to="/login" />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/diet-record" element={isLoggedIn ? <DietRecord /> : <Navigate to="/login" />} />
          </Routes>
          <BottomNav />
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
