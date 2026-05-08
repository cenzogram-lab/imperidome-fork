import Text "mo:core/Text";

module {
  public type Status = {
    #questionnairePending;
    #questionnaireComplete;
    #depositSent;
    #depositReceived;
    #buildInProgress;
    #draftReady;
    #revisionsInProgress;
    #launching;
    #live;
    #paused;
    #cancelled;
  };

  public func statusToText(status : Status) : Text {
    switch (status) {
      case (#questionnairePending) { "QUESTIONNAIRE PENDING" };
      case (#questionnaireComplete) { "QUESTIONNAIRE COMPLETE" };
      case (#depositSent) { "DEPOSIT SENT" };
      case (#depositReceived) { "DEPOSIT RECEIVED" };
      case (#buildInProgress) { "BUILD IN PROGRESS" };
      case (#draftReady) { "DRAFT READY" };
      case (#revisionsInProgress) { "REVISIONS IN PROGRESS" };
      case (#launching) { "LAUNCHING" };
      case (#live) { "LIVE" };
      case (#paused) { "PAUSED" };
      case (#cancelled) { "CANCELLED" };
    };
  };
};
