const pool = require("../config/database");
const ClientModel = require("../models/client.model");
const ClientTypeModel = require("../models/clientType.model");
const AuditService = require("./audit.service");

class ClientService {
  static async listClients(query) {
    return ClientModel.findAll(query);
  }

  static async searchClients(queryStr) {
    if (!queryStr || typeof queryStr !== "string" || !queryStr.trim()) {
      return [];
    }

    const searchTerm = `%${queryStr.trim()}%`;
    const query = `
      SELECT c.id, c.name, c.pan, c.mobile_no, c.ucc_no, c.email, c.status
      FROM clients c
      WHERE (
        c.name ILIKE $1 OR
        c.pan ILIKE $1 OR
        c.mobile_no ILIKE $1 OR
        c.ucc_no ILIKE $1
      )
      ORDER BY c.name ASC
      LIMIT 10
    `;

    const result = await pool.query(query, [searchTerm]);
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      pan: row.pan,
      mobile_no: row.mobile_no,
      ucc_no: row.ucc_no,
      email: row.email,
      status: row.status,
    }));
  }

  static async getClientById(id) {
    const client = await ClientModel.findById(id);
    if (!client) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }
    return client;
  }

  static async createClient(data, context = {}) {
    // 1. Check duplicate UCC
    const existingUcc = await ClientModel.findByUcc(data.ucc_no);
    if (existingUcc) {
      const error = new Error("This UCC number is already in use.");
      error.statusCode = 409;
      error.errors = [{ field: "ucc_no", message: "This UCC number is already in use." }];
      throw error;
    }

    // 2. Check client_type_id exists
    const clientType = await ClientTypeModel.findById(data.client_type_id);
    if (!clientType) {
      const error = new Error(`Invalid client_type_id: Client type ID ${data.client_type_id} does not exist`);
      error.statusCode = 400;
      error.errors = [{ field: "client_type_id", message: "Invalid client_type_id" }];
      throw error;
    }

    try {
      const createdClient = await ClientModel.create(data);

      await AuditService.log({
        userId: context.userId,
        action: "CREATE",
        module: "CLIENTS",
        entityType: "CLIENT",
        entityId: createdClient.id,
        description: `Created client: ${createdClient.name} (UCC: ${createdClient.ucc_no})`,
        newValues: createdClient,
        ipAddress: context.ipAddress,
      });

      return createdClient;
    } catch (err) {
      if (err.code === "23505" || (err.message && err.message.includes("clients_ucc_no_key"))) {
        const error = new Error("This UCC number is already in use.");
        error.statusCode = 409;
        error.errors = [{ field: "ucc_no", message: "This UCC number is already in use." }];
        throw error;
      }
      throw err;
    }
  }

  static async updateClient(id, data, context = {}) {
    const existing = await ClientModel.findById(id);
    if (!existing) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    // Check duplicate UCC if provided
    if (data.ucc_no && data.ucc_no.trim().toLowerCase() !== existing.ucc_no.toLowerCase()) {
      const duplicateUcc = await ClientModel.findByUcc(data.ucc_no);
      if (duplicateUcc) {
        const error = new Error("This UCC number is already in use.");
        error.statusCode = 409;
        error.errors = [{ field: "ucc_no", message: "This UCC number is already in use." }];
        throw error;
      }
    }

    // Check client_type_id if provided
    if (data.client_type_id) {
      const clientType = await ClientTypeModel.findById(data.client_type_id);
      if (!clientType) {
        const error = new Error(`Invalid client_type_id: Client type ID ${data.client_type_id} does not exist`);
        error.statusCode = 400;
        error.errors = [{ field: "client_type_id", message: "Invalid client_type_id" }];
        throw error;
      }
    }

    try {
      const updated = await ClientModel.update(id, data);
      const { oldValues, newValues } = AuditService.calculateDiff(existing, updated);

      if (oldValues || newValues) {
        await AuditService.log({
          userId: context.userId,
          action: "UPDATE",
          module: "CLIENTS",
          entityType: "CLIENT",
          entityId: updated.id,
          description: `Updated client: ${updated.name}`,
          oldValues,
          newValues,
          ipAddress: context.ipAddress,
        });
      }

      return updated;
    } catch (err) {
      if (err.code === "23505" || (err.message && err.message.includes("clients_ucc_no_key"))) {
        const error = new Error("This UCC number is already in use.");
        error.statusCode = 409;
        error.errors = [{ field: "ucc_no", message: "This UCC number is already in use." }];
        throw error;
      }
      throw err;
    }
  }

  static async updateClientCategory(id, category, context = {}) {
    const existing = await ClientModel.findById(id);
    if (!existing) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    const updated = await ClientModel.update(id, { client_category: category });

    await AuditService.log({
      userId: context.userId,
      action: "UPDATE",
      module: "CLIENTS",
      entityType: "CLIENT",
      entityId: existing.id,
      description: `Updated category for client '${existing.name}' from '${existing.client_category || 'NONE'}' to '${updated.client_category}'`,
      oldValues: { client_category: existing.client_category },
      newValues: { client_category: updated.client_category },
      ipAddress: context.ipAddress,
    });

    return updated;
  }

  static async updateClientStatus(id, status, context = {}) {

    const existing = await ClientModel.findById(id);
    if (!existing) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    const updated = await ClientModel.updateStatus(id, status);

    await AuditService.log({
      userId: context.userId,
      action: "UPDATE",
      module: "CLIENTS",
      entityType: "CLIENT",
      entityId: existing.id,
      description: `Updated status for client '${existing.name}' from '${existing.status}' to '${updated.status}'`,
      oldValues: { status: existing.status },
      newValues: { status: updated.status },
      ipAddress: context.ipAddress,
    });

    return updated;
  }

  static async deleteClient(id, context = {}) {
    const existing = await ClientModel.findById(id);
    if (!existing) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    await ClientModel.delete(id);

    await AuditService.log({
      userId: context.userId,
      action: "DELETE",
      module: "CLIENTS",
      entityType: "CLIENT",
      entityId: existing.id,
      description: `Deleted client: ${existing.name} (UCC: ${existing.ucc_no})`,
      ipAddress: context.ipAddress,
    });

    return true;
  }

  static generateCSV(rows) {
    const headers = [
      "Client ID",
      "UCC Number",
      "Client Name",
      "Business Name",
      "Client Type",
      "Mobile Number",
      "WhatsApp Number",
      "Email",
      "PAN",
      "Date of Birth",
      "Gender",
      "Occupation",
      "Status",
      "Created At",
    ];

    const escapeCell = (val) => {
      if (val === null || val === undefined) return "";
      let str = String(val);
      if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [headers.join(",")];

    for (const row of rows) {
      let dobStr = "";
      if (row.dob) {
        try {
          dobStr = new Date(row.dob).toISOString().split("T")[0];
        } catch (e) {
          dobStr = String(row.dob);
        }
      }

      let createdAtStr = "";
      if (row.created_at) {
        try {
          createdAtStr = new Date(row.created_at).toISOString().split("T")[0];
        } catch (e) {
          createdAtStr = String(row.created_at);
        }
      }

      const line = [
        escapeCell(row.id),
        escapeCell(row.ucc_no),
        escapeCell(row.name),
        escapeCell(row.business_name),
        escapeCell(row.client_type_name),
        escapeCell(row.mobile_no),
        escapeCell(row.whatsapp_no),
        escapeCell(row.email),
        escapeCell(row.pan),
        escapeCell(dobStr),
        escapeCell(row.gender),
        escapeCell(row.occupation),
        escapeCell(row.status),
        escapeCell(createdAtStr),
      ].join(",");

      lines.push(line);
    }

    return lines.join("\n");
  }

  static async exportClients({ client_ids, filters, format }, context = {}) {
    if (format !== undefined && format !== null && typeof format === "string") {
      if (format.trim().toLowerCase() !== "csv") {
        const error = new Error("Invalid export format. Only 'csv' is supported.");
        error.statusCode = 400;
        throw error;
      }
    }

    if (client_ids !== undefined && client_ids !== null) {
      if (!Array.isArray(client_ids)) {
        const error = new Error("client_ids must be an array");
        error.statusCode = 400;
        throw error;
      }
    }

    const rows = await ClientModel.findForExport({ client_ids, filters });

    if (!rows || rows.length === 0) {
      const error = new Error("No clients found matching the export criteria");
      error.statusCode = 404;
      throw error;
    }

    const csvContent = this.generateCSV(rows);
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `clients-export-${currentDate}.csv`;

    await AuditService.log({
      userId: context.userId,
      action: "EXPORT",
      module: "CLIENTS",
      entityType: "CLIENT",
      description: `Exported clients CSV (${rows.length} records)`,
      ipAddress: context.ipAddress,
    });

    return {
      csvContent,
      filename,
      count: rows.length,
    };
  }

  /**
   * Validate CSV rows against business rules, database constraints, and schema.
   */
  static async validateImport(csvText) {
    const { parseCSV } = require("../utils/csv.util");
    const ClientTypeModel = require("../models/clientType.model");
    const ClientServiceModel = require("../models/clientService.model");

    const dataRows = parseCSV(csvText);
    if (!dataRows || dataRows.length === 0) {
      const error = new Error("Uploaded CSV file is empty or contains no valid rows.");
      error.statusCode = 400;
      throw error;
    }

    // Pre-fetch DB metadata for fast bulk validation
    const dbUccSet = await ClientModel.getAllUccNumbers();
    const typeRes = await pool.query(`SELECT id, name FROM client_types WHERE status = 'active'`);
    const clientTypeMap = new Map();
    typeRes.rows.forEach((r) => {
      clientTypeMap.set(r.name.trim().toLowerCase(), r.id);
      clientTypeMap.set(r.id.toString(), r.id);
    });

    const serviceRes = await pool.query(`SELECT id, name FROM client_services WHERE status = 'active'`);
    const serviceMap = new Map();
    serviceRes.rows.forEach((r) => serviceMap.set(r.name.trim().toLowerCase(), r.id));

    const csvUccSet = new Set();
    const validRows = [];
    const errorsList = [];
    let duplicateRowsCount = 0;
    let invalidRowsCount = 0;

    for (const row of dataRows) {
      const rowNum = row._rowNumber || 2;
      const ucc_no = (row.ucc_no || row.ucc || "").toString().trim();
      const name = (row.name || row.client_name || "").toString().trim();
      const business_name = (row.business_name || row.company_name || "").toString().trim();
      const mobile_no = (row.mobile_no || row.mobile || "").toString().trim();
      const whatsapp_no = (row.whatsapp_no || row.whatsapp || "").toString().trim();
      const email = (row.email || "").toString().trim();
      const pan = (row.pan || "").toString().trim();
      const dobRaw = (row.dob || row.date_of_birth || "").toString().trim();
      const gender = (row.gender || "").toString().trim();
      const occupation = (row.occupation || "").toString().trim();
      const clientTypeRaw = (row.client_type || row.client_type_id || row.type || "").toString().trim();
      const statusRaw = (row.status || "active").toString().trim();
      const clientStatusRaw = (row.client_status || row.classification || "").toString().trim();
      const clientCategoryRaw = (row.client_category || row.category || "").toString().trim();
      const servicesRaw = (row.services || row.service || "").toString().trim();

      const rowErrors = [];
      let isDuplicate = false;

      // 1. Validate UCC Number
      if (!ucc_no) {
        rowErrors.push("UCC Number is required");
      } else {
        const cleanUcc = ucc_no.toUpperCase();
        if (csvUccSet.has(cleanUcc)) {
          rowErrors.push("Duplicate UCC number in CSV file");
          isDuplicate = true;
        } else if (dbUccSet.has(cleanUcc)) {
          rowErrors.push("UCC number already exists in database");
          isDuplicate = true;
        } else {
          csvUccSet.add(cleanUcc);
        }
      }

      // 2. Validate Client Name
      if (!name) {
        rowErrors.push("Client Name is required");
      }

      // 3. Validate PAN Number
      if (!pan) {
        rowErrors.push("PAN number is required");
      } else {
        const panClean = pan.toUpperCase();
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panClean)) {
          rowErrors.push("Invalid PAN number format (e.g. ABCDE1234F)");
        }
      }

      // 4. Validate DOB (Mandatory & 18+ years old)
      let formattedDob = null;
      if (!dobRaw) {
        rowErrors.push("Date of Birth is required");
      } else {
        // Try parsing DD/MM/YYYY or YYYY-MM-DD
        let parts = dobRaw.split(/[\/\-\.]/);
        let dobDate;
        if (parts.length === 3 && parts[2].length === 4) {
          // DD/MM/YYYY
          dobDate = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`);
        } else {
          dobDate = new Date(dobRaw);
        }

        if (isNaN(dobDate.getTime())) {
          rowErrors.push("Invalid Date of Birth format");
        } else if (dobDate > new Date()) {
          rowErrors.push("Date of Birth cannot be in the future");
        } else {
          formattedDob = dobDate.toISOString().split("T")[0];
          const { isAtLeast18YearsOld } = require("../validators/client.validator");
          if (!isAtLeast18YearsOld(formattedDob)) {
            rowErrors.push("Client must be at least 18 years old.");
          }
        }
      }

      // 5. Validate Email (Mandatory & Valid format)
      if (!email) {
        rowErrors.push("Email address is required");
      } else {
        const { isValidEmail } = require("../validators/client.validator");
        if (!isValidEmail(email)) {
          rowErrors.push("Please enter a valid email address.");
        }
      }

      // 6. Validate Mobile Number (Mandatory & Valid format)
      if (!mobile_no) {
        rowErrors.push("Mobile number is required");
      } else {
        const { isValidPhoneNumber } = require("../validators/client.validator");
        if (!isValidPhoneNumber(mobile_no)) {
          rowErrors.push("Please enter a valid mobile number.");
        }
      }

      // 7. Validate WhatsApp Number (Mandatory & Valid format)
      if (!whatsapp_no) {
        rowErrors.push("WhatsApp number is required");
      } else {
        const { isValidPhoneNumber } = require("../validators/client.validator");
        if (!isValidPhoneNumber(whatsapp_no)) {
          rowErrors.push("Please enter a valid WhatsApp number.");
        }
      }

      // 8. Validate Client Type (Mandatory)
      let clientTypeId = null;
      if (!clientTypeRaw) {
        rowErrors.push("Client Type is required");
      } else {
        const typeKey = clientTypeRaw.toLowerCase();
        if (clientTypeMap.has(typeKey)) {
          clientTypeId = clientTypeMap.get(typeKey);
        } else {
          rowErrors.push(`Invalid Client Type: '${clientTypeRaw}' does not exist`);
        }
      }

      // 9. Validate Services (pipe |, comma, or JSON array format like ["Demat", "Trading"])
      const serviceIds = [];
      if (servicesRaw) {
        let serviceNames = [];
        if (servicesRaw.startsWith("[")) {
          try {
            const parsed = JSON.parse(servicesRaw);
            if (Array.isArray(parsed)) {
              serviceNames = parsed.map((s) => String(s).trim()).filter(Boolean);
            }
          } catch (e) {
            // fallback if JSON parse fails
          }
        }
        if (serviceNames.length === 0) {
          serviceNames = servicesRaw
            .split(/[|;,]/)
            .map((s) => s.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, ""))
            .filter(Boolean);
        }

        for (const sName of serviceNames) {
          const sKey = sName.toLowerCase();
          if (serviceMap.has(sKey)) {
            serviceIds.push(serviceMap.get(sKey));
          } else {
            rowErrors.push(`Invalid Service: '${sName}' does not exist`);
          }
        }
      }

      // 10. Validate Status
      const statusClean = statusRaw.toLowerCase();
      if (statusClean && !["active", "inactive"].includes(statusClean)) {
        rowErrors.push("Status must be 'active' or 'inactive'");
      }

      // 11. Validate Client Status (CLIENT / NON_CLIENT)
      let normClientStatus = "CLIENT";
      if (clientStatusRaw) {
        const csUpper = clientStatusRaw.toUpperCase();
        if (["CLIENT", "NON_CLIENT"].includes(csUpper)) {
          normClientStatus = csUpper;
        } else {
          rowErrors.push("Client status must be 'CLIENT' or 'NON_CLIENT'");
        }
      }

      // 12. Validate Client Category (BRONZE, SILVER, GOLD, PLATINUM)
      let normClientCategory = null;
      if (clientCategoryRaw) {
        const catUpper = clientCategoryRaw.toUpperCase();
        if (["BRONZE", "SILVER", "GOLD", "PLATINUM"].includes(catUpper)) {
          normClientCategory = catUpper;
        } else {
          rowErrors.push("Client category must be 'BRONZE', 'SILVER', 'GOLD', or 'PLATINUM'");
        }
      }

      if (rowErrors.length > 0) {
        if (isDuplicate) {
          duplicateRowsCount++;
        } else {
          invalidRowsCount++;
        }
        errorsList.push({
          row: rowNum,
          ucc_no: ucc_no || "N/A",
          name: name || "N/A",
          error: rowErrors.join("; "),
          raw_data: row,
        });
      } else {
        validRows.push({
          _rowNumber: rowNum,
          ucc_no,
          name,
          business_name,
          mobile_no,
          whatsapp_no,
          email,
          pan: pan.toUpperCase(),
          dob: formattedDob,
          gender,
          occupation,
          client_type_id: clientTypeId,
          status: statusClean || "active",
          client_status: normClientStatus,
          client_category: normClientCategory,
          service_ids: serviceIds,
        });
      }
    }

    return {
      summary: {
        total_rows: dataRows.length,
        valid_rows: validRows.length,
        invalid_rows: invalidRowsCount,
        duplicate_rows: duplicateRowsCount,
      },
      preview: validRows.slice(0, 10),
      valid_rows: validRows,
      errors: errorsList,
    };
  }

  /**
   * Execute batch import of valid CSV clients.
   */
  static async executeImport(csvText, context = {}) {
    const validationResult = await this.validateImport(csvText);
    const { valid_rows, summary, errors } = validationResult;

    if (!valid_rows || valid_rows.length === 0) {
      const error = new Error("No valid client rows found to import.");
      error.statusCode = 400;
      error.details = { summary, errors };
      throw error;
    }

    const importRes = await ClientModel.importBatch(valid_rows);

    await AuditService.log({
      userId: context.userId,
      action: "IMPORT",
      module: "CLIENTS",
      entityType: "CLIENT",
      description: `Imported ${importRes.imported_count} clients from CSV (${summary.total_rows - importRes.imported_count} skipped/failed)`,
      newValues: {
        total_rows: summary.total_rows,
        imported_rows: importRes.imported_count,
        skipped_rows: summary.invalid_rows + summary.duplicate_rows,
      },
      ipAddress: context.ipAddress,
    });

    return {
      total_rows: summary.total_rows,
      imported_rows: importRes.imported_count,
      skipped_rows: summary.invalid_rows + summary.duplicate_rows,
      failed_rows: 0,
      errors,
    };
  }
}

module.exports = ClientService;
