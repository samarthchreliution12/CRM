const pool = require("../config/database");

const DEFAULT_REQUIREMENTS = [
  {
    document_type: "PAN",
    document_name: "PAN Card",
    description: "Copy of PAN card for identity and tax verification",
    required: true,
  },
  {
    document_type: "AADHAAR",
    document_name: "Aadhaar Card",
    description: "Aadhaar card front & back for address verification",
    required: true,
  },
  {
    document_type: "CHEQUE",
    document_name: "Cancelled Cheque / Bank Proof",
    description: "Cancelled cheque or latest bank statement showing account number and IFSC",
    required: true,
  },
  {
    document_type: "SIGNATURE",
    document_name: "Specimen Signature",
    description: "Clear signature on white paper with black or blue pen",
    required: true,
  },
  {
    document_type: "PHOTO",
    document_name: "Passport Photograph",
    description: "Recent passport-size color photograph",
    required: false,
  },
];

class ClientDocumentRequirementModel {
  /**
   * Find all document requirements for a client with joined uploaded document details.
   */
  static async findByClientId(clientId) {
    const query = `
      SELECT
        cdr.id,
        cdr.client_id,
        cdr.document_type,
        cdr.document_name,
        cdr.description,
        cdr.required,
        cdr.status,
        cdr.rejection_reason,
        cdr.uploaded_document_id,
        cdr.created_at,
        cdr.updated_at,
        cd.original_file_name,
        cd.stored_file_name,
        cd.file_size,
        cd.mime_type,
        cd.created_at AS uploaded_at,
        cd.status AS document_status
      FROM client_document_requirements cdr
      LEFT JOIN client_documents cd ON cd.id = cdr.uploaded_document_id
      WHERE cdr.client_id = $1
      ORDER BY cdr.required DESC, cdr.id ASC
    `;
    const result = await pool.query(query, [clientId]);
    return result.rows;
  }

  /**
   * Find requirement by ID.
   */
  static async findById(id) {
    const query = `
      SELECT
        cdr.*,
        cd.original_file_name,
        cd.stored_file_name,
        cd.file_size,
        cd.mime_type,
        cd.created_at AS uploaded_at,
        cd.status AS document_status
      FROM client_document_requirements cdr
      LEFT JOIN client_documents cd ON cd.id = cdr.uploaded_document_id
      WHERE cdr.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find requirement by ID and verify it belongs to clientId (IDOR check).
   */
  static async findByIdAndClientId(id, clientId) {
    const query = `
      SELECT
        cdr.*,
        cd.original_file_name,
        cd.stored_file_name,
        cd.file_size,
        cd.mime_type,
        cd.created_at AS uploaded_at,
        cd.status AS document_status
      FROM client_document_requirements cdr
      LEFT JOIN client_documents cd ON cd.id = cdr.uploaded_document_id
      WHERE cdr.id = $1 AND cdr.client_id = $2
    `;
    const result = await pool.query(query, [id, clientId]);
    return result.rows[0] || null;
  }

  /**
   * Find requirement by Document Type for a specific client.
   */
  static async findByTypeAndClient(documentType, clientId) {
    const query = `
      SELECT *
      FROM client_document_requirements
      WHERE client_id = $1 AND UPPER(document_type) = UPPER($2)
      LIMIT 1
    `;
    const result = await pool.query(query, [clientId, documentType.trim()]);
    return result.rows[0] || null;
  }

  /**
   * Initialize default requirements for a client if not already present.
   * Auto-links existing uploaded documents if any match the type.
   */
  static async initializeDefaultRequirements(clientId) {
    const checkQuery = `SELECT COUNT(*) FROM client_document_requirements WHERE client_id = $1`;
    const checkRes = await pool.query(checkQuery, [clientId]);
    const existingCount = parseInt(checkRes.rows[0].count, 10);

    if (existingCount > 0) {
      return this.findByClientId(clientId);
    }

    // Fetch any documents already uploaded for this client to auto-link
    const existingDocsRes = await pool.query(
      `SELECT id, document_type, status, rejection_reason FROM client_documents WHERE client_id = $1 ORDER BY id DESC`,
      [clientId]
    );
    const existingDocs = existingDocsRes.rows;

    for (const req of DEFAULT_REQUIREMENTS) {
      // Find latest uploaded doc matching this type
      const matchedDoc = existingDocs.find(
        (d) => d.document_type.toUpperCase() === req.document_type.toUpperCase()
      );

      let reqStatus = "PENDING";
      let uploadedDocId = null;
      let rejectionReason = null;

      if (matchedDoc) {
        uploadedDocId = matchedDoc.id;
        if (matchedDoc.status === "VERIFIED") {
          reqStatus = "APPROVED";
        } else if (matchedDoc.status === "REJECTED") {
          reqStatus = "REJECTED";
          rejectionReason = matchedDoc.rejection_reason;
        } else {
          reqStatus = "UNDER_REVIEW";
        }
      }

      await pool.query(
        `
        INSERT INTO client_document_requirements (
          client_id, document_type, document_name, description, required, status, rejection_reason, uploaded_document_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT DO NOTHING
        `,
        [
          clientId,
          req.document_type,
          req.document_name,
          req.description,
          req.required,
          reqStatus,
          rejectionReason,
          uploadedDocId,
        ]
      );
    }

    return this.findByClientId(clientId);
  }

  /**
   * Create a custom document requirement for a client.
   */
  static async create({ clientId, documentType, documentName, description, required = true }) {
    const query = `
      INSERT INTO client_document_requirements (
        client_id, document_type, document_name, description, required, status
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING')
      RETURNING *
    `;
    const values = [
      clientId,
      documentType.toUpperCase(),
      documentName ? documentName.trim() : documentType.toUpperCase(),
      description || null,
      required,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Link an uploaded document to a requirement.
   */
  static async linkUploadedDocument(requirementId, uploadedDocumentId) {
    const query = `
      UPDATE client_document_requirements
      SET
        uploaded_document_id = $1,
        status = 'UNDER_REVIEW',
        rejection_reason = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [uploadedDocumentId, requirementId]);
    return result.rows[0] || null;
  }

  /**
   * Sync requirement status when staff verifies or rejects a document in CRM.
   */
  static async updateStatusByDocumentId(documentId, status, rejectionReason = null) {
    let requirementStatus = "PENDING";
    const upper = String(status).toUpperCase();
    if (upper === "VERIFIED" || upper === "APPROVED") {
      requirementStatus = "APPROVED";
    } else if (upper === "REJECTED") {
      requirementStatus = "REJECTED";
    } else if (upper === "PENDING" || upper === "UNDER_REVIEW") {
      requirementStatus = "UNDER_REVIEW";
    }

    const query = `
      UPDATE client_document_requirements
      SET
        status = $1,
        rejection_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE uploaded_document_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [requirementStatus, rejectionReason, documentId]);
    return result.rows;
  }
}

module.exports = ClientDocumentRequirementModel;
