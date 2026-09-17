const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050/api";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
  * Centralized Fetch API client with automatic token attachment, 
  * 401 handling, single-flight token refresh mutex, and request retry.
  */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Retrieve access token from localStorage
  let token = localStorage.getItem("crm_token");

  const headers = {
    ...options.headers,
  };

  // Only default Content-Type to application/json if not sending FormData
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: "include", // Ensure cookies (like HttpOnly refreshToken) are sent
  };

  try {
    let response = await fetch(url, config);

    // If 401 Unauthorized and request is NOT the refresh or login endpoint itself
    if (response.status === 401 && !endpoint.includes("/auth/refresh") && !endpoint.includes("/auth/login")) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          const refreshData = await refreshRes.json();

          if (refreshRes.ok && refreshData && refreshData.data && refreshData.data.token) {
            const newToken = refreshData.data.token;
            localStorage.setItem("crm_token", newToken);

            // Notify window storage event for multi-tab synchronization
            window.dispatchEvent(
              new StorageEvent("storage", {
                key: "crm_token",
                newValue: newToken,
              })
            );

            processQueue(null, newToken);

            // Retry original request with new token
            config.headers["Authorization"] = `Bearer ${newToken}`;
            response = await fetch(url, config);
          } else {
            const refreshErr = new Error("Session expired. Please log in again.");
            processQueue(refreshErr, null);
            localStorage.removeItem("crm_token");
            window.dispatchEvent(
              new StorageEvent("storage", {
                key: "crm_token",
                newValue: null,
              })
            );
            const error = new Error("Session expired. Please log in again.");
            error.statusCode = 401;
            throw error;
          }
        } catch (err) {
          processQueue(err, null);
          localStorage.removeItem("crm_token");
          window.dispatchEvent(
            new StorageEvent("storage", {
              key: "crm_token",
              newValue: null,
            })
          );
          throw err;
        } finally {
          isRefreshing = false;
        }
      } else {
        // Queue parallel failed 401 requests while a refresh is already in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          config.headers["Authorization"] = `Bearer ${newToken}`;
          return fetch(url, config).then(async (res) => {
            if (options.rawResponse) {
              return res;
            }
            const data = await res.json();
            if (!res.ok) {
              const error = new Error(data.message || "An unexpected error occurred");
              error.statusCode = res.status;
              error.errors = data.errors || null;
              error.details = data.data || data.details || null;
              throw error;
            }
            return data;
          });
        });
      }
    }

    if (options.rawResponse) {
      return response;
    }

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || "An unexpected error occurred");
      error.statusCode = response.status;
      error.errors = data.errors || null;
      error.details = data.data || data.details || null;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.statusCode) {
      throw err;
    }
    const networkError = new Error("Unable to connect to the server. Please check your connection.");
    networkError.statusCode = 503;
    throw networkError;
  }
}

export default apiFetch;
