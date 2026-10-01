import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Shield,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Building,
  MapPin,
  CheckCircle2,
  Lock,
  Layers,
  Briefcase,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import ClientPortalLayout from "../../components/clientPortal/ClientPortalLayout";
import ClientPortalService from "../../services/clientPortal.service";
import SEO from "../../components/SEO";
import "./ClientProfile.css";

const ClientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ClientPortalService.getProfile();
      setProfile(data);
    } catch (err) {
      console.error("Error fetching client profile:", err);
      setError(err.message || "Failed to load profile details.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not provided";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name) => {
    if (!name) return "CL";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <ClientPortalLayout>
      <SEO title="My Profile - Client Portal" noindex={true} />

      {/* Profile Header */}
      <div className="client-profile-header">
        <div className="profile-header-main">
          <div className="profile-avatar-large">
            {getInitials(profile?.name)}
          </div>
          <div className="profile-header-text">
            <div className="profile-name-row">
              <h1 className="profile-name">{profile?.name || "Client Account"}</h1>
              <span className="profile-status-badge active">
                <CheckCircle2 size={12} /> {profile?.status ? profile.status.toUpperCase() : "ACTIVE"}
              </span>
            </div>
            <p className="profile-subtext">
              {profile?.business_name ? `${profile.business_name} • ` : ""}
              Client Type: <strong>{profile?.client_type?.name || "Individual"}</strong>
            </p>
          </div>
        </div>

        <div className="profile-header-meta-box">
          <span className="meta-box-label">Unique Client Code (UCC)</span>
          <span className="meta-box-value">{profile?.ucc_no || "N/A"}</span>
        </div>
      </div>

      {error && (
        <div className="profile-error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={fetchProfile} className="retry-btn">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="profile-loading-skeleton">
          <div className="skeleton-grid-box" />
          <div className="skeleton-grid-box" />
        </div>
      ) : (
        <div className="profile-cards-grid">
          {/* Card 1: Personal Information */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="card-header-icon personal">
                <User size={18} />
              </div>
              <div>
                <h2 className="profile-card-title">Personal Information</h2>
                <span className="profile-card-desc">Your basic contact and identity details</span>
              </div>
            </div>

            <div className="profile-card-body">
              <div className="profile-field-item">
                <span className="field-label">
                  <User size={14} /> Full Name
                </span>
                <span className="field-value highlight">{profile?.name || "—"}</span>
              </div>

              <div className="profile-field-item">
                <span className="field-label">
                  <Phone size={14} /> Mobile Number
                </span>
                <span className="field-value">
                  {profile?.mobile_no ? (profile.mobile_no.startsWith("+") ? profile.mobile_no : `+91 ${profile.mobile_no}`) : "—"}
                </span>
              </div>

              <div className="profile-field-item">
                <span className="field-label">
                  <Phone size={14} /> WhatsApp Number
                </span>
                <span className="field-value">
                  {profile?.whatsapp_no
                    ? (profile.whatsapp_no.startsWith("+") ? profile.whatsapp_no : `+91 ${profile.whatsapp_no}`)
                    : profile?.mobile_no
                    ? (profile.mobile_no.startsWith("+") ? profile.mobile_no : `+91 ${profile.mobile_no}`)
                    : "—"}
                </span>
              </div>

              <div className="profile-field-item">
                <span className="field-label">
                  <Mail size={14} /> Email Address
                </span>
                <span className="field-value">{profile?.email || "Not registered"}</span>
              </div>

              <div className="profile-field-item">
                <span className="field-label">
                  <Calendar size={14} /> Date of Birth
                </span>
                <span className="field-value">{formatDate(profile?.dob)}</span>
              </div>

              <div className="profile-field-item">
                <span className="field-label">
                  <User size={14} /> Gender
                </span>
                <span className="field-value">{profile?.gender || "Not specified"}</span>
              </div>

              <div className="profile-field-item">
                <span className="field-label">
                  <Briefcase size={14} /> Occupation
                </span>
                <span className="field-value">{profile?.occupation || "Not specified"}</span>
              </div>

              <div className="profile-field-item full-width">
                <span className="field-label">
                  <MapPin size={14} /> Residential / Office Address
                </span>
                <span className="field-value address">
                  {profile?.address || "Address details on file with compliance."}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Account Information */}
          <div className="profile-card">
            <div className="profile-card-header">
              <div className="card-header-icon account">
                <CreditCard size={18} />
              </div>
              <div>
                <h2 className="profile-card-title">Account & Compliance</h2>
                <span className="profile-card-desc">Portfolio, tax, and trading credentials</span>
              </div>
            </div>

            <div className="profile-card-body">
              <div className="profile-field-item">
                <span className="field-label">
                  <CreditCard size={14} /> PAN (Tax ID)
                </span>
                <div className="masked-pan-pill">
                  <Lock size={12} />
                  <span>{profile?.pan || profile?.masked_pan || "Not Linked"}</span>
                </div>
              </div>

              <div className="profile-field-item">
                <span className="field-label">
                  <Building size={14} /> Unique Client Code (UCC)
                </span>
                <span className="field-value highlight">{profile?.ucc_no || "—"}</span>
              </div>

              <div className="profile-field-item">
                <span className="field-label">
                  <Layers size={14} /> Client Category
                </span>
                <span className="field-value">
                  {profile?.client_category ? (
                    <span className="category-pill">{profile.client_category}</span>
                  ) : (
                    "Standard"
                  )}
                </span>
              </div>

              <div className="profile-field-item">
                <span className="field-label">
                  <CheckCircle2 size={14} /> Portfolio Status
                </span>
                <span className="field-value status-active">
                  {profile?.status ? profile.status.toUpperCase() : "ACTIVE"}
                </span>
              </div>

              <div className="profile-field-item full-width">
                <span className="field-label">
                  <Briefcase size={14} /> Registered Services
                </span>
                <div className="services-tags-wrap">
                  {profile?.services && profile.services.length > 0 ? (
                    profile.services.map((svc) => (
                      <span key={svc.id || svc.name} className="service-tag">
                        {svc.name}
                      </span>
                    ))
                  ) : (
                    <span className="field-value">Demat & Mutual Fund Portfolio</span>
                  )}
                </div>
              </div>
            </div>

            {/* Security Notice Box */}
            <div className="profile-security-callout">
              <Shield size={20} className="callout-icon" />
              <div>
                <strong>Identity & Account Data Protection</strong>
                <p>
                  Your financial records are strictly protected under 256-bit encryption. To update your PAN or registered mobile number, please contact your relationship manager.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClientPortalLayout>
  );
};

export default ClientProfile;
