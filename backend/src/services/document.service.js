const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const DocumentModel = require("../models/document.model");
const ClientModel = require("../models/client.model");
const AuditService = require("./audit.service");
const { encryptBuffer, decryptBuffer } = require("../utils/encryption.util");
const { isValidDocumentType, validateUploadedFile } = require("../utils/fileValidation.util");

const STORAGE_DIR = path.join(__dirname, "../../storage/documents");

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

class DocumentService {
  /**
   * Upload and encrypt a new document for a client.
   */
  static async uploadDocument({ clientId, documentType, documentName, file, userId }) {
    const numericClientId = parseInt(clientId, 10);
    if (isNaN(numericClientId) || numericClientId <= 0) {
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

    if (!isValidDocumentType(documentType)) {
      const err = new Error(`Invalid document_type '${documentType}'. Allowed values: AADHAAR, PAN, SIGNATURE, CHEQUE, PHOTO, OTHER.`);
      err.statusCode = 400;
      throw err;
    }

    // Validation for OTHER document type: document_name is required
    const docTypeUpper = String(documentType).toUpperCase();
    let finalDocName = null;
    if (docTypeUpper === "OTHER") {
      if (!documentName || !documentName.trim()) {
        const err = new Error("Document name is required when document type is Other.");
        err.statusCode = 400;
        throw err;
      }
      finalDocName = documentName.trim();
    }

    validateUploadedFile(file);

    // Encrypt file buffer in memory
    const encryptionResult = encryptBuffer(file.buffer);

    // Generate random server-side storage filename
    const storedFileName = `doc_${crypto.randomUUID()}.enc`;
    const fullStoragePath = path.join(STORAGE_DIR, storedFileName);

    // Write encrypted binary to disk FIRST
    try {
      fs.writeFileSync(fullStoragePath, encryptionResult.encryptedData);
    } catch (fsErr) {
      console.error("Storage Error:", fsErr);
      const err = new Error("Failed to write encrypted file to storage.");
      err.statusCode = 500;
      throw err;
    }

    // Save DB metadata
    try {
      const newDoc = await DocumentModel.create({
        client_id: numericClientId,
        document_type: docTypeUpper,
        document_name: finalDocName,
        original_file_name: file.originalname,
        stored_file_name: storedFileName,
        mime_type: file.mimetype,
        file_size: file.size,
        storage_path: fullStoragePath,
        encryption_version: encryptionResult.encryptionVersion,
        encryption_key_id: encryptionResult.keyId,
        iv: encryptionResult.iv,
        auth_tag: encryptionResult.authTag,
        uploaded_by: userId,
      });

      // Audit log
      await DocumentModel.logAudit({
        user_id: userId,
        client_id: numericClientId,
        document_id: newDoc.id,
        action: "DOCUMENT_UPLOADED",
      });

      await AuditService.log({
        userId,
        action: "UPLOAD",
        module: "DOCUMENTS",
        entityType: "DOCUMENT",
        entityId: newDoc.id,
        description: `Uploaded document ${newDoc.document_type} (${file.originalname}) for client #${numericClientId}`,
        newValues: {
          document_type: newDoc.document_type,
          document_name: newDoc.document_name,
          original_file_name: file.originalname,
          file_size: file.size,
        },
      });

      return newDoc;
    } catch (dbErr) {
      // Transaction safety: Clean up physical file if DB creation fails
      if (fs.existsSync(fullStoragePath)) {
        try { fs.unlinkSync(fullStoragePath); } catch (e) {}
      }
      throw dbErr;
    }
  }

  /**
   * List documents for a specific client.
   */
  static async listClientDocuments({ clientId, search = "", status = "", document_type = "", page = 1, limit = 10 }) {
    const numericClientId = parseInt(clientId, 10);
    if (isNaN(numericClientId) || numericClientId <= 0) {
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

    return DocumentModel.findByClientId(numericClientId, { search, status, document_type, page, limit });
  }

  /**
   * List all documents across clients for Admin/Staff document management.
   */
  static async listAllAdminDocuments({ search = "", status = "", document_type = "", client_id = "", page = 1, limit = 10 }) {
    return DocumentModel.findAllAdmin({ search, status, document_type, client_id, page, limit });
  }

  /**
   * Fetch and decrypt document file content for view/download.
   */
  static async getDocumentFile({ clientId, documentId, userId, isDownload = false }) {
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

    const client = await ClientModel.findById(numericClientId);
    if (!client) {
      const err = new Error("Client not found");
      err.statusCode = 404;
      throw err;
    }

    const doc = await DocumentModel.findById(numericDocId);
    if (!doc) {
      const err = new Error("Document not found");
      err.statusCode = 404;
      throw err;
    }

    // Client isolation check
    if (doc.client_id !== numericClientId) {
      const err = new Error("Unauthorized access to document for this client.");
      err.statusCode = 403;
      throw err;
    }

    if (!fs.existsSync(doc.storage_path)) {
      const err = new Error("Physical storage file not found.");
      err.statusCode = 404;
      throw err;
    }

    // Read encrypted binary file from disk
    const encryptedData = fs.readFileSync(doc.storage_path);

    // Decrypt in memory
    let decryptedBuffer;
    try {
      decryptedBuffer = decryptBuffer(encryptedData, doc.iv, doc.auth_tag);
    } catch (decryptErr) {
      console.error("Decryption Error:", decryptErr);
      const err = new Error("Failed to decrypt document file.");
      err.statusCode = 500;
      throw err;
    }

    // Audit log
    await DocumentModel.logAudit({
      user_id: userId,
      client_id: numericClientId,
      document_id: numericDocId,
      action: isDownload ? "DOCUMENT_DOWNLOADED" : "DOCUMENT_VIEWED",
    });

    if (isDownload) {
      await AuditService.log({
        userId,
        action: "DOWNLOAD",
        module: "DOCUMENTS",
        entityType: "DOCUMENT",
        entityId: numericDocId,
        description: `Downloaded document ${doc.document_type} (${doc.original_file_name}) for client #${numericClientId}`,
      });
    }

    return {
      buffer: decryptedBuffer,
      mimeType: doc.mime_type,
      originalFileName: doc.original_file_name,
    };
  }

  /**
   * Replace/update an existing document for a client.
   * Safety rule: New file MUST be encrypted and stored FIRST. Old file is unlinked ONLY AFTER successful DB update.
   * Key Status Rule: Status always resets to PENDING for review.
   */
  static async updateDocument({ clientId, documentId, documentType, documentName, file, userId }) {
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

    const doc = await DocumentModel.findById(numericDocId);
    if (!doc) {
      const err = new Error("Document not found");
      err.statusCode = 404;
      throw err;
    }

    // Client isolation check
    if (doc.client_id !== numericClientId) {
      const err = new Error("Unauthorized access to document for this client.");
      err.statusCode = 403;
      throw err;
    }

    const docTypeUpper = documentType ? String(documentType).toUpperCase() : String(doc.document_type).toUpperCase();
    if (!isValidDocumentType(docTypeUpper)) {
      const err = new Error(`Invalid document_type '${docTypeUpper}'. Allowed values: AADHAAR, PAN, SIGNATURE, CHEQUE, PHOTO, OTHER.`);
      err.statusCode = 400;
      throw err;
    }

    let finalDocName = doc.document_name;
    if (docTypeUpper === "OTHER") {
      const nameVal = documentName !== undefined ? documentName : doc.document_name;
      if (!nameVal || !String(nameVal).trim()) {
        const err = new Error("Document name is required when document type is Other.");
        err.statusCode = 400;
        throw err;
      }
      finalDocName = String(nameVal).trim();
    } else {
      finalDocName = null;
    }

    let updateData = {
      document_type: docTypeUpper,
      document_name: finalDocName,
    };

    let oldStoragePath = null;
    let newStoragePath = null;

    if (file) {
      validateUploadedFile(file);

      const encryptionResult = encryptBuffer(file.buffer);
      const newStoredFileName = `doc_${crypto.randomUUID()}.enc`;
      newStoragePath = path.join(STORAGE_DIR, newStoredFileName);

      // Write new encrypted file FIRST
      fs.writeFileSync(newStoragePath, encryptionResult.encryptedData);

      oldStoragePath = doc.storage_path;

      updateData = {
        ...updateData,
        original_file_name: file.originalname,
        stored_file_name: newStoredFileName,
        mime_type: file.mimetype,
        file_size: file.size,
        storage_path: newStoragePath,
        encryption_version: encryptionResult.encryptionVersion,
        encryption_key_id: encryptionResult.keyId,
        iv: encryptionResult.iv,
        auth_tag: encryptionResult.authTag,
        uploaded_by: userId,
      };
    }

    try {
      const updatedDoc = await DocumentModel.update(numericDocId, updateData);

      // Unlink old physical file ONLY AFTER successful DB update
      if (oldStoragePath && fs.existsSync(oldStoragePath)) {
        try { fs.unlinkSync(oldStoragePath); } catch (e) {}
      }

      // Audit log
      await DocumentModel.logAudit({
        user_id: userId,
        client_id: numericClientId,
        document_id: numericDocId,
        action: "DOCUMENT_REPLACED",
      });

      await AuditService.log({
        userId,
        action: "REPLACE",
        module: "DOCUMENTS",
        entityType: "DOCUMENT",
        entityId: numericDocId,
        description: `Replaced document ${updatedDoc.document_type} for client #${numericClientId}`,
        oldValues: { document_type: doc.document_type, original_file_name: doc.original_file_name },
        newValues: { document_type: updatedDoc.document_type, original_file_name: updatedDoc.original_file_name },
      });

      return updatedDoc;
    } catch (dbErr) {
      // Transaction safety: Clean up newly written file if DB update fails, keeping old file intact
      if (newStoragePath && fs.existsSync(newStoragePath)) {
        try { fs.unlinkSync(newStoragePath); } catch (e) {}
      }
      throw dbErr;
    }
  }

  /**
   * Approve a PENDING document.
   */
  static async approveDocument({ documentId, userId }) {
    const numericDocId = parseInt(documentId, 10);
    if (isNaN(numericDocId) || numericDocId <= 0) {
      const err = new Error("Invalid document ID");
      err.statusCode = 400;
      throw err;
    }

    const doc = await DocumentModel.findById(numericDocId);
    if (!doc) {
      const err = new Error("Document not found");
      err.statusCode = 404;
      throw err;
    }

    if (String(doc.status).toUpperCase() !== "PENDING") {
      const err = new Error(`Only PENDING documents can be approved. Current status: '${doc.status}'.`);
      err.statusCode = 400;
      throw err;
    }

    const approvedDoc = await DocumentModel.approve(numericDocId, userId);

    // Audit log
    await DocumentModel.logAudit({
      user_id: userId,
      client_id: doc.client_id,
      document_id: numericDocId,
      action: "DOCUMENT_APPROVED",
    });

    await AuditService.log({
      userId,
      action: "APPROVE",
      module: "DOCUMENTS",
      entityType: "DOCUMENT",
      entityId: numericDocId,
      description: `Approved document #${numericDocId} (${doc.document_type}) for client #${doc.client_id}`,
      oldValues: { status: doc.status },
      newValues: { status: approvedDoc.status },
    });

    return approvedDoc;
  }

  /**
   * Reject a PENDING document.
   */
  static async rejectDocument({ documentId, userId, rejectionReason }) {
    const numericDocId = parseInt(documentId, 10);
    if (isNaN(numericDocId) || numericDocId <= 0) {
      const err = new Error("Invalid document ID");
      err.statusCode = 400;
      throw err;
    }

    const doc = await DocumentModel.findById(numericDocId);
    if (!doc) {
      const err = new Error("Document not found");
      err.statusCode = 404;
      throw err;
    }

    if (String(doc.status).toUpperCase() !== "PENDING") {
      const err = new Error(`Only PENDING documents can be rejected. Current status: '${doc.status}'.`);
      err.statusCode = 400;
      throw err;
    }

    const reasonStr = rejectionReason ? String(rejectionReason).trim() : "Invalid document";

    const rejectedDoc = await DocumentModel.reject(numericDocId, userId, reasonStr);

    // Audit log
    await DocumentModel.logAudit({
      user_id: userId,
      client_id: doc.client_id,
      document_id: numericDocId,
      action: "DOCUMENT_REJECTED",
    });

    await AuditService.log({
      userId,
      action: "REJECT",
      module: "DOCUMENTS",
      entityType: "DOCUMENT",
      entityId: numericDocId,
      description: `Rejected document #${numericDocId} (${doc.document_type}) for client #${doc.client_id}: ${reasonStr}`,
      oldValues: { status: doc.status },
      newValues: { status: rejectedDoc.status, rejection_reason: reasonStr },
    });

    return rejectedDoc;
  }

  /**
   * Delete a document.
   */
  static async deleteDocument({ clientId, documentId, userId }) {
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

    const doc = await DocumentModel.findById(numericDocId);
    if (!doc) {
      const err = new Error("Document not found");
      err.statusCode = 404;
      throw err;
    }

    // Client isolation check
    if (doc.client_id !== numericClientId) {
      const err = new Error("Unauthorized access to document for this client.");
      err.statusCode = 403;
      throw err;
    }

    // Audit log BEFORE deleting database record
    await DocumentModel.logAudit({
      user_id: userId,
      client_id: numericClientId,
      document_id: numericDocId,
      action: "DOCUMENT_DELETED",
    });

    await AuditService.log({
      userId,
      action: "DELETE",
      module: "DOCUMENTS",
      entityType: "DOCUMENT",
      entityId: numericDocId,
      description: `Deleted document ${doc.document_type} (${doc.original_file_name}) for client #${numericClientId}`,
    });

    // Delete physical encrypted storage file
    if (fs.existsSync(doc.storage_path)) {
      try {
        fs.unlinkSync(doc.storage_path);
      } catch (fsErr) {
        console.error("Failed to delete physical file:", fsErr);
      }
    }

    // Delete DB record
    await DocumentModel.delete(numericDocId);

    return true;
  }
}

module.exports = DocumentService;
