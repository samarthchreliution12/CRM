import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout/AppLayout";
import ClientService from "../../services/client.service";
import useAuth from "../../hooks/useAuth";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  X,
  Loader2,
  AlertCircle,
  FileText,
  UserCheck,
  CreditCard,
  Briefcase,
  Users,
  Eye,
  EyeOff,
  Download,
  Award,
  Crown,
  Gem,
  Search,
  ExternalLink,
  UserPlus,
  Link as LinkIcon,
} from "lucide-react";
import DocumentUploadModal from "../documents/DocumentUploadModal";
import DocumentReviewDrawer from "../documents/DocumentReviewDrawer";
import "./ClientDetails.css";

const renderCategoryBadge = (categoryStr) => {
  if (!categoryStr) return null;
  const clean = categoryStr.toString().trim().toUpperCase();

  switch (clean) {
    case "BRONZE":
      return (
        <span className="category-badge cat-bronze">
          <Award size={13} className="cat-icon" />
          <span>Bronze</span>
        </span>
      );
    case "SILVER":
      return (
        <span className="category-badge cat-silver">
          <Award size={13} className="cat-icon" />
          <span>Silver</span>
        </span>
      );
    case "GOLD":
      return (
        <span className="category-badge cat-gold">
          <Crown size={13} className="cat-icon" />
          <span>Gold</span>
        </span>
      );
    case "PLATINUM":
      return (
        <span className="category-badge cat-platinum">
          <Gem size={13} className="cat-icon" />
          <span>Platinum</span>
        </span>
      );
    default:
      return (
        <span className="category-badge cat-bronze">
          <Award size={13} className="cat-icon" />
          <span>{clean}</span>
        </span>
      );
  }
};

const getInitials = (name) => {
  if (!name) return "CL";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Mask mobile number to show only first 2 and last 2 digits.
 * Example: "08128420287" -> "08******87"
 */
const maskMobile = (mobile) => {
  if (!mobile || typeof mobile !== "string") return "";
  const cleaned = mobile.trim();
  if (cleaned.length <= 4) return "*".repeat(cleaned.length);
  const first2 = cleaned.slice(0, 2);
  const last2 = cleaned.slice(-2);
  return `${first2}******${last2}`;
};

/**
 * Mask email to show first character + asterisks + @domain.
 * Example: "chavdasamarth007@gmail.com" -> "c******@gmail.com"
 */
const maskEmail = (email) => {
  if (!email || typeof email !== "string" || !email.includes("@")) return email || "";
  const parts = email.trim().split("@");
  const username = parts[0];
  const domain = parts.slice(1).join("@");
  if (username.length <= 1) return `${username}******@${domain}`;
  const firstChar = username[0];
  return `${firstChar}******@${domain}`;
};

/**
 * Mask PAN number to show only first 2 and last 2 characters.
 * Example: "ABCDE1234F" -> "AB******4F"
 */
const maskPan = (pan) => {
  if (!pan || typeof pan !== "string") return "";
  const cleaned = pan.trim();
  if (cleaned.length <= 4) return "*".repeat(cleaned.length);
  const first2 = cleaned.slice(0, 2);
  const last2 = cleaned.slice(-2);
  return `${first2}******${last2}`;
};

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const handleBackToClients = () => {
    if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate("/clients", { replace: true });
    }
  };
  const permissions = user?.permissions || [];
  const isAdmin = user?.role?.name === "Admin" || user?.role === "Admin" || user?.role_name === "Admin";
  const canEdit = isAdmin || permissions.includes("client.edit") || permissions.includes("client.update");
  const canDelete = isAdmin || permissions.includes("client.delete");

  // Floating Toast Notification State
  const [toastError, setToastError] = useState("");
  const triggerPermissionToast = (msg) => {
    setToastError(msg);
    setTimeout(() => {
      setToastError("");
    }, 4000);
  };

  const canCreateDoc = permissions.includes("document.create") || isAdmin;
  const canUpdateDoc = permissions.includes("document.update") || permissions.includes("document.edit") || isAdmin;
  const canVerifyDoc = permissions.includes("document.verify") || isAdmin;
  const canDeleteDoc = permissions.includes("document.delete") || isAdmin;

  // Client Data & Loading State
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Contact Field Reveal State: { [fieldKey]: boolean }
  const [revealedFields, setRevealedFields] = useState({});

  // Tab State: 'overview' | 'services' | 'documents' | 'family' | 'ucc'
  const [activeTab, setActiveTab] = useState("overview");

  // Client Documents State
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isDocUploadOpen, setIsDocUploadOpen] = useState(false);
  const [targetReplaceDoc, setTargetReplaceDoc] = useState(null);
  const [isDocReviewOpen, setIsDocReviewOpen] = useState(false);

  // Fetch Documents for Client
  const fetchDocuments = useCallback(async () => {
    if (!id || !token) return;
    try {
      setLoadingDocs(true);
      const res = await ClientService.getClientDocuments(id, token);
      setDocuments(res?.data?.documents || []);
    } catch (err) {
      console.error("Failed to fetch client documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handler to download decrypted document file
  const handleDownloadDocument = async (doc) => {
    try {
      if (!id) return;
      const { blob } = await ClientService.getDocumentFileBlob(id, doc.id, token);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = doc.original_file_name || `${doc.document_type || "document"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download document. Please try again.");
    }
  };

  // Modals State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  const [showAddFamilyModal, setShowAddFamilyModal] = useState(false);
  const [familyModalTab, setFamilyModalTab] = useState("link"); // "link" | "create"
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [familyFormError, setFamilyFormError] = useState("");

  // Tab 1: Link Existing Client State
  const [linkSearchQuery, setLinkSearchQuery] = useState("");
  const [linkSearchResults, setLinkSearchResults] = useState([]);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const [selectedClientToLink, setSelectedClientToLink] = useState(null);
  const [linkRelationship, setLinkRelationship] = useState("Spouse");

  // Tab 2: Create New Client & Link State
  const [newClientFormData, setNewClientFormData] = useState({
    relationship: "Spouse",
    name: "",
    business_name: "",
    mobile_no: "",
    same_as_whatsapp: false,
    whatsapp_no: "",
    email: "",
    pan: "",
    dob: "",
    gender: "Male",
    occupation: "",
    address: "",
    status: "active",
    client_category: "",
  });
  const [newClientErrors, setNewClientErrors] = useState({});

  const [deleteFamilyTarget, setDeleteFamilyTarget] = useState(null);
  const [isDeletingFamily, setIsDeletingFamily] = useState(false);


  // Toggle reveal state for specific contact fields (mobile, email, whatsapp, pan, etc.)
  const toggleRevealField = (fieldKey) => {
    setRevealedFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  // Fetch Client Details from Backend using URL parameter ID
  const fetchClientDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ClientService.getClient(id, token);
      if (res && res.data && res.data.client) {
        setClient(res.data.client);
      } else {
        setError("Client not found.");
      }
    } catch (err) {
      if (err.statusCode === 403) {
        setError("You do not have permission to view this client.");
      } else if (err.statusCode === 404) {
        setError("Client not found.");
      } else {
        setError(err.message || "Failed to load client details.");
      }
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

  // Handle Client Deletion
  const handleDeleteClient = async () => {
    if (!canDelete) {
      setShowDeleteModal(false);
      triggerPermissionToast("You do not have permission to delete clients.");
      return;
    }
    try {
      setIsDeletingClient(true);
      await ClientService.deleteClient(id, token);
      setShowDeleteModal(false);
      navigate("/clients");
    } catch (err) {
      setShowDeleteModal(false);
      if (err.statusCode === 403 || (err.message && err.message.toLowerCase().includes("permission"))) {
        triggerPermissionToast("You do not have permission to delete clients.");
      } else {
        setError(err.message || "Failed to delete client.");
      }
    } finally {
      setIsDeletingClient(false);
    }
  };

  // Debounced search for linking existing client
  useEffect(() => {
    if (!showAddFamilyModal || familyModalTab !== "link") return;
    if (!linkSearchQuery || !linkSearchQuery.trim()) {
      setLinkSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingClients(true);
        const res = await ClientService.searchClients(linkSearchQuery.trim(), token);
        if (res && res.data && res.data.clients) {
          const existingMemberIds = (client?.family_members || [])
            .map((m) => m.member_client_id)
            .filter(Boolean);
          const filtered = res.data.clients.filter(
            (c) => Number(c.id) !== Number(id) && !existingMemberIds.includes(c.id)
          );
          setLinkSearchResults(filtered);
        } else {
          setLinkSearchResults([]);
        }
      } catch (err) {
        console.error("Client search error:", err);
        setLinkSearchResults([]);
      } finally {
        setIsSearchingClients(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [linkSearchQuery, showAddFamilyModal, familyModalTab, token, id, client?.family_members]);

  // UCC Auto-generation helper for Tab 2
  const generateUccForNewMember = (pan, dob) => {
    if (!pan || !dob) return "";
    const cleanPan = pan.trim().toUpperCase();
    const panMatch = cleanPan.match(/^[A-Z]{5}([0-9]{4})[A-Z]{1}$/);
    if (!panMatch) return "";
    const panDigits = panMatch[1];

    const dobStr = String(dob).trim();
    const ymdMatch = dobStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (ymdMatch) {
      const mm = ymdMatch[2].padStart(2, "0");
      const dd = ymdMatch[3].padStart(2, "0");
      return `${panDigits}${dd}${mm}`;
    }
    const dmyMatch = dobStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmyMatch) {
      const dd = dmyMatch[1].padStart(2, "0");
      const mm = dmyMatch[2].padStart(2, "0");
      return `${panDigits}${dd}${mm}`;
    }
    return "";
  };

  // Submit Tab 1: Link Existing Client
  const handleLinkExistingFamilySubmit = async (e) => {
    e.preventDefault();
    if (!selectedClientToLink) {
      setFamilyFormError("Please search and select an existing client to link.");
      return;
    }
    if (!linkRelationship) {
      setFamilyFormError("Relationship is required.");
      return;
    }

    try {
      setIsAddingFamily(true);
      setFamilyFormError("");
      await ClientService.addFamilyMember(
        id,
        {
          member_client_id: selectedClientToLink.id,
          relationship: linkRelationship,
        },
        token
      );
      setShowAddFamilyModal(false);
      setSelectedClientToLink(null);
      setLinkSearchQuery("");
      setLinkSearchResults([]);
      fetchClientDetails();
    } catch (err) {
      setFamilyFormError(err.message || "Failed to link family member.");
    } finally {
      setIsAddingFamily(false);
    }
  };

  // Submit Tab 2: Create New Client & Link to Family
  const handleCreateNewClientFamilySubmit = async (e) => {
    e.preventDefault();
    setFamilyFormError("");

    const formErrors = {};
    if (!newClientFormData.name || !newClientFormData.name.trim()) {
      formErrors.name = "Full name is required";
    }
    if (!newClientFormData.mobile_no || !newClientFormData.mobile_no.trim()) {
      formErrors.mobile_no = "Mobile number is required";
    } else {
      const cleanMobile = newClientFormData.mobile_no.trim().replace(/[\s\-()]/g, "");
      if (!/^[0-9]{10,15}$/.test(cleanMobile)) {
        formErrors.mobile_no = "Mobile number must be 10-15 digits";
      }
    }
    if (newClientFormData.pan && newClientFormData.pan.trim()) {
      const cleanPan = newClientFormData.pan.trim().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
        formErrors.pan = "Invalid PAN format (e.g. ABCDE1234F)";
      }
    }
    if (newClientFormData.email && newClientFormData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClientFormData.email.trim())) {
        formErrors.email = "Invalid email format";
      }
    }

    if (Object.keys(formErrors).length > 0) {
      setNewClientErrors(formErrors);
      setFamilyFormError("Please fill all required fields correctly.");
      return;
    }

    try {
      setIsAddingFamily(true);
      setFamilyFormError("");

      const autoUcc = generateUccForNewMember(newClientFormData.pan, newClientFormData.dob);

      const createPayload = {
        name: newClientFormData.name.trim(),
        business_name: newClientFormData.business_name?.trim() || null,
        mobile_no: newClientFormData.mobile_no.trim(),
        whatsapp_no: newClientFormData.whatsapp_no?.trim() || null,
        email: newClientFormData.email?.trim() || null,
        pan: newClientFormData.pan?.trim().toUpperCase() || null,
        dob: newClientFormData.dob || null,
        gender: newClientFormData.gender || null,
        occupation: newClientFormData.occupation?.trim() || null,
        address: newClientFormData.address?.trim() || null,
        status: newClientFormData.status || "active",
        client_category: newClientFormData.client_category || null,
        ...(autoUcc ? { ucc_no: autoUcc } : {}),
      };

      const createRes = await ClientService.createClient(createPayload, token);
      const createdClient = createRes?.data?.client;
      if (!createdClient || !createdClient.id) {
        throw new Error("Failed to create client.");
      }

      await ClientService.addFamilyMember(
        id,
        {
          member_client_id: createdClient.id,
          relationship: newClientFormData.relationship,
        },
        token
      );

      setShowAddFamilyModal(false);
      setNewClientFormData({
        relationship: "Spouse",
        name: "",
        business_name: "",
        mobile_no: "",
        same_as_whatsapp: false,
        whatsapp_no: "",
        email: "",
        pan: "",
        dob: "",
        gender: "Male",
        occupation: "",
        address: "",
        status: "active",
        client_category: "",
      });
      setNewClientErrors({});
      fetchClientDetails();
    } catch (err) {
      setFamilyFormError(err.message || "Failed to create and link family member.");
    } finally {
      setIsAddingFamily(false);
    }
  };

  // Submit Delete Family Member
  const handleConfirmDeleteFamily = async () => {
    if (!deleteFamilyTarget) return;
    try {
      setIsDeletingFamily(true);
      await ClientService.deleteFamilyMember(id, deleteFamilyTarget.id, token);
      setDeleteFamilyTarget(null);
      fetchClientDetails();
    } catch (err) {
      setError(err.message || "Failed to remove family member.");
    } finally {
      setIsDeletingFamily(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Client Details">
        <div className="client-details-container">
          <div className="details-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 1rem auto", color: "#0f172a" }} />
            <p style={{ color: "#64748b", fontWeight: 600 }}>Loading client details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !client) {
    return (
      <AppLayout title="Client Details">
        <div className="client-details-container">
          <button type="button" className="btn-back-link" onClick={handleBackToClients}>
            <ArrowLeft size={16} />
            <span>Back to Clients</span>
          </button>
          <div className="banner-error">
            <AlertCircle size={20} />
            <span>{error || "Client not found."}</span>
          </div>
        </div>
      </AppLayout>
    );
  }

  const familyMembers = client.family_members || [];
  const subscribedServices = Array.isArray(client.services) ? client.services : [];

  return (
    <AppLayout title="Client Details">
      {/* Permission Denied Floating Toast */}
      {toastError && (
        <div className="permission-toast danger-toast">
          <AlertCircle size={18} />
          <span>{toastError}</span>
        </div>
      )}

      <div className="client-details-container">
        {/* Top Header Card */}
        <div className="client-details-header-card">
          <div className="client-details-top-nav">
            <button type="button" className="btn-back-link" onClick={handleBackToClients}>
              <ArrowLeft size={16} />
              <span>Back to Clients</span>
            </button>
            <div className="client-actions-group">
              <button
                type="button"
                className="btn-edit-client"
                onClick={() => {
                  if (!canEdit) {
                    triggerPermissionToast("You do not have permission to edit clients.");
                    return;
                  }
                  navigate(`/clients/${id}/edit`);
                }}
              >
                <Edit2 size={15} />
                <span>Edit Client</span>
              </button>
              <button
                type="button"
                className="btn-delete-client"
                onClick={() => {
                  if (!canDelete) {
                    triggerPermissionToast("You do not have permission to delete clients.");
                    return;
                  }
                  setShowDeleteModal(true);
                }}
              >
                <Trash2 size={15} />
                <span>Delete Client</span>
              </button>
            </div>
          </div>

          <div className="client-header-main">
            <div className="client-large-avatar">{getInitials(client.name)}</div>
            <div className="client-header-info">
              <div className="client-header-title-row">
                <h2 className="client-name-title">{client.name}</h2>
                <span className="client-ucc-badge">{client.ucc_no}</span>
              </div>
              {client.business_name && (
                <div style={{ fontSize: "0.9rem", color: "#475569", fontWeight: 600 }}>
                  {client.business_name}
                </div>
              )}
              <div className="client-badges-row">
                <span className="badge-tag type">
                  {typeof client.client_type === "object" && client.client_type !== null
                    ? client.client_type.name || "Individual"
                    : typeof client.client_type === "string"
                    ? client.client_type
                    : client.client_type_name || "Individual"}
                </span>
                <span className="badge-tag role">
                  {client.client_status === "NON_CLIENT" ? "Non-Client" : "Client"}
                </span>
                {renderCategoryBadge(client.client_category || client.category)}
                <span className={`badge-tag ${client.status === "active" ? "active" : "inactive"}`}>
                  {client.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary Cards Bar */}
        <div className="client-summary-bar">
          {/* Mobile Card */}
          <div className="summary-item-card">
            <span className="summary-item-label">Mobile</span>
            <span className="summary-item-value" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
              {client.mobile_no ? (
                <>
                  <span>{revealedFields.mobile ? client.mobile_no : maskMobile(client.mobile_no)}</span>
                  <button
                    type="button"
                    className="btn-eye-toggle"
                    onClick={() => toggleRevealField("mobile")}
                    title={revealedFields.mobile ? "Mask mobile number" : "Reveal mobile number"}
                    aria-label={revealedFields.mobile ? "Mask mobile number" : "Reveal mobile number"}
                  >
                    {revealedFields.mobile ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>

          {/* Email Card */}
          <div className="summary-item-card">
            <span className="summary-item-label">Email</span>
            <span className="summary-item-value" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
              {client.email ? (
                <>
                  <span>{revealedFields.email ? client.email : maskEmail(client.email)}</span>
                  <button
                    type="button"
                    className="btn-eye-toggle"
                    onClick={() => toggleRevealField("email")}
                    title={revealedFields.email ? "Mask email address" : "Reveal email address"}
                    aria-label={revealedFields.email ? "Mask email address" : "Reveal email address"}
                  >
                    {revealedFields.email ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>

          {/* PAN Card */}
          <div className="summary-item-card">
            <span className="summary-item-label">PAN</span>
            <span className="summary-item-value" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
              {client.pan ? (
                <>
                  <span>{revealedFields.pan ? client.pan : maskPan(client.pan)}</span>
                  <button
                    type="button"
                    className="btn-eye-toggle"
                    onClick={() => toggleRevealField("pan")}
                    title={revealedFields.pan ? "Mask PAN number" : "Reveal PAN number"}
                    aria-label={revealedFields.pan ? "Mask PAN number" : "Reveal PAN number"}
                  >
                    {revealedFields.pan ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </>
              ) : (
                "N/A"
              )}
            </span>
          </div>

          <div className="summary-item-card">
            <span className="summary-item-label">Date of Birth</span>
            <span className="summary-item-value">{formatDate(client.dob)}</span>
          </div>
          <div className="summary-item-card">
            <span className="summary-item-label">Occupation</span>
            <span className="summary-item-value">{client.occupation || "N/A"}</span>
          </div>
        </div>

        {/* Tab Header Navigation */}
        <div className="client-tabs-nav">
          <button
            type="button"
            className={`tab-button ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <UserCheck size={16} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === "services" ? "active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            <Briefcase size={16} />
            <span>Services</span>
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === "documents" ? "active" : ""}`}
            onClick={() => setActiveTab("documents")}
          >
            <FileText size={16} />
            <span>Documents</span>
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === "family" ? "active" : ""}`}
            onClick={() => setActiveTab("family")}
          >
            <Users size={16} />
            <span>Family</span>
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === "ucc" ? "active" : ""}`}
            onClick={() => setActiveTab("ucc")}
          >
            <CreditCard size={16} />
            <span>UCC / Account Details</span>
          </button>
        </div>

        {/* TAB BODY CONTENT */}
        <div className="tab-content-container">
          {/* 1. OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="overview-grid">
              {/* Left Column: Client Info & Services */}
              <div className="overview-main-column">
                {/* Client Information Card */}
                <div className="details-card">
                  <div className="card-header-row">
                    <h3 className="card-title">Client Information</h3>
                  </div>
                  <div className="info-keyvalue-grid">
                    <div className="info-kv-item">
                      <span className="info-kv-label">Full Name</span>
                      <span className="info-kv-value">{client.name}</span>
                    </div>
                    <div className="info-kv-item">
                      <span className="info-kv-label">Business Name</span>
                      <span className="info-kv-value">{client.business_name || "N/A"}</span>
                    </div>
                    <div className="info-kv-item">
                      <span className="info-kv-label">Gender</span>
                      <span className="info-kv-value">{client.gender || "N/A"}</span>
                    </div>

                    {/* Mobile Number Row */}
                    <div className="info-kv-item">
                      <span className="info-kv-label">Mobile Number</span>
                      <span className="info-kv-value" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                        {client.mobile_no ? (
                          <>
                            <span>{revealedFields.mobile ? client.mobile_no : maskMobile(client.mobile_no)}</span>
                            <button
                              type="button"
                              className="btn-eye-toggle"
                              onClick={() => toggleRevealField("mobile")}
                              title={revealedFields.mobile ? "Mask mobile number" : "Reveal mobile number"}
                              aria-label={revealedFields.mobile ? "Mask mobile number" : "Reveal mobile number"}
                            >
                              {revealedFields.mobile ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>

                    {/* WhatsApp Number Row */}
                    <div className="info-kv-item">
                      <span className="info-kv-label">WhatsApp Number</span>
                      <span className="info-kv-value" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                        {client.whatsapp_no || client.mobile_no ? (
                          <>
                            <span>
                              {revealedFields.whatsapp
                                ? (client.whatsapp_no || client.mobile_no)
                                : maskMobile(client.whatsapp_no || client.mobile_no)}
                            </span>
                            <button
                              type="button"
                              className="btn-eye-toggle"
                              onClick={() => toggleRevealField("whatsapp")}
                              title={revealedFields.whatsapp ? "Mask WhatsApp number" : "Reveal WhatsApp number"}
                              aria-label={revealedFields.whatsapp ? "Mask WhatsApp number" : "Reveal WhatsApp number"}
                            >
                              {revealedFields.whatsapp ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>

                    {/* Email Row */}
                    <div className="info-kv-item">
                      <span className="info-kv-label">Email</span>
                      <span className="info-kv-value" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                        {client.email ? (
                          <>
                            <span>{revealedFields.email ? client.email : maskEmail(client.email)}</span>
                            <button
                              type="button"
                              className="btn-eye-toggle"
                              onClick={() => toggleRevealField("email")}
                              title={revealedFields.email ? "Mask email address" : "Reveal email address"}
                              aria-label={revealedFields.email ? "Mask email address" : "Reveal email address"}
                            >
                              {revealedFields.email ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>

                    {/* PAN Row */}
                    <div className="info-kv-item">
                      <span className="info-kv-label">PAN</span>
                      <span className="info-kv-value" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
                        {client.pan ? (
                          <>
                            <span>{revealedFields.pan ? client.pan : maskPan(client.pan)}</span>
                            <button
                              type="button"
                              className="btn-eye-toggle"
                              onClick={() => toggleRevealField("pan")}
                              title={revealedFields.pan ? "Mask PAN number" : "Reveal PAN number"}
                              aria-label={revealedFields.pan ? "Mask PAN number" : "Reveal PAN number"}
                            >
                              {revealedFields.pan ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>

                    <div className="info-kv-item">
                      <span className="info-kv-label">Date of Birth</span>
                      <span className="info-kv-value">{formatDate(client.dob)}</span>
                    </div>
                    <div className="info-kv-item">
                      <span className="info-kv-label">Occupation</span>
                      <span className="info-kv-value">{client.occupation || "N/A"}</span>
                    </div>
                    <div className="info-kv-item">
                      <span className="info-kv-label">Client Type</span>
                      <span className="info-kv-value">
                        {typeof client.client_type === "object" && client.client_type !== null
                          ? client.client_type.name || "Individual"
                          : typeof client.client_type === "string"
                          ? client.client_type
                          : client.client_type_name || "Individual"}
                      </span>
                    </div>
                    {client.category && (
                      <div className="info-kv-item">
                        <span className="info-kv-label">Category</span>
                        <span className="info-kv-value">{client.category}</span>
                      </div>
                    )}
                    <div className="info-kv-item">
                      <span className="info-kv-label">Status</span>
                      <span className="info-kv-value" style={{ textTransform: "capitalize" }}>
                        {client.status || "active"}
                      </span>
                    </div>
                    <div className="info-kv-item">
                      <span className="info-kv-label">UCC No</span>
                      <span className="info-kv-value">{client.ucc_no}</span>
                    </div>
                    <div className="info-kv-item info-kv-item-full">
                      <span className="info-kv-label">Address</span>
                      <span className="info-kv-value" style={{ whiteSpace: "pre-wrap" }}>
                        {client.address || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subscribed Services Card */}
                <div className="details-card">
                  <div className="card-header-row">
                    <h3 className="card-title">Subscribed Services</h3>
                  </div>
                  {subscribedServices.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "0.875rem", fontStyle: "italic" }}>
                      No services subscribed.
                    </p>
                  ) : (
                    <div className="services-pills-grid">
                      {subscribedServices.map((srv, idx) => {
                        const serviceName =
                          typeof srv === "object" && srv !== null
                            ? srv.name || srv.description || String(srv.id || idx)
                            : String(srv);
                        const serviceKey =
                          typeof srv === "object" && srv !== null
                            ? srv.id || idx
                            : srv;
                        return (
                          <div key={serviceKey} className="service-status-card">
                            <span className="service-card-name">{serviceName}</span>
                            <span className="service-card-status">● ACTIVE</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Family Members Card */}
              <div className="overview-right-column">
                <div className="details-card">
                  <div className="card-header-row">
                    <h3 className="card-title">Family Members</h3>
                    <button
                      type="button"
                      className="btn-add-member-sm"
                      onClick={() => {
                        setFamilyModalTab("link");
                        setLinkSearchQuery("");
                        setLinkSearchResults([]);
                        setSelectedClientToLink(null);
                        setFamilyFormError("");
                        setShowAddFamilyModal(true);
                      }}
                    >
                      <Plus size={14} />
                      <span>Add Member</span>
                    </button>
                  </div>

                  {/* Family Head Display in Overview */}
                  <div className="overview-family-head-banner">
                    <Crown size={15} className="family-head-icon-mini" />
                    <span>
                      Family Head: <strong>{client.family_head ? client.family_head.name : client.name}</strong> ({client.family_head?.ucc_no || client.ucc_no || "No UCC"})
                    </span>
                  </div>

                  {familyMembers.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "0.85rem", fontStyle: "italic", marginTop: "0.75rem" }}>
                      No family members added yet.
                    </p>
                  ) : (
                    <div className="family-members-list" style={{ marginTop: "0.75rem" }}>
                      {familyMembers.map((member, idx) => {
                        const targetClientId = member.member_client_id || (member.is_head ? client.family_head?.id : null);
                        const isCurrent = member.is_current || Number(targetClientId) === Number(id);

                        return (
                          <div key={member.id || `overview-fm-${idx}`} className="family-member-card">
                            <div className="family-member-info">
                              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span className="family-member-name">{member.name}</span>
                                {member.is_head && (
                                  <span className="family-role-badge badge-head">
                                    <Crown size={10} /> Head
                                  </span>
                                )}
                                {isCurrent && !member.is_head && (
                                  <span className="family-role-badge badge-current">
                                    This Client
                                  </span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                                <span className="family-member-rel">{member.relationship}</span>
                                {member.ucc_no && (
                                  <span className="family-member-ucc-badge">UCC: {member.ucc_no}</span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              {targetClientId && (
                                <button
                                  type="button"
                                  className="btn-view-member-action-sm"
                                  onClick={() => navigate(`/clients/${targetClientId}`)}
                                  title="View Client Details"
                                >
                                  <Eye size={12} />
                                  <span>View</span>
                                </button>
                              )}
                              {!member.is_head && member.id && (
                                <button
                                  type="button"
                                  className="btn-remove-family"
                                  title="Remove Family Member"
                                  onClick={() => setDeleteFamilyTarget(member)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. SERVICES TAB */}
          {activeTab === "services" && (
            <div className="details-card">
              <div className="card-header-row">
                <h3 className="card-title">All Subscribed Services</h3>
              </div>
              {subscribedServices.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.875rem", fontStyle: "italic" }}>
                  No services subscribed.
                </p>
              ) : (
                <div className="services-pills-grid">
                  {subscribedServices.map((srv, idx) => {
                    const serviceName =
                      typeof srv === "object" && srv !== null
                        ? srv.name || srv.description || String(srv.id || idx)
                        : String(srv);
                    const serviceKey =
                      typeof srv === "object" && srv !== null
                        ? srv.id || idx
                        : srv;
                    return (
                      <div key={serviceKey} className="service-status-card">
                        <span className="service-card-name">{serviceName}</span>
                        <span className="service-card-status">● ACTIVE</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. DOCUMENTS TAB */}
          {activeTab === "documents" && (
            <div className="details-card">
              <div className="card-header-row">
                <h3 className="card-title">Client Documents</h3>
                {canCreateDoc && (
                  <button
                    type="button"
                    className="btn-add-member-sm"
                    onClick={() => {
                      setTargetReplaceDoc(null);
                      setIsDocUploadOpen(true);
                    }}
                  >
                    <Plus size={14} />
                    <span>Upload Document</span>
                  </button>
                )}
              </div>

              {loadingDocs ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                  <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem auto" }} />
                  <p style={{ fontSize: "0.875rem" }}>Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.875rem", fontStyle: "italic" }}>
                  No documents available for this client.
                </p>
              ) : (
                <div className="clients-table-wrapper">
                  <table className="clients-table">
                    <thead>
                      <tr>
                        <th>TYPE</th>
                        <th>FILE NAME</th>
                        <th>UPLOAD DATE</th>
                        <th>STATUS</th>
                        <th style={{ width: "240px" }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
                        const statusClass = doc.status ? doc.status.toLowerCase() : "pending";
                        return (
                          <tr key={doc.id}>
                            <td style={{ fontWeight: 600, color: "#0f172a" }}>
                              {doc.document_name || doc.document_type}
                            </td>
                            <td>{doc.original_file_name}</td>
                            <td>{formatDate(doc.created_at)}</td>
                            <td>
                              <span className={`badge-tag ${statusClass === "verified" ? "active" : statusClass === "rejected" ? "inactive" : "role"}`}>
                                {doc.status || "PENDING"}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  type="button"
                                  className="btn-add-member-sm"
                                  style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                                  onClick={() => setIsDocReviewOpen(true)}
                                >
                                  <Eye size={13} />
                                  <span>Review</span>
                                </button>
                                {canUpdateDoc && (
                                  <button
                                    type="button"
                                    className="btn-add-member-sm"
                                    style={{ backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" }}
                                    onClick={() => {
                                      setTargetReplaceDoc(doc);
                                      setIsDocUploadOpen(true);
                                    }}
                                  >
                                    <span>Replace</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn-add-member-sm"
                                  style={{ backgroundColor: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" }}
                                  onClick={() => handleDownloadDocument(doc)}
                                >
                                  <Download size={14} />
                                  <span>Download</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. FAMILY TAB */}
          {activeTab === "family" && (
            <div className="details-card">
              {/* Family Head Card */}
              <div className="family-head-card">
                <div className="family-head-info-group">
                  <Crown size={24} className="family-head-crown-icon" />
                  <div>
                    <span className="family-head-subheading">Family Head</span>
                    <h4 className="family-head-heading">
                      {client.family_head ? client.family_head.name : client.name}
                      <span className="family-head-ucc">
                        ({client.family_head?.ucc_no || client.ucc_no || "No UCC"})
                      </span>
                    </h4>
                  </div>
                </div>
                {client.family_head && Number(client.family_head.id) !== Number(client.id) && (
                  <button
                    type="button"
                    className="btn-view-head-link"
                    onClick={() => navigate(`/clients/${client.family_head.id}`)}
                  >
                    <ExternalLink size={14} />
                    <span>View Head Profile</span>
                  </button>
                )}
              </div>

              <div className="card-header-row" style={{ marginTop: "1.25rem" }}>
                <h3 className="card-title">Family Members</h3>
                <button
                  type="button"
                  className="btn-add-member-sm"
                  onClick={() => {
                    setFamilyModalTab("link");
                    setLinkSearchQuery("");
                    setLinkSearchResults([]);
                    setSelectedClientToLink(null);
                    setFamilyFormError("");
                    setShowAddFamilyModal(true);
                  }}
                >
                  <Plus size={14} />
                  <span>Add Member</span>
                </button>
              </div>

              <div className="clients-table-wrapper">
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>MEMBER</th>
                      <th>RELATIONSHIP</th>
                      <th>UCC</th>
                      <th style={{ width: "120px", textAlign: "right" }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {familyMembers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="empty-state-cell">
                          No family members registered.
                        </td>
                      </tr>
                    ) : (
                      familyMembers.map((fm, idx) => {
                        const targetClientId = fm.member_client_id || (fm.is_head ? client.family_head?.id : null);
                        const isCurrent = fm.is_current || Number(targetClientId) === Number(id);

                        return (
                          <tr key={fm.id || `head-${idx}`}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span style={{ fontWeight: 700, color: "#0f172a" }}>{fm.name}</span>
                                {fm.is_head && (
                                  <span className="family-role-badge badge-head">
                                    <Crown size={11} /> Head
                                  </span>
                                )}
                                {isCurrent && !fm.is_head && (
                                  <span className="family-role-badge badge-current">
                                    This Client
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="family-member-rel">{fm.relationship}</span>
                            </td>
                            <td>
                              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                                {fm.ucc_no || "—"}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end" }}>
                                {targetClientId && (
                                  <button
                                    type="button"
                                    className="btn-view-member-action"
                                    onClick={() => navigate(`/clients/${targetClientId}`)}
                                    title="View Client Details"
                                  >
                                    <Eye size={13} />
                                    <span>View</span>
                                  </button>
                                )}
                                {!fm.is_head && fm.id && (
                                  <button
                                    type="button"
                                    className="btn-remove-family"
                                    onClick={() => setDeleteFamilyTarget(fm)}
                                    title="Remove from Family"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. UCC / ACCOUNT DETAILS TAB */}
          {activeTab === "ucc" && (
            <div className="details-card">
              <div className="card-header-row">
                <h3 className="card-title">UCC & Account Information</h3>
              </div>
              <div className="info-keyvalue-grid">
                <div className="info-kv-item">
                  <span className="info-kv-label">UCC Number</span>
                  <span className="info-kv-value">{client.ucc_no}</span>
                </div>
                <div className="info-kv-item">
                  <span className="info-kv-label">Client Type</span>
                  <span className="info-kv-value">{client.client_type?.name || "Individual"}</span>
                </div>
                {client.category && (
                  <div className="info-kv-item">
                    <span className="info-kv-label">Category</span>
                    <span className="info-kv-value">{client.category}</span>
                  </div>
                )}
                <div className="info-kv-item">
                  <span className="info-kv-label">Status</span>
                  <span className="info-kv-value" style={{ textTransform: "capitalize" }}>
                    {client.status || "active"}
                  </span>
                </div>
                <div className="info-kv-item">
                  <span className="info-kv-label">Created At</span>
                  <span className="info-kv-value">{formatDate(client.created_at)}</span>
                </div>
                <div className="info-kv-item">
                  <span className="info-kv-label">Updated At</span>
                  <span className="info-kv-value">{formatDate(client.updated_at)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL 1: DELETE CLIENT CONFIRMATION */}
        {showDeleteModal && (
          <div className="modal-backdrop">
            <div className="modal-container" style={{ maxWidth: "440px" }}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ color: "#b91c1c" }}>Delete Client</h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setShowDeleteModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: "0.9rem", color: "#334155" }}>
                  Are you sure you want to delete client <strong>{client.name}</strong> ({client.ucc_no})?
                </p>
                <p style={{ fontSize: "0.825rem", color: "#ef4444", fontStyle: "normal", fontWeight: 500 }}>
                  This action cannot be undone and will delete all associated family members.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeletingClient}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-delete-client"
                  onClick={handleDeleteClient}
                  disabled={isDeletingClient}
                >
                  {isDeletingClient ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: ADD FAMILY MEMBER */}
        {showAddFamilyModal && (
          <div className="modal-backdrop">
            <div className="modal-container family-modal-container">
              <div className="modal-header">
                <div className="modal-title-with-tabs">
                  <h3 className="modal-title">Add Family Member</h3>
                </div>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setShowAddFamilyModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="family-modal-tab-bar">
                <button
                  type="button"
                  className={`family-modal-tab-btn ${familyModalTab === "link" ? "active" : ""}`}
                  onClick={() => {
                    setFamilyModalTab("link");
                    setFamilyFormError("");
                  }}
                >
                  <LinkIcon size={14} />
                  <span>Link Existing Client</span>
                </button>
                <button
                  type="button"
                  className={`family-modal-tab-btn ${familyModalTab === "create" ? "active" : ""}`}
                  onClick={() => {
                    setFamilyModalTab("create");
                    setFamilyFormError("");
                  }}
                >
                  <UserPlus size={14} />
                  <span>Create New Client</span>
                </button>
              </div>

              {familyFormError && (
                <div className="family-modal-error-alert">
                  <AlertCircle size={15} />
                  <span>{familyFormError}</span>
                </div>
              )}

              {/* TAB 1: LINK EXISTING CLIENT */}
              {familyModalTab === "link" && (
                <form onSubmit={handleLinkExistingFamilySubmit}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">
                        Search Existing Client <span className="required-star">*</span>
                      </label>
                      <div className="family-search-input-wrap">
                        <Search size={16} className="family-search-icon" />
                        <input
                          type="text"
                          className="form-input family-search-input"
                          placeholder="Type Name, PAN, UCC, or Mobile to search..."
                          value={linkSearchQuery}
                          onChange={(e) => {
                            setLinkSearchQuery(e.target.value);
                            if (selectedClientToLink) {
                              setSelectedClientToLink(null);
                            }
                          }}
                        />
                        {isSearchingClients && (
                          <Loader2 size={16} className="animate-spin family-search-loader" />
                        )}
                      </div>
                    </div>

                    {/* Search Results List */}
                    {!selectedClientToLink && linkSearchResults.length > 0 && (
                      <div className="family-search-results-list">
                        {linkSearchResults.map((sc) => (
                          <div
                            key={sc.id}
                            className="family-search-result-item"
                            onClick={() => {
                              setSelectedClientToLink(sc);
                              setLinkSearchResults([]);
                            }}
                          >
                            <div className="family-result-info">
                              <span className="family-result-name">{sc.name}</span>
                              <div className="family-result-meta">
                                {sc.ucc_no && <span>UCC: <strong>{sc.ucc_no}</strong></span>}
                                {sc.pan && <span>PAN: <strong>{sc.pan}</strong></span>}
                                {sc.mobile_no && <span>Mob: {sc.mobile_no}</span>}
                              </div>
                            </div>
                            <button type="button" className="btn-select-client-tag">
                              Select
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {!selectedClientToLink && linkSearchQuery.trim() && !isSearchingClients && linkSearchResults.length === 0 && (
                      <div className="family-search-empty-state">
                        <span>No existing clients found matching "{linkSearchQuery}".</span>
                      </div>
                    )}

                    {/* Selected Client Card */}
                    {selectedClientToLink && (
                      <div className="family-selected-card">
                        <div className="family-selected-card-header">
                          <span className="family-selected-label">Selected Client</span>
                          <button
                            type="button"
                            className="btn-clear-selected"
                            onClick={() => setSelectedClientToLink(null)}
                          >
                            Change
                          </button>
                        </div>
                        <div className="family-selected-details">
                          <div className="family-selected-name">{selectedClientToLink.name}</div>
                          <div className="family-selected-grid">
                            <div>UCC: <strong>{selectedClientToLink.ucc_no || "N/A"}</strong></div>
                            <div>PAN: <strong>{selectedClientToLink.pan || "N/A"}</strong></div>
                            <div>Mobile: <strong>{selectedClientToLink.mobile_no || "N/A"}</strong></div>
                            <div>Email: <strong>{selectedClientToLink.email || "N/A"}</strong></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="form-group" style={{ marginTop: "1rem" }}>
                      <label className="form-label">
                        Relationship <span className="required-star">*</span>
                      </label>
                      <select
                        name="relationship"
                        value={linkRelationship}
                        onChange={(e) => setLinkRelationship(e.target.value)}
                        className="form-select"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Grandfather">Grandfather</option>
                        <option value="Grandmother">Grandmother</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="family-modal-footer-link-hint">
                      <span>Client not found? </span>
                      <button
                        type="button"
                        className="btn-text-switch-tab"
                        onClick={() => {
                          setFamilyModalTab("create");
                          setFamilyFormError("");
                        }}
                      >
                        Create New Client
                      </button>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowAddFamilyModal(false)}
                      disabled={isAddingFamily}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save-client"
                      disabled={isAddingFamily || !selectedClientToLink}
                    >
                      {isAddingFamily ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Linking...</span>
                        </>
                      ) : (
                        "Add to Family"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: CREATE NEW CLIENT */}
              {familyModalTab === "create" && (
                <form onSubmit={handleCreateNewClientFamilySubmit}>
                  <div className="modal-body family-modal-body-scroll">
                    <div className="form-group">
                      <label className="form-label">
                        Relationship <span className="required-star">*</span>
                      </label>
                      <select
                        name="relationship"
                        value={newClientFormData.relationship}
                        onChange={(e) =>
                          setNewClientFormData((prev) => ({ ...prev, relationship: e.target.value }))
                        }
                        className="form-select"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Grandfather">Grandfather</option>
                        <option value="Grandmother">Grandmother</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Full Name <span className="required-star">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Client full name"
                        value={newClientFormData.name}
                        onChange={(e) => {
                          setNewClientFormData((prev) => ({ ...prev, name: e.target.value }));
                          if (newClientErrors.name) setNewClientErrors((prev) => ({ ...prev, name: "" }));
                        }}
                        className={`form-input ${newClientErrors.name ? "input-error" : ""}`}
                      />
                      {newClientErrors.name && <span className="field-error-text">{newClientErrors.name}</span>}
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">PAN Number</label>
                        <input
                          type="text"
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          value={newClientFormData.pan}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setNewClientFormData((prev) => ({ ...prev, pan: val }));
                            if (newClientErrors.pan) setNewClientErrors((prev) => ({ ...prev, pan: "" }));
                          }}
                          className={`form-input ${newClientErrors.pan ? "input-error" : ""}`}
                        />
                        {newClientErrors.pan && <span className="field-error-text">{newClientErrors.pan}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input
                          type="date"
                          value={newClientFormData.dob}
                          onChange={(e) =>
                            setNewClientFormData((prev) => ({ ...prev, dob: e.target.value }))
                          }
                          className="form-input"
                        />
                      </div>
                    </div>

                    {/* Auto UCC Preview */}
                    <div className="form-group">
                      <label className="form-label">
                        Generated UCC <span style={{ fontSize: "0.75rem", color: "#64748b" }}>(Auto from PAN 4 digits + DOB DDMM)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={generateUccForNewMember(newClientFormData.pan, newClientFormData.dob) || "Auto-generated upon PAN & DOB entry"}
                        className="form-input"
                        style={{ backgroundColor: "#f8fafc", color: "#334155", fontWeight: 600, fontFamily: "monospace" }}
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">
                          Mobile Number <span className="required-star">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="10-digit mobile"
                          maxLength={15}
                          value={newClientFormData.mobile_no}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewClientFormData((prev) => {
                              const updated = { ...prev, mobile_no: val };
                              if (prev.same_as_whatsapp) updated.whatsapp_no = val;
                              return updated;
                            });
                            if (newClientErrors.mobile_no) setNewClientErrors((prev) => ({ ...prev, mobile_no: "" }));
                          }}
                          className={`form-input ${newClientErrors.mobile_no ? "input-error" : ""}`}
                        />
                        {newClientErrors.mobile_no && <span className="field-error-text">{newClientErrors.mobile_no}</span>}
                      </div>

                      <div className="form-group">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                          <label className="form-label" style={{ margin: 0 }}>WhatsApp Number</label>
                          <label style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", color: "#475569" }}>
                            <input
                              type="checkbox"
                              checked={newClientFormData.same_as_whatsapp}
                              onChange={(e) => {
                                const chk = e.target.checked;
                                setNewClientFormData((prev) => ({
                                  ...prev,
                                  same_as_whatsapp: chk,
                                  whatsapp_no: chk ? prev.mobile_no : prev.whatsapp_no,
                                }));
                              }}
                            />
                            Same as mobile
                          </label>
                        </div>
                        <input
                          type="text"
                          placeholder="WhatsApp number"
                          disabled={newClientFormData.same_as_whatsapp}
                          value={newClientFormData.whatsapp_no}
                          onChange={(e) =>
                            setNewClientFormData((prev) => ({ ...prev, whatsapp_no: e.target.value }))
                          }
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          placeholder="email@example.com"
                          value={newClientFormData.email}
                          onChange={(e) => {
                            setNewClientFormData((prev) => ({ ...prev, email: e.target.value }));
                            if (newClientErrors.email) setNewClientErrors((prev) => ({ ...prev, email: "" }));
                          }}
                          className={`form-input ${newClientErrors.email ? "input-error" : ""}`}
                        />
                        {newClientErrors.email && <span className="field-error-text">{newClientErrors.email}</span>}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select
                          value={newClientFormData.gender}
                          onChange={(e) =>
                            setNewClientFormData((prev) => ({ ...prev, gender: e.target.value }))
                          }
                          className="form-select"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Occupation</label>
                        <input
                          type="text"
                          placeholder="e.g. Business, Professional"
                          value={newClientFormData.occupation}
                          onChange={(e) =>
                            setNewClientFormData((prev) => ({ ...prev, occupation: e.target.value }))
                          }
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                          value={newClientFormData.client_category}
                          onChange={(e) =>
                            setNewClientFormData((prev) => ({ ...prev, client_category: e.target.value }))
                          }
                          className="form-select"
                        >
                          <option value="">Select Category</option>
                          <option value="Bronze">Bronze</option>
                          <option value="Silver">Silver</option>
                          <option value="Gold">Gold</option>
                          <option value="Platinum">Platinum</option>
                          <option value="Diamond">Diamond</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Address</label>
                      <textarea
                        rows={2}
                        placeholder="Full residential or office address"
                        value={newClientFormData.address}
                        onChange={(e) =>
                          setNewClientFormData((prev) => ({ ...prev, address: e.target.value }))
                        }
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setShowAddFamilyModal(false)}
                      disabled={isAddingFamily}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save-client"
                      disabled={isAddingFamily}
                    >
                      {isAddingFamily ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Creating & Linking...</span>
                        </>
                      ) : (
                        "Create & Link to Family"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* MODAL 3: DELETE FAMILY MEMBER CONFIRMATION */}
        {deleteFamilyTarget && (
          <div className="modal-backdrop">
            <div className="modal-container" style={{ maxWidth: "420px" }}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ color: "#b91c1c" }}>Remove Family Member</h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setDeleteFamilyTarget(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: "0.9rem", color: "#334155" }}>
                  Are you sure you want to remove <strong>{deleteFamilyTarget.name}</strong> ({deleteFamilyTarget.relationship})?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setDeleteFamilyTarget(null)}
                  disabled={isDeletingFamily}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-delete-client"
                  onClick={handleConfirmDeleteFamily}
                  disabled={isDeletingFamily}
                >
                  {isDeletingFamily ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: DOCUMENT UPLOAD & REPLACE MODAL */}
        <DocumentUploadModal
          isOpen={isDocUploadOpen}
          onClose={() => {
            setIsDocUploadOpen(false);
            setTargetReplaceDoc(null);
          }}
          initialClient={client}
          targetDocument={targetReplaceDoc}
          onSuccess={fetchDocuments}
        />

        {/* MODAL 5: DOCUMENT REVIEW DRAWER */}
        <DocumentReviewDrawer
          isOpen={isDocReviewOpen}
          onClose={() => setIsDocReviewOpen(false)}
          client={client}
          documents={documents}
          canVerify={canVerifyDoc}
          canUpdate={canUpdateDoc}
          canDelete={canDeleteDoc}
          onOpenReplace={(doc) => {
            setTargetReplaceDoc(doc);
            setIsDocUploadOpen(true);
          }}
          onRefreshAll={fetchDocuments}
        />
      </div>
    </AppLayout>
  );
};

export default ClientDetails;
