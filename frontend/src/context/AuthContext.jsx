import React, { createContext, useState, useEffect, useCallback } from "react";
import AuthService from "../services/auth.service";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("crm_token") || sessionStorage.getItem("crm_token") || null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify authentication status on application load
  const initAuth = useCallback(async () => {
    const savedToken = localStorage.getItem("crm_token") || sessionStorage.getItem("crm_token");
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await AuthService.getCurrentUser(savedToken);
      if (response && response.success && response.data && response.data.user) {
        setUser(response.data.user);
        setToken(savedToken);
      } else {
        throw new Error("Invalid session profile");
      }
    } catch (err) {
      console.warn("Session restore error:", err.message);
      localStorage.removeItem("crm_token");
      sessionStorage.removeItem("crm_token");
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Login handler
  const login = async (email, password, rememberMe = false) => {
    const response = await AuthService.login(email, password);
    if (response && response.success && response.data) {
      const { token: newToken, user: userData } = response.data;
      
      if (rememberMe) {
        localStorage.setItem("crm_token", newToken);
        sessionStorage.removeItem("crm_token");
      } else {
        sessionStorage.setItem("crm_token", newToken);
        localStorage.removeItem("crm_token");
      }

      setToken(newToken);
      setUser(userData);
      return userData;
    }
    throw new Error(response.message || "Login failed");
  };

  // Helper to update user state locally after profile changes
  const updateUserProfile = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  // Logout handler
  const logout = async () => {
    try {
      if (token) {
        await AuthService.logout(token);
      }
    } catch (e) {
      // Ignore API errors on logout
    } finally {
      localStorage.removeItem("crm_token");
      sessionStorage.removeItem("crm_token");
      setUser(null);
      setToken(null);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    logout,
    setUser,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
