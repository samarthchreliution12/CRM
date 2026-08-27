const ClientModel = require("../models/client.model");
const ClientTypeModel = require("../models/clientType.model");
const AuditService = require("./audit.service");

class ClientService {
  static async listClients(query) {
    return ClientModel.findAll(query);
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
}

module.exports = ClientService;
