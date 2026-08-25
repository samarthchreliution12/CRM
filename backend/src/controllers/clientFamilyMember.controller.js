const ClientFamilyMemberService = require("../services/clientFamilyMember.service");
const { validateCreateFamilyMemberInput, validateUpdateFamilyMemberInput } = require("../validators/clientFamilyMember.validator");
const { sendSuccess, sendError } = require("../utils/response.util");

class ClientFamilyMemberController {
  static async listFamilyMembers(req, res) {
    try {
      const { clientId } = req.params;
      const familyMembers = await ClientFamilyMemberService.listFamilyMembers(clientId);
      return sendSuccess(res, 200, "Family members retrieved successfully", { family_members: familyMembers });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async createFamilyMember(req, res) {
    try {
      const { clientId } = req.params;
      const validation = validateCreateFamilyMemberInput(req.body);
      if (!validation.isValid) {
        return sendError(res, 400, "Validation failed", validation.errors);
      }

      const familyMember = await ClientFamilyMemberService.createFamilyMember(clientId, req.body);
      return sendSuccess(res, 201, "Family member created successfully", { family_member: familyMember });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async updateFamilyMember(req, res) {
    try {
      const { clientId, familyMemberId } = req.params;
      const validation = validateUpdateFamilyMemberInput(req.body);
      if (!validation.isValid) {
        return sendError(res, 400, "Validation failed", validation.errors);
      }

      const familyMember = await ClientFamilyMemberService.updateFamilyMember(clientId, familyMemberId, req.body);
      return sendSuccess(res, 200, "Family member updated successfully", { family_member: familyMember });
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }

  static async deleteFamilyMember(req, res) {
    try {
      const { clientId, familyMemberId } = req.params;
      await ClientFamilyMemberService.deleteFamilyMember(clientId, familyMemberId);
      return sendSuccess(res, 200, "Family member deleted successfully");
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message, error.errors);
    }
  }
}

module.exports = ClientFamilyMemberController;
