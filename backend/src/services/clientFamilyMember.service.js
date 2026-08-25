const ClientModel = require("../models/client.model");
const ClientFamilyMemberModel = require("../models/clientFamilyMember.model");

class ClientFamilyMemberService {
  static async listFamilyMembers(clientId) {
    const client = await ClientModel.findById(clientId);
    if (!client) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    return ClientFamilyMemberModel.findByClientId(clientId);
  }

  static async createFamilyMember(clientId, data) {
    const client = await ClientModel.findById(clientId);
    if (!client) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    return ClientFamilyMemberModel.create({
      ...data,
      client_id: clientId,
    });
  }

  static async updateFamilyMember(clientId, familyMemberId, data) {
    const client = await ClientModel.findById(clientId);
    if (!client) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    const familyMember = await ClientFamilyMemberModel.findById(familyMemberId);
    if (!familyMember) {
      const error = new Error("Family member not found");
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership: family member must belong to specified clientId
    if (Number(familyMember.client_id) !== Number(clientId)) {
      const error = new Error("Family member does not belong to the specified client");
      error.statusCode = 403;
      error.errors = [{ field: "familyMemberId", message: "Cross-client modification forbidden" }];
      throw error;
    }

    return ClientFamilyMemberModel.update(familyMemberId, data);
  }

  static async deleteFamilyMember(clientId, familyMemberId) {
    const client = await ClientModel.findById(clientId);
    if (!client) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    const familyMember = await ClientFamilyMemberModel.findById(familyMemberId);
    if (!familyMember) {
      const error = new Error("Family member not found");
      error.statusCode = 404;
      throw error;
    }

    // Verify ownership: family member must belong to specified clientId
    if (Number(familyMember.client_id) !== Number(clientId)) {
      const error = new Error("Family member does not belong to the specified client");
      error.statusCode = 403;
      error.errors = [{ field: "familyMemberId", message: "Cross-client deletion forbidden" }];
      throw error;
    }

    await ClientFamilyMemberModel.delete(familyMemberId);
    return true;
  }
}

module.exports = ClientFamilyMemberService;
