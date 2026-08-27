require("dotenv").config();
const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const CommunicationService = require("../services/communication.service");
const CommunicationModel = require("../models/communication.model");

let adminUser, staffUser1, staffUser2, clientUser;
let adminToken, staffToken1, staffToken2, clientToken;

function generateToken(user, roleName, permissions = []) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: { id: user.role_id, name: roleName },
      permissions: permissions,
    },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "1h" }
  );
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  CRM Internal Communication Backend Test Suite        ");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const passwordHash = await bcrypt.hash("TestPass123!", 10);

    // Fetch roles
    const rolesRes = await pool.query("SELECT id, name FROM roles");
    const rolesMap = {};
    rolesRes.rows.forEach((r) => (rolesMap[r.name] = r.id));

    // Seed test users
    const adminRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ('Chat Admin', 'chatadmin@crm.test', $1, $2, 'active')
       ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role_id`,
      [passwordHash, rolesMap["Admin"]]
    );
    adminUser = adminRes.rows[0];
    adminToken = generateToken(adminUser, "Admin", []);

    const staff1Res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ('Staff Alpha', 'staffalpha@crm.test', $1, $2, 'active')
       ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role_id`,
      [passwordHash, rolesMap["Staff"]]
    );
    staffUser1 = staff1Res.rows[0];
    staffToken1 = generateToken(staffUser1, "Staff", []);

    const staff2Res = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ('Staff Beta', 'staffbeta@crm.test', $1, $2, 'active')
       ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role_id`,
      [passwordHash, rolesMap["Staff"]]
    );
    staffUser2 = staff2Res.rows[0];
    staffToken2 = generateToken(staffUser2, "Staff", []);

    const clientRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, status)
       VALUES ('Client User', 'clientuser@crm.test', $1, $2, 'active')
       ON CONFLICT (email) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role_id`,
      [passwordHash, rolesMap["Client"]]
    );
    clientUser = clientRes.rows[0];
    clientToken = generateToken(clientUser, "Client", []);

    console.log("--- 1. Staff Users Listing ---");
    const staffList = await CommunicationService.getStaffUsers(adminUser.id, "");
    assert(Array.isArray(staffList), "Returns list of staff users");
    assert(
      staffList.some((s) => s.id === staffUser1.id) && staffList.some((s) => s.id === staffUser2.id),
      "Includes other active staff members excluding self"
    );

    console.log("\n--- 2. Direct Conversation Creation & Deduplication ---");
    const conv1 = await CommunicationService.getOrCreateDirectConversation(adminUser.id, staffUser1.id);
    assert(conv1 && conv1.id && conv1.type === "direct", "Direct conversation created between Admin & Staff Alpha");

    const conv1Repeat = await CommunicationService.getOrCreateDirectConversation(adminUser.id, staffUser1.id);
    assert(conv1Repeat.id === conv1.id, "Finds existing direct conversation without duplicate creation");

    console.log("\n--- 3. Conversation Membership & Security ---");
    const members = await CommunicationService.getConversationMembers(adminUser.id, conv1.id);
    assert(members.length === 2, "Conversation has 2 active members");
    assert(
      members.some((m) => m.user_id === adminUser.id) && members.some((m) => m.user_id === staffUser1.id),
      "Members are Admin & Staff Alpha"
    );

    // Check security: Staff Beta tries to read messages of conv1
    let securityPassed = false;
    try {
      await CommunicationService.getConversationMessages(staffUser2.id, conv1.id);
    } catch (err) {
      securityPassed = err.statusCode === 403;
    }
    assert(securityPassed, "Non-member staff (Staff Beta) blocked with 403 from reading conversation messages");

    console.log("\n--- 4. Messaging System (Send, Get, Edit, Soft-delete) ---");
    // Admin sends message
    const msg1 = await CommunicationService.sendMessage(adminUser.id, conv1.id, "Hello Staff Alpha, review client profile.");
    assert(msg1 && msg1.id && msg1.message === "Hello Staff Alpha, review client profile.", "Admin sends real message to DB");

    // Staff Alpha reads message
    const alphaMessages = await CommunicationService.getConversationMessages(staffUser1.id, conv1.id);
    assert(alphaMessages.length >= 1, "Staff Alpha receives real message from database");
    assert(alphaMessages[alphaMessages.length - 1].message === "Hello Staff Alpha, review client profile.", "Message text matches exact DB string");

    // Staff Alpha sends reply
    const msg2 = await CommunicationService.sendMessage(staffUser1.id, conv1.id, "Sure Admin, checking now.");
    assert(msg2 && msg2.id, "Staff Alpha replies in conversation");

    // Staff Alpha edits reply
    const editedMsg = await CommunicationService.editMessage(staffUser1.id, msg2.id, "Sure Admin, checking now! (Updated)");
    assert(editedMsg && editedMsg.message === "Sure Admin, checking now! (Updated)", "Staff Alpha edits own message");

    // Admin tries to edit Staff Alpha's message (Should fail 403)
    let editSecurityPassed = false;
    try {
      await CommunicationService.editMessage(adminUser.id, msg2.id, "Hacked text");
    } catch (err) {
      editSecurityPassed = err.statusCode === 403;
    }
    assert(editSecurityPassed, "User cannot edit another user's message (403 Forbidden)");

    // Staff Alpha soft-deletes reply
    const deletedMsg = await CommunicationService.deleteMessage(staffUser1.id, msg2.id, "Staff");
    assert(deletedMsg && deletedMsg.is_deleted === true, "Staff Alpha soft-deletes own message");

    // Verify deleted message representation
    const updatedMessages = await CommunicationService.getConversationMessages(adminUser.id, conv1.id);
    const targetMsg = updatedMessages.find((m) => m.id === msg2.id);
    assert(targetMsg && targetMsg.message === "This message was deleted", "Soft-deleted message text rendered as 'This message was deleted'");

    console.log("\n--- 5. User Conversation Summaries ---");
    const adminConvs = await CommunicationService.getUserConversations(adminUser.id);
    assert(adminConvs.length >= 1, "Admin retrieves conversation list");
    assert(adminConvs[0].recipient.id === staffUser1.id, "Direct conversation displays correct recipient info");

    console.log("\n--- 6. Real Read / Unread Status & Unread Counter ---");
    // Admin sends fresh unread message to Staff Alpha
    const freshMsg = await CommunicationService.sendMessage(adminUser.id, conv1.id, "Testing unread count & read status");
    
    // Check Staff Alpha's unread count before opening chat
    const alphaConvsBefore = await CommunicationService.getUserConversations(staffUser1.id);
    const targetConvBefore = alphaConvsBefore.find((c) => c.id === conv1.id);
    assert(targetConvBefore && targetConvBefore.unread_count > 0, "Recipient has unread_count > 0 for new message");

    // Check message status for Admin before Staff Alpha reads it
    const adminMessagesBefore = await CommunicationService.getConversationMessages(adminUser.id, conv1.id);
    const sentMsgBefore = adminMessagesBefore.find((m) => m.id === freshMsg.id);
    assert(sentMsgBefore && sentMsgBefore.status === "delivered", "Sender sees status as 'delivered' before recipient opens chat");

    // Staff Alpha opens conversation & marks as read
    await CommunicationService.markConversationAsRead(staffUser1.id, conv1.id);

    // Check Staff Alpha's unread count after marking as read
    const alphaConvsAfter = await CommunicationService.getUserConversations(staffUser1.id);
    const targetConvAfter = alphaConvsAfter.find((c) => c.id === conv1.id);
    assert(targetConvAfter && targetConvAfter.unread_count === 0, "Recipient unread_count becomes 0 after opening chat");

    // Check message status for Admin after Staff Alpha reads it
    const adminMessagesAfter = await CommunicationService.getConversationMessages(adminUser.id, conv1.id);
    const sentMsgAfter = adminMessagesAfter.find((m) => m.id === freshMsg.id);
    assert(sentMsgAfter && sentMsgAfter.status === "seen", "Sender sees status as 'seen' after recipient opens chat");

    console.log("\n--- 7. Channel Creator & Owner Management Suite ---");
    // Staff Alpha creates Channel 1
    const channel1 = await CommunicationService.createChannel(staffUser1.id, "Engineering Alpha");
    assert(channel1 && channel1.type === "channel" && channel1.created_by === staffUser1.id, "Channel 1 created with staffUser1 as creator/owner");

    // Creator (Staff Alpha) adds Staff Beta -> 200 OK
    const addedMembers = await CommunicationService.addConversationMembers(staffUser1.id, "Staff", channel1.id, [staffUser2.id]);
    assert(addedMembers.length >= 2, "Channel creator (Staff Alpha) adds Staff Beta successfully");

    // Send message in Channel 1
    const chMsg = await CommunicationService.sendMessage(staffUser1.id, channel1.id, "Hello channel members!");
    assert(chMsg && chMsg.id, "Message sent to Channel 1");

    // 1. Normal Member (Staff Beta) tries to add people -> 403 Forbidden
    let normalAddBlocked = false;
    try {
      await CommunicationService.addConversationMembers(staffUser2.id, "Staff", channel1.id, [adminUser.id]);
    } catch (err) {
      normalAddBlocked = err.statusCode === 403;
    }
    assert(normalAddBlocked, "Normal member (Staff Beta) blocked from adding people (403 Forbidden)");

    // 2. Normal Member (Staff Beta) tries to remove owner -> 403 Forbidden
    let normalRemoveBlocked = false;
    try {
      await CommunicationService.removeConversationMember(staffUser2.id, "Staff", channel1.id, staffUser1.id);
    } catch (err) {
      normalRemoveBlocked = err.statusCode === 403;
    }
    assert(normalRemoveBlocked, "Normal member blocked from removing members (403 Forbidden)");

    // 3. Creator tries to remove themselves (owner) -> 400 Bad Request
    let ownerSelfRemoveBlocked = false;
    try {
      await CommunicationService.removeConversationMember(staffUser1.id, "Staff", channel1.id, staffUser1.id);
    } catch (err) {
      ownerSelfRemoveBlocked = err.statusCode === 400;
    }
    assert(ownerSelfRemoveBlocked, "Removing channel owner blocked with 400 Bad Request");

    // 4. Creator tries to leave channel -> 400 Bad Request
    let ownerLeaveBlocked = false;
    try {
      await CommunicationService.leaveChannel(staffUser1.id, channel1.id);
    } catch (err) {
      ownerLeaveBlocked = err.statusCode === 400;
    }
    assert(ownerLeaveBlocked, "Channel creator attempting to leave blocked with 400 Bad Request");

    // 5. Creator (Staff Alpha) removes normal member (Staff Beta) -> 200 OK
    const updatedMembersAfterRemove = await CommunicationService.removeConversationMember(staffUser1.id, "Staff", channel1.id, staffUser2.id);
    assert(updatedMembersAfterRemove.length === 1, "Channel creator removes normal member (Staff Beta) successfully");

    // Re-add Staff Beta so they can test leaving channel
    await CommunicationService.addConversationMembers(staffUser1.id, "Staff", channel1.id, [staffUser2.id]);

    // 6. Normal Member (Staff Beta) leaves channel -> 200 OK
    const leaveRes = await CommunicationService.leaveChannel(staffUser2.id, channel1.id);
    assert(leaveRes.success === true, "Normal member (Staff Beta) leaves channel successfully");

    // 7. Non-creator non-admin (Staff Beta) tries to delete Channel 1 -> 403 Forbidden
    let forbiddenDeletePassed = false;
    try {
      await CommunicationService.deleteChannel(staffUser2.id, "Staff", channel1.id);
    } catch (err) {
      forbiddenDeletePassed = err.statusCode === 403;
    }
    assert(forbiddenDeletePassed, "Unauthorized staff user (non-admin, non-creator) blocked from deleting channel (403 Forbidden)");

    // 8. Try deleting direct conversation using channel delete API -> 400 Bad Request
    let directDeleteBlocked = false;
    try {
      await CommunicationService.deleteChannel(adminUser.id, "Admin", conv1.id);
    } catch (err) {
      directDeleteBlocked = err.statusCode === 400;
    }
    assert(directDeleteBlocked, "Deleting direct conversation via channel delete API rejected with 400 Bad Request");

    // 9. Try deleting non-existent channel -> 404 Not Found
    let notFoundPassed = false;
    try {
      await CommunicationService.deleteChannel(adminUser.id, "Admin", 999999);
    } catch (err) {
      notFoundPassed = err.statusCode === 404;
    }
    assert(notFoundPassed, "Deleting non-existent channel returns 404 Not Found");

    // 10. Channel Creator (Staff Alpha) deletes Channel 1 -> 200 OK
    const creatorDeleteRes = await CommunicationService.deleteChannel(staffUser1.id, "Staff", channel1.id);
    assert(creatorDeleteRes.success === true, "Channel creator (Staff Alpha) deletes channel successfully");

    // Verify Channel 1, messages, and members were deleted cleanly
    const deletedConvCheck = await CommunicationModel.getConversationById(channel1.id);
    assert(deletedConvCheck === null, "Channel conversation record deleted from database");

    const deletedMembersCheck = await pool.query("SELECT * FROM internal_conversation_members WHERE conversation_id = $1", [channel1.id]);
    assert(deletedMembersCheck.rows.length === 0, "Channel members records deleted from database (No orphaned records)");

    const deletedMsgsCheck = await pool.query("SELECT * FROM internal_messages WHERE conversation_id = $1", [channel1.id]);
    assert(deletedMsgsCheck.rows.length === 0, "Channel messages records deleted from database (No orphaned records)");

    // 11. System Admin deletes Channel 2 created by Staff Beta -> 200 OK
    const channel2 = await CommunicationService.createChannel(staffUser2.id, "DevOps Beta");
    const adminDeleteRes = await CommunicationService.deleteChannel(adminUser.id, "Admin", channel2.id);
    assert(adminDeleteRes.success === true, "System Admin deletes channel successfully");

    console.log("\n=======================================================");
    console.log(`  Internal Communication Backend Tests: ${passed} Passed, ${failed} Failed`);
    console.log("=======================================================\n");

    // Cleanup test users
    await pool.query(
      "DELETE FROM users WHERE email IN ('chatadmin@crm.test', 'staffalpha@crm.test', 'staffbeta@crm.test', 'clientuser@crm.test')"
    );
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await pool.end();
  }
}

runTests();
