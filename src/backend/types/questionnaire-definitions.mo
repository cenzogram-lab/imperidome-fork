import Debug "mo:core/Debug";

module {
  /// A single question definition for a questionnaire type.
  /// inputType: one of "text" | "textarea" | "date" | "select" | "checkbox"
  /// options: used only when inputType is "select" or "checkbox"
  public type QuestionDefinition = {
    id : Text;
    tierCode : Text;
    label : Text;
    placeholder : Text;
    description : Text;
    inputType : Text;
    options : [Text];
    required : Bool;
    sortOrder : Nat;
  };

  /// Valid tier codes for questionnaire types.
  public let VALID_TIER_CODES : [Text] = [
    "DIGITAL PRESENCE",
    "AUTHORITY SITE",
    "BOOKING PRO",
    "RESTAURANT PRO",
    "RESTAURANT EMPIRE",
    "DIGITAL STOREFRONT",
    "MEMBERSHIP ENGINE",
    "ENTERPRISE SCALE",
    "SPEEDY BASIC",
    "SPEEDY BOOKING",
    "SPEEDY PRODUCT STOREFRONT",
    "SPEEDY MENU STOREFRONT",
    "SPEEDY RECURRING STOREFRONT",
    "CinematicAds",
    "ProductAds",
    "AIReceptionist"
  ];
};
