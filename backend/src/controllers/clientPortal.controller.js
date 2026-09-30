const ClientPortalService = require("../services/clientPortal.service");
const { sendSuccess, sendError } = require("../utils/response.util");

class ClientPortalController {
  /**
   * Client Login via mobile number.
   * POST /api/client-portal/auth/login or /api/client-portal/login
   */
  static async login(req, res) {
    try {
      const { mobile_no, mobile } = req.body || {};
      const ipAddress = req.ip || (req.socket ? req.socket.remoteAddress : null);
      const userAgent = req.headers["user-agent"] || null;

      const result = await ClientPortalService.login({
        mobileNo: mobile_no || mobile,
        ipAddress,
        userAgent,
      });

      return sendSuccess(res, 200, "Client authenticated successfully.", result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  /**
   * Client Logout & session revocation.
   * POST /api/client-portal/auth/logout or /api/client-portal/logout
   */
  static async logout(req, res) {
    try {
      const token = req.clientToken;
      const client = req.client;
      const ipAddress = req.ip || (req.socket ? req.socket.remoteAddress : null);

      await ClientPortalService.logout({
        token,
        client,
        ipAddress,
      });

      return sendSuccess(res, 200, "Client logged out successfully.");
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  /**
   * Get current client profile.
   * GET /api/client-portal/profile
   */
  static async getProfile(req, res) {
    try {
      // Identity derived strictly from authenticated token / session (IDOR protection)
      const clientId = req.client.id;
      const profile = await ClientPortalService.getProfile(clientId);

      return sendSuccess(res, 200, "Client profile retrieved successfully.", {
        client: profile,
      });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  /**
   * Get client document requirements and status.
   * GET /api/client-portal/documents
   */
  static async getDocuments(req, res) {
    try {
      const clientId = req.client.id;
      const documents = await ClientPortalService.getDocuments(clientId);

      return sendSuccess(res, 200, "Client documents retrieved successfully.", {
        documents,
      });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  /**
   * Upload document against a requirement or general document.
   * POST /api/client-portal/documents/:documentId/upload
   * POST /api/client-portal/documents/upload
   */
  static async uploadDocument(req, res) {
    try {
      const clientId = req.client.id;
      const { documentId } = req.params;
      const { document_type, document_name } = req.body || {};
      const file = req.file;
      const ipAddress = req.ip || (req.socket ? req.socket.remoteAddress : null);

      const result = await ClientPortalService.uploadDocument({
        clientId,
        documentId: documentId || null,
        documentType: document_type || null,
        documentName: document_name || null,
        file,
        ipAddress,
      });

      return sendSuccess(res, 201, "Document uploaded and submitted for review successfully.", {
        document: result,
      });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  /**
   * View or download client's own uploaded document.
   * GET /api/client-portal/documents/:documentId
   */
  static async getDocument(req, res) {
    try {
      const clientId = req.client.id;
      const { documentId } = req.params;
      const isDownload = req.query.download === "true";
      const ipAddress = req.ip || (req.socket ? req.socket.remoteAddress : null);

      const fileResult = await ClientPortalService.getDocumentFile({
        clientId,
        documentId,
        isDownload,
        ipAddress,
      });

      res.setHeader("Content-Type", fileResult.mimeType);
      const disposition = isDownload ? "attachment" : "inline";
      res.setHeader("Content-Disposition", `${disposition}; filename="${fileResult.originalFileName}"`);
      res.setHeader("Content-Length", fileResult.buffer.length);

      return res.send(fileResult.buffer);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }
}

module.exports = ClientPortalController;
