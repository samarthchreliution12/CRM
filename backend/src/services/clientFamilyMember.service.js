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

    return ClientFamilyMemberModel.findFamilyForClient(clientId);
  }

  static async createFamilyMember(clientId, data) {
    const client = await ClientModel.findById(clientId);
    if (!client) {
      const error = new Error("Client not found");
      error.statusCode = 404;
      throw error;
    }

    // Always resolve the family head so members are grouped under the same head
    const headId = await ClientFamilyMemberModel.findHeadId(clientId);

    if (data.member_client_id) {
      const memberClientId = Number(data.member_client_id);

      // Self-link prevention
      if (memberClientId === Number(headId) || memberClientId === Number(clientId)) {
        const error = new Error("Cannot link client to themselves or as their own family head");
        error.statusCode = 400;
        throw error;
      }

      // Check member client exists
      const memberClient = await ClientModel.findById(memberClientId);
      if (!memberClient) {
        const error = new Error("Selected client not found");
        error.statusCode = 404;
        throw error;
      }

      // Duplicate check: already in this family
      const existingLink = await ClientFamilyMemberModel.findExistingLink(headId, memberClientId);
      if (existingLink) {
        const error = new Error("This client is already a member of this family");
        error.statusCode = 409;
        throw error;
      }

      // Duplicate check: member of another family
      const inAnotherFamily = await ClientFamilyMemberModel.findMemberAnyFamily(memberClientId);
      if (inAnotherFamily) {
        const error = new Error("This client is already linked to another family");
        error.statusCode = 409;
        throw error;
      }

      // Conflict check: already head of another family with members
      const existingHeadCount = await ClientFamilyMemberModel.countHeadMembers(memberClientId);
      if (existingHeadCount > 0) {
        const error = new Error("This client is already the head of another family. Please unlink their existing family first.");
        error.statusCode = 409;
        throw error;
      }

      return ClientFamilyMemberModel.create({
        client_id: headId,
        member_client_id: memberClientId,
        relationship: data.relationship,
        name: memberClient.name,
        email: memberClient.email,
        mobile_no: memberClient.mobile_no,
        pan_no: memberClient.pan,
        dob: memberClient.dob,
        gender: memberClient.gender,
      });
    }

    // Fallback if manual creation without client link
    return ClientFamilyMemberModel.create({
      ...data,
      client_id: headId,
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

    const clientHeadId = await ClientFamilyMemberModel.findHeadId(clientId);
    const isOwner =
      Number(familyMember.client_id) === Number(clientId) ||
      Number(familyMember.client_id) === Number(clientHeadId) ||
      Number(familyMember.member_client_id) === Number(clientId);

    if (!isOwner) {
      const error = new Error("Family member does not belong to the specified client family");
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

    const clientHeadId = await ClientFamilyMemberModel.findHeadId(clientId);
    const isAuthorized =
      Number(familyMember.client_id) === Number(clientId) ||
      Number(familyMember.client_id) === Number(clientHeadId) ||
      Number(familyMember.member_client_id) === Number(clientId);

    if (!isAuthorized) {
      const error = new Error("Family member does not belong to the specified client family");
      error.statusCode = 403;
      error.errors = [{ field: "familyMemberId", message: "Cross-client deletion forbidden" }];
      throw error;
    }

    await ClientFamilyMemberModel.delete(familyMemberId);
    return true;
  }
}

module.exports = ClientFamilyMemberService;
