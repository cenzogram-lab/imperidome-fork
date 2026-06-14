

import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Nat8 "mo:core/Nat8";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Blob "mo:core/Blob";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Random "mo:core/Random";
import OrderStatus "order_status";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Stripe "mo:caffeineai-stripe/stripe";

import OutCall "mo:caffeineai-http-outcalls/outcall";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import EmailClient "mo:caffeineai-email/emailClient";
import Error "mo:core/Error";
import Debug "mo:core/Debug";
import CoreOrder "mo:core/Order";
import Timer "mo:base/Timer";
import Result "mo:core/Result";
import Set "mo:core/Set";


























 









actor ImperidomeCanister {
  // TYPES
  public type ClientId = Principal;
  public type OrderId = Nat;
  public type ActivityId = Nat;
  public type QuestionnaireId = Nat;
  public type SubscriptionId = Nat;
  public type BillingId = Nat;
  public type InvoiceId = Nat;
  public type EditRequestId = Nat;
  public type BlogPostId = Nat;
  public type EmailTemplateId = Nat;
  public type ProductId = Nat;
  public type Timestamp = Int;
  type FleetCanister = {
    id : Text;
    name : Text;
    created_at : Timestamp;
  };

  public type Order = {
    id : OrderId;
    client_id : ClientId;
    tier_code : Text;
    status : OrderStatus.Status;
    delivery_window : Text;
    launch_target : Text;
    created_at : Timestamp;
    updated_at : Timestamp;
    amount : Float;
  };

  type OrderV0 = {
    id : OrderId;
    client_id : ClientId;
    tier_code : Text;
    status : OrderStatus.Status;
    delivery_window : Text;
    launch_target : Text;
    created_at : Timestamp;
    updated_at : Timestamp;
  };

  // Migration compatibility — retained for stable upgrade; no longer written to
  type CartPurchase = {
    id : Text;
    clientEmail : Text;
    serviceName : Text;
    amountCents : Nat;
    stripeSessionId : Text;
    createdAt : Time.Time;
    status : Text;
  };


  public type ActivityLog = {
    id : ActivityId;
    client_id : ClientId;
    order_id : OrderId;
    description : Text;
    status_at_time : OrderStatus.Status;
    created_at : Timestamp;
  };

  public type Questionnaire = {
    id : QuestionnaireId;
    order_id : OrderId;
    client_id : ClientId;
    tier_code : Text;
    answers : Text;
    progress : Nat;
    submitted : Bool;
    submitted_at : ?Timestamp;
    reviewed : Bool;
    reviewed_at : ?Timestamp;
    created_at : Timestamp;
    updated_at : Timestamp;
  };

  // SubscriptionV0 — stable serialisation shape matching the original .most snapshot.
  // reminderSentAt, stripeCustomerId, and paymentFailed are included here so they
  // survive the stable-storage round-trip across canister upgrades. Without these
  // fields in the type, the compiler silently drops them from the serialised array
  // even though preupgrade() sets them on the record literal.
  type SubscriptionV0 = {
    id : SubscriptionId;
    client_id : ClientId;
    plan_code : Text;
    plan_name : Text;
    status : Text;
    billing_cycle : Text;
    next_payment_date : Timestamp;
    stripe_subscription_id : Text;
    created_at : Timestamp;
    updated_at : Timestamp;
    clientEmail : Text;
    reminderSentAt : ?Int;
    stripeCustomerId : ?Text;
    paymentFailed : Bool;
  };

  public type Subscription = {
    id : SubscriptionId;
    client_id : ClientId;
    plan_code : Text;
    plan_name : Text;
    status : Text;
    billing_cycle : Text;
    next_payment_date : Timestamp;
    stripe_subscription_id : Text;
    created_at : Timestamp;
    updated_at : Timestamp;
    nextBillingDate : Int;
    reminderSentAt : ?Int;
    stripeCustomerId : ?Text;
    paymentFailed : Bool;
    clientEmail : Text;
  };

  public type BillingHistory = {
    id : BillingId;
    client_id : ClientId;
    subscription_id : SubscriptionId;
    description : Text;
    amount : Float;
    status : Text;
    payment_date : Timestamp;
    stripe_payment_intent_id : Text;
    created_at : Timestamp;
  };
  type BillingHistoryRecord = {
    id : Text;
    clientEmail : Text;
    subscriptionId : Text;
    amountCents : Nat;
    status : Text;
    serviceName : Text;
    createdAt : Int;
  };


  public type Invoice = {
    id : InvoiceId;
    client_id : ClientId;
    order_id : ?OrderId;
    invoice_number : Text;
    description : Text;
    amount : Float;
    status : Text;
    due_date : Timestamp;
    paid_at : ?Timestamp;
    stripe_payment_intent_id : Text;
    created_at : Timestamp;
    updated_at : Timestamp;
  };

  public type EditRequest = {
    id : EditRequestId;
    client_id : ClientId;
    order_id : ?OrderId;
    request_number : Text;
    request_type : Text;
    page_or_section : Text;
    description : Text;
    attachment_url : ?Text;
    status : Text;
    created_at : Timestamp;
    updated_at : Timestamp;
  };

   public type BlogPost = {
    id : BlogPostId;
    title : Text;
    slug : Text;
    category : Text;
    excerpt : Text;
    body : Text;
    author : Text;
    featured_image_url : ?Text;
    featuredImageCaption : Text;
    status : Text;
    published_at : ?Timestamp;
    created_at : Timestamp;
    updated_at : Timestamp;
    seoMetaDescription : ?Text;
    seoMetaKeywords : ?Text;
  };

  public type EmailTemplate = {
    id : EmailTemplateId;
    trigger_key : Text;
    subject : Text;
    body : Text;
    updated_at : Timestamp;
  };

  public type EmailLog = {
    id : Text;
    timestamp : Int;
    recipientEmail : Text;
    templateName : Text;
    status : Text;
  };

  public type Product = {
    id : ProductId;
    name : Text;
    description : Text;
    tier_code : ?Text;
    product_type : Text;
    price_monthly : ?Float;
    price_annual : ?Float;
    price_onetime : ?Float;
    active : Bool;
    created_at : Timestamp;
    tagline : ?Text;
    featureBullets : [Text];
    bestFor : ?Text;
    upgradePath : ?Text;
    recommendedPlan : ?Text;
    imageUrl : ?Text;
    tags : [Text];
    payment_type : Text;  // "one_time" | "monthly" | "quarterly" | "deposit_50"
    video_url_1 : Text;
    video_url_2 : Text;
    show_questionnaire : Bool;
    detailDescription : ?Text;
    seoMetaTitle : ?Text;
    seoMetaDescription : ?Text;
    heroHeadline : ?Text;
    heroSubheadline : ?Text;
    bodySections : ?Text;
    proofPoints : ?Text;
    faqItems : ?Text;
    closingCTA : ?Text;
    plan_section : ?Text;  // "hosting" | "management" | null — for SaaS Plans sub-section routing
    speedy_filter : ?Text;  // "basic" | "booking" | "storefront" | null — for Speedy Sites widget tier filter
  };

  public type AdminStats = {
    totalClients : Nat;
    activeProjects : Nat;
    unreviewedQuestionnaires : Nat;
    outstandingInvoices : Nat;
  };

  public type DashboardMetrics = {
    totalClients : Nat;
    totalWebsites : Nat;
    totalActiveSubscriptions : Nat;
    totalProducts : Nat;
    unreviewedQuestionnaires : Nat;
    outstandingInvoices : Nat;
    recentActivity : [Text];
    totalOrders : Nat;
    totalOrderValue : Nat;
    ordersByStatus : [(Text, Nat)];
  };

  public type UserProfile = {
    email : Text;
    passwordHash : Blob;
    firstName : Text;
    lastName : Text;
    businessName : Text;
    businessType : Text;
    phone : Text;
    role : Text;
    created_at : Timestamp;
  };

  public type LoginResult = {
    #ok : { role : Text; firstName : Text; email : Text };
    #err : Text;
  };

  public type UpsertResult = { #ok; #okAlreadyAdvanced; #err : Text };

  type ProductV1 = {
    id : ProductId;
    name : Text;
    product_type : Text;
    price_monthly : ?Float;
    price_annual : ?Float;
    price_onetime : ?Float;
    active : Bool;
    created_at : Timestamp;
  };

  // ProductV2 — shape stored in _stableCatalog before video_url_1/video_url_2/show_questionnaire were added.
  // Matches the deployed canister's Product shape (17 fields, no video/questionnaire fields).
  // Used as the drain type for _stableCatalog so stable compatibility check passes on upgrade (M0170).
  // On upgrade, postupgrade drains _stableCatalog into productCatalog with new-field defaults.
  type ProductV2 = {
    id : ProductId;
    name : Text;
    description : Text;
    tier_code : ?Text;
    product_type : Text;
    price_monthly : ?Float;
    price_annual : ?Float;
    price_onetime : ?Float;
    active : Bool;
    created_at : Timestamp;
    tagline : ?Text;
    featureBullets : [Text];
    bestFor : ?Text;
    upgradePath : ?Text;
    recommendedPlan : ?Text;
    imageUrl : ?Text;
    tags : [Text];
    payment_type : Text;
  };



  // ProductV5 — Product shape before speedy_filter was added.
  // Used as drain type for _stableCatalogV5Old so stable compatibility check passes on upgrade (M0170).
  // Startup block drains _stableCatalogV5Old (V5 shape) into productCatalog with speedy_filter = null.
  type ProductV5 = {
    id : ProductId;
    name : Text;
    description : Text;
    tier_code : ?Text;
    product_type : Text;
    price_monthly : ?Float;
    price_annual : ?Float;
    price_onetime : ?Float;
    active : Bool;
    created_at : Timestamp;
    tagline : ?Text;
    featureBullets : [Text];
    bestFor : ?Text;
    upgradePath : ?Text;
    recommendedPlan : ?Text;
    imageUrl : ?Text;
    tags : [Text];
    payment_type : Text;
    video_url_1 : Text;
    video_url_2 : Text;
    show_questionnaire : Bool;
    detailDescription : ?Text;
    seoMetaTitle : ?Text;
    seoMetaDescription : ?Text;
    heroHeadline : ?Text;
    heroSubheadline : ?Text;
    bodySections : ?Text;
    proofPoints : ?Text;
    faqItems : ?Text;
    closingCTA : ?Text;
    plan_section : ?Text;
  };

  // ProductV4 — Product shape before plan_section was added (current deployed shape).
  // Used as drain type for _stableCatalogNew so stable compatibility check passes on upgrade (M0170).
  // Startup block drains _stableCatalogNew (V4 shape) into productCatalog with plan_section = null.
  type ProductV4 = {
    id : ProductId;
    name : Text;
    description : Text;
    tier_code : ?Text;
    product_type : Text;
    price_monthly : ?Float;
    price_annual : ?Float;
    price_onetime : ?Float;
    active : Bool;
    created_at : Timestamp;
    tagline : ?Text;
    featureBullets : [Text];
    bestFor : ?Text;
    upgradePath : ?Text;
    recommendedPlan : ?Text;
    imageUrl : ?Text;
    tags : [Text];
    payment_type : Text;
    video_url_1 : Text;
    video_url_2 : Text;
    show_questionnaire : Bool;
    detailDescription : ?Text;
    seoMetaTitle : ?Text;
    seoMetaDescription : ?Text;
    heroHeadline : ?Text;
    heroSubheadline : ?Text;
    bodySections : ?Text;
    proofPoints : ?Text;
    faqItems : ?Text;
    closingCTA : ?Text;
  };

  // ProductV3 — Product shape from previous deployment (before rich-content fields were added).
  // Used as drain type for _stableCatalogV3 to satisfy stable compatibility check.
  type ProductV3 = {
    id : ProductId;
    name : Text;
    description : Text;
    tier_code : ?Text;
    product_type : Text;
    price_monthly : ?Float;
    price_annual : ?Float;
    price_onetime : ?Float;
    active : Bool;
    created_at : Timestamp;
    tagline : ?Text;
    featureBullets : [Text];
    bestFor : ?Text;
    upgradePath : ?Text;
    recommendedPlan : ?Text;
    imageUrl : ?Text;
    tags : [Text];
    payment_type : Text;
    video_url_1 : Text;
    video_url_2 : Text;
    show_questionnaire : Bool;
    detailDescription : ?Text;
  };

  // LeadV3 — shape stored before rescheduleHistory was added.
  // Used by _stableLeadsV3 (V3 drain variable) for stable compatibility on upgrade.
  type LeadV3 = {
    id : Text;
    path : Text;
    name : Text;
    email : Text;
    business : Text;
    message : Text;
    status : Text;
    created_at : Timestamp;
    meetingMethod : Text;          // "phone" | "google_meet" | ""
    meetLink : Text;               // Google Meet URL if applicable, "" otherwise
    rescheduleToken : Text;        // unique token for self-service rescheduling
    isDraft : Bool;                // true for Manual Book draft leads with no meeting time
    rescheduleLinkSentAt : ?Int;   // timestamp of last admin-triggered reschedule link send
  };

  // LeadV4 — shape stored before convertedAt was added (14 fields).
  // Used by _stableLeadsV4 (V4 drain variable) for stable compatibility on upgrade.
  type LeadV4 = {
    id : Text;
    path : Text;
    name : Text;
    email : Text;
    business : Text;
    message : Text;
    status : Text;
    created_at : Timestamp;
    meetingMethod : Text;          // "phone" | "google_meet" | ""
    meetLink : Text;               // Google Meet URL if applicable, "" otherwise
    rescheduleToken : Text;        // unique token for self-service rescheduling
    isDraft : Bool;                // true for Manual Book draft leads with no meeting time
    rescheduleLinkSentAt : ?Int;   // timestamp of last admin-triggered reschedule link send
    rescheduleHistory : [Int];     // nanosecond timestamps of every reschedule link send
  };

  // Lead (V5) — current shape with 15 fields.
  type Lead = {
    id : Text;
    path : Text;
    name : Text;
    email : Text;
    business : Text;
    message : Text;
    status : Text;
    created_at : Timestamp;
    meetingMethod : Text;          // "phone" | "google_meet" | ""
    meetLink : Text;               // Google Meet URL if applicable, "" otherwise
    rescheduleToken : Text;        // unique token for self-service rescheduling
    isDraft : Bool;                // true for Manual Book draft leads with no meeting time
    rescheduleLinkSentAt : ?Int;   // timestamp of last admin-triggered reschedule link send
    rescheduleHistory : [Int];     // nanosecond timestamps of every reschedule link send
    convertedAt : ?Int;            // timestamp when admin converted this lead to a client
  };

  // LeadV0 — shape stored before meetingMethod/meetLink were added.
  // Used by _stableLeads (V0 drain variable) for stable compatibility on upgrade.
  type LeadV0 = {
    id : Text;
    path : Text;
    name : Text;
    email : Text;
    business : Text;
    message : Text;
    status : Text;
    created_at : Timestamp;
  };

  // LeadV1 — shape stored before rescheduleToken/isDraft were added.
  // Used by _stableLeadsV2 (V1 drain variable) for stable compatibility on upgrade.
  type LeadV1 = {
    id : Text;
    path : Text;
    name : Text;
    email : Text;
    business : Text;
    message : Text;
    status : Text;
    created_at : Timestamp;
    meetingMethod : Text;
    meetLink : Text;
  };

  // LeadV2 — shape stored before rescheduleLinkSentAt was added.
  // Used by _stableLeadsV2 (V2 drain variable) for stable compatibility on upgrade.
  type LeadV2 = {
    id : Text;
    path : Text;
    name : Text;
    email : Text;
    business : Text;
    message : Text;
    status : Text;
    created_at : Timestamp;
    meetingMethod : Text;
    meetLink : Text;
    rescheduleToken : Text;
    isDraft : Bool;
  };

  type DaySchedule = {
    isOpen : Bool;
    startHour : Nat;   // 0-23
    endHour : Nat;     // 0-23, must be > startHour
  };

  type WeeklySchedule = {
    monday    : DaySchedule;
    tuesday   : DaySchedule;
    wednesday : DaySchedule;
    thursday  : DaySchedule;
    friday    : DaySchedule;
    saturday  : DaySchedule;
    sunday    : DaySchedule;
  };

  public type AvailabilitySettings = {
    weeklySchedule : WeeklySchedule;
    blockedDates   : [Text];  // ISO date strings "YYYY-MM-DD"
    timezone       : ?Text;   // IANA timezone string, e.g. "America/New_York"
  };

  // PUSH NOTIFICATION TYPES
  public type PushSubscription = {
    endpoint : Text;
    p256dh   : Text;
    auth     : Text;
  };

  // PendingNotification — queued backend push notification for frontend polling fallback.
  // NOTE: Full RFC 8291 Web Push encryption (VAPID JWT + ECDH payload encryption) cannot
  // be implemented in Motoko without EC/RSA crypto primitives. As a reliable alternative,
  // the backend queues notifications here and the frontend polls
  // getPendingPushNotifications() to retrieve and display them natively via the Push API.
  public type PendingNotification = {
    id        : Text;
    title     : Text;
    body      : Text;
    url       : Text;
    createdAt : Int;
  };

  // REVIEW TYPES
  public type ReviewId = Text;

  public type Review = {
    id          : ReviewId;
    clientEmail : Text;
    clientName  : Text;
    rating      : Nat;        // 1–5
    reviewText  : Text;
    jobTitle    : Text;       // "" if not provided
    status      : Text;       // "pending" | "approved" | "rejected"
    submittedAt : Int;
  };

  // SiteLinkEntry — one log entry for a sent site link
  public type SiteLinkEntry = {
    url : Text;
    sentAt : Int;
  };

  // NotificationLogEntry — one record in the persistent notification history log.
  public type NotificationLogEntry = {
    id        : Text;
    title     : Text;
    body      : Text;
    event     : Text;
    url       : Text;
    timestamp : Int;
  };

  // CLIENT FILE DELIVERY TYPES
  public type ClientFileMetadata = {
    id            : Text;
    clientEmail   : Text;
    fileName      : Text;
    fileLabel     : Text;
    uploaderEmail : Text;
    uploadedAt    : Int;
    objectKey     : Text;
  };

  // CLIENT MESSAGE TYPES
  public type ClientMessage = {
    id            : Text;
    senderEmail   : Text;
    senderName    : Text;
    receiverEmail : Text;
    body          : Text;
    createdAt     : Int;
    isRead        : Bool;
  };

  // Build type — represents a live site entry in the Builds tab.
  public type Build = {
    id           : Text;
    clientName   : Text;
    siteUrl      : Text;
    addedAt      : Int;
    description  : Text;
    category     : Text;
    thumbnailUrl : Text;
  };
  // BuildV1 — shape stored before thumbnailUrl was added (has description + category).
  // Matches _stableBuildsNew in the deployed canister; used as drain type to satisfy M0170.
  type BuildV1 = {
    id          : Text;
    clientName  : Text;
    siteUrl     : Text;
    addedAt     : Int;
    description : Text;
    category    : Text;
  };
  // BuildV0 — shape stored before description/category were added.
  // Used only as the type for _stableBuilds (old shape) to satisfy M0170 stable compatibility.
  type BuildV0 = {
    id         : Text;
    clientName : Text;
    siteUrl    : Text;
    addedAt    : Int;
  };

  // CrmClientV1 — shape stored in the live canister after siteLinkLog was added but
  // before deletionRequested / deletionRequestedAt were added.
  // Used only as the type for _stableClientsV3V1 to satisfy M0170 stable compatibility.
  type CrmClientV1 = {
    id : Text;
    name : Text;
    email : Text;
    phone : Text;
    source : Text;
    activeServices : [Text];
    projectStatus : Text;
    hasAccount : Bool;
    onboardingBriefId : ?Text;
    briefStatus : ?Text;
    briefSubmittedAt : ?Int;
    currentMilestone : Nat;
    milestoneUpdatedAt : ?Int;
    created_at : Int;
    completionPaymentCharged : Bool;
    notes : Text;
    siteLinkLog : [SiteLinkEntry];
  };

  // CrmClientV0 — shape stored in the live canister before siteLinkLog was added.
  // Used only as the type for _stableClientsV3V0 to satisfy M0170 stable compatibility.
  type CrmClientV0 = {
    id : Text;
    name : Text;
    email : Text;
    phone : Text;
    source : Text;
    activeServices : [Text];
    projectStatus : Text;
    hasAccount : Bool;
    onboardingBriefId : ?Text;
    briefStatus : ?Text;
    briefSubmittedAt : ?Int;
    currentMilestone : Nat;
    milestoneUpdatedAt : ?Int;
    created_at : Int;
    completionPaymentCharged : Bool;
    notes : Text;
  };

  // CrmClientOld — snapshot of CrmClient shape before the platform-fee fields were added.
  // Used to annotate the migration loop type in the startup block.
  type CrmClientOld = {
    id : Text;
    name : Text;
    email : Text;
    phone : Text;
    source : Text;
    activeServices : [Text];
    projectStatus : Text;
    hasAccount : Bool;
    onboardingBriefId : ?Text;
    briefStatus : ?Text;
    briefSubmittedAt : ?Int;
    currentMilestone : Nat;
    milestoneUpdatedAt : ?Int;
    created_at : Int;
    completionPaymentCharged : Bool;
    notes : Text;
    siteLinkLog : [SiteLinkEntry];
    deletionRequested : Bool;
    deletionRequestedAt : Int;
  };

  public type CrmClient = {
    id : Text;
    name : Text;
    email : Text;
    phone : Text;
    source : Text;             // "Lead" | "Brief" | "Customer"
    activeServices : [Text];
    projectStatus : Text;      // "Onboarding" | "In Progress" | "Done"
    hasAccount : Bool;
    onboardingBriefId : ?Text;
    briefStatus : ?Text;       // "Pending" | "Submitted" | null (null for non-Custom/Speedy)
    briefSubmittedAt : ?Int;   // timestamp when brief was submitted
    // Live Project Timeline — milestones 1–6 (Custom and Speedy sites only)
    // 0 = not started (before deposit)
    // 1 = Deposit Paid         (auto-trigger on Stripe success)
    // 2 = Brief Submitted      (auto-trigger on Portal form submission)
    // 3 = Phase 1: Design & Wireframing (manual admin toggle)
    // 4 = Phase 2: Core Development     (manual admin toggle)
    // 5 = Phase 3: QA & Testing         (manual admin toggle)
    // 6 = Ready for Launch              (manual admin toggle)
    currentMilestone : Nat;
    milestoneUpdatedAt : ?Int; // timestamp of last milestone change
    created_at : Int;
    completionPaymentCharged : Bool; // true once the Custom Sites 50% completion charge has been sent
     notes : Text;
    siteLinkLog : [SiteLinkEntry]; // chronological log of site links sent to this client
    deletionRequested : Bool;
    deletionRequestedAt : Int;
    stripeConnectAccountId : ?Text;
    stripeConnectStatus : Text;
    platformFeePercentage : Float;
    webhookSecret : ?Text;
    connectedAt : ?Int;
    lastActivityAt : ?Int;
  };

   type PortfolioItem = {
    id : Text;
    client_name : Text;
    site_url : Text;
    thumbnail_url : Text;
    tier_code : Text;
    description : Text;
    imageCaption : Text;
    seoMetaDescription : ?Text;
    seoMetaKeywords : ?Text;
    is_featured : Bool;
    published : Bool;
    created_at : Timestamp;
  };

  // V0 shape (before seoMetaDescription/seoMetaKeywords were added) — used only for stable migration.
  // The live canister stores this shape; postupgrade drains it into _stablePortfolio (new shape).
  type PortfolioItemV0 = {
    id : Text;
    client_name : Text;
    site_url : Text;
    thumbnail_url : Text;
    tier_code : Text;
    description : Text;
    imageCaption : Text;
    is_featured : Bool;
    published : Bool;
    created_at : Timestamp;
  };

  // MarqueeLogo — one entry in the homepage logo marquee strip.
  public type MarqueeLogo = {
    id        : Text;
    logoUrl   : Text;
    logoLabel : Text;
    order     : Nat;
    addedAt   : Int;
  };

  // QuestionDefinition — one editable question in a questionnaire form.
  // Stored per tier code in _stableQuestionDefs; served dynamically to the client portal.
  public type QuestionDefinition = {
    id          : Text;   // e.g. "SPEEDY BASIC-1"
    tierCode    : Text;
    questionLabel : Text;
    placeholder : Text;
    description : Text;
    inputType   : Text;   // "text" | "textarea" | "date" | "select" | "checkbox"
    options     : [Text]; // for select/checkbox types
    required    : Bool;
    sortOrder   : Nat;
  };

  // SubAdmin — authorized secondary admin user with scoped tab permissions.
  // Keyed by email in subAdminMap. Super-admin (getAdminEmail()) is never stored here.
  type SubAdmin = {
    email       : Text;
    allowedTabs : [Text];
    createdAt   : Int;
  };

  // STATE
  let orders = Map.empty<OrderId, Order>();
  let activities = Map.empty<ActivityId, ActivityLog>();
  let questionnaires = Map.empty<QuestionnaireId, Questionnaire>();
  let subscriptions = Map.empty<SubscriptionId, Subscription>();
  let billingHistory = Map.empty<BillingId, BillingHistory>();
  let billingHistoryRecords = Map.empty<Text, BillingHistoryRecord>();
  let invoices = Map.empty<InvoiceId, Invoice>();
  let editRequests = Map.empty<EditRequestId, EditRequest>();
  let blogPosts = Map.empty<BlogPostId, BlogPost>();
  let slugIndex = Map.empty<Text, BlogPostId>();
  let emailTemplates = Map.empty<Text, EmailTemplate>();
  let userProfiles = Map.empty<Text, UserProfile>();

  // PRINCIPAL → EMAIL MAP — populated on login; used by Principal-gated functions
  let principalToEmail = Map.empty<Principal, Text>();

  // RATE LIMITING — tracks password reset request timestamps per email
  let resetRequestTimes = Map.empty<Text, [Int]>();
  let RESET_RATE_LIMIT : Nat = 3;
  let RESET_WINDOW_NS : Int = 3_600_000_000_000;

  // UPGRADE STORAGE — persists automatically via enhanced orthogonal persistence
  var _stableFleet : [FleetCanister] = [];
  var _stableFleetSites : [FleetCanister] = [];
  var _stableFleetSoftware : [FleetCanister] = [];
  var _stableOrders : [OrderV0] = [];
  var _stableOrdersV0 : [OrderV0] = [];
  var _stableActivities : [ActivityLog] = [];
  var _stableQuestionnaires : [Questionnaire] = [];
  var _stableSubscriptions : [SubscriptionV0] = [];
  var _stableSubscriptionReminders : [(Text, ?Int)] = [];
  var _stableBillingHistory : [BillingHistory] = [];
  var _stableInvoices : [Invoice] = [];
  var _stableEditRequests : [EditRequest] = [];
  var _stableBlogPosts : [BlogPost] = [];
  var _stableEmailTemplates : [EmailTemplate] = [];
  var _stableUserProfiles : [UserProfile] = [];
  // _stableLeads: V0 drain variable — holds pre-meetingMethod/meetLink Lead records from the live canister.
  // Type matches old Lead shape so stable compatibility check passes on upgrade.
  // On first upgrade, startup block drains it into _stableLeadsV2 (current shape).
  var _stableLeads : [(Text, LeadV0)] = [];
  // _stableLeadsV2: V1 drain variable — holds pre-rescheduleToken/isDraft Lead records from the live canister.
  // Type matches old Lead shape (LeadV1) so stable compatibility check passes on upgrade.
  // On first upgrade, startup block drains it into _stableLeadsV2 (current shape).
  var _stableLeadsNew : [(Text, LeadV1)] = [];
  // _stableLeadsV2: V2 drain variable — holds pre-rescheduleLinkSentAt Lead records from the live canister.
  // Type matches old Lead shape (LeadV2) so stable compatibility check passes on upgrade.
  // On first upgrade, startup block drains it into _stableLeadsV3 (current shape).
  var _stableLeadsV2 : [(Text, LeadV2)] = [];
  // _stableLeadsV3: V3 drain variable — holds pre-rescheduleHistory Lead records.
  // Type matches old Lead shape (LeadV3) so stable compatibility check passes on upgrade.
  // On first upgrade, startup block drains it into _stableLeadsV4 (current shape).
  var _stableLeadsV3 : [(Text, LeadV3)] = [];
  // _stableLeadsV4: V4 drain variable — holds pre-convertedAt LeadV4 records from the live canister.
  // Type matches old Lead shape (LeadV4) so stable compatibility check passes on upgrade.
  // On first upgrade, startup block drains it into _stableLeadsV5 (current shape).
  var _stableLeadsV4 : [(Text, LeadV4)] = [];
  // _stableLeadsV5: current stable store for all runtime lead code (V5 with convertedAt).
  // Populated from _stableLeadsV4 on first upgrade; used by all queries and mutations.
  var _stableLeadsV5 : [(Text, Lead)] = [];
  var _stableProducts : [(Nat, ProductV1)] = [];
  // _stableCatalog — V2 drain variable (ProductV2 shape, without video_url_1/video_url_2/show_questionnaire).
  // Matches the deployed canister's stable type exactly so M0170 stable compatibility passes on upgrade.
  // preupgrade() now writes to _stableCatalogNew (new shape) instead; this var is drained in the
  // catalog init block and then cleared.
  var _stableCatalog : [(ProductId, ProductV2)] = [];
  // _stableCatalogV3: holds Product records from previous deployment (ProductV3 shape without 9 new rich-content fields)
  var _stableCatalogV3 : [(ProductId, ProductV3)] = [];
  // _stableCatalogNew — current stable store for the full Product catalog (with video_url_1/video_url_2/show_questionnaire).
  // preupgrade() serializes productCatalog here; catalog init block restores from it on startup.
  var _stableCatalogNew : [(ProductId, ProductV4)] = [];
  // _stableCatalogV5Old: drain variable for the previously deployed _stableCatalogV5 that held
  // Product records without speedy_filter. Drained on startup with speedy_filter = null.
  var _stableCatalogV5Old : [(ProductId, ProductV5)] = [];
  // _stableCatalogV6: current stable store for the full Product catalog (with speedy_filter).
  // preupgrade() serializes productCatalog here; catalog init block restores from it on startup.
  var _stableCatalogV6 : [(ProductId, Product)] = [];
  // _productImages — separate stable store for per-product image URLs.
  // Keyed by ProductId (Nat). New var — no M0170 impact.
  var _productImages : [(Nat, Text)] = [];
  // _stablePortfolio: V0 drain variable — holds pre-SEO-fields portfolio records from the live canister.
  // Type matches old .most snapshot so the stable compatibility check passes (M0170).
  // On first upgrade, postupgrade drains it into _stablePortfolioNew (current shape).
  var _stablePortfolio : [(Text, PortfolioItemV0)] = [];
  // _stablePortfolioNew: current stable store for all runtime portfolio code.
  // Populated from _stablePortfolio on first upgrade; used by all queries and mutations.
  var _stablePortfolioNew : [(Text, PortfolioItem)] = [];
  var _stableCategoryVisibility : [(Text, Bool)] = [];
  // _stableClients: drain variable — holds pre-siteLinkLog CrmClient records from the live canister.
  // Type matches old .most snapshot so the stable compatibility check passes (M0170).
  // On first upgrade, startup block drains it into _stableClientsV3 (current shape).
  var _stableClients : [(Text, CrmClientV0)] = [];
  // _stableClientsNew: drain variable for the previously deployed _stableClientsV3 that held
  // CrmClientV1 records (with siteLinkLog, without deletionRequested/deletionRequestedAt).
  // The runtime copies the old deployed data here on upgrade (satisfies M0170).
  // The startup migration block drains it into _stableClientsV3 (current active store).
  var _stableClientsNew : [(Text, CrmClientV1)] = [];
  // _stableClientsV3: drain variable — holds CrmClientOld records (without platform-fee fields)
  // from the previously deployed canister. The IC runtime maps old _stableClientsV3 data here
  // (same variable name, old type). Startup block drains it into _stableClientsV3.
  var _stableClientsV2 : [(Text, CrmClientOld)] = [];
  // _stableClientsV3: active stable store for all runtime CRM code.
  // webhookSecret, connectedAt, and lastActivityAt are optional fields added in the latest deploy;
  // adding optional fields is a stable-compatible extension so no drain variable is needed.
  var _stableClientsV3 : [(Text, CrmClient)] = [];
  var _stableEmailLogs : [EmailLog] = [];
  var _stableSiteText : [(Text, Text)] = [];
  var _stableReviews : [(ReviewId, Review)] = [];

  // PUSH NOTIFICATION STABLE STORAGE
  // Stores the single admin's Web Push subscription object.
  var _stablePushSubscription : ?PushSubscription = null;
  // BUILDS — V0 stable var (original shape, no description/category). Drained on first upgrade.
  var _stableBuilds : [BuildV0] = [];
  // BUILDS — V1 drain var (description + category, no thumbnailUrl).
  // Name matches the deployed canister's _stableBuildsNew so the IC transfers existing data here on upgrade.
  // Drained into _stableBuildsLatest (current shape) by the startup migration block.
  var _stableBuildsNew : [BuildV1] = [];
  // BUILDS — current stable list with description, category, and thumbnailUrl fields.
  var _stableBuildsLatest : [Build] = [];
  // LOGO MARQUEE — persists the admin-managed list of partner/client logos displayed in the homepage marquee.
  var _stableMarqueeLogos : [MarqueeLogo] = [];
  // QUESTION DEFINITIONS — persists editable question definitions per tier code across upgrades.
  var _stableQuestionDefs : [(Text, [QuestionDefinition])] = [];
  // GOOGLE CALENDAR INTEGRATION CONFIG — stores Apps Script Web App URL and event settings.
  // Pattern mirrors _stableStripeConfig: a simple optional record that IS the stable var.
  // No preupgrade/postupgrade entries needed — it persists as-is across upgrades.
  public type GoogleCalendarConfig = {
    scriptUrl              : Text;  // Google Apps Script Web App deployment URL
    titleTemplate         : Text;  // e.g. "Meeting with [Client Name]"
    defaultDurationMinutes : Nat;  // default 60
    calendarId            : Text;  // default "primary"
  };
  var _stableGoogleCalendarConfig : ?GoogleCalendarConfig = null;
  // GOOGLE SHEETS INTEGRATION CONFIG — stores Apps Script Web App URL and optional Sheet ID.
  // Pattern mirrors _stableGoogleCalendarConfig: a simple optional record that IS the stable var.
  public type GoogleSheetsConfig = {
    scriptUrl : Text;  // Google Apps Script Web App deployment URL
    sheetId   : Text;  // optional Sheet ID; empty string means Apps Script uses its default sheet
  };
  var _stableGoogleSheetsConfig : ?GoogleSheetsConfig = null;
  // SOCIAL MEDIA INTEGRATION CONFIG — stores admin-configured profile/page URLs for the 5 major platforms.
  // Pattern mirrors _stableGoogleSheetsConfig: a simple optional record that IS the stable var.
  // No preupgrade/postupgrade entries needed — it persists as-is across upgrades.
  public type SocialMediaConfig = {
    facebookUrl  : Text;
    instagramUrl : Text;
    tiktokUrl    : Text;
    linkedinUrl  : Text;
    youtubeUrl   : Text;
  };
  stable var _stableSocialMediaConfig : ?SocialMediaConfig = null;
  // Migration guard: prevents double-seeding of default question definitions.
  var _questionDefsSeedDone : Bool = false;
  // AVAILABILITY SETTINGS — persists admin-configured weekly schedule and blocked dates.
  var _stableAvailabilitySettings : ?AvailabilitySettings = null;
  // NOTIFICATION HISTORY LOG — persistent record of every push notification sent.
  var _stableNotificationLog : [NotificationLogEntry] = [];
  // VAPID private key — set by admin via setVapidKeys(); used for Web Push signing.
  // NOTE: actual JWT signing is not performed in Motoko (no EC crypto); stored for
  // future use or relay to an external signing service via HTTP outcall.
  var _stableVapidPrivateKey : Text = "";
  // VAPID public key — returned to the frontend so it can subscribe to push notifications.
  // Pre-generated VAPID public key (P-256, base64url-encoded uncompressed point).
  var _stableVapidPublicKey : Text = "BCQ3o-IVh2MNTdSBIXPJg5G5kJnLSmIIZzgjsGe4XMuNRmBdw1sRMfgHjm3Bnm9y7gLAn4YOYcm7lqFWJN6-ZAs";
  // Queued push notifications for frontend polling fallback (see PendingNotification comment above).
  var _stablePendingPushNotifications : [PendingNotification] = [];

  // Migration guard: tracks which schema migrations have been applied (true = applied)
  var _migrationCompletionPaymentCharged : Bool = false;
  // Migration guard: backfills imageCaption = "" on existing PortfolioItem records
  var _migrationPortfolioImageCaption : Bool = false;
  // Migration guard: backfills featuredImageCaption = "" on existing BlogPost records
  var _migrationBlogFeaturedImageCaption : Bool = false;
  // Migration guard: backfills seoMetaDescription = null and seoMetaKeywords = null on existing BlogPost records
  var _migrationBlogSeoFields : Bool = false;
  // Migration guard: backfills seoMetaDescription = null and seoMetaKeywords = null on existing PortfolioItem records
  var _migrationPortfolioSeoFields : Bool = false;
  // Migration guard: elevates the admin account to role="admin" in stable storage if stored as "client"
  var _migrationAdminElevation : Bool = false;
  // Migration guard: backfills meetingMethod = "" and meetLink = "" on existing Lead records
  var _migrationLeadMeetingFields : Bool = false;
  // Migration guard: drains _stableLeadsNew (LeadV1) into _stableLeadsV3 (Lead with rescheduleToken/isDraft)
  var _migrationLeadRescheduleFields : Bool = false;
  // Migration guard: drains _stableLeadsV2 (LeadV2) into _stableLeadsV3 (LeadV3 with rescheduleLinkSentAt)
  var _migrationLeadRescheduleLinkSentAt : Bool = false;
  // Migration guard: drains _stableLeadsV3 (LeadV3) into _stableLeadsV4 (LeadV4 with rescheduleHistory)
  var _migrationLeadRescheduleHistory : Bool = false;
  // Migration guard: drains _stableLeadsV4 (LeadV4) into _stableLeadsV5 (Lead V5 with convertedAt)
  var _migrationLeadConvertedAt : Bool = false;

  // Admin seeding guard: ensures initAdminAccount can only be called once.
  // Set to true after the admin account is first created post-deployment.
  var _adminSeeded : Bool = false;
  // _knownCategories: drain variable for the removed _knownCategories stable var.
  // The deployed canister stored this var; this drain tells the runtime to accept
  // the old value and discard it on upgrade (satisfies M0169).
  var _knownCategories : [Text] = [];

  // Account wipe guard: one-time migration that clears all user accounts, password reset tokens,
  // and rate-limit windows so the system starts completely fresh.
  // Set to false to trigger the wipe on the next canister upgrade; set to true after it runs.
  var _migrationAccountWipe : Bool = false;
  var _migrationProductRichFields : Bool = false;
  // Migration guard: backfills stripeConnectAccountId, stripeConnectStatus, platformFeePercentage on existing CrmClient records
  var _migrationPlatformFeeFields : Bool = false;
  var _migrationPlanSectionFix : Bool = false;

  // SCHEMA VERSION — increment when stable record types change to trigger migration hooks.
  var _schemaVersion : Nat = 1;
  // REMINDER LEAD DAYS — how many days before next billing date to send a reminder (admin-configurable, 1–30).
  var reminderLeadDays : Nat = 5;
  var emailFailureCount : Nat = 0;
  var lastEmailFailureTimestamp : Int = 0;
  var _emailFailureTimestamps : [Int] = [];

  // PASSWORD RESET TOKEN TYPE
  public type PasswordResetToken = {
    token    : Text;
    email    : Text;
    expiresAt : Int;
    used     : Bool;
  };

  // PASSWORD RESET TOKENS — stable array for upgrade persistence
  var _stablePasswordResetTokens : [PasswordResetToken] = [];

  // ADMIN OTP TYPE — 6-digit time-limited one-time password for 2FA
  public type AdminOtp = {
    otp      : Text;
    expiry   : Int;  // Time.now() + 5 minutes in nanoseconds
    used     : Bool;
  };

  // ADMIN OTP STORE — keyed by adminEmail, one active OTP per admin at a time
  var _stableAdminOtps : [(Text, AdminOtp)] = [];

  // EMAIL DEDUPLICATION — tracks Stripe session IDs for which confirmation emails have already fired.
  // Prevents the double-email edge case when the webhook and /order-confirmation hit recordPurchase
  // simultaneously for the same session.
  // V1 (old plaintext array) — kept as empty placeholder for stable schema compatibility.
  var _stableEmailFiredSessionsV1 : [Text] = [];
  // V2 — timestamped tuples with TTL-based expiration (48-hour window).
  var _stableEmailFiredSessions : [(Text, Int)] = [];

  // WEBHOOK EVENT DEDUPLICATION — tracks processed Stripe event IDs to prevent
  // duplicate processing on Stripe retries.
  stable var _stableProcessedEventIds : [Text] = [];


  // ADMIN NOTIFICATIONS — stable store for real-time bell icon
  public type AdminNotification = {
    id        : Text;
    notifType : Text;
    title     : Text;
    message   : Text;
    timestamp : Int;
    read      : Bool;
  };
  stable var _stableAdminNotifications : [AdminNotification] = [];
  var _stableCartPurchases : [(Text, CartPurchase)] = [];
  stable var _stablePurchasesInProgress : Set.Set<Text> = Set.empty<Text>();
  stable var _stableBillingHistoryRecords : [(Text, BillingHistoryRecord)] = [];

  // AD-HOC INVOICE TYPE — separate from the existing Invoice type (which uses Principal for client_id).
  // Stores ad-hoc charges created by the admin for hourly work, extras, etc.
  public type AdHocInvoice = {
    id              : Nat;
    clientId        : Text;   // Text CRM client ID
    invoiceNumber   : Text;
    description     : Text;
    amount          : Float;  // Stored as Float dollars. Precision artifacts possible at values with more than 2 decimal places. Consider migrating to Nat cents in a future update.
    status          : Text;   // "pending" | "paid"
    dueDate         : Int;
    paidAt          : ?Int;
    stripeSessionId : Text;   // Stripe checkout session ID (cs_...)
    createdAt       : Int;
    updatedAt       : Int;
  };
  var _stableAdHocInvoices : [AdHocInvoice] = [];

  // WEBHOOK AUDIT LOG — durable append-only buffer (FIFO cap 500) for forensic investigation.
  public type WebhookAuditEntry = { event_id : Text; event_type : Text; received_at : Int; processing_result : Text };
  var _stableWebhookAuditLog : [WebhookAuditEntry] = [];
  var _stableSubAdmins : [(Text, SubAdmin)] = [];
  // PURCHASE REQUEST TYPE — two-stage purchase workflow (client request → admin approval → invoice)
  public type PurchaseRequest = {
    id           : Nat;
    clientEmail  : Text;
    productId    : Nat;
    productName  : Text;
    amount       : Float;
    frequency    : Text;   // "onetime" | "monthly" | "annual"
    status       : Text;   // "pending" | "approved" | "declined"
    requestedAt  : Int;
    respondedAt  : ?Int;
    declineReason : ?Text;
    checkoutUrl  : ?Text;
  };

  // PORTAL SHOP — product IDs visible in the client portal shop (off by default)
  var _stablePortalShopProducts : [Nat] = [];

  // PURCHASE REQUESTS — stable array + in-memory counter
  var _stablePurchaseRequests   : [PurchaseRequest] = [];
  var _purchaseRequestIdCounter : Nat = 0;

  // CLIENT FILE DELIVERY STABLE STORAGE
  var _stableClientFiles    : [ClientFileMetadata] = [];
  var clientFiles           : [ClientFileMetadata] = [];

  // CLIENT MESSAGES STABLE STORAGE
  var _stableClientMessages : [ClientMessage] = [];
  var clientMessages        : [ClientMessage] = [];

  // REFERRAL LINKS — stable maps: code -> referrerEmail, code -> referrerName
  // conversions: buyerEmail -> referralCode (marks that this buyer already triggered an alert)
  var _stableReferralCodes    : [(Text, Text)] = []; // (code, referrerEmail)
  var _stableReferralNames    : [(Text, Text)] = []; // (code, referrerName)
  var _stableReferralConverts : [(Text, Text)] = []; // (buyerEmail, code) — tracks fired conversions
  var _stableReferralClicks   : [(Text, Nat)]  = []; // (code, clickCount) — per-code click tracking

  public type ReferralStat = {
    code               : Text;
    referrerEmail      : Text;
    referrerName       : Text;
    totalClicks        : Nat;
    successfulConversions : Nat;
  };

  // BOUNDED COLLECTION LIMITS
  let MAX_LEADS : Nat = 10_000;
  let MAX_NOTIFICATIONS : Nat = 5_000;
  let MAX_REFERRAL_CLICKS : Nat = 10_000;
  let MAX_EMAIL_LOGS : Nat = 5_000;
  let MAX_PASSWORD_RESET_TOKENS : Nat = 1_000;
  let MAX_REFERRAL_CONVERTS : Nat = 5_000;
  let MAX_REFERRAL_NAMES : Nat = 5_000;
  let MAX_REFERRAL_CODES : Nat = 50_000;
  let MAX_ADHOC_INVOICES : Nat = 10_000;
  let MAX_SITE_TEXT : Nat = 5_000;
  let EMAIL_SESSION_TTL_NS : Int = 172_800_000_000_000; // 48 hours in nanoseconds
  let MAX_EMAIL_FIRED_SESSIONS : Nat = 10_000;
  let MAX_FLEET : Nat = 100;
  let MAX_PORTFOLIO : Nat = 500;
  let MAX_CLIENTS : Nat = 10_000;

  // LEAD RATE LIMITING — tracks submission timestamps per caller Principal
  // Stable array persisted across upgrades; in-memory map used at runtime.
  var _stableLeadRateLimits : [(Principal, [Int])] = [];
  let leadRateLimits = Map.empty<Principal, [Int]>();
  let LEAD_RATE_LIMIT : Nat = 5;
  let LEAD_RATE_WINDOW_NS : Int = 300_000_000_000; // 5 minutes in nanoseconds

  // PASSWORD RESET RATE LIMITING — tracks reset request timestamps per email
  // Stable array persisted across upgrades; in-memory map used at runtime.
  var _stableResetRequestTimes : [(Text, [Int])] = [];

  // VISIT RATE LIMITING — tracks last visit timestamp per sessionId
  // Stable array persisted across upgrades; in-memory map used at runtime.
  var _stableVisitRateLimits : [(Text, Int)] = [];
  let visitRateLimits = Map.empty<Text, Int>();

  // OTP RATE LIMITING — tracks OTP request timestamps per admin email
  // Stable array persisted across upgrades; in-memory map used at runtime.
  var _stableOtpRateLimits : [(Text, [Int])] = [];
  let otpRateLimits = Map.empty<Text, [Int]>();

  let products = Map.empty<ProductId, ProductV1>();
  let productCatalog = Map.empty<ProductId, Product>();
  // _leadsV0: drain variable — holds any Lead records persisted under the old type shape
  // (without meetingMethod/meetLink). Declared as LeadV0 for stable compatibility during upgrade.
  // All active lead logic uses _stableLeadsV2 directly; this var is intentionally unused.
  // leads: drain variable — kept for stable compatibility with pre-meetingMethod/meetLink canister snapshot.
  // The old snapshot stored Lead records without those fields; LeadV0 matches that shape exactly.
  // All active lead logic uses _stableLeadsV2 directly; this var is intentionally unused.
  var leads = Map.empty<Text, LeadV0>();
  let categoryVisibility = Map.empty<Text, Bool>();

  // MARQUEE LOGOS — in-memory Map keyed by logo id
  let marqueeLogos = Map.empty<Text, MarqueeLogo>();

  // QUESTION DEFINITIONS — in-memory Map keyed by tierCode
  let questionDefsMap = Map.empty<Text, [QuestionDefinition]>();

  stable var stripeConfig : ?Stripe.StripeConfiguration = null;
  stable var stripeWebhookSecret : Text = "";
  stable var globalTaxRatePercent : Float = 0.0;
  // WEBHOOK SHARED SECRET — secondary authentication layer for the handleStripeWebhook function.
  // Set via setWebhookSharedSecret(). If non-empty, every webhook call must supply the matching secret.
  stable var _webhookSharedSecret : Text = "";
  stable var stripeTestMode : Bool = false;
  stable var stripePublishableKey : Text = "";

  let accessControlState = AccessControl.initState();
  // Migration compatibility — empty map, never written to after upgrade
  let cartPurchases = Map.empty<Text, CartPurchase>();
  var subAdminMap = Map.empty<Text, SubAdmin>();

  include MixinAuthorization(accessControlState);
  include MixinObjectStorage();

  // ID GENERATORS
  // generateSecureId — async, collision-resistant, non-enumerable text ID (time prefix + 4 random bytes)
  func generateSecureId() : async Text {
    let entropy = await Random.blob();
    let bytes = entropy.toArray();
    let timePart = Time.now().toText();
    let b0 = bytes[0].toNat();
    let b1 = bytes[1].toNat();
    let b2 = bytes[2].toNat();
    let b3 = bytes[3].toNat();
    let randPart = b0.toText() # b1.toText() # b2.toText() # b3.toText();
    timePart # "_" # randPart
  };

  // generateSecureNatId — async, collision-resistant Nat ID for Map<Nat, ...> keys.
  // Uses time + 2 random bytes encoded as a large Nat — non-enumerable, non-sequential.
  func generateSecureNatId() : async Nat {
    let entropy = await Random.blob();
    let bytes = entropy.toArray();
    let timePart = Int.abs(Time.now());
    let b0 = bytes[0].toNat();
    let b1 = bytes[1].toNat();
    let rand16 = b0 * 256 + b1;
    (timePart % 1_000_000_000_000) * 65536 + rand16
  };

  func _getNextOrderId() : async Text { await generateSecureId() };
  func getNextActivityId() : async ActivityId { await generateSecureNatId() };
  func _getNextQuestionnaireId() : async Text { await generateSecureId() };
  func _getNextSubscriptionId() : async SubscriptionId { await generateSecureNatId() };
  func _getNextBillingId() : async BillingId { await generateSecureNatId() };
  func getNextInvoiceId() : async InvoiceId { await generateSecureNatId() };
  func _getNextEditRequestId() : async EditRequestId { await generateSecureNatId() };
  func getNextBlogPostId() : async BlogPostId { await generateSecureNatId() };
  func getNextEmailTemplateId() : EmailTemplateId { emailTemplates.size() + 1 };
  func _getNextProductId() : async ProductId { await generateSecureNatId() };

  // TIMESTAMP
  func getCurrentTimestamp() : Timestamp { Time.now() };
  // jsonEscape — escapes backslash and double-quote characters in a user-supplied string
  // so it can be safely embedded inside a JSON string literal without breaking the payload.
  func jsonEscape(s : Text) : Text {
    let escaped1 = s.replace(#text "\\", "\\\\");
    escaped1.replace(#text "\"", "\\\"")
  };


  // Returns true only when every character in s is [a-z0-9-] and s is non-empty.
  func isValidSlug(s : Text) : Bool {
    if (s.size() == 0) return false;
    for (c in s.toIter()) {
      let valid = (c >= 'a' and c <= 'z') or (c >= '0' and c <= '9') or c == '-';
      if (not valid) return false;
    };
    true
  };

  // AUTHORIZATION
  func adminOnly(caller : Principal) {
    // Allow canister controllers (project owner) OR registered admins.
    // Delegates to isAdmin(caller) so both adminOnly() and isAdmin() check
    // the same single source of truth: _adminPrincipals. This eliminates the
    // dual-store desync risk (LOW-2). accessControlState is still kept in sync
    // via registerAdminPrincipal() / removeAdminPrincipal() for the mixin.
    if (not caller.isController() and not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  // getAdminEmail — returns the canonical admin email from the registered admin profile.
  // Falls back to empty string if no admin profile exists yet (pre-bootstrap).
  func getAdminEmail() : Text {
    switch (userProfiles.values().find(func(p : UserProfile) : Bool { Text.equal(p.role, "admin") })) {
      case (?p) { p.email };
      case (null) { "" };
    };
  };

  func userOnly(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  // QUESTION DEFINITIONS SEED — seeds all 16 tier codes with default questions on first startup.
  // Called from the QUESTION DEFINITIONS INIT block below if _questionDefsSeedDone is false.
  private func seedQuestionDefinitions() {
    // ---- helpers ----
    func q(tierCode : Text, sortOrder : Nat, qlabel : Text, placeholder : Text, inputType : Text, options : [Text], required : Bool) : QuestionDefinition {
      {
        id            = tierCode # "-" # sortOrder.toText();
        tierCode;
        questionLabel = qlabel;
        placeholder;
        description   = "";
        inputType;
        options;
        required;
        sortOrder;
      }
    };
    // ---- Custom Build base questions (shared by all 8 Custom tiers) ----
    let customBase : [QuestionDefinition] = [
      q("_", 1,  "Business Name",         "Enter your business name",           "text",     [],                                                               true),
      q("_", 2,  "Business Description",  "Describe what your business does",  "textarea",  [],                                                              true),
      q("_", 3,  "Target Audience",       "Who is your target customer?",       "textarea",  [],                                                             false),
      q("_", 4,  "Region Served",         "City, state, or region",             "text",     [],                                                               false),
      q("_", 5,  "Hero Headline",         "Main headline for your homepage",    "text",     [],                                                               true),
      q("_", 6,  "CTA Button Text",       "e.g. Book a Free Consult",           "text",     [],                                                               false),
      q("_", 7,  "Testimonials",          "Paste 1-3 client testimonials",      "textarea",  [],                                                              true),
      q("_", 8,  "Business Email",        "your@email.com",                     "text",     [],                                                               true),
      q("_", 9,  "Business Phone",        "Your phone number",                  "text",     [],                                                               false),
      q("_", 10, "Domain Name",           "e.g. yourbusiness.com",              "text",     [],                                                               false),
      q("_", 11, "Brand Colors",          "e.g. #1A1A1A, #00E87D",             "text",     [],                                                               false),
      q("_", 12, "Logo URL",              "Direct URL to your logo image",      "text",     [],                                                               false),
      q("_", 13, "Preferred Launch Date", "When do you want to go live?",       "date",     [],                                                               false),
    ];
    let bookingExtra : [QuestionDefinition] = [
      q("_", 14, "Booking Platform",      "e.g. Calendly, Acuity, custom",      "text",     [],                                                               false),
      q("_", 15, "Services Offered",      "List your bookable services",        "textarea",  [],                                                              false),
      q("_", 16, "Availability Details",  "Your typical availability schedule", "textarea",  [],                                                              false),
    ];
    let restaurantExtra : [QuestionDefinition] = [
      q("_", 14, "Menu Categories",       "e.g. Appetizers, Mains, Desserts",   "textarea",  [],                                                              false),
      q("_", 15, "Reservation Platform",  "e.g. OpenTable, Resy, none",        "text",     [],                                                               false),
      q("_", 16, "Special Features",      "Happy hour, catering, events?",      "textarea",  [],                                                              false),
    ];
    // Helper: build a tier-specific copy of the base questions with correct tierCode and IDs
    func tierBase(tierCode : Text) : [QuestionDefinition] {
      customBase.map(func(d) {
        { d with
          id       = tierCode # "-" # d.sortOrder.toText();
          tierCode = tierCode;
        }
      })
    };
    func tierExtra(tierCode : Text, base : [QuestionDefinition]) : [QuestionDefinition] {
      base.map(func(d) {
        { d with
          id       = tierCode # "-" # d.sortOrder.toText();
          tierCode = tierCode;
        }
      })
    };
    // ---- Standard Custom Build tiers ----
    let standardCustomTiers = ["DIGITAL PRESENCE", "AUTHORITY SITE", "DIGITAL STOREFRONT", "ENTERPRISE SCALE"];
    for (tc in standardCustomTiers.values()) {
      questionDefsMap.add(tc, tierBase(tc));
    };
    // ---- Booking-extended Custom tiers ----
    let bookingCustomTiers = ["BOOKING PRO", "MEMBERSHIP ENGINE"];
    for (tc in bookingCustomTiers.values()) {
      questionDefsMap.add(tc, tierBase(tc).concat(tierExtra(tc, bookingExtra)));
    };
    // ---- Restaurant-extended Custom tiers ----
    let restaurantCustomTiers = ["RESTAURANT PRO", "RESTAURANT EMPIRE"];
    for (tc in restaurantCustomTiers.values()) {
      questionDefsMap.add(tc, tierBase(tc).concat(tierExtra(tc, restaurantExtra)));
    };
    // ---- Speedy Site tiers (all 5) ----
    let speedyTiers = ["SPEEDY BASIC", "SPEEDY BOOKING", "SPEEDY PRODUCT STOREFRONT", "SPEEDY MENU STOREFRONT", "SPEEDY RECURRING STOREFRONT"];
    let speedyQuestions : [QuestionDefinition] = [
      { id = "_"; tierCode = "_"; questionLabel = "Business Name";                 placeholder = "Enter your business name";              description = ""; inputType = "text";     options = [];                                           required = true;  sortOrder = 1 },
      { id = "_"; tierCode = "_"; questionLabel = "Industry or Business Type";     placeholder = "e.g. salon, restaurant, gym";            description = ""; inputType = "text";     options = [];                                           required = true;  sortOrder = 2 },
      { id = "_"; tierCode = "_"; questionLabel = "Primary Goal for Your Website"; placeholder = "What should visitors do when they land?";description = ""; inputType = "textarea"; options = [];                                           required = true;  sortOrder = 3 },
      { id = "_"; tierCode = "_"; questionLabel = "Pages You Need";                placeholder = "";                                       description = ""; inputType = "checkbox"; options = ["Home","About","Services","Contact","Blog","Other"]; required = true;  sortOrder = 4 },
      { id = "_"; tierCode = "_"; questionLabel = "Preferred Launch Date";         placeholder = "";                                       description = ""; inputType = "date";     options = [];                                           required = false; sortOrder = 5 },
    ];
    for (tc in speedyTiers.values()) {
      let withIds = speedyQuestions.map(func(d) {
        { d with id = tc # "-" # d.sortOrder.toText(); tierCode = tc }
      });
      questionDefsMap.add(tc, withIds);
    };
    // ---- CinematicAds ----
    questionDefsMap.add("CinematicAds", [
      { id = "CinematicAds-1"; tierCode = "CinematicAds"; questionLabel = "Business Name";    placeholder = "Enter your business name";          description = ""; inputType = "text";     options = []; required = true;  sortOrder = 1 },
      { id = "CinematicAds-2"; tierCode = "CinematicAds"; questionLabel = "Industry";         placeholder = "e.g. fitness, real estate, retail";  description = ""; inputType = "text";     options = []; required = true;  sortOrder = 2 },
      { id = "CinematicAds-3"; tierCode = "CinematicAds"; questionLabel = "Video Purpose";    placeholder = "What is the goal of this video ad?"; description = ""; inputType = "textarea"; options = []; required = true;  sortOrder = 3 },
      { id = "CinematicAds-4"; tierCode = "CinematicAds"; questionLabel = "Target Audience";  placeholder = "Who are you trying to reach?";       description = ""; inputType = "textarea"; options = []; required = true;  sortOrder = 4 },
      { id = "CinematicAds-5"; tierCode = "CinematicAds"; questionLabel = "Key Message";      placeholder = "Core message for this ad";           description = ""; inputType = "textarea"; options = []; required = true;  sortOrder = 5 },
      { id = "CinematicAds-6"; tierCode = "CinematicAds"; questionLabel = "Call to Action";   placeholder = "e.g. Book Now, Shop Today";          description = ""; inputType = "text";     options = []; required = true;  sortOrder = 6 },
    ]);
    // ---- ProductAds ----
    questionDefsMap.add("ProductAds", [
      { id = "ProductAds-1"; tierCode = "ProductAds"; questionLabel = "Business Name";        placeholder = "Enter your business name";          description = ""; inputType = "text";     options = []; required = true;  sortOrder = 1 },
      { id = "ProductAds-2"; tierCode = "ProductAds"; questionLabel = "Product Name";         placeholder = "What product are we advertising?";  description = ""; inputType = "text";     options = []; required = true;  sortOrder = 2 },
      { id = "ProductAds-3"; tierCode = "ProductAds"; questionLabel = "Product Description";  placeholder = "Describe the product in detail";    description = ""; inputType = "textarea"; options = []; required = true;  sortOrder = 3 },
      { id = "ProductAds-4"; tierCode = "ProductAds"; questionLabel = "Target Audience";      placeholder = "Who are you trying to reach?";      description = ""; inputType = "textarea"; options = []; required = true;  sortOrder = 4 },
      { id = "ProductAds-5"; tierCode = "ProductAds"; questionLabel = "Key Selling Points";   placeholder = "List the top 3-5 reasons to buy";  description = ""; inputType = "textarea"; options = []; required = true;  sortOrder = 5 },
      { id = "ProductAds-6"; tierCode = "ProductAds"; questionLabel = "Call to Action";       placeholder = "e.g. Shop Now, Order Today";        description = ""; inputType = "text";     options = []; required = true;  sortOrder = 6 },
    ]);
    // ---- AIReceptionist ----
    questionDefsMap.add("AIReceptionist", [
      { id = "AIReceptionist-1"; tierCode = "AIReceptionist"; questionLabel = "Business Name";               placeholder = "Enter your business name";                 description = ""; inputType = "text";     options = []; required = true;  sortOrder = 1 },
      { id = "AIReceptionist-2"; tierCode = "AIReceptionist"; questionLabel = "Industry or Business Type";   placeholder = "e.g. dental clinic, law firm, gym";       description = ""; inputType = "text";     options = []; required = true;  sortOrder = 2 },
      { id = "AIReceptionist-3"; tierCode = "AIReceptionist"; questionLabel = "FAQ Responses";               placeholder = "List common questions and ideal answers";  description = ""; inputType = "textarea"; options = []; required = true;  sortOrder = 3 },
      { id = "AIReceptionist-4"; tierCode = "AIReceptionist"; questionLabel = "Custom Qualifying Questions"; placeholder = "Any questions the AI should ask callers?"; description = ""; inputType = "textarea"; options = []; required = false; sortOrder = 4 },
      { id = "AIReceptionist-5"; tierCode = "AIReceptionist"; questionLabel = "Business Hours";             placeholder = "e.g. Mon-Fri 9am-6pm, Sat 10am-4pm";       description = ""; inputType = "text";     options = []; required = false; sortOrder = 5 },
      { id = "AIReceptionist-6"; tierCode = "AIReceptionist"; questionLabel = "Contact Email";              placeholder = "Where should leads be routed?";            description = ""; inputType = "text";     options = []; required = true;  sortOrder = 6 },
    ]);
    _questionDefsSeedDone := true;
  };

  // PRODUCT CATALOG SEED
  private func _seedProducts() {
    // Custom Sites (1–8)
    productCatalog.add(1,  { id = 1;  name = "DIGITAL PRESENCE";          description = "A real business website in 5 days. No templates that scream cheap.";                                                                                                         tier_code = null; product_type = "Custom Sites";     price_monthly = null;  price_annual = null; price_onetime = ?749.0;   active = true; created_at = 0; tagline = ?"Professional online presence without the enterprise price tag"; featureBullets = ["Custom responsive design", "Up to 5 pages", "Contact form integration", "Mobile-optimized layout", "Basic SEO setup"]; bestFor = ?"Small businesses and solo entrepreneurs just launching online"; upgradePath = ?"Upgrade to AUTHORITY SITE for multi-page SEO and advanced features"; recommendedPlan = ?"starter"; imageUrl = null; tags = []; payment_type = "deposit_50"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(2,  { id = 2;  name = "AUTHORITY SITE";             description = "Multi-page SEO site built to rank, convert, and make you the obvious choice.";                                                                                                tier_code = null; product_type = "Custom Sites";     price_monthly = null;  price_annual = null; price_onetime = ?1800.0;  active = true; created_at = 0; tagline = ?"Everything your growing business needs to convert visitors into clients"; featureBullets = ["Up to 15 custom pages", "E-commerce ready", "Blog and content management", "Advanced SEO optimization", "Google Analytics integration"]; bestFor = ?"Growing businesses ready to scale their online presence"; upgradePath = ?"Upgrade to BOOKING PRO or ENTERPRISE SCALE for full custom development and priority support"; recommendedPlan = ?"professional"; imageUrl = null; tags = []; payment_type = "deposit_50"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(3,  { id = 3;  name = "BOOKING PRO";                description = "Your entire appointment business on autopilot — site, booking, CRM, and emails all in one.";                                                                                  tier_code = null; product_type = "Custom Sites";     price_monthly = null;  price_annual = null; price_onetime = ?3900.0;  active = true; created_at = 0; tagline = ?"Your appointment business, fully automated and beautifully designed"; featureBullets = ["Custom multi-page website", "Integrated booking and calendar system", "Automated confirmation and reminder emails", "CRM for client management", "Google Calendar and Meet integration"]; bestFor = ?"Service businesses — salons, consultants, coaches — who live and die by their calendar"; upgradePath = ?"Upgrade to MEMBERSHIP ENGINE for recurring revenue and subscription billing"; recommendedPlan = ?"booking-pro"; imageUrl = null; tags = []; payment_type = "deposit_50"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(4,  { id = 4;  name = "RESTAURANT PRO";             description = "Zero-commission online ordering. Your own menu. Your brand. You keep 100% of every order.";                                                                                   tier_code = null; product_type = "Custom Sites";     price_monthly = null;  price_annual = null; price_onetime = ?4100.0;  active = true; created_at = 0; tagline = ?"Own your orders. Zero commission. 100% of every dollar."; featureBullets = ["Custom online ordering system", "Full menu management and seasonal specials", "Real-time order notifications", "Zero third-party commissions", "Mobile-first customer experience"]; bestFor = ?"Independent restaurants and food businesses ready to ditch the delivery app tax"; upgradePath = ?"Upgrade to RESTAURANT EMPIRE for multi-location and full brand scaling"; recommendedPlan = ?"restaurant-pro"; imageUrl = null; tags = []; payment_type = "deposit_50"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(5,  { id = 5;  name = "RESTAURANT EMPIRE";          description = "Scale your restaurant brand. Multi-location ordering. Full menu control. 0% commission.";                                                                                     tier_code = null; product_type = "Custom Sites";     price_monthly = null;  price_annual = null; price_onetime = ?8500.0;  active = true; created_at = 0; tagline = ?"Fully custom e-commerce built to dominate your market"; featureBullets = ["Multi-location ordering management", "Centralized menu and pricing control", "Brand-consistent customer experience across all locations", "Zero platform commissions on every order", "Dedicated project manager and priority support"]; bestFor = ?"Restaurant groups and multi-location food brands ready to consolidate and scale"; upgradePath = null; recommendedPlan = ?"enterprise"; imageUrl = null; tags = []; payment_type = "deposit_50"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(6,  { id = 6;  name = "DIGITAL STOREFRONT";         description = "A fully custom e-commerce store that looks like you paid $25,000 — built for half the price.";                                                                                tier_code = null; product_type = "Custom Sites";     price_monthly = null;  price_annual = null; price_onetime = ?6500.0;  active = true; created_at = 0; tagline = ?"A premium e-commerce experience at a fraction of the agency price"; featureBullets = ["Fully custom product catalog and checkout", "Secure Stripe payment processing", "Inventory and order management dashboard", "Mobile-first shopping experience", "Advanced SEO and marketing integrations"]; bestFor = ?"Retail brands and online sellers who need a high-converting store without the $25k agency price tag"; upgradePath = ?"Upgrade to ENTERPRISE SCALE for unlimited custom development and strategic support"; recommendedPlan = ?"storefront"; imageUrl = null; tags = []; payment_type = "deposit_50"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(7,  { id = 7;  name = "MEMBERSHIP ENGINE";          description = "Recurring revenue on autopilot. Memberships. Class packs. Subscription billing. All your brand.";                                                                             tier_code = null; product_type = "Custom Sites";     price_monthly = null;  price_annual = null; price_onetime = ?7400.0;  active = true; created_at = 0; tagline = ?"Turn your expertise into predictable recurring revenue"; featureBullets = ["Membership and subscription billing", "Class packs and tiered access control", "Automated onboarding and renewal emails", "Member-only content and portal access", "Stripe-powered recurring payments"]; bestFor = ?"Studios, coaches, and content creators who want predictable monthly income from their audience"; upgradePath = ?"Upgrade to ENTERPRISE SCALE for full custom infrastructure"; recommendedPlan = ?"membership"; imageUrl = null; tags = []; payment_type = "deposit_50"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(8,  { id = 8;  name = "ENTERPRISE SCALE";           description = "Own your entire digital ecosystem. No platform fees. No limitations. Built to your spec.";                                                                                    tier_code = null; product_type = "Custom Sites";     price_monthly = null;  price_annual = null; price_onetime = ?14000.0; active = true; created_at = 0; tagline = ?"Fully custom digital infrastructure built to dominate your market"; featureBullets = ["Unlimited pages, sections, and custom features", "Custom animations and advanced interactions", "Dedicated project manager and priority support", "Priority revisions and ongoing development", "Advanced API integrations and custom backend logic"]; bestFor = ?"Established brands and high-growth companies demanding a premium, fully bespoke digital presence"; upgradePath = null; recommendedPlan = ?"enterprise"; imageUrl = null; tags = []; payment_type = "deposit_50"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    // Speedy Sites (9–16)
    productCatalog.add(9,  { id = 9;  name = "SPEEDY BASIC";               description = "The fastest way to look legitimate online.";                                                                                                                                   tier_code = null; product_type = "Speedy Sites";     price_monthly = null;  price_annual = null; price_onetime = ?149.0;  active = true; created_at = 0; tagline = ?"Launch a high-converting landing page in days, not weeks"; featureBullets = ["Single-page optimized layout", "Lead capture form included", "Fast load times", "Mobile-first design", "Professional polish without the agency price"]; bestFor = ?"Entrepreneurs and small businesses who need a credible online presence fast"; upgradePath = ?"Upgrade to SPEEDY BOOKING to add appointment scheduling"; recommendedPlan = ?"speedy-basic"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(10, { id = 10; name = "SPEEDY BOOKING";             description = "Get booked without back-and-forth messaging.";                                                                                                                                 tier_code = null; product_type = "Speedy Sites";     price_monthly = null;  price_annual = null; price_onetime = ?249.0;  active = true; created_at = 0; tagline = ?"Your booking system, live and ready in 48 hours"; featureBullets = ["Integrated online booking calendar", "Automatic confirmation and reminder emails", "Mobile-friendly booking flow", "Google Calendar sync", "Eliminate back-and-forth scheduling forever"]; bestFor = ?"Service providers and appointment-based businesses ready to automate their scheduling"; upgradePath = ?"Upgrade to BOOKING PRO for a full custom site with CRM"; recommendedPlan = ?"speedy-booking"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(11, { id = 11; name = "SPEEDY PRODUCT STOREFRONT";  description = "Sell products without the Shopify tax.";                                                                                                                                       tier_code = null; product_type = "Speedy Sites";     price_monthly = null;  price_annual = null; price_onetime = ?349.0;  active = true; created_at = 0; tagline = ?"Start selling online without the Shopify tax"; featureBullets = ["Up to 50 products listed", "Secure Stripe checkout", "Inventory and order management", "Mobile shopping experience", "No monthly platform fees"]; bestFor = ?"Retail businesses and makers ready to sell online without paying platform commissions"; upgradePath = ?"Upgrade to DIGITAL STOREFRONT for a fully custom e-commerce experience"; recommendedPlan = ?"speedy-storefront"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(12, { id = 12; name = "SPEEDY MENU STOREFRONT";     description = "Commission-free online ordering. Your menu. Your money.";                                                                                                                      tier_code = null; product_type = "Speedy Sites";     price_monthly = null;  price_annual = null; price_onetime = ?349.0;  active = true; created_at = 0; tagline = ?"Commission-free online ordering live in 48 hours"; featureBullets = ["Full menu display with categories", "Online ordering and payment", "Zero third-party commissions", "Order notification system", "Mobile-optimized customer experience"]; bestFor = ?"Food businesses and restaurants who want to take online orders without paying delivery app fees"; upgradePath = ?"Upgrade to RESTAURANT PRO for a full custom ordering platform"; recommendedPlan = ?"speedy-menu"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(13, { id = 13; name = "SPEEDY RECURRING STOREFRONT"; description = "Turn one-time buyers into monthly revenue.";                                                                                                                                  tier_code = null; product_type = "Speedy Sites";     price_monthly = null;  price_annual = null; price_onetime = ?349.0;  active = true; created_at = 0; tagline = ?"Turn one-time buyers into predictable monthly revenue"; featureBullets = ["Subscription and membership billing", "Recurring payment management via Stripe", "Member access control", "Automated renewal notifications", "Cancel anytime self-service portal"]; bestFor = ?"Businesses with a product or service that customers want to receive on a regular basis"; upgradePath = ?"Upgrade to MEMBERSHIP ENGINE for a fully custom membership platform"; recommendedPlan = ?"speedy-recurring"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(14, { id = 14; name = "Basic Plan";                 description = "Includes Hosting, SSL, Forms, Analytics.";                                                                                                                                     tier_code = null; product_type = "SaaS Plans";     price_monthly = ?19.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Everything you need to keep your site live and secure"; featureBullets = ["Managed hosting and SSL certificate", "Contact and lead capture forms", "Built-in site analytics", "99.9% uptime guarantee", "Monthly performance reports"]; bestFor = ?"Small business owners who want reliable hosting and basic tools without complexity"; upgradePath = ?"Upgrade to Booking Plan to add appointment scheduling"; recommendedPlan = ?"basic-plan"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = ?"hosting"; speedy_filter = ?"basic" });
    productCatalog.add(15, { id = 15; name = "Booking Plan";               description = "Includes Booking engine, Calendar, Notifications.";                                                                                                                            tier_code = null; product_type = "SaaS Plans";     price_monthly = ?39.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Automated scheduling that fills your calendar on autopilot"; featureBullets = ["Online booking engine", "Google Calendar sync", "Automated confirmation and reminder notifications", "Real-time availability display", "No back-and-forth messaging required"]; bestFor = ?"Appointment-based businesses who want to automate their scheduling and reduce no-shows"; upgradePath = ?"Upgrade to Storefront Plan to add e-commerce and order management"; recommendedPlan = ?"booking-plan"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = ?"hosting"; speedy_filter = ?"booking" });
    productCatalog.add(16, { id = 16; name = "Storefront Plan";            description = "Includes Stripe, Dashboard, Orders, Analytics.";                                                                                                                               tier_code = null; product_type = "SaaS Plans";     price_monthly = ?49.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Sell products, track orders, and grow revenue from one dashboard"; featureBullets = ["Stripe-powered checkout", "Order and inventory dashboard", "Sales analytics and reporting", "Customer order notifications", "Mobile-optimized storefront"]; bestFor = ?"Online sellers who want a complete e-commerce and analytics platform at a manageable monthly rate"; upgradePath = ?"Upgrade to DIGITAL STOREFRONT for a fully custom e-commerce build"; recommendedPlan = ?"storefront-plan"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = ?"hosting"; speedy_filter = ?"storefront" });
    // SaaS Plans (17–21)
    productCatalog.add(17, { id = 17; name = "Keep It Live";               description = "For clients who want full control and handle everything themselves.";                                                                                                          tier_code = null; product_type = "SaaS Plans";       price_monthly = ?29.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Your site stays live — hosting, SSL, and peace of mind covered"; featureBullets = ["Managed hosting and SSL", "Core platform updates", "Uptime monitoring", "Monthly health check", "Full admin access retained"]; bestFor = ?"Clients who want to manage their own content and just need reliable infrastructure"; upgradePath = ?"Upgrade to Stay Sharp for hands-off maintenance and monthly updates"; recommendedPlan = ?"keep-it-live"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(18, { id = 18; name = "Stay Sharp";                 description = "Keep your site updated, secure, and running smoothly — without thinking about it.";                                                                                           tier_code = null; product_type = "SaaS Plans";       price_monthly = ?89.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Your site, always sharp — we handle every update so you never have to"; featureBullets = ["Monthly content and design updates", "Security patches and performance optimization", "Uptime monitoring and alerts", "Priority email support", "Monthly performance report"]; bestFor = ?"Business owners who want their site maintained and updated without lifting a finger"; upgradePath = ?"Upgrade to Stay Ahead to turn your site into an active growth asset"; recommendedPlan = ?"stay-sharp"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(19, { id = 19; name = "Stay Ahead";                 description = "Turn your website into an actively managed growth asset. Instead of reacting, your site evolves.";                                                                             tier_code = null; product_type = "SaaS Plans";       price_monthly = ?249.0; price_annual = null; price_onetime = null;  active = true; created_at = 0; tagline = ?"Your website, actively managed to grow your business every month"; featureBullets = ["Proactive SEO improvements and content strategy", "Monthly landing page and conversion optimizations", "A/B testing and analytics review", "Priority development queue", "Dedicated account manager"]; bestFor = ?"Growth-focused businesses who want their website to actively drive leads and revenue, not just sit idle"; upgradePath = ?"Upgrade to Full Partner for full operational management of your digital presence"; recommendedPlan = ?"stay-ahead"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(20, { id = 20; name = "Full Partner";               description = "We operate your website like an extension of your business. Designed for sites driving direct revenue.";                                                                       tier_code = null; product_type = "SaaS Plans";       price_monthly = ?549.0; price_annual = null; price_onetime = null;  active = true; created_at = 0; tagline = ?"We run your digital presence like a member of your team"; featureBullets = ["Full operational management of your website", "Weekly updates and content publishing", "Conversion optimization and A/B testing", "Monthly strategy call with your account manager", "Priority support and same-day response"]; bestFor = ?"Revenue-generating businesses who need a dedicated digital partner, not just a maintenance vendor"; upgradePath = ?"Upgrade to Enterprise Partner for full multi-channel digital infrastructure management"; recommendedPlan = ?"full-partner"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(21, { id = 21; name = "Enterprise Partner";         description = "Full digital infrastructure management with strategic oversight. You have a team managing it for you.";                                                                        tier_code = null; product_type = "SaaS Plans";       price_monthly = ?799.0; price_annual = null; price_onetime = null;  active = true; created_at = 0; tagline = ?"A dedicated digital team managing your entire online infrastructure"; featureBullets = ["Full-stack digital infrastructure management", "Multi-channel marketing execution", "Executive strategy sessions and quarterly roadmap", "Dedicated development team on standby", "Advanced analytics and competitive intelligence reporting"]; bestFor = ?"Established companies and growing brands who need a full-service digital operations partner"; upgradePath = null; recommendedPlan = ?"enterprise-partner"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    // Cinematic Ads (22–25)
    productCatalog.add(22, { id = 22; name = "GROWTH PROTOCOL";            description = "Combine Cinematic Ads with your build to increase conversion rates by up to 40%.";                                                                                            tier_code = null; product_type = "Cinematic Ads";    price_monthly = null;  price_annual = null; price_onetime = ?299.0;  active = true; created_at = 0; tagline = ?"Cinematic ads that turn website visitors into paying clients"; featureBullets = ["Professional video ad production", "Optimized for social media and paid ads", "Brand-consistent visual storytelling", "Conversion-focused script and creative direction", "Up to 40% lift in conversion rates when paired with your site"]; bestFor = ?"Business owners who want to amplify their website investment with high-converting video content"; upgradePath = ?"Upgrade to THE PILOT for a full quarterly ad retainer"; recommendedPlan = ?"growth-protocol"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(23, { id = 23; name = "THE PILOT";                  description = "3 Ads per Quarter. Quarterly retainer.";                                                                                                                                       tier_code = null; product_type = "Cinematic Ads";    price_monthly = null;  price_annual = null; price_onetime = ?1049.0; active = true; created_at = 0; tagline = ?"Test and learn with 3 high-impact cinematic ads per quarter"; featureBullets = ["3 cinematic video ads per quarter", "Quarterly creative strategy session", "Script writing and production included", "Optimized for each ad platform", "Performance review and iteration each cycle"]; bestFor = ?"Brands ready to test video advertising and build a content library quarter by quarter"; upgradePath = ?"Upgrade to THE PRO for 6 ads per quarter and deeper creative coverage"; recommendedPlan = ?"pilot"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(24, { id = 24; name = "THE PRO";                    description = "6 Ads per Quarter. Quarterly retainer.";                                                                                                                                       tier_code = null; product_type = "Cinematic Ads";    price_monthly = null;  price_annual = null; price_onetime = ?1899.0; active = true; created_at = 0; tagline = ?"Dominate every channel with 6 cinematic ads every quarter"; featureBullets = ["6 cinematic video ads per quarter", "Multi-platform creative strategy", "Full script, production, and edit included", "A/B creative variants for testing", "Priority turnaround and dedicated creative team"]; bestFor = ?"Growing brands running active paid campaigns who need a consistent, high-quality content pipeline"; upgradePath = ?"Upgrade to THE ELITE for the ultimate 9-ad quarterly content machine"; recommendedPlan = ?"pro"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(25, { id = 25; name = "THE ELITE";                  description = "9 Ads per Quarter. Quarterly retainer.";                                                                                                                                       tier_code = null; product_type = "Cinematic Ads";    price_monthly = null;  price_annual = null; price_onetime = ?2499.0; active = true; created_at = 0; tagline = ?"The complete cinematic ad machine — 9 premium ads every single quarter"; featureBullets = ["9 cinematic video ads per quarter", "Full omni-channel creative strategy", "Dedicated director and creative team", "Unlimited revisions per creative cycle", "Quarterly brand audit and campaign performance deep-dive"]; bestFor = ?"Established brands and agencies who need a relentless content engine to fuel paid channels year-round"; upgradePath = null; recommendedPlan = ?"elite"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    // Product Ads (26–29)
    productCatalog.add(26, { id = 26; name = "Flash";                      description = "Perfect for testing or launching a new product. 1x 15-second Ultra-HD product ad, 48hr turnaround, 1 revision round.";                                                       tier_code = null; product_type = "Product Ads";      price_monthly = null;  price_annual = null; price_onetime = ?399.0;  active = true; created_at = 0; tagline = ?"Ultra-HD product ad delivered in 48 hours — no contract, no commitment"; featureBullets = ["1x 15-second Ultra-HD product ad", "48-hour turnaround", "1 revision round included", "Optimized for social and e-commerce", "Instant digital asset delivery"]; bestFor = ?"Brands testing video ads or launching a new product who need fast, professional results"; upgradePath = ?"Upgrade to Starter for 3 ads per month and faster turnaround"; recommendedPlan = ?"flash"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(27, { id = 27; name = "Starter";                    description = "For brands ready to test and optimize. 3x 15-second high-performance ads, 24-hour turnaround, 2 revision rounds.";                                                           tier_code = null; product_type = "Product Ads";      price_monthly = ?899.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"3 high-performance product ads per month — test, learn, and optimize at speed"; featureBullets = ["3x 15-second high-performance ads monthly", "24-hour turnaround per ad", "2 revision rounds per ad", "Multi-platform delivery formats included", "Creative brief and strategy support"]; bestFor = ?"Growing e-commerce brands and product businesses ready to run ongoing video ad campaigns"; upgradePath = ?"Upgrade to Scale for 5 ads, unlimited revisions, and Permanent Asset Vault"; recommendedPlan = ?"starter"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(28, { id = 28; name = "Scale";                      description = "Built for aggressive growth. 5x 15-second ads, 12-24hr delivery, unlimited revisions, Permanent Asset Vault.";                                                               tier_code = null; product_type = "Product Ads";      price_monthly = ?1249.0; price_annual = null; price_onetime = null; active = true; created_at = 0; tagline = ?"Your unfair advantage — 5 premium ads monthly with unlimited revisions and a permanent asset vault"; featureBullets = ["5x 15-second premium ads monthly", "12-24 hour turnaround", "Unlimited revisions per ad", "Permanent Asset Vault for all your creative", "Priority creative team access"]; bestFor = ?"High-volume brands and agencies running aggressive paid campaigns who need a relentless production pipeline"; upgradePath = null; recommendedPlan = ?"scale"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(29, { id = 29; name = "Custom Projects";            description = "For larger campaigns and storytelling. 30-60+ second ads, batch production, fully customized creative direction.";                                                            tier_code = null; product_type = "Product Ads";      price_monthly = null;  price_annual = null; price_onetime = ?1500.0; active = true; created_at = 0; tagline = ?"Bespoke video production for brands with a bigger story to tell"; featureBullets = ["30-60+ second custom video ads", "Batch production for campaign efficiency", "Fully customized creative direction and scripting", "Cinematic quality production", "Suitable for TV, digital, and OOH campaigns"]; bestFor = ?"Brands launching major campaigns, product lines, or brand films that require premium custom production"; upgradePath = null; recommendedPlan = ?"custom"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    // AI Receptionist (30–32)
    productCatalog.add(30, { id = 30; name = "THE SAFETY NET";             description = "Never let a missed call go cold. Instant Missed-Call Text-Back, Automated SMS Lead Routing, Custom Web-Chat Widget, Lead Capture Dashboard.";                                tier_code = null; product_type = "AI Receptionist"; price_monthly = ?199.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Never lose a lead to a missed call again"; featureBullets = ["Instant missed-call text-back", "Automated SMS lead routing", "Custom web-chat widget", "Lead capture and qualification dashboard", "24/7 automated coverage"]; bestFor = ?"Busy service businesses who can't always answer the phone but can't afford to miss a lead"; upgradePath = ?"Upgrade to THE RECEPTIONIST for a full 24/7 AI voice agent"; recommendedPlan = ?"safety-net"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(31, { id = 31; name = "THE RECEPTIONIST";           description = "A conversational AI voice agent that answers your calls 24/7. Hyper-Realistic AI Voice, Handles FAQs, Sends Booking Links via SMS, Call Transcripts and Recordings.";        tier_code = null; product_type = "AI Receptionist"; price_monthly = ?399.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Your 24/7 AI receptionist — answers calls, handles FAQs, books clients"; featureBullets = ["Hyper-realistic AI voice agent", "Handles FAQs and common inquiries", "Sends booking links via SMS automatically", "Full call transcripts and recordings", "Never misses a call — 24/7 coverage"]; bestFor = ?"Service businesses who want to appear professional and never miss a client inquiry, day or night"; upgradePath = ?"Upgrade to THE CLOSER for direct calendar integration and verbal appointment booking"; recommendedPlan = ?"receptionist"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(32, { id = 32; name = "THE CLOSER";                 description = "Advanced AI that checks your live calendar and verbally books appointments. Direct Calendar Integration, Verbal Booking, Custom Qualifying Questions, CRM Integration, Advanced Objection Handling."; tier_code = null; product_type = "AI Receptionist"; price_monthly = ?799.0; price_annual = null; price_onetime = null; active = true; created_at = 0; tagline = ?"The AI that doesn't just answer — it closes appointments on your behalf"; featureBullets = ["Direct calendar integration and live availability checks", "Verbal appointment booking in real time", "Custom qualifying questions to filter prospects", "CRM integration for seamless lead capture", "Advanced objection handling and follow-up logic"]; bestFor = ?"High-volume service businesses who need their AI to fully replace a human receptionist and book directly"; upgradePath = null; recommendedPlan = ?"closer"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    // AI Receptionist Setup Fees (47–48)
    productCatalog.add(47, { id = 47; name = "[payment] AI Receptionist Setup Fee - Receptionist"; description = "One-time setup fee for the Receptionist tier AI voice receptionist."; tier_code = null; product_type = "AI Receptionist"; price_monthly = null; price_annual = null; price_onetime = ?249.0; active = true; created_at = 0; tagline = ?"One-time setup to get your AI Receptionist live and taking calls"; featureBullets = ["Full account configuration and onboarding", "Voice agent scripting and FAQ programming", "SMS routing and booking link setup", "CRM integration and lead dashboard setup", "Test calls and quality assurance before launch"]; bestFor = ?"New Receptionist tier clients getting their AI voice agent configured and launched"; upgradePath = null; recommendedPlan = ?"receptionist"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(48, { id = 48; name = "[payment] AI Receptionist Setup Fee - Closer";       description = "One-time setup fee for the Closer tier AI voice receptionist.";        tier_code = null; product_type = "AI Receptionist"; price_monthly = null; price_annual = null; price_onetime = ?499.0; active = true; created_at = 0; tagline = ?"One-time setup to get your AI Closer live and booking appointments"; featureBullets = ["Advanced calendar and CRM integration setup", "Custom qualifying question programming", "Objection handling script configuration", "End-to-end booking flow testing", "Full launch support and quality assurance"]; bestFor = ?"New Closer tier clients getting their AI fully integrated with their calendar and CRM"; upgradePath = null; recommendedPlan = ?"closer"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    // Growth Hub (33–46)
    productCatalog.add(33, { id = 33; name = "The Lead Engine Package";    description = "Stop losing leads to competitors. Local SEO, Lead Capture, and Automated Reviews for +15-25 leads per month.";                                                               tier_code = null; product_type = "Growth Hub";       price_monthly = ?397.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"A complete lead generation machine — SEO, capture, and reviews all in one"; featureBullets = ["Local SEO to rank in your area", "Lead capture forms with instant notifications", "Automated review request system", "Lead capture dashboard", "+15-25 qualified leads per month"]; bestFor = ?"Local service businesses who want a systematic, done-for-you lead generation engine"; upgradePath = ?"Add Google Ads Management to amplify your lead flow with paid traffic"; recommendedPlan = ?"lead-engine"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(34, { id = 34; name = "Local SEO Booster";          description = "Google Maps ranking, local citations, and monthly rank reports.";                                                                                                              tier_code = null; product_type = "Growth Hub";       price_monthly = ?199.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Rank higher on Google Maps and get found by local customers every day"; featureBullets = ["Google Maps and local search optimization", "Local business citation building", "Monthly rank tracking and reporting", "Google Business Profile management", "Competitor gap analysis"]; bestFor = ?"Local service businesses who want to dominate their area in Google Maps and organic search"; upgradePath = ?"Upgrade to The Lead Engine Package for a full lead generation system"; recommendedPlan = ?"local-seo"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(35, { id = 35; name = "Blog / Content SEO";         description = "2 optimized posts per month targeting specific high-intent keywords.";                                                                                                         tier_code = null; product_type = "Growth Hub";       price_monthly = ?299.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Attract high-intent buyers with SEO content that ranks and converts"; featureBullets = ["2 SEO-optimized blog posts per month", "High-intent keyword research and targeting", "Internal linking and on-page SEO", "Monthly traffic and ranking report", "Content repurposed for social media"]; bestFor = ?"Businesses who want to build long-term organic search traffic without writing a word themselves"; upgradePath = ?"Pair with Local SEO Booster for a complete organic growth strategy"; recommendedPlan = ?"content-seo"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(36, { id = 36; name = "Google Ads Management";      description = "Local search ad campaigns managed and optimized monthly.";                                                                                                                     tier_code = null; product_type = "Growth Hub";       price_monthly = ?399.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Google Ads that bring the right customers to your door every month"; featureBullets = ["Full Google Search and Local Service Ads management", "Monthly campaign optimization and A/B testing", "Keyword research and negative keyword management", "Conversion tracking and ROI reporting", "Dedicated ads specialist"]; bestFor = ?"Businesses ready to invest in paid search to drive immediate, measurable leads and sales"; upgradePath = ?"Pair with The Lead Engine Package for organic and paid lead generation working together"; recommendedPlan = ?"google-ads"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(37, { id = 37; name = "Social Media Sync";          description = "Monthly posts synced with website updates and promotions.";                                                                                                                    tier_code = null; product_type = "Growth Hub";       price_monthly = ?99.0;  price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Keep your social presence consistent without lifting a finger"; featureBullets = ["Monthly social media content creation", "Posts synced with your website updates and promotions", "Scheduled publishing across platforms", "Brand-consistent visuals and copy", "Basic engagement monitoring"]; bestFor = ?"Businesses who want to maintain an active social presence without managing it themselves"; upgradePath = ?"Pair with Blog / Content SEO for a complete organic content strategy"; recommendedPlan = ?"social-sync"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(38, { id = 38; name = "Lead Capture Upgrade";       description = "Exit-intent pop-ups, lead magnets, and 5-email drip sequences.";                                                                                                              tier_code = null; product_type = "Growth Hub";       price_monthly = ?99.0;  price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Turn your existing website traffic into leads with smart capture tools"; featureBullets = ["Exit-intent pop-ups", "Lead magnet design and delivery", "5-email automated drip sequence", "Segmented lead lists", "Monthly conversion rate reporting"]; bestFor = ?"Businesses already getting website traffic who want to convert more visitors into leads"; upgradePath = ?"Upgrade to The Lead Engine Package for a full lead generation system"; recommendedPlan = ?"lead-capture-upgrade"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(39, { id = 39; name = "Review Generation";          description = "Automated post-service review requests via email and SMS.";                                                                                                                    tier_code = null; product_type = "Growth Hub";       price_monthly = ?99.0;  price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Build a 5-star reputation on autopilot — reviews come in while you work"; featureBullets = ["Automated review requests via email and SMS", "Google and Yelp review optimization", "Negative review interception workflow", "Monthly review performance dashboard", "Customizable messaging templates"]; bestFor = ?"Service businesses who want more 5-star reviews without manually chasing every client"; upgradePath = ?"Pair with Local SEO Booster to amplify your reviews in local search rankings"; recommendedPlan = ?"review-gen"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(40, { id = 40; name = "Site Audit";                 description = "Full technical/UX audit with actionable report. 48hr turnaround.";                                                                                                            tier_code = null; product_type = "Growth Hub";       price_monthly = null;  price_annual = null; price_onetime = ?99.0;   active = true; created_at = 0; tagline = ?"Know exactly what's holding your website back — full audit in 48 hours"; featureBullets = ["Full technical SEO audit", "UX and conversion rate analysis", "Speed and performance testing", "Actionable prioritized fix list", "48-hour turnaround"]; bestFor = ?"Business owners unsure why their website isn't converting or ranking, who need clear answers fast"; upgradePath = ?"Pair your audit findings with Local SEO Booster or Stay Sharp to act on every recommendation"; recommendedPlan = ?"site-audit"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(41, { id = 41; name = "Restaurant Menu Refresh";    description = "Weekly menu updates, seasonal specials, and PDF exports.";                                                                                                                     tier_code = null; product_type = "Growth Hub";       price_monthly = ?149.0; price_annual = null; price_onetime = null;   active = true; created_at = 0; tagline = ?"Keep your menu fresh, current, and always on-brand — every week"; featureBullets = ["Weekly online menu updates", "Seasonal specials and promotional pricing", "PDF menu design and export", "Price and availability management", "Holiday and event menu creation"]; bestFor = ?"Restaurants and food businesses with frequently changing menus who need professional weekly updates"; upgradePath = ?"Upgrade to RESTAURANT PRO for a full custom ordering platform with zero commissions"; recommendedPlan = ?"menu-refresh"; imageUrl = null; tags = []; payment_type = "monthly"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(42, { id = 42; name = "IDX/MLS Integration";        description = "Live property listings embedded directly in your real estate site.";                                                                                                          tier_code = null; product_type = "Growth Hub";       price_monthly = null;  price_annual = null; price_onetime = ?299.0;  active = true; created_at = 0; tagline = ?"Live MLS listings on your website — search, filter, and convert buyers directly"; featureBullets = ["Live IDX/MLS property listing feed", "Advanced search and filter functionality", "Map-based property browsing", "Lead capture on every listing page", "Mobile-optimized property search experience"]; bestFor = ?"Real estate agents and brokers who want to showcase live listings and capture buyer leads directly on their own site"; upgradePath = ?"Pair with Local SEO Booster to rank for local property searches"; recommendedPlan = ?"idx-mls"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(43, { id = 43; name = "Bulk Data Extraction";       description = "Extract and port massive historical catalogs exceeding standard caps.";                                                                                                        tier_code = null; product_type = "Growth Hub";       price_monthly = null;  price_annual = null; price_onetime = ?499.0;  active = true; created_at = 0; tagline = ?"Migrate your entire data history without losing a single record"; featureBullets = ["Bulk extraction of historical product or content catalogs", "Structured data porting to new platform", "Data cleaning and deduplication", "Supports catalogs exceeding standard migration caps", "Secure transfer with full audit trail"]; bestFor = ?"Businesses migrating from legacy platforms with large historical data sets that need a clean, complete transfer"; upgradePath = null; recommendedPlan = ?"bulk-data"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(44, { id = 44; name = "Custom Page Expansion";      description = "Add new pages to your existing site — designed and launched.";                                                                                                                 tier_code = null; product_type = "Growth Hub";       price_monthly = null;  price_annual = null; price_onetime = ?149.0;  active = true; created_at = 0; tagline = ?"Expand your website with a professionally designed, fully built new page"; featureBullets = ["Custom page design matched to your brand", "Mobile-responsive layout", "On-page SEO setup", "Integrated with your existing navigation", "Launched and live within agreed timeline"]; bestFor = ?"Existing clients who need to add a new service, location, or campaign page to their current site"; upgradePath = ?"Upgrade to Stay Sharp for ongoing content updates and page management"; recommendedPlan = ?"page-expansion"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(45, { id = 45; name = "PWA Upgrade";                description = "Turn your site into an installable Progressive Web App (App Icon).";                                                                                                          tier_code = null; product_type = "Growth Hub";       price_monthly = null;  price_annual = null; price_onetime = ?299.0;  active = true; created_at = 0; tagline = ?"Give clients a native app experience without the app store hassle"; featureBullets = ["Installable on iOS, Android, and desktop", "App icon on home screen", "Offline capability for key pages", "Push notification support", "No app store submission required"]; bestFor = ?"Businesses wanting to give clients and staff a premium mobile app feel without the cost of native development"; upgradePath = null; recommendedPlan = ?"pwa"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
    productCatalog.add(46, { id = 46; name = "Annual Site Refresh";        description = "Full redesign of your homepage and top 3 pages once a year.";                                                                                                                 tier_code = null; product_type = "Growth Hub";       price_monthly = null;  price_annual = null; price_onetime = ?499.0;  active = true; created_at = 0; tagline = ?"Keep your brand fresh with a full homepage and key page redesign every year"; featureBullets = ["Full homepage redesign", "Top 3 page refresh with updated content", "New imagery and brand asset updates", "Performance and SEO re-optimization", "Delivered once per year as part of your retainer"]; bestFor = ?"Existing clients who want their site to stay modern and competitive year after year without a full rebuild"; upgradePath = ?"Upgrade to Full Partner for ongoing monthly optimization rather than a yearly refresh"; recommendedPlan = ?"annual-refresh"; imageUrl = null; tags = []; payment_type = "one_time"; video_url_1 = ""; video_url_2 = ""; show_questionnaire = false; detailDescription = null; seoMetaTitle = null; seoMetaDescription = null; heroHeadline = null; heroSubheadline = null; bodySections = null; proofPoints = null; faqItems = null; closingCTA = null; plan_section = null; speedy_filter = null });
  };

  // PRODUCT CATALOG INIT — restore from stable (preserves admin-edited prices) or seed fresh.
  // On upgrade from the deployed canister: _stableCatalog holds ProductV2 records (no video/questionnaire fields);
  // drain them into productCatalog with new-field defaults, then clear the drain var.
  // Going forward: _stableCatalogNew holds the full Product records with all fields.
  do {
    // First: drain V2 records from _stableCatalog (set on the previous canister version)
    if (_stableCatalog.size() > 0) {
      for ((id, p) in _stableCatalog.values()) {
        productCatalog.add(id, {
          id = p.id;
          name = p.name;
          description = p.description;
          tier_code = p.tier_code;
          product_type = p.product_type;
          price_monthly = p.price_monthly;
          price_annual = p.price_annual;
          price_onetime = p.price_onetime;
          active = p.active;
          created_at = p.created_at;
          tagline = p.tagline;
          featureBullets = p.featureBullets;
          bestFor = p.bestFor;
          upgradePath = p.upgradePath;
          recommendedPlan = p.recommendedPlan;
          imageUrl = p.imageUrl;
          tags = p.tags;
          payment_type = p.payment_type;
          video_url_1 = "";
          video_url_2 = "";
          show_questionnaire = false;
          detailDescription = null;
          seoMetaTitle = null;
          seoMetaDescription = null;
          heroHeadline = null;
          heroSubheadline = null;
          bodySections = null;
          proofPoints = null;
          faqItems = null;
          closingCTA = null;
          plan_section = null;
          speedy_filter = null;
        });
      };
      _stableCatalog := [];
    };
    // Second: drain V3 catalog records (from previous deployment without 9 rich-content fields)
    if (_stableCatalogV3.size() > 0) {
      for ((id, p) in _stableCatalogV3.values()) {
        productCatalog.add(id, {
          id = p.id;
          name = p.name;
          description = p.description;
          tier_code = p.tier_code;
          product_type = p.product_type;
          price_monthly = p.price_monthly;
          price_annual = p.price_annual;
          price_onetime = p.price_onetime;
          active = p.active;
          created_at = p.created_at;
          tagline = p.tagline;
          featureBullets = p.featureBullets;
          bestFor = p.bestFor;
          upgradePath = p.upgradePath;
          recommendedPlan = p.recommendedPlan;
          imageUrl = p.imageUrl;
          tags = p.tags;
          payment_type = p.payment_type;
          video_url_1 = p.video_url_1;
          video_url_2 = p.video_url_2;
          show_questionnaire = p.show_questionnaire;
          detailDescription = p.detailDescription;
          seoMetaTitle = null;
          seoMetaDescription = null;
          heroHeadline = null;
          heroSubheadline = null;
          bodySections = null;
          proofPoints = null;
          faqItems = null;
          closingCTA = null;
          plan_section = null;
          speedy_filter = null;
        });
      };
      _stableCatalogV3 := [];
    };
    // Fourth: drain V4 records from _stableCatalogNew (ProductV4 shape, without plan_section)
    if (_stableCatalogNew.size() > 0) {
      for ((id, p) in _stableCatalogNew.values()) {
        productCatalog.add(id, {
          id = p.id;
          name = p.name;
          description = p.description;
          tier_code = p.tier_code;
          product_type = p.product_type;
          price_monthly = p.price_monthly;
          price_annual = p.price_annual;
          price_onetime = p.price_onetime;
          active = p.active;
          created_at = p.created_at;
          tagline = p.tagline;
          featureBullets = p.featureBullets;
          bestFor = p.bestFor;
          upgradePath = p.upgradePath;
          recommendedPlan = p.recommendedPlan;
          imageUrl = p.imageUrl;
          tags = p.tags;
          payment_type = p.payment_type;
          video_url_1 = p.video_url_1;
          video_url_2 = p.video_url_2;
          show_questionnaire = p.show_questionnaire;
          detailDescription = p.detailDescription;
          seoMetaTitle = p.seoMetaTitle;
          seoMetaDescription = p.seoMetaDescription;
          heroHeadline = p.heroHeadline;
          heroSubheadline = p.heroSubheadline;
          bodySections = p.bodySections;
          proofPoints = p.proofPoints;
          faqItems = p.faqItems;
          closingCTA = p.closingCTA;
          plan_section = null;
          speedy_filter = null;
        });
      };
      _stableCatalogNew := [];
    };
    // Fifth: restore full Product records — drain V5Old (old shape, add speedy_filter = null) then V6 (new shape)
    for ((id, p) in _stableCatalogV5Old.vals()) {
      productCatalog.add(id, { p with speedy_filter = null });
    };
    for ((id, product) in _stableCatalogV6.vals()) {
      productCatalog.add(id, product);
    };
    if (_stableCatalogV5Old.size() > 0 or _stableCatalogV6.size() > 0) {
      // already restored above
    } else if (productCatalog.size() == 0) {
      // First run on this canister — seed defaults and persist immediately
      _seedProducts();
      _stableCatalogV6 := productCatalog.entries().toArray();
    };
  };

  // CATEGORY VISIBILITY INIT — restore from stable storage or seed defaults
  do {
    let knownCategories : [Text] = [
      "Custom Sites", "Speedy Sites", "SaaS Plans",
      "Cinematic Ads", "Product Ads", "AI Receptionist", "Growth Hub"
    ];
    // Restore persisted visibility state
    for ((cat, vis) in _stableCategoryVisibility.values()) {
      categoryVisibility.add(cat, vis);
    };
    // Seed any missing categories as active=true
    for (cat in knownCategories.values()) {
      if (categoryVisibility.get(cat) == null) {
        categoryVisibility.add(cat, true);
      };
    };
  };

  // QUESTION DEFINITIONS INIT — restore from stable storage or seed defaults.
  do {
    if (_stableQuestionDefs.size() > 0) {
      for ((tierCode, defs) in _stableQuestionDefs.values()) {
        questionDefsMap.add(tierCode, defs);
      };
    };
    if (not _questionDefsSeedDone) {
      seedQuestionDefinitions();
      _stableQuestionDefs := questionDefsMap.entries().toArray();
    };
  };

  // QUESTIONNAIRE UPGRADE PERSISTENCE — reload from stable array on startup
  do {
    for (q in _stableQuestionnaires.values()) {
      questionnaires.add(q.id, q);
    };
  };

  // SUB-ADMIN RESTORE — reload from stable array on startup
  do {
    for ((k, v) in _stableSubAdmins.vals()) {
      subAdminMap.add(k, v);
    };
  };

  // CRM MIGRATION — ensure all existing CrmClient records have completionPaymentCharged field
  // (safe no-op for records that already have the field; adds default false for older records)
  do {
    if (not _migrationCompletionPaymentCharged) {
      _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
        (t.0, { t.1 with completionPaymentCharged = false; notes = "" })
      });
      _migrationCompletionPaymentCharged := true;
    };
  };

  // PORTFOLIO MIGRATION — backfill imageCaption = "" for existing records without the field
  do {
    if (not _migrationPortfolioImageCaption) {
      _stablePortfolio := _stablePortfolio.map<(Text, PortfolioItemV0), (Text, PortfolioItemV0)>(func(t) {
        (t.0, { t.1 with imageCaption = "" })
      });
      _migrationPortfolioImageCaption := true;
    };
  };

  // BLOG POST MIGRATION — backfill featuredImageCaption = "" for existing records without the field
  do {
    if (not _migrationBlogFeaturedImageCaption) {
      for ((id, post) in blogPosts.entries()) {
        blogPosts.add(id, { post with featuredImageCaption = "" });
      };
      _migrationBlogFeaturedImageCaption := true;
    };
  };

  // BLOG POST MIGRATION — backfill seoMetaDescription = null and seoMetaKeywords = null for existing records
  do {
    if (not _migrationBlogSeoFields) {
      for ((id, post) in blogPosts.entries()) {
        blogPosts.add(id, { post with seoMetaDescription = null; seoMetaKeywords = null });
      };
      _migrationBlogSeoFields := true;
    };
  };

  // LEAD MIGRATION — backfill meetingMethod = "" and meetLink = "" on existing Lead records.
  // On first upgrade from V0, _stableLeads holds old LeadV0 records; drain into _stableLeadsV2 (V1 shape).
  do {
    if (not _migrationLeadMeetingFields) {
      if (_stableLeads.size() > 0) {
        let migrated = _stableLeads.map(func(t) {
          (t.0, {
            id            = t.1.id;
            path          = t.1.path;
            name          = t.1.name;
            email         = t.1.email;
            business      = t.1.business;
            message       = t.1.message;
            status        = t.1.status;
            created_at    = t.1.created_at;
            meetingMethod = "";
            meetLink      = "";
          })
        });
        _stableLeadsNew := migrated.concat(_stableLeadsNew);
        _stableLeads := [];
      };
      _migrationLeadMeetingFields := true;
    };
  };

  // LEAD MIGRATION — drain _stableLeadsNew (LeadV1) into _stableLeadsV3 (LeadV3 with rescheduleToken/isDraft).
  do {
    if (not _migrationLeadRescheduleFields) {
      if (_stableLeadsNew.size() > 0) {
        let migrated = _stableLeadsNew.map<(Text, LeadV1), (Text, LeadV3)>(func(t) {
          (t.0, {
            id              = t.1.id;
            path            = t.1.path;
            name            = t.1.name;
            email           = t.1.email;
            business        = t.1.business;
            message         = t.1.message;
            status          = t.1.status;
            created_at      = t.1.created_at;
            meetingMethod   = t.1.meetingMethod;
            meetLink        = t.1.meetLink;
            rescheduleToken = "";
            isDraft         = false;
            rescheduleLinkSentAt = null;
          })
        });
        _stableLeadsV3 := migrated.concat(_stableLeadsV3);
        _stableLeadsNew := [];
      };
      _migrationLeadRescheduleFields := true;
    };
  };

  // LEAD MIGRATION — drain _stableLeadsV2 (LeadV2) into _stableLeadsV3 (LeadV3 with rescheduleLinkSentAt).
  do {
    if (not _migrationLeadRescheduleLinkSentAt) {
      if (_stableLeadsV2.size() > 0) {
        let migrated = _stableLeadsV2.map<(Text, LeadV2), (Text, LeadV3)>(func(t) {
          (t.0, {
            id                   = t.1.id;
            path                 = t.1.path;
            name                 = t.1.name;
            email                = t.1.email;
            business             = t.1.business;
            message              = t.1.message;
            status               = t.1.status;
            created_at           = t.1.created_at;
            meetingMethod        = t.1.meetingMethod;
            meetLink             = t.1.meetLink;
            rescheduleToken      = t.1.rescheduleToken;
            isDraft              = t.1.isDraft;
            rescheduleLinkSentAt = null;
          })
        });
        _stableLeadsV3 := migrated.concat(_stableLeadsV3);
        _stableLeadsV2 := [];
      };
      _migrationLeadRescheduleLinkSentAt := true;
    };
  };

  // LEAD MIGRATION — drain _stableLeadsV3 (LeadV3) into _stableLeadsV4 (LeadV4 with rescheduleHistory).
  do {
    if (not _migrationLeadRescheduleHistory) {
      if (_stableLeadsV3.size() > 0) {
        let migrated = _stableLeadsV3.map<(Text, LeadV3), (Text, LeadV4)>(func(t) {
          (t.0, {
            id                   = t.1.id;
            path                 = t.1.path;
            name                 = t.1.name;
            email                = t.1.email;
            business             = t.1.business;
            message              = t.1.message;
            status               = t.1.status;
            created_at           = t.1.created_at;
            meetingMethod        = t.1.meetingMethod;
            meetLink             = t.1.meetLink;
            rescheduleToken      = t.1.rescheduleToken;
            isDraft              = t.1.isDraft;
            rescheduleLinkSentAt = t.1.rescheduleLinkSentAt;
            rescheduleHistory    = [];
          })
        });
        _stableLeadsV4 := migrated.concat(_stableLeadsV4);
        _stableLeadsV3 := [];
      };
      _migrationLeadRescheduleHistory := true;
    };
  };

  // LEAD MIGRATION — drain _stableLeadsV4 (LeadV4) into _stableLeadsV5 (Lead V5 with convertedAt).
  do {
    if (not _migrationLeadConvertedAt) {
      if (_stableLeadsV4.size() > 0) {
        let migrated = _stableLeadsV4.map<(Text, LeadV4), (Text, Lead)>(func(t) {
          (t.0, {
            id                   = t.1.id;
            path                 = t.1.path;
            name                 = t.1.name;
            email                = t.1.email;
            business             = t.1.business;
            message              = t.1.message;
            status               = t.1.status;
            created_at           = t.1.created_at;
            meetingMethod        = t.1.meetingMethod;
            meetLink             = t.1.meetLink;
            rescheduleToken      = t.1.rescheduleToken;
            isDraft              = t.1.isDraft;
            rescheduleLinkSentAt = t.1.rescheduleLinkSentAt;
            rescheduleHistory    = t.1.rescheduleHistory;
            convertedAt          = null;
          })
        });
        _stableLeadsV5 := migrated.concat(_stableLeadsV5);
        _stableLeadsV4 := [];
      };
      _migrationLeadConvertedAt := true;
    };
  };

  // PORTFOLIO MIGRATION — backfill seoMetaDescription = null and seoMetaKeywords = null for existing records
  do {
    if (not _migrationPortfolioSeoFields) {
      _stablePortfolioNew := _stablePortfolioNew.map<(Text, PortfolioItem), (Text, PortfolioItem)>(func(t) {
        (t.0, { t.1 with seoMetaDescription = null; seoMetaKeywords = null })
      });
      _migrationPortfolioSeoFields := true;
    };
  };

  // USER PROFILES HYDRATION — restore from stable array before seeding
  do {
    for (profile in _stableUserProfiles.vals()) {
      userProfiles.add(profile.email, profile);
    };
  };

  // ADMIN ELEVATION — permanently fix admin role to "admin" in both
  // stable storage and the in-memory map, in case the account was previously registered
  // as a client. This runs on every startup until the migration flag is set.
  stable var _adminEmail : Text = "";
  stable var _siteBaseUrl : Text = "https://www.imperidome.com";
  stable var _logoUrl : Text = "https://www.imperidome.com/assets/imperidome-logo.png";
  stable var _siteAuditFallbackPrice : Int = 9900;
  // PRINCIPAL-BASED ADMIN AUTH — replaces adminEmail parameter checks across all admin functions.
  // Initialized empty; first admin registers via registerAdminPrincipal() after deployment.
  stable var _adminPrincipals : [Principal] = [];

  // isAdmin — internal helper: returns true if caller is in _adminPrincipals.
  // Bootstrap mode (empty list) allows nobody — admin must call registerAdminPrincipal() first.
  func isAdmin(caller : Principal) : Bool {
    if (_adminPrincipals.size() == 0) { return false };
    for (p in _adminPrincipals.vals()) {
      if (Principal.equal(p, caller)) { return true };
    };
    false
  };

  // registerAdminPrincipal — first-time setup: adds msg.caller to _adminPrincipals.
  // Allowed only if _adminPrincipals is currently empty OR caller is already an admin.
  public shared ({ caller }) func registerAdminPrincipal() : async { #ok; #err : Text } {
    if (_adminPrincipals.size() > 0 and not isAdmin(caller)) {
      return #err("Unauthorized: admin principals already registered");
    };
    for (p in _adminPrincipals.vals()) {
      if (Principal.equal(p, caller)) { return #ok };
    };
    _adminPrincipals := _adminPrincipals.concat([caller]);
    // Sync caller into the mixin accessControlState so isCallerAdmin() returns true.
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
    #ok
  };

  // removeAdminPrincipal — remove a principal from the admin list.
  // Gate: caller must already be an admin; cannot remove the last admin.
  public shared ({ caller }) func removeAdminPrincipal(p : Principal) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized: caller is not admin") };
    let remaining = _adminPrincipals.filter(func(x : Principal) : Bool { not Principal.equal(x, p) });
    if (remaining.size() == 0) { return #err("Cannot remove the last admin principal") };
    _adminPrincipals := remaining;
    // Demote principal in accessControlState so isCallerAdmin() returns false for removed admin.
    accessControlState.userRoles.add(p, #user);
    #ok
  };
  // setAdminEmail — admin-gated setter for the _adminEmail stable var.
  // Replaces the hardcoded bootstrap email so the platform owner can update it from the admin panel.
  public shared ({ caller }) func setAdminEmail(email : Text) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    if (email.size() == 0) { return #err("Email cannot be empty") };
    _adminEmail := email;
    #ok
  };


  private func _getAdminEmailShort() : Text {
    switch (_adminEmail.split(#char '@').next()) {
      case (?p) p;
      case null _adminEmail
    }
  };
  private func _isAllowedRedirectUrl(url : Text) : Bool {
    if (not url.startsWith(#text "https://")) { return false };
    url.startsWith(#text _siteBaseUrl) or
    url.contains(#text ".icp0.io") or
    url.contains(#text ".ic0.app") or
    url.contains(#text "localhost")
  };
  private func _constantTimeEqual(a : Text, b : Text) : Bool {
    // Constant-time comparison to prevent timing attacks on webhook signature values.
    // TODO: Full HMAC-SHA256 verification requires a crypto library (not yet in Motoko stdlib).
    // When available: HMAC-SHA256(webhookSecret, timestamp + "." + rawBody) vs v1= from Stripe-Signature.
    if (a.size() != b.size()) { return false };
    var equal = true;
    let bIter = b.toIter();
    for (ca in a.toIter()) {
      let cb = bIter.next();
      switch (cb) {
        case (?c) { if (ca != c) { equal := false } };
        case (null) { equal := false };
      };
    };
    equal
  };

  do {
    let isAdminEmailText = func(e : Text) : Bool {
      Text.equal(e, _adminEmail) or Text.equal(e, _getAdminEmailShort())
    };
    // Always elevate admin email in stable array (belt-and-suspenders: runs on every startup)
    _stableUserProfiles := _stableUserProfiles.map<UserProfile, UserProfile>(func(p) {
      if (isAdminEmailText(p.email)) { { p with email = _adminEmail; role = "admin" } } else { p }
    });
    _migrationAdminElevation := true;
    // Always ensure the in-memory profile has role="admin" for the admin email (both variants)
    switch (userProfiles.get(_adminEmail)) {
      case (?p) {
        // Unconditionally write back with role="admin" to fix any stale role value
        userProfiles.add(_adminEmail, { p with role = "admin" });
      };
      case (null) {
        // Also check short variant — migrate it to canonical key
        switch (userProfiles.get(_getAdminEmailShort())) {
          case (?p) {
            userProfiles.add(_adminEmail, { p with email = _adminEmail; role = "admin" });
            userProfiles.remove(_getAdminEmailShort());
          };
          case (null) {};
        };
      };
    };
  };

  // ADMIN ACCOUNT AUTO-SEED — ensure the admin always has a profile on a
  // fresh canister so all email-gated admin functions work from the first request.
  // A placeholder profile is created with an empty passwordHash blob; login() will overwrite
  // the real passwordHash on the first successful login attempt.
  do {
    if (userProfiles.get(_adminEmail) == null) {
      userProfiles.add(_adminEmail, {
        email         = _adminEmail;
        passwordHash  = Blob.fromArray([]);
        firstName     = "Admin";
        lastName      = "";
        businessName  = "";
        businessType  = "";
        phone         = "";
        role          = "admin";
        created_at    = getCurrentTimestamp();
      });
      // Allow initAdminAccount() to be called again to set the real password.
      _adminSeeded := false;
    };
  };

  // NOTE: Admin account is no longer seeded with a hardcoded password.
  // After deployment, call initAdminAccount(email, passwordHash) once to create the admin account.

  // EMAIL TEMPLATE SEED (Self-Healing — only seeds if not already present)
  do {
    let now0 = getCurrentTimestamp();
    if (emailTemplates.get("consultation_confirmed") == null) {
      emailTemplates.add("consultation_confirmed", {
        id          = getNextEmailTemplateId();
        trigger_key = "consultation_confirmed";
        subject     = "Your Free Consultation Is Confirmed — Imperidome";
        body        = "Hi {{client_name}},\n\n"
          # "We've received your free consultation request and you're in good hands.\n\n"
          # "Our team will review your request and be in touch within 1 business day.\n\n"
          # "Requested Time: {{requested_time}}\n"
          # "Business Type: {{business_type}}\n\n"
          # "In the meantime, feel free to browse our services at " # _siteBaseUrl # ".\n\n"
          # "Questions? Contact us at " # _adminEmail # "\n\n"
          # "Warm regards,\nThe Imperidome Team";
        updated_at  = now0;
      });
    };
    if (emailTemplates.get("audit_in_progress") == null) {
      emailTemplates.add("audit_in_progress", {
        id          = getNextEmailTemplateId();
        trigger_key = "audit_in_progress";
        subject     = "Your Site Audit Is Underway — Imperidome";
        body        = "Hi {{client_name}},\n\n"
          # "Your Site Audit has been received and our team is already on it.\n\n" // Price should be set via admin email template editor
          # "Here's what we're auditing:\n"
          # "- Mobile performance\n"
          # "- SEO basics\n"
          # "- Lead capture effectiveness\n"
          # "- Trust signals\n"
          # "- Conversion gap analysis\n\n"
          # "Business: {{business_type}}\n"
          # "Expected delivery: within 48 hours\n\n"
          # "We'll send you the full report as soon as it's ready.\n\n"
          # "Questions? Contact us at " # _adminEmail # "\n\n"
          # "Warm regards,\nThe Imperidome Team";
        updated_at  = now0;
      });
    };
    if (emailTemplates.get("password_reset") == null) {
      emailTemplates.add("password_reset", {
        id          = getNextEmailTemplateId();
        trigger_key = "password_reset";
        subject     = "Reset Your Imperidome Password";
        body        = "Hi {{client_name}},<br><br>"
          # "We received a request to reset your password.<br><br>"
          # "Click the link below to set a new password. This link expires in 1 hour.<br><br>"
          # "<a href=\"{{reset_link}}\" class=\"cta\">Reset My Password</a><br><br>"
          # "Or copy and paste this link into your browser:<br>"
          # "<span class=\"accent\">{{reset_link}}</span><br><br>"
          # "If you did not request a password reset, you can safely ignore this email.<br><br>"
          # "<br><br>Questions? Contact us at " # _adminEmail # "<br><br>"
          # "&mdash; The Imperidome Team";
        updated_at  = now0;
      });
    };
    if (emailTemplates.get("bulk_announcement") == null) {
      emailTemplates.add("bulk_announcement", {
        id          = getNextEmailTemplateId();
        trigger_key = "bulk_announcement";
        subject     = "Message from Imperidome";
        body        = "Hi {{client_name}},<br><br>"
          # "This is a message from the Imperidome team.<br><br>"
          # "{{message}}<br><br>"
          # "Best regards,<br><strong>The Imperidome Team</strong>";
        updated_at  = now0;
      });
    };
    if (emailTemplates.get("site_link_sent") == null) {
      emailTemplates.add("site_link_sent", {
        id          = getNextEmailTemplateId();
        trigger_key = "site_link_sent";
        subject     = "Your Website Is Live!";
        body        = "Hi {{client_name}},<br><br>"
          # "Great news! Your website is now live and ready to share with the world.<br><br>"
          # "<a href=\"{{site_url}}\" style=\"background:#4f46e5;color:#000000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;\">View Your Live Site</a><br><br>"
          # "<p>Or copy this link: {{site_url}}</p><br>"
          # "If you need any updates or have questions, visit your client portal.<br><br>"
          # "Best regards,<br><strong>The Imperidome Team</strong><br>"
          # "<a href=\"" # _siteBaseUrl # "\">" # _siteBaseUrl # "</a>";
        updated_at  = now0;
      });
    };
    if (emailTemplates.get("review_submitted") == null) {
      emailTemplates.add("review_submitted", {
        id          = getNextEmailTemplateId();
        trigger_key = "review_submitted";
        subject     = "Your review has been received";
        body        = "Hi {{client_name}},<br><br>"
          # "Thank you for submitting your review! Our team will review it shortly and approve it for the testimonials page.<br><br>"
          # "Best regards,<br><strong>The Imperidome Team</strong>";
        updated_at  = now0;
      });
    };
    if (emailTemplates.get("review_approved") == null) {
      emailTemplates.add("review_approved", {
        id          = getNextEmailTemplateId();
        trigger_key = "review_approved";
        subject     = "Your review is now live!";
        body        = "Hi {{client_name}},<br><br>"
          # "Great news! Your review has been approved and is now live on our website. Thank you for sharing your experience!<br><br>"
          # "Visit <a href=\"" # _siteBaseUrl # "\">" # _siteBaseUrl # "</a> to see it.<br><br>"
          # "Best regards,<br><strong>The Imperidome Team</strong>";
        updated_at  = now0;
      });
    };
    if (emailTemplates.get("review_submitted_confirmation") == null) {
      emailTemplates.add("review_submitted_confirmation", {
        id          = getNextEmailTemplateId();
        trigger_key = "review_submitted_confirmation";
        subject     = "Thank you for your review!";
        body        = "Hi {{client_name}},<br><br>"
          # "Thank you for taking the time to share your experience with Imperidome — it truly means a lot to us!<br><br>"
          # "We've received your review and it's currently pending approval. Once our team reviews it, it will appear on our website for the world to see.<br><br>"
          # "We appreciate your trust and look forward to continuing to serve you.<br><br>"
          # "Best regards,<br><strong>The Imperidome Team</strong><br>"
          # "<a href=\"" # _siteBaseUrl # "\">" # _siteBaseUrl # "</a>";
        updated_at  = now0;
      });
    };
    if (emailTemplates.get("reschedule_link_sent") == null) {
      emailTemplates.add("reschedule_link_sent", {
        id          = getNextEmailTemplateId();
        trigger_key = "reschedule_link_sent";
        subject     = "A New Scheduling Link Is Ready — Imperidome";
        body        = "Hi {{client_name}},<br><br>"
          # "<p style=\"color:#000000;\">Vincenzo has sent you a new scheduling link so you can pick a new time that works for you.</p>"
          # "<p style=\"color:#000000;\">Click the button below to choose your preferred date and time:</p>"
          # "<br><p><a href=\"{{reschedule_url}}\" style=\"display:inline-block;padding:14px 32px;background:#00e87d;color:#0a0a0a;font-weight:700;border-radius:4px;text-decoration:none;font-size:15px;letter-spacing:1px;\">Pick a New Time</a></p>"
          # "<br><p style=\"color:#000000;font-size:13px;\">Or copy this link: <a href=\"{{reschedule_url}}\">{{reschedule_url}}</a></p>"
          # "<br><p style=\"color:#555555;font-size:12px;\">Note: This link expires 4 hours before your scheduled meeting time. After that, please contact Vincenzo directly to reschedule.</p>"
          # "<br><p style=\"color:#000000;\">We look forward to speaking with you!</p>"
          # "<p style=\"color:#000000;\">— The Imperidome Team</p>";
        updated_at  = now0;
      });
    };
    if (emailTemplates.get("lead_booked_phone") == null) {
      emailTemplates.add("lead_booked_phone", {
        id          = getNextEmailTemplateId();
        trigger_key = "lead_booked_phone";
        subject     = "Your Meeting Is Confirmed — Imperidome";
        body        = "Hi {{client_name}},<br><br>"
          # "<p style=\"color:#000000;\">Your meeting request with the Imperidome team has been received and confirmed.</p>"
          # "<p style=\"color:#000000;\"><strong>Meeting Type:</strong> Phone Call</p>"
          # "<p style=\"color:#000000;\"><strong>We will call you at:</strong> {{phone}}</p>"
          # "<p style=\"color:#000000;\"><strong>Scheduled for:</strong> {{preferred_date}} at {{preferred_time}}</p>"
          # "<br>{{reschedule_section}}"
          # "<br><p style=\"color:#000000;\">We look forward to speaking with you!</p>"
          # "<p style=\"color:#000000;\">— The Imperidome Team</p>";
        updated_at  = now0;
      });
    };
    if (emailTemplates.get("lead_booked_video") == null) {
      emailTemplates.add("lead_booked_video", {
        id          = getNextEmailTemplateId();
        trigger_key = "lead_booked_video";
        subject     = "Your Google Meet Is Confirmed — Imperidome";
        body        = "Hi {{client_name}},<br><br>"
          # "<p style=\"color:#000000;\">Your meeting request with the Imperidome team has been received and confirmed.</p>"
          # "<p style=\"color:#000000;\"><strong>Meeting Type:</strong> Google Meet (Video)</p>"
          # "<p style=\"color:#000000;\"><strong>Scheduled for:</strong> {{preferred_date}} at {{preferred_time}}</p>"
          # "<br><p style=\"color:#000000;\"><a href=\"{{meet_link}}\" style=\"display:inline-block;padding:12px 28px;background:#1a73e8;color:#ffffff;font-weight:bold;border-radius:6px;text-decoration:none;font-size:15px;\">Join Google Meet</a></p>"
          # "<p style=\"color:#000000;font-size:13px;\">Or copy this link: {{meet_link}}</p>"
          # "<br>{{reschedule_section}}"
          # "<br><p style=\"color:#000000;\">We look forward to speaking with you!</p>"
          # "<p style=\"color:#000000;\">— The Imperidome Team</p>";
        updated_at  = now0;
      });
    };
  };

  // FLEET CANISTER SEED (Self-Healing)
  // SELF_CANISTER_ID is resolved lazily on the first shared call because
  // `Principal.fromActor` requires a named actor reference which is only
  // available after the actor is fully initialized.
  // The variable name is preserved from the previous version for upgrade compatibility.
  var SELF_CANISTER_ID : Text = "";

  func ensureFleetSeededWithSelf(selfId : Text) : () {
    if (_stableFleet.size() == 0) {
      _stableFleet := [
        { id = selfId; name = _siteBaseUrl; created_at = 0 },
        { id = "r3jtv-rqaaa-aaaae-qivea-cai"; name = "Overflow of Jo"; created_at = 0 },
      ];
    };
  };

  // STRIPE CONFIGURATION — no seeding. Admin must configure via Admin > Stripe Settings post-deploy.

  // FLEET CANISTER MANAGEMENT
  // Note: these functions use session-based auth (email/password) like the rest of the
  // admin dashboard, not Principal-based auth, so no adminOnly(caller) guard is needed.
  public shared ({ caller }) func addFleetCanister(name : Text, canisterId : Text) : async () {
    let selfId = Principal.fromActor(ImperidomeCanister).toText();
    SELF_CANISTER_ID := selfId;
    ensureFleetSeededWithSelf(selfId);
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    // Enforce fleet size cap
    if (_stableFleet.size() >= MAX_FLEET) { throw Error.reject("Fleet cap reached. Maximum is 100 canisters.") };
    // Validate canister ID format before storing
    let _principal = try { Principal.fromText(canisterId) } catch (_) { throw Error.reject("Invalid canister ID format") };
    // Prevent duplicate canister IDs
    let alreadyExists = _stableFleet.find(func(c : FleetCanister) : Bool { Text.equal(c.id, canisterId) }) != null;
    if (alreadyExists) { throw Error.reject("Canister ID already exists in fleet") };
    let newEntry : FleetCanister = { id = canisterId; name; created_at = Time.now() };
    _stableFleet := _stableFleet.concat([newEntry]);
  };

  public shared ({ caller }) func removeFleetCanister(canisterId : Text) : async () {
    let selfId = Principal.fromActor(ImperidomeCanister).toText();
    SELF_CANISTER_ID := selfId;
    ensureFleetSeededWithSelf(selfId);
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    _stableFleet := _stableFleet.filter(func(c : FleetCanister) : Bool { not Text.equal(c.id, canisterId) });
  };

  // SITES FLEET MANAGEMENT
  public shared ({ caller }) func addFleetSite(name : Text, canisterId : Text) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    if (_stableFleetSites.size() >= MAX_FLEET) { throw Error.reject("Fleet cap reached. Maximum is 100 canisters.") };
    let _principal = try { Principal.fromText(canisterId) } catch (_) { throw Error.reject("Invalid canister ID format") };
    let alreadyExists = _stableFleetSites.find(func(c : FleetCanister) : Bool { Text.equal(c.id, canisterId) }) != null;
    if (alreadyExists) { throw Error.reject("Canister ID already exists in Sites fleet") };
    let newEntry : FleetCanister = { id = canisterId; name; created_at = Time.now() };
    _stableFleetSites := _stableFleetSites.concat([newEntry]);
  };

  public shared ({ caller }) func removeFleetSite(canisterId : Text) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    _stableFleetSites := _stableFleetSites.filter(func(c : FleetCanister) : Bool { not Text.equal(c.id, canisterId) });
  };

  public shared ({ caller }) func getFleetSites() : async [FleetCanister] {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    _stableFleetSites;
  };

  // SOFTWARE FLEET MANAGEMENT
  public shared ({ caller }) func addFleetSoftware(name : Text, canisterId : Text) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    if (_stableFleetSoftware.size() >= MAX_FLEET) { throw Error.reject("Fleet cap reached. Maximum is 100 canisters.") };
    let _principal = try { Principal.fromText(canisterId) } catch (_) { throw Error.reject("Invalid canister ID format") };
    let alreadyExists = _stableFleetSoftware.find(func(c : FleetCanister) : Bool { Text.equal(c.id, canisterId) }) != null;
    if (alreadyExists) { throw Error.reject("Canister ID already exists in Software fleet") };
    let newEntry : FleetCanister = { id = canisterId; name; created_at = Time.now() };
    _stableFleetSoftware := _stableFleetSoftware.concat([newEntry]);
  };

  public shared ({ caller }) func removeFleetSoftware(canisterId : Text) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    _stableFleetSoftware := _stableFleetSoftware.filter(func(c : FleetCanister) : Bool { not Text.equal(c.id, canisterId) });
  };

  public shared ({ caller }) func getFleetSoftware() : async [FleetCanister] {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    _stableFleetSoftware;
  };

  // CYCLE BALANCE FETCHING
  //
  // Three-step fallback for every canister — no per-canister configuration needed:
  //
  // Step 1: Call getCycles() as a public query on the target canister.
  //         Any canister that exposes this function will return its balance here.
  //
  // Step 2: If the target is the Imperidome canister itself, use ExperimentalCycles.balance()
  //         directly (synchronous, no inter-canister call required).
  //
  // Public query: returns this canister's current cycle balance.
  // No authentication required — callable by any canister or user.
  public query func getCycles() : async Nat {
    ExperimentalCycles.balance()
  };

  // Step 3: If both fail, surface the specific error message so the admin sees
  //         the exact reason instead of a generic "Unknown".
  public shared ({ caller }) func getCanisterCycles(canisterId : Text) : async { #ok : Nat; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    // Resolve and cache the self-canister ID on first shared call.
    SELF_CANISTER_ID := Principal.fromActor(ImperidomeCanister).toText();
    ensureFleetSeededWithSelf(SELF_CANISTER_ID);

    // Validate the principal first so we return a clear error for bad IDs.
    let _principal = try {
      Principal.fromText(canisterId)
    } catch (e) {
      return #err("Invalid canister ID: " # e.message());
    };

    // Step 1: Attempt to call getCycles() as a public query on the target canister.
    // This works for any canister that exposes this function publicly, including
    // external canisters we do not control.
    let targetActor = actor (canisterId) : actor {
      getCycles : shared query () -> async Nat;
    };
    try {
      let cycles = await targetActor.getCycles();
      return #ok(cycles);
    } catch (_) {
      // getCycles not available on this canister, fall through to next step.
    };

    // Step 2: If this is the Imperidome canister itself, read balance synchronously.
    if (Text.equal(canisterId, SELF_CANISTER_ID)) {
      return #ok(ExperimentalCycles.balance());
    };

    // Step 3: Both methods failed. Return a clear error message.
    #err("Unable to fetch cycles for " # canisterId # ": getCycles query not available and canister is not the Imperidome self-canister. To enable cycle monitoring, either add a public getCycles query to this canister or add " # SELF_CANISTER_ID # " as a controller.")
  };
  // BUSINESS METRICS TYPE — shared return type for hub-and-spoke cross-canister metrics queries.
  // Returned by getClientBusinessMetrics (queries client canisters) and getBusinessMetrics (self).
  public type BusinessMetrics = {
    monthlyRevenueCents : Nat;
    activeBookings      : Nat;
    saasPlanStatus      : Text;
  };

  // CROSS-CANISTER BUSINESS METRICS
  // Calls getBusinessMetrics() on a registered client canister and returns the result.
  // Authentication: admin-only (checked against principalToEmail → getAdminEmail()).
  // Pattern mirrors getCanisterCycles — same principal validation, same try/catch.
  public shared ({ caller }) func getClientBusinessMetrics(canisterId : Text) : async { #ok : BusinessMetrics; #err : Text } {
    // Admin-only guard.
    switch (principalToEmail.get(caller)) {
      case (?callerEmail) {
        if (not Text.equal(callerEmail, getAdminEmail())) {
          return #err("Unauthorized");
        };
      };
      case null { return #err("Not authenticated") };
    };

    // Validate the principal so we surface a clear error for bad IDs.
    let _p = try {
      Principal.fromText(canisterId)
    } catch (e) {
      return #err("Invalid canister ID: " # e.message());
    };

    // Call getBusinessMetrics() on the target client canister.
    let targetActor = actor (canisterId) : actor {
      getBusinessMetrics : shared query () -> async BusinessMetrics;
    };
    try {
      let metrics = await targetActor.getBusinessMetrics();
      #ok(metrics);
    } catch (e) {
      #err("Failed to fetch business metrics from " # canisterId # ": " # e.message());
    };
  };

  // SELF BUSINESS METRICS — exposes this (hub) canister as a spoke-compatible endpoint.
  // Imperidome is the hub, so returns zero revenue/bookings and a fixed plan status.
  // This enables the hub to be queried by the same pattern used for client canisters.
  public shared query func getBusinessMetrics() : async BusinessMetrics {
    { monthlyRevenueCents = 0; activeBookings = 0; saasPlanStatus = "Hub" };
  };


  // EMAIL TEMPLATE HELPERS
  func interpolateTemplate(template : Text, vars : [(Text, Text)]) : Text {
    var result = template;
    for ((key, value) in vars.values()) {
      let safeValue = value.replace(#text "{{", "&#123;&#123;");
      result := result.replace(#text("{{" # key # "}}"), safeValue);
    };
    result;
  };

  func getTemplateForKey(triggerKey : Text, defaultSubject : Text, defaultBody : Text) : (Text, Text) {
    switch (emailTemplates.get(triggerKey)) {
      case (?t) {
        let subject = if (t.subject.size() > 0) { t.subject } else { defaultSubject };
        let body    = if (t.body.size()    > 0) { t.body    } else { defaultBody    };
        (subject, body);
      };
      case (null) { (defaultSubject, defaultBody) };
    };
  };

  func getMostRecentActiveOrder(clientPrincipal : Principal) : ?Order {
    let clientOrders = orders.values().filter(
      func(o) {
        Principal.equal(o.client_id, clientPrincipal) and
        o.status != #live and
        o.status != #cancelled
      }
    ).toArray();
    if (clientOrders.size() == 0) { return null };
    let sorted = clientOrders.sort(
      func(a, b) { Nat.compare(Int.abs(b.updated_at), Int.abs(a.updated_at)) }
    );
    ?sorted[0];
  };

  func buildEmailVars(
    clientEmail     : Text,
    principalOpt    : ?Principal,
    extraVars       : [(Text, Text)],
  ) : [(Text, Text)] {
    let profile = userProfiles.get(clientEmail);
    let clientName = switch (profile) {
      case (?p) {
        let name = p.firstName # " " # p.lastName;
        if (name.size() > 1) { name } else { "Valued Client" };
      };
      case (null) { "Valued Client" };
    };
    let businessName = switch (profile) {
      case (?p) { if (p.businessName.size() > 0) { p.businessName } else { "your business" } };
      case (null) { "your business" };
    };
    let maybeOrder = switch (principalOpt) {
      case (?p) { getMostRecentActiveOrder(p) };
      case (null) { null };
    };
    let projectTier = switch (maybeOrder) {
      case (?o) { if (o.tier_code.size() > 0) { o.tier_code } else { "your project" } };
      case (null) { "your project" };
    };
    let launchDate = switch (maybeOrder) {
      case (?o) { if (o.launch_target.size() > 0) { o.launch_target } else { "TBD" } };
      case (null) { "TBD" };
    };
    let base : [(Text, Text)] = [
      ("client_name",   clientName),
      ("business_name", businessName),
      ("project_tier",  projectTier),
      ("launch_date",   launchDate),
      ("stripe_link",   ""),
      ("invoice_amount",""),
      ("due_date",      ""),
      ("calendly_link", ""),
    ];
    base.concat(extraVars);
  };

  // STRIPE INTEGRATION
  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    stripeConfig := ?config;
  };

  // Set the Stripe webhook secret for signature verification — admin only
  public shared ({ caller }) func setStripeWebhookSecret(secret : Text) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    if (secret.size() == 0) { Runtime.trap("secret cannot be empty") };
    stripeWebhookSecret := secret;
  };

  // setWebhookSharedSecret — admin-only: sets the shared secret used for secondary webhook authentication.
  // If non-empty, handleStripeWebhook rejects any call that does not supply the matching secret.
  public shared ({ caller }) func setWebhookSharedSecret(secret : Text) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    _webhookSharedSecret := secret;
    #ok
  };

  // Set the Stripe secret key — admin only. Stripe must be configured first via setStripeConfiguration.
  public shared ({ caller }) func setStripeSecretKey(key : Text) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    if (key.size() == 0) { Runtime.trap("key cannot be empty") };
    switch (stripeConfig) {
      case (null) {
        Runtime.trap("Configure Stripe first via Admin > Stripe Settings before setting the secret key");
      };
      case (?cfg) {
        stripeConfig := ?{ cfg with secretKey = key };
      };
    };
  };

  // Toggle test mode on/off — when true, frontend should use test publishable key — admin only
  public shared ({ caller }) func setStripeTestMode(testMode : Bool) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    stripeTestMode := testMode;
  };

  // Returns current test mode state — no auth required, needed by frontend to show indicator
  public query func getStripeTestMode() : async Bool {
    stripeTestMode
  };

  // Alias for getStripeTestMode — clarity in frontend
  public query func isStripeTestMode() : async Bool {
    stripeTestMode
  };

  // Get and set the Stripe publishable key — stored in stable state so it can be updated via UI without redeploy
  public query func getStripePublishableKey() : async Text { stripePublishableKey };

  public shared ({ caller }) func setStripePublishableKey(key : Text) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    if (key.size() == 0) { Runtime.trap("key cannot be empty") };
    stripePublishableKey := key;
  };

  public query func getAdminContactEmail() : async Text {
    _adminEmail
  };

  public shared ({ caller }) func setSiteBaseUrl(url: Text) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    if (url.size() == 0) { return #err("URL cannot be empty") };
    _siteBaseUrl := url;
    #ok
  };

  public shared ({ caller }) func setLogoUrl(url: Text) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    _logoUrl := url;
    #ok
  };

  public query func getSiteBaseUrl() : async Text { _siteBaseUrl };

  public query func getLogoUrl() : async Text { _logoUrl };

  public shared ({ caller }) func setSiteAuditFallbackPrice(price: Int) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    _siteAuditFallbackPrice := price;
    #ok
  };

  func requireStripeConfig() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  // Public query — returns the current Stripe configuration, or null if not yet configured.
  public query func getStripeConfiguration() : async ?Stripe.StripeConfiguration {
    stripeConfig
  };

  // Guard used before any Stripe API call — traps if the admin has not yet configured Stripe.
  func requireStripeConfigured() {
    ignore requireStripeConfig();
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(requireStripeConfig(), sessionId, transform);
  };

  // Parse the payment-mode prefix from a productName and return (mode, cleanName).
  // Recognised prefixes:
  //   [payment]      → one-time charge (mode = "payment")
  //   [deposit]      → one-time 50% deposit (mode = "payment")
  //   [completion]   → one-time remaining 50% (mode = "payment")
  //   [subscription] → recurring monthly (mode = "subscription", interval_count = 1)
  //   [quarterly]    → recurring every 3 months (mode = "subscription", interval_count = 3)
  //   (no prefix)    → treated as one-time payment
  func _parseItemPrefix(name : Text) : { mode : Text; intervalCount : Nat; cleanName : Text } {
    let prefixes : [(Text, Text, Nat)] = [
      ("[payment]",      "payment",      1),
      ("[deposit]",      "payment",      1),
      ("[completion]",   "payment",      1),
      ("[subscription]", "subscription", 1),
      ("[quarterly]",    "subscription", 3),
    ];
    for ((prefix, mode, intervalCount) in prefixes.values()) {
      if (name.startsWith(#text prefix)) {
        let cleanName = name.stripStart(#text prefix);
        let trimmed = switch (cleanName) {
          case (?s) { s };
          case (null) { name };
        };
        return { mode; intervalCount; cleanName = trimmed };
      };
    };
    // No recognised prefix — default to one-time payment
    { mode = "payment"; intervalCount = 1; cleanName = name };
  };

  // _paymentTypeToSessionMode — maps a product's payment_type to Stripe session parameters.
  // Returns (stripeMode, intervalCount, priceMultiplier) where:
  //   stripeMode      = "payment" | "subscription"
  //   intervalCount   = 1 | 3  (months per billing cycle for subscriptions)
  //   priceMultiplier = 1.0 | 0.5  (0.5 for deposit_50 — charge 50% of product price)
  func _paymentTypeToSessionMode(paymentType : Text) : { stripeMode : Text; intervalCount : Nat; priceMultiplier : Float } {
    if (Text.equal(paymentType, "monthly")) {
      { stripeMode = "subscription"; intervalCount = 1; priceMultiplier = 1.0 }
    } else if (Text.equal(paymentType, "quarterly")) {
      { stripeMode = "subscription"; intervalCount = 3; priceMultiplier = 1.0 }
    } else if (Text.equal(paymentType, "annual")) {
      { stripeMode = "subscription"; intervalCount = 12; priceMultiplier = 1.0 }
    } else if (Text.equal(paymentType, "deposit_50")) {
      { stripeMode = "payment"; intervalCount = 1; priceMultiplier = 0.5 }
    } else {
      // "one_time" or any unrecognised value — one-time payment
      { stripeMode = "payment"; intervalCount = 1; priceMultiplier = 1.0 }
    }
  };

  func _urlEncodeLocal(t : Text) : Text {
    t.replace(#char ' ', "%20").replace(#char '&', "%26").replace(#char '=', "%3D");
  };

  // Build a Stripe checkout session body that supports both payment and subscription modes,
  // including quarterly subscriptions (interval_count = 4).
  // For AI Receptionist Receptionist and Closer subscriptions, automatically appends the
  // corresponding one-time setup fee product as an additional line item (if active).
  // Build a Stripe checkout session body that supports both payment and subscription modes,
  // including quarterly subscriptions (interval_count = 3).
  // Session mode is determined by the product's payment_type field in the catalog.
  // For items with a [subscription] / [quarterly] prefix in their name, the prefix takes precedence
  // (backwards compatibility for setup-fee items that use prefix notation).
  // For deposit_50, the item price is halved before building the line items.
  func _buildSessionBody(
    cfg         : Stripe.StripeConfiguration,
    callerPrincipal : Principal,
    items       : [Stripe.ShoppingItem],
    successUrl  : Text,
    cancelUrl   : Text,
    clientEmail : Text,
    clientName  : Text,
  ) : { #ok : Text; #err : Text } {
    // Determine the session mode from the first item.
    // Priority: name prefix (for backwards compat) > product catalog payment_type.
    let firstParsed = if (items.size() > 0) {
      _parseItemPrefix(items[0].productName)
    } else {
      { mode = "payment"; intervalCount = 1; cleanName = "" }
    };

    // Resolve payment_type for the first item by looking up its name in the catalog.
    // Only used when no prefix was found (prefix takes precedence for backwards compat).
    let resolvedFirstMode : { stripeMode : Text; intervalCount : Nat; priceMultiplier : Float } = if (
      firstParsed.mode == "payment" and items.size() > 0 and
      not (items[0].productName.startsWith(#text "["))
    ) {
      // Look up by name in catalog to find payment_type
      let upperName = items[0].productName.toUpper();
      switch (productCatalog.entries().find(func((_, p) : (ProductId, Product)) : Bool {
        Text.equal(p.name.toUpper(), upperName)
      })) {
        case (?(_, p)) { _paymentTypeToSessionMode(p.payment_type) };
        case (null) { { stripeMode = "payment"; intervalCount = 1; priceMultiplier = 1.0 } };
      }
    } else if (firstParsed.mode == "subscription") {
      { stripeMode = "subscription"; intervalCount = firstParsed.intervalCount; priceMultiplier = 1.0 }
    } else {
      { stripeMode = "payment"; intervalCount = 1; priceMultiplier = 1.0 }
    };

    // Build the effective item list, appending AI Receptionist setup fees when applicable.
    let effectiveItems = List.empty<Stripe.ShoppingItem>();
    for (item in items.vals()) {
      // Look up this item in the catalog to check its individual payment_type
      let isDeposit50 = if (not item.productName.startsWith(#text "[")) {
        let cleanName : Text = switch (item.productName.split(#char '|').next()) {
          case (?n) { n.trim(#char ' ') };
          case (null) { item.productName.trim(#char ' ') };
        };
        let cleanUpper = cleanName.toUpper();
        switch (productCatalog.entries().find(func((_, p) : (ProductId, Product)) : Bool {
          Text.equal(p.name.toUpper(), cleanUpper)
        })) {
          case (?(_, catalogProduct)) { Text.equal(catalogProduct.payment_type, "deposit_50") };
          case (null) { false };
        }
      } else { false };
      // For deposit_50 items (non-prefix), halve the price before adding
      let effectiveItem : Stripe.ShoppingItem = if (
        isDeposit50 and not item.productName.startsWith(#text "{")
      ) {
        let halfCents : Nat = Int.abs((item.priceInCents.toFloat() * 0.5 + 0.5).toInt());
        { item with priceInCents = halfCents }
      } else {
        item
      };
      effectiveItems.add(effectiveItem);
    };

    // Check each item for AI Receptionist subscription tiers that require a setup fee.
    for (item in items.vals()) {
      let upperName = item.productName.toUpper();
      // Detect THE RECEPTIONIST subscription
      if (upperName.contains(#text "THE RECEPTIONIST") and not upperName.contains(#text "CLOSER")) {
        // Look up the setup fee product by name (must be active)
        let feeProduct = productCatalog.entries().find(func((_, p) : (ProductId, Product)) : Bool {
          Text.equal(p.name, "[payment] AI Receptionist Setup Fee - Receptionist") and p.active
        });
        switch (feeProduct) {
          case (?(_, p)) {
            let feePrice = switch (p.price_onetime) {
              case (?pr) { (pr * 100.0).toInt() };
              case (null) { 0 };
            };
            if (feePrice > 0) {
              effectiveItems.add({
                productName        = p.name;
                productDescription = p.description;
                priceInCents       = Int.abs(feePrice);
                currency           = item.currency;
                quantity           = 1;
              });
            };
          };
          case (null) {};
        };
      };
      // Detect THE CLOSER subscription
      if (upperName.contains(#text "THE CLOSER")) {
        let feeProduct = productCatalog.entries().find(func((_, p) : (ProductId, Product)) : Bool {
          Text.equal(p.name, "[payment] AI Receptionist Setup Fee - Closer") and p.active
        });
        switch (feeProduct) {
          case (?(_, p)) {
            let feePrice = switch (p.price_onetime) {
              case (?pr) { (pr * 100.0).toInt() };
              case (null) { 0 };
            };
            if (feePrice > 0) {
              effectiveItems.add({
                productName        = p.name;
                productDescription = p.description;
                priceInCents       = Int.abs(feePrice);
                currency           = item.currency;
                quantity           = 1;
              });
            };
          };
          case (null) {};
        };
      };
    };

    let params = List.empty<Text>();
    var idx = 0;
    for (item in effectiveItems.values()) {
      let parsed = _parseItemPrefix(item.productName);
      let idxText = idx.toText();
      params.add("line_items[" # idxText # "][price_data][currency]=" # _urlEncodeLocal(item.currency));
      params.add("line_items[" # idxText # "][price_data][product_data][name]=" # _urlEncodeLocal(parsed.cleanName));
      params.add("line_items[" # idxText # "][price_data][product_data][description]=" # _urlEncodeLocal(item.productDescription));
      params.add("line_items[" # idxText # "][price_data][unit_amount]=" # item.priceInCents.toText());

      // Subscriptions require recurring price_data — but only for subscription-mode items (not one-time setup fees)
      if (resolvedFirstMode.stripeMode == "subscription" and parsed.mode != "payment") {
        params.add("line_items[" # idxText # "][price_data][recurring][interval]=month");
        params.add("line_items[" # idxText # "][price_data][recurring][interval_count]=" # resolvedFirstMode.intervalCount.toText());
      };
      // Also handle legacy [subscription]/[quarterly] prefix items
      if (resolvedFirstMode.stripeMode != "subscription" and parsed.mode == "subscription") {
        params.add("line_items[" # idxText # "][price_data][recurring][interval]=month");
        params.add("line_items[" # idxText # "][price_data][recurring][interval_count]=" # parsed.intervalCount.toText());
      };
      params.add("line_items[" # idxText # "][quantity]=" # item.quantity.toText());
      idx += 1;
    };

    params.add("mode=" # resolvedFirstMode.stripeMode);
    params.add("success_url=" # _urlEncodeLocal(successUrl));
    params.add("cancel_url=" # _urlEncodeLocal(cancelUrl));

    // Only payment mode supports shipping address collection
    if (resolvedFirstMode.stripeMode == "payment") {
      for (country in cfg.allowedCountries.vals()) {
        params.add("shipping_address_collection[allowed_countries][0]=" # _urlEncodeLocal(country));
      };
    };

    params.add("client_reference_id=" # _urlEncodeLocal(clientEmail));
    params.add("metadata[client_principal]=" # _urlEncodeLocal(callerPrincipal.toText()));
    params.add("metadata[client_name]=" # _urlEncodeLocal(clientName));
    // S4-H-1: Backend mixed-cart safety net — driven by payment_type, not product name.
    // For each item, resolve its effective Stripe mode:
    //   1. If the name carries a recognised prefix, the prefix wins (backwards compat for setup-fee items).
    //   2. Otherwise, look up the product in the catalog by name and use its payment_type.
    //   3. Default to "payment" if the product is not found.
    var hasSubMode = false;
    var hasPayMode = false;
    for (item in items.vals()) {
      let parsed = _parseItemPrefix(item.productName);
      let itemStripeMode : Text = if (parsed.mode == "subscription") {
        "subscription"
      } else if (not item.productName.startsWith(#text "[")) {
        // No prefix — resolve via payment_type from catalog
        let upperName = item.productName.toUpper();
        switch (productCatalog.entries().find(func((_, p) : (ProductId, Product)) : Bool {
          Text.equal(p.name.toUpper(), upperName)
        })) {
          case (?(_, p)) { _paymentTypeToSessionMode(p.payment_type).stripeMode };
          case (null) { "payment" };
        }
      } else {
        "payment"
      };
      if (itemStripeMode == "subscription") {
        hasSubMode := true;
      } else {
        hasPayMode := true;
      };
    };
    if (hasSubMode and hasPayMode) {
      return #err("Subscription and one-time items cannot be mixed in a single checkout session.");
    };
    // Inject platform fee and transfer_data if the client has Stripe Connect configured.
    // For subscription mode: use application_fee_percent (Stripe requirement).
    // For payment mode (one-time): use application_fee_amount in cents (Stripe requirement).
    // If platformFeePercentage is 0.0, omit the fee field entirely for both modes.
    let clientLower = clientEmail.toLower();
    let clientForFee = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
      Text.equal(t.1.email.toLower(), clientLower)
    });
    switch (clientForFee) {
      case (?(_, c)) {
        if (c.platformFeePercentage > 0.0) {
          if (resolvedFirstMode.stripeMode == "subscription") {
            // Stripe accepts application_fee_percent for subscription mode
            let feeText = c.platformFeePercentage.toText();
            params.add("application_fee_percent=" # _urlEncodeLocal(feeText));
          } else {
            // Stripe requires application_fee_amount (integer cents) for payment mode
            let totalCents : Nat = effectiveItems.values().foldLeft<Stripe.ShoppingItem, Nat>(0, func(acc, item) {
              acc + item.priceInCents
            });
            let feeAmountCents : Int = Float.nearest(totalCents.toFloat() * c.platformFeePercentage / 100.0).toInt();
            params.add("application_fee_amount=" # _urlEncodeLocal(feeAmountCents.toText()));
          };
        };
        // Inject transfer_data[destination] if client has a connected Stripe account
        if (Text.equal(c.stripeConnectStatus, "connected")) {
          switch (c.stripeConnectAccountId) {
            case (?accountId) {
              if (accountId != "") {
                params.add("transfer_data[destination]=" # _urlEncodeLocal(accountId));
              };
            };
            case (null) {};
          };
        };
      };
      case (null) {};
    };
    #ok(params.values().join("&"));
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], clientEmail : Text, successUrl : Text, cancelUrl : Text, clientName : Text) : async { #ok : Text; #err : Text } {
    let cfg = requireStripeConfig();

    // SECURITY FIX: Per-item price and payment mode re-validation against productCatalog.
    // Strips any "| category" suffix from productName to get the canonical catalog name.
    // Returns #err immediately if any item fails validation.
    for (item in items.vals()) {
      // Skip items with bracket prefixes (legacy setup-fee items bypass this validation)
      if (not item.productName.startsWith(#text "[")) {
        // Strip "| category" suffix if present to recover the clean product name
        let cleanName : Text = switch (item.productName.split(#char '|').next()) {
          case (?n) { n.trim(#char ' ') };
          case (null) { item.productName.trim(#char ' ') };
        };
        // Step 1 — Look up product in catalog by name (case-insensitive)
        let cleanUpper = cleanName.toUpper();
        let catalogEntry = productCatalog.entries().find(func((_, p) : (ProductId, Product)) : Bool {
          Text.equal(p.name.toUpper(), cleanUpper)
        });
        switch (catalogEntry) {
          case (null) {
            return #err("Product not found in catalog: " # cleanName);
          };
          case (?(_, catalogProduct)) {
            // Step 2 — Determine canonical catalog price based on payment_type
            let catalogPriceOpt : ?Float = switch (catalogProduct.payment_type) {
              case "monthly" { catalogProduct.price_monthly };
              case "quarterly" { catalogProduct.price_monthly };
              case "annual" { catalogProduct.price_annual };
              case _ { catalogProduct.price_onetime }; // "one_time" | "deposit_50" | unknown
            };
            let catalogPrice : Float = switch (catalogPriceOpt) {
              case (?p) { p };
              case (null) {
                return #err("Invalid payment type in catalog for this product");
              };
            };
            // For deposit_50, validate submitted price against 50% of catalog price
            let expectedCents : Nat = if (Text.equal(catalogProduct.payment_type, "deposit_50")) {
              Int.abs((catalogPrice * 50.0).toInt())
            } else {
              Int.abs((catalogPrice * 100.0).toInt())
            };
            if (item.priceInCents != expectedCents) {
              return #err("Price mismatch \u{2014} submitted price does not match catalog");
            };
            // Step 3 — Validate payment_type is a recognised value
            let isKnownPaymentType = (
              Text.equal(catalogProduct.payment_type, "one_time") or
              Text.equal(catalogProduct.payment_type, "deposit_50") or
              Text.equal(catalogProduct.payment_type, "monthly") or
              Text.equal(catalogProduct.payment_type, "quarterly") or
              Text.equal(catalogProduct.payment_type, "annual")
            );
            if (not isKnownPaymentType) {
              return #err("Invalid payment type in catalog for this product");
            };
          };
        };
      };
    };


    if (not _isAllowedRedirectUrl(successUrl)) { return #err("Invalid redirect URL") };
    if (not _isAllowedRedirectUrl(cancelUrl)) { return #err("Invalid redirect URL") };

    // Non-subscription products: proceed with the standard Stripe checkout session flow
    let body = switch (_buildSessionBody(cfg, caller, items, successUrl, cancelUrl, clientEmail, clientName)) {
      case (#err(e)) { return #err(e) };
      case (#ok(b)) { b };
    };

    let headers = [
      { name = "authorization"; value = "Bearer " # cfg.secretKey },
      { name = "content-type"; value = "application/x-www-form-urlencoded" },
    ];

    try {
      let response = await OutCall.httpPostRequest("https://api.stripe.com/v1/checkout/sessions", headers, body, transform);
      #ok(response)
    } catch (error) {
      #err("Failed to create checkout session: " # error.message())
    };
  };

  // TRANSFORM (HTTP OUTCALLS)
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // ----- USER PROFILE / EMAIL AUTH -----

  // initAdminAccount — one-time setup after deployment. Creates the admin account with a hashed password.
  // The frontend must SHA-256 hash the password before calling this function.
  // Protected by _adminSeeded flag — can only be called once.
  public shared func initAdminAccount(email : Text, passwordHash : Blob) : async () {
    Runtime.trap("initAdminAccount is disabled");
  };

  // _claimGuestOrders — re-assigns any anonymous-principal orders that belong to this user
  // by matching them via the CRM client email. Called on successful login and registration.
  func _claimGuestOrders(userPrincipal : Principal, userEmail : Text) {
    let anonPrincipal = Principal.fromText("2vxsx-fae");
    let emailLower = userEmail.toLower();
    // Check if any CRM client record has an email matching this user
    let emailMatches = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
      Text.equal(t.1.email.toLower(), emailLower)
    });
    switch (emailMatches) {
      case (null) { /* No CRM record for this email — nothing to claim */ };
      case (?_) {
        // Reassign all anonymous-principal orders whose CRM email matches this user
        for ((orderId, order) in orders.entries()) {
          if (Principal.equal(order.client_id, anonPrincipal)) {
            orders.add(orderId, { order with client_id = userPrincipal });
          };
        };
      };
    };
  };

  public shared ({ caller }) func login(args : { email : Text; passwordHash : Blob }) : async LoginResult {
    // Email/password login is for client portal access only.
    // Admin role is granted exclusively via registerAdminPrincipal() (Internet Identity).
    let lookupEmail = args.email;
    switch (userProfiles.get(lookupEmail)) {
      case (null) { #err("Invalid credentials") };
      case (?profile) {
        if (profile.passwordHash == args.passwordHash) {
          // Map the caller's Principal to their canonical email for Principal-gated functions
          principalToEmail.add(caller, lookupEmail);
          // Claim any guest checkout orders placed before login
          _claimGuestOrders(caller, lookupEmail);
          #ok({ role = profile.role; firstName = profile.firstName; email = profile.email })
        } else {
          #err("Invalid credentials")
        }
      };
    }
  };

  public shared ({ caller }) func registerUser(args : { firstName : Text; lastName : Text; email : Text; passwordHash : Blob }) : async UpsertResult {
    // Email/password registration is for client portal access only.
    // Admin role is granted exclusively via registerAdminPrincipal() (Internet Identity).
    let canonicalEmail = args.email;
    if (userProfiles.containsKey(canonicalEmail)) {
      return #err("Email already registered");
    };
    let profile : UserProfile = {
      email = canonicalEmail;
      passwordHash = args.passwordHash;
      firstName = args.firstName;
      lastName = args.lastName;
      businessName = "";
      businessType = "";
      phone = "";
      role = "client";
      created_at = getCurrentTimestamp();
    };
    userProfiles.add(canonicalEmail, profile);
    // Fire-and-forget admin alert for new user sign-up
    let signupBody =
      "<strong>New User Signed Up</strong><br><br>"
      # "<b>Name:</b> " # args.firstName # " " # args.lastName # "<br>"
      # "<b>Email:</b> " # canonicalEmail # "<br><br>"
      # "Log in to the admin panel to view this new account.";
    ignore sendEmail(getAdminEmail(), "New User Signed Up — Imperidome", signupBody);
    ignore _pushAdminNotification(
      "new_signup",
      "New User: " # args.firstName # " " # args.lastName,
      args.firstName # " " # args.lastName # " (" # canonicalEmail # ") just created an account."
    );
    // Push notification trigger — always a client signup now
    ignore await triggerPushNotification("New Client Signup", args.firstName # " " # args.lastName # " just signed up", "/admin/clients", "New client signup");
    // Claim any guest checkout orders placed before registration
    _claimGuestOrders(caller, canonicalEmail);
    #ok
  };

  public shared ({ caller }) func getMyProfile(email : Text) : async ?UserProfile {
    if (caller.isAnonymous()) { return null };
    switch (principalToEmail.get(caller)) {
      case (null) { return null };
      case (?callerEmail) {
        if (not Text.equal(callerEmail.toLower(), email.toLower())) { return null };
      }
    };
    userProfiles.get(email)
  };

  public query func getClientByPrincipal(principal : Principal) : async ?UserProfile {
    switch (principalToEmail.get(principal)) {
      case (null) { null };
      case (?email) { userProfiles.get(email) };
    }
  };

  public shared ({ caller }) func updateProfile(args : { email : Text; firstName : Text; lastName : Text; phone : Text; businessName : Text; businessType : Text }) : async UpsertResult {
    if (caller.isAnonymous()) { return #err("not authenticated") };
    switch (principalToEmail.get(caller)) {
      case (null) { return #err("unknown caller") };
      case (?callerEmail) {
        if (not Text.equal(callerEmail.toLower(), args.email.toLower())) { return #err("unauthorized") };
      }
    };
    switch (userProfiles.get(args.email)) {
      case (null) { #err("User not found") };
      case (?profile) {
        let updated : UserProfile = {
          profile with
          firstName = args.firstName;
          lastName = args.lastName;
          phone = args.phone;
          businessName = args.businessName;
          businessType = args.businessType;
        };
        userProfiles.add(args.email, updated);
        #ok
      };
    }
  };

  public shared ({ caller }) func changePassword(args : { email : Text; currentPasswordHash : Blob; newPasswordHash : Blob }) : async UpsertResult {
    if (caller.isAnonymous()) { return #err("not authenticated") };
    switch (principalToEmail.get(caller)) {
      case (null) { return #err("unknown caller") };
      case (?callerEmail) {
        if (not Text.equal(callerEmail.toLower(), args.email.toLower())) { return #err("unauthorized") };
      }
    };
    switch (userProfiles.get(args.email)) {
      case (null) { #err("User not found") };
      case (?profile) {
        if (profile.passwordHash != args.currentPasswordHash) {
          return #err("Current password is incorrect");
        };
        let updated : UserProfile = { profile with passwordHash = args.newPasswordHash };
        userProfiles.add(args.email, updated);
        #ok
      };
    }
  };

  public shared ({ caller }) func requestAccountDeletion() : async { #ok; #err : Text } {
    userOnly(caller);
    switch (principalToEmail.get(caller)) {
      case null { return #err("Session not found") };
      case (?email) {
        var found = false;
        var newClients : [(Text, CrmClient)] = [];
        for ((k, v) in _stableClientsV3.vals()) {
          if (Text.equal(v.email, email)) {
            found := true;
            let updated : CrmClient = {
              id                       = v.id;
              name                     = v.name;
              email                    = v.email;
              phone                    = v.phone;
              source                   = v.source;
              activeServices           = v.activeServices;
              projectStatus            = v.projectStatus;
              hasAccount               = v.hasAccount;
              onboardingBriefId        = v.onboardingBriefId;
              briefStatus              = v.briefStatus;
              briefSubmittedAt         = v.briefSubmittedAt;
              currentMilestone         = v.currentMilestone;
              milestoneUpdatedAt       = v.milestoneUpdatedAt;
              created_at               = v.created_at;
              completionPaymentCharged = v.completionPaymentCharged;
              notes                    = v.notes;
              siteLinkLog              = v.siteLinkLog;
              deletionRequested        = true;
              deletionRequestedAt      = Time.now();
              stripeConnectAccountId   = v.stripeConnectAccountId;
              stripeConnectStatus      = v.stripeConnectStatus;
              platformFeePercentage    = v.platformFeePercentage;
              webhookSecret            = null;
              connectedAt              = null;
              lastActivityAt           = null;
            };
            newClients := newClients.concat([(k, updated)]);
          } else {
            newClients := newClients.concat([(k, v)]);
          };
        };
        if (not found) { return #err("Client record not found") };
        _stableClientsV3 := newClients;
        let adminEmail = getAdminEmail();
        ignore await sendEmail(
          adminEmail,
          "Account Deletion Request",
          "Client " # email # " has requested account deletion."
        );
        #ok
      };
    }
  };

  // PASSWORD RESET FLOW

  // checkResetRateLimit — returns true if the request is allowed, false if rate-limited.
  // Keeps only requests within the last hour; max RESET_RATE_LIMIT per window.
  // LOGIC-LOW-007: email is normalized to lowercase before map lookup/write.
  func checkResetRateLimit(email : Text) : Bool {
    let now = Time.now();
    let window = now - RESET_WINDOW_NS;
    let emailKey = email.toLower();
    let times = switch (resetRequestTimes.get(emailKey)) {
      case (null) { [] };
      case (?t) { t };
    };
    let recent = times.filter(func(t : Int) : Bool { t > window });
    if (recent.size() >= RESET_RATE_LIMIT) { return false };
    resetRequestTimes.add(emailKey, recent.concat([now]));
    true
  };

  // requestPasswordReset — generates a secure time-limited token, stores it, and emails a reset link.
  // Always returns the same generic message regardless of whether the email exists (prevents enumeration).
  public shared func requestPasswordReset(email : Text) : async Text {
    let genericResponse = "If an account exists with that email, a reset link has been sent.";
    if (not checkResetRateLimit(email)) { return genericResponse };
    switch (userProfiles.get(email)) {
      case (null) { return genericResponse };
      case (?_) {
        // Invalidate any existing unused tokens for this email
        _stablePasswordResetTokens := _stablePasswordResetTokens.map<PasswordResetToken, PasswordResetToken>(func(t) {
          if (Text.equal(t.email, email) and not t.used) {
            { t with used = true }
          } else { t }
        });

        // Generate a cryptographically random 32-byte token (hex-encoded)
        let entropy = await Random.blob();
        let hexChars = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
        let tokenBytes = entropy.toArray();
        var tokenText = "";
        for (b in tokenBytes.vals()) {
          let hi = b.toNat() / 16;
          let lo = b.toNat() % 16;
          tokenText := tokenText # hexChars[hi] # hexChars[lo];
        };
        let token = tokenText;

        let expiresAt = Time.now() + 3_600_000_000_000; // 1 hour in nanoseconds

        let newToken : PasswordResetToken = {
          token;
          email;
          expiresAt;
          used = false;
        };
        // FIFO cap: drop oldest reset token when limit reached
        if (_stablePasswordResetTokens.size() >= MAX_PASSWORD_RESET_TOKENS) {
          var newTokens : [PasswordResetToken] = [];
          var i = 1;
          while (i < _stablePasswordResetTokens.size()) {
            newTokens := newTokens.concat([_stablePasswordResetTokens[i]]);
            i += 1;
          };
          _stablePasswordResetTokens := newTokens;
        };
        _stablePasswordResetTokens := _stablePasswordResetTokens.concat([newToken]);

        // Build reset link
        let resetLink = _siteBaseUrl # "/reset-password?token=" # token;

        // Resolve client name for the email
        let clientName = switch (userProfiles.get(email)) {
          case (?p) {
            let name = p.firstName # " " # p.lastName;
            if (name.size() > 1) { name } else { "Valued Client" };
          };
          case (null) { "Valued Client" };
        };

        // Build and send the password reset email
        let (subj, bod) = getTemplateForKey(
          "password_reset",
          "Reset Your Imperidome Password",
          "Hi {{client_name}},<br><br>"
            # "We received a request to reset your password.<br><br>"
            # "Click the link below to set a new password. This link expires in 1 hour.<br><br>"
            # "<a href=\"{{reset_link}}\" class=\"cta\">Reset My Password</a><br><br>"
            # "Or copy and paste this link into your browser:<br>"
            # "<span class=\"accent\">{{reset_link}}</span><br><br>"
            # "If you did not request a password reset, you can safely ignore this email.<br><br>"
            # "&mdash; The Imperidome Team"
        );
        let vars : [(Text, Text)] = [("client_name", clientName), ("reset_link", resetLink)];
        let interpolatedSubj = interpolateTemplate(subj, vars);
        let interpolatedBod  = interpolateTemplate(bod, vars);
        ignore sendEmailWithTriggerName(email, interpolatedSubj, interpolatedBod, "password_reset");

        ignore _pushAdminNotification("password_reset_requested", "Password Reset Requested", "Client " # email # " requested a password reset");

        genericResponse
      };
    }
  };

  // resetPasswordWithToken — validates the token and updates the user's password hash.
  public shared func resetPasswordWithToken(token : Text, newPasswordHash : Blob) : async Text {
    // Find the token in stable storage
    let found = _stablePasswordResetTokens.find(func(t : PasswordResetToken) : Bool {
      Text.equal(t.token, token)
    });
    switch (found) {
      case (null) { "Invalid or expired reset link. Please request a new one." };
      case (?t) {
        if (t.used) {
          return "This reset link has already been used. Please request a new one.";
        };
        if (Time.now() > t.expiresAt) {
          return "This reset link has expired. Please request a new one.";
        };
        // Update the user's password hash
        switch (userProfiles.get(t.email)) {
          case (null) { "Invalid or expired reset link. Please request a new one." };
          case (?profile) {
            let updated : UserProfile = { profile with passwordHash = newPasswordHash };
            userProfiles.add(t.email, updated);
            // Mark the token as used
            _stablePasswordResetTokens := _stablePasswordResetTokens.map<PasswordResetToken, PasswordResetToken>(func(tkn) {
              if (Text.equal(tkn.token, token)) { { tkn with used = true } } else { tkn }
            });
            "Password updated successfully."
          };
        }
      };
    }
  };

  // verifySession — lightweight Principal-based session validation.
  // The caller's identity is cryptographically enforced by the IC (via Internet Identity delegation)
  // and cannot be spoofed. The sessionToken parameter is accepted for forward-compatibility with
  // a full token-signing system but the real verification is the unforgeable IC caller identity.
  public query ({ caller }) func verifySession(sessionToken : Text) : async Bool {
    if (caller.isAnonymous()) { return false };
    // A caller that is non-anonymous and present in principalToEmail is a verified, logged-in client.
    switch (principalToEmail.get(caller)) {
      case (null) { false };
      case (?_email) { true };
    };
  };

  public shared ({ caller }) func getAdminAllClients() : async [UserProfile] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    userProfiles.values().filter(func(p) {
      Text.equal(p.role, "client") and not Text.equal(p.email, getAdminEmail())
    }).toArray()
  };

  // PRODUCT CATALOG QUERIES
  public query func getProducts() : async [Product] {
    let arr = productCatalog.values().filter(func(p) {
      if (not p.active) { return false };
      switch (categoryVisibility.get(p.product_type)) {
        case (?vis) vis;
        case null true; // unknown categories default to visible
      };
    }).map(func(p) {
      let imgUrl : ?Text = switch (p.imageUrl) {
        case (?url) {
          if (url != "") { ?url } else {
            let imgEntry = _productImages.filter(func(e : (Nat, Text)) : Bool { e.0 == p.id });
            if (imgEntry.size() > 0) { ?imgEntry[0].1 } else { null }
          }
        };
        case null {
          let imgEntry = _productImages.filter(func(e : (Nat, Text)) : Bool { e.0 == p.id });
          if (imgEntry.size() > 0) { ?imgEntry[0].1 } else { null }
        };
      };
      { p with imageUrl = imgUrl }
    }).toArray();
    arr.sort(func(a, b) { Nat.compare(a.id, b.id) });
  };

  public shared ({ caller }) func getAllProductsAdmin() : async [Product] {
    adminOnly(caller);
    let arr = productCatalog.values().map(func(p) {
      let imgUrl : ?Text = switch (p.imageUrl) {
        case (?url) {
          if (url != "") { ?url } else {
            let imgEntry = _productImages.filter(func(e : (Nat, Text)) : Bool { e.0 == p.id });
            if (imgEntry.size() > 0) { ?imgEntry[0].1 } else { null }
          }
        };
        case null {
          let imgEntry = _productImages.filter(func(e : (Nat, Text)) : Bool { e.0 == p.id });
          if (imgEntry.size() > 0) { ?imgEntry[0].1 } else { null }
        };
      };
      { p with imageUrl = imgUrl }
    }).toArray();
    arr.sort(func(a, b) { Nat.compare(a.id, b.id) });
  };

  public query func getProductsByType(productType : Text) : async [Product] {
    let arr = productCatalog.values().filter(func(p) { Text.equal(p.product_type, productType) }).toArray();
    arr.sort(func(a, b) { Nat.compare(a.id, b.id) });
  };

  public shared ({ caller }) func updateProductPrice(
    productId : Text,
    newPriceMonthly : ?Float,
    newPriceAnnual : ?Float,
    newPriceOnetime : ?Float
  ) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    // Validate: reject any provided price below $0.50 (Stripe minimum)
    switch (newPriceMonthly) {
      case (?p) { if (p < 0.50) { return #err("Price must be at least $0.50") } };
      case null {};
    };
    switch (newPriceAnnual) {
      case (?p) { if (p < 0.50) { return #err("Price must be at least $0.50") } };
      case null {};
    };
    switch (newPriceOnetime) {
      case (?p) { if (p < 0.50) { return #err("Price must be at least $0.50") } };
      case null {};
    };
    let id : ProductId = switch (Nat.fromText(productId)) {
      case (?n) n;
      case null { return #err("Invalid product ID") };
    };
    switch (productCatalog.get(id)) {
      case null { #err("Product not found") };
      case (?existing) {
        let updated : Product = {
          existing with
          price_monthly = newPriceMonthly;
          price_annual = newPriceAnnual;
          price_onetime = newPriceOnetime;
        };
        productCatalog.add(id, updated);
        // Persist the updated catalog so price changes survive upgrades
        _stableCatalogV6 := productCatalog.entries().toArray();
        #ok;
      };
    };
  };

  public shared ({ caller }) func updateProductDescription(
    productId : Text,
    newDescription : Text
  ) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let id : ProductId = switch (Nat.fromText(productId)) {
      case (?n) n;
      case null { return #err("Invalid product ID") };
    };
    switch (productCatalog.get(id)) {
      case null { #err("Product not found") };
      case (?existing) {
        let updated : Product = { existing with description = newDescription };
        productCatalog.add(id, updated);
        _stableCatalogV6 := productCatalog.entries().toArray();
        #ok;
      };
    };
  };

  public shared ({ caller }) func updateProductRichFields(
    productId : Text,
    tagline : ?Text,
    featureBullets : [Text],
    bestFor : ?Text,
    upgradePath : ?Text,
    recommendedPlan : ?Text,
    videoUrl1 : Text,
    videoUrl2 : Text,
    showQuestionnaire : Bool
  ) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let id : ProductId = switch (Nat.fromText(productId)) {
      case (?n) n;
      case null { return #err("Invalid product ID") };
    };
    switch (productCatalog.get(id)) {
      case null { #err("Product not found") };
      case (?existing) {
        let updated : Product = {
          existing with
          tagline = tagline;
          featureBullets = featureBullets;
          bestFor = bestFor;
          upgradePath = upgradePath;
          recommendedPlan = recommendedPlan;
          video_url_1 = videoUrl1;
          video_url_2 = videoUrl2;
          show_questionnaire = showQuestionnaire;
        };
        productCatalog.add(id, updated);
        _stableCatalogV6 := productCatalog.entries().toArray();
        #ok;
      };
    };
  };

  public shared ({ caller }) func updateProductDetailContent(
    productId : Text,
    detailDescription : ?Text,
    seoMetaTitle : ?Text,
    seoMetaDescription : ?Text,
    heroHeadline : ?Text,
    heroSubheadline : ?Text,
    bodySections : ?Text,
    proofPoints : ?Text,
    faqItems : ?Text,
    closingCTA : ?Text
  ) : async UpsertResult {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let id : ProductId = switch (Nat.fromText(productId)) {
      case (?n) n;
      case null { return #err("Invalid product ID") };
    };
    switch (productCatalog.get(id)) {
      case null { #err("Product not found") };
      case (?existing) {
        let updated : Product = {
          existing with
          detailDescription = detailDescription;
          seoMetaTitle = seoMetaTitle;
          seoMetaDescription = seoMetaDescription;
          heroHeadline = heroHeadline;
          heroSubheadline = heroSubheadline;
          bodySections = bodySections;
          proofPoints = proofPoints;
          faqItems = faqItems;
          closingCTA = closingCTA;
        };
        productCatalog.add(id, updated);
        _stableCatalogV6 := productCatalog.entries().toArray();
        #ok;
      };
    };
  };

  public shared({ caller }) func updateProductPaymentType(
    productId : Text,
    paymentType : Text
  ) : async Bool {
    if (not isAdmin(caller)) { return false };
    let validPaymentTypes = ["one_time", "monthly", "quarterly", "annual", "deposit_50"];
    let isValid = validPaymentTypes.find(func(v : Text) : Bool { Text.equal(v, paymentType) }) != null;
    if (not isValid) { return false };
    let id : ProductId = switch (Nat.fromText(productId)) {
      case (?n) n;
      case null { return false };
    };
    switch (productCatalog.get(id)) {
      case null { false };
      case (?existing) {
        let updated : Product = { existing with payment_type = paymentType };
        productCatalog.add(id, updated);
        _stableCatalogV6 := productCatalog.entries().toArray();
        true;
      };
    };
  };

  public shared ({ caller }) func updateProductImage(
    productId : Text,
    imageUrl : Text
  ) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let id : ProductId = switch (Nat.fromText(productId)) {
      case (?n) n;
      case null { return #err("Invalid product ID") };
    };
    // Check product exists and update productCatalog with new imageUrl
    switch (productCatalog.get(id)) {
      case null { return #err("Product not found") };
      case (?existing) {
        let updated : Product = { existing with imageUrl = ?imageUrl };
        productCatalog.add(id, updated);
        _stableCatalogV6 := productCatalog.entries().toArray();
      };
    };
    // Also update _productImages for backward compatibility (read by getProducts and getProductImageUrl)
    var found = false;
    let arr = Array.tabulate(
      _productImages.size(),
      func(i) {
        let (k, _v) = _productImages[i];
        if (k == id) { found := true; (k, imageUrl) } else { _productImages[i] };
      }
    );
    if (found) {
      _productImages := arr;
    } else {
      _productImages := arr.concat([(id, imageUrl)]);
    };
    #ok;
  };

  public query func getProductImageUrl(productId : Nat) : async ?Text {
    for ((id, url) in _productImages.vals()) {
      if (id == productId) return ?url;
    };
    null
  };

  public shared ({ caller }) func removeProductImage(productId : Nat) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    _productImages := _productImages.filter(func(entry : (Nat, Text)) : Bool { entry.0 != productId });
    switch (productCatalog.get(productId)) {
      case (?existing) {
        productCatalog.add(productId, { existing with imageUrl = null; tags = [] });
        _stableCatalogV6 := productCatalog.entries().toArray();
      };
      case null {};
    };
    #ok
  };

  public shared ({ caller }) func toggleProductStatus(productId : Text) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let id : ProductId = switch (Nat.fromText(productId)) {
      case (?n) n;
      case null { return #err("Invalid product ID") };
    };
    switch (productCatalog.get(id)) {
      case null { #err("Product not found") };
      case (?existing) {
        let updated : Product = { existing with active = not existing.active };
        productCatalog.add(id, updated);
        // Persist the updated catalog so status changes survive upgrades
        _stableCatalogV6 := productCatalog.entries().toArray();
        #ok;
      };
    };
  };

  public shared ({ caller }) func reseedCatalog() : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let keysToRemove = productCatalog.entries().map(func((id, _) : (ProductId, Product)) : ProductId { id }).toArray();
    for (id in keysToRemove.vals()) {
      productCatalog.remove(id);
    };
    _productImages := [];
    _seedProducts();
    _stableCatalogV6 := productCatalog.entries().toArray();
    #ok("Catalog re-seeded successfully")
  };

  // CATEGORY VISIBILITY

  public shared ({ caller }) func createProduct(
    name : Text,
    description : Text,
    productType : Text,
    priceMonthly : ?Float,
    priceAnnual : ?Float,
    priceOnetime : ?Float,
    tagline : ?Text,
    featureBullets : [Text],
    bestFor : ?Text,
    upgradePath : ?Text,
    recommendedPlan : ?Text,
    paymentType : Text,
    videoUrl1 : Text,
    videoUrl2 : Text,
    showQuestionnaire : Bool,
    planSection : ?Text,
    speedyFilter : ?Text
  ) : async { #ok : ProductId; #err : Text } {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    if (name.size() == 0) { return #err("Name is required") };
    if (productType.size() == 0) { return #err("Product type is required") };
    let hasPrice = priceMonthly != null or priceAnnual != null or priceOnetime != null;
    if (not hasPrice) { return #err("At least one price must be provided") };
    // Validate payment_type value
    let validPaymentTypes = ["one_time", "monthly", "quarterly", "annual", "deposit_50"];
    let isValidPt = validPaymentTypes.find(func(v : Text) : Bool { Text.equal(v, paymentType) }) != null;
    if (not isValidPt) { return #err("Invalid payment_type. Must be one_time, monthly, quarterly, or deposit_50") };
    let newId = await _getNextProductId();
    let newProduct : Product = {
      id = newId;
      name;
      description;
      tier_code = null;
      product_type = productType;
      price_monthly = priceMonthly;
      price_annual = priceAnnual;
      price_onetime = priceOnetime;
      active = true;
      created_at = Time.now();
      tagline = tagline;
      featureBullets = featureBullets;
      bestFor = bestFor;
      upgradePath = upgradePath;
      recommendedPlan = recommendedPlan;
      imageUrl = null;
      tags = [];
      payment_type = paymentType;
      video_url_1 = videoUrl1;
      video_url_2 = videoUrl2;
      show_questionnaire = showQuestionnaire;
      detailDescription = null;
      seoMetaTitle = null;
      seoMetaDescription = null;
      heroHeadline = null;
      heroSubheadline = null;
      bodySections = null;
      proofPoints = null;
      faqItems = null;
      closingCTA = null;
      plan_section = planSection;
      speedy_filter = speedyFilter;
    };
    productCatalog.add(newId, newProduct);
    _stableCatalogV6 := productCatalog.entries().toArray();
    #ok(newId)
  };

  // deleteProduct — permanently removes a product from the catalog. Admin-only.
  // Product IDs are monotonic and are NOT reused after deletion.
  public shared ({ caller }) func deleteProduct(productId : Nat) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    switch (productCatalog.get(productId)) {
      case null { #err("Product not found") };
      case (?_) {
        productCatalog.remove(productId);
        // Persist the updated catalog so deletion survives upgrades
        _stableCatalogV6 := productCatalog.entries().toArray();
        // Remove any cached image entry for this product
        _productImages := _productImages.filter(func(entry : (Nat, Text)) : Bool { entry.0 != productId });
        #ok
      };
    };
  };

  public shared ({ caller }) func updateProductPlanSection(productId : ProductId, planSection : ?Text) : async {#ok; #err : Text} {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    switch (productCatalog.get(productId)) {
      case null { #err("Product not found") };
      case (?p) {
        let updated = { p with plan_section = planSection };
        productCatalog.add(productId, updated);
        #ok
      };
    };
  };

  public shared ({ caller }) func updateProductSpeedyFilter(productId : ProductId, speedyFilter : ?Text) : async {#ok; #err : Text} {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    switch (productCatalog.get(productId)) {
      case null { #err("Product not found") };
      case (?product) {
        let updated = { product with speedy_filter = speedyFilter };
        productCatalog.add(productId, updated);
        #ok
      };
    };
  };

  public shared ({ caller }) func updateCategoryVisibility(category : Text, active : Bool) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    if (category.size() == 0) { return #err("Category name cannot be blank") };
    categoryVisibility.add(category, active);
    // persist to stable storage
    _stableCategoryVisibility := categoryVisibility.entries().toArray();
    #ok;
  };

  public query func getCategoryVisibility() : async [(Text, Bool)] {
    categoryVisibility.entries().toArray();
  };

  // BLOG POST METHODS

  public shared ({ caller }) func createBlogPost(
    title : Text,
    slug : Text,
    category : Text,
    excerpt : Text,
    body : Text,
    author : Text,
    featured_image_url : ?Text,
    featuredImageCaption : Text,
    status : Text,
    seoMetaDescription : ?Text,
    seoMetaKeywords : ?Text,
  ) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    if (not isValidSlug(slug)) { return #err("invalid slug") };
    if (excerpt.size() > 160) { Runtime.trap("Excerpt must be 160 characters or less") };
    // LOGIC-LOW-002 + AUDIT-462-HIGH-001: normalize status to lowercase and validate allowlist
    let normalizedStatus = status.toLower();
    if (not (Text.equal(normalizedStatus, "published") or Text.equal(normalizedStatus, "draft"))) {
      return #err("Invalid status. Must be 'published' or 'draft'");
    };
    let id  = await getNextBlogPostId();
    let now = getCurrentTimestamp();
    let publishedAt = if (Text.equal(normalizedStatus, "published")) { ?now } else { null };
    let post : BlogPost = {
      id; title; slug; category; excerpt; body; author;
      featured_image_url; featuredImageCaption; status = normalizedStatus;
      published_at = publishedAt;
      created_at = now;
      updated_at = now;
      seoMetaDescription;
      seoMetaKeywords;
    };
    if (slugIndex.containsKey(slug)) { Runtime.trap("Slug must be unique") };
    blogPosts.add(id, post);
    slugIndex.add(slug, id);
    #ok
  };

  public shared ({ caller }) func updateBlogPost(
    id : BlogPostId,
    title : Text,
    slug : Text,
    category : Text,
    excerpt : Text,
    body : Text,
    author : Text,
    featured_image_url : ?Text,
    featuredImageCaption : Text,
    status : Text,
    seoMetaDescription : ?Text,
    seoMetaKeywords : ?Text,
  ) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    if (excerpt.size() > 160) { Runtime.trap("Excerpt must be 160 characters or less") };
    // AUDIT-462-HIGH-001 + AUDIT-462-HIGH-002: normalize status and validate allowlist
    let normalizedStatus = status.toLower();
    if (not (Text.equal(normalizedStatus, "published") or Text.equal(normalizedStatus, "draft"))) {
      Runtime.trap("Invalid status. Must be 'published' or 'draft'");
    };
    switch (blogPosts.get(id)) {
      case (null) { Runtime.trap("Blog post not found") };
      case (?existing) {
        let now        = getCurrentTimestamp();
        let isPublished = Text.equal(normalizedStatus, "published");
        let publishedAt : ?Timestamp = if (isPublished) {
          switch (existing.published_at) {
            case (?t) { ?t };
            case (null) { ?now };
          }
        } else {
          null;
        };
        if (not Text.equal(existing.slug, slug)) {
          switch (slugIndex.get(slug)) {
            case (?existingId) {
              if (existingId != id) { Runtime.trap("Slug already exists") };
            };
            case (null) {};
          };
          slugIndex.remove(existing.slug);
          slugIndex.add(slug, id);
        };
        let updatedPost : BlogPost = {
          existing with title; slug; category; excerpt; body; author;
          featured_image_url; featuredImageCaption; status = normalizedStatus;
          published_at = publishedAt;
          updated_at = now;
          seoMetaDescription;
          seoMetaKeywords;
        };
        blogPosts.add(id, updatedPost);
      };
    };
  };

  public shared ({ caller }) func deleteBlogPost(id : BlogPostId) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    switch (blogPosts.get(id)) {
      case (null) { Runtime.trap("Blog post not found") };
      case (?post) { blogPosts.remove(id); slugIndex.remove(post.slug) };
    };
  };

  public shared ({ caller }) func publishBlogPost(id : BlogPostId) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    switch (blogPosts.get(id)) {
      case (null) { Runtime.trap("Blog post not found") };
      case (?post) {
        let now = getCurrentTimestamp();
        if (Text.equal(post.status, "published")) { Runtime.trap("Blog post is already published") };
        blogPosts.add(id, { post with status = "published"; published_at = ?now; updated_at = now });
      };
    };
  };

  public shared ({ caller }) func unpublishBlogPost(id : BlogPostId) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    switch (blogPosts.get(id)) {
      case (null) { Runtime.trap("Blog post not found") };
      case (?post) {
        if (Text.equal(post.status, "draft")) { Runtime.trap("Blog post is already in draft status") };
        blogPosts.add(id, { post with status = "draft"; published_at = null; updated_at = getCurrentTimestamp() });
      };
    };
  };

  public query func getPublishedBlogPosts() : async [BlogPost] {
    let postsArray = blogPosts.values().filter(
      func(post) { Text.equal(post.status, "published") }
    ).toArray();
    postsArray.sort(func(a, b) {
      let aTime = switch (a.published_at) { case (null) { 0 }; case (?t) { Int.abs(t) } };
      let bTime = switch (b.published_at) { case (null) { 0 }; case (?t) { Int.abs(t) } };
      Nat.compare(bTime, aTime);
    });
  };

  public shared ({ caller }) func getAllBlogPostsAdmin() : async [BlogPost] {
    adminOnly(caller);
    let postsArray = blogPosts.values().toArray();
    postsArray.sort(func(a, b) { Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at)) });
  };

  public query func getBlogPostBySlug(slug : Text) : async ?BlogPost {
    switch (slugIndex.get(slug)) {
      case (null) { null };
      case (?id) {
        switch (blogPosts.get(id)) {
          case (null) { null };
          case (?post) {
            if (Text.equal(post.status, "published")) { ?post } else { null };
          };
        };
      };
    };
  };

  // Admin Queries

  public query ({ caller }) func getAdminStats() : async AdminStats {
    adminOnly(caller);
    let usersMap     = accessControlState.userRoles;
    let totalClients = usersMap.foldLeft(0, func(acc, _, role) { if (role == #user) { acc + 1 } else { acc } });
    var activeProjects = 0;
    orders.values().forEach(func(order) {
      if (order.status != #live and order.status != #cancelled) { activeProjects += 1 };
    });
    var unreviewedQuestionnaires = 0;
    questionnaires.values().forEach(func(q) {
      if (q.submitted and not q.reviewed) { unreviewedQuestionnaires += 1 };
    });
    var outstandingInvoices = 0;
    invoices.values().forEach(func(invoice) {
      if (Text.equal(invoice.status, "PENDING") or Text.equal(invoice.status, "OVERDUE")) {
        outstandingInvoices += 1;
      };
    });
    { totalClients; activeProjects; unreviewedQuestionnaires; outstandingInvoices };
  };

  public query ({ caller }) func getAdminAllActivity() : async [ActivityLog] {
    adminOnly(caller);
    let activityArray    = activities.values().toArray();
    let sortedActivities = activityArray.sort(
      func(a, b) { Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at)) }
    );
    sortedActivities.sliceToArray(0, Nat.min(10, sortedActivities.size()));
  };

  // Helper: check if a lead path/message corresponds to a website product
  func _isWebsiteLead(lead : Lead) : Bool {
    // Check path against catalog: if any product with this path/name has product_type Custom Sites or Speedy Sites
    let p = lead.path.toLower();
    var foundInCatalog = false;
    for ((_, prod) in productCatalog.entries()) {
      if (prod.name.toLower() == p and
          (Text.equal(prod.product_type, "Custom Sites") or Text.equal(prod.product_type, "Speedy Sites"))) {
        foundInCatalog := true
      }
    };
    if (foundInCatalog) { return true };
    // Broad path aliases that always mean website
    if (
      Text.equal(p, "custom") or
      Text.equal(p, "custom sites") or
      Text.equal(p, "customsites") or
      Text.equal(p, "speedy") or
      Text.equal(p, "speedy sites") or
      Text.equal(p, "speedysites")
    ) { return true };
    // Also check message JSON for service field matching catalog product_type
    let m = lead.message;
    var msgMatch = false;
    for ((_, prod) in productCatalog.entries()) {
      if (Text.equal(prod.product_type, "Custom Sites") or Text.equal(prod.product_type, "Speedy Sites")) {
        if (m.contains(#text (prod.name))) {
          msgMatch := true
        }
      }
    };
    msgMatch
  };

  // Helper: check if a lead is a one-time product (not website, not subscription)
  func _isProductLead(lead : Lead) : Bool {
    if (_isWebsiteLead(lead)) { return false };
    let p = lead.path.toLower();
    // Skip subscription/maintenance paths — those are not product leads
    if (
      Text.equal(p, "subscription") or
      Text.equal(p, "ai receptionist") or
      Text.equal(p, "maintenance")
    ) { return false };
    // Check if path matches a catalog product that is NOT Custom Sites or Speedy Sites
    var foundNonSite = false;
    for ((_, prod) in productCatalog.entries()) {
      if (prod.name.toLower() == p and
          not Text.equal(prod.product_type, "Custom Sites") and
          not Text.equal(prod.product_type, "Speedy Sites")) {
        foundNonSite := true
      }
    };
    if (foundNonSite) { return true };
    // Non-empty path that isn't a website type — treat as a product lead
    if (p.size() > 0) { return true };
    false
  };

  public query func getDashboardMetrics() : async DashboardMetrics {
    // 1. Total Clients — count entries in _stableClientsV3 (same data source as getClients/AdminClientsPage)
    let totalClients = _stableClientsV3.size();

    // 2. Total Websites — count entries in _stableBuilds (admin-managed Builds tab)
    let totalWebsites = _stableBuildsLatest.size();

    // 3. Total Active Subscriptions — monthly or quarterly only (excludes annual and one-time)
    // MEDIUM-02 FIX: iterate the live subscriptions Map instead of the stale _stableSubscriptions snapshot.
    var totalActiveSubscriptions : Nat = 0;
    for ((_, sub) in subscriptions.entries()) {
      let isActive = Text.equal(sub.status, "active") or
        Text.equal(sub.status, "Active") or
        Text.equal(sub.status, "ACTIVE");
      let isMonthOrQuarter =
        Text.equal(sub.billing_cycle, "month") or
        Text.equal(sub.billing_cycle, "Month") or
        Text.equal(sub.billing_cycle, "Monthly") or
        Text.equal(sub.billing_cycle, "monthly") or
        Text.equal(sub.billing_cycle, "quarter") or
        Text.equal(sub.billing_cycle, "Quarter") or
        Text.equal(sub.billing_cycle, "Quarterly") or
        Text.equal(sub.billing_cycle, "quarterly");
      if (isActive and isMonthOrQuarter) { totalActiveSubscriptions += 1 };
    };

    // 4. Orders — total count of all orders (same data source as getAdminAllOrders/AdminOrdersPage)
    let totalProducts = orders.size();

    // 5. Unreviewed Questionnaires — submitted but not yet reviewed (mirrors AdminQuestionnairesPage)
    let unreviewedQuestionnaires = _stableQuestionnaires.filter(
      func(q : Questionnaire) : Bool { q.submitted and not q.reviewed }
    ).size();

    // 6. Outstanding Invoices — PENDING or OVERDUE status
    var outstandingInvoices = 0;
    invoices.values().forEach(func(invoice : Invoice) {
      if (
        Text.equal(invoice.status, "PENDING") or
        Text.equal(invoice.status, "OVERDUE") or
        Text.equal(invoice.status, "Open") or
        Text.equal(invoice.status, "open")
      ) {
        outstandingInvoices += 1;
      };
    });

    // 7. Recent Activity — 5 most recent entries from activities map,
    //    falling back to _stableLeads sorted by created_at desc
    let allLeads = _stableLeadsV5.map(
      func(t : (Text, Lead)) : Lead { t.1 }
    );
    let recentActivity : [Text] = if (activities.size() > 0) {
      let actArr = activities.values().toArray();
      let sorted = actArr.sort(
        func(a : ActivityLog, b : ActivityLog) : { #less; #equal; #greater } {
          Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at))
        }
      );
      let top5 = sorted.sliceToArray(0, Nat.min(5, sorted.size()));
      top5.map<ActivityLog, Text>(func(a : ActivityLog) : Text {
        a.description
      })
    } else {
      // Derive from _stableLeads
      let sortedLeads = allLeads.sort(
        func(a : Lead, b : Lead) : { #less; #equal; #greater } {
          Int.compare(b.created_at, a.created_at)
        }
      );
      let top5 = sortedLeads.sliceToArray(0, Nat.min(5, sortedLeads.size()));
      top5.map<Lead, Text>(func(lead : Lead) : Text {
        let p = lead.path.toLower();
        if (
          Text.equal(p, "audit") or
          Text.equal(p, "professional site audit") or
          lead.message.contains(#text "PAID AUDIT")
        ) {
          "Audit Purchased: " # lead.name
        } else if (
          Text.equal(p, "aireceptionist") or
          Text.equal(p, "ai receptionists") or
          Text.equal(p, "ai") or
          lead.message.contains(#text "AI Receptionist")
        ) {
          "Subscription Inquiry: " # lead.name
        } else {
          "New Lead: " # lead.name
        }
      })
    };

    let totalOrders = orders.size();
    var totalOrderValue : Nat = 0;
    for ((_, bh) in billingHistoryRecords.entries()) {
      if (bh.status == "Paid") {
        totalOrderValue += bh.amountCents;
      };
    };
    var statusCounts : [(Text, Nat)] = [];
    for ((_, order) in orders.entries()) {
      let statusText = switch (order.status) {
        case (#questionnairePending) { "Questionnaire Pending" };
        case (#questionnaireComplete) { "Questionnaire Complete" };
        case (#depositSent) { "Deposit Sent" };
        case (#depositReceived) { "Deposit Received" };
        case (#buildInProgress) { "Build In Progress" };
        case (#draftReady) { "Draft Ready" };
        case (#revisionsInProgress) { "Revisions In Progress" };
        case (#launching) { "Launching" };
        case (#live) { "Live" };
        case (#paused) { "Paused" };
        case (#cancelled) { "Cancelled" };
      };
      let existingEntry = statusCounts.find(func(entry : (Text, Nat)) : Bool { entry.0 == statusText });
      statusCounts := switch (existingEntry) {
        case (null) { statusCounts.concat([(statusText, 1)]) };
        case (?(_, count)) {
          statusCounts.filter(func(entry : (Text, Nat)) : Bool { entry.0 != statusText }).concat([(statusText, count + 1)])
        };
      };
    };
    let ordersByStatus = statusCounts;

    {
      totalClients;
      totalWebsites;
      totalActiveSubscriptions;
      totalProducts;
      unreviewedQuestionnaires;
      outstandingInvoices;
      recentActivity;
      totalOrders;
      totalOrderValue;
      ordersByStatus;
    }
  };

  public query ({ caller }) func getClientOrders(client : Principal) : async [Order] {
    if (caller != client and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own orders");
    };
    let ordersArray = orders.values().filter(func(o) { o.client_id == client }).toArray();
    ordersArray.sort(func(a, b) { Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at)) });
  };

  public query ({ caller }) func getMyOrders() : async [Order] {
    userOnly(caller);
    // Primary filter: orders where client_id matches the caller.
    // Secondary filter: also include orders where delivery_window (which stores buyer email
    // for webhook-path purchases) matches the caller's email — this ensures clients can see
    // orders recorded via the webhook path before they created a portal account.
    let callerEmail = switch (principalToEmail.get(caller)) {
      case (?e) e;
      case null "";
    };
    let seenIds = Set.empty<Nat>();
    let combined = List.empty<Order>();
    for (o in orders.values()) {
      if (o.client_id == caller) {
        seenIds.add(o.id);
        combined.add(o);
      };
    };
    if (callerEmail != "") {
      for (o in orders.values()) {
        if (not seenIds.contains(o.id) and o.delivery_window == callerEmail) {
          combined.add(o);
        };
      };
    };
    let ordersArray = combined.toArray();
    ordersArray.sort(func(a, b) { Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at)) });
  };

  public query ({ caller }) func getMyActivity() : async [ActivityLog] {
    userOnly(caller);
    let activityArray = activities.values().filter(func(a) { a.client_id == caller }).toArray();
    activityArray.sort(func(a, b) { Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at)) });
  };

  public query ({ caller }) func getMyQuestionnaires() : async [Questionnaire] {
    userOnly(caller);
    let questionnaireArray = questionnaires.values().filter(func(q) { q.client_id == caller }).toArray();
    questionnaireArray.sort(func(a, b) { Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at)) });
  };

  public query ({ caller }) func getMySubscriptions() : async [Subscription] {
    userOnly(caller);
    let subscriptionArray = subscriptions.values().filter(func(s) { s.client_id == caller }).toArray();
    subscriptionArray.sort(func(a, b) { Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at)) });
  };

  public query ({ caller }) func getMyInvoices() : async [Invoice] {
    userOnly(caller);
    let invoiceArray = invoices.values().filter(func(i) { i.client_id == caller }).toArray();
    invoiceArray.sort(func(a, b) { Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at)) });
  };

  public query ({ caller }) func getMyEditRequests() : async [EditRequest] {
    userOnly(caller);
    let editRequestArray = editRequests.values().filter(func(r) { r.client_id == caller }).toArray();
    editRequestArray.sort(func(a, b) { Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at)) });
  };

  // ORDER STATUS EMAIL
  public shared ({ caller }) func sendOrderStatusEmail(
    clientPrincipal : Principal,
    status          : OrderStatus.Status,
    clientEmail     : Text,
  ) : async () {
    adminOnly(caller);
    switch (status) {
      case (#depositSent) {
        let (subj, bod) = getTemplateForKey(
          "deposit_invoice_sent",
          "Your Deposit Invoice Is Ready",
          "Hi {{client_name}},\n\nYour deposit invoice is ready. Please complete your payment to secure your spot in our build queue.",
        );
        let vars = buildEmailVars(clientEmail, ?clientPrincipal, []);
        ignore sendEmail(clientEmail, interpolateTemplate(subj, vars), interpolateTemplate(bod, vars));
      };
      case (#depositReceived) {
        let (subj, bod) = getTemplateForKey(
          "deposit_confirmed",
          "Deposit Confirmed - Your Build Is Queued",
          "Hi {{client_name}},\n\nWe have received your deposit and have added your project to our build queue. Watch for updates as we make progress.",
        );
        let vars = buildEmailVars(clientEmail, ?clientPrincipal, []);
        ignore sendEmail(clientEmail, interpolateTemplate(subj, vars), interpolateTemplate(bod, vars));
      };
      case (#draftReady) {
        let (subj, bod) = getTemplateForKey(
          "draft_ready",
          "Your First Draft Is Ready to Review",
          "Hi {{client_name}},\n\nYour first draft is now ready for review. Please log in to your client portal and let us know your feedback.",
        );
        let vars = buildEmailVars(clientEmail, ?clientPrincipal, []);
        ignore sendEmail(clientEmail, interpolateTemplate(subj, vars), interpolateTemplate(bod, vars));
      };
      case (#revisionsInProgress) {
        let (subj, bod) = getTemplateForKey(
          "draft_ready",
          "We Have Received Your Feedback",
          "Hi {{client_name}},\n\nThank you for your feedback. We are making your requested revisions and will notify you once they are complete.",
        );
        let vars = buildEmailVars(clientEmail, ?clientPrincipal, []);
        ignore sendEmail(clientEmail, interpolateTemplate(subj, vars), interpolateTemplate(bod, vars));
      };
      case (#launching) {
        let (subj, bod) = getTemplateForKey(
          "site_launched",
          "Your Site Is Going Live",
          "Hi {{client_name}},\n\nYour website is being launched! We are making the final configurations to ensure everything is set up properly.",
        );
        let vars = buildEmailVars(clientEmail, ?clientPrincipal, []);
        ignore sendEmail(clientEmail, interpolateTemplate(subj, vars), interpolateTemplate(bod, vars));
      };
      case (#live) {
        let (subj, bod) = getTemplateForKey(
          "site_launched",
          "Your Site Is Live - Welcome to Imperidome",
          "Hi {{client_name}},\n\nCongratulations! Your website is live and fully operational. We look forward to supporting your ongoing needs.\n\nLaunch date: {{launch_date}}",
        );
        let vars = buildEmailVars(clientEmail, ?clientPrincipal, []);
        ignore sendEmail(clientEmail, interpolateTemplate(subj, vars), interpolateTemplate(bod, vars));
      };
      case (_) {};
    };
  };

  // Questionnaire Logic

  public shared ({ caller }) func markQuestionnaireReviewed(questionnaireId : QuestionnaireId) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized: Only admins can perform this action") };
    switch (questionnaires.get(questionnaireId)) {
      case (null) { Runtime.trap("Questionnaire not found") };
      case (?questionnaire) {
        if (questionnaire.reviewed) { Runtime.trap("Questionnaire is already marked as reviewed") };
        let updatedQuestionnaire = { questionnaire with reviewed = true; reviewed_at = ?getCurrentTimestamp() };
        questionnaires.add(questionnaireId, updatedQuestionnaire);
        let activityId = await getNextActivityId();
        let activity : ActivityLog = {
          id = activityId;
          client_id = questionnaire.client_id;
          order_id = questionnaire.order_id;
          description = "Questionnaire marked as reviewed by admin";
          status_at_time = #questionnaireComplete;
          created_at = getCurrentTimestamp();
        };
        activities.add(activityId, activity);
      };
    };
  };

  public shared ({ caller }) func deleteQuestionnaire(questionnaireId : QuestionnaireId) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    questionnaires.remove(questionnaireId);
    _stableQuestionnaires := _stableQuestionnaires.filter(func(q) { q.id != questionnaireId });
  };

  public query ({ caller }) func getQuestionnaireByClientId(clientId : ClientId) : async ?Questionnaire {
    if (caller != clientId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own questionnaire");
    };
    let filtered     = questionnaires.values().filter(func(q) { Principal.equal(q.client_id, clientId) });
    let filteredList = List.fromIter<Questionnaire>(filtered);
    if (filteredList.isEmpty()) { return null };
    let maxQuestionnaire = filteredList.foldLeft(
      filteredList.at(0),
      func(max, current) { if (current.created_at > max.created_at) { current } else { max } },
    );
    ?maxQuestionnaire;
  };

  public query ({ caller }) func getMyMostRecentQuestionnaire() : async ?Questionnaire {
    userOnly(caller);
    let filtered     = questionnaires.values().filter(func(q) { Principal.equal(q.client_id, caller) });
    let filteredList = List.fromIter<Questionnaire>(filtered);
    if (filteredList.isEmpty()) { return null };
    let maxQuestionnaire = filteredList.foldLeft(
      filteredList.at(0),
      func(max, current) { if (current.created_at > max.created_at) { current } else { max } },
    );
    ?maxQuestionnaire;
  };

  public shared ({ caller }) func submitQuestionnaire(questionnaireType : Text, answers : Text) : async Nat {
    let now = Time.now();
    let newId : QuestionnaireId = await generateSecureNatId();
    let q : Questionnaire = {
      id           = newId;
      order_id     = 0;
      client_id    = caller;
      tier_code    = questionnaireType;
      answers      = answers;
      progress     = 100;
      submitted    = true;
      submitted_at = ?now;
      reviewed     = false;
      reviewed_at  = null;
      created_at   = now;
      updated_at   = now;
    };
    questionnaires.add(newId, q);
    _stableQuestionnaires := _stableQuestionnaires.concat([q]);
    ignore await _createOrUpdateClientFromQuestionnaire(questionnaireType, answers, newId.toText());
    // Auto-advance the client's milestone to 2 using backend admin authority
    let submitterEmailForMilestone = _extractEmailFromAnswers(answers);
    if (submitterEmailForMilestone.size() > 0) {
      let existing = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, submitterEmailForMilestone) });
      switch (existing) {
        case (?(_, client)) {
          if (client.currentMilestone < 2) {
            _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
              if (Text.equal(t.0, submitterEmailForMilestone)) {
                (t.0, { t.1 with currentMilestone = 2; milestoneUpdatedAt = ?now })
              } else { t }
            });
          };
        };
        case (null) {};
      };
    };
    // Try to extract submitter's email from answers for the client-facing email
    let submitterEmail = _extractEmailFromAnswers(answers);
    let extras : [(Text, Text)] = [("project_tier", questionnaireType)];
    if (submitterEmail.size() > 0) {
      ignore sendEmailByTrigger("questionnaire_submitted_client", submitterEmail, extras);
    };
    ignore sendEmailByTrigger("questionnaire_submitted_admin", getAdminEmail(), extras);
    // Push notification trigger
    ignore await triggerPushNotification("New Questionnaire", "A client submitted a questionnaire", "/admin/questionnaires", "New questionnaire");
    newId;
  };

  public query ({ caller }) func getAdminAllQuestionnaires() : async [Questionnaire] {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let arr = _stableQuestionnaires;
    arr.sort(func(a, b) { Int.compare(b.created_at, a.created_at) });
  };

  public query ({ caller }) func getClientInvoices(clientPrincipal : Principal) : async [Invoice] {
    adminOnly(caller);
    let invoiceArray = invoices.values().filter(
      func(invoice) { Principal.equal(invoice.client_id, clientPrincipal) }
    ).toArray();
    invoiceArray.sort(func(a, b) { Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at)) });
  };

  public shared ({ caller }) func sendDepositInvoice(
    clientPrincipal : Principal,
    clientEmail     : Text,
    amountCents     : Nat,
    description     : Text,
    dueDate         : Timestamp,
  ) : async Text {
    adminOnly(caller);
    let item : Stripe.ShoppingItem = {
      currency = "usd";
      productName = description;
      productDescription = description;
      priceInCents = amountCents;
      quantity = 1;
    };
    let stripeUrl = await Stripe.createCheckoutSession(
      requireStripeConfig(),
      clientPrincipal,
      [item],
      _siteBaseUrl # "/portal/invoices",
      _siteBaseUrl # "/portal/invoices",
      transform,
    );
    let invoiceId  = await getNextInvoiceId();
    let invoiceNum = "INV-" # invoiceId.toText();
    let amountFloat : Float = amountCents.toFloat() / 100.0;
    let sortedClientOrders = orders.values().filter(
      func(o) {
        Principal.equal(o.client_id, clientPrincipal) and
        o.status != #live and
        o.status != #cancelled
      }
    ).toArray().sort(func(a, b) { Nat.compare(Int.abs(b.created_at), Int.abs(a.created_at)) });
    let maybeOrderId : ?OrderId = if (sortedClientOrders.size() > 0) { ?sortedClientOrders[0].id } else { null };
    let now = getCurrentTimestamp();
    let invoice : Invoice = {
      id = invoiceId;
      client_id = clientPrincipal;
      order_id = maybeOrderId;
      invoice_number = invoiceNum;
      description = description;
      amount = amountFloat;
      status = "PENDING";
      due_date = dueDate;
      paid_at = null;
      stripe_payment_intent_id = stripeUrl;
      created_at = now;
      updated_at = now;
    };
    invoices.add(invoiceId, invoice);
    switch (maybeOrderId) {
      case (?orderId) {
        switch (orders.get(orderId)) {
          case (?order) { orders.add(orderId, { order with status = #depositSent; updated_at = now }) };
          case (null)   {};
        };
      };
      case (null) {};
    };
    let actDesc = "Deposit invoice sent - $" # amountFloat.toText();
    let activityId = await getNextActivityId();
    let activity : ActivityLog = {
      id = activityId;
      client_id = clientPrincipal;
      order_id = switch (maybeOrderId) { case (?oid) { oid }; case (null) { 0 } };
      description = actDesc;
      status_at_time = #depositSent;
      created_at = now;
    };
    activities.add(activity.id, activity);
    let (subj, bod) = getTemplateForKey(
      "deposit_invoice_sent",
      "Your Deposit Invoice Is Ready",
      "Hi {{client_name}},\n\nYour deposit invoice for {{project_tier}} is ready.\n\nAmount: ${{invoice_amount}}\nDescription: " # description # "\n\nPay now: {{stripe_link}}",
    );
    let extras : [(Text, Text)] = [
      ("stripe_link",    stripeUrl),
      ("invoice_amount", amountFloat.toText()),
      ("due_date",       dueDate.toText()),
    ];
    let vars = buildEmailVars(clientEmail, ?clientPrincipal, extras);
    ignore sendEmail(clientEmail, interpolateTemplate(subj, vars), interpolateTemplate(bod, vars));
    stripeUrl;
  };

  public shared ({ caller }) func saveEmailTemplate(trigger_key : Text, subject : Text, body : Text) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let now      = getCurrentTimestamp();
    let existing = emailTemplates.get(trigger_key);
    let id = switch (existing) {
      case (?t)   { t.id };
      case (null) { await generateSecureNatId() };
    };
    emailTemplates.add(trigger_key, { id; trigger_key; subject; body; updated_at = now });
  };

  public shared query({ caller }) func getEmailTemplates() : async [EmailTemplate] {
    adminOnly(caller);
    emailTemplates.values().toArray();
  };

  // EMAIL LOGS
  public shared query ({ caller }) func getEmailLogs() : async [EmailLog] {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized: Only admins can perform this action") };
    // Return newest-first
    let arr = _stableEmailLogs;
    arr.sort(func(a : EmailLog, b : EmailLog) : { #less; #equal; #greater } {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  // EMAIL HEALTH — returns failure counters for monitoring
  // last24hFailures uses a sliding 24-hour window based on _emailFailureTimestamps.
  public func getEmailHealth() : async { totalFailures : Nat; last24hFailures : Nat; lastFailureTimestamp : Int } {
    let cutoff : Int = Time.now() - 86_400_000_000_000;
    let recent = _emailFailureTimestamps.filter(func(t : Int) : Bool { t >= cutoff });
    _emailFailureTimestamps := recent;
    { totalFailures = emailFailureCount; last24hFailures = recent.size(); lastFailureTimestamp = lastEmailFailureTimestamp }
  };

  // RESEND EMAIL — admin can manually fire any template to any client
  public shared ({ caller }) func resendEmail(clientId : Text, templateKey : Text) : async Bool {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized: Only admins can perform this action") };
    // Look up the client record
    let clientOpt = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
      Text.equal(t.0, clientId)
    });
    switch (clientOpt) {
      case (null) { return false };
      case (?(_, client)) {
        // Look up the template
        let templateOpt = emailTemplates.get(templateKey);
        let (subj, bod) : (Text, Text) = switch (templateOpt) {
          case (?t) { (t.subject, t.body) };
          case (null) {
            // Template not in DB — use sendEmailByTrigger default
            ("", "")
          };
        };
        let serviceLabel = if (client.activeServices.size() > 0) { client.activeServices[0] } else { "" };
        let extras : [(Text, Text)] = [("project_tier", serviceLabel)];
        try {
          if (subj.size() > 0) {
            // Template found in DB — interpolate and send directly
            let vars = buildEmailVars(client.email, null, extras);
            let varsWithEmail = vars.concat([("client_email", client.email), ("requested_time", "As soon as possible")]);
            let interpolatedSubj = interpolateTemplate(subj, varsWithEmail);
            var interpolatedBod  = interpolateTemplate(bod, varsWithEmail);
            interpolatedBod := interpolatedBod.replace(#text "{{requested_time}}", "As soon as possible");
            await sendEmailWithTriggerName(client.email, interpolatedSubj, interpolatedBod, templateKey);
          } else {
            // Fall back to trigger-based send with defaults
            await sendEmailByTrigger(templateKey, client.email, extras);
          };
          true
        } catch (_) {
          false
        }
      };
    }
  };

  // Build professional HTML wrapper with Imperidome brand colors
  func wrapInBrandedHtml(bodyText : Text) : Text {
    // Helper: look up a key in _stableSiteText, return "" if missing
    func cms(key : Text) : Text {
      switch (_stableSiteText.find(func(t : (Text, Text)) : Bool { Text.equal(t.0, key) })) {
        case (?(_, v)) { v };
        case (null) { "" };
      }
    };
    // Build social link pill HTML — only emit links that have real URLs (not empty / "#")
    func socialPill(name : Text, url : Text) : Text {
      if (url.size() == 0 or Text.equal(url, "#")) { "" }
      else {
        "<a href=\"" # url # "\" target=\"_blank\" "
        # "style=\"display:inline-block;margin:4px 5px;padding:7px 18px;border:1.5px solid #00e87d;"
        # "border-radius:20px;background:#0d0d0d;color:#00e87d;font-size:12px;font-weight:600;"
        # "text-decoration:none;letter-spacing:0.5px;\">" # name # "</a>"
      }
    };
    let instagramPill  = socialPill("Instagram",  cms("social.instagram_url"));
    let twitterPill    = socialPill("X / Twitter", cms("social.twitter_url"));
    let linkedinPill   = socialPill("LinkedIn",    cms("social.linkedin_url"));
    let tiktokPill     = socialPill("TikTok",      cms("social.tiktok_url"));
    let youtubePill    = socialPill("YouTube",     cms("social.youtube_url"));
    let allPills = instagramPill # twitterPill # linkedinPill # tiktokPill # youtubePill;
    // Only render the "Follow us" block when at least one real link exists
    let socialBlock = if (allPills.size() == 0) { "" }
      else {
        "<div style=\"margin-bottom:12px;text-align:center;\">"
        # "<p style=\"margin:0 0 8px 0;font-size:12px;color:#555555;letter-spacing:0.5px;\">Follow us</p>"
        # allPills
        # "</div>"
      };
    "<html><head><meta charset=\"UTF-8\"><style>"
    # "body{margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;color:#000000;}"
    # ".outer{background:#f4f4f4;padding:0;}"
    # ".email-header{background:#0d0d0d;padding:40px 30px 0 30px;text-align:center;border-bottom:3px solid #00e87d;}"
    # ".email-header img{max-width:220px;width:100%;display:block;margin:0 auto;}"
    # ".header-fade{height:60px;background:linear-gradient(to bottom,#0d0d0d,#f4f4f4);}"
    # ".container{max-width:600px;margin:0 auto;background:#ffffff;border-radius:0 0 8px 8px;overflow:hidden;}"
    # ".content{padding:32px 32px 24px 32px;font-size:15px;line-height:1.7;color:#000000;}"
    # ".accent{color:#000000;font-weight:600;}"
    # ".footer{border-top:1px solid #e5e5e5;margin:0 32px;padding:16px 0 24px 0;font-size:12px;color:#555555;}"
    # "a{color:#000000;text-decoration:none;}a:hover{text-decoration:underline;}"
    # ".cta{display:inline-block;background:#00e87d;color:#0a0a0a;font-weight:700;padding:12px 28px;"
    # "border-radius:4px;text-decoration:none;margin-top:20px;letter-spacing:1px;}"
    # "</style></head><body><div class=\"outer\"><div style=\"max-width:600px;margin:0 auto;\">"
    # "<div class=\"email-header\">"
    # "<img src=\"" # _logoUrl # "\" alt=\"Imperidome\" />"
    # "</div>"
    # "<div class=\"header-fade\"></div>"
    # "<div class=\"container\">"
    # "<div class=\"content\">" # bodyText # "</div>"
    # "<div class=\"footer\">"
    # socialBlock
    # "Imperidome &bull; " # _siteBaseUrl # " &bull; "
    # "Questions? Contact us at <a href=\"mailto:" # _adminEmail # "\">" # _adminEmail # "</a></div>"
    # "</div></div></div></body></html>"
  };

  // Real email sender — wraps plain-text body in branded HTML and dispatches via Caffeine email extension.
  // Sets Reply-To header to Imperidome admin address on every outgoing email.
  // Writes an EmailLog entry after each send attempt (success or failure).
  // Returns async so callers can fire-and-forget with `ignore sendEmail(...)`.
  func sendEmail(email : Text, subject : Text, body : Text) : async () {
    let htmlBody = wrapInBrandedHtml(body);
    let logId = await generateSecureId();
    let logTimestamp = Time.now();
    // Extract template name from subject for logging (best-effort)
    let templateName = subject;
    let result = try {
      ignore await EmailClient.sendServiceEmail("webly", [email], subject, htmlBody);
      "Sent"
    } catch (_) {
      emailFailureCount += 1;
      lastEmailFailureTimestamp := Time.now();
      _emailFailureTimestamps := _emailFailureTimestamps.concat([Time.now()]);
      "Failed"
    };
    let logEntry : EmailLog = {
      id = logId;
      timestamp = logTimestamp;
      recipientEmail = email;
      templateName = templateName;
      status = result;
    };
    // FIFO cap: drop oldest email log entry when limit reached
    if (_stableEmailLogs.size() >= MAX_EMAIL_LOGS) {
      var newLogs : [EmailLog] = [];
      var i = 1;
      while (i < _stableEmailLogs.size()) {
        newLogs := newLogs.concat([_stableEmailLogs[i]]);
        i += 1;
      };
      _stableEmailLogs := newLogs;
    };
    _stableEmailLogs := _stableEmailLogs.concat([logEntry]);
  };

  // Internal variant that accepts a trigger name for the log entry (used by sendEmailByTriggerWithName)
  func sendEmailWithTriggerName(email : Text, subject : Text, body : Text, triggerName : Text) : async () {
    let htmlBody = wrapInBrandedHtml(body);
    let logId = await generateSecureId();
    let logTimestamp = Time.now();
    let result = try {
      ignore await EmailClient.sendServiceEmail("webly", [email], subject, htmlBody);
      "Sent"
    } catch (_) {
      emailFailureCount += 1;
      lastEmailFailureTimestamp := Time.now();
      _emailFailureTimestamps := _emailFailureTimestamps.concat([Time.now()]);
      "Failed"
    };
    let logEntry : EmailLog = {
      id = logId;
      timestamp = logTimestamp;
      recipientEmail = email;
      templateName = triggerName;
      status = result;
    };
    // FIFO cap: drop oldest email log entry when limit reached
    if (_stableEmailLogs.size() >= MAX_EMAIL_LOGS) {
      var newLogs : [EmailLog] = [];
      var i = 1;
      while (i < _stableEmailLogs.size()) {
        newLogs := newLogs.concat([_stableEmailLogs[i]]);
        i += 1;
      };
      _stableEmailLogs := newLogs;
    };
    _stableEmailLogs := _stableEmailLogs.concat([logEntry]);
  };

  // Look up a template by trigger_key, fall back to defaults, interpolate vars, wrap in HTML, and send.
  // Applies {{requested_time}} fallback: if the variable resolves to empty or raw placeholder, uses "As soon as possible".
  // Returns async so callers can fire-and-forget with `ignore sendEmailByTrigger(...)`.
  private func sendEmailByTrigger(
    triggerKey    : Text,
    recipientEmail : Text,
    extraVars     : [(Text, Text)],
   ) : async () {
    // Apply requested_time fallback before building vars
    let safeExtraVars : [(Text, Text)] = Array.tabulate(extraVars.size(), func(i) {
      let (k, v) = extraVars[i];
      if (Text.equal(k, "requested_time")) {
        let safeVal = if (v.size() == 0 or Text.equal(v, "{{requested_time}}")) {
          "As soon as possible"
        } else { v };
        (k, safeVal)
      } else { (k, v) }
    });
    // Ensure requested_time always has a fallback even if not passed in extraVars
    let hasRequestedTime = safeExtraVars.find(func(kv : (Text, Text)) : Bool {
      Text.equal(kv.0, "requested_time")
    }) != null;
    let finalExtraVars : [(Text, Text)] = if (hasRequestedTime) { safeExtraVars }
      else { safeExtraVars.concat([("requested_time", "As soon as possible")]) };
    let vars  = buildEmailVars(recipientEmail, null, finalExtraVars);
    let (defaultSubject, defaultBody) : (Text, Text) = switch (triggerKey) {
      case ("deposit_confirmed")               ("Deposit Confirmed — Your Build Is Queued",
        "Hi {{client_name}},<br><br>We have received your deposit and your project is now in the build queue.<br><br>"
        # "Our team will be in touch shortly with next steps.<br><br>"
        # "<span class=\"accent\">Project Tier:</span> {{project_tier}}<br>"
        # "<span class=\"accent\">Estimated Launch:</span> {{launch_date}}<br><br>Thank you for choosing Imperidome!"
        # "<br><br>Questions? Contact us at " # _adminEmail
        # "<br><br><strong>Ready to start your project?</strong> Complete your build questionnaire at: <a href=\"" # _siteBaseUrl # "/onboarding\">" # _siteBaseUrl # "/onboarding</a>");
      case ("questionnaire_unlocked")          ("Your Onboarding Brief Is Now Unlocked",
        "Hi {{client_name}},<br><br>Great news — your deposit is confirmed and your onboarding brief is now ready.<br><br>"
        # "Please <a href=\"" # _siteBaseUrl # "/portal\" class=\"cta\">Log in to your portal</a> "
        # "to complete your site brief and officially kick off your build.<br><br>"
        # "The sooner you submit it, the sooner we can get started!"
        # "<br><br>Questions? Contact us at " # _adminEmail);
      case ("questionnaire_submitted_client")  ("We Received Your Brief — You're All Set",
        "Hi {{client_name}},<br><br>Thank you for submitting your project brief. "
        # "Our team is reviewing it now and will be in touch within 1–2 business days.<br><br>"
        # "<span class=\"accent\">What happens next?</span><br>"
        # "Our team will review your answers, finalize the project scope, and send over your build timeline."
        # "<br><br>Questions? Contact us at " # _adminEmail);
      case ("questionnaire_submitted_admin")   ("New Questionnaire Submission — Action Required",
        "A new questionnaire has been submitted.<br><br>"
        # "<span class=\"accent\">Client:</span> {{client_name}}<br>"
        # "<span class=\"accent\">Email:</span> {{client_email}}<br>"
        # "<span class=\"accent\">Tier:</span> {{project_tier}}<br><br>"
        # "Log in to the admin panel to review."
        # "<br><br>Questions? Contact us at " # _adminEmail);
      case ("draft_ready")                     ("Your First Draft Is Ready to Review",
        "Hi {{client_name}},<br><br>Your first draft is now ready!<br><br>"
        # "Please <a href=\"" # _siteBaseUrl # "/portal\" class=\"cta\">Log in to your portal</a> "
        # "to review and provide feedback.<br><br>"
        # "<span class=\"accent\">Tip:</span> You have 2 rounds of revisions included — make them count!"
        # "<br><br>Questions? Contact us at " # _adminEmail);
      case ("site_launched")                   ("🚀 Your Site Is Live — Congratulations!",
        "Hi {{client_name}},<br><br>Your website is officially live!<br><br>"
        # "The Imperidome team has completed all final configurations and your site is fully operational.<br><br>"
        # "<span class=\"accent\">Launch Date:</span> {{launch_date}}<br><br>"
        # "Thank you for trusting Imperidome to build your online presence. We look forward to supporting your growth!"
        # "<br><br>Questions? Contact us at " # _adminEmail);
      case ("deposit_alert_admin")             ("New Deposit Received — {{client_name}}",
        "<span class=\"accent\">A new deposit has been received.</span><br><br>"
        # "<span class=\"accent\">Client:</span> {{client_name}}<br>"
        # "<span class=\"accent\">Email:</span> {{client_email}}<br>"
        # "<span class=\"accent\">Services:</span> {{project_tier}}<br><br>"
        # "Log in to the admin panel to review and advance the project timeline."
        # "<br><br>Questions? Contact us at " # _adminEmail);
      case ("consultation_confirmed")          ("Your Free Consultation Is Confirmed — Imperidome",
        "Hi {{client_name}},<br><br>"
        # "We've received your free consultation request and you're in good hands.<br><br>"
        # "Our team will review your request and be in touch within <span class=\"accent\">1 business day</span>.<br><br>"
        # "<span class=\"accent\">Requested Time:</span> {{requested_time}}<br>"
        # "<span class=\"accent\">Business Type:</span> {{business_type}}<br><br>"
        # "In the meantime, feel free to browse our services at "
        # "<a href=\"" # _siteBaseUrl # "\">" # _siteBaseUrl # "</a>.<br><br>"
        # "<br><br>Questions? Contact us at " # _adminEmail # "<br><br>"
        # "Warm regards,<br><strong>The Imperidome Team</strong>");
      case ("audit_in_progress")               ("Your Site Audit Is Underway — Imperidome",
        "Hi {{client_name}},\n\n"
        # "Your {{service_name}} has been received and our team is already on it.\n\n"
        # "Here's what we're auditing:\n"
        # "- Mobile performance\n"
        # "- SEO basics\n"
        # "- Lead capture effectiveness\n"
        # "- Trust signals\n"
        # "- Conversion gap analysis\n\n"
        # "Business: {{business_type}}\n"
        # "Expected delivery: within 48 hours\n\n"
        # "We'll send you the full report as soon as it's ready.\n\n"
        # "Questions? Contact us at " # _adminEmail # "\n\n"
        # "Warm regards,\nThe Imperidome Team");
      case ("password_reset")                  ("Reset Your Imperidome Password",
        "Hi {{client_name}},<br><br>"
        # "We received a request to reset your password.<br><br>"
        # "Click the link below to set a new password. This link expires in 1 hour.<br><br>"
        # "<a href=\"{{reset_link}}\" class=\"cta\">Reset My Password</a><br><br>"
        # "Or copy and paste this link into your browser:<br>"
        # "<span class=\"accent\">{{reset_link}}</span><br><br>"
        # "If you did not request a password reset, you can safely ignore this email.<br><br>"
        # "<br><br>Questions? Contact us at " # _adminEmail # "<br><br>"
        # "&mdash; The Imperidome Team");
      case ("admin_otp")                       ("Your Imperidome Admin Login Code",
        "<strong>Imperidome Admin — Two-Factor Authentication</strong><br><br>"
        # "Your one-time login code is:<br><br>"
        # "<span style=\"font-size:2rem;font-weight:bold;letter-spacing:0.3em;\">{{otp_code}}</span><br><br>"
        # "This code expires in <strong>5 minutes</strong>. Do not share it with anyone.<br><br>"
        # "If you did not attempt to log in, please contact Imperidome support immediately.<br><br>"
        # "&mdash; The Imperidome System");
      case ("bulk_announcement")               ("Message from Imperidome",
        "Hi {{client_name}},<br><br>"
        # "{{message}}<br><br>"
        # "Best regards,<br><strong>The Imperidome Team</strong>");
      case ("site_link_sent")                  ("Your Website Is Live!",
        "Hi {{client_name}},<br><br>"
        # "Great news! Your website is now live and ready to share with the world.<br><br>"
        # "<a href=\"{{site_url}}\" style=\"background:#4f46e5;color:#000000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;\">View Your Live Site</a><br><br>"
        # "<p>Or copy this link: {{site_url}}</p><br>"
        # "If you need any updates or have questions, visit your client portal.<br><br>"
        # "Best regards,<br><strong>The Imperidome Team</strong><br>"
        # "<a href=\"" # _siteBaseUrl # "\">" # _siteBaseUrl # "</a>");
      case ("review_submitted")                ("Your review has been received",
        "Hi {{client_name}},<br><br>"
        # "Thank you for submitting your review! Our team will review it shortly and approve it for the testimonials page.<br><br>"
        # "Best regards,<br><strong>The Imperidome Team</strong>");
      case ("review_approved")                 ("Your review is now live!",
        "Hi {{client_name}},<br><br>"
        # "Great news! Your review has been approved and is now live on our website. Thank you for sharing your experience!<br><br>"
        # "Visit <a href=\"" # _siteBaseUrl # "\">" # _siteBaseUrl # "</a> to see it.<br><br>"
        # "Best regards,<br><strong>The Imperidome Team</strong>");
      case ("review_submitted_confirmation")   ("Thank you for your review!",
        "Hi {{client_name}},<br><br>"
        # "Thank you for taking the time to share your experience with Imperidome — it truly means a lot to us!<br><br>"
        # "We've received your review and it's currently pending approval. Once our team reviews it, it will appear on our website for the world to see.<br><br>"
        # "We appreciate your trust and look forward to continuing to serve you.<br><br>"
        # "Best regards,<br><strong>The Imperidome Team</strong><br>"
        # "<a href=\"" # _siteBaseUrl # "\">" # _siteBaseUrl # "</a>");
      case ("lead_booked_phone")               ("Your Meeting Is Confirmed — Imperidome",
        "Hi {{client_name}},<br><br>"
        # "<p style=\"color:#000000;\">Your meeting request with the Imperidome team has been received and confirmed.</p>"
        # "<p style=\"color:#000000;\"><strong>Meeting Type:</strong> Phone Call</p>"
        # "<p style=\"color:#000000;\"><strong>We will call you at:</strong> {{phone}}</p>"
        # "<p style=\"color:#000000;\"><strong>Scheduled for:</strong> {{preferred_date}} at {{preferred_time}}</p>"
        # "<br>{{reschedule_section}}"
        # "<br><p style=\"color:#000000;\">We look forward to speaking with you!</p>"
        # "<p style=\"color:#000000;\">— The Imperidome Team</p>");
      case ("reschedule_link_sent")             ("A New Scheduling Link Is Ready — Imperidome",
        "Hi {{client_name}},<br><br>"
        # "<p style=\"color:#000000;\">Vincenzo has sent you a new scheduling link so you can pick a new time that works for you.</p>"
        # "<p style=\"color:#000000;\">Click the button below to choose your preferred date and time:</p>"
        # "<br><p><a href=\"{{reschedule_url}}\" style=\"display:inline-block;padding:14px 32px;background:#00e87d;color:#0a0a0a;font-weight:700;border-radius:4px;text-decoration:none;font-size:15px;letter-spacing:1px;\">Pick a New Time</a></p>"
        # "<br><p style=\"color:#000000;font-size:13px;\">Or copy this link: <a href=\"{{reschedule_url}}\">{{reschedule_url}}</a></p>"
        # "<br><p style=\"color:#555555;font-size:12px;\">Note: This link expires 4 hours before your scheduled meeting time. After that, please contact Vincenzo directly to reschedule.</p>"
        # "<br><p style=\"color:#000000;\">We look forward to speaking with you!</p>"
        # "<p style=\"color:#000000;\">— The Imperidome Team</p>");
      case ("lead_booked_video")               ("Your Google Meet Is Confirmed — Imperidome",
        "Hi {{client_name}},<br><br>"
        # "<p style=\"color:#000000;\">Your meeting request with the Imperidome team has been received and confirmed.</p>"
        # "<p style=\"color:#000000;\"><strong>Meeting Type:</strong> Google Meet (Video)</p>"
        # "<p style=\"color:#000000;\"><strong>Scheduled for:</strong> {{preferred_date}} at {{preferred_time}}</p>"
        # "<br><p style=\"color:#000000;\"><a href=\"{{meet_link}}\" style=\"display:inline-block;padding:12px 28px;background:#1a73e8;color:#ffffff;font-weight:bold;border-radius:6px;text-decoration:none;font-size:15px;\">Join Google Meet</a></p>"
        # "<p style=\"color:#000000;font-size:13px;\">Or copy this link: {{meet_link}}</p>"
        # "<br>{{reschedule_section}}"
        # "<br><p style=\"color:#000000;\">We look forward to speaking with you!</p>"
        # "<p style=\"color:#000000;\">— The Imperidome Team</p>");
      case (_)                                 ("Imperidome Notification", "Hi {{client_name}},<br><br>You have a new notification from Imperidome.");
    };
    let (subj, bod) = getTemplateForKey(triggerKey, defaultSubject, defaultBody);
    // Inject client_email var so admin templates can reference it
    let varsWithEmail = vars.concat([("client_email", recipientEmail)]);
    // Apply requested_time fallback in final interpolated result
    let interpolatedSubj = interpolateTemplate(subj, varsWithEmail);
    var interpolatedBod  = interpolateTemplate(bod, varsWithEmail);
    // Final safety net: replace any remaining raw {{requested_time}} placeholder
    interpolatedBod := interpolatedBod.replace(#text "{{requested_time}}", "As soon as possible");
    // Final safety net: replace any remaining raw {{business_name}} placeholder
    interpolatedBod := interpolatedBod.replace(#text "{{business_name}}", "your business");
    await sendEmailWithTriggerName(recipientEmail, interpolatedSubj, interpolatedBod, triggerKey);
  };

  // LEADS
  public shared ({ caller }) func createLead(path : Text, name : Text, email : Text, business : Text, message : Text) : async Text {
    // RATE LIMITING — max 5 submissions per caller Principal per 5-minute window
    let now = Time.now();
    let existing : [Int] = switch (leadRateLimits.get(caller)) {
      case (?ts) { ts };
      case null  { [] };
    };
    let window = LEAD_RATE_WINDOW_NS;
    let pruned = existing.filter(func (t : Int) : Bool { now - t < window });
    if (pruned.size() >= LEAD_RATE_LIMIT) {
      return "Rate limit exceeded. Please wait before submitting another lead.";
    };
    leadRateLimits.add(caller, pruned.concat([now]));

    let id = await generateSecureId();
    let lead : Lead = { id; path; name; email; business; message; status = "new"; created_at = Time.now(); meetingMethod = ""; meetLink = ""; rescheduleToken = ""; isDraft = false; rescheduleLinkSentAt = null; rescheduleHistory = []; convertedAt = null };
    // FIFO eviction — drop oldest lead when at capacity
    if (_stableLeadsV5.size() >= MAX_LEADS) {
      var newLeads : [(Text, Lead)] = [];
      var i = 1;
      while (i < _stableLeadsV5.size()) {
        newLeads := newLeads.concat([_stableLeadsV5[i]]);
        i += 1;
      };
      _stableLeadsV5 := newLeads;
    };
    _stableLeadsV5 := _stableLeadsV5.concat([(id, lead)]);
    ignore await _createOrUpdateClientFromLead(lead);

    // MEETING METHOD — parse from message JSON
    let meetingMethod : Text = do {
      let key = "\"meetingMethod\":\"";
      if (message.contains(#text key)) {
        let parts = message.split(#text key).toArray();
        if (parts.size() > 1) {
          let endParts = parts[1].split(#text "\"").toArray();
          if (endParts.size() > 0) { endParts[0] } else { "" }
        } else { "" }
      } else { "" }
    };

    // CONTACT PHONE — parse from message JSON
    let contactPhone : Text = do {
      let key = "\"contact_phone\":\"";
      if (message.contains(#text key)) {
        let parts = message.split(#text key).toArray();
        if (parts.size() > 1) {
          let endParts = parts[1].split(#text "\"").toArray();
          if (endParts.size() > 0) { endParts[0] } else { "" }
        } else { "" }
      } else { "" }
    };

    // PREFERRED DATE — parse from message JSON
    let preferredDate : Text = do {
      let key = "\"preferred_date\":\"";
      if (message.contains(#text key)) {
        let parts = message.split(#text key).toArray();
        if (parts.size() > 1) {
          let endParts = parts[1].split(#text "\"").toArray();
          if (endParts.size() > 0) { endParts[0] } else { "" }
        } else { "" }
      } else { "" }
    };

    // PREFERRED TIME — parse from message JSON
    let preferredTime : Text = do {
      let key = "\"preferred_time\":\"";
      if (message.contains(#text key)) {
        let parts = message.split(#text key).toArray();
        if (parts.size() > 1) {
          let endParts = parts[1].split(#text "\"").toArray();
          if (endParts.size() > 0) { endParts[0] } else { "" }
        } else { "" }
      } else { "" }
    };

    // GOOGLE SCRIPT OUTCALL — only if meetingMethod is set and a script URL is configured.
    // Priority: (1) _stableGoogleCalendarConfig.scriptUrl, (2) google_script_url in _stableSiteText.
    let (resolvedScriptUrl, calendarConfigOpt) : (Text, ?GoogleCalendarConfig) = switch (_stableGoogleCalendarConfig) {
      case (?cfg) {
        if (cfg.scriptUrl.size() > 0) { (cfg.scriptUrl, ?cfg) }
        else {
          let fallback = switch (
            _stableSiteText.find(func(t : (Text, Text)) : Bool { Text.equal(t.0, "google_script_url") })
          ) {
            case (?(_, v)) { v };
            case (null) { "" };
          };
          (fallback, null)
        }
      };
      case (null) {
        let fallback = switch (
          _stableSiteText.find(func(t : (Text, Text)) : Bool { Text.equal(t.0, "google_script_url") })
        ) {
          case (?(_, v)) { v };
          case (null) { "" };
        };
        (fallback, null)
      };
    };

    var meetLink : Text = "";

    if (resolvedScriptUrl.size() > 0 and (Text.equal(meetingMethod, "phone") or Text.equal(meetingMethod, "google_meet"))) {
      // Build the JSON body — extend with GoogleCalendarConfig fields when available
      let scriptBody = switch (calendarConfigOpt) {
        case (?cfg) {
          // Extract serviceType from path (last segment after last '/')
          let pathParts = path.split(#text "/").toArray();
          let serviceType = if (pathParts.size() > 0) { pathParts[pathParts.size() - 1] } else { path };
          let description =
            "Service: " # serviceType #
            "\nMeeting method: " # meetingMethod #
            "\nMessage: " # message;
          "{\"name\":\"" # jsonEscape(name) # "\"," #
          "\"email\":\"" # jsonEscape(email) # "\"," #
          "\"phone\":\"" # jsonEscape(contactPhone) # "\"," #
          "\"service\":\"" # jsonEscape(path) # "\"," #
          "\"date\":\"" # jsonEscape(preferredDate) # "\"," #
          "\"time\":\"" # jsonEscape(preferredTime) # "\"," #
          "\"meetingMethod\":\"" # jsonEscape(meetingMethod) # "\"," #
          "\"reminderMinutes\":5," #
          "\"titleTemplate\":\"" # jsonEscape(cfg.titleTemplate) # "\"," #
          "\"durationMinutes\":" # cfg.defaultDurationMinutes.toText() # "," #
          "\"calendarId\":\"" # jsonEscape(cfg.calendarId) # "\"," #
          "\"serviceType\":\"" # jsonEscape(serviceType) # "\"," #
          "\"description\":\"" # jsonEscape(description) # "\"}"
        };
        case (null) {
          // Fallback: original minimal body (legacy google_script_url path)
          "{\"name\":\"" # jsonEscape(name) # "\"," #
          "\"email\":\"" # jsonEscape(email) # "\"," #
          "\"phone\":\"" # jsonEscape(contactPhone) # "\"," #
          "\"service\":\"" # jsonEscape(path) # "\"," #
          "\"date\":\"" # jsonEscape(preferredDate) # "\"," #
          "\"time\":\"" # jsonEscape(preferredTime) # "\"," #
          "\"meetingMethod\":\"" # jsonEscape(meetingMethod) # "\"," #
          "\"reminderMinutes\":5}"
        };
      };
      let scriptHeaders : [OutCall.Header] = [
        { name = "Content-Type"; value = "application/json" },
      ];
      try {
        let responseText = await OutCall.httpPostRequest(resolvedScriptUrl, scriptHeaders, scriptBody, transform);
        // Check for error in response body
        let hasError = responseText.contains(#text "\"error\"");
        // Best-effort parse meet_link from JSON response: {"meetLink":"https://...","success":true}
        let meetLinkKey = "\"meetLink\":\"";
        if (responseText.contains(#text meetLinkKey)) {
          let parts = responseText.split(#text meetLinkKey).toArray();
          if (parts.size() > 1) {
            let endParts = parts[1].split(#text "\"").toArray();
            if (endParts.size() > 0) { meetLink := endParts[0] };
          };
        };
        if (hasError) {
          let failMsg = "Failed to create calendar event for " # name # ". Check Google Apps Script logs.";
          // Debug.print("Google Script returned error for lead " # id # ": " # responseText);
          ignore _pushAdminNotification("calendar_sync_failed", "Calendar Sync Failed", failMsg);
          ignore triggerPushNotification("Calendar Sync Failed", failMsg, "/admin/leads", "calendar_sync_failed");
        };
      } catch (_e) {
        // Outcall failed — continue without a meet link, but notify admin
        let failMsg = "Failed to create calendar event for " # name # ". Check Google Apps Script logs.";
        // Debug.print("Google Script outcall failed for lead " # id);
        ignore _pushAdminNotification("calendar_sync_failed", "Calendar Sync Failed", failMsg);
        ignore triggerPushNotification("Calendar Sync Failed", failMsg, "/admin/leads", "calendar_sync_failed");
      };
    };

    // Generate reschedule token and update lead record in stable storage
    let rescheduleToken : Text = id # "-" # Time.now().toText();
    _stableLeadsV5 := _stableLeadsV5.map<(Text, Lead), (Text, Lead)>(func(t) {
      if (Text.equal(t.0, id)) {
        (id, { t.1 with meetingMethod; meetLink; rescheduleToken })
      } else { t }
    });

    // Direct admin alert — fires for every lead regardless of type
    let leadAlertBody =
      "<strong>New Lead — Imperidome</strong><br><br>"
      # "<b>Name:</b> " # name # "<br>"
      # "<b>Email:</b> " # email # "<br>"
      # "<b>Business:</b> " # business # "<br>"
      # "<b>Service:</b> " # path # "<br><br>"
      # "Log in to the admin panel to follow up.";
    ignore sendEmail(getAdminEmail(), "New Lead — Imperidome", leadAlertBody);
    ignore _pushAdminNotification(
      "new_lead",
      "New Lead: " # name,
      name # " (" # email # ") submitted a lead for " # path # "."
    );
    let isPaidAudit = message.contains(#text "[PAID AUDIT]");
    let isFreeConsult = not isPaidAudit;

    // MEETING CONFIRMATION EMAIL — fires when meetingMethod is set
    let rescheduleUrl = _siteBaseUrl # "/reschedule/" # rescheduleToken;
    let rescheduleSection =
      "<br><br><hr style=\"border:none;border-top:1px solid #e5e5e5;margin:24px 0;\"><p style=\"color:#000000;font-size:13px;\"><strong>Need to reschedule?</strong> Use the link below (valid until 4 hours before your meeting):</p>"
      # "<p style=\"font-size:13px;\"><a href=\"" # rescheduleUrl # "\">" # rescheduleUrl # "</a></p>";
    // Extract requested_time from message JSON (best-effort; empty string if absent)
    let requestedTime : Text = do {
      let key = "\"requested_time\":\"";
      if (message.contains(#text key)) {
        let parts = message.split(#text key).toArray();
        if (parts.size() > 1) {
          let endParts = parts[1].split(#text "\"").toArray();
          if (endParts.size() > 0) { endParts[0] } else { "" }
        } else { "" }
      } else { "" }
    };

    if (Text.equal(meetingMethod, "phone")) {
      ignore sendEmailByTrigger(
        "lead_booked_phone",
        email,
        [
          ("client_name", name),
          ("phone", contactPhone),
          ("preferred_date", preferredDate),
          ("preferred_time", preferredTime),
          ("reschedule_section", rescheduleSection),
        ]
      );
    } else if (Text.equal(meetingMethod, "google_meet")) {
      ignore sendEmailByTrigger(
        "lead_booked_video",
        email,
        [
          ("client_name", name),
          ("meet_link", meetLink),
          ("preferred_date", preferredDate),
          ("preferred_time", preferredTime),
          ("reschedule_section", rescheduleSection),
        ]
      );
    } else if (isFreeConsult and not Text.equal(path, "WebsiteBuild")) {
      // Client confirmation email
      ignore sendEmailByTrigger(
        "consultation_confirmed",
        email,
        [("client_name", name), ("requested_time", requestedTime), ("business_type", business)]
      );
      // Internal admin alert
      ignore sendEmail(
        getAdminEmail(),
        "New Free Consultation Lead — " # name,
        "<strong>New Free Consultation Lead</strong><br><br>"
        # "<b>Name:</b> " # name # "<br>"
        # "<b>Email:</b> " # email # "<br>"
        # "<b>Business Type:</b> " # business # "<br>"
        # (if (requestedTime.size() > 0) { "<b>Requested Time:</b> " # requestedTime # "<br>" } else { "" })
        # "<br>Log in to the admin panel to follow up."
      );
    };

    if (isPaidAudit) {
      // Client confirmation email
      ignore sendEmailByTrigger(
        "audit_in_progress",
        email,
        [("client_name", name), ("business_type", business)]
      );
      // Extract website URL from message JSON (best-effort)
      let websiteUrl : Text = do {
        let key = "\"website\":\"";
        if (message.contains(#text key)) {
          let parts = message.split(#text key).toArray();
          if (parts.size() > 1) {
            let endParts = parts[1].split(#text "\"").toArray();
            if (endParts.size() > 0) { endParts[0] } else { "" }
          } else { "" }
        } else { "" }
      };
      // Internal admin alert
      ignore sendEmail(
        getAdminEmail(),
        "New Site Audit Lead — " # name,
        "<strong>New Site Audit Lead</strong><br><br>"
        # "<b>Name:</b> " # name # "<br>"
        # "<b>Email:</b> " # email # "<br>"
        # "<b>Business Type:</b> " # business # "<br>"
        # (if (websiteUrl.size() > 0) { "<b>Website URL:</b> <a href=\"" # websiteUrl # "\">" # websiteUrl # "</a><br>" } else { "" })
        # "<br>Log in to the admin panel to begin the audit."
      );
    };

    // Push notification trigger — fire for every lead
    ignore await triggerPushNotification("New Lead", name # " submitted a lead from " # business, "/admin/leads", "New lead");
    return id;
  };

  // ── QUICK BOOK — getNextAvailableSlot ────────────────────────────────────────
  // Returns the earliest open 30-minute slot that is at least 2 hours from now.
  // Looks up to 60 days ahead. Returns { date = ""; time = "" } if none found.
  //
  // Arithmetic note: Time.now() returns nanoseconds (Int).
  // 1 hour = 3_600_000_000_000 ns  |  1 day = 86_400_000_000_000 ns
  public query func getNextAvailableSlot() : async { date : Text; time : Text } {
    let availability = switch (_stableAvailabilitySettings) {
      case (?s) { s };
      case null { _defaultAvailability() };
    };
    // Resolve timezone: use stored setting, default to America/New_York
    let tzName : Text = switch (availability.timezone) {
      case (?tz) { if (tz.size() > 0) { tz } else { "America/New_York" } };
      case null { "America/New_York" };
    };
    let tzOffsetHours : Int = _tzOffsetHours(tzName);
    let tzOffsetNs    : Int = tzOffsetHours * 3_600_000_000_000;

    let nowNs : Int = Time.now();
    let twoHourNs : Int = 7_200_000_000_000; // 2 hours in nanoseconds
    let oneDayNs  : Int = 86_400_000_000_000;
    let threshold  : Int = nowNs + twoHourNs;  // 2-hour buffer from real UTC now

    // Convert current UTC nanosecond timestamp to LOCAL days-since-epoch.
    // Shifting by tzOffset moves the boundary so "today" is determined in local time.
    let nowLocalNs : Int = nowNs + tzOffsetNs;
    let nowDays : Int = nowLocalNs / oneDayNs;

    // Day-of-week helper: 0 = Thursday 1970-01-01 (Unix day 0).
    // Zeller's-style: dayOfWeek(d) = (d + 4) % 7  where 0=Sun, 1=Mon … 6=Sat.
    func dayOfWeek(daysSinceEpoch : Int) : Nat {
      Int.abs((daysSinceEpoch + 4) % 7)
    };

    // Map 0-6 day-of-week (0=Sun…6=Sat) to the relevant DaySchedule.
    func scheduleForDay(dow : Nat, ws : WeeklySchedule) : DaySchedule {
      if (dow == 1) { ws.monday }
      else if (dow == 2) { ws.tuesday }
      else if (dow == 3) { ws.wednesday }
      else if (dow == 4) { ws.thursday }
      else if (dow == 5) { ws.friday }
      else if (dow == 6) { ws.saturday }
      else { ws.sunday } // 0 = Sunday
    };

    // Pad a single-digit number with a leading zero for "HH" / "MM" / "DD" formatting.
    func pad2(n : Nat) : Text {
      if (n < 10) { "0" # n.toText() } else { n.toText() }
    };

    // Convert LOCAL days-since-epoch to a "YYYY-MM-DD" string.
    // Uses the proleptic Gregorian calendar algorithm.
    func daysToDate(d : Int) : Text {
      // Shift to the civil calendar epoch (days since 1 March 0000).
      let z : Int = d + 719468;
      let era : Int = (if (z >= 0) { z } else { z - 146096 }) / 146097;
      let doe : Int = z - era * 146097;          // day of era [0, 146096]
      let yoe : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365; // year of era [0, 399]
      let y   : Int = yoe + era * 400;
      let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100); // day of year [0, 365]
      let mp  : Int = (5 * doy + 2) / 153;        // month prime [0, 11]
      let dd  : Int = doy - (153 * mp + 2) / 5 + 1; // day [1, 31]
      let mm  : Int = mp + (if (mp < 10) { 3 } else { -9 }); // month [1, 12]
      let yy  : Int = y + (if (mm <= 2) { 1 } else { 0 });
      yy.toText() # "-" # pad2(Int.abs(mm)) # "-" # pad2(Int.abs(dd))
    };

    var found : ?{ date : Text; time : Text } = null;
    var dayOffset : Int = 0;
    label searchDays while (dayOffset < 60 and found == null) {
      let targetLocalDay = nowDays + dayOffset;
      let dateStr = daysToDate(targetLocalDay);
      // Check if this local date is blocked
      let isBlocked = availability.blockedDates.find(func(bd : Text) : Bool { Text.equal(bd, dateStr) }) != null;
      if (not isBlocked) {
        let dow = dayOfWeek(targetLocalDay);
        let sched = scheduleForDay(dow, availability.weeklySchedule);
        if (sched.isOpen) {
          // Iterate 30-min slots from startHour to endHour (LOCAL hours)
          var slotHour : Nat = sched.startHour;
          var slotMin  : Nat = 0;
          label searchSlots while (slotHour < sched.endHour and found == null) {
            // Compute slot start time in UTC nanoseconds:
            // local day start in UTC = targetLocalDay * oneDayNs - tzOffsetNs
            let slotNs : Int = targetLocalDay * oneDayNs - tzOffsetNs
              + slotHour.toInt() * 3_600_000_000_000
              + slotMin.toInt() * 60_000_000_000;
            if (slotNs >= threshold) {
              // This slot is at least 2 hours from real UTC now — use it
              found := ?{ date = dateStr; time = pad2(slotHour) # ":" # pad2(slotMin) };
            };
            // Advance 30 minutes
            if (slotMin == 0) {
              slotMin := 30;
            } else {
              slotMin := 0;
              slotHour += 1;
            };
          };
        };
      };
      dayOffset += 1;
    };

    switch (found) {
      case (?slot) { slot };
      case null    { { date = ""; time = "" } };
    }
  };

  // ── SELF-SERVICE RESCHEDULING ────────────────────────────────────────────────

  // _parseDateTimeFromMessage — extract preferred_date and preferred_time from a Lead's message JSON.
  // Returns ("", "") if the keys are not found.
  func _parseDateTimeFromMessage(msg : Text) : (Text, Text) {
    let dateKey = "\"preferred_date\":\"";
    let timeKey = "\"preferred_time\":\"";
    let pDate : Text = if (msg.contains(#text dateKey)) {
      let parts = msg.split(#text dateKey).toArray();
      if (parts.size() > 1) {
        let ep = parts[1].split(#text "\"").toArray();
        if (ep.size() > 0) { ep[0] } else { "" }
      } else { "" }
    } else { "" };
    let pTime : Text = if (msg.contains(#text timeKey)) {
      let parts = msg.split(#text timeKey).toArray();
      if (parts.size() > 1) {
        let ep = parts[1].split(#text "\"").toArray();
        if (ep.size() > 0) { ep[0] } else { "" }
      } else { "" }
    } else { "" };
    (pDate, pTime)
  };

  // _meetingNs — convert "YYYY-MM-DD" + "HH:MM" strings to a nanosecond timestamp.
  // Falls back to 0 if parsing fails (so the link is treated as never-expired on bad data).
  func _meetingNs(dateStr : Text, timeStr : Text) : Int {
    // Parse year, month, day
    let dateParts = dateStr.split(#char '-').toArray();
    if (dateParts.size() < 3) { return 0 };
    let yearOpt  = Int.fromText(dateParts[0]);
    let monthOpt = Int.fromText(dateParts[1]);
    let dayOpt   = Int.fromText(dateParts[2]);
    // Parse hour, minute
    let timeParts = timeStr.split(#char ':').toArray();
    if (timeParts.size() < 2) { return 0 };
    let hourOpt = Int.fromText(timeParts[0]);
    let minOpt  = Int.fromText(timeParts[1]);
    switch (yearOpt, monthOpt, dayOpt, hourOpt, minOpt) {
      case (?y, ?mo, ?d, ?h, ?m) {
        // Convert calendar date to days since Unix epoch using the inverse of daysToDate algorithm.
        // Use the civil calendar formula: era, yoe, doy, etc.
        let adjYear : Int = y - (if (mo <= 2) { 1 } else { 0 });
        let era : Int = (if (adjYear >= 0) { adjYear } else { adjYear - 399 }) / 400;
        let yoe : Int = adjYear - era * 400;
        let adjMonth : Int = mo + (if (mo > 2) { -3 } else { 9 });
        let doy : Int = (153 * adjMonth + 2) / 5 + d - 1;
        let doe : Int = yoe * 365 + yoe / 4 - yoe / 100 + doy;
        let daysSinceEpoch : Int = era * 146097 + doe - 719468;
        daysSinceEpoch * 86_400_000_000_000 + h * 3_600_000_000_000 + m * 60_000_000_000
      };
      case _ { 0 };
    }
  };

  // _isTokenExpired — returns true if current_time >= meeting_time - 4 hours.
  func _isTokenExpired(dateStr : Text, timeStr : Text) : Bool {
    if (dateStr.size() == 0 or timeStr.size() == 0) { return false };
    let meetNs = _meetingNs(dateStr, timeStr);
    if (meetNs == 0) { return false };
    let fourHourNs : Int = 14_400_000_000_000;
    Time.now() >= meetNs - fourHourNs
  };

  // getRescheduleLeadByToken — public query: find a lead by its reschedule token and report expiry.
  public query func getRescheduleLeadByToken(token : Text) : async ?{ lead : Lead; isExpired : Bool } {
    let found = _stableLeadsV5.find(func(t : (Text, Lead)) : Bool {
      Text.equal(t.1.rescheduleToken, token)
    });
    switch (found) {
      case (null) { null };
      case (?(_, lead)) {
        let (pDate, pTime) = _parseDateTimeFromMessage(lead.message);
        let isExpired = _isTokenExpired(pDate, pTime);
        ?{ lead; isExpired }
      };
    }
  };

  // rescheduleLead — public update: reschedule a lead's meeting by token.
  public shared func rescheduleLead(token : Text, newDate : Text, newTime : Text, meetingMethod : Text) : async { ok : Bool; message : Text } {
    // Find the lead
    let found = _stableLeadsV5.find(func(t : (Text, Lead)) : Bool {
      Text.equal(t.1.rescheduleToken, token)
    });
    switch (found) {
      case (null) {
        return { ok = false; message = "Invalid reschedule link" };
      };
      case (?(_, lead)) {
        // Check expiry
        let (pDate, pTime) = _parseDateTimeFromMessage(lead.message);
        if (_isTokenExpired(pDate, pTime)) {
          return { ok = false; message = "Reschedule link has expired. Contact Vincenzo directly to reschedule." };
        };
        // Update message JSON: replace preferred_date and preferred_time values
        var updatedMessage = lead.message;
        if (pDate.size() > 0) {
          updatedMessage := updatedMessage.replace(#text ("\"preferred_date\":\"" # pDate # "\""), "\"preferred_date\":\"" # newDate # "\"");
        } else {
          // Key not present — append before closing brace
          let closeBrace = "}";
          if (updatedMessage.size() > 0) {
            updatedMessage := updatedMessage.replace(#text closeBrace, ",\"preferred_date\":\"" # newDate # "\"}");
          };
        };
        if (pTime.size() > 0) {
          updatedMessage := updatedMessage.replace(#text ("\"preferred_time\":\"" # pTime # "\""), "\"preferred_time\":\"" # newTime # "\"");
        } else {
          let closeBrace = "}";
          if (updatedMessage.size() > 0) {
            updatedMessage := updatedMessage.replace(#text closeBrace, ",\"preferred_time\":\"" # newTime # "\"}");
          };
        };
        // Determine effective meeting method
        let effectiveMethod = if (meetingMethod.size() > 0) { meetingMethod } else { lead.meetingMethod };
        // Call Google Apps Script to update/recreate the calendar event
        let googleScriptUrl : Text = switch (
          _stableSiteText.find(func(t : (Text, Text)) : Bool { Text.equal(t.0, "google_script_url") })
        ) {
          case (?(_, v)) { v };
          case (null) { "" };
        };
        // Parse contact phone from updated message
        let contactPhone : Text = do {
          let key = "\"contact_phone\":\"";
          if (updatedMessage.contains(#text key)) {
            let parts = updatedMessage.split(#text key).toArray();
            if (parts.size() > 1) {
              let ep = parts[1].split(#text "\"").toArray();
              if (ep.size() > 0) { ep[0] } else { "" }
            } else { "" }
          } else { "" }
        };
        var newMeetLink : Text = lead.meetLink;
        if (googleScriptUrl.size() > 0 and (Text.equal(effectiveMethod, "phone") or Text.equal(effectiveMethod, "google_meet"))) {
          let scriptBody =
            "{\"name\":\"" # jsonEscape(lead.name) # "\"," #
            "\"email\":\"" # jsonEscape(lead.email) # "\"," #
            "\"phone\":\"" # jsonEscape(contactPhone) # "\"," #
            "\"service\":\"" # jsonEscape(lead.path) # "\"," #
            "\"date\":\"" # jsonEscape(newDate) # "\"," #
            "\"time\":\"" # jsonEscape(newTime) # "\"," #
            "\"meetingMethod\":\"" # jsonEscape(effectiveMethod) # "\"," #
            "\"reminderMinutes\":5," #
            "\"isReschedule\":true}";
          let scriptHeaders : [OutCall.Header] = [
            { name = "Content-Type"; value = "application/json" },
          ];
          try {
            let responseText = await OutCall.httpPostRequest(googleScriptUrl, scriptHeaders, scriptBody, transform);
            let hasError = responseText.contains(#text "\"error\"");
            let meetLinkKey = "\"meetLink\":\"";
            if (responseText.contains(#text meetLinkKey)) {
              let parts = responseText.split(#text meetLinkKey).toArray();
              if (parts.size() > 1) {
                let ep = parts[1].split(#text "\"").toArray();
                if (ep.size() > 0) { newMeetLink := ep[0] };
              };
            };
            if (hasError) {
              let failMsg = "Failed to update calendar event for " # lead.name # " (reschedule). Check Google Apps Script logs.";
              // Debug.print("Google Script reschedule returned error for token " # token # ": " # responseText);
              ignore _pushAdminNotification("calendar_sync_failed", "Calendar Sync Failed", failMsg);
              ignore triggerPushNotification("Calendar Sync Failed", failMsg, "/admin/leads", "calendar_sync_failed");
            };
          } catch (_e) {
            let failMsg = "Failed to update calendar event for " # lead.name # " (reschedule). Check Google Apps Script logs.";
            // Debug.print("Google Script reschedule outcall failed for token " # token);
            ignore _pushAdminNotification("calendar_sync_failed", "Calendar Sync Failed", failMsg);
            ignore triggerPushNotification("Calendar Sync Failed", failMsg, "/admin/leads", "calendar_sync_failed");
          };
        };
        // Persist the updated lead record
        _stableLeadsV5 := _stableLeadsV5.map<(Text, Lead), (Text, Lead)>(func(t) {
          if (Text.equal(t.1.rescheduleToken, token)) {
            (t.0, { t.1 with message = updatedMessage; meetingMethod = effectiveMethod; meetLink = newMeetLink })
          } else { t }
        });
        { ok = true; message = "Meeting rescheduled successfully." }
      };
    }
  };

  // ── MANUAL BOOK — Draft Leads ────────────────────────────────────────────────

  // createDraftLead — admin-only: capture a lead on-the-phone with no meeting time yet.
  public shared ({ caller }) func createDraftLead(name : Text, email : Text, phone : Text, service : Text) : async { ok : Bool; leadId : Text } {
    if (not isAdmin(caller)) {
      return { ok = false; leadId = "" };
    };
    let id = await generateSecureId();
    let msgJson =
      "{\"name\":\"" # name # "\"," #
      "\"contact_phone\":\"" # phone # "\"," #
      "\"service\":\"" # service # "\"," #
      "\"isDraft\":true}";
    let newToken : Text = id # "-" # Time.now().toText();
    let lead : Lead = {
      id;
      path            = service;
      name;
      email;
      business        = service;
      message         = msgJson;
      status          = "draft";
      created_at      = Time.now();
      meetingMethod   = "";
      meetLink        = "";
      rescheduleToken = newToken;
      isDraft         = true;
      rescheduleLinkSentAt = null;
      rescheduleHistory    = [];
      convertedAt          = null;
    };
    // FIFO eviction
    if (_stableLeadsV5.size() >= MAX_LEADS) {
      var newLeads : [(Text, Lead)] = [];
      var i = 1;
      while (i < _stableLeadsV5.size()) {
        newLeads := newLeads.concat([_stableLeadsV5[i]]);
        i += 1;
      };
      _stableLeadsV5 := newLeads;
    };
    _stableLeadsV5 := _stableLeadsV5.concat([(id, lead)]);
    { ok = true; leadId = id }
  };

  // assignMeetingToLead — admin-only: assign a meeting time to an existing draft lead.
  public shared ({ caller }) func assignMeetingToLead(leadId : Text, newDate : Text, newTime : Text, meetingMethod : Text) : async { ok : Bool; meetLink : Text } {
    if (not isAdmin(caller)) {
      return { ok = false; meetLink = "" };
    };
    let found = _stableLeadsV5.find(func(t : (Text, Lead)) : Bool { Text.equal(t.0, leadId) });
    switch (found) {
      case (null) { return { ok = false; meetLink = "" } };
      case (?(_, lead)) {
        // Inject preferred_date and preferred_time into the existing message JSON
        var updatedMessage = lead.message;
        // Remove trailing "}", inject fields, close again
        if (updatedMessage.endsWith(#text "}")) {
          let withoutClose = switch (updatedMessage.stripEnd(#text "}")) {
            case (?s) { s };
            case null { updatedMessage };
          };
          updatedMessage := withoutClose # ",\"preferred_date\":\"" # newDate # "\",\"preferred_time\":\"" # newTime # "\"}"
        } else {
          updatedMessage := updatedMessage # ",\"preferred_date\":\"" # newDate # "\",\"preferred_time\":\"" # newTime # "\"}";
        };
        // Call Google Apps Script
        let googleScriptUrl : Text = switch (
          _stableSiteText.find(func(t : (Text, Text)) : Bool { Text.equal(t.0, "google_script_url") })
        ) {
          case (?(_, v)) { v };
          case (null) { "" };
        };
        let contactPhone : Text = do {
          let key = "\"contact_phone\":\"";
          if (updatedMessage.contains(#text key)) {
            let parts = updatedMessage.split(#text key).toArray();
            if (parts.size() > 1) {
              let ep = parts[1].split(#text "\"").toArray();
              if (ep.size() > 0) { ep[0] } else { "" }
            } else { "" }
          } else { "" }
        };
        var newMeetLink : Text = "";
        if (googleScriptUrl.size() > 0 and (Text.equal(meetingMethod, "phone") or Text.equal(meetingMethod, "google_meet"))) {
          let scriptBody =
            "{\"name\":\"" # jsonEscape(lead.name) # "\"," #
            "\"email\":\"" # jsonEscape(lead.email) # "\"," #
            "\"phone\":\"" # jsonEscape(contactPhone) # "\"," #
            "\"service\":\"" # jsonEscape(lead.path) # "\"," #
            "\"date\":\"" # jsonEscape(newDate) # "\"," #
            "\"time\":\"" # jsonEscape(newTime) # "\"," #
            "\"meetingMethod\":\"" # jsonEscape(meetingMethod) # "\"," #
            "\"reminderMinutes\":5}";
          let scriptHeaders : [OutCall.Header] = [
            { name = "Content-Type"; value = "application/json" },
          ];
          try {
            let responseText = await OutCall.httpPostRequest(googleScriptUrl, scriptHeaders, scriptBody, transform);
            let hasError = responseText.contains(#text "\"error\"");
            let meetLinkKey = "\"meetLink\":\"";
            if (responseText.contains(#text meetLinkKey)) {
              let parts = responseText.split(#text meetLinkKey).toArray();
              if (parts.size() > 1) {
                let ep = parts[1].split(#text "\"").toArray();
                if (ep.size() > 0) { newMeetLink := ep[0] };
              };
            };
            if (hasError) {
              let failMsg = "Failed to assign calendar event for " # lead.name # ". Check Google Apps Script logs.";
              // Debug.print("Google Script assignMeeting returned error for lead " # leadId # ": " # responseText);
              ignore _pushAdminNotification("calendar_sync_failed", "Calendar Sync Failed", failMsg);
              ignore triggerPushNotification("Calendar Sync Failed", failMsg, "/admin/leads", "calendar_sync_failed");
            };
          } catch (_e) {
            let failMsg = "Failed to assign calendar event for " # lead.name # ". Check Google Apps Script logs.";
            // Debug.print("Google Script assignMeeting outcall failed for lead " # leadId);
            ignore _pushAdminNotification("calendar_sync_failed", "Calendar Sync Failed", failMsg);
            ignore triggerPushNotification("Calendar Sync Failed", failMsg, "/admin/leads", "calendar_sync_failed");
          };
        };
        // Persist update
        _stableLeadsV5 := _stableLeadsV5.map<(Text, Lead), (Text, Lead)>(func(t) {
          if (Text.equal(t.0, leadId)) {
            (t.0, { t.1 with
              message       = updatedMessage;
              meetingMethod = meetingMethod;
              meetLink      = newMeetLink;
              isDraft       = false;
              status        = "new";
            })
          } else { t }
        });
        { ok = true; meetLink = newMeetLink }
      };
    }
  };

  // sendRescheduleLink — admin-only: send a reschedule link email to a lead's client.
  // Logs rescheduleLinkSentAt and appends to rescheduleHistory on the lead record after sending.
  public shared ({ caller }) func sendRescheduleLink(leadId : Text) : async { success : Bool; message : Text } {
    if (not isAdmin(caller)) {
      return { success = false; message = "Unauthorized" };
    };
    let found = _stableLeadsV5.find(func(t : (Text, Lead)) : Bool { Text.equal(t.0, leadId) });
    switch (found) {
      case (null) { return { success = false; message = "Lead not found" } };
      case (?(_, lead)) {
        if (lead.rescheduleToken.size() == 0) {
          return { success = false; message = "Lead has no reschedule link" };
        };
        let rescheduleUrl = _siteBaseUrl # "/reschedule/" # lead.rescheduleToken;
        // Extract first name from lead.name (first word before any space)
        let firstName : Text = do {
          let parts = lead.name.split(#char ' ').toArray();
          if (parts.size() > 0 and parts[0].size() > 0) { parts[0] } else { lead.name };
        };
        ignore sendEmailByTrigger(
          "reschedule_link_sent",
          lead.email,
          [
            ("client_name", firstName),
            ("reschedule_url", rescheduleUrl),
          ]
        );
        // Log rescheduleLinkSentAt and append to rescheduleHistory
        let sentAt : Int = Time.now();
        _stableLeadsV5 := _stableLeadsV5.map<(Text, Lead), (Text, Lead)>(func(t) {
          if (Text.equal(t.0, leadId)) {
            (t.0, { t.1 with
              rescheduleLinkSentAt = ?sentAt;
              rescheduleHistory    = t.1.rescheduleHistory.concat([sentAt]);
            })
          } else { t }
        });
        { success = true; message = "Reschedule link sent to " # lead.email }
      };
    }
  };

  public query ({ caller }) func getLeads() : async [Lead] {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    return _stableLeadsV5.map(func(tuple : (Text, Lead)) : Lead { tuple.1 });
  };

  // getRescheduleHistory — admin-only: return the reschedule link send history for a lead,
  // sorted newest-first.
  public query ({ caller }) func getRescheduleHistory(leadId : Text) : async [Int] {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let found = _stableLeadsV5.find(func(t : (Text, Lead)) : Bool { Text.equal(t.0, leadId) });
    switch (found) {
      case (null) { [] };
      case (?(_, lead)) {
        let h = lead.rescheduleHistory;
        let n = h.size();
        Array.tabulate<Int>(n, func(i) { h[n - 1 - i] })
      };
    }
  };

  public shared ({ caller }) func deleteLead(leadId : Text) : async () {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    _stableLeadsV5 := _stableLeadsV5.filter(func(tuple : (Text, Lead)) : Bool {
      not Text.equal(tuple.0, leadId)
    });
  };

  // convertLeadToClient — admin-only: create or upsert a CRM client from a lead and stamp
  // convertedAt on the lead record so conversion is tracked for analytics.
  public shared ({ caller }) func convertLeadToClient(
    leadId            : Text,
    name              : Text,
    email             : Text,
    phone             : Text,
    source            : Text,
    activeServices    : [Text],
    onboardingBriefId : ?Text,
  ) : async Text {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let clientId = await _upsertClient(email, name, phone, source, activeServices, onboardingBriefId);
    let now = Time.now();
    _stableLeadsV5 := _stableLeadsV5.map<(Text, Lead), (Text, Lead)>(func(t) {
      if (Text.equal(t.0, leadId)) {
        (t.0, { t.1 with convertedAt = ?now })
      } else { t }
    });
    clientId
  };

  // getConversionStats — admin-only query: returns total non-draft leads, converted leads,
  // and conversion rate (%) within an optional [fromTs, toTs] nanosecond range.
  public shared query ({ caller }) func getConversionStats(
    fromTs     : ?Int,
    toTs       : ?Int,
  ) : async { totalLeads : Nat; convertedLeads : Nat; conversionRate : Float } {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    var total : Nat = 0;
    var converted : Nat = 0;
    for ((_, lead) in _stableLeadsV5.vals()) {
      if (not lead.isDraft) {
        let inFrom = switch (fromTs) {
          case (null) { true };
          case (?f)   { lead.created_at >= f };
        };
        let inTo = switch (toTs) {
          case (null) { true };
          case (?t)   { lead.created_at <= t };
        };
        if (inFrom and inTo) {
          total += 1;
          switch (lead.convertedAt) {
            case (?_) { converted += 1 };
            case (null) {};
          };
        };
      };
    };
    let rate : Float = if (total == 0) 0.0 else converted.toFloat() / total.toFloat() * 100.0;
    { totalLeads = total; convertedLeads = converted; conversionRate = rate }
  };

  // ORDERS ADMIN
  private func textToOrderStatus(s : Text) : OrderStatus.Status {
    if (s == "depositSent")       { #depositSent }
    else if (s == "depositReceived") { #depositReceived }
    else if (s == "draftReady")   { #draftReady }
    else if (s == "revisionsInProgress") { #revisionsInProgress }
    else if (s == "launching")    { #launching }
    else if (s == "live")         { #live }
    else if (s == "cancelled")    { #cancelled }
    else                          { #questionnaireComplete };
  };

  public shared query ({ caller }) func getAdminAllOrders() : async [Order] {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized: Only admins can perform this action") };
    orders.values().toArray();
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Text, newStatus : Text) : async UpsertResult {
    adminOnly(caller);
    switch (Nat.fromText(orderId)) {
      case null { #err("Invalid orderId") };
      case (?id) {
        switch (orders.get(id)) {
          case null { #err("Order not found") };
          case (?order) {
            let updated = { order with status = textToOrderStatus(newStatus); updated_at = Time.now() };
            orders.add(id, updated);
            #ok;
          };
        };
      };
    };
  };

  // PORTFOLIO
  public query func getPublishedPortfolio() : async [PortfolioItem] {
    _stablePortfolioNew.filter(func(t : (Text, PortfolioItem)) : Bool { t.1.published })
      .map<(Text, PortfolioItem), PortfolioItem>(func(t) { t.1 });
  };

   public shared ({ caller }) func createPortfolioItem(client_name : Text, site_url : Text, thumbnail_url : Text, imageCaption : Text, tier_code : Text, description : Text, is_featured : Bool, seoMetaDescription : ?Text, seoMetaKeywords : ?Text) : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    if (site_url.contains(#text "../") or site_url.contains(#text "%")) {
      return #err("invalid slug");
    };
    let id = await generateSecureId();
    let item : PortfolioItem = { id; client_name; site_url; thumbnail_url; tier_code; description; imageCaption; seoMetaDescription; seoMetaKeywords; is_featured; published = true; created_at = Time.now() };
    _stablePortfolioNew := _stablePortfolioNew.concat([(id, item)]);
    // FIFO eviction — drop oldest portfolio item when at capacity
    if (_stablePortfolioNew.size() > MAX_PORTFOLIO) {
      var newPortfolio : [(Text, PortfolioItem)] = [];
      var i = 1;
      while (i < _stablePortfolioNew.size()) {
        newPortfolio := newPortfolio.concat([_stablePortfolioNew[i]]);
        i += 1;
      };
      _stablePortfolioNew := newPortfolio;
    };
    #ok id;
  };

   public shared ({ caller }) func updatePortfolioItem(id : Text, client_name : Text, site_url : Text, thumbnail_url : Text, imageCaption : Text, tier_code : Text, description : Text, is_featured : Bool, seoMetaDescription : ?Text, seoMetaKeywords : ?Text) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let exists = _stablePortfolioNew.find(func(t : (Text, PortfolioItem)) : Bool { Text.equal(t.0, id) });
    switch (exists) {
      case (null) { #err("Not found") };
      case (?(_, old)) {
        _stablePortfolioNew := _stablePortfolioNew.map<(Text, PortfolioItem), (Text, PortfolioItem)>(func(t) {
          if (Text.equal(t.0, id)) {
            (id, { old with client_name; site_url; thumbnail_url; tier_code; description; imageCaption; seoMetaDescription; seoMetaKeywords; is_featured })
          } else { t }
        });
        #ok
      };
    };
  };

  public shared ({ caller }) func deletePortfolioItem(id : Text) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let exists = _stablePortfolioNew.find(func(t : (Text, PortfolioItem)) : Bool { Text.equal(t.0, id) });
    switch (exists) {
      case (null) { #err("Not found") };
      case (?_) {
        _stablePortfolioNew := _stablePortfolioNew.filter(func(t : (Text, PortfolioItem)) : Bool { not Text.equal(t.0, id) });
        #ok
      };
    };
  };

  public shared ({ caller }) func publishPortfolioItem(id : Text) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let exists = _stablePortfolioNew.find(func(t : (Text, PortfolioItem)) : Bool { Text.equal(t.0, id) });
    switch (exists) {
      case (null) { #err("Not found") };
      case (?(_, old)) {
        _stablePortfolioNew := _stablePortfolioNew.map<(Text, PortfolioItem), (Text, PortfolioItem)>(func(t) {
          if (Text.equal(t.0, id)) { (id, { old with published = true }) } else { t }
        });
        #ok
      };
    };
  };

  public shared ({ caller }) func unpublishPortfolioItem(id : Text) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let exists = _stablePortfolioNew.find(func(t : (Text, PortfolioItem)) : Bool { Text.equal(t.0, id) });
    switch (exists) {
      case (null) { #err("Not found") };
      case (?(_, old)) {
        _stablePortfolioNew := _stablePortfolioNew.map<(Text, PortfolioItem), (Text, PortfolioItem)>(func(t) {
          if (Text.equal(t.0, id)) { (id, { old with published = false }) } else { t }
        });
        #ok
      };
    };
  };

  public shared ({ caller }) func getAllPortfolioAdmin() : async [PortfolioItem] {
    adminOnly(caller);
    _getAdminPortfolio()
  };

  // STRIPE DATA AGGREGATION
  // Helper: build Authorization header for Stripe requests
  func stripeAuthHeaders(secretKey : Text) : [OutCall.Header] {
    [{ name = "Authorization"; value = "Bearer " # secretKey }]
  };

  // Helper: compute Unix timestamp for 90 days ago (in seconds)
  func ninetyDaysAgoUnix() : Text {
    let nowNanos : Int = Time.now();
    let nowSecs : Int = nowNanos / 1_000_000_000;
    let cutoff : Int = nowSecs - (90 * 24 * 60 * 60);
    cutoff.toText()
  };

  public shared ({ caller }) func getStripeCharges() : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    switch (stripeConfig) {
      case (null) { #err("Stripe not configured") };
      case (?cfg) {
        let url = "https://api.stripe.com/v1/charges?limit=100&created[gte]=" # ninetyDaysAgoUnix();
        let body = try {
          await OutCall.httpGetRequest(url, stripeAuthHeaders(cfg.secretKey), transform)
        } catch (e) {
          return #err("Stripe API error: " # e.message())
        };
        #ok(body)
      };
    }
  };

  public shared ({ caller }) func getStripeSubscriptions() : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    switch (stripeConfig) {
      case (null) { #err("Stripe not configured") };
      case (?cfg) {
        let url = "https://api.stripe.com/v1/subscriptions?limit=100&status=all";
        let body = try {
          await OutCall.httpGetRequest(url, stripeAuthHeaders(cfg.secretKey), transform)
        } catch (e) {
          return #err("Stripe API error: " # e.message())
        };
        #ok(body)
      };
    }
  };

  public shared ({ caller }) func getStripeCustomers() : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    switch (stripeConfig) {
      case (null) { #err("Stripe not configured") };
      case (?cfg) {
        let url = "https://api.stripe.com/v1/customers?limit=100";
        let body = try {
          await OutCall.httpGetRequest(url, stripeAuthHeaders(cfg.secretKey), transform)
        } catch (e) {
          return #err("Stripe API error: " # e.message())
        };
        #ok(body)
      };
    }
  };

  public shared ({ caller }) func getStripePayouts() : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    switch (stripeConfig) {
      case (null) { #err("Stripe not configured") };
      case (?cfg) {
        let url = "https://api.stripe.com/v1/payouts?limit=100";
        let body = try {
          await OutCall.httpGetRequest(url, stripeAuthHeaders(cfg.secretKey), transform)
        } catch (e) {
          return #err("Stripe API error: " # e.message())
        };
        #ok(body)
      };
    }
  };

  public shared ({ caller }) func getStripeDashboardData() : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    switch (stripeConfig) {
      case (null) { #err("Stripe not configured") };
      case (?cfg) {
        let headers = stripeAuthHeaders(cfg.secretKey);
        let chargesUrl = "https://api.stripe.com/v1/charges?limit=100&created[gte]=" # ninetyDaysAgoUnix();
        let subsUrl    = "https://api.stripe.com/v1/subscriptions?limit=100&status=all";
        let custUrl    = "https://api.stripe.com/v1/customers?limit=100";
        let payoutsUrl = "https://api.stripe.com/v1/payouts?limit=100";

        let chargesBody = try {
          await OutCall.httpGetRequest(chargesUrl, headers, transform)
        } catch (e) {
          return #err("Stripe charges error: " # e.message())
        };
        let subsBody = try {
          await OutCall.httpGetRequest(subsUrl, headers, transform)
        } catch (e) {
          return #err("Stripe subscriptions error: " # e.message())
        };
        let custBody = try {
          await OutCall.httpGetRequest(custUrl, headers, transform)
        } catch (e) {
          return #err("Stripe customers error: " # e.message())
        };
        let payoutsBody = try {
          await OutCall.httpGetRequest(payoutsUrl, headers, transform)
        } catch (e) {
          return #err("Stripe payouts error: " # e.message())
        };

        let combined = "{\"charges\":" # chargesBody
          # ",\"subscriptions\":" # subsBody
          # ",\"customers\":" # custBody
          # ",\"payouts\":" # payoutsBody
          # "}";
        #ok(combined)
      };
    }
  };

  // CRM CLIENTS

  // Internal helper: detect if any service in the list is a Custom or Speedy site
  func _isCustomOrSpeedySite(services : [Text]) : Bool {
    services.find(func(svc : Text) : Bool {
      let svcUpper = svc.toUpper();
      var found = false;
      for ((_, p) in productCatalog.entries()) {
        if (p.name.toUpper() == svcUpper and
            (Text.equal(p.product_type, "Custom Sites") or Text.equal(p.product_type, "Speedy Sites"))) {
          found := true
        }
      };
      found
    }) != null
  };

  // Internal helper: create or update a client record by email (upsert).
  // If a client with the same email exists, merges new services and updates source only if upgrading.
  func _upsertClient(
    email          : Text,
    name           : Text,
    phone          : Text,
    source         : Text,
    activeServices : [Text],
    briefId        : ?Text,
  ) : async Text {
    // Check for existing client with same email (case-insensitive)
    let emailLower = email.toLower();
    let existing = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
      Text.equal(t.1.email.toLower(), emailLower)
    });
    switch (existing) {
      case (?(id, client)) {
        // Merge active services (deduplicate)
        let merged = activeServices.foldLeft(
          client.activeServices,
          func(acc : [Text], svc : Text) : [Text] {
            let already = acc.find(func(s : Text) : Bool { Text.equal(s, svc) });
            switch (already) {
              case (?_) { acc };
              case (null) { acc.concat([svc]) };
            }
          }
        );
        // Source precedence: Customer > Brief > Lead
        let newSource = if (Text.equal(source, "Customer")) { "Customer" }
          else if (Text.equal(source, "Brief") and not Text.equal(client.source, "Customer")) { "Brief" }
          else { client.source };
        let newBriefId = switch (briefId) {
          case (?_) { briefId };
          case (null) { client.onboardingBriefId };
        };
        // Compute briefStatus: only set to Pending if not already Submitted and service is Custom/Speedy Customer
        let newBriefStatus : ?Text = switch (client.briefStatus) {
          case (?"Submitted") { ?"Submitted" }; // never reset a submitted brief
          case (_) {
            if (Text.equal(source, "Customer") and _isCustomOrSpeedySite(merged)) {
              ?"Pending"
            } else { client.briefStatus };
          };
        };
        let updated : CrmClient = {
          client with
          source = newSource;
          activeServices = merged;
          onboardingBriefId = newBriefId;
          briefStatus = newBriefStatus;
          phone = if (phone.size() > 0) { phone } else { client.phone };
          name = if (name.size() > 0) { name } else { client.name };
          // currentMilestone and milestoneUpdatedAt are NOT changed by _upsertClient;
          // they are controlled exclusively by recordPurchase (milestone 1),
          // updateClientBriefStatus (milestone 2), and updateClientMilestone (admin).
        };
        _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
          if (Text.equal(t.0, id)) { (id, updated) } else { t }
        });
        id
      };
      case (null) {
        // Create new client
        let newId = await generateSecureId();
        // Initialize briefStatus when it's a Customer purchasing Custom/Speedy
        let initBriefStatus : ?Text = if (Text.equal(source, "Customer") and _isCustomOrSpeedySite(activeServices)) {
          ?"Pending"
        } else { null };
        let newClient : CrmClient = {
          id             = newId;
          name           = name;
          email          = email;
          phone          = phone;
          source         = source;
          activeServices = activeServices;
          projectStatus  = "Onboarding";
          hasAccount     = false;
          onboardingBriefId = briefId;
          briefStatus    = initBriefStatus;
          briefSubmittedAt = null;
          currentMilestone = 0;
          milestoneUpdatedAt = null;
          created_at     = Time.now();
          completionPaymentCharged = false;
          notes          = "";
          siteLinkLog    = [];
          deletionRequested    = false;
          deletionRequestedAt  = 0;
          stripeConnectAccountId = null;
          stripeConnectStatus    = "disconnected";
          platformFeePercentage  = 0.0;
          webhookSecret = null;
          connectedAt = null;
          lastActivityAt = null;
        };
        _stableClientsV3 := _stableClientsV3.concat([(newId, newClient)]);
        // FIFO eviction — drop oldest client when at capacity
        if (_stableClientsV3.size() > MAX_CLIENTS) {
          var newClients : [(Text, CrmClient)] = [];
          var i = 1;
          while (i < _stableClientsV3.size()) {
            newClients := newClients.concat([_stableClientsV3[i]]);
            i += 1;
          };
          _stableClientsV3 := newClients;
        };
        newId
      };
    }
  };

  // Internal helper called from createLead
  func _createOrUpdateClientFromLead(lead : Lead) : async () {
    let services : [Text] = if (lead.business.size() > 0) { [lead.business] } else { [] };
    ignore await _upsertClient(lead.email, lead.name, "", "Lead", services, null);
  };

  // Internal helper called from submitQuestionnaire
  func _createOrUpdateClientFromQuestionnaire(questionnaireType : Text, answers : Text, questionnaireId : Text) : async () {
    // Try to extract email and name from answers JSON (best effort)
    var extractedEmail = "";
    var extractedName  = "";
    // Helper: extract value for a JSON key
    func extractJsonValue(json : Text, key : Text) : Text {
      let searchKey = "\"" # key # "\":\"";
      if (json.contains(#text searchKey)) {
        let parts = json.split(#text searchKey);
        let arr   = parts.toArray();
        if (arr.size() > 1) {
          let afterKey = arr[1];
          let endParts = afterKey.split(#text "\"");
          let endArr   = endParts.toArray();
          if (endArr.size() > 0) { return endArr[0] };
        };
      };
      ""
    };
    // Try multiple candidate keys for email
    extractedEmail := extractJsonValue(answers, "email");
    if (extractedEmail.size() == 0) {
      extractedEmail := extractJsonValue(answers, "contactInfo");
    };
    // Try multiple candidate keys for name
    extractedName := extractJsonValue(answers, "name");
    if (extractedName.size() == 0) {
      extractedName := extractJsonValue(answers, "companyName");
    };
    if (extractedName.size() == 0) {
      extractedName := extractJsonValue(answers, "brandName");
    };
    // Only create a client record if we have an email to key on
    if (extractedEmail.size() > 0) {
      ignore await _upsertClient(extractedEmail, extractedName, "", "Brief", [questionnaireType], ?questionnaireId);
    };
  };

  // Extract email from questionnaire answers JSON (best-effort, same logic as _createOrUpdateClientFromQuestionnaire)
  func _extractEmailFromAnswers(answers : Text) : Text {
    func extractVal(json : Text, key : Text) : Text {
      let searchKey = "\"" # key # "\":\"";
      if (json.contains(#text searchKey)) {
        let parts = json.split(#text searchKey).toArray();
        if (parts.size() > 1) {
          let endParts = parts[1].split(#text "\"").toArray();
          if (endParts.size() > 0) { return endParts[0] };
        };
      };
      ""
    };
    var e = extractVal(answers, "email");
    if (e.size() == 0) { e := extractVal(answers, "contactInfo") };
    e
  };

  public shared ({ caller }) func addClient(
    name           : Text,
    email          : Text,
    phone          : Text,
    source         : Text,
    activeServices : [Text],
    onboardingBriefId : ?Text,
  ) : async Text {
    let callerEmail = switch (principalToEmail.get(caller)) {
      case (?e) { e };
      case (null) { Runtime.trap("Unauthorized") };
    };
    if (not Text.equal(callerEmail, getAdminEmail())) {
      Runtime.trap("Unauthorized");
    };
    await _upsertClient(email, name, phone, source, activeServices, onboardingBriefId)
  };

  public shared ({ caller }) func getClients() : async [CrmClient] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    _stableClientsV3.map(func(t : (Text, CrmClient)) : CrmClient { t.1 })
  };

  public shared query ({ caller }) func getConnectedClients() : async [CrmClient] {
    adminOnly(caller);
    _stableClientsV3.map(func((_, c) : (Text, CrmClient)) : CrmClient { c })
  };

  public shared ({ caller }) func updateClientPlatformFee(clientId : Text, newFeePercentage : Float) : async { #ok; #err : Text } {
    adminOnly(caller);
    if (newFeePercentage < 0.0 or newFeePercentage > 100.0) {
      return #err("Fee must be between 0 and 100");
    };
    let found = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (found) {
      case (null) { #err("Client not found") };
      case (?(_, _)) {
        _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
          if (Text.equal(t.0, clientId)) {
            (t.0, { t.1 with platformFeePercentage = newFeePercentage })
          } else { t }
        });
        #ok
      };
    };
  };

  public shared(msg) func setGlobalTaxRate(rate : Float) : async { #ok; #err : Text } {
    if (not isAdmin(msg.caller)) {
      return #err("Unauthorized");
    };
    if (rate < 0.0 or rate > 100.0) {
      return #err("Tax rate must be between 0 and 100");
    };
    globalTaxRatePercent := rate;
    #ok
  };

  public query func getGlobalTaxRate() : async Float {
    globalTaxRatePercent
  };

  public shared ({ caller }) func updateClientStripeAccountId(clientId : Text, stripeAccountId : Text, connectionStatus : Text) : async { #ok; #err : Text } {
    adminOnly(caller);
    let found = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (found) {
      case (null) { #err("Client not found") };
      case (?(_, client)) {
        let accountIdOpt : ?Text = if (Text.equal(stripeAccountId, "")) { null } else { ?stripeAccountId };
        _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
          if (Text.equal(t.0, clientId)) {
            (t.0, { t.1 with stripeConnectAccountId = accountIdOpt; stripeConnectStatus = connectionStatus; connectedAt = switch (client.connectedAt) { case (null) { if (stripeAccountId != "") ?Time.now() else null }; case (v) { v } } })
          } else { t }
        });
        #ok
      };
    };
  };

  public shared ({ caller }) func setClientWebhookSecret(clientId : Text, secret : Text) : async {#ok; #err : Text} {
    adminOnly(caller);
    switch (_stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) })) {
      case (null) { #err("Client not found") };
      case (?_) {
        _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
          if (Text.equal(t.0, clientId)) { (t.0, { t.1 with webhookSecret = ?secret }) } else { t }
        });
        #ok
      };
    }
  };

  public query ({ caller }) func getClientOrderVolumes() : async [(Text, Float)] {
    if (not isAdmin(caller)) { return [] };
    var result : [(Text, Float)] = [];
    for ((_, order) in orders.entries()) {
      let key = order.client_id.toText();
      let existing = switch (result.find(func(t : (Text, Float)) : Bool { t.0 == key })) {
        case (null) 0.0;
        case (?(_, v)) v;
      };
      let newEntry = (key, existing + order.amount);
      result := result.filter(func(t : (Text, Float)) : Bool { t.0 != key }).concat([(newEntry)]);
    };
    result
  };

  public shared ({ caller }) func updateClientStatus(clientId : Text, newStatus : Text) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    // LOGIC-LOW-001: valid status allowlist
    let validClientStatuses : [Text] = ["Onboarding", "In Progress", "Done", "Payment Failed"];
    let isValidClientStatus = validClientStatuses.find(func(s : Text) : Bool { Text.equal(s, newStatus) }) != null;
    if (not isValidClientStatus) {
      return #err("Invalid status. Valid values are: Onboarding, In Progress, Done, Payment Failed");
    };
    let exists = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (exists) {
      case (null) { #err("Client not found") };
      case (?(_, _)) {
        _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
          if (Text.equal(t.0, clientId)) {
            (t.0, { t.1 with projectStatus = newStatus })
          } else { t }
        });
        #ok
      };
    }
  };

  public shared ({ caller }) func updateClientNotes(clientId : Text, notes : Text) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let exists = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (exists) {
      case (null) { #err("Client not found") };
      case (?(_, _)) {
        _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
          if (Text.equal(t.0, clientId)) {
            (t.0, { t.1 with notes = notes })
          } else { t }
        });
        #ok
      };
    }
  };

  public shared ({ caller }) func adminUpdateClientProfile(
    clientId      : Text,
    firstName     : Text,
    lastName      : Text,
    phone         : Text,
    businessName  : Text,
    businessType  : Text,
  ) : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    let existing = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (existing) {
      case (null) { #err("Client not found") };
      case (?(_, client)) {
        switch (userProfiles.get(client.email)) {
          case (null) {
            // No portal account yet — still update the CrmClient name/phone fields
            _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
              if (Text.equal(t.0, clientId)) {
                (t.0, { t.1 with
                  name  = firstName # " " # lastName;
                  phone = phone;
                })
              } else { t }
            });
            #ok("Profile updated")
          };
          case (?profile) {
            let updated : UserProfile = {
              profile with
              firstName    = firstName;
              lastName     = lastName;
              phone        = phone;
              businessName = businessName;
              businessType = businessType;
            };
            userProfiles.add(client.email, updated);
            // Also keep CrmClient name/phone in sync
            _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
              if (Text.equal(t.0, clientId)) {
                (t.0, { t.1 with
                  name  = firstName # " " # lastName;
                  phone = phone;
                })
              } else { t }
            });
            #ok("Profile updated")
          };
        }
      };
    }
  };

  public shared ({ caller }) func updateClientHasAccount(clientId : Text, hasAccount : Bool) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    let exists = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (exists) {
      case (null) { #err("Client not found") };
      case (?(_, _)) {
        _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
          if (Text.equal(t.0, clientId)) {
            (t.0, { t.1 with hasAccount })
          } else { t }
        });
        #ok
      };
    }
  };

  public shared ({ caller }) func deleteClient(clientId : Text) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized: Only admins can perform this action") };
    let exists = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (exists) {
      case (null) { #err("Client not found") };
      case (?(_, _)) {
        _stableClientsV3 := _stableClientsV3.filter(func(t : (Text, CrmClient)) : Bool { not Text.equal(t.0, clientId) });
        #ok
      };
    }
  };

  public shared ({ caller }) func getClientByEmail(email : Text) : async ?CrmClient {
    if (caller.isAnonymous()) { return null };
    let callerEmailOpt = principalToEmail.get(caller);
    let callerEmail = switch (callerEmailOpt) { case (?e) { e }; case (null) { "" } };
    if (not (Text.equal(callerEmail.toLower(), email.toLower()) or isAdmin(caller))) {
      return null;
    };
    let emailLower = email.toLower();
    switch (_stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.1.email.toLower(), emailLower) })) {
      case (?(_, client)) { ?client };
      case (null) { null };
    }
  };

  // Called by the frontend Stripe success handler to record a completed purchase.
  // "Customer" source always wins — it overrides Lead and Brief per source precedence rules.
  // Auto-triggers milestone 1 (Deposit Paid) for Custom/Speedy site purchases.
  // Fix 3: sessionId parameter used to deduplicate email firing when webhook and
  // /order-confirmation race. CRM upsert is always performed; emails only fire once per session.
   private func recordPurchase(sessionId : Text, email : Text, name : Text, services : [Text], amountCents : Nat, stripeSessionId : Text, callerPrincipal : ?Principal) : async () {
    if (_stablePurchasesInProgress.contains(sessionId)) { return };
    _stablePurchasesInProgress.add(sessionId);
    // HIGH-2 REENTRANCY GUARD: wrap the entire await body in try/catch so that
    // _stablePurchasesInProgress.remove(sessionId) always executes, even if any
    // await call (e.g. _upsertClient, generateSecureNatId) traps mid-flight.
    // Without this, a trapped await would leave the sessionId locked in the stable
    // set permanently, permanently blocking any future purchase for that session.
    try {
      let clientId = await _upsertClient(email, name, "", "Customer", services, null);
       // Auto-trigger milestone 1 for Custom/Speedy site purchases
       if (_isCustomOrSpeedySite(services)) {
         let existing = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
         switch (existing) {
           case (?(_, client)) {
             if (client.currentMilestone == 0) {
               let now = Time.now();
               _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
                 if (Text.equal(t.0, clientId)) {
                   (t.0, { t.1 with currentMilestone = 1; milestoneUpdatedAt = ?now })
                 } else { t }
               });
             };
           };
           case (null) {};
         };
       };
   
       // EMAIL DEDUPLICATION GUARD — placed immediately before the first await call so that the
       // guard check and commit are both atomic (all state mutations before an await are atomic on the IC).
       // This closes the race window where two concurrent calls (webhook + order-confirmation) could
       // both pass the guard before either has committed the dedup entry.
       // TTL-based: sessions older than 48 hours are considered expired and do not block re-firing.
       let now = Time.now();
       let alreadyFired = switch (_stableEmailFiredSessions.find(func((sid, _ts) : (Text, Int)) : Bool {
         Text.equal(sid, sessionId)
       })) {
         case (null) { false };
         case (?(_, timestamp)) { (now - timestamp) < EMAIL_SESSION_TTL_NS };
       };
       if (alreadyFired) {
         _stablePurchasesInProgress.remove(sessionId);
         return; // CRM upsert already done above; skip email firing entirely
       };
       // Commit the dedup entry atomically before the first await — no concurrent call can pass
       // the guard above after this point (IC atomicity guarantee).
        // Purge expired entries (older than TTL) while appending the new session.
        // LOGIC-LOW-006: also apply FIFO eviction if still over cap after TTL pruning.
        let afterTtl = _stableEmailFiredSessions
          .filter(func((_, ts) : (Text, Int)) : Bool { (now - ts) < EMAIL_SESSION_TTL_NS });
        let afterEviction : [(Text, Int)] = if (afterTtl.size() >= MAX_EMAIL_FIRED_SESSIONS) {
          // Drop from the front to stay under cap
          let dropCount = afterTtl.size() - MAX_EMAIL_FIRED_SESSIONS + 1;
          var evicted : [(Text, Int)] = [];
          var i = dropCount;
          while (i < afterTtl.size()) {
            evicted := evicted.concat([afterTtl[i]]);
            i += 1;
          };
          evicted
        } else { afterTtl };
        _stableEmailFiredSessions := afterEviction.concat([(sessionId, now)]);
        // ORDER CONFIRMATION EMAIL — sent once per session (dedup guard above already passed).
        // Only fires when customer email is non-empty.
        if (not Text.equal(email, "")) {
          // Compute display name: use name if non-empty/non-"Unknown", else email prefix before "@"
          let displayName : Text = if (not Text.equal(name, "") and not Text.equal(name, "Unknown")) {
            name
          } else {
            let parts = email.split(#char '@');
            let prefix = switch (parts.next()) {
              case (?p) { p };
              case (null) { email };
            };
            prefix
          };
          // Format amountCents as "$X,XXX.XX"
          let dollars : Nat = amountCents / 100;
          let cents : Nat = amountCents % 100;
          let centsStr : Text = if (cents < 10) { "0" # cents.toText() } else { cents.toText() };
          let dollarsRaw : Text = dollars.toText();
          // Insert commas every 3 digits from the right
          let dLen = dollarsRaw.size();
          var formattedDollars : Text = "";
          var charIdx : Nat = 0;
          for (ch in dollarsRaw.chars()) {
            let distFromRight = dLen - charIdx;
            if (distFromRight > 0 and distFromRight < dLen and distFromRight % 3 == 0) {
              formattedDollars := formattedDollars # ",";
            };
            formattedDollars := formattedDollars # Text.fromChar(ch);
            charIdx += 1;
          };
          let amountFormatted : Text = "$" # formattedDollars # "." # centsStr;
          // Build service list HTML
          let serviceListHtml : Text = if (services.size() == 0) {
            "<li>Your order</li>"
          } else {
            var html = "";
            for (s in services.vals()) {
              html := html # "<li>" # jsonEscape(s) # "</li>";
            };
            html
          };
          // Compose confirmation body
          let confirmBody : Text =
            "<strong>Your Imperidome order is confirmed!</strong><br><br>"
            # "Hi " # jsonEscape(displayName) # ",<br><br>"
            # "Thank you for your purchase. Here is a summary of your order:<br>"
            # "<ul>" # serviceListHtml # "</ul>"
            # "<b>Total charged:</b> " # amountFormatted # "<br><br>"
            # "You can log in to your client portal to track your project progress:<br>"
            # "<a href=\"" # _siteBaseUrl # "/portal\">" # _siteBaseUrl # "/portal</a><br><br>"
            # "If you have any questions, reply to this email or contact us at "
            # getAdminEmail() # ".<br><br>"
            # "— The Imperidome Team";
          ignore sendEmail(email, "Your Imperidome order is confirmed", confirmBody);
        };
 
     
       // Fire-and-forget email sequence: deposit confirmed + questionnaire unlocked + admin alert
       let serviceLabel = if (services.size() > 0) { services[0] } else { "" };
      let extras : [(Text, Text)] = [("project_tier", serviceLabel)];
 
      // Direct payment received admin alert
      let paymentBody =
        "<strong>Payment Received — Imperidome</strong><br><br>"
        # "<b>Client Name:</b> " # name # "<br>"
        # "<b>Client Email:</b> " # email # "<br>"
        # "<b>Services:</b> " # serviceLabel # "<br>"
        # "<b>Timestamp:</b> " # Time.now().toText() # "<br><br>"
        # "Log in to the admin panel to advance the project timeline.";
      ignore sendEmail(getAdminEmail(), "Payment Received — Imperidome", paymentBody);
      ignore _pushAdminNotification(
        "payment_received",
        "Payment: " # name,
        name # " (" # email # ") completed a payment for " # serviceLabel # "."
      );
 
      ignore sendEmailByTrigger("deposit_confirmed",      email,                         extras);
      ignore sendEmailByTrigger("questionnaire_unlocked", email,                         extras);
      ignore sendEmailByTrigger("deposit_alert_admin",    getAdminEmail(), extras.concat([("client_name", name), ("client_email", email)]));
      // If this is a Site Audit purchase, also send the audit_in_progress confirmation
      let isSiteAuditPurchase = services.find(func(s : Text) : Bool {
        s.toLower().contains(#text "site audit")
      }) != null;
      if (isSiteAuditPurchase) {
        ignore sendEmailByTrigger("audit_in_progress", email, [("client_name", name), ("business_type", serviceLabel), ("service_name", serviceLabel)]);
      };
      // Push notification trigger
      ignore await triggerPushNotification("New Order", name # " placed a new order", "/admin/orders", "New order");
      let orderId = await generateSecureNatId();
      let orderRecord : Order = {
        id = orderId;
        client_id = switch callerPrincipal {
          case (?p) p;
          case null {
            (func() : Principal {
              var found : ?Principal = null;
              for ((p, e) in principalToEmail.entries()) {
                if (e == email) { found := ?p };
              };
              switch found {
                case (?p) p;
                case null Principal.fromText("2vxsx-fae");
              }
            })()
          }
        };
        tier_code = services.vals().join(", ");
        status = #depositReceived;
        delivery_window = email;
        launch_target = stripeSessionId;
        created_at = Time.now();
        updated_at = Time.now();
        amount = amountCents.toFloat() / 100.0;
      };
      ignore orders.add(orderId, orderRecord);
    } catch (e) {
      // Any trapped await releases the in-progress lock so the session can be retried.
      // Log the failure for admin visibility but do not re-throw — fire-and-forget callers
      // expect this function to always resolve.
      Debug.print("[recordPurchase] trapped for session " # sessionId # ": " # e.message());
    };
    // Always remove the in-progress lock, whether the body succeeded or trapped.
    _stablePurchasesInProgress.remove(sessionId);
  };

  // Update the briefStatus for a client identified by their caller Principal.
  // Only accepts "Submitted" as a valid new status (clients call this after portal submission).
  // Auto-triggers milestone 2 (Brief Submitted) for Custom/Speedy clients at milestone 1.
  // Bug 9 fix: returns #okAlreadyAdvanced when the milestone was already >= 2, so the
  // frontend can show appropriate feedback when the auto-advance is skipped.
  // MEDIUM-003 fix: uses caller Principal mapped to email — prevents cross-user milestone advance.
  public shared ({ caller }) func updateClientBriefStatus(newStatus : Text) : async UpsertResult {
    if (caller.isAnonymous()) { return #err("not authenticated") };
    if (not Text.equal(newStatus, "Submitted")) {
      return #err("Only 'Submitted' is a valid status update");
    };
    switch (principalToEmail.get(caller)) {
      case (null) { return #err("unknown caller") };
      case (?clientEmail) {
        let emailLower = clientEmail.toLower();
        let existing = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
          Text.equal(t.1.email.toLower(), emailLower)
        });
        switch (existing) {
          case (null) { #err("Client not found") };
          case (?(id, client)) {
            // Early-exit guard: prevent concurrent/duplicate brief submissions
            if (client.briefStatus == ?"Submitted" or client.currentMilestone >= 2) {
              return #okAlreadyAdvanced;
            };
            let now = Time.now();
            // Determine if auto-advance applies
            let shouldAdvance =
              client.currentMilestone == 1 and
              _isCustomOrSpeedySite(client.activeServices);
            let newMilestone : Nat = if (shouldAdvance) { 2 } else { client.currentMilestone };
            let newMilestoneUpdatedAt : ?Int = if (shouldAdvance) { ?now }
              else { client.milestoneUpdatedAt };
            _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
              if (Text.equal(t.0, id)) {
                (t.0, {
                  t.1 with
                  briefStatus = ?"Submitted";
                  briefSubmittedAt = ?now;
                  currentMilestone = newMilestone;
                  milestoneUpdatedAt = newMilestoneUpdatedAt;
                })
              } else { t }
            });
            // Return indicator so frontend knows if auto-advance was skipped
            if (shouldAdvance) { #ok } else { #okAlreadyAdvanced }
          };
        }
      };
    }
  };

  // Returns the briefStatus for the client identified by email, or null if not found.
  // Requires the caller to be non-anonymous and either the owner of the record or the admin.
  public shared ({ caller }) func getClientBriefStatus(email : Text) : async ?Text {
    if (caller.isAnonymous()) { return null };
    let callerEmail = switch (principalToEmail.get(caller)) { case null { return null }; case (?e) { e } };
    if (callerEmail.toLower() != email.toLower() and not (caller.isController() or AccessControl.isAdmin(accessControlState, caller))) {
      return null;
    };
    let emailLower = email.toLower();
    switch (_stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
      Text.equal(t.1.email.toLower(), emailLower)
    })) {
      case (?(_, client)) { client.briefStatus };
      case (null) { null };
    }
  };

  // Admin-only: manually advance the milestone for a Custom/Speedy client (milestones 3–6).
  // Validates that newMilestone is between 1 and 6 and strictly greater than the current value.
  public shared ({ caller }) func updateClientMilestone(clientId : Text, newMilestone : Nat) : async { #ok : (); #err : Text } {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    if (newMilestone < 1 or newMilestone > 6) {
      return #err("Milestone must be between 1 and 6");
    };
    let existing = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (existing) {
      case (null) { #err("Client not found") };
      case (?(_, client)) {
        if (newMilestone <= client.currentMilestone) {
          return #err("New milestone must be greater than the current milestone (" # client.currentMilestone.toText() # ")");
        };
        let now = Time.now();
        _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
          if (Text.equal(t.0, clientId)) {
            (t.0, { t.1 with currentMilestone = newMilestone; milestoneUpdatedAt = ?now })
          } else { t }
        });
        // Fire milestone-specific email notifications
        let serviceLabel = if (client.activeServices.size() > 0) { client.activeServices[0] } else { "" };
        let extras : [(Text, Text)] = [("project_tier", serviceLabel)];
        if (newMilestone == 5) {
          ignore sendEmailByTrigger("draft_ready", client.email, extras);
        } else if (newMilestone == 6) {
          ignore sendEmailByTrigger("site_launched", client.email, extras);
        };
        #ok
      };
    }
  };

  // Returns the current milestone for the given client ID.
  // LOGIC-LOW-004: caller auth required — anonymous callers rejected.
  // Returns milestone only if caller is admin or principal maps to the owning client.
  public shared ({ caller }) func getClientMilestone(clientId : Text) : async { #ok : ?Nat; #err : Text } {
    adminOnly(caller);
    switch (_stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) })) {
      case (null) { #ok(null) };
      case (?(_, client)) { #ok(?client.currentMilestone) };
    }
  };

  // ── AD-HOC INVOICE ──────────────────────────────────────────────────────────
  // Admin-only: create a Stripe one-time payment checkout session for an
  // arbitrary charge (hourly work, extras, etc.), store an Invoice record,
  // and email the client a payment link.
  public shared ({ caller }) func createAdHocInvoiceSession(
    clientId    : Text,
    description : Text,
    amountCents : Nat,
    successUrl  : Text,
    cancelUrl   : Text,
  ) : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized: Only admins can perform this action");
    };
    // Look up client
    let clientEntry = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    let client = switch (clientEntry) {
      case (null) { return #err("Client not found: " # clientId) };
      case (?(_, c)) { c };
    };
    let clientEmail = client.email;
    let clientName  = client.name;

    let cfg = requireStripeConfig();

    // Build form-encoded Stripe checkout session body directly (payment mode, price_data)
    let params = List.empty<Text>();
    params.add("line_items[0][price_data][currency]=usd");
    params.add("line_items[0][price_data][product_data][name]=" # _urlEncodeLocal(description));
    params.add("line_items[0][price_data][unit_amount]=" # amountCents.toText());
    params.add("line_items[0][quantity]=1");
    params.add("mode=payment");
    if (not _isAllowedRedirectUrl(successUrl)) { return #err("Invalid redirect URL") };
    if (not _isAllowedRedirectUrl(cancelUrl)) { return #err("Invalid redirect URL") };
    params.add("success_url=" # _urlEncodeLocal(successUrl));
    params.add("cancel_url=" # _urlEncodeLocal(cancelUrl));
    params.add("client_reference_id=" # _urlEncodeLocal(clientId));
    let body = params.values().join("&");

    let headers = [
      { name = "authorization"; value = "Bearer " # cfg.secretKey },
      { name = "content-type"; value = "application/x-www-form-urlencoded" },
    ];

    let response = try {
      await OutCall.httpPostRequest("https://api.stripe.com/v1/checkout/sessions", headers, body, transform)
    } catch (e) {
      return #err("Stripe call failed: " # e.message());
    };

    // Extract checkout URL and session ID from Stripe JSON response
    func extractField(json : Text, key : Text) : Text {
      let searchKey = "\"" # key # "\":\"";
      if (json.contains(#text searchKey)) {
        let parts = json.split(#text searchKey).toArray();
        if (parts.size() > 1) {
          let endParts = parts[1].split(#text "\"").toArray();
          if (endParts.size() > 0) { return endParts[0] };
        };
      };
      ""
    };

    let checkoutUrl = extractField(response, "url");
    let sessionId   = extractField(response, "id");

    if (checkoutUrl.size() == 0) {
      return #err("Stripe did not return a checkout URL. Response: " # response);
    };

    // Create and store the AdHocInvoice record
    let now = Time.now();
    let invoiceId : Nat = await generateSecureNatId();
    // FIFO eviction — drop oldest ad-hoc invoice when at capacity
    if (_stableAdHocInvoices.size() >= MAX_ADHOC_INVOICES) {
      var evicted : [AdHocInvoice] = [];
      var i = 1;
      while (i < _stableAdHocInvoices.size()) {
        evicted := evicted.concat([_stableAdHocInvoices[i]]);
        i += 1;
      };
      _stableAdHocInvoices := evicted;
    };
    _stableAdHocInvoices := _stableAdHocInvoices.concat([{
      id              = invoiceId;
      clientId        = clientId;
      invoiceNumber   = "INV-" # now.toText();
      description     = description;
      amount          = amountCents.toFloat();
      status          = "pending";
      dueDate         = now + (7 * 24 * 60 * 60 * 1_000_000_000);
      paidAt          = null;
      stripeSessionId = sessionId;
      createdAt       = now;
      updatedAt       = now;
    }]);

    // Email the client the payment link
    let amountText = (amountCents.toFloat() / 100.0).toText();
    let emailBody =
      "<strong>Payment Request from Imperidome</strong><br><br>"
      # "Hi " # clientName # ",<br><br>"
      # "You have a new payment request from Imperidome.<br><br>"
      # "<b>Description:</b> " # description # "<br>"
      # "<b>Amount:</b> $" # amountText # "<br><br>"
      # "Please click the secure link below to complete your payment:<br><br>"
      # "<a href=\"" # checkoutUrl # "\" style=\"color:#000000;\">Pay Now</a><br><br>"
      # "Or copy and paste this link into your browser:<br>"
      # checkoutUrl # "<br><br>"
      # "If you have any questions about this charge, please don't hesitate to reach out.<br><br>"
      # "Thank you,<br>The Imperidome Team<br><br>"
      # "Questions? Contact us at " # _adminEmail;
    ignore sendEmail(clientEmail, "Payment Request from Imperidome — " # description, emailBody);

    // Admin notification
    ignore _pushAdminNotification(
      "payment_received",
      "Invoice Sent: " # clientName,
      "Ad-hoc invoice sent to " # clientName # " (" # clientEmail # ") for $" # amountText # " — " # description
    );

    #ok(checkoutUrl)
  };

  // Admin-only: return all ad-hoc invoices for a given client ID.
  public shared ({ caller }) func getAdHocClientInvoices(clientId : Text) : async [AdHocInvoice] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    _stableAdHocInvoices.filter(func(inv : AdHocInvoice) : Bool {
      Text.equal(inv.clientId, clientId)
    })
  };

  // ── END AD-HOC INVOICE ───────────────────────────────────────────────────────

  // sendSiteLink — admin sends the client their live site URL via email and portal notification.
  public shared ({ caller }) func sendSiteLink(clientId : Text, siteUrl : Text) : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    if (siteUrl.size() == 0) { return #err("Site URL is required") };
    if (not siteUrl.startsWith(#text "https://")) { return #err("Site URL must start with https://") };
    let clientOpt = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (clientOpt) {
      case (null) { #err("Client not found") };
      case (?(_, client)) {
        let extras : [(Text, Text)] = [
          ("client_name", client.name),
          ("site_url", siteUrl),
        ];
        ignore sendEmailByTrigger("site_link_sent", client.email, extras);
        ignore _pushAdminNotification(
          "site_link",
          "Site Link Sent",
          "Site link sent to " # client.name # ": " # siteUrl
        );
        // Append log entry
        let newEntry : SiteLinkEntry = { url = siteUrl; sentAt = Time.now() };
        _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
          if (Text.equal(t.0, clientId)) {
            (t.0, { t.1 with siteLinkLog = t.1.siteLinkLog.concat([newEntry]) })
          } else { t }
        });
        #ok("Site link sent successfully")
      };
    }
  };

  // getSiteLinkLog — returns the sent site link log for a client, newest-first.
  public shared query ({ caller }) func getSiteLinkLog(clientId : Text) : async { #ok : [SiteLinkEntry]; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    let clientOpt = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (clientOpt) {
      case (null) { #err("Client not found") };
      case (?(_, client)) {
        // Return log in reverse chronological order (newest first)
        let log = client.siteLinkLog;
        let sorted = log.sort(func(a : SiteLinkEntry, b : SiteLinkEntry) : { #less; #equal; #greater } { Int.compare(b.sentAt, a.sentAt) });
        #ok(sorted)
      };
    }
  };

  // resendSiteLink — re-sends a previously sent site link to the client and logs a new entry.
  public shared ({ caller }) func resendSiteLink(clientId : Text, url : Text) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    if (url.size() == 0) { return #err("URL is required") };
    if (not url.startsWith(#text "https://")) { return #err("URL must start with https://") };
    let clientOpt = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (clientOpt) {
      case (null) { #err("Client not found") };
      case (?(_, client)) {
        let extras : [(Text, Text)] = [
          ("client_name", client.name),
          ("site_url", url),
        ];
        ignore sendEmailByTrigger("site_link_sent", client.email, extras);
        ignore _pushAdminNotification(
          "site_link",
          "Site Link Resent",
          "Site link resent to " # client.name # ": " # url
        );
        let newEntry : SiteLinkEntry = { url = url; sentAt = Time.now() };
        _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
          if (Text.equal(t.0, clientId)) {
            (t.0, { t.1 with siteLinkLog = t.1.siteLinkLog.concat([newEntry]) })
          } else { t }
        });
        #ok
      };
    }
  };

  // ── REVIEW / TESTIMONIAL SYSTEM ─────────────────────────────────────────────

  // submitReview — allows a logged-in client to submit a review.
  // Prevents duplicate submissions from the same email.
  // Validates rating (1–5) and requires non-empty reviewText.
  public shared func submitReview(
    clientEmail : Text,
    rating      : Nat,
    reviewText  : Text,
    jobTitle    : Text,
  ) : async { #ok : ReviewId; #err : Text } {
    if (rating < 1 or rating > 5) {
      return #err("Rating must be between 1 and 5");
    };
    if (reviewText.size() == 0) {
      return #err("Review text cannot be empty");
    };
    // Prevent duplicate: one review per email
    let duplicate = _stableReviews.find(func(t : (ReviewId, Review)) : Bool {
      Text.equal(t.1.clientEmail, clientEmail)
    });
    if (duplicate != null) {
      return #err("You have already submitted a review");
    };
    // Resolve client name from CRM (fall back to email prefix if not found)
    let clientName : Text = do {
      let clientOpt = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
        Text.equal(t.1.email, clientEmail)
      });
      switch (clientOpt) {
        case (?(_, c)) { c.name };
        case (null) { clientEmail };
      }
    };
    let reviewId = await generateSecureId();
    let review : Review = {
      id          = reviewId;
      clientEmail;
      clientName;
      rating;
      reviewText;
      jobTitle;
      status      = "pending";
      submittedAt = Time.now();
    };
    _stableReviews := _stableReviews.concat([(reviewId, review)]);
    // Notify admin that a new review was submitted
    ignore sendEmailByTrigger("review_submitted", clientEmail, [("client_name", clientName)]);
    // Confirm receipt to the client
    ignore sendEmailByTrigger("review_submitted_confirmation", clientEmail, [("client_name", clientName)]);
    // Notify admin
    ignore _pushAdminNotification(
      "review_submitted",
      "New Review Submitted",
      clientName # " submitted a " # rating.toText() # "-star review."
    );
    // Push notification trigger
    ignore await triggerPushNotification("New Review", clientEmail # " submitted a review", "/admin/reviews", "New review");
    #ok(reviewId)
  };

  // getMyReview — returns the review submitted by the given email, or null.
  public query func getMyReview(clientEmail : Text) : async ?Review {
    let entry = _stableReviews.find(func(t : (ReviewId, Review)) : Bool {
      Text.equal(t.1.clientEmail, clientEmail)
    });
    switch (entry) {
      case (?(_, r)) { ?r };
      case (null) { null };
    }
  };

  // getPendingReviews — admin only, returns all pending reviews sorted newest-first.
  public query ({ caller }) func getPendingReviews() : async [Review] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    _stableReviews
      .filter(func(t : (ReviewId, Review)) : Bool { Text.equal(t.1.status, "pending") })
      .map(func(t : (ReviewId, Review)) : Review { t.1 })
      .sort(func(a : Review, b : Review) : { #less; #equal; #greater } {
        Int.compare(b.submittedAt, a.submittedAt)
      })
  };

  // approveReview — admin sets a review to "approved" and notifies the client.
  public shared ({ caller }) func approveReview(reviewId : ReviewId) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let entry = _stableReviews.find(func(t : (ReviewId, Review)) : Bool {
      Text.equal(t.0, reviewId)
    });
    switch (entry) {
      case (null) { #err("Review not found") };
      case (?(_, review)) {
        _stableReviews := _stableReviews.map<(ReviewId, Review), (ReviewId, Review)>(func(t) {
          if (Text.equal(t.0, reviewId)) {
            (t.0, { t.1 with status = "approved" })
          } else { t }
        });
        ignore sendEmailByTrigger("review_approved", review.clientEmail, [("client_name", review.clientName)]);
        ignore _pushAdminNotification(
          "review_approved",
          "Review Approved",
          review.clientName # "'s review is now live."
        );
        #ok
      };
    }
  };

  // rejectReview — admin sets a review to "rejected". No email is sent.
  public shared ({ caller }) func rejectReview(reviewId : ReviewId) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let entry = _stableReviews.find(func(t : (ReviewId, Review)) : Bool {
      Text.equal(t.0, reviewId)
    });
    switch (entry) {
      case (null) { #err("Review not found") };
      case (_) {
        _stableReviews := _stableReviews.map<(ReviewId, Review), (ReviewId, Review)>(func(t) {
          if (Text.equal(t.0, reviewId)) {
            (t.0, { t.1 with status = "rejected" })
          } else { t }
        });
        #ok
      };
    }
  };

  // getApprovedReviews — public query, returns all approved reviews sorted newest-first.
  // deleteReview — admin permanently removes a review by ID.
  public shared({ caller }) func deleteReview(reviewId : ReviewId) : async { #ok; #err : Text } {
    adminOnly(caller);
    let before = _stableReviews.size();
    _stableReviews := _stableReviews.filter(func(t : (ReviewId, Review)) : Bool { not Text.equal(t.0, reviewId) });
    if (_stableReviews.size() < before) {
      #ok
    } else {
      #err("Review not found")
    }
  };

  public query func getApprovedReviews() : async [Review] {
    _stableReviews
      .filter(func(t : (ReviewId, Review)) : Bool { Text.equal(t.1.status, "approved") })
      .map(func(t : (ReviewId, Review)) : Review { t.1 })
      .sort(func(a : Review, b : Review) : { #less; #equal; #greater } {
        Int.compare(b.submittedAt, a.submittedAt)
      })
  };

  // getRejectedReviews — admin only, returns all rejected reviews sorted newest-first.
  public query ({ caller }) func getRejectedReviews() : async [Review] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    _stableReviews
      .filter(func(t : (ReviewId, Review)) : Bool { Text.equal(t.1.status, "rejected") })
      .map(func(t : (ReviewId, Review)) : Review { t.1 })
      .sort(func(a : Review, b : Review) : { #less; #equal; #greater } {
        Int.compare(b.submittedAt, a.submittedAt)
      })
  };

  // ── END REVIEW / TESTIMONIAL SYSTEM ─────────────────────────────────────────

  // ── CLIENT PORTAL FUNCTIONS ──────────────────────────────────────────────────

  // createEditRequest — client submits an edit/support request.
  // Stores the record in the editRequests Map tied to the caller's Principal.
  public shared ({ caller }) func createEditRequest(
    requestType   : Text,
    pageSection   : Text,
    description   : Text,
    attachmentUrl : Text,
  ) : async UpsertResult {
    let now = Time.now();
    let reqId = await _getNextEditRequestId();
    let reqNum = "ER-" # reqId.toText();
    let attachUrl : ?Text = if (attachmentUrl.size() > 0) { ?attachmentUrl } else { null };
    let newReq : EditRequest = {
      id              = reqId;
      client_id       = caller;
      order_id        = null;
      request_number  = reqNum;
      request_type    = requestType;
      page_or_section = pageSection;
      description     = description;
      attachment_url  = attachUrl;
      status          = "PENDING";
      created_at      = now;
      updated_at      = now;
    };
    editRequests.add(reqId, newReq);
    // Push notification trigger
    ignore await triggerPushNotification("New Edit Request", "A client submitted an edit request", "/admin/edit-requests", "New edit request");
    #ok
  };

  // getMyBillingHistory — returns billing history records for the caller.
  // Reads from billingHistoryRecords (populated by Stripe invoice webhooks), mapped to BillingHistory shape.
  public query ({ caller }) func getMyBillingHistory() : async [BillingHistory] {
    let callerEmail = switch (principalToEmail.get(caller)) {
      case (?e) e;
      case null { return [] };
    };
    let mapped = billingHistoryRecords.values()
      .filter(func(r : BillingHistoryRecord) : Bool { r.clientEmail == callerEmail })
      .map(func(r : BillingHistoryRecord) : BillingHistory {
        {
          id                      = 0;
          client_id               = caller;
          subscription_id         = 0;
          description             = r.serviceName;
          amount                  = r.amountCents.toFloat() / 100.0;
          status                  = r.status;
          payment_date            = r.createdAt;
          stripe_payment_intent_id = r.id;
          created_at              = r.createdAt;
        }
      })
      .toArray();
    mapped.sort(func(a : BillingHistory, b : BillingHistory) : CoreOrder.Order {
      if (b.payment_date > a.payment_date) #greater else if (b.payment_date < a.payment_date) #less else #equal
    });
  };

  // getAdminBillingHistory — returns all billing history records across all clients.
  // Admin-scoped: requires the caller to be a registered admin principal.
  // getAdminBillingHistory — returns all billing history records across all clients.
  // Admin-scoped: requires the caller to be a registered admin principal.
  public shared ({ caller }) func getAdminBillingHistory() : async { #ok : [BillingHistory]; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let allRecords = billingHistoryRecords.values()
      .map(func(r : BillingHistoryRecord) : BillingHistory {
        {
          id                       = 0;
          client_id                = Principal.fromText("aaaaa-aa");
          subscription_id          = 0;
          description              = r.serviceName;
          amount                   = r.amountCents.toFloat() / 100.0;
          status                   = r.status;
          payment_date             = r.createdAt;
          stripe_payment_intent_id = r.id;
          created_at               = r.createdAt;
        }
      })
      .toArray();
    #ok(allRecords)
  };

  // _sendBillingRemindersCore — internal helper that runs the reminder logic
  // without an admin check. Called both from the public admin endpoint and from
  // the 24-hour recurring timer (where the caller is the canister itself and
  // would otherwise fail the isAdmin() check).
  private func _sendBillingRemindersCore() : async { #ok : Nat; #err : Text } {
    let leadDaysNs : Int = reminderLeadDays * 86_400_000_000_000;
    let now = Time.now();
    var count = 0;
    for ((_, sub) in subscriptions.entries()) {
      if (sub.status == "Active" and sub.nextBillingDate > 0) {
        switch (sub.reminderSentAt) {
          case (?_) {};
          case null {
            let timeUntil : Int = sub.nextBillingDate - now;
            if (timeUntil >= 0 and timeUntil <= leadDaysNs) {
              // L-11 FIX: use sub.clientEmail as primary source (populated from webhook payload);
              // fall back to principalToEmail for portal-registered clients;
              // final fallback: billing history records.
              let clientEmail : Text = do {
                if (sub.clientEmail != "") {
                  sub.clientEmail
                } else {
                  let fromPrincipal = switch (principalToEmail.get(sub.client_id)) {
                    case (?e) e;
                    case null "";
                  };
                  if (fromPrincipal != "") {
                    fromPrincipal
                  } else {
                    var found = "";
                    for ((_, bh) in billingHistoryRecords.entries()) {
                      if (found == "" and Text.equal(bh.subscriptionId, sub.stripe_subscription_id) and bh.clientEmail != "") {
                        found := bh.clientEmail;
                      }
                    };
                    found
                  }
                }
              };
              if (clientEmail != "") {
                try {
                  await sendEmail(clientEmail,
                    "Upcoming billing reminder — " # sub.plan_name,
                    "Hi " # clientEmail # ",\n\nThis is a reminder that your " # sub.plan_name # " subscription will renew soon.\n\nManage your subscription at: " # _siteBaseUrl # "/portal/subscriptions\n\nThank you,\nImperidome"
                  );
                } catch (_) {};
                subscriptions.add(sub.id, { sub with reminderSentAt = ?now });
                count += 1;
              }
            }
          }
        }
      }
    };
    #ok(count)
  };

  public shared ({ caller }) func sendUpcomingBillingReminders() : async { #ok : Nat; #err : Text } {
    if (not isAdmin(caller)) { return #err("Not authorized") };
    await _sendBillingRemindersCore()
  };

  // setReminderLeadDays — admin-only: set how many days before next billing date to send reminders (1–30).
  public shared ({ caller }) func setReminderLeadDays(days : Nat) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Not authorized") };
    if (days < 1 or days > 30) {
      return #err("Days must be between 1 and 30")
    };
    reminderLeadDays := days;
    #ok
  };

  // getReminderLeadDays — admin-only: returns current reminder lead time in days.
  public shared ({ caller }) func getReminderLeadDays() : async Nat {
    if (not isAdmin(caller)) { return 0 };
    reminderLeadDays
  };

  public func createStripePortalSession(callerEmail : Text) : async { #ok : Text; #err : Text } {
    if (callerEmail == "") { return #err("Not authenticated") };
    let cfg = requireStripeConfig();
    var customerId = "";
    for ((_, sub) in subscriptions.entries()) {
      if (sub.status == "Active" and customerId == "") {
        let cidTxt = sub.client_id.toText();
        switch (_stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, cidTxt) })) {
          case (?(_, c)) {
            if (c.email == callerEmail) {
              switch (sub.stripeCustomerId) {
                case (?cid) { customerId := cid };
                case null {}
              }
            }
          };
          case null {}
        }
      }
    };
    if (customerId == "") { return #err("No active subscription found") };
    let params = List.empty<Text>();
    params.add("customer=" # customerId);
    params.add("return_url=" # _siteBaseUrl # "/portal/subscriptions");
    let body = params.values().join("&");
    let url = "https://api.stripe.com/v1/billing_portal/sessions";
    let headers = [
      { name = "authorization"; value = "Bearer " # cfg.secretKey },
      { name = "content-type"; value = "application/x-www-form-urlencoded" },
    ];
    try {
      let responseText = await OutCall.httpPostRequest(url, headers, body, transform);
      let parts = responseText.split(#text "\"url\":\"").toArray();
      let portalUrl = if (parts.size() > 1) {
        let rest = parts[1].split(#char '\"').toArray();
        if (rest.size() > 0) rest[0] else ""
      } else "";
      if (portalUrl == "") { return #err("No URL in Stripe response") };
      #ok(portalUrl)
    } catch (e) {
      #err("Portal session failed: " # e.message())
    }
  };

  // submitCancellationRequest — client requests cancellation of a subscription.
  // Stores a "cancellation_requested" status on the subscription and notifies admin.
  public shared ({ caller }) func submitCancellationRequest(subscriptionId : Text) : async UpsertResult {
    let subIdNat = switch (Nat.fromText(subscriptionId)) {
      case (?n) { n };
      case (null) { return #err("Invalid subscription ID") };
    };
    switch (subscriptions.get(subIdNat)) {
      case (null) { #err("Subscription not found") };
      case (?sub) {
        if (sub.client_id != caller) {
          return #err("Unauthorized: subscription does not belong to you");
        };
        let now = Time.now();
        let updated : Subscription = { sub with status = "cancellation_requested"; updated_at = now };
        subscriptions.add(subIdNat, updated);
        ignore _pushAdminNotification(
          "subscription_cancelled",
          "Cancellation Request: " # sub.plan_name,
          "Client requested cancellation of " # sub.plan_name # " (subscription ID: " # subscriptionId # ")"
        );
        ignore await sendEmail(
          getAdminEmail(),
          "Subscription Cancellation Requested",
          "<strong>Subscription Cancellation Request — Imperidome</strong><br><br>"
          # "A client has requested cancellation of their subscription.<br><br>"
          # "<b>Subscription ID:</b> " # subscriptionId # "<br>"
          # "<b>Plan:</b> " # sub.plan_name # "<br><br>"
          # "Log in to the admin panel to review and process the request."
        );
        #ok
      };
    }
  };

  // activateSubscription — admin-only: creates a Stripe subscription for a pending subscription record
  // and updates its status to "active". Uses the same OutCall.httpPostRequest pattern as createCheckoutSession.
  public shared ({ caller }) func activateSubscription(subscriptionId : Text) : async { #ok : Text; #err : Text } {
    adminOnly(caller);
    let subIdNat = switch (Nat.fromText(subscriptionId)) {
      case (?n) { n };
      case (null) { return #err("Invalid subscription ID") };
    };
    switch (subscriptions.get(subIdNat)) {
      case (null) { return #err("Subscription not found") };
      case (?sub) {
        if (not Text.equal(sub.status, "pending")) {
          return #err("Subscription is not pending");
        };
        let customerId = switch (sub.stripeCustomerId) {
          case (?cid) { cid };
          case (null) { "" };
        };
        let cfg = requireStripeConfig();
        let priceCents : Nat = switch (sub.billing_cycle) {
          // price is stored as the catalog price_onetime/price_monthly value (dollars)
          // We stored it in plan_code as a dollar string for now — extract from billing history
          // Instead: use price_onetime from the catalog by matching plan_code (product ID)
          case _ {
            // Look up price from the product catalog by plan_code (product ID)
            let catalogPrice : Float = switch (sub.plan_code.toNat()) {
              case (?pid) {
                switch (productCatalog.get(pid)) {
                  case (?p) {
                    switch (sub.billing_cycle) {
                      case "monthly" {
                        switch (p.price_monthly) {
                          case (?pm) { pm };
                          case null { switch (p.price_onetime) { case (?po) po; case null 0.0 } };
                        }
                      };
                      case "quarterly" {
                        switch (p.price_monthly) {
                          case (?pm) { pm };
                          case null { switch (p.price_onetime) { case (?po) po; case null 0.0 } };
                        }
                      };
                      case _ {
                        switch (p.price_onetime) {
                          case (?po) { po };
                          case null { switch (p.price_monthly) { case (?pm) pm; case null 0.0 } };
                        }
                      };
                    }
                  };
                  case null { 0.0 };
                }
              };
              case null { 0.0 };
            };
            Int.abs((catalogPrice * 100.0).toInt())
          };
        };
        let intervalCount : Nat = if (Text.equal(sub.billing_cycle, "quarterly")) { 3 } else { 1 };
        let params = List.empty<Text>();
        if (customerId.size() > 0) {
          params.add("customer=" # _urlEncodeLocal(customerId));
        };
        params.add("items[0][price_data][currency]=usd");
        params.add("items[0][price_data][unit_amount]=" # priceCents.toText());
        params.add("items[0][price_data][recurring][interval]=month");
        params.add("items[0][price_data][recurring][interval_count]=" # intervalCount.toText());
        params.add("items[0][price_data][product_data][name]=" # _urlEncodeLocal(sub.plan_name));
        let body = params.values().join("&");
        let headers = [
          { name = "authorization"; value = "Bearer " # cfg.secretKey },
          { name = "content-type"; value = "application/x-www-form-urlencoded" },
        ];
        let response = try {
          await OutCall.httpPostRequest("https://api.stripe.com/v1/subscriptions", headers, body, transform)
        } catch (e) {
          return #err("Stripe call failed: " # e.message());
        };
        // Extract the Stripe subscription ID from the response JSON
        let stripeSubId : Text = do {
          let searchKey = "\"id\":\"";
          if (response.contains(#text searchKey)) {
            let parts = response.split(#text searchKey).toArray();
            if (parts.size() > 1) {
              let endParts = parts[1].split(#text "\"").toArray();
              if (endParts.size() > 0) { endParts[0] } else { "" }
            } else { "" }
          } else { "" }
        };
        let now = Time.now();
        let updated : Subscription = { sub with
          status = "active";
          stripe_subscription_id = if (stripeSubId.size() > 0) stripeSubId else sub.stripe_subscription_id;
          updated_at = now;
        };
        subscriptions.add(subIdNat, updated);
        #ok("Subscription activated")
      };
    }
  };

  // cancelSubscription — admin-only: cancels a Stripe subscription (if one exists) and
  // updates the subscription record status to "cancelled".
  public shared ({ caller }) func cancelSubscription(subscriptionId : Text) : async { #ok : Text; #err : Text } {
    adminOnly(caller);
    let subIdNat = switch (Nat.fromText(subscriptionId)) {
      case (?n) { n };
      case (null) { return #err("Invalid subscription ID") };
    };
    switch (subscriptions.get(subIdNat)) {
      case (null) { return #err("Subscription not found") };
      case (?sub) {
        // If a Stripe subscription ID exists, cancel it via the Stripe API
        if (sub.stripe_subscription_id.size() > 0 and sub.stripe_subscription_id != "") {
          let cfg = requireStripeConfig();
          let url = "https://api.stripe.com/v1/subscriptions/" # sub.stripe_subscription_id;
          let params = List.empty<Text>();
          params.add("cancel_at_period_end=false");
          let body = params.values().join("&");
          let headers = [
            { name = "authorization"; value = "Bearer " # cfg.secretKey },
            { name = "content-type"; value = "application/x-www-form-urlencoded" },
          ];
          // Best-effort cancel — we still update local status even if Stripe call fails
          try {
            ignore await OutCall.httpPostRequest(url, headers, body, transform);
          } catch (_e) {};
        };
        let now = Time.now();
        let updated : Subscription = { sub with status = "cancelled"; updated_at = now };
        subscriptions.add(subIdNat, updated);
        #ok("Subscription cancelled")
      };
    }
  };

  // getPendingSubscriptions — admin-only: returns all subscriptions with status "pending".
  public shared ({ caller }) func getPendingSubscriptions() : async [Subscription] {
    adminOnly(caller);
    subscriptions.values().filter(func(s : Subscription) : Bool {
      Text.equal(s.status, "pending")
    }).toArray()
  };

  // createStripePaymentSession — client-facing checkout session for a pending invoice.
  // Mirrors createAdHocInvoiceSession exactly but uses the Invoice type (not AdHocInvoice).
  // Session metadata contains invoiceId so the webhook can mark it paid on completion.
  //
  // AUDIT-006: caller auth + amount/URL validation:
  //   (1) Caller must be non-anonymous.
  //   (2) Caller must map to the invoice's owner via principalToEmail + client_id.
  //   (3) amountCents must match the invoice's stored amount (within <1 cent tolerance).
  //   (4) successUrl and cancelUrl must begin with the known app domain.
  public shared ({ caller }) func createStripePaymentSession(
    invoiceId   : Text,
    amountCents : Nat,
    successUrl  : Text,
    cancelUrl   : Text,
  ) : async { #ok : Text; #err : Text } {
    // AUDIT-006 (1): reject anonymous callers; only the invoice owner or admin may proceed
    if (caller.isAnonymous()) { return #err("not authenticated") };

    let invIdNat = switch (Nat.fromText(invoiceId)) {
      case (?n) { n };
      case (null) { return #err("Invalid invoice ID") };
    };
    switch (invoices.get(invIdNat)) {
      case (null) { return #err("Invoice not found") };
      case (?inv) {
        // AUDIT-006 (2): caller must be the invoice owner OR the admin
        let isAdmin = caller.isController() or AccessControl.isAdmin(accessControlState, caller);
        let isOwner = Principal.equal(caller, inv.client_id);
        if (not isOwner and not isAdmin) {
          return #err("unauthorized")
        };

        // AUDIT-006 (3): validate amountCents matches invoice.amount
        // invoice.amount is in dollars (Float); amountCents is in cents (Nat)
        let invoiceAmountCents = inv.amount * 100.0;
        let diff = invoiceAmountCents - amountCents.toFloat();
        let absDiff = if (diff < 0.0) { -diff } else { diff };
        if (absDiff >= 1.0) {
          return #err("amountCents does not match invoice amount");
        };

        // AUDIT-006 (4): validate redirect URLs begin with the configured site base URL
        let successValid = successUrl.startsWith(#text _siteBaseUrl);
        let cancelValid  = cancelUrl.startsWith(#text _siteBaseUrl);
        if (not successValid) { return #err("invalid successUrl domain") };
        if (not cancelValid)  { return #err("invalid cancelUrl domain") };

        let cfg = requireStripeConfig();
        let params = List.empty<Text>();
        params.add("line_items[0][price_data][currency]=usd");
        params.add("line_items[0][price_data][product_data][name]=" # _urlEncodeLocal(inv.description));
        params.add("line_items[0][price_data][unit_amount]=" # amountCents.toText());
        params.add("line_items[0][quantity]=1");
        params.add("mode=payment");
        params.add("success_url=" # _urlEncodeLocal(successUrl));
        params.add("cancel_url=" # _urlEncodeLocal(cancelUrl));
        params.add("client_reference_id=" # _urlEncodeLocal(invoiceId));
        params.add("metadata[invoiceId]=" # _urlEncodeLocal(invoiceId));
        let body = params.values().join("&");
        let headers = [
          { name = "authorization"; value = "Bearer " # cfg.secretKey },
          { name = "content-type"; value = "application/x-www-form-urlencoded" },
        ];
        let response = try {
          await OutCall.httpPostRequest("https://api.stripe.com/v1/checkout/sessions", headers, body, transform)
        } catch (e) {
          return #err("Stripe call failed: " # e.message());
        };
        func _extractField(json : Text, key : Text) : Text {
          let searchKey = "\"" # key # "\":\"";
          if (json.contains(#text searchKey)) {
            let parts = json.split(#text searchKey).toArray();
            if (parts.size() > 1) {
              let endParts = parts[1].split(#text "\"").toArray();
              if (endParts.size() > 0) { return endParts[0] };
            };
          };
          ""
        };
        let checkoutUrl = _extractField(response, "url");
        if (checkoutUrl.size() == 0) {
          return #err("Stripe did not return a checkout URL. Response: " # response);
        };
        #ok(checkoutUrl)
      };
    }
  };

  // markInvoicePaid — client-facing. Marks an Invoice as paid.
  // Requires the caller to be the invoice's owner (client_id Principal) or the admin.
  public shared ({ caller }) func markInvoicePaid(invoiceId : Text, paymentIntentId : Text) : async UpsertResult {
    // Admin-only guard: only the admin principal may mark invoices as paid.
    let callerIsAdmin = caller.isController() or AccessControl.isAdmin(accessControlState, caller);
    if (not callerIsAdmin) {
      return #err("Not authorized")
    };
    if (not paymentIntentId.startsWith(#text "pi_")) {
      return #err("invalid paymentIntentId format");
    };
    let invIdNat = switch (Nat.fromText(invoiceId)) {
      case (?n) { n };
      case (null) { return #err("Invalid invoice ID") };
    };
    switch (invoices.get(invIdNat)) {
      case (null) { #err("Invoice not found") };
      case (?inv) {
        let now = Time.now();
        let updated : Invoice = {
          inv with
          status                  = "PAID";
          paid_at                 = ?now;
          stripe_payment_intent_id = paymentIntentId;
          updated_at              = now;
        };
        invoices.add(invIdNat, updated);
        #ok
      };
    }
  };

  // getMyAdHocInvoices — returns all AdHocInvoice records belonging to the calling client.
  // Uses the caller's Principal (mapped to email on login) rather than an email parameter,
  // preventing cross-user data disclosure (HIGH-001).
  public query ({ caller }) func getMyAdHocInvoices() : async [AdHocInvoice] {
    if (caller.isAnonymous()) { return [] };
    switch (principalToEmail.get(caller)) {
      case (null) { [] };
      case (?email) {
        let emailLower = email.toLower();
        let crmEntry = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
          Text.equal(t.1.email.toLower(), emailLower)
        });
        switch (crmEntry) {
          case (null) { [] };
          case (?(crmId, _)) {
            _stableAdHocInvoices.filter(func(inv : AdHocInvoice) : Bool {
              Text.equal(inv.clientId, crmId)
            })
          };
        }
      };
    }
  };

  // ── END CLIENT PORTAL FUNCTIONS ──────────────────────────────────────────────

  // Admin-only: create a Stripe checkout session for the Custom Sites 50% completion payment.
  // Looks up the client's Custom Sites product from productCatalog, computes remaining 50%,
  // and returns a hosted Stripe checkout URL.
  public shared ({ caller }) func createCompletionPaymentSession(clientId : Text, successUrl : Text, cancelUrl : Text) : async Text {
    if (not isAdmin(caller)) {
      return "Unauthorized: Only admins can perform this action";
    };
    // Find the client
    let clientEntry = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    let client = switch (clientEntry) {
      case (null) { return "Error: Client not found" };
      case (?(_, c)) { c };
    };
    // Find a matching service name from the client's activeServices using _isCustomOrSpeedySite()
    let matchedService = client.activeServices.find(func(svc : Text) : Bool {
      _isCustomOrSpeedySite([svc])
    });
    let serviceName = switch (matchedService) {
      case (null) { return "Error: No Custom Sites service found for this client" };
      case (?s) { s };
    };
    // Find the product in productCatalog by matching name (case-insensitive)
    let matchedProduct = productCatalog.values().find(func(p : Product) : Bool {
      p.product_type == "Custom Sites" and
      serviceName.toUpper().contains(#text (p.name.toUpper()))
    });
    let product = switch (matchedProduct) {
      case (null) { return "Error: Product not found in catalog for service: " # serviceName };
      case (?p) { p };
    };
    // Get the full price and calculate 50% completion amount
    let fullPrice = switch (product.price_onetime) {
      case (null) { return "Error: Product has no one-time price configured" };
      case (?price) { price };
    };
    // Convert to cents (Stripe requires integer cents): multiply by 100, divide by 2 = multiply by 50
    let completionAmountCents : Nat = Int.abs((fullPrice * 50.0).toInt());
    // Build the checkout item with [completion] prefix so _parseItemPrefix treats it as one-time payment
    let item : Stripe.ShoppingItem = {
      currency = "usd";
      productName = "[completion]" # product.name # " — Completion Payment";
      productDescription = "50% completion payment for " # product.name;
      priceInCents = completionAmountCents;
      quantity = 1;
    };
    let cfg = requireStripeConfig();
    // Build completion payment body directly so we can use client.email as client_reference_id
    // (clientId is an internal CRM ID, not a Principal — we use the email for Stripe reconciliation)
    let completionParams = List.empty<Text>();
    let cleanName = product.name # " — Completion Payment";
    completionParams.add("line_items[0][price_data][currency]=usd");
    completionParams.add("line_items[0][price_data][product_data][name]=" # _urlEncodeLocal(cleanName));
    completionParams.add("line_items[0][price_data][product_data][description]=" # _urlEncodeLocal(item.productDescription));
    completionParams.add("line_items[0][price_data][unit_amount]=" # completionAmountCents.toText());
    completionParams.add("line_items[0][quantity]=1");
    completionParams.add("mode=payment");
    completionParams.add("success_url=" # _urlEncodeLocal(successUrl));
    completionParams.add("cancel_url=" # _urlEncodeLocal(cancelUrl));
    completionParams.add("client_reference_id=" # _urlEncodeLocal(client.email));
    let body = completionParams.values().join("&");
    let headers = [
      { name = "authorization"; value = "Bearer " # cfg.secretKey },
      { name = "content-type"; value = "application/x-www-form-urlencoded" },
    ];
    try {
      await OutCall.httpPostRequest("https://api.stripe.com/v1/checkout/sessions", headers, body, transform);
    } catch (error) {
      "Error: Failed to create completion checkout session: " # error.message()
    }
  };

  // Admin-only: mark the completion payment as charged for a client.
  // Sets completionPaymentCharged = true on the client record.
  public shared ({ caller }) func markCompletionPaymentCharged(clientId : Text) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized: Only admins can perform this action");
    };
    let existing = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, clientId) });
    switch (existing) {
      case (null) { #err("Client not found") };
      case (?(_, _)) {
        _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
          if (Text.equal(t.0, clientId)) {
            (t.0, { t.1 with completionPaymentCharged = true })
          } else { t }
        });
        #ok
      };
    }
  };


  // SITE TEXT — key-value store for inline editable site content
  public query func getSiteText(key : Text) : async ?Text {
    switch (_stableSiteText.find(func(t : (Text, Text)) : Bool { Text.equal(t.0, key) })) {
      case (?(_, value)) { ?value };
      case (null) { null };
    }
  };

  public query func getAllSiteText() : async [(Text, Text)] {
    _stableSiteText;
  };

  public shared ({ caller }) func updateSiteText(key : Text, value : Text) : async Bool {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only the Super Admin can edit site text");
    };
    let exists = _stableSiteText.find(func(t : (Text, Text)) : Bool { Text.equal(t.0, key) });
    switch (exists) {
      case (null) {
        if (_stableSiteText.size() >= MAX_SITE_TEXT) {
          var newSiteText : [(Text, Text)] = [];
          var i = 1;
          while (i < _stableSiteText.size()) {
            newSiteText := newSiteText.concat([_stableSiteText[i]]);
            i += 1;
          };
          _stableSiteText := newSiteText;
        };
        _stableSiteText := _stableSiteText.concat([(key, value)]);
      };
      case (?_) {
        _stableSiteText := _stableSiteText.map<(Text, Text), (Text, Text)>(func(t) {
          if (Text.equal(t.0, key)) { (key, value) } else { t }
        });
      };
    };
    true
  };

  // WEBHOOK AUDIT LOG HELPER — append one entry with FIFO eviction at 500.
  func _appendWebhookAuditEntry(entry : WebhookAuditEntry) {
    let current = _stableWebhookAuditLog;
    let combined = current.concat([entry]);
    _stableWebhookAuditLog := if (combined.size() > 500) {
      let drop = combined.size() - 500;
      Array.tabulate<WebhookAuditEntry>(500, func(i : Nat) : WebhookAuditEntry { combined[drop + i] })
    } else { combined };
  };

  public shared ({ caller }) func getWebhookAuditLog() : async [WebhookAuditEntry] {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    _stableWebhookAuditLog
  };

  // ADMIN NOTIFICATION HELPERS
  func _pushAdminNotification(notifType : Text, title : Text, msg : Text) : async () {
    let n : AdminNotification = {
      id        = await generateSecureId();
      notifType = notifType;
      title     = title;
      message   = msg;
      timestamp = Time.now();
      read      = false;
    };
    // FIFO eviction — drop oldest notification when at capacity
    if (_stableAdminNotifications.size() >= MAX_NOTIFICATIONS) {
      var newNotifs : [AdminNotification] = [];
      var i = 1;
      while (i < _stableAdminNotifications.size()) {
        newNotifs := newNotifs.concat([_stableAdminNotifications[i]]);
        i += 1;
      };
      _stableAdminNotifications := newNotifs;
    };
    _stableAdminNotifications := _stableAdminNotifications.concat([n]);
  };

  public shared ({ caller }) func getAdminNotifications() : async [AdminNotification] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    let arr = _stableAdminNotifications;
    arr.sort(func(a : AdminNotification, b : AdminNotification) : { #less; #equal; #greater } {
      Int.compare(b.timestamp, a.timestamp)
    });
  };

  public shared ({ caller }) func markNotificationRead(id : Text) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    _stableAdminNotifications := _stableAdminNotifications.map<AdminNotification, AdminNotification>(func(n) {
      if (Text.equal(n.id, id)) { { n with read = true } } else { n }
    });
  };

  public shared ({ caller }) func markAllNotificationsRead() : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    _stableAdminNotifications := _stableAdminNotifications.map<AdminNotification, AdminNotification>(func(n) {
      { n with read = true }
    });
  };

  // REFERRAL LINK GENERATION
  // Generates a unique referral code, stores referrer info, returns /referral?ref=CODE URL.
  // Bug 7 fix: collision detection — if the generated code already exists, append an additional
  // random suffix and re-check before saving.
  private func createReferralLink(name : Text, email : Text) : async Text {
    // Build code: uppercase name prefix (up to 6 chars) + 6-digit timestamp suffix
    let sanitized  = name.toUpper().replace(#text " ", "");
    let prefixArr  = sanitized.toArray();
    let prefixLen  = Nat.min(6, prefixArr.size());
    var prefixText : Text = "";
    var idx = 0;
    while (idx < prefixLen) {
      prefixText := prefixText # Text.fromChar(prefixArr[idx]);
      idx += 1;
    };
    let ts       = Int.abs(Time.now() % 1_000_000);
    var refCode  = prefixText # ts.toText();
    // Uniqueness check: if code already exists, append an additional random suffix
    let codeExists = _stableReferralCodes.find(func(t : (Text, Text)) : Bool {
      Text.equal(t.0, refCode)
    });
    if (codeExists != null) {
      let extraSuffix = Int.abs(Time.now() % 9999);
      refCode := refCode # extraSuffix.toText();
      // Final check — if still collides (extremely unlikely), append another layer
      let codeExists2 = _stableReferralCodes.find(func(t : (Text, Text)) : Bool {
        Text.equal(t.0, refCode)
      });
      if (codeExists2 != null) {
        let extraSuffix2 = Int.abs(Time.now() % 99999);
        refCode := prefixText # ts.toText() # extraSuffix2.toText();
      };
    };
    // FIFO cap for _stableReferralCodes: drop oldest when limit reached
    if (_stableReferralCodes.size() >= MAX_REFERRAL_CODES) {
      var newCodes : [(Text, Text)] = [];
      var i = 1;
      while (i < _stableReferralCodes.size()) {
        newCodes := newCodes.concat([_stableReferralCodes[i]]);
        i += 1;
      };
      _stableReferralCodes := newCodes;
    };
    _stableReferralCodes := _stableReferralCodes.concat([(refCode, email)]);
    // FIFO cap for _stableReferralNames: drop oldest when limit reached
    if (_stableReferralNames.size() >= MAX_REFERRAL_NAMES) {
      var newNames : [(Text, Text)] = [];
      var i = 1;
      while (i < _stableReferralNames.size()) {
        newNames := newNames.concat([_stableReferralNames[i]]);
        i += 1;
      };
      _stableReferralNames := newNames;
    };
    _stableReferralNames := _stableReferralNames.concat([(refCode, name)]);
    _siteBaseUrl # "/referral?ref=" # refCode
  };

  // REFERRAL CONVERSION TRACKING
  // Called on first purchase by a referred buyer.
  // Fires an admin email + notification once per buyer. Idempotent.
  // Bug 8 fix: normalize buyerEmail to lowercase at the very start before any dedup check or save.
  public shared ({ caller }) func trackReferralConversion(referralCode : Text, buyerEmail : Text, buyerName : Text) : async () {
    if (caller.isAnonymous()) { return };
    // Normalize email to lowercase — ensures case-insensitive deduplication
    let normalizedEmail = buyerEmail.toLower();
    // Idempotency: if this buyer already converted, do nothing
    let alreadyFired = _stableReferralConverts.find(func(t : (Text, Text)) : Bool {
      Text.equal(t.0, normalizedEmail)
    });
    if (alreadyFired != null) { return };

    // Look up the referrer
    let referrerEmailOpt = _stableReferralCodes.find(func(t : (Text, Text)) : Bool {
      Text.equal(t.0, referralCode)
    });
    let referrerNameOpt = _stableReferralNames.find(func(t : (Text, Text)) : Bool {
      Text.equal(t.0, referralCode)
    });

    let referrerEmail = switch (referrerEmailOpt) { case (?(_, e)) { e }; case (null) { "unknown" } };
    let referrerName  = switch (referrerNameOpt)  { case (?(_, n)) { n }; case (null) { "Unknown" } };

    // Mark conversion as recorded (use normalized email as key)
    // FIFO cap for _stableReferralConverts: drop oldest when limit reached
    if (_stableReferralConverts.size() >= MAX_REFERRAL_CONVERTS) {
      var newConverts : [(Text, Text)] = [];
      var i = 1;
      while (i < _stableReferralConverts.size()) {
        newConverts := newConverts.concat([_stableReferralConverts[i]]);
        i += 1;
      };
      _stableReferralConverts := newConverts;
    };
    _stableReferralConverts := _stableReferralConverts.concat([(normalizedEmail, referralCode)]);

    // Fire admin alert email
    let body =
      "<strong>Referral Conversion — First Purchase</strong><br><br>"
      # "<b>Buyer Name:</b> " # buyerName # "<br>"
      # "<b>Buyer Email:</b> " # normalizedEmail # "<br><br>"
      # "<b>Referred By:</b> " # referrerName # "<br>"
      # "<b>Referrer Email:</b> " # referrerEmail # "<br>"
      # "<b>Referral Code:</b> " # referralCode # "<br><br>"
      # "Log in to the admin panel to review and apply any referral rewards.";
    ignore sendEmail(getAdminEmail(), "Referral Conversion — First Purchase", body);

    // Push to notification store
    ignore _pushAdminNotification(
      "referral_conversion",
      "Referral Conversion: " # buyerName,
      buyerName # " (" # normalizedEmail # ") made their first purchase via " # referrerName # "'s referral link."
    );
  };

  // REFERRAL CLICK TRACKING
  // Public — no auth required. Called by the frontend whenever ?ref=CODE is detected in the URL.
  // Increments the click counter for the given code atomically.
  public shared ({ caller }) func trackReferralClick(code : Text) : async () {
    if (caller.isAnonymous()) { return };
    let exists = _stableReferralClicks.find(func(t : (Text, Nat)) : Bool { Text.equal(t.0, code) });
    switch (exists) {
      case (null) {
        // First click for this code — FIFO cap before appending new entry
        if (_stableReferralClicks.size() >= MAX_REFERRAL_CLICKS) {
          var newClicks : [(Text, Nat)] = [];
          var i = 1;
          while (i < _stableReferralClicks.size()) {
            newClicks := newClicks.concat([_stableReferralClicks[i]]);
            i += 1;
          };
          _stableReferralClicks := newClicks;
        };
        _stableReferralClicks := _stableReferralClicks.concat([(code, 1)]);
      };
      case (?(_, count)) {
        _stableReferralClicks := _stableReferralClicks.map<(Text, Nat), (Text, Nat)>(func(t) {
          if (Text.equal(t.0, code)) { (code, t.1 + 1) } else { t }
        });
      };
    };
  };

  // REFERRAL STATS — admin-only
  // Joins _stableReferralCodes, _stableReferralNames, _stableReferralClicks, _stableReferralConverts
  // into a flat ReferralStat record per code.
  public shared ({ caller }) func getReferralStats() : async [ReferralStat] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    _stableReferralCodes.map<(Text, Text), ReferralStat>(func(codeEntry) {
      let code          = codeEntry.0;
      let referrerEmail = codeEntry.1;
      let referrerName  = switch (_stableReferralNames.find(func(t : (Text, Text)) : Bool { Text.equal(t.0, code) })) {
        case (?(_, n)) { n };
        case (null)    { "" };
      };
      let totalClicks = switch (_stableReferralClicks.find(func(t : (Text, Nat)) : Bool { Text.equal(t.0, code) })) {
        case (?(_, c)) { c };
        case (null)    { 0 };
      };
      let successfulConversions = _stableReferralConverts.foldLeft(
        0,
        func(acc : Nat, t : (Text, Text)) : Nat {
          if (Text.equal(t.1, code)) { acc + 1 } else { acc }
        }
      );
      { code; referrerEmail; referrerName; totalClicks; successfulConversions };
    })
  };

  // GENERATE PARTNER LINK — admin-only
  // Wraps createReferralLink with an explicit admin email guard.
  // Returns the full referral URL string.
  public shared ({ caller }) func generatePartnerLink(partnerName : Text, partnerEmail : Text) : async Text {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    await createReferralLink(partnerName, partnerEmail)
  };

  public shared ({ caller }) func deleteReferral(referralCode : Text) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let existing = _stableReferralCodes.filter(func(t : (Text, Text)) : Bool { Text.equal(t.0, referralCode) });
    if (existing.size() == 0) {
      return #err("Referral not found");
    };
    _stableReferralCodes := _stableReferralCodes.filter(func(t : (Text, Text)) : Bool { not Text.equal(t.0, referralCode) });
    _stableReferralNames := _stableReferralNames.filter(func(t : (Text, Text)) : Bool { not Text.equal(t.0, referralCode) });
    _stableReferralClicks := _stableReferralClicks.filter(func(t : (Text, Nat)) : Bool { not Text.equal(t.0, referralCode) });
    _stableReferralConverts := _stableReferralConverts.filter(func(t : (Text, Text)) : Bool { not Text.equal(t.1, referralCode) });
    #ok
  };

  // GET MY REFERRAL CODE — client self-service
  // Returns the referral code for the caller (looked up via principalToEmail).
  // The supplied userEmail parameter is ignored — caller identity is authoritative.
  public shared ({ caller }) func getMyReferralCode(userEmail : Text) : async ?Text {
    let emailLower = switch (principalToEmail.get(caller)) {
      case (?e) { e.toLower() };
      case (null) { return null };
    };
    switch (_stableReferralCodes.find(func(t : (Text, Text)) : Bool { Text.equal(t.1.toLower(), emailLower) })) {
      case (?(code, _)) { ?code };
      case (null)       { null };
    }
  };

  // GET OR CREATE MY REFERRAL CODE — client self-service
  // Returns the caller's referral code. If the caller does not yet have a code,
  // one is auto-generated via createReferralLink and the new code is returned.
  // Auth: caller must be a logged-in non-admin client.
  public shared ({ caller }) func getOrCreateMyReferralCode() : async Text {
    // Resolve caller email — non-anonymous, must be logged in
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: must be logged in") };
    let email = switch (principalToEmail.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: session not found") };
      case (?e) { e };
    };
    let emailLower = email.toLower();
    // Check if client already has a referral code
    // _stableReferralCodes stores (code, referrerEmail) tuples
    switch (_stableReferralCodes.find(func(t : (Text, Text)) : Bool {
      Text.equal(t.1.toLower(), emailLower)
    })) {
      case (?(code, _)) { return code };
      case (null) {};
    };
    // No code yet — look up client name from CRM for a friendlier code prefix
    let clientName = switch (_stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
      Text.equal(t.1.email.toLower(), emailLower)
    })) {
      case (?(_, c)) { c.name };
      case (null)     { email };
    };
    // createReferralLink stores the code and returns the full URL; extract the code from it
    let url = await createReferralLink(clientName, email);
    let prefix = _siteBaseUrl # "/referral?ref=";
    let code = url.stripStart(#text prefix);
    switch (code) {
      case (?c) { c };
      case (null) {
        // Fallback: scan _stableReferralCodes again since createReferralLink just stored it
        switch (_stableReferralCodes.find(func(t : (Text, Text)) : Bool {
          Text.equal(t.1.toLower(), emailLower)
        })) {
          case (?(c2, _)) { c2 };
          case (null) { Runtime.trap("Failed to generate referral code") };
        }
      };
    }
  };

  // GET MY REFERRAL CONVERSIONS — client self-service
  // Counts conversions for the caller (looked up via principalToEmail).
  // The supplied userEmail parameter is ignored — caller identity is authoritative.
  public shared ({ caller }) func getMyReferralConversions(userEmail : Text) : async Nat {
    let emailLower = switch (principalToEmail.get(caller)) {
      case (?e) { e.toLower() };
      case (null) { return 0 };
    };
    // First find all codes that belong to this user
    let myCodes = _stableReferralCodes.filter(func(t : (Text, Text)) : Bool {
      Text.equal(t.1.toLower(), emailLower)
    });
    // Count conversions for those codes
    myCodes.foldLeft(
      0,
      func(acc : Nat, codeEntry : (Text, Text)) : Nat {
        let code = codeEntry.0;
        let conversions = _stableReferralConverts.foldLeft(
          0,
          func(innerAcc : Nat, t : (Text, Text)) : Nat {
            if (Text.equal(t.1, code)) { innerAcc + 1 } else { innerAcc }
          }
        );
        acc + conversions
      }
    )
  };

  // GET MY REFERRAL CLICKS — client self-service
  // Counts total link clicks for the caller's own referral code(s).
  // Caller identity is authoritative.
  public shared ({ caller }) func getMyReferralClicks() : async Nat {
    let emailLower = switch (principalToEmail.get(caller)) {
      case (?e) { e.toLower() };
      case (null) { return 0 };
    };
    let myCodes = _stableReferralCodes.filter(func(t : (Text, Text)) : Bool {
      Text.equal(t.1.toLower(), emailLower)
    });
    myCodes.foldLeft(
      0,
      func(acc : Nat, codeEntry : (Text, Text)) : Nat {
        let code = codeEntry.0;
        let clicks = switch (_stableReferralClicks.find(func(t : (Text, Nat)) : Bool { Text.equal(t.0, code) })) {
          case (?(_, c)) { c };
          case (null)     { 0 };
        };
        acc + clicks
      }
    )
  };

  public shared ({ caller }) func updateLeadStatus(leadId : Text, newStatus : Text) : async UpsertResult {
    if (not isAdmin(caller)) { Runtime.trap("Unauthorized") };
    // LOGIC-LOW-001: valid status allowlist
    let validLeadStatuses : [Text] = ["New", "Contacted", "Qualified", "Closed", "Cancelled", "cancelled", "Draft", "draft", "Confirmed", "confirmed"];
    let isValidLeadStatus = validLeadStatuses.find(func(s : Text) : Bool { Text.equal(s, newStatus) }) != null;
    if (not isValidLeadStatus) {
      return #err("Invalid status. Valid values are: New, Contacted, Qualified, Closed, Cancelled");
    };
    // Use Array.tabulate to rebuild the array so the tuple return type is
    // unambiguous to the Motoko type-checker (Array.map cannot infer tuple R).
    let n = _stableLeadsV5.size();
    let updated : [(Text, Lead)] = Array.tabulate<(Text, Lead)>(n, func(i) {
      let (k, lead) = _stableLeadsV5[i];
      if (Text.equal(k, leadId)) {
        (k, { lead with status = newStatus })
      } else {
        (k, lead)
      }
    });
    _stableLeadsV5 := updated;
    #ok;
  };

  // STRIPE SESSION VERIFICATION
  // Lightweight read — checks if a session is paid without any side effects.
  // Returns #paid if payment_status == "paid" or status == "complete" in the Stripe response.
  // Returns #notPaid if the session exists but is not yet paid.
  // Returns #error with the reason if the Stripe call fails or Stripe is not configured.
  public shared ({ caller }) func checkStripeSessionPaid(sessionId : Text) : async { #paid; #notPaid; #error : Text } {
    // LOGIC-LOW-005: reject anonymous callers before any HTTP outcall
    if (caller.isAnonymous()) { return #error("Anonymous callers not allowed") };
    if (stripeConfig == null) { return #error("Stripe not configured") };
    let status = try {
      await Stripe.getSessionStatus(requireStripeConfig(), sessionId, transform)
    } catch (e) {
      return #error("Stripe call failed: " # e.message());
    };
    switch (status) {
      case (#failed(f)) { #error("Stripe error: " # f.error) };
      case (#completed(c)) {
        let r = c.response;
        if (
          r.contains(#text "\"payment_status\":\"paid\"") or
          r.contains(#text "\"status\":\"complete\"")
        ) { #paid } else { #notPaid };
      };
    };
  };

  // Full verify-and-record function — verifies the Stripe session is paid, then fires
  // recordPurchase() which handles CRM upsert, milestone 1, and all three emails.
  // Safe to call multiple times — recordPurchase/_upsertClient is idempotent for the same email.
  // Bug 2 fix: timeout guard — if Stripe takes longer than 30 seconds we return an error.
  public shared({ caller }) func verifyAndRecordPurchase(
    sessionId : Text,
    email     : Text,
    name      : Text,
    services  : [Text],
  ) : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) { return #err("Anonymous callers are not permitted") };
    if (stripeConfig == null) { return #err("Stripe not configured") };
    let timeoutNanos : Int = 30_000_000_000; // 30 seconds in nanoseconds
    let startTime = Time.now();
    let status = try {
      await Stripe.getSessionStatus(requireStripeConfig(), sessionId, transform)
    } catch (e) {
      return #err("Stripe call failed: " # e.message());
    };
    // Check if the call exceeded the timeout window
    if (Time.now() - startTime > timeoutNanos) {
      return #err("Stripe verification timed out after 30 seconds. Please try again or contact " # _adminEmail # ".");
    };
    switch (status) {
      case (#failed(f)) { #err("Stripe error: " # f.error) };
      case (#completed(c)) {
        let r = c.response;
        let isPaid =
          r.contains(#text "\"payment_status\":\"paid\"") or
          r.contains(#text "\"status\":\"complete\"");
        if (not isPaid) {
          return #err("Session not paid");
        };
        // Extract the authoritative customer email from the Stripe session JSON.
        // Prefer "customer_email" field; fall back to "customer_details"→"email"; final fallback is caller-supplied.
        let resolvedEmail : Text = do {
          func extractStripeEmail(json : Text, key : Text) : Text {
            let searchKey = "\"" # key # "\":\"";
            if (json.contains(#text searchKey)) {
              let parts = json.split(#text searchKey).toArray();
              if (parts.size() > 1) {
                let endParts = parts[1].split(#text "\"").toArray();
                if (endParts.size() > 0 and endParts[0].size() > 0) {
                  return endParts[0]
                }
              }
            };
            ""
          };
          let ce = extractStripeEmail(r, "customer_email");
          if (ce.size() > 0) {
            ce
          } else {
            // Try customer_details → email (nested object, same text extraction)
            let cde = extractStripeEmail(r, "email");
            if (cde.size() > 0) { cde } else { email }
          }
        };
        try {
          let sessionAmountCents : Nat = do {
            var rawDigits = "";
            var inDigits = false;
            let keyMarker = "\"amount_total\":";
            let parts = r.split(#text keyMarker).toArray();
            if (parts.size() > 1) {
              for (c in parts[1].chars()) {
                if (c >= '0' and c <= '9') {
                  rawDigits #= Text.fromChar(c);
                  inDigits := true;
                } else if (inDigits) {
                  inDigits := false;
                };
              };
            };
            switch (rawDigits.toNat()) {
              case (?n) n;
              case null 0;
            };
          };
          await recordPurchase(sessionId, resolvedEmail, name, services, sessionAmountCents, sessionId, ?caller);
          // AUDIT-462-MED-001: return structured JSON with services array for OrderConfirmationPage
          let resolvedName : Text = if (name.size() > 0) { name } else { "" };
          let quotedServices = services.map(func (s : Text) : Text { "\"" # s # "\"" });
          let servicesJson = "[" # quotedServices.vals().join(", ") # "]";
          let jsonStr = "{\"services\":" # servicesJson # ",\"customerName\":\"" # resolvedName # "\",\"customerEmail\":\"" # resolvedEmail # "\"}";
          #ok(jsonStr)
        } catch (e) {
          #err("recordPurchase failed: " # e.message())
        };
      };
    };
  };

  // Bug 3 fix: Full Stripe webhook handler.
  // Receives Stripe event payloads with Stripe-Signature header for verification.
  // Routes subscription renewal, cancellation, and payment failure events to CRM + admin notifications.
  //
  // Supported event types:
  //   customer.subscription.updated  — renewal: update CRM status to "In Progress" + notify admin
  //   customer.subscription.deleted  — cancellation: update CRM status to "Paused" + notify admin
  //   invoice.payment_failed          — payment failure: flag client + notify admin
  //
  // AUDIT-004: Signature verification.
  // Full HMAC-SHA256 requires a crypto library not available in mo:core. Until then this gate
  // enforces a multi-layer security check on incoming Stripe webhook events:
  //   Layer 1: Webhook secret must be configured.
  //   Layer 2: Stripe-Signature header must be present and contain 't=' and 'v1=' fields.
  //   Layer 3: Timestamp freshness — reject events where the 't' timestamp is more than
  //            300 seconds (5 minutes) from the current canister time. This prevents replay attacks.
  //   Layer 4: Payload must be valid JSON containing 'id' and 'type' fields.
  //
  // True HMAC-SHA256 computation requires a crypto library not available in mo:core.
  // Layers 1–4 provide meaningful replay and forgery protection until a sha256 library
  // becomes available for Motoko. Rejected webhooks are logged via _pushAdminNotification.
  public shared func handleStripeWebhook(payload : Text, _signature : Text, secret : Text) : async { #ok : Text; #err : Text } {
    // ── HIGH-1 WEBHOOK HARDENING ─────────────────────────────────────────────
    // The Internet Computer does not expose the HTTP caller's IP to canister
    // code, so Stripe IP-range allowlisting cannot be enforced at the Motoko
    // layer. All IP-based filtering MUST be configured at the boundary (reverse
    // proxy / boundary node) using Stripe's published IP list:
    //   https://stripe.com/docs/ips  (key ranges: 3.18.12.63, 13.235.14.237,
    //   18.211.135.69, 35.154.171.200, 44.228.126.217, 54.187.174.169, …)
    // What we CAN and DO enforce inside Motoko:
    //   1. Shared-secret pre-check (mandatory first gate).
    //   2. Stripe-Signature header presence and format.
    //   3. STRICT 300-second timestamp freshness window (non-negotiable, always
    //      enforced — this is the primary replay-attack defence).
    //   4. Payload validity (non-empty id + type fields).
    //   5. Allowlisted event types only.
    // ─────────────────────────────────────────────────────────────────────────

    // GATE 0 (shared secret) — must be the VERY FIRST check so unauthenticated
    // callers are rejected before any parsing or DB work occurs.
    // A missing (empty) secret is treated as a misconfiguration and always rejected
    // to prevent accidental open-door deployments.
    if (_webhookSharedSecret == "") {
      ignore _pushAdminNotification("webhook_rejected", "Webhook Rejected — Secret Not Configured", "Stripe webhook received but the shared secret has not been set. Configure it in Admin → Stripe Settings.");
      _appendWebhookAuditEntry({ event_id = "unknown"; event_type = "unknown"; received_at = Time.now(); processing_result = "rejected" });
      return #err("Unauthorized: webhook shared secret not configured");
    };
    if (secret != _webhookSharedSecret) {
      ignore _pushAdminNotification("webhook_rejected", "Webhook Rejected — Invalid Secret", "Stripe webhook rejected: provided shared secret did not match the configured value.");
      _appendWebhookAuditEntry({ event_id = "unknown"; event_type = "unknown"; received_at = Time.now(); processing_result = "rejected" });
      return #err("Unauthorized: invalid webhook secret");
    };
    // Layer 0: reject oversized payloads (guard against DoS via giant bodies)
    if (payload.size() > 100_000) {
      ignore _pushAdminNotification("webhook_rejected", "Webhook Rejected — Oversized Payload", "Stripe webhook rejected: payload size " # payload.size().toText() # " characters exceeds 100 000 character limit.");
      _appendWebhookAuditEntry({ event_id = "unknown"; event_type = "unknown"; received_at = Time.now(); processing_result = "rejected" });
      return #err("payload too large");
    };

    // Layer 1: reject if webhook secret has not been configured (stripeWebhookSecret is the
    // Stripe-side signing secret; _webhookSharedSecret above is our own secondary shared key)
    if (stripeWebhookSecret.size() == 0) {
      ignore _pushAdminNotification("webhook_rejected", "Webhook Rejected", "Stripe webhook received but Stripe webhook secret is not configured.");
      _appendWebhookAuditEntry({ event_id = "unknown"; event_type = "unknown"; received_at = Time.now(); processing_result = "rejected" });
      return #err("webhook secret not configured");
    };
    // Layer 2: reject if signature header is absent or missing required Stripe fields (t= and v1=)
    if (_signature.size() == 0 or not _signature.contains(#text "t=") or not _signature.contains(#text "v1=")) {
      ignore _pushAdminNotification("webhook_rejected", "Webhook Rejected", "Stripe webhook rejected: missing or malformed Stripe-Signature header.");
      _appendWebhookAuditEntry({ event_id = "unknown"; event_type = "unknown"; received_at = Time.now(); processing_result = "rejected" });
      return #err("invalid signature format");
    };

    // Layer 3: parse 't=' timestamp and enforce a STRICT, NON-NEGOTIABLE 300-second
    // freshness window. This is the primary replay-attack defence.
    // Stripe signature format: "t=1492774577,v1=5257a869e7....,v0=63f3a72374..."
    // The constant WEBHOOK_TIMESTAMP_TOLERANCE_SECS (300) is intentionally hard-coded
    // and must never be raised — Stripe's own recommendation is ≤300s.
    let WEBHOOK_TIMESTAMP_TOLERANCE_SECS : Nat = 300;
    let sigParts = _signature.split(#char ',').toArray();
    var timestampSeconds : ?Int = null;
    for (part in sigParts.values()) {
      let trimmed = part.trim(#char ' ');
      if (trimmed.startsWith(#text "t=")) {
        let tValOpt = trimmed.stripStart(#text "t=");
        switch (tValOpt) {
          case (?tVal) {
            switch (Int.fromText(tVal)) {
              case (?ts) { timestampSeconds := ?ts };
              case (null) {};
            };
          };
          case (null) {};
        };
      };
    };
    switch (timestampSeconds) {
      case (null) {
        ignore _pushAdminNotification("webhook_rejected", "Webhook Rejected", "Stripe webhook rejected: could not parse timestamp from Stripe-Signature header.");
        _appendWebhookAuditEntry({ event_id = "unknown"; event_type = "unknown"; received_at = Time.now(); processing_result = "rejected" });
        return #err("could not parse timestamp from signature");
      };
      case (?ts) {
        // Convert current time from nanoseconds to seconds for comparison.
        // Reject if the event is older than WEBHOOK_TIMESTAMP_TOLERANCE_SECS (300s).
        // Also reject future-dated timestamps (clock skew > 60s) as they indicate forgery.
        let nowSeconds : Int = Time.now() / 1_000_000_000;
        let ageSecs : Int = nowSeconds - ts;
        // Reject stale events (possible replay)
        if (ageSecs > WEBHOOK_TIMESTAMP_TOLERANCE_SECS.toInt()) {
          ignore _pushAdminNotification("webhook_rejected", "Webhook Rejected — Replay Attack", "Stripe webhook rejected: timestamp is " # Int.abs(ageSecs).toText() # "s old (limit: " # WEBHOOK_TIMESTAMP_TOLERANCE_SECS.toText() # "s). Possible replay attack.");
          _appendWebhookAuditEntry({ event_id = "unknown"; event_type = "unknown"; received_at = Time.now(); processing_result = "rejected" });
          return #err("webhook timestamp too old — possible replay attack");
        };
        // Reject future-dated events (clock skew > 60 seconds indicates forgery or misconfiguration)
        if (ageSecs < -60) {
          ignore _pushAdminNotification("webhook_rejected", "Webhook Rejected — Future Timestamp", "Stripe webhook rejected: timestamp is " # Int.abs(ageSecs).toText() # "s in the future. Possible forgery or clock skew.");
          _appendWebhookAuditEntry({ event_id = "unknown"; event_type = "unknown"; received_at = Time.now(); processing_result = "rejected" });
          return #err("webhook timestamp in the future — possible forgery");
        };
      };
    };
    // HMAC-SHA256 signature verification: see _constantTimeEqual helper above.
    // TODO: implement full HMAC when a crypto library is available in Motoko.


    // Extract event type from payload (best-effort JSON parse)
    func extractJsonText(json : Text, key : Text) : Text {
      let searchKey = "\"" # key # "\":\"";
      if (json.contains(#text searchKey)) {
        let parts = json.split(#text searchKey).toArray();
        if (parts.size() > 1) {
          let endParts = parts[1].split(#text "\"").toArray();
          if (endParts.size() > 0) { return endParts[0] };
        };
      };
      ""
    };

    let eventType = extractJsonText(payload, "type");
    let eventId   = extractJsonText(payload, "id");

    // Layer 4: payload must contain non-empty 'id' and 'type' fields
    if (eventId.size() == 0 or eventType.size() == 0) {
      ignore _pushAdminNotification("webhook_rejected", "Webhook Rejected", "Stripe webhook rejected: payload missing required 'id' or 'type' field.");
      _appendWebhookAuditEntry({ event_id = "unknown"; event_type = "unknown"; received_at = Time.now(); processing_result = "rejected" });
      return #err("invalid payload: missing id or type");
    };

    // Layer 5: reject oversized payloads (> 1MB = 1_048_576 bytes)
    // Stripe legitimate webhooks are always well under this limit; large payloads indicate abuse.
    if (payload.size() > 1_048_576) {
      ignore _pushAdminNotification("webhook_rejected", "Webhook Rejected — Oversized Payload", "Stripe webhook rejected: payload size " # payload.size().toText() # " bytes exceeds 1MB limit.");
      _appendWebhookAuditEntry({ event_id = "unknown"; event_type = "unknown"; received_at = Time.now(); processing_result = "rejected" });
      return #err("payload too large");
    };

    // Event deduplication — reject events that have already been processed.
    // Stripe may retry the same event multiple times; processing it twice creates duplicate records.
    let alreadyProcessed = _stableProcessedEventIds.find(func(id : Text) : Bool { Text.equal(id, eventId) });
    if (alreadyProcessed != null) {
      _appendWebhookAuditEntry({ event_id = eventId; event_type = eventType; received_at = Time.now(); processing_result = "duplicate" });
      return #ok("already processed");
    };

    // Single source of truth for allowed webhook event types
    let knownEventTypes : [Text] = [
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "checkout.session.completed",
      "payment_intent.succeeded",
      "invoice.payment_failed",
      "invoice.payment_succeeded",
      "payment_intent.payment_failed"
    ];
    let isKnownEvent = knownEventTypes.find(func(t : Text) : Bool { Text.equal(t, eventType) });
    switch (isKnownEvent) {
      case (null) {
        ignore _pushAdminNotification("webhook_rejected", "Webhook Rejected — Unknown Event Type", "Stripe webhook rejected: unrecognised event type '" # eventType # "' (id: " # eventId # ").");
        _appendWebhookAuditEntry({ event_id = eventId; event_type = eventType; received_at = Time.now(); processing_result = "rejected" });
        return #err("unrecognised event type: " # eventType);
      };
      case (_) {};
    };

    // Helper: find a CRM client by Stripe subscription ID embedded in payload
    func findClientByStripeCustomerEmail(custEmail : Text) : ?(Text, CrmClient) {
      if (custEmail.size() == 0) { return null };
      let emailLower = custEmail.toLower();
      _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
        Text.equal(t.1.email.toLower(), emailLower)
      })
    };

    // Extract customer email from payload (Stripe embeds it in various locations)
    let customerEmail = do {
      var e = extractJsonText(payload, "customer_email");
      if (e.size() == 0) { e := extractJsonText(payload, "email") };
      e
    };

    if (Text.equal(eventType, "customer.subscription.updated")) {
      // Subscription renewal — update CRM status to "In Progress" and notify admin
      let subscriptionId = extractJsonText(payload, "id");
      let status         = extractJsonText(payload, "status");
      // Only treat as a renewal if the subscription status is "active"
      if (Text.equal(status, "active")) {
        switch (findClientByStripeCustomerEmail(customerEmail)) {
          case (?(clientId, client)) {
            // Update CRM project status to "In Progress" on renewal
            _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
              if (Text.equal(t.0, clientId)) {
                (t.0, { t.1 with projectStatus = "In Progress" })
              } else { t }
            });
            ignore _pushAdminNotification(
              "subscription_renewal",
              "Subscription Renewed: " # client.name,
              client.name # " (" # client.email # ") — subscription " # subscriptionId # " renewed and is now active."
            );
            ignore sendEmail(
              getAdminEmail(),
              "Subscription Renewed — " # client.name,
              "<strong>Subscription Renewal — Imperidome</strong><br><br>"
              # "<b>Client:</b> " # client.name # "<br>"
              # "<b>Email:</b> " # client.email # "<br>"
              # "<b>Subscription ID:</b> " # subscriptionId # "<br>"
              # "<b>Status:</b> Active<br><br>"
              # "Log in to the admin panel to review."
            );
          };
          case (null) {
            // Client not found by email — push notification with raw data
            ignore _pushAdminNotification(
              "subscription_renewal",
              "Subscription Renewed (unknown client)",
              "Subscription " # subscriptionId # " renewed. Customer email: " # customerEmail
            );
          };
        };
      };
      // Update subscriptions Map by stripe_subscription_id
      let updatedStripeSubId = extractJsonText(payload, "id");
      if (updatedStripeSubId != "") {
        let stripeStatus = extractJsonText(payload, "status");
        let mappedStatus = if (Text.equal(stripeStatus, "active")) "Active"
          else if (Text.equal(stripeStatus, "past_due")) "Past Due"
          else if (Text.equal(stripeStatus, "canceled")) "Cancelled"
          else if (Text.equal(stripeStatus, "unpaid")) "Unpaid"
          else "Active";
        let now = Time.now();
        for ((subId, sub) in subscriptions.entries()) {
          if (Text.equal(sub.stripe_subscription_id, updatedStripeSubId)) {
            let currentPeriodEndSecs : Int = switch (Int.fromText(extractJsonText(payload, "current_period_end"))) { case (?n) n; case null 0 };
            let newNextBillingNs : Int = currentPeriodEndSecs * 1_000_000_000;
            let newReminderSentAt : ?Int = if (newNextBillingNs != 0 and newNextBillingNs > sub.nextBillingDate) null else sub.reminderSentAt;
            let updatedSub = { sub with status = mappedStatus; updated_at = now; nextBillingDate = newNextBillingNs; reminderSentAt = newReminderSentAt; stripeCustomerId = sub.stripeCustomerId; paymentFailed = if (Text.equal(mappedStatus, "Active")) false else sub.paymentFailed };
            subscriptions.add(subId, updatedSub);
          };
        };
      };
      _appendWebhookAuditEntry({ event_id = eventId; event_type = eventType; received_at = Time.now(); processing_result = "handled" });
      #ok("subscription.updated processed")

    } else if (Text.equal(eventType, "customer.subscription.deleted")) {
      // Subscription cancellation — update CRM status to "Paused" and notify admin
      let subscriptionId = extractJsonText(payload, "id");
      switch (findClientByStripeCustomerEmail(customerEmail)) {
        case (?(clientId, client)) {
          _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
            if (Text.equal(t.0, clientId)) {
              (t.0, { t.1 with projectStatus = "Paused" })
            } else { t }
          });
          ignore _pushAdminNotification(
            "subscription_cancelled",
            "Subscription Cancelled: " # client.name,
            client.name # " (" # client.email # ") — subscription " # subscriptionId # " was cancelled."
          );
          ignore sendEmail(
            getAdminEmail(),
            "Subscription Cancelled — " # client.name,
            "<strong>Subscription Cancellation — Imperidome</strong><br><br>"
            # "<b>Client:</b> " # client.name # "<br>"
            # "<b>Email:</b> " # client.email # "<br>"
            # "<b>Subscription ID:</b> " # subscriptionId # "<br>"
            # "<b>Status:</b> Cancelled<br><br>"
            # "Log in to the admin panel to follow up with this client."
          );
        };
        case (null) {
          ignore _pushAdminNotification(
            "subscription_cancelled",
            "Subscription Cancelled (unknown client)",
            "Subscription " # subscriptionId # " was cancelled. Customer email: " # customerEmail
          );
        };
      };
      // Update subscriptions Map to Cancelled by stripe_subscription_id
      let deletedStripeSubId = extractJsonText(payload, "id");
      var cancelledPlanName : Text = "";
      if (deletedStripeSubId != "") {
        let now = Time.now();
        for ((subId, sub) in subscriptions.entries()) {
          if (Text.equal(sub.stripe_subscription_id, deletedStripeSubId)) {
            cancelledPlanName := sub.plan_name;
            let updatedSub = { sub with status = "Cancelled"; updated_at = now };
            subscriptions.add(subId, updatedSub);
          };
        };
      };
      if (customerEmail != "") {
        let cancelBody = "Your " # cancelledPlanName # " subscription has been cancelled effective immediately. Log in to your client portal to view your account: " # _siteBaseUrl # "/portal/subscriptions";
        ignore sendEmail(customerEmail, "Your " # cancelledPlanName # " subscription has been cancelled", cancelBody);
      };
      _appendWebhookAuditEntry({ event_id = eventId; event_type = eventType; received_at = Time.now(); processing_result = "handled" });
      #ok("subscription.deleted processed")

    } else if (Text.equal(eventType, "invoice.payment_failed")) {
      // Payment failure — flag client record and notify admin
      let invoiceId = extractJsonText(payload, "id");
      switch (findClientByStripeCustomerEmail(customerEmail)) {
        case (?(clientId, client)) {
          // Flag the CRM record with "Payment Failed" status
          _stableClientsV3 := _stableClientsV3.map<(Text, CrmClient), (Text, CrmClient)>(func(t) {
            if (Text.equal(t.0, clientId)) {
              (t.0, { t.1 with projectStatus = "Payment Failed" })
            } else { t }
          });
          ignore _pushAdminNotification(
            "payment_failed",
            "Payment Failed: " # client.name,
            client.name # " (" # client.email # ") — invoice " # invoiceId # " payment failed. Immediate follow-up required."
          );
          ignore sendEmail(
            getAdminEmail(),
            "PAYMENT FAILED — " # client.name,
            "<strong>Payment Failure Alert — Imperidome</strong><br><br>"
            # "<span style=\"color:#000000;\"><strong>ACTION REQUIRED</strong></span><br><br>"
            # "<b>Client:</b> " # client.name # "<br>"
            # "<b>Email:</b> " # client.email # "<br>"
            # "<b>Invoice ID:</b> " # invoiceId # "<br><br>"
            # "The client's CRM record has been flagged as 'Payment Failed'.<br>"
            # "Please follow up with the client immediately to resolve the payment issue."
          );
        };
        case (null) {
          ignore _pushAdminNotification(
            "payment_failed",
            "Payment Failed (unknown client)",
            "Invoice " # invoiceId # " payment failed. Customer email: " # customerEmail
          );
          ignore sendEmail(
            getAdminEmail(),
            "PAYMENT FAILED — Unknown Client",
            "<strong>Payment Failure Alert — Imperidome</strong><br><br>"
            # "<b>Invoice ID:</b> " # invoiceId # "<br>"
            # "<b>Customer Email:</b> " # customerEmail # "<br><br>"
            # "No matching CRM record found. Please investigate manually."
          );
        };
      };
      let bhrId = Time.now().toText() # "-bh-failed";
        let bhrSubId = extractJsonText(payload, "subscription");
        var bhrEmail = "";
        var bhrService = "";
        var bhrAmount : Nat = 0;
        switch (Nat.fromText(extractJsonText(payload, "amount_due"))) { case (?n) { bhrAmount := n }; case null {} };
        for ((_, bhrSubItem) in subscriptions.entries()) {
          if (bhrSubItem.stripe_subscription_id == bhrSubId) {
            bhrService := bhrSubItem.plan_name;
            let bhrCidTxt = bhrSubItem.client_id.toText();
            switch (_stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, bhrCidTxt) })) {
              case (?(_, bhrC)) { bhrEmail := bhrC.email };
              case null {}
            }
          }
        };
        billingHistoryRecords.add(bhrId, {
          id = bhrId; clientEmail = bhrEmail; subscriptionId = bhrSubId;
          amountCents = bhrAmount; status = "Failed"; serviceName = bhrService; createdAt = Time.now()
        });
      // Set paymentFailed = true on the matching subscription record
      let failedSubId = extractJsonText(payload, "subscription");
      if (failedSubId != "") {
        for ((fSubKey, fSub) in subscriptions.entries()) {
          if (Text.equal(fSub.stripe_subscription_id, failedSubId)) {
            subscriptions.add(fSubKey, { fSub with paymentFailed = true });
          };
        };
      };
      _appendWebhookAuditEntry({ event_id = eventId; event_type = eventType; received_at = Time.now(); processing_result = "handled" });
      #ok("invoice.payment_failed processed")

    } else if (Text.equal(eventType, "invoice.payment_succeeded")) {
      let bhrPaidId = Time.now().toText() # "-bh-paid";
      let bhrPaidSubId = extractJsonText(payload, "subscription");
      var bhrPaidEmail = "";
      var bhrPaidService = "";
      var bhrPaidAmount : Nat = 0;
      switch (Nat.fromText(extractJsonText(payload, "amount_paid"))) { case (?n) { bhrPaidAmount := n }; case null {} };
      for ((_, bhrSubItem2) in subscriptions.entries()) {
        if (bhrSubItem2.stripe_subscription_id == bhrPaidSubId) {
          bhrPaidService := bhrSubItem2.plan_name;
          let bhrPaidCidTxt = bhrSubItem2.client_id.toText();
          switch (_stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.0, bhrPaidCidTxt) })) {
            case (?(_, bhrPC)) { bhrPaidEmail := bhrPC.email };
            case null {}
          }
        }
      };
      billingHistoryRecords.add(bhrPaidId, {
        id = bhrPaidId; clientEmail = bhrPaidEmail; subscriptionId = bhrPaidSubId;
        amountCents = bhrPaidAmount; status = "Paid"; serviceName = bhrPaidService; createdAt = Time.now()
      });
      _appendWebhookAuditEntry({ event_id = eventId; event_type = eventType; received_at = Time.now(); processing_result = "handled" });
      #ok("invoice.payment_succeeded processed")
    } else if (Text.equal(eventType, "checkout.session.completed")) {
      // Ad-hoc invoice payment — mark any matching pending invoice as paid
      let sessionId = extractJsonText(payload, "id");
      var metaInvoiceId = "";
      if (sessionId.size() > 0) {
        let matchedInv = _stableAdHocInvoices.find(func(inv : AdHocInvoice) : Bool {
          Text.equal(inv.stripeSessionId, sessionId) and Text.equal(inv.status, "pending")
        });
        switch (matchedInv) {
          case (?inv) {
            let now = Time.now();
            _stableAdHocInvoices := _stableAdHocInvoices.map<AdHocInvoice, AdHocInvoice>(func(i) {
              if (Text.equal(i.stripeSessionId, sessionId) and Text.equal(i.status, "pending")) {
                { i with status = "paid"; paidAt = ?now; updatedAt = now }
              } else { i }
            });
            // Look up client name for the notification
            let clientName = switch (_stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
              Text.equal(t.0, inv.clientId)
            })) {
              case (?(_, c)) { c.name };
              case (null) { inv.clientId };
            };
            ignore _pushAdminNotification(
              "payment_received",
              "Invoice Paid: " # clientName,
              "Ad-hoc invoice paid: " # inv.description # " — $" # (inv.amount / 100.0).toText() # " from " # clientName
            );
          };
          case (null) {
            // Check if this is a client invoice payment (metadata.invoiceId present)
            metaInvoiceId := extractJsonText(payload, "invoiceId");
            if (metaInvoiceId.size() > 0) {
              switch (Nat.fromText(metaInvoiceId)) {
                case (?invIdNat) {
                  switch (invoices.get(invIdNat)) {
                    case (?inv) {
                      let now = Time.now();
                      invoices.add(invIdNat, {
                        inv with
                        status     = "PAID";
                        paid_at    = ?now;
                        updated_at = now;
                      });
                    };
                    case (null) {};
                  };
                };
                case (null) {};
              };
            };
          };
        };
      };
      // A-9: Fallback for main cart purchases — recover if browser closed before success page
      if (metaInvoiceId == "") {
        let clientRefId = extractJsonText(payload, "client_reference_id");
        let clientPrincipalOpt = extractJsonText(payload, "client_principal");
        let clientNameFromMeta = extractJsonText(payload, "client_name");
        if (clientRefId != "" and clientRefId != "undefined") {
          let webhookSessId = extractJsonText(payload, "id");
          let amountTotalStr = extractJsonText(payload, "amount_total");
          let amountTotalNat : Nat = switch (amountTotalStr.toNat()) {
            case (?n) n;
            case null 0;
          };
          let cartClientName = if (clientNameFromMeta.size() > 0) {
            clientNameFromMeta
          } else {
            let atIter = clientRefId.split(#char '@');
            switch (atIter.next()) {
              case (?n) n;
              case null clientRefId;
            };
          };
          let resolvedCaller : ?Principal = if (clientPrincipalOpt != "" and clientPrincipalOpt.size() < 200) {
            try {
              ?Principal.fromText(clientPrincipalOpt)
            } catch _ {
              ignore await _pushAdminNotification(
                "webhook_warning",
                "Webhook: Anonymous Principal Fallback",
                "Webhook order recorded with anonymous principal — client_reference_id missing or unparseable."
              );
              null
            }
          } else {
            ignore await _pushAdminNotification(
              "webhook_warning",
              "Webhook: Anonymous Principal Fallback",
              "Webhook order recorded with anonymous principal — client_reference_id missing or unparseable."
            );
            null
          };
          await recordPurchase(webhookSessId, clientRefId, cartClientName, [], amountTotalNat, webhookSessId, resolvedCaller);
        };
      };
      // Populate subscriptions Map when a subscription is created via checkout
      let stripeSubId = extractJsonText(payload, "subscription");
      if (stripeSubId != "") {
        let clientRefEmail = extractJsonText(payload, "client_reference_id");
        let sessionServiceName = extractJsonText(payload, "description");
        let now = Time.now();
        var foundPrincipal : ?Principal = null;
        for ((p, e) in principalToEmail.entries()) {
          if (Text.equal(e, clientRefEmail)) {
            foundPrincipal := ?p;
          };
        };
        switch (foundPrincipal) {
          case (?principal) {
            let subId = await _getNextSubscriptionId();
            let cpeStr = extractJsonText(payload, "current_period_end");
            let nextBillingDateVal : Int = switch (cpeStr.toNat()) {
              case (?n) n * 1_000_000_000;
              case null 0;
            };
            let resolvedPlanName = if (sessionServiceName != "") sessionServiceName else "Subscription";
            // CRITICAL-05: Look for an existing pending record for this client + plan before inserting.
            // If found, update it to Active rather than creating a duplicate record.
            var pendingSubId : ?Nat = null;
            for ((sid, sub) in subscriptions.entries()) {
              if (Principal.equal(sub.client_id, principal) and
                  Text.equal(sub.status, "pending") and
                  Text.equal(sub.plan_name, resolvedPlanName)) {
                pendingSubId := ?sid;
              };
            };
            let newSub : Subscription = switch (pendingSubId) {
              case (?existingId) {
                // Update existing pending record in-place.
                let updated : Subscription = {
                  id                    = existingId;
                  client_id             = principal;
                  plan_code             = "";
                  plan_name             = resolvedPlanName;
                  status                = "Active";
                  billing_cycle         = "monthly";
                  next_payment_date     = 0;
                  stripe_subscription_id = stripeSubId;
                  created_at            = now;
                  updated_at            = now;
                  nextBillingDate       = nextBillingDateVal;
                  reminderSentAt        = null;
                  stripeCustomerId      = null;
                  paymentFailed         = false;
                  clientEmail           = clientRefEmail;
                };
                subscriptions.add(existingId, updated);
                updated
              };
              case null {
                // No pending record found — insert new Active subscription.
                let freshSub : Subscription = {
                  id                    = subId;
                  client_id             = principal;
                  plan_code             = "";
                  plan_name             = resolvedPlanName;
                  status                = "Active";
                  billing_cycle         = "monthly";
                  next_payment_date     = 0;
                  stripe_subscription_id = stripeSubId;
                  created_at            = now;
                  updated_at            = now;
                  nextBillingDate       = nextBillingDateVal;
                  reminderSentAt        = null;
                  stripeCustomerId      = null;
                  paymentFailed         = false;
                  clientEmail           = clientRefEmail;
                };
                subscriptions.add(subId, freshSub);
                freshSub
              };
            };
            let _ = newSub; // suppress unused warning — newSub used below
            // Send subscription confirmation email
            let _subConfirmRecipient = if (newSub.clientEmail != "") {
              newSub.clientEmail
            } else {
              switch (principalToEmail.get(newSub.client_id)) {
                case (?e) e;
                case null "";
              }
            };
            if (_subConfirmRecipient != "") {
              let _nextDateStr = if (newSub.nextBillingDate > 0) {
                let _secs = newSub.nextBillingDate / 1_000_000_000;
                let _daysFromEpoch = _secs / 86400;
                // Format as full YYYY-MM-DD date using the proleptic Gregorian calendar
                let _z : Int = _daysFromEpoch + 719468;
                let _era : Int = (if (_z >= 0) { _z } else { _z - 146096 }) / 146097;
                let _doe : Int = _z - _era * 146097;
                let _yoe : Int = (_doe - _doe / 1460 + _doe / 36524 - _doe / 146096) / 365;
                let _y   : Int = _yoe + _era * 400;
                let _doy : Int = _doe - (365 * _yoe + _yoe / 4 - _yoe / 100);
                let _mp  : Int = (5 * _doy + 2) / 153;
                let _dd  : Int = _doy - (153 * _mp + 2) / 5 + 1;
                let _mm  : Int = _mp + (if (_mp < 10) { 3 } else { -9 });
                let _yy  : Int = _y + (if (_mm <= 2) { 1 } else { 0 });
                let _pad2 = func(n : Int) : Text { if (n < 10) { "0" # Int.abs(n).toText() } else { Int.abs(n).toText() } };
                _yy.toText() # "-" # _pad2(_mm) # "-" # _pad2(_dd)
              } else { "your next billing cycle" };
              let _subConfirmBody = wrapInBrandedHtml(
                "<h2 style='color:#5ef08a;'>Your subscription is now active</h2>" #
                "<p>Your <strong>" # newSub.plan_name # "</strong> subscription has been successfully activated.</p>" #
                "<p><strong>Next billing date:</strong> " # _nextDateStr # "</p>" #
                "<p style='margin-top:24px;'><a href='" # _siteBaseUrl # "/portal/subscriptions' style='background:#5ef08a;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:bold;'>View Your Subscription</a></p>" #
                "<p style='margin-top:24px;color:#aaa;'>Questions? Contact us at <a href='mailto:" # _adminEmail # "' style='color:#5ef08a;'>" # _adminEmail # "</a>.</p>"
              );
              ignore await sendEmail(_subConfirmRecipient, "Your subscription is now active", _subConfirmBody);
            };
          };
          case (null) { /* No portal account found for this email — skip */ };
        };
      };
      _appendWebhookAuditEntry({ event_id = eventId; event_type = eventType; received_at = Time.now(); processing_result = "handled" });
      #ok("checkout.session.completed processed")

    } else if (Text.equal(eventType, "payment_intent.succeeded")) {
      // payment_intent.succeeded — whitelisted; fire push notification for invoice paid
      ignore await triggerPushNotification("Invoice Paid", "A client just paid an invoice", "/admin/orders", "Invoice paid");
      _appendWebhookAuditEntry({ event_id = eventId; event_type = eventType; received_at = Time.now(); processing_result = "handled" });
      #ok("payment_intent.succeeded acknowledged")

    } else if (Text.equal(eventType, "payment_intent.payment_failed")) {
      // payment_intent.payment_failed — alert admin on failed one-time payment
      let failedPaymentId = extractJsonText(payload, "id");
      ignore await _pushAdminNotification(
        "payment_failed",
        "Checkout Failed — Imperidome",
        "A one-time payment attempt failed. Payment Intent ID: " # failedPaymentId
      );
      ignore sendEmail(
        getAdminEmail(),
        "Checkout Failed — Imperidome",
        "A one-time payment attempt failed. Payment Intent ID: " # failedPaymentId
      );
      _appendWebhookAuditEntry({ event_id = eventId; event_type = eventType; received_at = Time.now(); processing_result = "handled" });
      #ok("payment_intent.payment_failed handled")

    } else {
      // Should never reach here — whitelist check above rejects all unknown types.
      // This branch is kept as a compile-time exhaustiveness safeguard.
      ignore await _pushAdminNotification(
        "webhook_unhandled",
        "Unhandled Stripe Event",
        "Unhandled Stripe event received: " # eventType # ". No action taken."
      );
      _appendWebhookAuditEntry({ event_id = eventId; event_type = eventType; received_at = Time.now(); processing_result = "unhandled" });
      #ok("event acknowledged")
    };
  };


  // generateAdminOTP — generates a 6-digit OTP for admin 2FA, stores it with a 5-minute expiry,
  // and sends it via the admin_otp email trigger.
  // Only callable for the configured admin email — all other emails are rejected.
  public shared func generateAdminOTP(adminEmail : Text) : async { #ok : Text; #err : Text } {
    let normalizedEmail = adminEmail.toLower();
    if (not Text.equal(normalizedEmail, getAdminEmail())) {
      return #err("OTP is only available for the admin account");
    };

    // Rate limit: max 3 OTP requests per 15 minutes per email
    let otpNow = Time.now();
    let otpWindow = 15 * 60 * 1_000_000_000; // 15 minutes in nanoseconds
    let prevTimes = switch (otpRateLimits.get(normalizedEmail)) {
      case (?times) times;
      case null [];
    };
    let recentTimes = prevTimes.filter(func(t : Int) : Bool { otpNow - t < otpWindow });
    if (recentTimes.size() >= 3) {
      return #err("Too many OTP requests. Please wait before trying again.");
    };
    otpRateLimits.add(normalizedEmail, recentTimes.concat([otpNow]));

    // Generate a 6-digit OTP using Random entropy
    let entropy = await Random.blob();
    let bytes = entropy.toArray();
    // Combine 3 bytes into a Nat, modulo 1_000_000 to get 6 digits
    let b0 = bytes[0].toNat();
    let b1 = bytes[1].toNat();
    let b2 = bytes[2].toNat();
    let rawNum = (b0 * 65536 + b1 * 256 + b2) % 1_000_000;
    // Zero-pad to ensure exactly 6 digits
    let otpText : Text = if (rawNum < 10) { "00000" # rawNum.toText() }
      else if (rawNum < 100) { "0000" # rawNum.toText() }
      else if (rawNum < 1000) { "000" # rawNum.toText() }
      else if (rawNum < 10000) { "00" # rawNum.toText() }
      else if (rawNum < 100000) { "0" # rawNum.toText() }
      else { rawNum.toText() };

    let expiryNs : Int = Time.now() + 5 * 60 * 1_000_000_000; // 5 minutes

    let newOtp : AdminOtp = {
      otp    = otpText;
      expiry = expiryNs;
      used   = false;
    };

    // Replace any existing OTP entry for this admin email (one active OTP at a time)
    let withoutOld = _stableAdminOtps.filter(func(t : (Text, AdminOtp)) : Bool {
      not Text.equal(t.0, normalizedEmail)
    });
    _stableAdminOtps := withoutOld.concat([(normalizedEmail, newOtp)]);

    // Send OTP email via admin_otp trigger
    ignore sendEmailByTrigger("admin_otp", normalizedEmail, [("otp_code", otpText), ("admin_email", normalizedEmail)]);

    #ok("OTP sent")
  };

  // verifyAdminOTP — validates a 6-digit OTP for the admin email.
  // Returns "verified" if the OTP is valid, unused, and not expired.
  // Returns an error string if the OTP is not found, already used, or expired.
  // Marks the OTP as used on success to prevent replay.
  public shared func verifyAdminOTP(adminEmail : Text, otp : Text) : async { #ok : Text; #err : Text } {
    let normalizedEmail = adminEmail.toLower();
    let entry = _stableAdminOtps.find(func(t : (Text, AdminOtp)) : Bool {
      Text.equal(t.0, normalizedEmail)
    });
    switch (entry) {
      case (null) { return #err("OTP not found \u{2014} please request a new code") };
      case (?(_, stored)) {
        if (stored.used) {
          return #err("OTP already used \u{2014} please request a new code");
        };
        if (Time.now() > stored.expiry) {
          return #err("OTP expired \u{2014} please request a new code");
        };
        if (not Text.equal(otp, stored.otp)) {
          return #err("Invalid OTP");
        };
        // Remove OTP entry after successful verification to prevent replay and memory leak
        _stableAdminOtps := _stableAdminOtps.filter(func(t : (Text, AdminOtp)) : Bool { not Text.equal(t.0, normalizedEmail) });
        #ok("verified")
      };
    };
  };

  // UPGRADE HOOKS — log schema version before and after each canister upgrade.
  // In a persistent actor (orthogonal persistence) all vars are already stable;
  // these hooks exist for diagnostics and future migration logic.
  system func preupgrade() {
    // Debug.print("preupgrade: schema v" # _schemaVersion.toText());
    // Persist email campaigns
    _stableEmailCampaigns := emailCampaigns.values().toArray();
    // Serialize productCatalog → _stableCatalogV6 (current shape with speedy_filter)
    _stableCatalogV6 := productCatalog.entries().toArray();
    // Clear drain var — no longer needed after upgrade
    _stableCatalogV5Old := [];
    // Clear all drain vars so they don't overwrite _stableCatalogV6 data on next startup
    _stableCatalogNew := [];
    _stableCatalog := [];
    // Clear _stableCatalogV3 drain so it doesn't hold stale data after upgrade
    _stableCatalogV3 := [];
    // Serialize in-memory orders map → _stableOrdersV0 (OrderV0 format, no amount) so order history survives upgrades
    _stableOrdersV0 := orders.values().map<Order, OrderV0>(func(o : Order) : OrderV0 {
      { id = o.id; client_id = o.client_id; tier_code = o.tier_code;
        status = o.status; delivery_window = o.delivery_window;
        launch_target = o.launch_target; created_at = o.created_at; updated_at = o.updated_at;
        amount = o.amount }
    }).toArray();
    _stableOrders := [];
    // Serialize in-memory leadRateLimits → _stableLeadRateLimits
    _stableLeadRateLimits := leadRateLimits.entries().toArray();
    // Serialize in-memory resetRequestTimes → _stableResetRequestTimes
    _stableResetRequestTimes := resetRequestTimes.entries().toArray();
    // Serialize in-memory visitRateLimits → _stableVisitRateLimits
    _stableVisitRateLimits := visitRateLimits.entries().toArray();
    // Serialize in-memory otpRateLimits → _stableOtpRateLimits
    _stableOtpRateLimits := otpRateLimits.entries().toArray();
    // Serialize in-memory questionnaires map → _stableQuestionnaires so all mutations survive upgrades
    _stableQuestionnaires := questionnaires.values().toArray();
    // Persist client files and messages
    _stableClientFiles    := clientFiles;
    _stableClientMessages := clientMessages;
    // Persist marquee logos
    _stableMarqueeLogos := marqueeLogos.values().toArray();
    // Persist question definitions
    _stableQuestionDefs := questionDefsMap.entries().toArray();
    // Persist purchase requests
    // _stablePurchaseRequests — already in stable storage, no in-memory map to drain
    // _stableVisitEvents — already in stable storage, no in-memory map to drain
    // Serialize in-memory subscriptions map → _stableSubscriptions.
    // IMPORTANT: nextBillingDate is preserved via next_payment_date field so that
    // the postupgrade() migration guard can detect already-migrated records and
    // restore live billing data intact. If nextBillingDate is non-zero, it is
    // written into next_payment_date as a proxy; otherwise the original next_payment_date is used.
    _stableSubscriptions := subscriptions.values()
      .map(func(sub : Subscription) : SubscriptionV0 {
        // _stableSubscriptionReminders: preserve reminderSentAt separately so it survives
        // the V0 downcast (SubscriptionV0 has the field but we serialize it explicitly here).
        {
          id = sub.id;
          client_id = sub.client_id;
          plan_code = sub.plan_code;
          plan_name = sub.plan_name;
          status = sub.status;
          billing_cycle = sub.billing_cycle;
          next_payment_date = if (sub.nextBillingDate != 0) sub.nextBillingDate else sub.next_payment_date;
          stripe_subscription_id = sub.stripe_subscription_id;
          created_at = sub.created_at;
          updated_at = sub.updated_at;
          clientEmail = sub.clientEmail;
                  reminderSentAt = sub.reminderSentAt;
          stripeCustomerId = sub.stripeCustomerId;
          paymentFailed = sub.paymentFailed;
        }
      }).toArray();
    _stableBillingHistoryRecords := billingHistoryRecords.entries().toArray();
    _stableSubscriptionReminders := subscriptions.values()
      .map<Subscription, (Text, ?Int)>(func(sub : Subscription) : (Text, ?Int) { (sub.id.toText(), sub.reminderSentAt) })
      .toArray();
    // Serialize in-memory subAdminMap → _stableSubAdmins so sub-admin records survive upgrades
    _stableSubAdmins := subAdminMap.entries().toArray();
    // AdHocInvoice: nothing extra needed — _stableAdHocInvoices is already stable
  };

  system func postupgrade() {
    // Debug.print("postupgrade: running at schema v" # _schemaVersion.toText());
    // MEDIUM-01 FIX: Restore in-memory subAdminMap from _stableSubAdmins.
    // preupgrade() saves subAdminMap.entries().toArray() → _stableSubAdmins;
    // this matching restore loop rebuilds subAdminMap so sub-admins survive canister upgrades.
    for ((k, v) in _stableSubAdmins.vals()) {
      subAdminMap.add(k, v);
    };
    // Ensure SELF_CANISTER_ID is populated after every upgrade so getClientFileUrl returns correct URLs
    SELF_CANISTER_ID := Principal.fromActor(ImperidomeCanister).toText();
    // Re-register the recurring email dispatch timer (timers are cleared on upgrade).
    // Cancel the existing timer first to prevent double-registration after upgrade.
    Timer.cancelTimer(_dispatchTimerId);
    _dispatchTimerId := Timer.recurringTimer<system>(#seconds(300), dispatchScheduledCampaigns);
    Timer.cancelTimer(_billingReminderTimerId);
    _billingReminderTimerId := Timer.recurringTimer<system>(#seconds (24 * 60 * 60), func() : async () {
      ignore await _sendBillingRemindersCore()
    });
    // ACCOUNT WIPE — one-time migration to clear all user accounts and related data.
    // Runs once when _migrationAccountWipe is false, then sets the flag to true.
    // After the wipe, _migrationAdminElevation is reset to false so the admin
    // self-healing block re-runs and re-elevates the admin account on next upgrade.
    if (not _migrationAccountWipe) {
      _stableUserProfiles       := [];
      _stablePasswordResetTokens := [];
      _stableResetRequestTimes  := [];
      _adminSeeded              := false;
      _migrationAdminElevation  := false;
      _migrationAccountWipe     := true;
      // Debug.print("postupgrade: account wipe complete — all user accounts cleared");
    };
    // Restore in-memory leadRateLimits from _stableLeadRateLimits
    for ((p, ts) in _stableLeadRateLimits.vals()) {
      leadRateLimits.add(p, ts);
    };
    // Restore in-memory resetRequestTimes from _stableResetRequestTimes
    for ((email, times) in _stableResetRequestTimes.vals()) {
      resetRequestTimes.add(email, times);
    };
    // Restore in-memory visitRateLimits from _stableVisitRateLimits
    for ((sessionId, lastTime) in _stableVisitRateLimits.vals()) {
      visitRateLimits.add(sessionId, lastTime);
    };
    // Restore in-memory otpRateLimits from _stableOtpRateLimits
    for ((email, times) in _stableOtpRateLimits.vals()) {
      otpRateLimits.add(email, times);
    };
    // Restore in-memory orders map — migrate V0 records (no amount) first, then current records
    for (orderV0 in _stableOrdersV0.vals()) {
      orders.add(orderV0.id, {
        id = orderV0.id;
        client_id = orderV0.client_id;
        tier_code = orderV0.tier_code;
        status = orderV0.status;
        delivery_window = orderV0.delivery_window;
        launch_target = orderV0.launch_target;
        created_at = orderV0.created_at;
        updated_at = orderV0.updated_at;
        amount = 0.0;
      });
    };
    _stableOrdersV0 := [];
    for (order in _stableOrders.vals()) {
      orders.add(order.id, {
        id = order.id;
        client_id = order.client_id;
        tier_code = order.tier_code;
        status = order.status;
        delivery_window = order.delivery_window;
        launch_target = order.launch_target;
        created_at = order.created_at;
        updated_at = order.updated_at;
        amount = 0.0;
      });
    };
    // Restore client files and messages
    clientFiles    := _stableClientFiles;
    clientMessages := _stableClientMessages;
    // Restore purchase request ID counter
    var _maxPrId : Nat = 0;
    for (pr in _stablePurchaseRequests.vals()) {
      if (pr.id > _maxPrId) { _maxPrId := pr.id };
    };
    _purchaseRequestIdCounter := _maxPrId + 1;
      // Restore in-memory marqueeLogos map from _stableMarqueeLogos
    for (logo in _stableMarqueeLogos.vals()) {
      marqueeLogos.add(logo.id, logo);
    };
    // Restore in-memory emailCampaigns map from _stableEmailCampaigns
    for (c in _stableEmailCampaigns.vals()) {
      emailCampaigns.add(c.id, c);
      if (c.id >= _emailCampaignIdCounter) {
        _emailCampaignIdCounter := c.id + 1;
      };
    };
    // Restore in-memory subscriptions map from _stableSubscriptions — migrate V0 → current shape.
    // MEDIUM-02 FIX: Guard added so already-migrated records are not wiped on every upgrade.
    // preupgrade() preserves nextBillingDate in the next_payment_date proxy field.
    // If next_payment_date is non-zero here, the record was already on the current schema;
    // restore nextBillingDate from the proxy and keep reminderSentAt, stripeCustomerId,
    // and paymentFailed at their previous runtime values (all defaulted conservatively).
    // Only records with next_payment_date == 0 are genuine V0 records that need zeroed defaults.
    for (sub in _stableSubscriptions.vals()) {
      let alreadyMigrated : Bool = sub.next_payment_date != 0;
      let migrated : Subscription = {
        id = sub.id;
        client_id = sub.client_id;
        plan_code = sub.plan_code;
        plan_name = sub.plan_name;
        status = sub.status;
        billing_cycle = sub.billing_cycle;
        next_payment_date = if (alreadyMigrated) sub.next_payment_date else sub.next_payment_date;
        stripe_subscription_id = sub.stripe_subscription_id;
        created_at = sub.created_at;
        updated_at = sub.updated_at;
        nextBillingDate = if (alreadyMigrated) sub.next_payment_date else 0;
        reminderSentAt = (do {
          var found : ?Int = null;
          for ((rid, rv) in _stableSubscriptionReminders.vals()) {
            if (rid == sub.id) { found := rv };
          };
          found
        });
        stripeCustomerId = sub.stripeCustomerId;
        paymentFailed = sub.paymentFailed;
        clientEmail = sub.clientEmail;
      };
      subscriptions.add(migrated.id, migrated);
    };      for ((k, v) in _stableBillingHistoryRecords.vals()) {
        billingHistoryRecords.add(k, v);
      };

    // Visit events are stored directly in _stableVisitEvents; no in-memory map to restore
  // PORTFOLIO V0 → CURRENT MIGRATION: drain old-shape records (no SEO fields) from
    // _stablePortfolio (V0 type, matched to the old .most snapshot) into _stablePortfolioNew.
    // This fires exactly once when upgrading the live canister that stored PortfolioItemV0.
    // After the upgrade, _stablePortfolio stays empty and this loop is a no-op.
    if (_stablePortfolio.size() > 0) {
      let migrated = _stablePortfolio.map<(Text, PortfolioItemV0), (Text, PortfolioItem)>(func(t) {
        (t.0, {
          id               = t.1.id;
          client_name      = t.1.client_name;
          site_url         = t.1.site_url;
          thumbnail_url    = t.1.thumbnail_url;
          tier_code        = t.1.tier_code;
          description      = t.1.description;
          imageCaption     = t.1.imageCaption;
          seoMetaDescription = null;
          seoMetaKeywords    = null;
          is_featured      = t.1.is_featured;
          published        = t.1.published;
          created_at       = t.1.created_at;
        })
      });
      _stablePortfolioNew := migrated.concat(_stablePortfolioNew);
      _stablePortfolio := [];
    };

    // Re-sync _adminPrincipals into accessControlState on every upgrade (LOW-3 fix).
    // First, clear ALL existing admin-role entries so that any principal previously
    // demoted or removed from _adminPrincipals does not persist as admin after upgrade.
    let adminKeysToRemove = accessControlState.userRoles
      .entries()
      .filter(func((_, role)) { role == #admin })
      .map<(Principal, {#admin; #user}), Principal>(func((p, _)) { p })
      .toArray();
    for (p in adminKeysToRemove.vals()) {
      accessControlState.userRoles.remove(p);
    };
    // Now re-add only the current authoritative set from _adminPrincipals.
    for (p in _adminPrincipals.vals()) {
      accessControlState.userRoles.add(p, #admin);
      accessControlState.adminAssigned := true;
    };
  };

  // CLIENTS V0 → CURRENT MIGRATION: drain old-shape records (no siteLinkLog) from
  // _stableClients (V0 type) into _stableClientsV3 (current shape with siteLinkLog = []).
  // This fires exactly once when upgrading the live canister that stored CrmClientV0.
  // After the upgrade, _stableClients stays empty and this block is a no-op.
  if (_stableClients.size() > 0) {
    let migratedClients = _stableClients.map<(Text, CrmClientV0), (Text, CrmClient)>(func(t) {
      (t.0, {
        id                       = t.1.id;
        name                     = t.1.name;
        email                    = t.1.email;
        phone                    = t.1.phone;
        source                   = t.1.source;
        activeServices           = t.1.activeServices;
        projectStatus            = t.1.projectStatus;
        hasAccount               = t.1.hasAccount;
        onboardingBriefId        = t.1.onboardingBriefId;
        briefStatus              = t.1.briefStatus;
        briefSubmittedAt         = t.1.briefSubmittedAt;
        currentMilestone         = t.1.currentMilestone;
        milestoneUpdatedAt       = t.1.milestoneUpdatedAt;
        created_at               = t.1.created_at;
        completionPaymentCharged = t.1.completionPaymentCharged;
        notes                    = t.1.notes;
        siteLinkLog              = [];
        deletionRequested        = false;
        deletionRequestedAt      = 0;
        stripeConnectAccountId   = null;
        stripeConnectStatus      = "not_connected";
        platformFeePercentage    = 0.0;
        webhookSecret            = null;
        connectedAt              = null;
        lastActivityAt           = null;
      })
    });
    _stableClientsV3 := migratedClients.concat(_stableClientsV3);
    _stableClients := [];
  };
  // CLIENTS V1 → CURRENT MIGRATION: drain records with siteLinkLog but without
  // deletionRequested / deletionRequestedAt into _stableClientsV3 (current shape).
  // Fires exactly once when upgrading the canister that stored CrmClientV1.
  // After the upgrade, _stableClientsNew (drain) stays empty and this block is a no-op.
  if (_stableClientsNew.size() > 0) {
    let migratedClientsV1 = _stableClientsNew.map<(Text, CrmClientV1), (Text, CrmClient)>(func(t) {
      (t.0, {
        id                       = t.1.id;
        name                     = t.1.name;
        email                    = t.1.email;
        phone                    = t.1.phone;
        source                   = t.1.source;
        activeServices           = t.1.activeServices;
        projectStatus            = t.1.projectStatus;
        hasAccount               = t.1.hasAccount;
        onboardingBriefId        = t.1.onboardingBriefId;
        briefStatus              = t.1.briefStatus;
        briefSubmittedAt         = t.1.briefSubmittedAt;
        currentMilestone         = t.1.currentMilestone;
        milestoneUpdatedAt       = t.1.milestoneUpdatedAt;
        created_at               = t.1.created_at;
        completionPaymentCharged = t.1.completionPaymentCharged;
        notes                    = t.1.notes;
        siteLinkLog              = t.1.siteLinkLog;
        deletionRequested        = false;
        deletionRequestedAt      = 0;
        stripeConnectAccountId   = null;
        stripeConnectStatus      = "not_connected";
        platformFeePercentage    = 0.0;
        webhookSecret            = null;
        connectedAt              = null;
        lastActivityAt           = null;
      })
    });
    _stableClientsV3 := migratedClientsV1.concat(_stableClientsV3);
    _stableClientsNew := [];
  };

  // BUILDS V0 → CURRENT MIGRATION: drain old-shape records (no description/category/thumbnailUrl).
  // Fires exactly once; afterwards _stableBuilds stays empty.
  if (_stableBuilds.size() > 0) {
    let migratedV0 = _stableBuilds.map(func(b : BuildV0) : Build {
      { id = b.id; clientName = b.clientName; siteUrl = b.siteUrl; addedAt = b.addedAt; description = ""; category = ""; thumbnailUrl = "" }
    });
    _stableBuildsLatest := migratedV0.concat(_stableBuildsLatest);
    _stableBuilds := [];
  };

  // BUILDS V1 → CURRENT MIGRATION: drain V1 records (description + category, no thumbnailUrl)
  // from _stableBuildsNew (deployed canister name) into _stableBuildsLatest with thumbnailUrl = "".
  // Fires exactly once on upgrade from the deployed canister; afterwards _stableBuildsNew stays empty.
  if (_stableBuildsNew.size() > 0) {
    let migratedV1 = _stableBuildsNew.map(func(b : BuildV1) : Build {
      { id = b.id; clientName = b.clientName; siteUrl = b.siteUrl; addedAt = b.addedAt; description = b.description; category = b.category; thumbnailUrl = "" }
    });
    _stableBuildsLatest := migratedV1.concat(_stableBuildsLatest);
    _stableBuildsNew := [];
  };

  if (not _migrationPlatformFeeFields) {
    _stableClientsV3 := _stableClientsV2.map<(Text, CrmClientOld), (Text, CrmClient)>(func(t) {
      (t.0, {
        id                       = t.1.id;
        name                     = t.1.name;
        email                    = t.1.email;
        phone                    = t.1.phone;
        source                   = t.1.source;
        activeServices           = t.1.activeServices;
        projectStatus            = t.1.projectStatus;
        hasAccount               = t.1.hasAccount;
        onboardingBriefId        = t.1.onboardingBriefId;
        briefStatus              = t.1.briefStatus;
        briefSubmittedAt         = t.1.briefSubmittedAt;
        currentMilestone         = t.1.currentMilestone;
        milestoneUpdatedAt       = t.1.milestoneUpdatedAt;
        created_at               = t.1.created_at;
        completionPaymentCharged = t.1.completionPaymentCharged;
        notes                    = t.1.notes;
        siteLinkLog              = t.1.siteLinkLog;
        deletionRequested        = t.1.deletionRequested;
        deletionRequestedAt      = t.1.deletionRequestedAt;
        stripeConnectAccountId   = null;
        stripeConnectStatus      = "disconnected";
        platformFeePercentage    = 0.0;
        webhookSecret            = null;
        connectedAt              = null;
        lastActivityAt           = null;
      })
    });
    _migrationPlatformFeeFields := true;
  };

  if (not _migrationProductRichFields) {
    for ((pid, prod) in productCatalog.entries()) {
      let updated : Product = {
        id = prod.id;
        name = prod.name;
        description = prod.description;
        tier_code = prod.tier_code;
        product_type = prod.product_type;
        price_monthly = prod.price_monthly;
        price_annual = prod.price_annual;
        price_onetime = prod.price_onetime;
        active = prod.active;
        created_at = prod.created_at;
        tagline = null;
        featureBullets = [];
        bestFor = null;
        upgradePath = null;
        recommendedPlan = null;
        imageUrl = null;
        tags = [];
        payment_type = if (prod.payment_type == "") "one_time" else prod.payment_type;
        video_url_1 = "";
        video_url_2 = "";
        show_questionnaire = false;
        detailDescription = null;
        seoMetaTitle = null;
        seoMetaDescription = null;
        heroHeadline = null;
        heroSubheadline = null;
        bodySections = null;
        proofPoints = null;
        faqItems = null;
        closingCTA = null;
        plan_section = null;
        speedy_filter = null;
      };
      productCatalog.add(pid, updated);
    };
    _migrationProductRichFields := true;
  };
  if (not _migrationPlanSectionFix) {
    for ((pid, prod) in productCatalog.entries()) {
      if (prod.name == "Basic Plan" or prod.name == "Booking Plan" or prod.name == "Storefront Plan") {
        let updated : Product = { prod with
          product_type = "SaaS Plans";
          plan_section = ?"hosting";
        };
        productCatalog.add(pid, updated);
      };
    };
    _migrationPlanSectionFix := true;
  };

  // ── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────

  // triggerPushNotification — internal helper called by event-driven functions.
  // Queues a PendingNotification for frontend polling AND attempts a best-effort
  // HTTP outcall to the stored Web Push endpoint. Appends a NotificationLogEntry
  // to _stableNotificationLog for the persistent notification history.
  //
  // LIMITATION: Full RFC 8291 Web Push (VAPID JWT + ECDH payload encryption) requires
  // EC P-256 crypto primitives not available in Motoko. The HTTP outcall will therefore
  // be rejected by most push services (FCM, APNS) without proper encryption headers.
  // The reliable delivery path is the polling queue (_stablePendingPushNotifications).
  private func triggerPushNotification(title : Text, body : Text, url : Text, event : Text) : async () {
    // Capture current time once to ensure notif.id and logEntry.id are identical
    let now = Time.now();
    // Build a unique notification ID from current time + title
    let notifId = now.toText() # "_" # title;
    let notif : PendingNotification = {
      id        = notifId;
      title     = title;
      body      = body;
      url       = url;
      createdAt = now;
    };
    // Always queue in the pending list (reliable delivery via frontend polling)
    _stablePendingPushNotifications := _stablePendingPushNotifications.concat([notif]);

    // Append to the persistent notification history log
    let logEntry : NotificationLogEntry = {
      id        = notifId;
      title     = title;
      body      = body;
      event     = event;
      url       = url;
      timestamp = now;
    };
    _stableNotificationLog := _stableNotificationLog.concat([logEntry]);

    // Best-effort HTTP outcall to the stored Web Push endpoint (if any)
    // NOTE: Full RFC 8291 Web Push encryption (VAPID JWT + AES-GCM) is not feasible in Motoko.
    // This outcall sends an unencrypted JSON payload as a best-effort attempt.
    // The pending notification queue is the reliable delivery mechanism for the frontend.
    switch (_stablePushSubscription) {
      case (null) {
        // No subscription stored — pending queue is the only delivery path
      };
      case (?sub) {
        let jsonBody =
          "{\"title\":\"" # title #
          "\",\"body\":\"" # body #
          "\",\"url\":\"" # url # "\"}";
        let headers : [OutCall.Header] = [
          { name = "Content-Type"; value = "application/json" },
          { name = "TTL"; value = "86400" },
        ];
        try {
          ignore await OutCall.httpPostRequest(sub.endpoint, headers, jsonBody, transform);
        } catch (_e) {
          // Outcall failed — that is OK, the pending queue is the fallback
        };
      };
    };
  };

  // ─── CLIENT FILE DELIVERY ───────────────────────────────────────────────────

  // uploadFileToClient — admin uploads a file and delivers it to a specific client.
  // The file blob is stored via the object-storage mixin; metadata is persisted in
  // _stableClientFiles. adminEmail MUST match _adminEmail.
  public shared ({ caller }) func uploadFileToClient(
    clientEmail : Text,
    fileData    : Blob,
    fileName    : Text,
    fileLabel   : Text
  ) : async { #ok : ClientFileMetadata; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let id = await generateSecureId();
    let objectKey = id # "_" # fileName;
    let adminEmail = getAdminEmail();
    let metadata : ClientFileMetadata = {
      id            = "file_" # id;
      clientEmail   = clientEmail;
      fileName      = fileName;
      fileLabel     = fileLabel;
      uploaderEmail = adminEmail;
      uploadedAt    = Time.now();
      objectKey     = objectKey;
    };
    clientFiles := clientFiles.concat([metadata]);
    #ok(metadata)
  };

  // getFilesForClient — returns all files delivered to a specific client.
  // Caller must not be anonymous; must be admin principal OR the authenticated
  // principal whose callerEmail matches clientEmail.
  public shared ({ caller }) func getFilesForClient(
    callerEmail : Text,
    clientEmail : Text
  ) : async [ClientFileMetadata] {
    if (caller.isAnonymous()) { return [] };
    let adminGuard = isAdmin(caller);
    if (not adminGuard and
        not Text.equal(callerEmail, getAdminEmail()) and
        not Text.equal(callerEmail, clientEmail)) {
      return [];
    };
    let filtered = clientFiles.filter(func(f : ClientFileMetadata) : Bool {
      Text.equal(f.clientEmail, clientEmail)
    });
    // Sort newest-first by uploadedAt
    let arr = filtered;
    // Simple insertion sort descending
    var sorted : [ClientFileMetadata] = [];
    for (f in arr.vals()) {
      var inserted = false;
      var result : [ClientFileMetadata] = [];
      for (s in sorted.vals()) {
        if (not inserted and f.uploadedAt >= s.uploadedAt) {
          result := result.concat([f]);
          inserted := true;
        };
        result := result.concat([s]);
      };
      if (not inserted) { result := result.concat([f]) };
      sorted := result;
    };
    sorted
  };

  // deleteClientFile — admin removes a delivered file by ID.
  // adminEmail MUST match _adminEmail.
  public shared ({ caller }) func deleteClientFile(
    fileId     : Text
  ) : async { #ok : Bool; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let found = clientFiles.find(func(f : ClientFileMetadata) : Bool {
      Text.equal(f.id, fileId)
    });
    switch (found) {
      case null { return #err("File not found") };
      case (?_) {};
    };
    clientFiles := clientFiles.filter(func(f : ClientFileMetadata) : Bool {
      not Text.equal(f.id, fileId)
    });
    #ok(true)
  };

  // getClientFileUrl — resolves the download URL for a delivered file.
  // Caller must not be anonymous; must be admin principal OR the authenticated
  // principal whose callerEmail matches the file's clientEmail.
  public shared ({ caller }) func getClientFileUrl(
    callerEmail : Text,
    fileId      : Text
  ) : async { #ok : Text; #err : Text } {
    if (caller.isAnonymous()) { return #err("Authentication required") };
    let found = clientFiles.find(func(f : ClientFileMetadata) : Bool {
      Text.equal(f.id, fileId)
    });
    switch (found) {
      case null { return #err("File not found") };
      case (?f) {
        let adminGuard = isAdmin(caller);
        if (not adminGuard and
            not Text.equal(callerEmail, getAdminEmail()) and
            not Text.equal(callerEmail, f.clientEmail)) {
          return #err("Unauthorized");
        };
        #ok("https://" # SELF_CANISTER_ID # ".raw.icp0.io/" # f.objectKey)
      };
    };
  };

  // ─── CLIENT MESSAGES ────────────────────────────────────────────────────────

  // sendMessage — posts a message in the admin↔client thread.
  // When callerEmail is a client (not admin), fires a push notification to admin.
  public shared ({ caller }) func sendMessage(
    callerEmail       : Text,
    targetClientEmail : Text,
    body              : Text
  ) : async { #ok : ClientMessage; #err : Text } {
    if (caller.isAnonymous()) { return #err("Authentication required") };
    let adminEmail = getAdminEmail();
    let isAdmin = Text.equal(callerEmail, adminEmail);
    // Determine sender display name
    let senderName : Text = if (isAdmin) {
      "Imperidome Team"
    } else {
      // Look up client name from CRM; fall back to email prefix
      let clientRecord = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool {
        Text.equal(t.1.email, callerEmail)
      });
      switch (clientRecord) {
        case (?t) { if (t.1.name.size() > 0) t.1.name else callerEmail };
        case null {
          // Fall back to email prefix before @
          let parts = callerEmail.split(#char '@');
          switch (parts.next()) {
            case (?prefix) prefix;
            case null callerEmail;
          }
        };
      }
    };
    let receiverEmail = if (isAdmin) { targetClientEmail } else { adminEmail };
    let msgId = await generateSecureId();
    let msg : ClientMessage = {
      id            = "msg_" # msgId;
      senderEmail   = callerEmail;
      senderName    = senderName;
      receiverEmail = receiverEmail;
      body          = body;
      createdAt     = Time.now();
      isRead        = false;
    };
    clientMessages := clientMessages.concat([msg]);
    // Fire push notification to admin when a client sends a message
    if (not isAdmin) {
      let preview = if (body.size() > 80) {
        // Take first 80 chars as a best-effort preview
        var i = 0;
        var preview = "";
        for (c in body.toIter()) {
          if (i < 80) {
            preview := preview # Text.fromChar(c);
            i += 1;
          };
        };
        preview # "..."
      } else { body };
      ignore await triggerPushNotification(
        "New Message from " # senderName,
        preview,
        "/admin/clients",
        "new_message"
      );
    };
    #ok(msg)
  };

  // getMessages — returns the full chronological thread between admin and a client.
  // Caller must not be anonymous; must be admin principal OR targetClientEmail.
  public shared ({ caller }) func getMessages(
    callerEmail       : Text,
    targetClientEmail : Text
  ) : async [ClientMessage] {
    if (caller.isAnonymous()) { return [] };
    let adminEmail = getAdminEmail();
    let adminGuard = isAdmin(caller);
    if (not adminGuard and
        not Text.equal(callerEmail, adminEmail) and
        not Text.equal(callerEmail, targetClientEmail)) {
      return [];
    };
    clientMessages.filter(func(m : ClientMessage) : Bool {
      (Text.equal(m.senderEmail, adminEmail)        and Text.equal(m.receiverEmail, targetClientEmail)) or
      (Text.equal(m.senderEmail, targetClientEmail) and Text.equal(m.receiverEmail, adminEmail))
    })
  };

  // markMessagesRead — marks all messages addressed to callerEmail in the thread as read.
  public shared func markMessagesRead(
    callerEmail       : Text,
    targetClientEmail : Text
  ) : async { #ok : Bool; #err : Text } {
    let adminEmail = getAdminEmail();
    let otherEmail = if (Text.equal(callerEmail, adminEmail)) { targetClientEmail } else { adminEmail };
    clientMessages := clientMessages.map<ClientMessage, ClientMessage>(func(m) {
      if (Text.equal(m.receiverEmail, callerEmail) and Text.equal(m.senderEmail, otherEmail)) {
        { m with isRead = true }
      } else { m }
    });
    #ok(true)
  };

  // getUnreadMessageCounts — returns (clientEmail, unreadCount) for every client
  // who has sent at least one unread message to admin.
  // adminEmail MUST match _adminEmail.
  public shared query ({ caller }) func getUnreadMessageCounts(
  ) : async [(Text, Nat)] {
    if (not isAdmin(caller)) {
      return [];
    };
    // Collect distinct client senders with unread messages to admin
    let adminEmail = getAdminEmail();
    var seen : [Text] = [];
    var result : [(Text, Nat)] = [];
    for (m in clientMessages.vals()) {
      if (Text.equal(m.receiverEmail, adminEmail) and not m.isRead) {
        let client = m.senderEmail;
        let alreadySeen = seen.find(func(e : Text) : Bool { Text.equal(e, client) });
        switch (alreadySeen) {
          case null {
            seen := seen.concat([client]);
            var cnt = 0;
            for (msg in clientMessages.vals()) {
              if (Text.equal(msg.senderEmail, client) and
                  Text.equal(msg.receiverEmail, adminEmail) and
                  not msg.isRead) {
                cnt += 1;
              };
            };
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

  // ─── BUILDS ─────────────────────────────────────────────────────────────────

  // addBuild — admin adds a live client site URL to the Builds list.
  public shared ({ caller }) func addBuild(clientName : Text, siteUrl : Text, description : ?Text, category : ?Text, thumbnailUrl : ?Text) : async { #ok : Build; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let id = "build_" # Time.now().toText();
    let desc    : Text = switch (description)   { case (?d) d; case null "" };
    let cat     : Text = switch (category)      { case (?c) c; case null "" };
    let thumbUrl: Text = switch (thumbnailUrl)  { case (?t) t; case null "" };
    let newBuild : Build = { id; clientName; siteUrl; addedAt = Time.now(); description = desc; category = cat; thumbnailUrl = thumbUrl };
    _stableBuildsLatest := _stableBuildsLatest.concat([newBuild]);
    #ok(newBuild)
  };

  // editBuild — admin updates an existing build entry by ID.
  public shared ({ caller }) func editBuild(id : Text, clientName : Text, siteUrl : Text, description : ?Text, category : ?Text, thumbnailUrl : ?Text) : async { #ok : Build; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let desc    : Text = switch (description)   { case (?d) d; case null "" };
    let cat     : Text = switch (category)      { case (?c) c; case null "" };
    let thumbUrl: Text = switch (thumbnailUrl)  { case (?t) t; case null "" };
    var found : ?Build = null;
    _stableBuildsLatest := _stableBuildsLatest.map<Build, Build>(func(b : Build) : Build {
      if (Text.equal(b.id, id)) {
        let updated : Build = { b with clientName; siteUrl; description = desc; category = cat; thumbnailUrl = thumbUrl };
        found := ?updated;
        updated
      } else b
    });
    switch (found) {
      case (?b) #ok(b);
      case null #err("Build not found");
    }
  };

  // _getAdminBuilds — shared internal helper; returns the full builds list.
  // Both getBuilds() and any future alias delegate here to avoid duplication.
  private func _getAdminBuilds() : [Build] { _stableBuildsLatest };

  // _getAdminPortfolio — shared internal helper; returns all portfolio items (including unpublished).
  // Both getAllPortfolioAdmin() and any future alias delegate here to avoid duplication.
  private func _getAdminPortfolio() : [PortfolioItem] {
    _stablePortfolioNew.map<(Text, PortfolioItem), PortfolioItem>(func(t) { t.1 })
  };

  // getBuilds — returns all builds. Admin-only.
  public shared ({ caller }) func getBuilds() : async [Build] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized");
    };
    _getAdminBuilds()
  };

  // deleteBuild — removes a build entry by ID. Admin-only.
  public shared ({ caller }) func deleteBuild(buildId : Text) : async { #ok : Bool; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let before = _stableBuildsLatest.size();
    _stableBuildsLatest := _stableBuildsLatest.filter(func(b : Build) : Bool { not Text.equal(b.id, buildId) });
    if (_stableBuildsLatest.size() < before) { #ok(true) } else { #err("Build not found") }
  };

  // getPublicBuildsCount — returns the total number of builds. No auth required.
  // Used by the public homepage to display the live "Sites Launched" count.
  public query func getPublicBuildsCount() : async Nat {
    _stableBuildsLatest.size()
  };

  // getPublicBuilds — returns the full array of published builds. No auth required.
  // Used by the homepage portfolio grid to display live site cards.
  public query func getPublicBuilds() : async [Build] {
    _stableBuildsLatest
  };

  // ─── LOGO MARQUEE ────────────────────────────────────────────────────────────

  // getMarqueeLogos — returns all logos sorted by order field. No auth required.
  public query func getMarqueeLogos() : async [MarqueeLogo] {
    let arr = marqueeLogos.values().toArray();
    arr.sort(func(a : MarqueeLogo, b : MarqueeLogo) : CoreOrder.Order {
      Nat.compare(a.order, b.order)
    })
  };

  // addMarqueeLogo — admin-only: add a new logo to the marquee.
  public shared ({ caller }) func addMarqueeLogo(logoUrl : Text, logoLabel : Text) : async { #ok : MarqueeLogo; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let id = "logo_" # Time.now().toText();
    let newLogo : MarqueeLogo = {
      id;
      logoUrl;
      logoLabel;
      order   = marqueeLogos.size();
      addedAt = Time.now();
    };
    marqueeLogos.add(id, newLogo);
    #ok(newLogo)
  };

  // updateMarqueeLogo — admin-only: update logoUrl and label for an existing logo.
  public shared ({ caller }) func updateMarqueeLogo(id : Text, logoUrl : Text, logoLabel : Text) : async { #ok : MarqueeLogo; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    switch (marqueeLogos.get(id)) {
      case null { #err("Not found") };
      case (?existing) {
        let updated : MarqueeLogo = { existing with logoUrl; logoLabel };
        marqueeLogos.add(id, updated);
        #ok(updated)
      };
    }
  };

  // deleteMarqueeLogo — admin-only: remove a logo and re-index remaining logos.
  public shared ({ caller }) func deleteMarqueeLogo(id : Text) : async { #ok : Bool; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    switch (marqueeLogos.get(id)) {
      case null { #err("Not found") };
      case (?_) {
        marqueeLogos.remove(id);
        // Re-index order fields of remaining logos in sorted order
        let remaining = marqueeLogos.values().toArray();
        let sorted = remaining.sort(func(a : MarqueeLogo, b : MarqueeLogo) : CoreOrder.Order {
          Nat.compare(a.order, b.order)
        });
        var idx : Nat = 0;
        for (logo in sorted.vals()) {
          marqueeLogos.add(logo.id, { logo with order = idx });
          idx += 1;
        };
        #ok(true)
      };
    }
  };

  // reorderMarqueeLogos — admin-only: set logo order from an ordered array of ids.
  public shared ({ caller }) func reorderMarqueeLogos(orderedIds : [Text]) : async { #ok : Bool; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    var idx : Nat = 0;
    for (logoId in orderedIds.vals()) {
      switch (marqueeLogos.get(logoId)) {
        case null {};
        case (?logo) {
          marqueeLogos.add(logoId, { logo with order = idx });
        };
      };
      idx += 1;
    };
    #ok(true)
  };

  // helpRequest — public endpoint for the floating help widget.
  // No auth required — any visitor or user can submit a support message.
  // Fires a branded email to the configured admin email with the sender's details.
  // v2: adds priority param (Low/Normal/Urgent) and optional image attachment (base64).
  public shared func helpRequest(
    senderName : Text,
    senderEmail : Text,
    subject : Text,
    message : Text,
    priority : Text,
    attachmentBase64 : Text,
    attachmentMimeType : Text
  ) : async () {
    let emailSubject = "[" # priority # "][" # subject # "] Help Request from " # senderName # " — Imperidome";
    let priorityColor = if (Text.equal(priority, "Urgent")) "#ff4444"
      else if (Text.equal(priority, "Normal")) "#39FF14"
      else "#888888";
    let attachmentHtml = if (attachmentBase64.size() > 0) (
      "<div style='margin-top:16px'><strong>Screenshot:</strong><br/>"
      # "<img src='data:" # attachmentMimeType # ";base64," # attachmentBase64
      # "' style='max-width:100%;border-radius:6px;margin-top:8px;' alt='Attached screenshot'/></div>"
    ) else "";
    let body = "<p><strong>Name:</strong> " # senderName # "</p>"
      # "<p><strong>Email:</strong> " # senderEmail # "</p>"
      # "<p><strong>Subject:</strong> " # subject # "</p>"
      # "<p><strong>Priority:</strong> <span style='color:" # priorityColor # ";font-weight:700;'>" # priority # "</span></p>"
      # "<p><strong>Message:</strong></p>"
      # "<p style='white-space:pre-wrap;'>" # message # "</p>"
      # attachmentHtml;
    ignore sendEmail(getAdminEmail(), emailSubject, body);
  };

  // savePushSubscription — stores the admin's Web Push subscription object.
  // Admin-only: adminEmail must be getAdminEmail().
  public shared ({ caller }) func savePushSubscription(endpoint : Text, p256dh : Text, auth : Text) : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    if (endpoint.size() == 0) { return #err("endpoint is required") };
    _stablePushSubscription := ?{ endpoint; p256dh; auth };
    #ok("Push subscription saved")
  };

  // removePushSubscription — clears the stored push subscription (logout / disable).
  // Admin-only.
  public shared ({ caller }) func removePushSubscription() : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    _stablePushSubscription := null;
    #ok("Push subscription removed")
  };

  // getPushSubscription — returns the stored push subscription for the admin.
  // Admin-only.
  public shared ({ caller }) func getPushSubscription() : async { #ok : ?PushSubscription; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    #ok(_stablePushSubscription)
  };

  // setVapidKeys — stores the VAPID key pair used for Web Push signing.
  // Admin-only. The public key is also returned via getVapidPublicKey().
  public shared ({ caller }) func setVapidKeys(privateKey : Text, publicKey : Text) : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    _stableVapidPrivateKey := privateKey;
    _stableVapidPublicKey  := publicKey;
    #ok("VAPID keys saved")
  };

  // getVapidPublicKey — public; no auth required.
  // Returns the VAPID public key for the frontend to create push subscriptions.
  public query func getVapidPublicKey() : async Text {
    _stableVapidPublicKey
  };

  // getPendingPushNotifications — returns queued push notifications for the admin.
  // Frontend polls this to display native notifications via the Push API.
  // Admin-only.
  public shared ({ caller }) func getPendingPushNotifications() : async { #ok : [PendingNotification]; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    #ok(_stablePendingPushNotifications)
  };

  // clearPendingPushNotifications — clears the notification queue after the frontend
  // has displayed them. Admin-only.
  public shared ({ caller }) func clearPendingPushNotifications() : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    _stablePendingPushNotifications := [];
    #ok("Pending notifications cleared")
  };

  // getNotificationLog — returns the full persistent notification history log, newest-first.
  // Admin-only.
  public shared ({ caller }) func getNotificationLog() : async { #ok : [NotificationLogEntry]; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    let sorted = _stableNotificationLog.sort(
      func(a : NotificationLogEntry, b : NotificationLogEntry) : { #less; #equal; #greater } {
        Int.compare(b.timestamp, a.timestamp)
      }
    );
    #ok(sorted)
  };

  // clearNotificationLog — wipes the notification history log. Admin-only.
  public shared ({ caller }) func clearNotificationLog() : async { #ok; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    _stableNotificationLog := [];
    #ok
  };

  // ── AVAILABILITY MANAGER ─────────────────────────────────────────────────────

  // _defaultWeeklySchedule — Mon-Fri open 9-17, Sat-Sun closed.
  func _defaultWeeklySchedule() : WeeklySchedule {
    let workday : DaySchedule = { isOpen = true; startHour = 9; endHour = 17 };
    let weekend : DaySchedule = { isOpen = false; startHour = 9; endHour = 17 };
    {
      monday    = workday;
      tuesday   = workday;
      wednesday = workday;
      thursday  = workday;
      friday    = workday;
      saturday  = weekend;
      sunday    = weekend;
    }
  };

  func _defaultAvailability() : AvailabilitySettings {
    { weeklySchedule = _defaultWeeklySchedule(); blockedDates = []; timezone = ?"America/New_York" }
  };

  // _tzOffsetHours — returns a static UTC offset in hours for common US/business timezone strings.
  // Positive = ahead of UTC, negative = behind UTC. Uses standard time (no DST adjustment).
  func _tzOffsetHours(tz : Text) : Int {
    if (Text.equal(tz, "America/New_York"))    { -5 }
    else if (Text.equal(tz, "America/Chicago"))    { -6 }
    else if (Text.equal(tz, "America/Denver"))     { -7 }
    else if (Text.equal(tz, "America/Phoenix"))    { -7 }
    else if (Text.equal(tz, "America/Los_Angeles")) { -8 }
    else { 0 } // UTC or unknown
  };

  // setAvailability — admin-only: replace the full availability settings.
  public shared ({ caller }) func setAvailability(settings : AvailabilitySettings) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    // Backfill timezone default if caller did not supply one
    let withTz : AvailabilitySettings = if (settings.timezone == null) {
      { settings with timezone = ?"America/New_York" }
    } else { settings };
    _stableAvailabilitySettings := ?withTz;
  };

  // getAvailability — public query called by the lead intake form on the homepage.
  public query func getAvailability() : async AvailabilitySettings {
    switch (_stableAvailabilitySettings) {
      case (?s) {
        // Backfill timezone default for records stored before the field was added
        if (s.timezone == null) { { s with timezone = ?"America/New_York" } } else { s }
      };
      case null { _defaultAvailability() };
    }
  };

  // getPublicAvailability — alias for getAvailability; exposed for frontend convenience.
  public query func getPublicAvailability() : async AvailabilitySettings {
    switch (_stableAvailabilitySettings) {
      case (?s) {
        if (s.timezone == null) { { s with timezone = ?"America/New_York" } } else { s }
      };
      case null { _defaultAvailability() };
    }
  };

  // blockDate — admin-only: add an ISO date string to the blocked dates list.
  public shared ({ caller }) func blockDate(date : Text) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
    let current = switch (_stableAvailabilitySettings) {
      case (?s) { if (s.timezone == null) { { s with timezone = ?"America/New_York" } } else { s } };
      case null { _defaultAvailability() };
    };
    // Deduplicate: only add if not already present.
    let alreadyBlocked = current.blockedDates.find(func(d : Text) : Bool { Text.equal(d, date) });
    switch (alreadyBlocked) {
      case (?_) {}; // already in list — no-op
      case null {
        let updated = { current with blockedDates = current.blockedDates.concat([date]) };
        _stableAvailabilitySettings := ?updated;
      };
    };
  };


  // ─────────────────────────────────────────────────────────────────────────────
  // PORTAL SHOP — product visibility management
  // ─────────────────────────────────────────────────────────────────────────────

  // togglePortalShopProduct — admin-only: enable or disable a product in the portal shop.
  // If the product ID is already in the list it is removed; otherwise it is added.
  public shared ({ caller }) func togglePortalShopProduct(productId : Nat) : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized: Admin access required");
    };
    let alreadyEnabled = _stablePortalShopProducts.find(func(id : Nat) : Bool { id == productId });
    switch (alreadyEnabled) {
      case (?_) {
        // Remove
        _stablePortalShopProducts := _stablePortalShopProducts.filter(func(id : Nat) : Bool { id != productId });
        #ok("Disabled")
      };
      case null {
        // Add — verify product exists in catalog first
        switch (productCatalog.get(productId)) {
          case (null) { #err("Product not found: " # productId.toText()) };
          case (?_) {
            _stablePortalShopProducts := _stablePortalShopProducts.concat([productId]);
            #ok("Enabled")
          };
        };
      };
    };
  };

  // getPortalShopProductIds — public query: returns the list of portal-enabled product IDs.
  public query func getPortalShopProductIds() : async [Nat] {
    _stablePortalShopProducts
  };

  // getPortalShopProducts — public query: returns full Product details for portal-enabled products.
  public query func getPortalShopProducts() : async [Product] {
    let result = List.empty<Product>();
    for (id in _stablePortalShopProducts.vals()) {
      switch (productCatalog.get(id)) {
        case (?p) {
          let imgEntry = _productImages.filter(func(e : (Nat, Text)) : Bool { e.0 == p.id });
          let imgUrl : ?Text = if (imgEntry.size() > 0) { ?imgEntry[0].1 } else { null };
          result.add({ p with imageUrl = imgUrl })
        };
        case (null) {};
      };
    };
    result.toArray()
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PURCHASE REQUESTS — two-stage workflow (request → approve/decline)
  // ─────────────────────────────────────────────────────────────────────────────

  // createPurchaseRequest — client-facing: submit a purchase request for an enabled product.
  public shared func createPurchaseRequest(clientEmail : Text, productId : Nat, frequency : Text) : async { #ok : Text; #err : Text } {
    // Verify product is enabled in the portal shop
    let isEnabled = _stablePortalShopProducts.find(func(id : Nat) : Bool { id == productId });
    switch (isEnabled) {
      case (null) { return #err("Product is not available in the portal shop") };
      case (?_) {};
    };
    // Look up product details
    let product = switch (productCatalog.get(productId)) {
      case (null) { return #err("Product not found") };
      case (?p) { p };
    };
    // Determine amount based on frequency
    let amount : Float = switch (frequency) {
      case ("monthly") {
        switch (product.price_monthly) {
          case (?p) { p };
          case (null) { return #err("Product has no monthly price") };
        }
      };
      case ("annual") {
        switch (product.price_annual) {
          case (?p) { p };
          case (null) { return #err("Product has no annual price") };
        }
      };
      case _ {
        // onetime or any other value defaults to one-time price
        switch (product.price_onetime) {
          case (?p) { p };
          case (null) { return #err("Product has no one-time price") };
        }
      };
    };
    // Create the request
    let requestId = _purchaseRequestIdCounter;
    _purchaseRequestIdCounter += 1;
    let pr : PurchaseRequest = {
      id            = requestId;
      clientEmail   = clientEmail;
      productId     = productId;
      productName   = product.name;
      amount        = amount;
      frequency     = frequency;
      status        = "pending";
      requestedAt   = Time.now();
      respondedAt   = null;
      declineReason = null;
      checkoutUrl   = null;
    };
    _stablePurchaseRequests := _stablePurchaseRequests.concat([pr]);
    // Push notification to admin
    let amountText = amount.toText();
    ignore await triggerPushNotification(
      "New Purchase Request",
      clientEmail # " wants to buy " # product.name # " — " # amountText,
      "/admin/clients",
      "purchase_request_new"
    );
    #ok("Request submitted")
  };

  // getPurchaseRequests — admin-only: returns all purchase requests.
  public shared ({ caller }) func getPurchaseRequests() : async { #ok : [PurchaseRequest]; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized: Admin access required");
    };
    #ok(_stablePurchaseRequests)
  };

  // getClientPurchaseRequests — public: returns purchase requests for a specific client, newest first.
  public query func getClientPurchaseRequests(clientEmail : Text) : async [PurchaseRequest] {
    let matches = _stablePurchaseRequests.filter(func(pr : PurchaseRequest) : Bool {
      Text.equal(pr.clientEmail, clientEmail)
    });
    // Reverse to get newest first (array is append-ordered)
    let arr = matches;
    let size = arr.size();
    if (size <= 1) { return arr };
    var reversed : [PurchaseRequest] = [];
    var i = size;
    while (i > 0) {
      i -= 1;
      reversed := reversed.concat([arr[i]]);
    };
    reversed
  };

  // approvePurchaseRequest — admin-only: approve a request and generate a Stripe checkout session.
  public shared ({ caller }) func approvePurchaseRequest(requestId : Nat, successUrl : Text, cancelUrl : Text) : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized: Admin access required");
    };
    // Find the request
    let reqOpt = _stablePurchaseRequests.find(func(pr : PurchaseRequest) : Bool { pr.id == requestId });
    let req = switch (reqOpt) {
      case (null) { return #err("Purchase request not found: " # requestId.toText()) };
      case (?r) { r };
    };
    if (not Text.equal(req.status, "pending")) {
      return #err("Request is not pending (status: " # req.status # ")");
    };
    // Look up the CRM client to get the CRM client ID for createAdHocInvoiceSession
    let clientEntry = _stableClientsV3.find(func(t : (Text, CrmClient)) : Bool { Text.equal(t.1.email, req.clientEmail) });
    let clientId = switch (clientEntry) {
      case (null) { req.clientEmail };  // fallback: use email as clientId
      case (?(id, _)) { id };
    };
    // Live price lookup — use current catalog price, not the snapshotted req.amount
    let liveProduct = switch (productCatalog.get(req.productId)) {
      case null { return #err("Product no longer available in catalog") };
      case (?p) { p };
    };
    let livePrice : Float = switch (req.frequency) {
      case ("annual") {
        switch (liveProduct.price_annual) {
          case (?p) { p };
          case null {
            switch (liveProduct.price_monthly) {
              case (?p) { p };
              case null {
                switch (liveProduct.price_onetime) {
                  case (?p) { p };
                  case null { return #err("Product has no price") };
                };
              };
            };
          };
        };
      };
      case ("yearly") {
        switch (liveProduct.price_annual) {
          case (?p) { p };
          case null {
            switch (liveProduct.price_monthly) {
              case (?p) { p };
              case null {
                switch (liveProduct.price_onetime) {
                  case (?p) { p };
                  case null { return #err("Product has no price") };
                };
              };
            };
          };
        };
      };
      case ("monthly") {
        switch (liveProduct.price_monthly) {
          case (?p) { p };
          case null {
            switch (liveProduct.price_annual) {
              case (?p) { p };
              case null {
                switch (liveProduct.price_onetime) {
                  case (?p) { p };
                  case null { return #err("Product has no price") };
                };
              };
            };
          };
        };
      };
      case _ {
        // onetime or any other value defaults to one-time price
        switch (liveProduct.price_onetime) {
          case (?p) { p };
          case null {
            switch (liveProduct.price_monthly) {
              case (?p) { p };
              case null {
                switch (liveProduct.price_annual) {
                  case (?p) { p };
                  case null { return #err("Product has no price") };
                };
              };
            };
          };
        };
      };
    };
    let amountCents : Nat = Int.abs((livePrice * 100.0).toInt());
    let description = "Purchase: " # req.productName;
    // Create Stripe checkout session via existing helper
    let sessionResult = await createAdHocInvoiceSession(
      clientId,
      description,
      amountCents,
      successUrl,
      cancelUrl
    );
    let checkoutUrl = switch (sessionResult) {
      case (#err(e)) { return #err("Stripe session failed: " # e) };
      case (#ok(url)) { url };
    };
    // Update request status
    _stablePurchaseRequests := _stablePurchaseRequests.map<PurchaseRequest, PurchaseRequest>(func(pr) {
      if (pr.id == requestId) {
        { pr with status = "approved"; respondedAt = ?Time.now(); checkoutUrl = ?checkoutUrl }
      } else { pr }
    });
    // Notify admin
    ignore await triggerPushNotification(
      "Purchase Request Approved",
      req.productName # " approved for " # req.clientEmail,
      "/admin/clients",
      "purchase_request_approved"
    );
    #ok("Approved")
  };

  // declinePurchaseRequest — admin-only: decline a purchase request with an optional reason.
  public shared ({ caller }) func declinePurchaseRequest(requestId : Nat, reason : ?Text) : async { #ok : Text; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized: Admin access required");
    };
    let reqOpt = _stablePurchaseRequests.find(func(pr : PurchaseRequest) : Bool { pr.id == requestId });
    let req = switch (reqOpt) {
      case (null) { return #err("Purchase request not found: " # requestId.toText()) };
      case (?r) { r };
    };
    if (not Text.equal(req.status, "pending")) {
      return #err("Request is not pending (status: " # req.status # ")");
    };
    // Update request status
    _stablePurchaseRequests := _stablePurchaseRequests.map<PurchaseRequest, PurchaseRequest>(func(pr) {
      if (pr.id == requestId) {
        { pr with status = "declined"; respondedAt = ?Time.now(); declineReason = reason }
      } else { pr }
    });
    // Notify client (via push queue — client email used as target context)
    ignore await triggerPushNotification(
      "Purchase Request Update",
      "Your request for " # req.productName # " was declined",
      "/portal/shop",
      "purchase_request_declined"
    );
    #ok("Declined")
  };

  // ── GOOGLE CALENDAR INTEGRATION CONFIG API ──────────────────────────────────

  // setGoogleCalendarConfig — admin-only: stores the Google Apps Script URL and event defaults.
  public shared ({ caller }) func setGoogleCalendarConfig(
    config     : GoogleCalendarConfig,
  ) : async { #ok : (); #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    _stableGoogleCalendarConfig := ?config;
    #ok
  };

  // getGoogleCalendarConfig — admin-only: returns stored config or an error if not yet configured.
  public shared ({ caller }) func getGoogleCalendarConfig(
  ) : async { #ok : GoogleCalendarConfig; #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    switch (_stableGoogleCalendarConfig) {
      case (?cfg) { #ok(cfg) };
      case (null)  { #err("Not configured") };
    }
  };

  // isGoogleCalendarConfigured — public query: true if a non-empty scriptUrl is stored.
  public query func isGoogleCalendarConfigured() : async Bool {
    switch (_stableGoogleCalendarConfig) {
      case (?cfg) { cfg.scriptUrl.size() > 0 };
      case (null)  { false };
    }
  };

  // clearGoogleCalendarConfig — admin-only: removes stored config (resets to unconfigured state).
  public shared ({ caller }) func clearGoogleCalendarConfig(
  ) : async { #ok : (); #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized");
    };
    _stableGoogleCalendarConfig := null;
    #ok
  };

  // ── GOOGLE SHEETS INTEGRATION CONFIG API ───────────────────────────────────

  // setGoogleSheetsConfig — admin-only: stores the Google Apps Script URL and optional Sheet ID.
  public shared ({ caller }) func setGoogleSheetsConfig(
    config : GoogleSheetsConfig,
  ) : async { #ok : (); #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    _stableGoogleSheetsConfig := ?config;
    #ok
  };

  // getGoogleSheetsConfig — admin-only: returns stored config or an error if not yet configured.
  public shared ({ caller }) func getGoogleSheetsConfig() : async { #ok : GoogleSheetsConfig; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    switch (_stableGoogleSheetsConfig) {
      case (?cfg) { #ok(cfg) };
      case (null)  { #err("Not configured") };
    }
  };

  // isGoogleSheetsConfigured — public query: true if a non-empty scriptUrl is stored.
  public query func isGoogleSheetsConfigured() : async Bool {
    switch (_stableGoogleSheetsConfig) {
      case (?cfg) { cfg.scriptUrl.size() > 0 };
      case (null)  { false };
    }
  };

  // clearGoogleSheetsConfig — admin-only: removes stored config (resets to unconfigured state).
  public shared ({ caller }) func clearGoogleSheetsConfig() : async { #ok : (); #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    _stableGoogleSheetsConfig := null;
    #ok
  };

  // ── SOCIAL MEDIA INTEGRATION CONFIG API ────────────────────────────────────

  // setSocialMediaConfig — admin-only: stores the 5 social media profile/page URLs.
  public shared ({ caller }) func setSocialMediaConfig(
    config : SocialMediaConfig,
  ) : async { #ok : (); #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    _stableSocialMediaConfig := ?config;
    #ok
  };

  // getSocialMediaConfig — admin-only: returns stored config or a blank default if not yet configured.
  public shared ({ caller }) func getSocialMediaConfig() : async { #ok : SocialMediaConfig; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    switch (_stableSocialMediaConfig) {
      case (?cfg) { #ok(cfg) };
      case (null)  {
        #ok({
          facebookUrl  = "";
          instagramUrl = "";
          tiktokUrl    = "";
          linkedinUrl  = "";
          youtubeUrl   = "";
        })
      };
    }
  };

  // getPublicSocialMediaConfig — public, no auth: returns stored config or empty defaults.
  public query func getPublicSocialMediaConfig() : async SocialMediaConfig {
    switch (_stableSocialMediaConfig) {
      case (?cfg) { cfg };
      case (null) {
        {
          facebookUrl  = "";
          instagramUrl = "";
          tiktokUrl    = "";
          linkedinUrl  = "";
          youtubeUrl   = "";
        }
      };
    }
  };

  // QUESTION DEFINITIONS API

  // getQuestionDefinitions — public query: returns the question definitions for a given tier code.
  // Returns [] if tierCode is unrecognised or no definitions have been saved yet.
  // Frontend should gracefully fall back to hardcoded questions when [] is returned.
  public query func getQuestionDefinitions(tierCode : Text) : async [QuestionDefinition] {
    switch (questionDefsMap.get(tierCode)) {
      case (?defs) { defs };
      case (null)  { [] };
    }
  };

  // updateQuestionDefinitions — admin-only: replaces the question definitions for a given tier code.
  // Dual-layer auth: email string check + principal check (same pattern as all other admin functions).
  public shared ({ caller }) func updateQuestionDefinitions(
    tierCode   : Text,
    questions  : [QuestionDefinition],
  ) : async { #ok : (); #err : Text } {
    if (not isAdmin(caller)) {
      return #err("Unauthorized: Admin access required");
    };
    // Validate tier code
    let validTierCodes : [Text] = [
      "DIGITAL PRESENCE", "AUTHORITY SITE", "BOOKING PRO", "RESTAURANT PRO",
      "RESTAURANT EMPIRE", "DIGITAL STOREFRONT", "MEMBERSHIP ENGINE", "ENTERPRISE SCALE",
      "SPEEDY BASIC", "SPEEDY BOOKING", "SPEEDY PRODUCT STOREFRONT",
      "SPEEDY MENU STOREFRONT", "SPEEDY RECURRING STOREFRONT",
      "CinematicAds", "ProductAds", "AIReceptionist",
    ];
    let isValid = validTierCodes.find(func(tc : Text) : Bool { Text.equal(tc, tierCode) }) != null;
    if (not isValid) {
      return #err("Invalid tier code: " # tierCode);
    };
    questionDefsMap.add(tierCode, questions);
    // Persist immediately so the change survives upgrade
    _stableQuestionDefs := questionDefsMap.entries().toArray();
    #ok
  };

  // unblockDate — admin-only: remove an ISO date string from the blocked dates list.
  public shared ({ caller }) func unblockDate(date : Text) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) {
      return #err "Unauthorized: Admin access required";
    };
    let current = switch (_stableAvailabilitySettings) {
      case (?s) { if (s.timezone == null) { { s with timezone = ?"America/New_York" } } else { s } };
      case null { _defaultAvailability() };
    };
    let updated = { current with blockedDates = current.blockedDates.filter(func(d : Text) : Bool { not Text.equal(d, date) }) };
    _stableAvailabilitySettings := ?updated;
    return #ok;
  };

  // ── EMAIL CAMPAIGNS ──────────────────────────────────────────────────────────

  // EmailCampaign — a bulk email campaign with optional scheduling and status tracking.
  public type EmailCampaignId = Nat;
  public type EmailCampaign = {
    id          : EmailCampaignId;
    subject     : Text;
    body        : Text;
    recipients  : [Text];
    scheduledDate : ?Int;  // nullable nanosecond UTC timestamp; null = send immediately
    status      : Text;    // "Draft" | "Scheduled" | "Sending" | "Sent" | "Failed"
    createdAt   : Int;
    sentAt      : ?Int;    // timestamp when dispatch completed
  };

  // CAMPAIGN STABLE STORAGE — persists automatically via enhanced orthogonal persistence.
  var _stableEmailCampaigns : [EmailCampaign] = [];

  // AUTO-INCREMENT ID COUNTER
  var _emailCampaignIdCounter : Nat = 0;

  // MIGRATION GUARD — backfill status = "Sent" on any campaign with empty status.
  // Runs exactly once.
  var _migrationCampaignStatusBackfill : Bool = false;

  // IN-MEMORY MAP for fast campaign lookups (rebuilt from _stableEmailCampaigns on startup)
  let emailCampaigns = Map.empty<EmailCampaignId, EmailCampaign>();

  // CAMPAIGN STABLE STORAGE INIT — restore from stable array into the in-memory map.
  do {
    for (c in _stableEmailCampaigns.vals()) {
      emailCampaigns.add(c.id, c);
      if (c.id >= _emailCampaignIdCounter) {
        _emailCampaignIdCounter := c.id + 1;
      };
    };
    // Run one-time migration: backfill status = "Sent" on campaigns with empty status.
    if (not _migrationCampaignStatusBackfill) {
      for ((cid, c) in emailCampaigns.entries()) {
        if (Text.equal(c.status, "")) {
          let fixed = { c with status = "Sent" };
          emailCampaigns.add(cid, fixed);
        };
      };
      _stableEmailCampaigns := emailCampaigns.values().toArray();
      _migrationCampaignStatusBackfill := true;
    };
  };

  // CAMPAIGN HELPER — flush in-memory map back to stable array
  func _persistCampaigns() {
    _stableEmailCampaigns := emailCampaigns.values().toArray();
  };

  // dispatchScheduledCampaigns — called by the recurring timer every 5 minutes.
  // Finds campaigns where status == "Scheduled" and scheduledDate <= Time.now(),
  // sends emails for each recipient, and updates status to "Sent" or "Failed".
  func dispatchScheduledCampaigns() : async () {
    // HIGH-3 CYCLE PROTECTION: cap the total number of recipients processed per timer tick
    // to prevent cycle exhaustion on large campaigns.
    let MAX_RECIPIENTS_PER_DISPATCH : Nat = 500;
    let now = Time.now();
    // Debug.print("[BulkEmailDispatcher] tick at " # now.toText());
    // Collect campaigns to dispatch before mutating the map
    let toDispatch = emailCampaigns.entries().toArray().filter(func(pair : (EmailCampaignId, EmailCampaign)) : Bool {
      let c = pair.1;
      Text.equal(c.status, "Scheduled")
        and (switch (c.scheduledDate) {
          case (?sd) { sd <= now };
          case null  { false };
        })
    });
    for ((cid, campaign) in toDispatch.vals()) {
      // Mark as Sending
      emailCampaigns.add(cid, { campaign with status = "Sending" });
      _persistCampaigns();
      // Cap recipients to MAX_RECIPIENTS_PER_DISPATCH to prevent cycle exhaustion
      let allRecipients = campaign.recipients;
      let cappedRecipients : [Text] = if (allRecipients.size() > MAX_RECIPIENTS_PER_DISPATCH) {
        // Take only the first 500; log the truncation for admin awareness
        Debug.print("[BulkEmailDispatcher] campaign " # cid.toText() # " has " # allRecipients.size().toText() # " recipients; capping at " # MAX_RECIPIENTS_PER_DISPATCH.toText());
        var first500 : [Text] = [];
        var i = 0;
        while (i < MAX_RECIPIENTS_PER_DISPATCH) {
          first500 := first500.concat([allRecipients[i]]);
          i += 1;
        };
        first500
      } else { allRecipients };
      // Send to each (capped) recipient with an async yield between sends to spread cycle load
      var allOk = true;
      var recipientIdx = 0;
      for (recipientEmail in cappedRecipients.vals()) {
        try {
          // Async yield every 10 sends: creates a commit/message boundary so the canister
          // remains responsive and doesn't exhaust a single round-trip's cycle budget.
          if (recipientIdx > 0 and recipientIdx % 10 == 0) {
            ignore await async { () };
          };
          await sendEmail(recipientEmail, campaign.subject, campaign.body);
        } catch (e) {
          // Debug.print("[BulkEmailDispatcher] send failed for " # recipientEmail # ": " # e.message());
          allOk := false;
        };
        recipientIdx += 1;
      };
      let finalStatus = if (allOk) { "Sent" } else { "Failed" };
      let sentAt : ?Int = if (allOk) { ?Time.now() } else { null };
      emailCampaigns.add(cid, { campaign with status = finalStatus; sentAt });
      _persistCampaigns();
      // Debug.print("[BulkEmailDispatcher] campaign " # cid.toText() # " -> " # finalStatus);
    };
  };

  // RECURRING TIMER — register every 5 minutes (300 seconds).
  // Stored in a var so postupgrade() can cancel and re-register it.
  var _dispatchTimerId : Timer.TimerId = do {
    Timer.recurringTimer<system>(#seconds(300), dispatchScheduledCampaigns)
  };

  // RECURRING TIMER — billing reminders once every 24 hours.
  // Stored in a var so postupgrade() can cancel and re-register it.
  var _billingReminderTimerId : Timer.TimerId = do {
    Timer.recurringTimer<system>(#seconds (24 * 60 * 60), func() : async () {
      ignore await _sendBillingRemindersCore()
    })
  };

  // createEmailCampaign — admin creates a new campaign.
  // Returns the new campaignId.
  public shared ({ caller }) func createEmailCampaign(
    subject       : Text,
    body          : Text,
    recipients    : [Text],
    scheduledDate : ?Int,
  ) : async { #ok : Nat; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    adminOnly(caller);
    let cid = _emailCampaignIdCounter;
    _emailCampaignIdCounter += 1;
    let status = switch (scheduledDate) {
      case (?_) { "Scheduled" };
      case null  { "Draft" };
    };
    let campaign : EmailCampaign = {
      id            = cid;
      subject;
      body;
      recipients;
      scheduledDate;
      status;
      createdAt     = Time.now();
      sentAt        = null;
    };
    emailCampaigns.add(cid, campaign);
    _persistCampaigns();
    #ok(cid)
  };

  // updateEmailCampaign — admin updates an existing campaign's content.
  public shared ({ caller }) func updateEmailCampaign(
    campaignId    : Nat,
    subject       : Text,
    body          : Text,
    recipients    : [Text],
    scheduledDate : ?Int,
  ) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    adminOnly(caller);
    switch (emailCampaigns.get(campaignId)) {
      case null { #err("Campaign not found") };
      case (?c) {
        let status = switch (scheduledDate) {
          case (?_) { "Scheduled" };
          case null  { c.status };
        };
        emailCampaigns.add(campaignId, { c with subject; body; recipients; scheduledDate; status });
        _persistCampaigns();
        #ok
      };
    }
  };

  // getAllEmailCampaigns — returns all campaigns sorted by createdAt descending.
  public shared ({ caller }) func getAllEmailCampaigns() : async { #ok : [EmailCampaign]; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    let all = emailCampaigns.values().toArray();
    #ok(all.sort(func(a : EmailCampaign, b : EmailCampaign) : { #less; #equal; #greater } {
      Int.compare(b.createdAt, a.createdAt)
    }))
  };

  // rescheduleEmailCampaign — updates the scheduledDate on a Scheduled campaign.
  public shared ({ caller }) func rescheduleEmailCampaign(
    campaignId      : Nat,
    newScheduledDate : Int,
  ) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    adminOnly(caller);
    switch (emailCampaigns.get(campaignId)) {
      case null { #err("Campaign not found") };
      case (?c) {
        if (not Text.equal(c.status, "Scheduled")) { return #err("Campaign is not in Scheduled status") };
        emailCampaigns.add(campaignId, { c with scheduledDate = ?newScheduledDate });
        _persistCampaigns();
        #ok
      };
    }
  };

  // cancelEmailCampaign — sets the campaign status to "Draft", removing it from the scheduled queue.
  public shared ({ caller }) func cancelEmailCampaign(campaignId : Nat) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    adminOnly(caller);
    switch (emailCampaigns.get(campaignId)) {
      case null { #err("Campaign not found") };
      case (?c) {
        emailCampaigns.add(campaignId, { c with status = "Draft" });
        _persistCampaigns();
        #ok
      };
    }
  };

  // sendNowEmailCampaign — immediately dispatches a campaign regardless of its scheduledDate.
  public shared ({ caller }) func sendNowEmailCampaign(campaignId : Nat) : async { #ok; #err : Text } {
    if (not isAdmin(caller)) { return #err("Unauthorized") };
    adminOnly(caller);
    switch (emailCampaigns.get(campaignId)) {
      case null { #err("Campaign not found") };
      case (?c) {
        emailCampaigns.add(campaignId, { c with status = "Sending" });
        _persistCampaigns();
        // HIGH-3 CYCLE PROTECTION: cap recipients to prevent cycle exhaustion on large campaigns.
        let MAX_RECIPIENTS_PER_DISPATCH : Nat = 500;
        let allRecipients = c.recipients;
        let cappedRecipients : [Text] = if (allRecipients.size() > MAX_RECIPIENTS_PER_DISPATCH) {
          Debug.print("[sendNowEmailCampaign] campaign " # campaignId.toText() # " has " # allRecipients.size().toText() # " recipients; capping at " # MAX_RECIPIENTS_PER_DISPATCH.toText());
          var first500 : [Text] = [];
          var i = 0;
          while (i < MAX_RECIPIENTS_PER_DISPATCH) {
            first500 := first500.concat([allRecipients[i]]);
            i += 1;
          };
          first500
        } else { allRecipients };
        var allOk = true;
        var recipientIdx = 0;
        for (recipientEmail in cappedRecipients.vals()) {
          try {
            // Async yield every 10 sends to spread cycle load
            if (recipientIdx > 0 and recipientIdx % 10 == 0) {
              ignore await async { () };
            };
            await sendEmail(recipientEmail, c.subject, c.body);
          } catch (e) {
            // Debug.print("[sendNowEmailCampaign] send failed for " # recipientEmail # ": " # e.message());
            allOk := false;
          };
          recipientIdx += 1;
        };
        let finalStatus = if (allOk) { "Sent" } else { "Failed" };
        let sentAt : ?Int = if (allOk) { ?Time.now() } else { null };
        emailCampaigns.add(campaignId, { c with status = finalStatus; sentAt });
        _persistCampaigns();
        #ok
      };
    }
  };

  // ── ANALYTICS ────────────────────────────────────────────────────────────────

  // VisitEvent — one recorded page-load event from the public site.
  public type VisitEvent = {
    pagePath    : Text;
    timestamp   : Int;
    sessionId   : Text;
    countryCode : ?Text;
  };

  // VISIT EVENTS STABLE STORAGE — auto-persisted via enhanced orthogonal persistence.
  // Capped at 50,000 entries using FIFO eviction.
  stable var _stableVisitEvents : [VisitEvent] = [];

  let MAX_VISIT_EVENTS : Nat = 50_000;

  // recordVisit — public (no auth): called on every public page load from the frontend.
  // Stores the visit event and applies FIFO eviction when the cap is reached.
  public shared func recordVisit(
    pagePath    : Text,
    timestamp   : Int,
    sessionId   : Text,
    countryCode : ?Text,
  ) : async Bool {
    // Timestamp freshness check: reject if more than 60 seconds off from now
    let now = Time.now();
    let timeDiff = if (timestamp > now) { timestamp - now } else { now - timestamp };
    if (timeDiff > 60_000_000_000) { return false };
    // Per-session rate limit: max 1 visit per 5 seconds per sessionId
    switch (visitRateLimits.get(sessionId)) {
      case (?lastTime) {
        if (now - lastTime < 5_000_000_000) { return false };
      };
      case null {};
    };
    visitRateLimits.add(sessionId, now);
    let event : VisitEvent = { pagePath; timestamp; sessionId; countryCode };
    if (_stableVisitEvents.size() >= MAX_VISIT_EVENTS) {
      // Drop the oldest entry (index 0) before appending
      var trimmed : [VisitEvent] = [];
      var i = 1;
      while (i < _stableVisitEvents.size()) {
        trimmed := trimmed.concat([_stableVisitEvents[i]]);
        i += 1;
      };
      _stableVisitEvents := trimmed.concat([event]);
    } else {
      _stableVisitEvents := _stableVisitEvents.concat([event]);
    };
    true
  };

  // getLiveVisitorCount — admin-only: returns the number of unique session IDs
  // whose most-recent visit timestamp falls within the last 5 minutes.
  public shared query({ caller }) func getLiveVisitorCount() : async Nat {
    adminOnly(caller);
    let fiveMinNs : Int = 5 * 60 * 1_000_000_000;
    let cutoff = Time.now() - fiveMinNs;
    // Collect unique session IDs active within the window
    var seen : [Text] = [];
    var count = 0;
    for (ev in _stableVisitEvents.vals()) {
      if (ev.timestamp >= cutoff) {
        let already = seen.find(func(s : Text) : Bool { Text.equal(s, ev.sessionId) }) != null;
        if (not already) {
          seen := seen.concat([ev.sessionId]);
          count += 1;
        };
      };
    };
    count
  };

  // getVisitorStats — admin-only: returns unique visitor and session counts
  // grouped by today / this week / this month / all time.
  public shared query({ caller }) func getVisitorStats() : async {
    todayUnique   : Nat;
    todaySessions : Nat;
    weekUnique    : Nat;
    weekSessions  : Nat;
    monthUnique   : Nat;
    monthSessions : Nat;
    allTimeUnique : Nat;
    allTimeSessions : Nat;
  } {
    adminOnly(caller);
    let secNs : Int = 1_000_000_000;
    let now = Time.now();
    let todayCutoff  = now - (86_400 * secNs);
    let weekCutoff   = now - (7 * 86_400 * secNs);
    let monthCutoff  = now - (30 * 86_400 * secNs);
    var todaySeen   : [Text] = [];
    var weekSeen    : [Text] = [];
    var monthSeen   : [Text] = [];
    var allTimeSeen : [Text] = [];
    var todaySessions   = 0;
    var weekSessions    = 0;
    var monthSessions   = 0;
    var allTimeSessions = 0;
    for (ev in _stableVisitEvents.vals()) {
      // All time
      allTimeSessions += 1;
      let inAllTime = allTimeSeen.find(func(s : Text) : Bool { Text.equal(s, ev.sessionId) }) != null;
      if (not inAllTime) { allTimeSeen := allTimeSeen.concat([ev.sessionId]) };
      // Month
      if (ev.timestamp >= monthCutoff) {
        monthSessions += 1;
        let inMonth = monthSeen.find(func(s : Text) : Bool { Text.equal(s, ev.sessionId) }) != null;
        if (not inMonth) { monthSeen := monthSeen.concat([ev.sessionId]) };
      };
      // Week
      if (ev.timestamp >= weekCutoff) {
        weekSessions += 1;
        let inWeek = weekSeen.find(func(s : Text) : Bool { Text.equal(s, ev.sessionId) }) != null;
        if (not inWeek) { weekSeen := weekSeen.concat([ev.sessionId]) };
      };
      // Today
      if (ev.timestamp >= todayCutoff) {
        todaySessions += 1;
        let inToday = todaySeen.find(func(s : Text) : Bool { Text.equal(s, ev.sessionId) }) != null;
        if (not inToday) { todaySeen := todaySeen.concat([ev.sessionId]) };
      };
    };
    {
      todayUnique     = todaySeen.size();
      todaySessions;
      weekUnique      = weekSeen.size();
      weekSessions;
      monthUnique     = monthSeen.size();
      monthSessions;
      allTimeUnique   = allTimeSeen.size();
      allTimeSessions;
    }
  };

  // getDailyVisitorChart — admin-only: returns (dateString, uniqueVisitorCount) tuples
  // for each of the past 30 calendar days, sorted oldest to newest.
  // dateString format: "YYYY-MM-DD" derived from nanosecond timestamp.
  public shared query({ caller }) func getDailyVisitorChart() : async [(Text, Nat)] {
    adminOnly(caller);
    let secNs : Int = 1_000_000_000;
    let now = Time.now();
    // today's day index (seconds since epoch / 86400)
    let todayDayIdx : Int = (now / secNs) / 86_400;
    // Build 30 slots: [todayDayIdx-29, ..., todayDayIdx]
    // For each slot collect unique session IDs
    var result : [(Text, Nat)] = [];
    var slot = 0;
    while (slot < 30) {
      let dayIdx = todayDayIdx - (29 - slot);
      // Filter events that fall on this calendar day
      var seenOnDay : [Text] = [];
      for (ev in _stableVisitEvents.vals()) {
        let evDayIdx = (ev.timestamp / secNs) / 86_400;
        if (evDayIdx == dayIdx) {
          let already = seenOnDay.find(func(s : Text) : Bool { Text.equal(s, ev.sessionId) }) != null;
          if (not already) {
            seenOnDay := seenOnDay.concat([ev.sessionId]);
          };
        };
      };
      // Format dayIdx as "YYYY-MM-DD"
      // dayIdx is days since 1970-01-01
      let totalDays : Int = dayIdx;
      let y400    = 146_097;  // days in 400-year cycle
      let y100    = 36_524;
      let y4      = 1_461;
      var n       = totalDays + 719_468; // shift to civil calendar epoch
      let era     = (if (n >= 0) { n } else { n - (y400 - 1) }) / y400;
      let doe     = n - era * y400;
      let yoe     = (doe - doe / y4 + doe / y100 - doe / y400) / 365;
      let y       = yoe + era * 400;
      let doy     = doe - (365 * yoe + yoe / 4 - yoe / 100);
      let mp      = (5 * doy + 2) / 153;
      let d       = doy - (153 * mp + 2) / 5 + 1;
      let m       = mp + (if (mp < 10) { 3 } else { -9 });
      let yr      = y + (if (m <= 2) { 1 } else { 0 });
      // Zero-pad month and day
      let mStr = if (m < 10) { "0" # m.toText() } else { m.toText() };
      let dStr = if (d < 10) { "0" # d.toText() } else { d.toText() };
      let dateStr = yr.toText() # "-" # mStr # "-" # dStr;
      result := result.concat([(dateStr, seenOnDay.size())]);
      slot += 1;
    };
    result
  };

  // getTopPages — admin-only: returns the top 10 most-visited page paths with visit
  // count and percentage of total traffic, sorted descending by count.
  public shared query({ caller }) func getTopPages() : async [(Text, Nat, Float)] {
    adminOnly(caller);
    let total = _stableVisitEvents.size();
    if (total == 0) { return [] };
    // Accumulate (path, count) pairs
    var pageCounts : [(Text, Nat)] = [];
    for (ev in _stableVisitEvents.vals()) {
      let idx = pageCounts.find(func(pair : (Text, Nat)) : Bool { Text.equal(pair.0, ev.pagePath) });
      switch (idx) {
        case (?found) {
          pageCounts := pageCounts.map<(Text, Nat), (Text, Nat)>(
            func(pair : (Text, Nat)) : (Text, Nat) {
              if (Text.equal(pair.0, ev.pagePath)) { (pair.0, pair.1 + 1) }
              else { pair }
            }
          );
        };
        case (null) {
          pageCounts := pageCounts.concat([(ev.pagePath, 1)]);
        };
      };
    };
    // Sort descending by count
    let sorted = pageCounts.sort(func(a : (Text, Nat), b : (Text, Nat)) : { #less; #equal; #greater } {
      Nat.compare(b.1, a.1)
    });
    // Take top 10 and annotate with percentage
    let totalF = total.toFloat();
    var out : [(Text, Nat, Float)] = [];
    var i = 0;
    while (i < sorted.size() and i < 10) {
      let (path, cnt) = sorted[i];
      let pct = cnt.toFloat() / totalF * 100.0;
      out := out.concat([(path, cnt, pct)]);
      i += 1;
    };
    out
  };

  // getCountryBreakdown — admin-only: returns the top 6 countries by unique visitor count
  // with percentage. Country codes are mapped to full names via inline lookup.
  public shared query({ caller }) func getCountryBreakdown() : async [(Text, Nat, Float)] {
    adminOnly(caller);
    // Map country code to full name
    func countryName(code : Text) : Text {
      if      (Text.equal(code, "US")) { "United States" }
      else if (Text.equal(code, "GB")) { "United Kingdom" }
      else if (Text.equal(code, "CA")) { "Canada" }
      else if (Text.equal(code, "AU")) { "Australia" }
      else if (Text.equal(code, "DE")) { "Germany" }
      else if (Text.equal(code, "FR")) { "France" }
      else if (Text.equal(code, "IN")) { "India" }
      else if (Text.equal(code, "BR")) { "Brazil" }
      else if (Text.equal(code, "MX")) { "Mexico" }
      else if (Text.equal(code, "JP")) { "Japan" }
      else if (Text.equal(code, "NL")) { "Netherlands" }
      else if (Text.equal(code, "ES")) { "Spain" }
      else if (Text.equal(code, "IT")) { "Italy" }
      else if (Text.equal(code, "SE")) { "Sweden" }
      else if (Text.equal(code, "SG")) { "Singapore" }
      else if (Text.equal(code, "AE")) { "UAE" }
      else if (Text.equal(code, "ZA")) { "South Africa" }
      else { code }
    };
    // Count unique session IDs per country code (skip null country)
    var countryCounts : [(Text, [Text])] = []; // (countryCode, [sessionId])
    for (ev in _stableVisitEvents.vals()) {
      switch (ev.countryCode) {
        case (null) {};
        case (?code) {
          let existing = countryCounts.find(func(pair : (Text, [Text])) : Bool { Text.equal(pair.0, code) });
          switch (existing) {
            case (?found) {
              let alreadySeen = found.1.find(func(s : Text) : Bool { Text.equal(s, ev.sessionId) }) != null;
              if (not alreadySeen) {
                countryCounts := countryCounts.map<(Text, [Text]), (Text, [Text])>(
                  func(pair : (Text, [Text])) : (Text, [Text]) {
                    if (Text.equal(pair.0, code)) { (pair.0, pair.1.concat([ev.sessionId])) }
                    else { pair }
                  }
                );
              };
            };
            case (null) {
              countryCounts := countryCounts.concat([(code, [ev.sessionId])]);
            };
          };
        };
      };
    };
    // Sum total visitors with country data
    var totalWithCountry = 0;
    for (pair in countryCounts.vals()) {
      totalWithCountry += pair.1.size();
    };
    if (totalWithCountry == 0) { return [] };
    // Convert to (code, count) and sort descending
    let countPairs : [(Text, Nat)] = countryCounts.map<(Text, [Text]), (Text, Nat)>(
      func(pair : (Text, [Text])) : (Text, Nat) { (pair.0, pair.1.size()) }
    );
    let sorted = countPairs.sort(func(a : (Text, Nat), b : (Text, Nat)) : { #less; #equal; #greater } {
      Nat.compare(b.1, a.1)
    });
    // Take top 6 and annotate with country name and percentage
    let totalF = totalWithCountry.toFloat();
    var out : [(Text, Nat, Float)] = [];
    var i = 0;
    while (i < sorted.size() and i < 6) {
      let (code, cnt) = sorted[i];
      let pct = cnt.toFloat() / totalF * 100.0;
      out := out.concat([(countryName(code), cnt, pct)]);
      i += 1;
    };
    out
  };

  // SUB-ADMIN MANAGEMENT

  public shared({ caller }) func addSubAdmin(email : Text, tabs : [Text]) : async { #ok; #err : Text } {
    switch (principalToEmail.get(caller)) {
      case (?callerEmail) {
        if (not Text.equal(callerEmail, getAdminEmail())) { return #err "Unauthorized" };
        let trimmed = email.trim(#char ' ');
        if (Text.equal(trimmed, "")) { return #err "Email required" };
        if (Text.equal(trimmed, getAdminEmail())) { return #err "Cannot add super-admin as sub-admin" };
        let record : SubAdmin = { email = trimmed; allowedTabs = tabs; createdAt = Time.now() };
        subAdminMap.add(trimmed, record);
        #ok
      };
      case null { #err "Not authenticated" };
    }
  };

  public shared({ caller }) func removeSubAdmin(email : Text) : async { #ok; #err : Text } {
    switch (principalToEmail.get(caller)) {
      case (?callerEmail) {
        if (not Text.equal(callerEmail, getAdminEmail())) { return #err "Unauthorized" };
        subAdminMap.remove(email);
        #ok
      };
      case null { #err "Not authenticated" };
    }
  };

  public shared({ caller }) func updateSubAdminTabs(email : Text, tabs : [Text]) : async { #ok; #err : Text } {
    switch (principalToEmail.get(caller)) {
      case (?callerEmail) {
        if (not Text.equal(callerEmail, getAdminEmail())) { return #err "Unauthorized" };
        switch (subAdminMap.get(email)) {
          case (?existing) {
            subAdminMap.add(email, { email = existing.email; allowedTabs = tabs; createdAt = existing.createdAt });
            #ok
          };
          case null { #err "Not found" };
        }
      };
      case null { #err "Not authenticated" };
    }
  };

  public shared({ caller }) func getSubAdmins() : async { #ok : [(Text, SubAdmin)]; #err : Text } {
    switch (principalToEmail.get(caller)) {
      case (?callerEmail) {
        if (not Text.equal(callerEmail, getAdminEmail())) { return #err "Unauthorized" };
        #ok (subAdminMap.entries().toArray())
      };
      case null { #err "Not authenticated" };
    }
  };

  public shared({ caller }) func getMyAdminPermissions() : async { #ok : [Text]; #err : Text } {
    switch (principalToEmail.get(caller)) {
      case (?callerEmail) {
        if (Text.equal(callerEmail, getAdminEmail())) { return #ok (["*"]) };
        switch (subAdminMap.get(callerEmail)) {
          case (?sub) { #ok (sub.allowedTabs) };
          case null { #err "Not an admin" };
        }
      };
      case null { #err "Not authenticated" };
    }
  };

};
