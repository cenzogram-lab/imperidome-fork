import Text "mo:core/Text";
import MsgTypes "../types/messages";

// MessagesLib — domain logic for the client↔admin messaging thread.
// All functions are pure — they receive state slices and return new values.
module {
  public type ClientMessage = MsgTypes.ClientMessage;

  // getThread — returns all messages for the admin↔client thread in chronological order.
  // A message belongs to the thread when it is between adminEmail and clientEmail.
  public func getThread(
    messages    : [ClientMessage],
    adminEmail  : Text,
    clientEmail : Text
  ) : [ClientMessage] {
    messages.filter(func(m) {
      (Text.equal(m.senderEmail, adminEmail)   and Text.equal(m.receiverEmail, clientEmail)) or
      (Text.equal(m.senderEmail, clientEmail)  and Text.equal(m.receiverEmail, adminEmail))
    })
  };

  // countUnread — number of unread messages sent BY clientEmail TO adminEmail.
  public func countUnread(
    messages    : [ClientMessage],
    clientEmail : Text,
    adminEmail  : Text
  ) : Nat {
    var count = 0;
    for (m in messages.vals()) {
      if (Text.equal(m.senderEmail, clientEmail) and
          Text.equal(m.receiverEmail, adminEmail) and
          not m.isRead) {
        count += 1;
      };
    };
    count
  };

  // unreadCountsForAdmin — (clientEmail, unreadCount) pairs for all clients with
  // unread messages in the admin's inbox. Only includes entries with count > 0.
  public func unreadCountsForAdmin(
    messages   : [ClientMessage],
    adminEmail : Text
  ) : [(Text, Nat)] {
    // Collect distinct client emails that have sent unread messages to admin
    var seen : [Text] = [];
    var result : [(Text, Nat)] = [];
    for (m in messages.vals()) {
      if (Text.equal(m.receiverEmail, adminEmail) and not m.isRead) {
        let client = m.senderEmail;
        // Only add if not already counted
        let alreadySeen = seen.find(func(e) { Text.equal(e, client) });
        switch (alreadySeen) {
          case null {
            seen := seen.concat([client]);
            let cnt = countUnread(messages, client, adminEmail);
            if (cnt > 0) {
              result := result.concat([(client, cnt)]);
            };
          };
          case (?_) {};
        };
      };
    };
    result
  };

  // markRead — returns the updated messages array with all messages addressed
  // to callerEmail in the thread marked as isRead = true.
  public func markRead(
    messages    : [ClientMessage],
    callerEmail : Text,
    otherEmail  : Text
  ) : [ClientMessage] {
    messages.map<ClientMessage, ClientMessage>(func(m) {
      if (Text.equal(m.receiverEmail, callerEmail) and
          Text.equal(m.senderEmail, otherEmail)) {
        { m with isRead = true }
      } else { m }
    })
  };
};
