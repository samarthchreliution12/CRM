import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import ClientService from "../../services/client.service";
import { Search, X, Loader2, ArrowRight, User, AlertCircle } from "lucide-react";
import "./ClientSearchWidget.css";

const getInitials = (name) => {
  if (!name) return "CL";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const maskMobile = (mobile) => {
  if (!mobile || typeof mobile !== "string") return "N/A";
  const cleaned = mobile.trim();
  if (cleaned.length <= 4) return "*".repeat(cleaned.length);
  const first2 = cleaned.slice(0, 2);
  const last2 = cleaned.slice(-2);
  return `${first2}******${last2}`;
};

const ClientSearchWidget = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 300ms Debounce effect on search term input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm.trim());
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Execute database search when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    let isMounted = true;

    const performSearch = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await ClientService.searchClients(debouncedQuery, token);
        if (isMounted) {
          if (response && response.success && response.data) {
            setResults(response.data.clients || []);
          } else {
            setResults([]);
          }
        }
      } catch (err) {
        if (isMounted) {
          if (err.statusCode === 403) {
            setError("Permission denied: You do not have permission to search clients.");
          } else {
            setError(err.message || "Failed to search clients.");
          }
          setResults([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, token]);

  const handleClear = () => {
    setSearchTerm("");
    setDebouncedQuery("");
    setResults([]);
    setError("");
  };

  const handleRowClick = (clientId) => {
    if (clientId) {
      navigate(`/clients/${clientId}`);
    }
  };

  return (
    <div className="client-search-widget">
      {/* Widget Header */}
      <div className="search-widget-header">
        <h3 className="search-widget-title">
          <Search size={18} color="#9E241D" />
          Client Quick Search
        </h3>
      </div>

      {/* Search Bar Input */}
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon-left" />
        <input
          type="text"
          className="search-input-field"
          placeholder="Search client by name, PAN or mobile number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClear}
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results & Feedback Area */}
      <div className="search-results-area">
        {loading ? (
          <div className="search-loading-state">
            <Loader2 size={22} className="animate-spin" />
            <span style={{ marginTop: "0.375rem" }}>Searching clients in database...</span>
          </div>
        ) : error ? (
          <div className="search-error-state">
            <AlertCircle size={20} color="#ef4444" />
            <span style={{ marginTop: "0.25rem" }}>{error}</span>
          </div>
        ) : !debouncedQuery ? (
          <div className="search-prompt-state">
            <User size={28} style={{ opacity: 0.4 }} />
            <span className="search-prompt-text">
              Enter a name, PAN, or mobile number to search database records.
            </span>
          </div>
        ) : results.length === 0 ? (
          <div className="search-empty-state">
            <p>No clients found matching "<strong>{debouncedQuery}</strong>"</p>
          </div>
        ) : (
          <div className="search-results-table-wrapper">
            <table className="search-results-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>UCC No</th>
                  <th>PAN</th>
                  <th>Mobile Number</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((client) => (
                  <tr
                    key={client.id}
                    className="search-result-row"
                    onClick={() => handleRowClick(client.id)}
                  >
                    <td>
                      <div className="search-client-name">
                        <div className="search-client-initial">
                          {getInitials(client.name)}
                        </div>
                        <span>{client.name}</span>
                      </div>
                    </td>
                    <td>{client.ucc_no || "N/A"}</td>
                    <td>
                      <span className="search-badge-pan">{client.pan || "N/A"}</span>
                    </td>
                    <td>{maskMobile(client.mobile_no)}</td>
                    <td className="search-action-cell">
                      <button
                        type="button"
                        className="search-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(client.id);
                        }}
                      >
                        View <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSearchWidget;
