import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PendingNotification {
    id: string;
    url: string;
    title: string;
    body: string;
    createdAt: bigint;
}
export interface BusinessMetrics {
    activeBookings: bigint;
    saasPlanStatus: string;
    monthlyRevenueCents: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface PushSubscription {
    endpoint: string;
    auth: string;
    p256dh: string;
}
export interface EmailLog {
    id: string;
    status: string;
    templateName: string;
    timestamp: bigint;
    recipientEmail: string;
}
export interface CrmClient {
    id: string;
    webhookSecret?: string;
    hasAccount: boolean;
    deletionRequested: boolean;
    source: string;
    name: string;
    milestoneUpdatedAt?: bigint;
    onboardingBriefId?: string;
    created_at: bigint;
    briefSubmittedAt?: bigint;
    email: string;
    connectedAt?: bigint;
    stripeConnectAccountId?: string;
    notes: string;
    currentMilestone: bigint;
    platformFeePercentage: number;
    projectStatus: string;
    deletionRequestedAt: bigint;
    phone: string;
    stripeConnectStatus: string;
    lastActivityAt?: bigint;
    briefStatus?: string;
    siteLinkLog: Array<SiteLinkEntry>;
    completionPaymentCharged: boolean;
    activeServices: Array<string>;
}
export interface PurchaseRequest {
    id: bigint;
    status: string;
    clientEmail: string;
    productId: bigint;
    productName: string;
    checkoutUrl?: string;
    frequency: string;
    amount: number;
    declineReason?: string;
    respondedAt?: bigint;
    requestedAt: bigint;
}
export interface Subscription {
    id: SubscriptionId;
    status: string;
    nextBillingDate: bigint;
    updated_at: Timestamp;
    plan_code: string;
    plan_name: string;
    billing_cycle: string;
    clientEmail: string;
    created_at: Timestamp;
    stripeCustomerId?: string;
    stripe_subscription_id: string;
    client_id: ClientId;
    reminderSentAt?: bigint;
    next_payment_date: Timestamp;
    paymentFailed: boolean;
}
export type SubscriptionId = bigint;
export interface SubAdmin {
    allowedTabs: Array<string>;
    createdAt: bigint;
    email: string;
}
export interface Lead {
    id: string;
    status: string;
    meetLink: string;
    rescheduleToken: string;
    convertedAt?: bigint;
    name: string;
    path: string;
    rescheduleHistory: Array<bigint>;
    created_at: Timestamp;
    email: string;
    isDraft: boolean;
    message: string;
    business: string;
    meetingMethod: string;
    rescheduleLinkSentAt?: bigint;
}
export type EditRequestId = bigint;
export interface FleetCanister {
    id: string;
    name: string;
    created_at: Timestamp;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface GoogleSheetsConfig {
    scriptUrl: string;
    sheetId: string;
}
export interface ActivityLog {
    id: ActivityId;
    status_at_time: Status;
    description: string;
    created_at: Timestamp;
    order_id: OrderId;
    client_id: ClientId;
}
export interface DaySchedule {
    endHour: bigint;
    isOpen: boolean;
    startHour: bigint;
}
export type EmailCampaignId = bigint;
export interface Questionnaire {
    id: QuestionnaireId;
    updated_at: Timestamp;
    submitted: boolean;
    answers: string;
    reviewed_at?: Timestamp;
    created_at: Timestamp;
    progress: bigint;
    order_id: OrderId;
    reviewed: boolean;
    client_id: ClientId;
    submitted_at?: Timestamp;
    tier_code: string;
}
export type QuestionnaireId = bigint;
export interface Order {
    id: OrderId;
    status: Status;
    updated_at: Timestamp;
    delivery_window: string;
    created_at: Timestamp;
    launch_target: string;
    client_id: ClientId;
    amount: number;
    tier_code: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface SiteLinkEntry {
    url: string;
    sentAt: bigint;
}
export interface QuestionDefinition {
    id: string;
    inputType: string;
    questionLabel: string;
    tierCode: string;
    sortOrder: bigint;
    description: string;
    required: boolean;
    placeholder: string;
    options: Array<string>;
}
export interface PortfolioItem {
    id: string;
    seoMetaKeywords?: string;
    client_name: string;
    published: boolean;
    description: string;
    created_at: Timestamp;
    site_url: string;
    thumbnail_url: string;
    imageCaption: string;
    is_featured: boolean;
    seoMetaDescription?: string;
    tier_code: string;
}
export type InvoiceId = bigint;
export interface EmailTemplate {
    id: EmailTemplateId;
    updated_at: Timestamp;
    subject: string;
    body: string;
    trigger_key: string;
}
export interface DashboardMetrics {
    totalProducts: bigint;
    ordersByStatus: Array<[string, bigint]>;
    totalOrders: bigint;
    totalOrderValue: bigint;
    outstandingInvoices: bigint;
    recentActivity: Array<string>;
    totalClients: bigint;
    unreviewedQuestionnaires: bigint;
    totalActiveSubscriptions: bigint;
    totalWebsites: bigint;
}
export type LoginResult = {
    __kind__: "ok";
    ok: {
        role: string;
        email: string;
        firstName: string;
    };
} | {
    __kind__: "err";
    err: string;
};
export interface AdminStats {
    outstandingInvoices: bigint;
    activeProjects: bigint;
    totalClients: bigint;
    unreviewedQuestionnaires: bigint;
}
export interface ClientFileMetadata {
    id: string;
    objectKey: string;
    clientEmail: string;
    fileName: string;
    fileLabel: string;
    uploaderEmail: string;
    uploadedAt: bigint;
}
export interface UserProfile {
    role: string;
    businessName: string;
    businessType: string;
    created_at: Timestamp;
    email: string;
    passwordHash: Uint8Array;
    phone: string;
    lastName: string;
    firstName: string;
}
export type Timestamp = bigint;
export interface SocialMediaConfig {
    instagramUrl: string;
    youtubeUrl: string;
    facebookUrl: string;
    linkedinUrl: string;
    tiktokUrl: string;
}
export interface NotificationLogEntry {
    id: string;
    url: string;
    title: string;
    body: string;
    event: string;
    timestamp: bigint;
}
export interface GoogleCalendarConfig {
    scriptUrl: string;
    calendarId: string;
    titleTemplate: string;
    defaultDurationMinutes: bigint;
}
export interface AvailabilitySettings {
    timezone?: string;
    blockedDates: Array<string>;
    weeklySchedule: WeeklySchedule;
}
export interface Build {
    id: string;
    thumbnailUrl: string;
    clientName: string;
    description: string;
    addedAt: bigint;
    category: string;
    siteUrl: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type ReviewId = string;
export interface MarqueeLogo {
    id: string;
    order: bigint;
    logoUrl: string;
    addedAt: bigint;
    logoLabel: string;
}
export type ClientId = Principal;
export interface Review {
    id: ReviewId;
    status: string;
    clientName: string;
    clientEmail: string;
    submittedAt: bigint;
    reviewText: string;
    jobTitle: string;
    rating: bigint;
}
export type UpsertResult = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
} | {
    __kind__: "okAlreadyAdvanced";
    okAlreadyAdvanced: null;
};
export interface BlogPost {
    id: BlogPostId;
    seoMetaKeywords?: string;
    status: string;
    title: string;
    updated_at: Timestamp;
    body: string;
    slug: string;
    published_at?: Timestamp;
    created_at: Timestamp;
    author: string;
    excerpt: string;
    category: string;
    seoMetaDescription?: string;
    featured_image_url?: string;
    featuredImageCaption: string;
}
export interface ReferralStat {
    successfulConversions: bigint;
    referrerName: string;
    code: string;
    referrerEmail: string;
    totalClicks: bigint;
}
export interface EditRequest {
    id: EditRequestId;
    status: string;
    request_type: string;
    updated_at: Timestamp;
    description: string;
    created_at: Timestamp;
    page_or_section: string;
    request_number: string;
    order_id?: OrderId;
    client_id: ClientId;
    attachment_url?: string;
}
export interface BillingHistory {
    id: BillingId;
    status: string;
    payment_date: Timestamp;
    subscription_id: SubscriptionId;
    description: string;
    created_at: Timestamp;
    stripe_payment_intent_id: string;
    client_id: ClientId;
    amount: number;
}
export interface ClientMessage {
    id: string;
    body: string;
    createdAt: bigint;
    isRead: boolean;
    receiverEmail: string;
    senderName: string;
    senderEmail: string;
}
export interface Invoice {
    id: InvoiceId;
    status: string;
    updated_at: Timestamp;
    invoice_number: string;
    description: string;
    created_at: Timestamp;
    stripe_payment_intent_id: string;
    due_date: Timestamp;
    paid_at?: Timestamp;
    order_id?: OrderId;
    client_id: ClientId;
    amount: number;
}
export type EmailTemplateId = bigint;
export interface WebhookAuditEntry {
    received_at: bigint;
    event_id: string;
    processing_result: string;
    event_type: string;
}
export type BillingId = bigint;
export type BlogPostId = bigint;
export interface AdminNotification {
    id: string;
    title: string;
    notifType: string;
    read: boolean;
    message: string;
    timestamp: bigint;
}
export type ActivityId = bigint;
export interface WeeklySchedule {
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    saturday: DaySchedule;
    thursday: DaySchedule;
    sunday: DaySchedule;
    friday: DaySchedule;
    monday: DaySchedule;
}
export type ProductId = bigint;
export interface AdHocInvoice {
    id: bigint;
    status: string;
    clientId: string;
    createdAt: bigint;
    dueDate: bigint;
    description: string;
    updatedAt: bigint;
    invoiceNumber: string;
    stripeSessionId: string;
    amount: number;
    paidAt?: bigint;
}
export interface EmailCampaign {
    id: EmailCampaignId;
    status: string;
    subject: string;
    scheduledDate?: bigint;
    body: string;
    createdAt: bigint;
    sentAt?: bigint;
    recipients: Array<string>;
}
export type OrderId = bigint;
export interface Product {
    id: ProductId;
    proofPoints?: string;
    show_questionnaire: boolean;
    seoMetaTitle?: string;
    faqItems?: string;
    active: boolean;
    payment_type: string;
    price_monthly?: number;
    speedy_filter?: string;
    tagline?: string;
    plan_section?: string;
    name: string;
    tags: Array<string>;
    description: string;
    created_at: Timestamp;
    closingCTA?: string;
    bodySections?: string;
    upgradePath?: string;
    imageUrl?: string;
    product_type: string;
    recommendedPlan?: string;
    heroSubheadline?: string;
    detailDescription?: string;
    seoMetaDescription?: string;
    featureBullets: Array<string>;
    heroHeadline?: string;
    bestFor?: string;
    video_url_1: string;
    video_url_2: string;
    price_onetime?: number;
    tier_code?: string;
    price_annual?: number;
}
export enum Status {
    depositReceived = "depositReceived",
    cancelled = "cancelled",
    draftReady = "draftReady",
    questionnaireComplete = "questionnaireComplete",
    live = "live",
    buildInProgress = "buildInProgress",
    revisionsInProgress = "revisionsInProgress",
    questionnairePending = "questionnairePending",
    launching = "launching",
    paused = "paused",
    depositSent = "depositSent"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    activateSubscription(subscriptionId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addBuild(clientName: string, siteUrl: string, description: string | null, category: string | null, thumbnailUrl: string | null): Promise<{
        __kind__: "ok";
        ok: Build;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addClient(name: string, email: string, phone: string, source: string, activeServices: Array<string>, onboardingBriefId: string | null): Promise<string>;
    addFleetCanister(name: string, canisterId: string): Promise<void>;
    addFleetSite(name: string, canisterId: string): Promise<void>;
    addFleetSoftware(name: string, canisterId: string): Promise<void>;
    addMarqueeLogo(logoUrl: string, logoLabel: string): Promise<{
        __kind__: "ok";
        ok: MarqueeLogo;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addSubAdmin(email: string, tabs: Array<string>): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminUpdateClientProfile(clientId: string, firstName: string, lastName: string, phone: string, businessName: string, businessType: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approvePurchaseRequest(requestId: bigint, successUrl: string, cancelUrl: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approveReview(reviewId: ReviewId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignMeetingToLead(leadId: string, newDate: string, newTime: string, meetingMethod: string): Promise<{
        ok: boolean;
        meetLink: string;
    }>;
    blockDate(date: string): Promise<void>;
    cancelEmailCampaign(campaignId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    cancelSubscription(subscriptionId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    changePassword(args: {
        email: string;
        newPasswordHash: Uint8Array;
        currentPasswordHash: Uint8Array;
    }): Promise<UpsertResult>;
    checkStripeSessionPaid(sessionId: string): Promise<{
        __kind__: "notPaid";
        notPaid: null;
    } | {
        __kind__: "paid";
        paid: null;
    } | {
        __kind__: "error";
        error: string;
    }>;
    clearGoogleCalendarConfig(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    clearGoogleSheetsConfig(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    clearNotificationLog(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    clearPendingPushNotifications(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    convertLeadToClient(leadId: string, name: string, email: string, phone: string, source: string, activeServices: Array<string>, onboardingBriefId: string | null): Promise<string>;
    createAdHocInvoiceSession(clientId: string, description: string, amountCents: bigint, successUrl: string, cancelUrl: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createBlogPost(title: string, slug: string, category: string, excerpt: string, body: string, author: string, featured_image_url: string | null, featuredImageCaption: string, status: string, seoMetaDescription: string | null, seoMetaKeywords: string | null): Promise<UpsertResult>;
    createCheckoutSession(items: Array<ShoppingItem>, clientEmail: string, successUrl: string, cancelUrl: string, clientName: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createCompletionPaymentSession(clientId: string, successUrl: string, cancelUrl: string): Promise<string>;
    createDraftLead(name: string, email: string, phone: string, service: string): Promise<{
        ok: boolean;
        leadId: string;
    }>;
    createEditRequest(requestType: string, pageSection: string, description: string, attachmentUrl: string): Promise<UpsertResult>;
    createEmailCampaign(subject: string, body: string, recipients: Array<string>, scheduledDate: bigint | null): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createLead(path: string, name: string, email: string, business: string, message: string): Promise<string>;
    createPortfolioItem(client_name: string, site_url: string, thumbnail_url: string, imageCaption: string, tier_code: string, description: string, is_featured: boolean, seoMetaDescription: string | null, seoMetaKeywords: string | null): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createProduct(name: string, description: string, productType: string, priceMonthly: number | null, priceAnnual: number | null, priceOnetime: number | null, tagline: string | null, featureBullets: Array<string>, bestFor: string | null, upgradePath: string | null, recommendedPlan: string | null, paymentType: string, videoUrl1: string, videoUrl2: string, showQuestionnaire: boolean, planSection: string | null, speedyFilter: string | null): Promise<{
        __kind__: "ok";
        ok: ProductId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createPurchaseRequest(clientEmail: string, productId: bigint, frequency: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createStripePaymentSession(invoiceId: string, amountCents: bigint, successUrl: string, cancelUrl: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createStripePortalSession(callerEmail: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    declinePurchaseRequest(requestId: bigint, reason: string | null): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteBlogPost(id: BlogPostId): Promise<void>;
    deleteBuild(buildId: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteClient(clientId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteClientFile(fileId: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteLead(leadId: string): Promise<void>;
    deleteMarqueeLogo(id: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deletePortfolioItem(id: string): Promise<UpsertResult>;
    deleteProduct(productId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteQuestionnaire(questionnaireId: QuestionnaireId): Promise<void>;
    deleteReferral(referralCode: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteReview(reviewId: ReviewId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    editBuild(id: string, clientName: string, siteUrl: string, description: string | null, category: string | null, thumbnailUrl: string | null): Promise<{
        __kind__: "ok";
        ok: Build;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generateAdminOTP(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generatePartnerLink(partnerName: string, partnerEmail: string): Promise<string>;
    getAdHocClientInvoices(clientId: string): Promise<Array<AdHocInvoice>>;
    getAdminAllActivity(): Promise<Array<ActivityLog>>;
    getAdminAllClients(): Promise<Array<UserProfile>>;
    getAdminAllOrders(): Promise<Array<Order>>;
    getAdminAllQuestionnaires(): Promise<Array<Questionnaire>>;
    getAdminBillingHistory(): Promise<{
        __kind__: "ok";
        ok: Array<BillingHistory>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAdminContactEmail(): Promise<string>;
    getAdminNotifications(): Promise<Array<AdminNotification>>;
    getAdminStats(): Promise<AdminStats>;
    getAllBlogPostsAdmin(): Promise<Array<BlogPost>>;
    getAllEmailCampaigns(): Promise<{
        __kind__: "ok";
        ok: Array<EmailCampaign>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getAllPortfolioAdmin(): Promise<Array<PortfolioItem>>;
    getAllProductsAdmin(): Promise<Array<Product>>;
    getAllSiteText(): Promise<Array<[string, string]>>;
    getApprovedReviews(): Promise<Array<Review>>;
    getAvailability(): Promise<AvailabilitySettings>;
    getBlogPostBySlug(slug: string): Promise<BlogPost | null>;
    getBuilds(): Promise<Array<Build>>;
    getBusinessMetrics(): Promise<BusinessMetrics>;
    getCallerUserRole(): Promise<UserRole>;
    getCanisterCycles(canisterId: string): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getCategoryVisibility(): Promise<Array<[string, boolean]>>;
    getClientBriefStatus(email: string): Promise<string | null>;
    getClientBusinessMetrics(canisterId: string): Promise<{
        __kind__: "ok";
        ok: BusinessMetrics;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getClientByEmail(email: string): Promise<CrmClient | null>;
    getClientByPrincipal(principal: Principal): Promise<UserProfile | null>;
    getClientFileUrl(callerEmail: string, fileId: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getClientInvoices(clientPrincipal: Principal): Promise<Array<Invoice>>;
    getClientMilestone(clientId: string): Promise<{
        __kind__: "ok";
        ok: bigint | null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getClientOrderVolumes(): Promise<Array<[string, number]>>;
    getClientOrders(client: Principal): Promise<Array<Order>>;
    getClientPurchaseRequests(clientEmail: string): Promise<Array<PurchaseRequest>>;
    getClients(): Promise<Array<CrmClient>>;
    getConnectedClients(): Promise<Array<CrmClient>>;
    getConversionStats(fromTs: bigint | null, toTs: bigint | null): Promise<{
        convertedLeads: bigint;
        totalLeads: bigint;
        conversionRate: number;
    }>;
    getCountryBreakdown(): Promise<Array<[string, bigint, number]>>;
    getCycles(): Promise<bigint>;
    getDailyVisitorChart(): Promise<Array<[string, bigint]>>;
    getDashboardMetrics(): Promise<DashboardMetrics>;
    getEmailHealth(): Promise<{
        totalFailures: bigint;
        lastFailureTimestamp: bigint;
        last24hFailures: bigint;
    }>;
    getEmailLogs(): Promise<Array<EmailLog>>;
    getEmailTemplates(): Promise<Array<EmailTemplate>>;
    getFilesForClient(callerEmail: string, clientEmail: string): Promise<Array<ClientFileMetadata>>;
    getFleetSites(): Promise<Array<FleetCanister>>;
    getFleetSoftware(): Promise<Array<FleetCanister>>;
    getGlobalTaxRate(): Promise<number>;
    getGoogleCalendarConfig(): Promise<{
        __kind__: "ok";
        ok: GoogleCalendarConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getGoogleSheetsConfig(): Promise<{
        __kind__: "ok";
        ok: GoogleSheetsConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getLeads(): Promise<Array<Lead>>;
    getLiveVisitorCount(): Promise<bigint>;
    getLogoUrl(): Promise<string>;
    getMarqueeLogos(): Promise<Array<MarqueeLogo>>;
    getMessages(callerEmail: string, targetClientEmail: string): Promise<Array<ClientMessage>>;
    getMyActivity(): Promise<Array<ActivityLog>>;
    getMyAdHocInvoices(): Promise<Array<AdHocInvoice>>;
    getMyAdminPermissions(): Promise<{
        __kind__: "ok";
        ok: Array<string>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getMyBillingHistory(): Promise<Array<BillingHistory>>;
    getMyEditRequests(): Promise<Array<EditRequest>>;
    getMyInvoices(): Promise<Array<Invoice>>;
    getMyMostRecentQuestionnaire(): Promise<Questionnaire | null>;
    getMyOrders(): Promise<Array<Order>>;
    getMyProfile(email: string): Promise<UserProfile | null>;
    getMyQuestionnaires(): Promise<Array<Questionnaire>>;
    getMyReferralClicks(): Promise<bigint>;
    getMyReferralCode(userEmail: string): Promise<string | null>;
    getMyReferralConversions(userEmail: string): Promise<bigint>;
    getMyReview(clientEmail: string): Promise<Review | null>;
    getMySubscriptions(): Promise<Array<Subscription>>;
    getNextAvailableSlot(): Promise<{
        date: string;
        time: string;
    }>;
    getNotificationLog(): Promise<{
        __kind__: "ok";
        ok: Array<NotificationLogEntry>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getOrCreateMyReferralCode(): Promise<string>;
    getPendingPushNotifications(): Promise<{
        __kind__: "ok";
        ok: Array<PendingNotification>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getPendingReviews(): Promise<Array<Review>>;
    getPendingSubscriptions(): Promise<Array<Subscription>>;
    getPortalShopProductIds(): Promise<Array<bigint>>;
    getPortalShopProducts(): Promise<Array<Product>>;
    getProductImageUrl(productId: bigint): Promise<string | null>;
    getProducts(): Promise<Array<Product>>;
    getProductsByType(productType: string): Promise<Array<Product>>;
    getPublicAvailability(): Promise<AvailabilitySettings>;
    getPublicBuilds(): Promise<Array<Build>>;
    getPublicBuildsCount(): Promise<bigint>;
    getPublicSocialMediaConfig(): Promise<SocialMediaConfig>;
    getPublishedBlogPosts(): Promise<Array<BlogPost>>;
    getPublishedPortfolio(): Promise<Array<PortfolioItem>>;
    getPurchaseRequests(): Promise<{
        __kind__: "ok";
        ok: Array<PurchaseRequest>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getPushSubscription(): Promise<{
        __kind__: "ok";
        ok: PushSubscription | null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getQuestionDefinitions(tierCode: string): Promise<Array<QuestionDefinition>>;
    getQuestionnaireByClientId(clientId: ClientId): Promise<Questionnaire | null>;
    getReferralStats(): Promise<Array<ReferralStat>>;
    getRejectedReviews(): Promise<Array<Review>>;
    getReminderLeadDays(): Promise<bigint>;
    getRescheduleHistory(leadId: string): Promise<Array<bigint>>;
    getRescheduleLeadByToken(token: string): Promise<{
        isExpired: boolean;
        lead: Lead;
    } | null>;
    getSiteBaseUrl(): Promise<string>;
    getSiteLinkLog(clientId: string): Promise<{
        __kind__: "ok";
        ok: Array<SiteLinkEntry>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getSiteText(key: string): Promise<string | null>;
    getSocialMediaConfig(): Promise<{
        __kind__: "ok";
        ok: SocialMediaConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStripeCharges(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStripeConfiguration(): Promise<StripeConfiguration | null>;
    getStripeCustomers(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStripeDashboardData(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStripePayouts(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStripePublishableKey(): Promise<string>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getStripeSubscriptions(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStripeTestMode(): Promise<boolean>;
    getSubAdmins(): Promise<{
        __kind__: "ok";
        ok: Array<[string, SubAdmin]>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getTopPages(): Promise<Array<[string, bigint, number]>>;
    getUnreadMessageCounts(): Promise<Array<[string, bigint]>>;
    getVapidPublicKey(): Promise<string>;
    getVisitorStats(): Promise<{
        todayUnique: bigint;
        weekUnique: bigint;
        monthUnique: bigint;
        todaySessions: bigint;
        allTimeUnique: bigint;
        monthSessions: bigint;
        weekSessions: bigint;
        allTimeSessions: bigint;
    }>;
    getWebhookAuditLog(): Promise<Array<WebhookAuditEntry>>;
    handleStripeWebhook(payload: string, _signature: string, secret: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    helpRequest(senderName: string, senderEmail: string, subject: string, message: string, priority: string, attachmentBase64: string, attachmentMimeType: string): Promise<void>;
    initAdminAccount(email: string, passwordHash: Uint8Array): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isGoogleCalendarConfigured(): Promise<boolean>;
    isGoogleSheetsConfigured(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    isStripeTestMode(): Promise<boolean>;
    login(args: {
        email: string;
        passwordHash: Uint8Array;
    }): Promise<LoginResult>;
    markAllNotificationsRead(): Promise<void>;
    markCompletionPaymentCharged(clientId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    markInvoicePaid(invoiceId: string, paymentIntentId: string): Promise<UpsertResult>;
    markMessagesRead(callerEmail: string, targetClientEmail: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    markNotificationRead(id: string): Promise<void>;
    markQuestionnaireReviewed(questionnaireId: QuestionnaireId): Promise<void>;
    publishBlogPost(id: BlogPostId): Promise<void>;
    publishPortfolioItem(id: string): Promise<UpsertResult>;
    recordVisit(pagePath: string, timestamp: bigint, sessionId: string, countryCode: string | null): Promise<boolean>;
    registerAdminPrincipal(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    registerUser(args: {
        email: string;
        passwordHash: Uint8Array;
        lastName: string;
        firstName: string;
    }): Promise<UpsertResult>;
    rejectReview(reviewId: ReviewId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeAdminPrincipal(p: Principal): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeFleetCanister(canisterId: string): Promise<void>;
    removeFleetSite(canisterId: string): Promise<void>;
    removeFleetSoftware(canisterId: string): Promise<void>;
    removeProductImage(productId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removePushSubscription(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeSubAdmin(email: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    reorderMarqueeLogos(orderedIds: Array<string>): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    requestAccountDeletion(): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    requestPasswordReset(email: string): Promise<string>;
    rescheduleEmailCampaign(campaignId: bigint, newScheduledDate: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    rescheduleLead(token: string, newDate: string, newTime: string, meetingMethod: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    reseedCatalog(): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    resendEmail(clientId: string, templateKey: string): Promise<boolean>;
    resendSiteLink(clientId: string, url: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    resetPasswordWithToken(token: string, newPasswordHash: Uint8Array): Promise<string>;
    saveEmailTemplate(trigger_key: string, subject: string, body: string): Promise<void>;
    savePushSubscription(endpoint: string, p256dh: string, auth: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendDepositInvoice(clientPrincipal: Principal, clientEmail: string, amountCents: bigint, description: string, dueDate: Timestamp): Promise<string>;
    sendMessage(callerEmail: string, targetClientEmail: string, body: string): Promise<{
        __kind__: "ok";
        ok: ClientMessage;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendNowEmailCampaign(campaignId: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendOrderStatusEmail(clientPrincipal: Principal, status: Status, clientEmail: string): Promise<void>;
    sendRescheduleLink(leadId: string): Promise<{
        message: string;
        success: boolean;
    }>;
    sendSiteLink(clientId: string, siteUrl: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendUpcomingBillingReminders(): Promise<{
        __kind__: "ok";
        ok: bigint;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setAdminEmail(email: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setAvailability(settings: AvailabilitySettings): Promise<void>;
    setClientWebhookSecret(clientId: string, secret: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setGlobalTaxRate(rate: number): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setGoogleCalendarConfig(config: GoogleCalendarConfig): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setGoogleSheetsConfig(config: GoogleSheetsConfig): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setLogoUrl(url: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setReminderLeadDays(days: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setSiteAuditFallbackPrice(price: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setSiteBaseUrl(url: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setSocialMediaConfig(config: SocialMediaConfig): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    setStripePublishableKey(key: string): Promise<void>;
    setStripeSecretKey(key: string): Promise<void>;
    setStripeTestMode(testMode: boolean): Promise<void>;
    setStripeWebhookSecret(secret: string): Promise<void>;
    setVapidKeys(privateKey: string, publicKey: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setWebhookSharedSecret(secret: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    submitCancellationRequest(subscriptionId: string): Promise<UpsertResult>;
    submitQuestionnaire(questionnaireType: string, answers: string): Promise<bigint>;
    submitReview(clientEmail: string, rating: bigint, reviewText: string, jobTitle: string): Promise<{
        __kind__: "ok";
        ok: ReviewId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    togglePortalShopProduct(productId: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    toggleProductStatus(productId: string): Promise<UpsertResult>;
    trackReferralClick(code: string): Promise<void>;
    trackReferralConversion(referralCode: string, buyerEmail: string, buyerName: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unblockDate(date: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    unpublishBlogPost(id: BlogPostId): Promise<void>;
    unpublishPortfolioItem(id: string): Promise<UpsertResult>;
    updateBlogPost(id: BlogPostId, title: string, slug: string, category: string, excerpt: string, body: string, author: string, featured_image_url: string | null, featuredImageCaption: string, status: string, seoMetaDescription: string | null, seoMetaKeywords: string | null): Promise<void>;
    updateCategoryVisibility(category: string, active: boolean): Promise<UpsertResult>;
    updateClientBriefStatus(newStatus: string): Promise<UpsertResult>;
    updateClientHasAccount(clientId: string, hasAccount: boolean): Promise<UpsertResult>;
    updateClientMilestone(clientId: string, newMilestone: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateClientNotes(clientId: string, notes: string): Promise<UpsertResult>;
    updateClientPlatformFee(clientId: string, newFeePercentage: number): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateClientStatus(clientId: string, newStatus: string): Promise<UpsertResult>;
    updateClientStripeAccountId(clientId: string, stripeAccountId: string, connectionStatus: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateEmailCampaign(campaignId: bigint, subject: string, body: string, recipients: Array<string>, scheduledDate: bigint | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateLeadStatus(leadId: string, newStatus: string): Promise<UpsertResult>;
    updateMarqueeLogo(id: string, logoUrl: string, logoLabel: string): Promise<{
        __kind__: "ok";
        ok: MarqueeLogo;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateOrderStatus(orderId: string, newStatus: string): Promise<UpsertResult>;
    updatePortfolioItem(id: string, client_name: string, site_url: string, thumbnail_url: string, imageCaption: string, tier_code: string, description: string, is_featured: boolean, seoMetaDescription: string | null, seoMetaKeywords: string | null): Promise<UpsertResult>;
    updateProductDescription(productId: string, newDescription: string): Promise<UpsertResult>;
    updateProductDetailContent(productId: string, detailDescription: string | null, seoMetaTitle: string | null, seoMetaDescription: string | null, heroHeadline: string | null, heroSubheadline: string | null, bodySections: string | null, proofPoints: string | null, faqItems: string | null, closingCTA: string | null): Promise<UpsertResult>;
    updateProductImage(productId: string, imageUrl: string): Promise<UpsertResult>;
    updateProductPaymentType(productId: string, paymentType: string): Promise<boolean>;
    updateProductPlanSection(productId: ProductId, planSection: string | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateProductPrice(productId: string, newPriceMonthly: number | null, newPriceAnnual: number | null, newPriceOnetime: number | null): Promise<UpsertResult>;
    updateProductRichFields(productId: string, tagline: string | null, featureBullets: Array<string>, bestFor: string | null, upgradePath: string | null, recommendedPlan: string | null, videoUrl1: string, videoUrl2: string, showQuestionnaire: boolean): Promise<UpsertResult>;
    updateProductSpeedyFilter(productId: ProductId, speedyFilter: string | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateProfile(args: {
        businessName: string;
        businessType: string;
        email: string;
        phone: string;
        lastName: string;
        firstName: string;
    }): Promise<UpsertResult>;
    updateQuestionDefinitions(tierCode: string, questions: Array<QuestionDefinition>): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateSiteText(key: string, value: string): Promise<boolean>;
    updateSubAdminTabs(email: string, tabs: Array<string>): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    uploadFileToClient(clientEmail: string, fileData: Uint8Array, fileName: string, fileLabel: string): Promise<{
        __kind__: "ok";
        ok: ClientFileMetadata;
    } | {
        __kind__: "err";
        err: string;
    }>;
    verifyAdminOTP(adminEmail: string, otp: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    verifyAndRecordPurchase(sessionId: string, email: string, name: string, services: Array<string>): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    verifySession(sessionToken: string): Promise<boolean>;
}
