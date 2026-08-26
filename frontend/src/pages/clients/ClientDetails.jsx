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
} from "lucide-react";
import DocumentUploadModal from "../documents/DocumentUploadModal";
import DocumentReviewDrawer from "../documents/DocumentReviewDrawer";
import "./ClientDetails.css";

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
  const permissions = user?.permissions || [];

  const canCreateDoc = permissions.includes("document.create") || user?.role?.name === "Admin";
  const canUpdateDoc = permissions.includes("document.update") || permissions.includes("document.edit") || user?.role?.name === "Admin";
  const canVerifyDoc = permissions.includes("document.verify") || user?.role?.name === "Admin";
  const canDeleteDoc = permissions.includes("document.delete") || user?.role?.name === "Admin";

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
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [familyFormData, setFamilyFormData] = useState({
    relationship: "Spouse",
    name: "",
    email: "",
    mobile_no: "",
    pan_no: "",
    dob: "",
    gender: "Male",
  });
  const [familyFormError, setFamilyFormError] = useState("");

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
    try {
      setIsDeletingClient(true);
      await ClientService.deleteClient(id, token);
      setShowDeleteModal(false);
      navigate("/clients");
    } catch (err) {
      setError(err.message || "Failed to delete client.");
    } finally {
      setIsDeletingClient(false);
    }
  };

  // Handle Add Family Member Form Change
  const handleFamilyChange = (e) => {
    const { name, value } = e.target;
    setFamilyFormData((prev) => ({ ...prev, [name]: value }));
    setFamilyFormError("");
  };

  // Submit New Family Member
  const handleAddFamilySubmit = async (e) => {
    e.preventDefault();
    if (!familyFormData.name || !familyFormData.name.trim()) {
      setFamilyFormError("Family member name is required.");
      return;
    }
    if (!familyFormData.relationship) {
      setFamilyFormError("Relationship is required.");
      return;
    }

    try {
      setIsAddingFamily(true);
      setFamilyFormError("");
      await ClientService.addFamilyMember(id, familyFormData, token);
      setShowAddFamilyModal(false);
      setFamilyFormData({
        relationship: "Spouse",
        name: "",
        email: "",
        mobile_no: "",
        pan_no: "",
        dob: "",
        gender: "Male",
      });
      // Refresh client data
      fetchClientDetails();
    } catch (err) {
      setFamilyFormError(err.message || "Failed to add family member.");
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
          <button type="button" className="btn-back-link" onClick={() => navigate("/clients")}>
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
      <div className="client-details-container">
        {/* Top Header Card */}
        <div className="client-details-header-card">
          <div className="client-details-top-nav">
            <button type="button" className="btn-back-link" onClick={() => navigate("/clients")}>
              <ArrowLeft size={16} />
              <span>Back to Clients</span>
            </button>
            <div className="client-actions-group">
              <button
                type="button"
                className="btn-edit-client"
                onClick={() => navigate(`/clients/${id}/edit`)}
              >
                <Edit2 size={15} />
                <span>Edit Client</span>
              </button>
              <button
                type="button"
                className="btn-delete-client"
                onClick={() => setShowDeleteModal(true)}
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
                {client.category && (
                  <span className="badge-tag role">{client.category}</span>
                )}
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
                      onClick={() => setShowAddFamilyModal(true)}
                    >
                      <Plus size={14} />
                      <span>Add Member</span>
                    </button>
                  </div>

                  {familyMembers.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "0.85rem", fontStyle: "italic" }}>
                      No family members added yet.
                    </p>
                  ) : (
                    <div className="family-members-list">
                      {familyMembers.map((member) => (
                        <div key={member.id} className="family-member-card">
                          <div className="family-member-info">
                            <span className="family-member-name">{member.name}</span>
                            <span className="family-member-rel">{member.relationship}</span>
                            {member.mobile_no && (
                              <span className="family-member-detail">
                                {revealedFields[`fm_${member.id}_mobile`]
                                  ? member.mobile_no
                                  : maskMobile(member.mobile_no)}
                                <button
                                  type="button"
                                  className="btn-eye-toggle"
                                  style={{ marginLeft: "0.25rem" }}
                                  onClick={() => toggleRevealField(`fm_${member.id}_mobile`)}
                                  title="Toggle contact info"
                                >
                                  {revealedFields[`fm_${member.id}_mobile`] ? <EyeOff size={11} /> : <Eye size={11} />}
                                </button>
                              </span>
                            )}
                            {member.email && (
                              <span className="family-member-detail">
                                {revealedFields[`fm_${member.id}_email`]
                                  ? member.email
                                  : maskEmail(member.email)}
                                <button
                                  type="button"
                                  className="btn-eye-toggle"
                                  style={{ marginLeft: "0.25rem" }}
                                  onClick={() => toggleRevealField(`fm_${member.id}_email`)}
                                  title="Toggle contact info"
                                >
                                  {revealedFields[`fm_${member.id}_email`] ? <EyeOff size={11} /> : <Eye size={11} />}
                                </button>
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn-remove-family"
                            title="Remove Family Member"
                            onClick={() => setDeleteFamilyTarget(member)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
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
              <div className="card-header-row">
                <h3 className="card-title">Family Details</h3>
                <button
                  type="button"
                  className="btn-add-member-sm"
                  onClick={() => setShowAddFamilyModal(true)}
                >
                  <Plus size={14} />
                  <span>Add Member</span>
                </button>
              </div>

              <div className="clients-table-wrapper">
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>RELATIONSHIP</th>
                      <th>NAME</th>
                      <th>MOBILE</th>
                      <th>EMAIL</th>
                      <th>PAN</th>
                      <th>DOB</th>
                      <th style={{ width: "50px" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {familyMembers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-state-cell">
                          No family members registered.
                        </td>
                      </tr>
                    ) : (
                      familyMembers.map((fm) => (
                        <tr key={fm.id}>
                          <td>
                            <span className="family-member-rel">{fm.relationship}</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{fm.name}</td>
                          <td>
                            {fm.mobile_no ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                {revealedFields[`tab_fm_${fm.id}_mobile`] ? fm.mobile_no : maskMobile(fm.mobile_no)}
                                <button
                                  type="button"
                                  className="btn-eye-toggle"
                                  onClick={() => toggleRevealField(`tab_fm_${fm.id}_mobile`)}
                                  title="Toggle mobile number"
                                >
                                  {revealedFields[`tab_fm_${fm.id}_mobile`] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>
                            {fm.email ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                {revealedFields[`tab_fm_${fm.id}_email`] ? fm.email : maskEmail(fm.email)}
                                <button
                                  type="button"
                                  className="btn-eye-toggle"
                                  onClick={() => toggleRevealField(`tab_fm_${fm.id}_email`)}
                                  title="Toggle email address"
                                >
                                  {revealedFields[`tab_fm_${fm.id}_email`] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>
                            {fm.pan_no ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                {revealedFields[`tab_fm_${fm.id}_pan`] ? fm.pan_no : maskPan(fm.pan_no)}
                                <button
                                  type="button"
                                  className="btn-eye-toggle"
                                  onClick={() => toggleRevealField(`tab_fm_${fm.id}_pan`)}
                                  title="Toggle PAN number"
                                >
                                  {revealedFields[`tab_fm_${fm.id}_pan`] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td>{formatDate(fm.dob)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-remove-family"
                              onClick={() => setDeleteFamilyTarget(fm)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
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
            <div className="modal-container">
              <div className="modal-header">
                <h3 className="modal-title">Add Family Member</h3>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setShowAddFamilyModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleAddFamilySubmit}>
                <div className="modal-body">
                  {familyFormError && (
                    <div className="error-text">{familyFormError}</div>
                  )}

                  <div className="form-group">
                    <label className="form-label">
                      Relationship <span className="required-star">*</span>
                    </label>
                    <select
                      name="relationship"
                      value={familyFormData.relationship}
                      onChange={handleFamilyChange}
                      className="form-select"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Name <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Family member full name"
                      value={familyFormData.name}
                      onChange={handleFamilyChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Mobile Number</label>
                      <input
                        type="text"
                        name="mobile_no"
                        placeholder="10-digit mobile"
                        value={familyFormData.mobile_no}
                        onChange={handleFamilyChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="email@example.com"
                        value={familyFormData.email}
                        onChange={handleFamilyChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">PAN Number</label>
                      <input
                        type="text"
                        name="pan_no"
                        placeholder="ABCDE1234F"
                        value={familyFormData.pan_no}
                        onChange={handleFamilyChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        value={familyFormData.dob}
                        onChange={handleFamilyChange}
                        className="form-input"
                      />
                    </div>
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
                    {isAddingFamily ? "Saving..." : "Add Member"}
                  </button>
                </div>
              </form>
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
          client={client}
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
