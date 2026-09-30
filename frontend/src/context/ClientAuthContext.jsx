import React, { createContext, useState, useEffect, useCallback } from "react";
import ClientPortalService from "../services/clientPortal.service";

export const ClientAuthContext = createContext(null);

export const ClientAuthProvider = ({ children }) => {
  const [client, setClient] = useState(() => ClientPortalService.getStoredClient());
  const [token, setToken] = useState(() => ClientPortalService.getToken());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify client authentication on mount
  const initClientAuth = useCallback(async () => {
    const savedToken = ClientPortalService.getToken();
    if (!savedToken) {
      setClient(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await ClientPortalService.getProfile();
      if (profile) {
        setClient(profile);
        setToken(savedToken);
        ClientPortalService.setStoredClient(profile);
      } else {
        ClientPortalService.clearStorage();
        setClient(null);
        setToken(null);
      }
    } catch (err) {
      console.warn("Client session check failed:", err.message);
      ClientPortalService.clearStorage();
      setClient(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initClientAuth();
  }, [initClientAuth]);

  // Client Login
  const login = async (mobileNo, rememberMe = true) => {
    setIsLoading(true);
    try {
      const result = await ClientPortalService.login(mobileNo, rememberMe);
      setToken(result.token);
      setClient(result.client);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  // Client Logout
  const logout = async () => {
    setIsLoading(true);
    try {
      await ClientPortalService.logout();
    } finally {
      setToken(null);
      setClient(null);
      setIsLoading(false);
    }
  };

  // Refresh client profile
  const refreshProfile = async () => {
    try {
      const updatedProfile = await ClientPortalService.getProfile();
      if (updatedProfile) {
        setClient(updatedProfile);
        ClientPortalService.setStoredClient(updatedProfile);
      }
      return updatedProfile;
    } catch (err) {
      console.error("Failed to refresh client profile:", err);
      return null;
    }
  };

  const value = {
    client,
    token,
    isLoading,
    isAuthenticated: !!token && !!client,
    login,
    logout,
    refreshProfile,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
};
