const { LeadModel, VALID_STATUSES } = require("../models/lead.model");
const UserModel = require("../models/user.model");
const ClientTypeModel = require("../models/clientType.model");
const ClientServiceModel = require("../models/clientService.model");
const NotificationService = require("./notification.service");
const AuditService = require("./audit.service");

class LeadService {
  /**
   * Create a new Lead.
   */
  static async createLead(data, context = {}) {
    if (!data.name || !data.name.trim()) {
      const err = new Error("Lead name is required.");
      err.statusCode = 400;
      throw err;
    }

    if (!data.mobile_no || !data.mobile_no.toString().trim()) {
      const err = new Error("Mobile number is required.");
      err.statusCode = 400;
      throw err;
    }

    if (!data.whatsapp_no || !data.whatsapp_no.toString().trim()) {
      const err = new Error("WhatsApp number is required.");
      err.statusCode = 400;
      throw err;
    }

    if (!data.email || !data.email.trim()) {
      const err = new Error("Email address is required.");
      err.statusCode = 400;
      throw err;
    }

    if (!data.client_type_id) {
      const err = new Error("Client type is required.");
      err.statusCode = 400;
      throw err;
    }

    const type = await ClientTypeModel.findById(data.client_type_id);
    if (!type) {
      const err = new Error("Specified client type does not exist.");
      err.statusCode = 404;
      throw err;
    }

    if (!data.service_id) {
      const err = new Error("Interested service is required.");
      err.statusCode = 400;
      throw err;
    }

    const service = await ClientServiceModel.findById(data.service_id);
    if (!service) {
      const err = new Error("Specified service does not exist.");
      err.statusCode = 404;
      throw err;
    }

    if (data.assigned_to) {
      const staff = await UserModel.findById(data.assigned_to);
      if (!staff) {
        const err = new Error("Specified assigned staff user does not exist.");
        err.statusCode = 404;
        throw err;
      }
    }

    const newLead = await LeadModel.create({
      ...data,
      created_by: context.userId,
    });

    await AuditService.log({
      userId: context.userId,
      action: "CREATE",
      module: "LEADS",
      entityType: "LEAD",
      entityId: newLead.id,
      description: `Created new lead: ${newLead.name}`,
      newValues: AuditService.sanitize(newLead),
      ipAddress: context.ipAddress,
    });

    return newLead;
  }

  /**
   * Fetch leads list for Kanban board or table view.
   */
  static async getLeads(filters = {}, context = {}) {
    return LeadModel.findAll({
      ...filters,
      user_id: context.userId,
    });
  }

  /**
   * Fetch single lead details by ID.
   */
  static async getLeadById(id) {
    const lead = await LeadModel.findById(id);
    if (!lead) {
      const err = new Error("Lead not found.");
      err.statusCode = 404;
      throw err;
    }
    return lead;
  }

  /**
   * General update for lead information.
   */
  static async updateLead(id, data = {}, context = {}) {
    const existingLead = await this.getLeadById(id);

    if (data.status && data.status.toLowerCase() === "converted") {
      const err = new Error(
        "Lead conversion cannot be performed via standard update. Please use the POST /api/leads/:id/convert endpoint."
      );
      err.statusCode = 400;
      throw err;
    }

    if (data.assigned_to) {
      const staff = await UserModel.findById(data.assigned_to);
      if (!staff) {
        const err = new Error("Specified assigned staff user does not exist.");
        err.statusCode = 404;
        throw err;
      }
    }

    if (data.client_type_id) {
      const type = await ClientTypeModel.findById(data.client_type_id);
      if (!type) {
        const err = new Error("Specified client type does not exist.");
        err.statusCode = 404;
        throw err;
      }
    }

    if (data.service_id) {
      const service = await ClientServiceModel.findById(data.service_id);
      if (!service) {
        const err = new Error("Specified service does not exist.");
        err.statusCode = 404;
        throw err;
      }
    }

    const updatedLead = await LeadModel.update(id, data);
    const diff = AuditService.calculateDiff(existingLead, updatedLead);

    if (Object.keys(diff.newValues || {}).length > 0) {
      await AuditService.log({
        userId: context.userId,
        action: "UPDATE",
        module: "LEADS",
        entityType: "LEAD",
        entityId: updatedLead.id,
        description: `Updated lead: ${updatedLead.name}`,
        oldValues: diff.oldValues,
        newValues: diff.newValues,
        ipAddress: context.ipAddress,
      });
    }

    if (data.assigned_to && data.assigned_to !== existingLead.assigned_to) {
      const assignedStaffName = updatedLead.assigned_staff?.name || `User #${data.assigned_to}`;
      await AuditService.log({
        userId: context.userId,
        action: "ASSIGN",
        module: "LEADS",
        entityType: "LEAD",
        entityId: updatedLead.id,
        description: `Assigned lead ${updatedLead.name} to ${assignedStaffName}`,
        oldValues: { assigned_to: existingLead.assigned_to },
        newValues: { assigned_to: updatedLead.assigned_to },
        ipAddress: context.ipAddress,
      });
    }

    return updatedLead;
  }

  /**
   * Dedicated drag-and-drop Kanban status update.
   */
  static async updateLeadStatus(id, newStatus, context = {}) {
    const existingLead = await this.getLeadById(id);

    if (!newStatus || !VALID_STATUSES.includes(newStatus.toLowerCase())) {
      const err = new Error(
        `Invalid status. Status must be one of: ${VALID_STATUSES.join(", ")}`
      );
      err.statusCode = 400;
      throw err;
    }

    const cleanStatus = newStatus.toLowerCase();

    if (cleanStatus === "converted") {
      const err = new Error(
        "Lead conversion cannot be performed via status drag-and-drop. Please use the dedicated POST /api/leads/:id/convert endpoint."
      );
      err.statusCode = 400;
      throw err;
    }

    if (existingLead.converted_client_id || existingLead.status === "converted") {
      const err = new Error("Converted leads cannot have their status updated.");
      err.statusCode = 400;
      throw err;
    }

    const updatedLead = await LeadModel.updateStatus(id, cleanStatus);

    await AuditService.log({
      userId: context.userId,
      action: "UPDATE_STATUS",
      module: "LEADS",
      entityType: "LEAD",
      entityId: updatedLead.id,
      description: `Updated status for lead ${updatedLead.name} from '${existingLead.status}' to '${cleanStatus}'`,
      oldValues: { status: existingLead.status },
      newValues: { status: cleanStatus },
      ipAddress: context.ipAddress,
    });

    return updatedLead;
  }

  /**
   * Convert Lead to Client via database transaction.
   */
  static async convertLeadToClient(id, options = {}, context = {}) {
    const existingLead = await this.getLeadById(id);

    if (existingLead.converted_client_id || existingLead.status === "converted") {
      const err = new Error("This lead has already been converted to a client.");
      err.statusCode = 400;
      throw err;
    }

    // 1. Mandatory DOB validation
    if (!options.dob || !options.dob.toString().trim()) {
      const err = new Error("Date of birth and PAN number are required to convert this lead into a client.");
      err.statusCode = 400;
      throw err;
    }

    const dobDate = new Date(options.dob);
    if (isNaN(dobDate.getTime())) {
      const err = new Error("Invalid date of birth format.");
      err.statusCode = 400;
      throw err;
    }

    const today = new Date();
    if (dobDate > today) {
      const err = new Error("Date of birth cannot be in the future.");
      err.statusCode = 400;
      throw err;
    }

    // 2. Mandatory PAN validation
    if (!options.pan || !options.pan.toString().trim()) {
      const err = new Error("Date of birth and PAN number are required to convert this lead into a client.");
      err.statusCode = 400;
      throw err;
    }

    const cleanPan = options.pan.toString().trim().toUpperCase();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(cleanPan)) {
      const err = new Error("Invalid PAN number format (e.g. ABCDE1234F).");
      err.statusCode = 400;
      throw err;
    }

    let normCategory = null;
    if (options.client_category && options.client_category.toString().trim()) {
      const catVal = options.client_category.toString().trim().toUpperCase();
      const validCategories = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
      if (validCategories.includes(catVal)) {
        normCategory = catVal;
      }
    }

    const sanitizedOptions = {
      ...options,
      dob: dobDate.toISOString().split("T")[0],
      pan: cleanPan,
      client_category: normCategory,
    };

    const result = await LeadModel.convertLeadToClient(id, sanitizedOptions, context.userId);

    await AuditService.log({
      userId: context.userId,
      action: "CONVERT",
      module: "LEADS",
      entityType: "LEAD",
      entityId: result.lead.id,
      description: `Converted lead ${result.lead.name} to Client #${result.client.id} (${result.client.ucc_no})`,
      newValues: {
        lead_id: result.lead.id,
        client_id: result.client.id,
        client_ucc: result.client.ucc_no,
        converted_by: context.userId,
        converted_at: result.lead.converted_at,
      },
      ipAddress: context.ipAddress,
    });

    return {
      success: true,
      message: "Lead converted to client successfully",
      lead: result.lead,
      client: result.client,
    };
  }

  /**
   * Create a new Lead submitted from the public Website Contact Us form.
   */
  static async createPublicLead(data = {}, context = {}) {
    // 1. Validation & Input Sanitization
    const rawName = (data.name || data.fullName || data.full_name || "").toString().trim();
    if (!rawName || rawName.length < 2) {
      const err = new Error("Full name is required (minimum 2 characters).");
      err.statusCode = 400;
      throw err;
    }
    if (rawName.length > 150) {
      const err = new Error("Full name cannot exceed 150 characters.");
      err.statusCode = 400;
      throw err;
    }

    const rawEmail = (data.email || "").toString().trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      const err = new Error("A valid email address is required.");
      err.statusCode = 400;
      throw err;
    }
    if (rawEmail.length > 150) {
      const err = new Error("Email cannot exceed 150 characters.");
      err.statusCode = 400;
      throw err;
    }

    const rawPhone = (data.phone || data.mobile_no || data.mobile || "").toString().trim();
    const digitsOnly = rawPhone.replace(/\D/g, "");
    if (!rawPhone || digitsOnly.length < 7 || digitsOnly.length > 15) {
      const err = new Error("A valid phone number is required (7 to 15 digits).");
      err.statusCode = 400;
      throw err;
    }

    const rawService = (data.service || data.service_id || data.service_required || "").toString().trim();
    if (!rawService) {
      const err = new Error("Please select the required service.");
      err.statusCode = 400;
      throw err;
    }

    const rawMessage = (data.message || data.notes || data.details || "").toString().trim();
    if (rawMessage.length > 2000) {
      const err = new Error("Message cannot exceed 2000 characters.");
      err.statusCode = 400;
      throw err;
    }

    const sanitizeText = (str) => {
      if (!str || typeof str !== "string") return "";
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]*>?/gm, "")
        .trim();
    };

    // 2. Resolve Service ID from client_services
    let resolvedServiceId = null;
    const allServices = await ClientServiceModel.findAll({ status: "active" });
    const serviceList = Array.isArray(allServices) ? allServices : (allServices.client_services || []);

    if (/^\d+$/.test(rawService)) {
      const numId = parseInt(rawService, 10);
      const found = serviceList.find((s) => s.id === numId);
      if (found) resolvedServiceId = found.id;
    }

    if (!resolvedServiceId && serviceList.length > 0) {
      const serviceSlugMap = {
        "mutual-funds": "mutual fund",
        "mutual-fund": "mutual fund",
        "mutual fund": "mutual fund",
        "investment-recovery": "physical shares",
        "recovery": "iepf",
        "wealth-management": "pms",
        "financial-planning": "mutual fund",
        "ipo": "ipo",
        "demat": "demat",
        "slbm": "slbm",
        "insurance": "insurance",
        "physical-shares": "physical shares",
        "iepf": "iepf",
        "trading": "trading",
        "pms": "pms",
        "aif": "aif",
      };

      const normalizedInput = rawService.toLowerCase().replace(/[_\s]+/g, "-");
      const mappedKeyword = serviceSlugMap[normalizedInput] || normalizedInput.replace(/-/g, " ");

      // Match by exact or partial name
      const matched = serviceList.find(
        (s) =>
          s.name.toLowerCase() === mappedKeyword ||
          s.name.toLowerCase().includes(mappedKeyword) ||
          mappedKeyword.includes(s.name.toLowerCase())
      );

      resolvedServiceId = matched ? matched.id : serviceList[0].id;
    }

    // 3. Resolve Client Type ID (Default to Individual or first active)
    let resolvedClientTypeId = null;
    try {
      const allTypes = await ClientTypeModel.findAll({ status: "active" });
      const typesList = Array.isArray(allTypes) ? allTypes : (allTypes.client_types || []);
      const individual = typesList.find((t) => t.name.toLowerCase() === "individual");
      resolvedClientTypeId = individual ? individual.id : (typesList[0]?.id || null);
    } catch (e) {
      resolvedClientTypeId = null;
    }

    // 4. Create Lead Record in Database
    const newLead = await LeadModel.create({
      name: sanitizeText(rawName),
      email: rawEmail,
      mobile_no: sanitizeText(rawPhone),
      whatsapp_no: sanitizeText(rawPhone),
      service_id: resolvedServiceId,
      client_type_id: resolvedClientTypeId,
      source: "Website",
      status: "new",
      priority: "medium",
      notes: sanitizeText(rawMessage),
      assigned_to: null,
      created_by: null,
    });

    // 5. Notify Active CRM Users (Admins & Staff with Lead Permissions)
    try {
      const recipients = await UserModel.findLeadNotificationRecipients();
      for (const recipient of recipients) {
        await NotificationService.createNotification({
          recipientUserId: recipient.id,
          type: "NEW_WEBSITE_LEAD",
          title: "New Website Lead",
          message: `${newLead.name} submitted a new consultation request.`,
          entityType: "LEAD",
          entityId: newLead.id,
        }).catch((err) => {
          console.error(`Failed to send website lead notification to user ${recipient.id}:`, err);
        });
      }
    } catch (notifErr) {
      console.error("Failed to generate notifications for website lead:", notifErr);
    }

    // 6. Audit Trail Logging
    try {
      await AuditService.log({
        userId: null,
        action: "CREATE",
        module: "LEADS",
        entityType: "LEAD",
        entityId: newLead.id,
        description: `New website lead submitted: ${newLead.name}`,
        newValues: AuditService.sanitize(newLead),
        ipAddress: context.ipAddress,
      });
    } catch (auditErr) {
      console.error("Failed to log audit for website lead:", auditErr);
    }

    return newLead;
  }

  /**
   * Delete Lead record.
   */
  static async deleteLead(id, context = {}) {
    const existingLead = await this.getLeadById(id);

    if (existingLead.converted_client_id || existingLead.status === "converted") {
      const err = new Error("Converted leads cannot be deleted.");
      err.statusCode = 400;
      throw err;
    }

    await LeadModel.delete(id);

    await AuditService.log({
      userId: context.userId,
      action: "DELETE",
      module: "LEADS",
      entityType: "LEAD",
      entityId: parseInt(id, 10),
      description: `Deleted lead: ${existingLead.name}`,
      oldValues: AuditService.sanitize(existingLead),
      ipAddress: context.ipAddress,
    });

    return true;
  }
}

module.exports = LeadService;
