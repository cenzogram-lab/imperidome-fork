import Text "mo:core/Text";
import Time "mo:core/Time";
import Random "mo:core/Random";
import MsgTypes "../types/messages";
import MessagesLib "../lib/messages";

// MessagesApiMixin — exposes the public API surface for the client↔admin messaging thread.
mixin (
  clientMessages    : { var value : [MsgTypes.ClientMessage] },
  _configAdminEmail : Text
) {
  public type ClientMessage  = MsgTypes.ClientMessage;
  public type MsgResult      = { #ok : ClientMessage; #err : Text };
  public type BoolResult     = { #ok : Bool; #err : Text };

  // sendMessage — posts a message in the admin↔client thread.
  public shared ({ caller }) func sendMessage(
    callerEmail       : Text,
    targetClientEmail : Text,
    body              : Text
  ) : async MsgResult {
    if (Principal.isAnonymous(caller)) { return #err("Unauthorized") };
    let isAdmin = Text.equal(callerEmail, _configAdminEmail);
    let senderName = if (isAdmin) { "Imperidome Team" } else {
      // Use email prefix as display name
      let parts = callerEmail.split(#char '@');
      switch (parts.next()) {
        case (?prefix) prefix;
        case null callerEmail;
      }
    };
    let receiverEmail = if (isAdmin) { targetClientEmail } else { _configAdminEmail };
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
    if (not Text.equal(callerEmail, _configAdminEmail) and
        not Text.equal(callerEmail, targetClientEmail)) {
      return [];
    };
    MessagesLib.getThread(clientMessages.value, _configAdminEmail, targetClientEmail)
  };

  // markMessagesRead — marks all messages addressed to callerEmail as read.
  public shared func markMessagesRead(
    callerEmail       : Text,
    targetClientEmail : Text
  ) : async BoolResult {
    let otherEmail = if (Text.equal(callerEmail, _configAdminEmail)) { targetClientEmail } else { _configAdminEmail };
    clientMessages.value := MessagesLib.markRead(clientMessages.value, callerEmail, otherEmail);
    #ok(true)
  };

  // getUnreadMessageCounts — returns (clientEmail, unreadCount) pairs.
  // adminEmailArg is ignored; the mixin uses its own configured admin email.
  public shared func getUnreadMessageCounts(
    adminEmail : Text
  ) : async [(Text, Nat)] {
    ignore adminEmail;
    if (_configAdminEmail.size() == 0) {
      return [];
    };
    MessagesLib.unreadCountsForAdmin(clientMessages.value, _configAdminEmail)
  };
};
