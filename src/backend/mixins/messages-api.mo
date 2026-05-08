import Text "mo:core/Text";
import Time "mo:core/Time";
import Random "mo:core/Random";
import MsgTypes "../types/messages";
import MessagesLib "../lib/messages";

// MessagesApiMixin — exposes the public API surface for the client↔admin messaging thread.
mixin (
  clientMessages : { var value : [MsgTypes.ClientMessage] }
) {
  public type ClientMessage  = MsgTypes.ClientMessage;
  public type MsgResult      = { #ok : ClientMessage; #err : Text };
  public type BoolResult     = { #ok : Bool; #err : Text };

  // sendMessage — posts a message in the admin↔client thread.
  public shared func sendMessage(
    callerEmail       : Text,
    targetClientEmail : Text,
    body              : Text
  ) : async MsgResult {
    let adminEmail = "vincenzo@imperidome.com";
    let isAdmin = Text.equal(callerEmail, adminEmail);
    let senderName = if (isAdmin) { "Imperidome Team" } else {
      // Use email prefix as display name
      let parts = callerEmail.split(#char '@');
      switch (parts.next()) {
        case (?prefix) prefix;
        case null callerEmail;
      }
    };
    let receiverEmail = if (isAdmin) { targetClientEmail } else { adminEmail };
    let msgId = Time.now().toText();
    let msg : ClientMessage = {
      id            = "msg_" # msgId;
      senderEmail   = callerEmail;
      senderName    = senderName;
      receiverEmail = receiverEmail;
      body          = body;
      createdAt     = Time.now();
      isRead        = false;
    };
    clientMessages.value := clientMessages.value.concat([msg]);
    #ok(msg)
  };

  // getMessages — returns the full chronological message thread.
  public shared func getMessages(
    callerEmail       : Text,
    targetClientEmail : Text
  ) : async [ClientMessage] {
    let adminEmail = "vincenzo@imperidome.com";
    if (not Text.equal(callerEmail, adminEmail) and
        not Text.equal(callerEmail, targetClientEmail)) {
      return [];
    };
    MessagesLib.getThread(clientMessages.value, adminEmail, targetClientEmail)
  };

  // markMessagesRead — marks all messages addressed to callerEmail as read.
  public shared func markMessagesRead(
    callerEmail       : Text,
    targetClientEmail : Text
  ) : async BoolResult {
    let adminEmail = "vincenzo@imperidome.com";
    let otherEmail = if (Text.equal(callerEmail, adminEmail)) { targetClientEmail } else { adminEmail };
    clientMessages.value := MessagesLib.markRead(clientMessages.value, callerEmail, otherEmail);
    #ok(true)
  };

  // getUnreadMessageCounts — returns (clientEmail, unreadCount) pairs.
  public shared func getUnreadMessageCounts(
    adminEmail : Text
  ) : async [(Text, Nat)] {
    if (not Text.equal(adminEmail, "vincenzo@imperidome.com")) {
      return [];
    };
    MessagesLib.unreadCountsForAdmin(clientMessages.value, adminEmail)
  };
};
