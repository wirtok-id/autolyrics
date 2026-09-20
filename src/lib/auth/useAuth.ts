"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Session {
  token: string;
  expiresAt: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      
      if (!response.ok) {
        setState({
          user: null,
          session: null,
          isLoading: false,
          error: null,
        });
        return;
      }

      const data = await response.json();
      
      setState({
        user: data.user,
        session: data.session,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        user: null,
        session: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Gagal memuat session",
      });
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      
      setState({
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
      
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    ...state,
    logout,
    refresh: fetchSession,
  };
}
