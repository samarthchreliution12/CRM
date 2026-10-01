const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config/env");
const ClientModel = require("../models/client.model");
const ClientSessionModel = require("../models/clientSession.model");
const ClientDocumentRequirementModel = require("../models/clientDocumentRequirement.model");
const DocumentModel = require("../models/document.model");
const DocumentService = require("./document.service");
const UserModel = require("../models/user.model");
const NotificationService = require("./notification.service");
const AuditService = require("./audit.service");
const pool = require("../config/database");
const WhatsAppSettingsModel = require("../models/whatsappSettings.model");
const ChatterPillarService = require("./chatterpillar.service");
const { encryptBuffer, decryptBuffer } = require("../utils/encryption.util");
const { validateUploadedFile, isValidDocumentType } = require("../utils/fileValidation.util");

// Store encrypted documents safely with fail-safe fallback
function getStorageDir() {
  const fallbackDir = path.resolve(path.join(__dirname, "../../storage/documents"));
  const configuredDir = process.env.DOCUMENT_STORAGE_DIR;
  if (configuredDir) {
    try {
      const resolved = path.resolve(configuredDir);
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }
      return resolved;
    } catch (err) {
      console.warn(
        `[ClientPortalService] Cannot use DOCUMENT_STORAGE_DIR "${configuredDir}": ${err.message}. Falling back to: ${fallbackDir}`
      );
    }
  }
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  return fallbackDir;
}

const STORAGE_DIR = getStorageDir();

class ClientPortalService {
  /**
   * Helper: Mask PAN number (e.g. ABCDE****F).
   */
  static maskPan(pan) {
    if (!pan || typeof pan !== "string") return null;
    const clean = pan.trim();
    if (clean.length < 6) return clean;
    return `${clean.substring(0, 5)}****${clean.substring(clean.length - 1)}`;
  }

  /**
   * Helper: Mask Mobile number for safe UI presentation (e.g. +91 ******1234).
   */
  static maskPhone(phone) {
    if (!phone) return "+91 ******0000";
    const digits = String(phone).replace(/\D/g, "");
    if (digits.length >= 10) {
      const last4 = digits.slice(-4);
      return `+91 ******${last4}`;
    }
    return String(phone);
  }

  /**
   * Send WhatsApp OTP for client login.
   * Checks registered client -> Generates OTP -> Dispatches WhatsApp message.
   */
  static async sendOtp({ mobileNo, ipAddress = null, userAgent = null }) {
    if (!mobileNo) {
      const err = new Error("Registered mobile number is required.");
      err.statusCode = 400;
      throw err;
    }

    const cleanInputDigits = String(mobileNo).replace(/\D/g, "").slice(-10);

    // 1. Locate client by registered mobile/whatsapp
    const client = await ClientModel.findByMobile(mobileNo);
    if (!client) {
      // Must not expose internal client database info
      const err = new Error("We couldn't verify this mobile number. Please check the number and try again.");
      err.statusCode = 404;
      throw err;
    }

    // 2. Validate client active status
    if (client.status !== "active") {
      const err = new Error("Your client account is inactive. Please contact support.");
      err.statusCode = 403;
      throw err;
    }

    const clientMobile = (client.mobile_no || cleanInputDigits).replace(/\D/g, "").slice(-10);

    // 3. Rate limiting & 60-second resend cooldown
    const existingOtpRes = await pool.query(
      "SELECT * FROM client_otps WHERE mobile_no = $1",
      [clientMobile]
    );

    if (existingOtpRes.rows.length > 0) {
      const existing = existingOtpRes.rows[0];
      const elapsedMs = Date.now() - new Date(existing.last_sent_at).getTime();

      if (elapsedMs < 55000) {
        const remainingSec = Math.ceil((60000 - elapsedMs) / 1000);
        const err = new Error(`Please wait ${remainingSec}s before requesting another OTP.`);
        err.statusCode = 429;
        throw err;
      }
    }

    // 4. Generate cryptographically random 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    const now = new Date();

    // 5. Upsert OTP record
    await pool.query(
      `INSERT INTO client_otps (mobile_no, otp_hash, otp_plain, attempts, expires_at, last_sent_at, created_at)
       VALUES ($1, $2, $3, 0, $4, $5, $5)
       ON CONFLICT (mobile_no) DO UPDATE SET
         otp_hash = EXCLUDED.otp_hash,
         otp_plain = EXCLUDED.otp_plain,
         attempts = 0,
         expires_at = EXCLUDED.expires_at,
         last_sent_at = EXCLUDED.last_sent_at`,
      [clientMobile, otpHash, otp, expiresAt, now]
    );

    // 6. Attempt WhatsApp delivery via ChatterPillar
    const maskedMobile = this.maskPhone(client.mobile_no || clientMobile);
    let whatsappDispatched = false;
    let whatsappDeliveryError = null;

    try {
      const settings = await WhatsAppSettingsModel.getSettings();
      if (settings && settings.is_connected) {
        const apiKey = WhatsAppSettingsModel.decryptApiKey(settings);
        if (apiKey) {
          // Check for configured or matching OTP template
          let templateId = process.env.CHATTERPILLAR_OTP_TEMPLATE_ID || settings.otp_template_id;
          let bodyVariables = [otp];
          let buttonVariables = [otp];

          if (!templateId) {
            const authTemplateRes = await pool.query(
              `SELECT template_id, template_name, category, variable_count, buttons 
               FROM whatsapp_templates 
               WHERE status = 'APPROVED' 
                 AND (category ILIKE '%PASSWORD%' OR category ILIKE '%AUTHENTICATION%' OR category ILIKE '%AUTH%' OR category ILIKE '%OTP%' OR template_name ILIKE '%otp%' OR template_name ILIKE '%auth%' OR template_name ILIKE '%login%')
               ORDER BY id DESC
               LIMIT 1`
            );

            if (authTemplateRes.rows.length > 0) {
              const matchedTpl = authTemplateRes.rows[0];
              templateId = matchedTpl.template_id;
              if (matchedTpl.variable_count === 2) {
                bodyVariables = [client.name, otp];
              } else {
                bodyVariables = [otp];
              }
            }
          }

          if (templateId) {
            try {
              await ChatterPillarService.sendTemplateMessage({
                apiKey,
                whatsappAccountId: settings.whatsapp_account_id,
                templateId,
                mobile: clientMobile,
                fullName: client.name,
                bodyVariables,
                buttonVariables,
              });
              whatsappDispatched = true;
            } catch (tplErr) {
              console.warn("[ClientPortalService] WhatsApp template dispatch failed, attempting text fallback:", tplErr.message);
              // Fallback to simple text message (Page 2 of ChatterPillar API documentation)
              try {
                await ChatterPillarService.sendTextMessage({
                  apiKey,
                  whatsappAccountId: settings.whatsapp_account_id,
                  mobile: clientMobile,
                  fullName: client.name,
                  body: `Your verification code for Client Portal is ${otp}. Valid for 10 minutes. Please do not share this code with anyone.`,
                });
                whatsappDispatched = true;
              } catch (txtErr) {
                whatsappDeliveryError = txtErr.message;
              }
            }
          } else {
            // No template configured yet, send via direct text message (Page 2 of ChatterPillar API documentation)
            try {
              await ChatterPillarService.sendTextMessage({
                apiKey,
                whatsappAccountId: settings.whatsapp_account_id,
                mobile: clientMobile,
                fullName: client.name,
                body: `Your verification code for Client Portal is ${otp}. Valid for 10 minutes. Please do not share this code with anyone.`,
              });
              whatsappDispatched = true;
            } catch (txtErr) {
              whatsappDeliveryError = txtErr.message;
            }
          }
        }
      }
    } catch (waErr) {
      console.warn("[ClientPortalService] WhatsApp send warning:", waErr.message);
      whatsappDeliveryError = waErr.message;
    }

    console.log(`[CLIENT PORTAL OTP] Mobile: ${clientMobile} (${client.name}) => OTP: ${otp} | WhatsApp sent: ${whatsappDispatched}`);

    if (!whatsappDispatched && process.env.NODE_ENV === "production") {
      const err = new Error(
        "Unable to deliver WhatsApp verification code. Please check your registered mobile number or contact support."
      );
      err.statusCode = 502;
      err.details = whatsappDeliveryError;
      throw err;
    }

    return {
      success: true,
      message: `We've sent a 6-digit verification code to ${maskedMobile} on WhatsApp.`,
      masked_mobile: maskedMobile,
      expires_in_seconds: 600,
      resend_after_seconds: 60,
      whatsapp_dispatched: whatsappDispatched,
      ...(process.env.NODE_ENV !== "production" ? { dev_otp: otp } : {}),
    };
  }

  /**
   * Verify WhatsApp OTP and establish authenticated client session.
   */
  static async verifyOtp({ mobileNo, otp, rememberMe = true, ipAddress = null, userAgent = null }) {
    if (!mobileNo) {
      const err = new Error("Registered mobile number is required.");
      err.statusCode = 400;
      throw err;
    }

    if (!otp) {
      const err = new Error("Please enter your 6-digit verification code.");
      err.statusCode = 400;
      throw err;
    }

    const cleanInputDigits = String(mobileNo).replace(/\D/g, "").slice(-10);
    const cleanOtp = String(otp).trim();

    // 1. Fetch OTP record
    const otpRes = await pool.query(
      "SELECT * FROM client_otps WHERE mobile_no = $1",
      [cleanInputDigits]
    );

    if (otpRes.rows.length === 0) {
      const err = new Error("No active verification code found for this mobile number. Please request a new OTP.");
      err.statusCode = 400;
      throw err;
    }

    const otpRecord = otpRes.rows[0];

    // 2. Check expiration
    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      await pool.query("DELETE FROM client_otps WHERE mobile_no = $1", [cleanInputDigits]);
      const err = new Error("The verification code has expired. Please request a new OTP.");
      err.statusCode = 400;
      throw err;
    }

    // 3. Check attempt limit
    if (otpRecord.attempts >= 5) {
      await pool.query("DELETE FROM client_otps WHERE mobile_no = $1", [cleanInputDigits]);
      const err = new Error("Too many incorrect attempts. Please request a new OTP.");
      err.statusCode = 429;
      throw err;
    }

    // 4. Verify OTP hash
    const inputHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
    if (inputHash !== otpRecord.otp_hash && cleanOtp !== otpRecord.otp_plain) {
      await pool.query(
        "UPDATE client_otps SET attempts = attempts + 1 WHERE mobile_no = $1",
        [cleanInputDigits]
      );
      const remaining = 5 - (otpRecord.attempts + 1);
      const err = new Error(
        remaining > 0
          ? "Invalid verification code. Please check the code and try again."
          : "Too many incorrect attempts. Please request a new OTP."
      );
      err.statusCode = remaining > 0 ? 400 : 429;
      throw err;
    }

    // 5. Successful match: consume OTP
    await pool.query("DELETE FROM client_otps WHERE mobile_no = $1", [cleanInputDigits]);

    // 6. Find client
    const client = await ClientModel.findByMobile(cleanInputDigits);
    if (!client) {
      const err = new Error("Client account not found.");
      err.statusCode = 404;
      throw err;
    }

    if (client.status !== "active") {
      const err = new Error("Your client account is inactive. Please contact support.");
      err.statusCode = 403;
      throw err;
    }

    // 7. Create secure JWT token for client portal
    const token = jwt.sign(
      {
        client_id: client.id,
        ucc_no: client.ucc_no,
        role: "CLIENT",
        type: "CLIENT_PORTAL",
      },
      config.clientJwtSecret,
      { expiresIn: config.clientJwtExpiresIn }
    );

    const sessionDurationDays = rememberMe ? 30 : 1;
    const expiresAt = new Date(Date.now() + sessionDurationDays * 24 * 60 * 60 * 1000);

    // 8. Save session in client_sessions table
    const session = await ClientSessionModel.create({
      clientId: client.id,
      token,
      ipAddress,
      userAgent,
      expiresAt,
    });

    // 9. Audit log
    await AuditService.log({
      userId: null,
      action: "LOGIN",
      module: "CLIENT_PORTAL",
      entityType: "CLIENT",
      entityId: client.id,
      ipAddress,
      description: `Client ${client.name} (${client.ucc_no}) logged into Client Portal via WhatsApp OTP`,
    });

    return {
      success: true,
      token,
      session_id: session.id,
      expires_at: session.expires_at,
      client: {
        id: client.id,
        ucc_no: client.ucc_no,
        name: client.name,
        mobile_no: client.mobile_no,
        whatsapp_no: client.whatsapp_no,
        email: client.email,
        status: client.status,
      },
    };
  }

  /**
   * 1. Client Login via registered mobile number.
   */
  static async login({ mobileNo, ipAddress = null, userAgent = null }) {
    if (!mobileNo) {
      const err = new Error("Registered mobile number is required.");
      err.statusCode = 400;
      throw err;
    }

    // 1. Locate client by registered mobile/whatsapp
    const client = await ClientModel.findByMobile(mobileNo);
    if (!client) {
      const err = new Error("Client not found with this mobile number. Please check your number or contact support.");
      err.statusCode = 404;
      throw err;
    }

    // 2. Validate client active status
    if (client.status !== "active") {
      const err = new Error("Your client account is inactive. Please contact support.");
      err.statusCode = 403;
      throw err;
    }

    // 3. Create secure JWT token for client portal
    const token = jwt.sign(
      {
        client_id: client.id,
        ucc_no: client.ucc_no,
        role: "CLIENT",
        type: "CLIENT_PORTAL",
      },
      config.clientJwtSecret,
      { expiresIn: config.clientJwtExpiresIn }
    );

    // Compute expiration date (default 24h)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 4. Save session in client_sessions table
    const session = await ClientSessionModel.create({
      clientId: client.id,
      token,
      ipAddress,
      userAgent,
      expiresAt,
    });

    // 5. Audit log
    await AuditService.log({
      userId: null,
      action: "LOGIN",
      module: "CLIENT_PORTAL",
      entityType: "CLIENT",
      entityId: client.id,
      ipAddress,
      description: `Client ${client.name} (${client.ucc_no}) logged into Client Portal`,
    });

    return {
      token,
      session_id: session.id,
      expires_at: session.expires_at,
      client: {
        id: client.id,
        ucc_no: client.ucc_no,
        name: client.name,
        mobile_no: client.mobile_no,
        whatsapp_no: client.whatsapp_no,
        email: client.email,
        status: client.status,
      },
    };
  }

  /**
   * 2. Client Logout & session revocation.
   */
  static async logout({ token, client, ipAddress = null }) {
    if (token) {
      await ClientSessionModel.revokeToken(token);
    }

    if (client) {
      await AuditService.log({
        userId: null,
        action: "LOGOUT",
        module: "CLIENT_PORTAL",
        entityType: "CLIENT",
        entityId: client.id,
        ipAddress,
        description: `Client ${client.name} logged out from Client Portal`,
      });
    }

    return true;
  }

  /**
   * 3. Get Logged-in Client Profile.
   * Derives client strictly from authenticated session.
   */
  static async getProfile(clientId) {
    const client = await ClientModel.findById(clientId);
    if (!client) {
      const err = new Error("Client account not found.");
      err.statusCode = 404;
      throw err;
    }

    const maskedPan = this.maskPan(client.pan);

    return {
      id: client.id,
      ucc_no: client.ucc_no,
      name: client.name,
      business_name: client.business_name || null,
      mobile_no: client.mobile_no,
      whatsapp_no: client.whatsapp_no || null,
      email: client.email || null,
      pan: maskedPan,
      masked_pan: maskedPan,
      dob: client.dob || null,
      gender: client.gender || null,
      occupation: client.occupation || null,
      address: client.address || null,
      client_type: client.client_type || null,
      status: client.status,
      client_status: client.client_status,
      client_category: client.client_category || null,
      services: client.services || [],
      created_at: client.created_at,
    };
  }

  /**
   * 4. Get Client Document Requirements and current status.
   */
  static async getDocuments(clientId) {
    // Ensure default required documents exist
    await ClientDocumentRequirementModel.initializeDefaultRequirements(clientId);

    const requirements = await ClientDocumentRequirementModel.findByClientId(clientId);

    return requirements.map((req) => {
      const isUploaded = !!req.uploaded_document_id;
      const isApproved = req.status === "APPROVED";
      const isRejected = req.status === "REJECTED";
      const isUnderReview = req.status === "UNDER_REVIEW";

      // Allow upload if not yet uploaded, rejected, or pending
      const canUpload = !isApproved;

      return {
        id: req.id,
        document_id: req.uploaded_document_id || null,
        document_name: req.document_name,
        document_type: req.document_type,
        description: req.description,
        required: req.required,
        status: req.status, // 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'
        rejection_reason: req.rejection_reason || null,
        uploaded_at: req.uploaded_at || null,
        original_file_name: req.original_file_name || null,
        file_size: req.file_size || null,
        mime_type: req.mime_type || null,
        can_upload: canUpload,
        can_download: isUploaded,
      };
    });
  }

  /**
   * 5. Upload document for a specific client requirement or direct document upload.
   */
  static async uploadDocument({ clientId, documentId = null, documentType = null, documentName = null, file, ipAddress = null }) {
    const numericClientId = parseInt(clientId, 10);
    if (!numericClientId || isNaN(numericClientId)) {
      const err = new Error("Invalid client ID");
      err.statusCode = 400;
      throw err;
    }

    const client = await ClientModel.findById(numericClientId);
    if (!client) {
      const err = new Error("Client not found");
      err.statusCode = 404;
      throw err;
    }

    // 1. Identify target requirement / document
    let targetRequirement = null;
    let existingDoc = null;

    if (documentId) {
      const numericDocId = parseInt(documentId, 10);

      // Check if documentId is a requirement ID for THIS client
      targetRequirement = await ClientDocumentRequirementModel.findByIdAndClientId(numericDocId, numericClientId);

      if (!targetRequirement) {
        // IDOR check: Is it a requirement belonging to another client?
        const otherReq = await ClientDocumentRequirementModel.findById(numericDocId);
        if (otherReq && otherReq.client_id !== numericClientId) {
          const err = new Error("Forbidden: You do not have permission to upload against this document requirement.");
          err.statusCode = 403;
          throw err;
        }

        // Check if documentId is an existing client_documents ID for THIS client
        const existingDocCheck = await DocumentModel.findById(numericDocId);
        if (existingDocCheck) {
          if (existingDocCheck.client_id !== numericClientId) {
            const err = new Error("Forbidden: You do not have permission to modify this document.");
            err.statusCode = 403;
            throw err;
          }
          existingDoc = existingDocCheck;
        } else {
          const err = new Error("Document requirement not found.");
          err.statusCode = 404;
          throw err;
        }
      } else if (targetRequirement.uploaded_document_id) {
        existingDoc = await DocumentModel.findById(targetRequirement.uploaded_document_id);
      }
    } else if (documentType) {
      // Find requirement by documentType
      targetRequirement = await ClientDocumentRequirementModel.findByTypeAndClient(documentType, numericClientId);
      if (targetRequirement && targetRequirement.uploaded_document_id) {
        existingDoc = await DocumentModel.findById(targetRequirement.uploaded_document_id);
      }
    }

    // 2. Determine effective document type & name
    let effectiveType = targetRequirement ? targetRequirement.document_type : documentType;
    let effectiveName = targetRequirement ? targetRequirement.document_name : documentName;

    if (!effectiveType && existingDoc) {
      effectiveType = existingDoc.document_type;
      effectiveName = existingDoc.document_name;
    }

    effectiveType = effectiveType ? String(effectiveType).toUpperCase() : "OTHER";
    if (!isValidDocumentType(effectiveType)) {
      effectiveType = "OTHER";
    }

    if (effectiveType === "OTHER" && (!effectiveName || !String(effectiveName).trim())) {
      effectiveName = file.originalname;
    }

    // 3. Validate uploaded file (size, extensions, mime, magic bytes)
    validateUploadedFile(file);

    // 4. Encrypt file with AES-256-GCM
    const encryptionResult = encryptBuffer(file.buffer);
    const storedFileName = `doc_${crypto.randomUUID()}.enc`;
    const fullStoragePath = path.join(STORAGE_DIR, storedFileName);

    // Write encrypted binary to disk FIRST
    fs.writeFileSync(fullStoragePath, encryptionResult.encryptedData);

    let savedDoc = null;
    let oldStoragePath = null;
    const isReupload = !!existingDoc;

    try {
      if (existingDoc) {
        oldStoragePath = DocumentService.resolveStoragePath(existingDoc) || existingDoc.storage_path;

        // Replace existing document record
        savedDoc = await DocumentModel.update(existingDoc.id, {
          document_type: effectiveType,
          document_name: effectiveName,
          original_file_name: file.originalname,
          stored_file_name: storedFileName,
          mime_type: file.mimetype,
          file_size: file.size,
          storage_path: fullStoragePath,
          encryption_version: encryptionResult.encryptionVersion,
          encryption_key_id: encryptionResult.keyId,
          iv: encryptionResult.iv,
          auth_tag: encryptionResult.authTag,
          uploaded_by: null, // uploaded by client
        });

        // Unlink old physical file safely
        if (oldStoragePath && fs.existsSync(oldStoragePath)) {
          try {
            fs.unlinkSync(oldStoragePath);
          } catch (e) {
            console.error("Failed to delete replaced file:", e);
          }
        }
      } else {
        // Create new document record in client_documents
        savedDoc = await DocumentModel.create({
          client_id: numericClientId,
          document_type: effectiveType,
          document_name: effectiveName,
          original_file_name: file.originalname,
          stored_file_name: storedFileName,
          mime_type: file.mimetype,
          file_size: file.size,
          storage_path: fullStoragePath,
          encryption_version: encryptionResult.encryptionVersion,
          encryption_key_id: encryptionResult.keyId,
          iv: encryptionResult.iv,
          auth_tag: encryptionResult.authTag,
          uploaded_by: null, // uploaded by client
        });
      }

      // 5. Update or link client_document_requirements
      if (targetRequirement) {
        await ClientDocumentRequirementModel.linkUploadedDocument(targetRequirement.id, savedDoc.id);
      } else {
        // If no requirement existed yet for this type, create requirement record
        const newReq = await ClientDocumentRequirementModel.create({
          clientId: numericClientId,
          documentType: effectiveType,
          documentName: effectiveName,
          description: `Uploaded by client via portal`,
          required: false,
        });
        await ClientDocumentRequirementModel.linkUploadedDocument(newReq.id, savedDoc.id);
      }

      // 6. Audit logging
      await DocumentModel.logAudit({
        user_id: null,
        client_id: numericClientId,
        document_id: savedDoc.id,
        action: isReupload ? "DOCUMENT_REPLACED" : "DOCUMENT_UPLOADED",
      });

      await AuditService.log({
        userId: null,
        action: isReupload ? "REPLACE" : "UPLOAD",
        module: "CLIENT_PORTAL",
        entityType: "DOCUMENT",
        entityId: savedDoc.id,
        ipAddress,
        description: `Client ${client.name} uploaded ${effectiveName || effectiveType} (${file.originalname}) for review`,
      });

      // 7. Internal Notification for CRM Staff / Admins
      try {
        const staffRecipients = await UserModel.findDocumentNotificationRecipients();
        for (const staff of staffRecipients) {
          await NotificationService.createNotification({
            recipientUserId: staff.id,
            type: "DOCUMENT_PENDING",
            title: "Client Document Uploaded",
            message: `Client ${client.name} uploaded ${effectiveName || effectiveType} for review.`,
            entityType: "DOCUMENT",
            entityId: savedDoc.id,
          }).catch((err) => {
            console.error(`Failed to notify staff member #${staff.id}:`, err);
          });
        }
      } catch (notifErr) {
        console.error("Failed to generate staff notifications for client upload:", notifErr);
      }

      return {
        id: targetRequirement ? targetRequirement.id : savedDoc.id,
        document_id: savedDoc.id,
        document_name: effectiveName,
        document_type: effectiveType,
        original_file_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        status: "UNDER_REVIEW",
        uploaded_at: savedDoc.created_at || new Date().toISOString(),
      };
    } catch (dbErr) {
      // Transaction safety: Clean up newly created storage file if DB fails
      if (fs.existsSync(fullStoragePath)) {
        try {
          fs.unlinkSync(fullStoragePath);
        } catch (e) {}
      }
      throw dbErr;
    }
  }

  /**
   * 6. Download / View own uploaded document safely.
   * Enforces strict client isolation (IDOR protection).
   */
  static async getDocumentFile({ clientId, documentId, isDownload = false, ipAddress = null }) {
    const numericClientId = parseInt(clientId, 10);
    const numericDocId = parseInt(documentId, 10);

    if (isNaN(numericClientId) || numericClientId <= 0) {
      const err = new Error("Invalid client ID");
      err.statusCode = 400;
      throw err;
    }

    if (isNaN(numericDocId) || numericDocId <= 0) {
      const err = new Error("Invalid document ID");
      err.statusCode = 400;
      throw err;
    }

    // 1. Resolve document ID from requirement or direct document ID
    let targetDocId = numericDocId;
    const req = await ClientDocumentRequirementModel.findById(numericDocId);
    if (req) {
      if (req.client_id !== numericClientId) {
        const err = new Error("Forbidden: You do not have permission to access this document.");
        err.statusCode = 403;
        throw err;
      }
      if (!req.uploaded_document_id) {
        const err = new Error("No document has been uploaded for this requirement yet.");
        err.statusCode = 404;
        throw err;
      }
      targetDocId = req.uploaded_document_id;
    }

    // 2. Fetch document record
    const doc = await DocumentModel.findById(targetDocId);
    if (!doc) {
      const err = new Error("Document not found");
      err.statusCode = 404;
      throw err;
    }

    // 3. Strict Client Isolation Check (Prevent IDOR)
    if (doc.client_id !== numericClientId) {
      const err = new Error("Forbidden: You do not have permission to access this document.");
      err.statusCode = 403;
      throw err;
    }

    // 4. Resolve storage path
    const actualStoragePath = DocumentService.resolveStoragePath(doc);
    if (!actualStoragePath) {
      const err = new Error("Document file is not available on server storage. Please re-upload.");
      err.statusCode = 404;
      throw err;
    }

    // 5. Read & decrypt buffer
    const encryptedData = fs.readFileSync(actualStoragePath);
    let decryptedBuffer;
    try {
      decryptedBuffer = decryptBuffer(encryptedData, doc.iv, doc.auth_tag);
    } catch (decryptErr) {
      console.error("Client Portal Decryption Error:", decryptErr);
      const err = new Error("Failed to decrypt document file.");
      err.statusCode = 500;
      throw err;
    }

    // 6. Audit log
    await DocumentModel.logAudit({
      user_id: null,
      client_id: numericClientId,
      document_id: doc.id,
      action: isDownload ? "DOCUMENT_DOWNLOADED" : "DOCUMENT_VIEWED",
    });

    await AuditService.log({
      userId: null,
      action: isDownload ? "DOWNLOAD" : "VIEW",
      module: "CLIENT_PORTAL",
      entityType: "DOCUMENT",
      entityId: doc.id,
      ipAddress,
      description: `Client downloaded document ${doc.document_type} (${doc.original_file_name})`,
    });

    return {
      buffer: decryptedBuffer,
      mimeType: doc.mime_type,
      originalFileName: doc.original_file_name,
    };
  }
}

module.exports = ClientPortalService;
