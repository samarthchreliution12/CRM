const DocumentService = require("../services/document.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class DocumentController {
  static async uploadDocument(req, res) {
    try {
      const { clientId } = req.params;
      const { document_type, document_name } = req.body || {};
      const file = req.file;

      const newDoc = await DocumentService.uploadDocument({
        clientId,
        documentType: document_type,
        documentName: document_name,
        file,
        userId: req.user ? req.user.id : null,
      });

      return sendSuccess(res, 201, "Document uploaded and encrypted successfully.", { document: newDoc });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async listClientDocuments(req, res) {
    try {
      const { clientId } = req.params;
      const { search, status, document_type, page, limit } = req.query || {};

      const result = await DocumentService.listClientDocuments({
        clientId,
        search,
        status,
        document_type,
        page,
        limit,
      });

      return sendSuccess(res, 200, "Client documents retrieved successfully.", {
        documents: result.documents,
        pagination: result.pagination,
      });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async listAllAdminDocuments(req, res) {
    try {
      const { search, status, document_type, client_id, page, limit } = req.query || {};

      const result = await DocumentService.listAllAdminDocuments({
        search,
        status,
        document_type,
        client_id,
        page,
        limit,
      });

      return sendSuccess(res, 200, "All client documents retrieved successfully.", {
        documents: result.documents,
        pagination: result.pagination,
      });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async getDocument(req, res) {
    try {
      const { clientId, documentId } = req.params;
      const download = req.query.download === "true";

      const fileResult = await DocumentService.getDocumentFile({
        clientId,
        documentId,
        userId: req.user ? req.user.id : null,
        isDownload: download,
      });

      res.setHeader("Content-Type", fileResult.mimeType);
      const disposition = download ? "attachment" : "inline";
      res.setHeader("Content-Disposition", `${disposition}; filename="${fileResult.originalFileName}"`);
      res.setHeader("Content-Length", fileResult.buffer.length);

      return res.send(fileResult.buffer);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async updateDocument(req, res) {
    try {
      const { clientId, documentId } = req.params;
      const { document_type, document_name } = req.body || {};
      const file = req.file;

      const updatedDoc = await DocumentService.updateDocument({
        clientId,
        documentId,
        documentType: document_type,
        documentName: document_name,
        file,
        userId: req.user ? req.user.id : null,
      });

      return sendSuccess(res, 200, "Document replaced successfully. It is pending verification.", { document: updatedDoc });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async approveDocument(req, res) {
    try {
      const { documentId } = req.params;

      const approvedDoc = await DocumentService.approveDocument({
        documentId,
        userId: req.user ? req.user.id : null,
      });

      return sendSuccess(res, 200, "Document approved successfully.", { document: approvedDoc });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async rejectDocument(req, res) {
    try {
      const { documentId } = req.params;
      const { rejection_reason } = req.body || {};

      const rejectedDoc = await DocumentService.rejectDocument({
        documentId,
        userId: req.user ? req.user.id : null,
        rejectionReason: rejection_reason,
      });

      return sendSuccess(res, 200, "Document rejected successfully.", { document: rejectedDoc });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async deleteDocument(req, res) {
    try {
      const { clientId, documentId } = req.params;

      await DocumentService.deleteDocument({
        clientId,
        documentId,
        userId: req.user ? req.user.id : null,
      });

      return sendSuccess(res, 200, "Document deleted successfully.");
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }
}

module.exports = DocumentController;
