import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import AuthService from "../services/auth.service";
import SessionWarningModal from "../components/common/SessionWarningModal";

export const AuthContext = createContext(null);

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD_MS = 28 * 60 * 1000; // 28 minutes (Warning appears 2 mins before timeout)
const ACTIVITY_THROTTLE_MS = 10 * 1000; // Throttle activity listener to run at most once per 10s

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("crm_token") || sessionStorage.getItem("crm_token") || null);
  const [isLoading, setIsLoading] = useState(true);

  // Inactivity & Session Warning States
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [remainingWarningSeconds, setRemainingWarningSeconds] = useState(120);

  const lastActivityRef = useRef(Date.now());
  const lastThrottleRef = useRef(0);

  // Initialize and verify authentication status on application load
  const initAuth = useCallback(async () => {
    let savedToken = localStorage.getItem("crm_token") || sessionStorage.getItem("crm_token");

    // Migrate legacy sessionStorage token to localStorage if needed
    if (!localStorage.getItem("crm_token") && sessionStorage.getItem("crm_token")) {
      localStorage.setItem("crm_token", savedToken);
      sessionStorage.removeItem("crm_token");
    }

    try {
      if (savedToken) {
        try {
          const response = await AuthService.getCurrentUser(savedToken);
          if (response && response.success && response.data && response.data.user) {
            setUser(response.data.user);
            setToken(savedToken);
            lastActivityRef.current = Date.now();
            setIsLoading(false);
            return;
          }
        } catch (apiErr) {
          // If 401 or access token expired, attempt automatic refresh using HttpOnly cookie
          console.log("Access token validation failed, attempting session refresh...");
          const refreshRes = await AuthService.refreshToken();
          if (refreshRes && refreshRes.success && refreshRes.data && refreshRes.data.token) {
            const newToken = refreshRes.data.token;
            localStorage.setItem("crm_token", newToken);
            setToken(newToken);
            setUser(refreshRes.data.user);
            lastActivityRef.current = Date.now();
            setIsLoading(false);
            return;
          }
        }
      } else {
        // Attempt silent refresh if HttpOnly cookie exists
        const refreshRes = await AuthService.refreshToken();
        if (refreshRes && refreshRes.success && refreshRes.data && refreshRes.data.token) {
          const newToken = refreshRes.data.token;
          localStorage.setItem("crm_token", newToken);
          setToken(newToken);
          setUser(refreshRes.data.user);
          lastActivityRef.current = Date.now();
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      // Clear token if invalid session
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

  // Listen to window storage events for real-time multi-tab session synchronization (e.g. logout in another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "crm_token") {
        if (!e.newValue) {
          // Token was cleared in another tab -> reset state locally
          setUser(null);
          setToken(null);
          setShowWarningModal(false);
        } else if (e.newValue !== token) {
          // Token was set/updated in another tab -> sync token and re-validate
          setToken(e.newValue);
          initAuth();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [token, initAuth]);

  // Meaningful User Activity Detection (Mouse movement, keyboard input, clicks, touch interactions)
  useEffect(() => {
    if (!user || !token) return;

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastThrottleRef.current > ACTIVITY_THROTTLE_MS) {
        lastThrottleRef.current = now;
        lastActivityRef.current = now;

        // If user interacted while warning modal was open, hide warning modal
        if (showWarningModal) {
          setShowWarningModal(false);
        }
      }
    };

    const activityEvents = ["mousemove", "keydown", "click", "touchstart"];
    activityEvents.forEach((event) => window.addEventListener(event, handleUserActivity, { passive: true }));

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleUserActivity));
    };
  }, [user, token, showWarningModal]);

  // Logout handler
  const logout = useCallback(async () => {
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
      setShowWarningModal(false);
    }
  }, [token]);

  // Inactivity Interval Monitor (Checks every 3 seconds)
  useEffect(() => {
    if (!user || !token) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedInactive = now - lastActivityRef.current;

      if (elapsedInactive >= INACTIVITY_LIMIT_MS) {
        // 30 Minutes Inactivity Reached -> Trigger automatic inactivity logout
        console.warn("Session expired due to 30 minutes of inactivity.");
        setShowWarningModal(false);
        logout();
      } else if (elapsedInactive >= WARNING_THRESHOLD_MS) {
        // 28 Minutes Inactivity Reached -> Show Warning Modal
        setShowWarningModal(true);
        const remainingMs = INACTIVITY_LIMIT_MS - elapsedInactive;
        setRemainingWarningSeconds(Math.max(0, Math.ceil(remainingMs / 1000)));
      } else {
        setShowWarningModal(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, token, logout]);

  // Login handler
  const login = async (email, password, rememberMe = false) => {
    const response = await AuthService.login(email, password);
    if (response && response.success && response.data) {
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem("crm_token", newToken);
      sessionStorage.removeItem("crm_token");

      setToken(newToken);
      setUser(userData);
      lastActivityRef.current = Date.now();
      setShowWarningModal(false);
      return userData;
    }
    throw new Error(response.message || "Login failed");
  };

  // Stay Logged In button handler inside warning modal
  const handleStayLoggedIn = async () => {
    lastActivityRef.current = Date.now();
    setShowWarningModal(false);

    try {
      // Refresh token to keep session fresh
      const res = await AuthService.refreshToken();
      if (res && res.success && res.data && res.data.token) {
        const newToken = res.data.token;
        localStorage.setItem("crm_token", newToken);
        setToken(newToken);
      }
    } catch (e) {
      console.warn("Stay logged in token refresh notice:", e.message);
    }
  };

  // Helper to update user state locally after profile changes
  const updateUserProfile = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
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

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionWarningModal
        isOpen={showWarningModal}
        remainingSeconds={remainingWarningSeconds}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={logout}
      />
    </AuthContext.Provider>
  );
};
