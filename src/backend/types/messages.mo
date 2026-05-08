module {
  // ClientMessage — one message in a client↔admin thread.
  // senderEmail is either vincenzo@imperidome.com (admin) or the client's registered email.
  // receiverEmail is the counterpart (admin or client).
  // isRead tracks whether the receiver has acknowledged the message.
  public type ClientMessage = {
    id            : Text;
    senderEmail   : Text;
    senderName    : Text;
    receiverEmail : Text;
    body          : Text;
    createdAt     : Int;    // nanosecond timestamp
    isRead        : Bool;
  };
};
