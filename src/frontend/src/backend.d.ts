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
    hasAccount: boolean;
    source: string;
    name: string;
    milestoneUpdatedAt?: bigint;
    onboardingBriefId?: string;
    created_at: bigint;
    briefSubmittedAt?: bigint;
    email: string;
    notes: string;
    currentMilestone: bigint;
    projectStatus: string;
    phone: string;
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
    updated_at: Timestamp;
    plan_code: string;
    plan_name: string;
    billing_cycle: string;
    created_at: Timestamp;
    stripe_subscription_id: string;
    client_id: ClientId;
    next_payment_date: Timestamp;
}
export type SubscriptionId = bigint;
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
export type EmailTemplateId = bigint;
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
export interface ClientMessage {
    id: string;
    body: string;
    createdAt: bigint;
    isRead: boolean;
    receiverEmail: string;
    senderName: string;
    senderEmail: string;
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
export type OrderId = bigint;
export interface Product {
    id: ProductId;
    active: boolean;
    price_monthly?: number;
    name: string;
    description: string;
    created_at: Timestamp;
    product_type: string;
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
    addBuild(adminEmail: string, clientName: string, siteUrl: string, description: string | null, category: string | null, thumbnailUrl: string | null): Promise<{
        __kind__: "ok";
        ok: Build;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addClient(name: string, email: string, phone: string, source: string, activeServices: Array<string>, onboardingBriefId: string | null): Promise<string>;
    addFleetCanister(adminEmail: string, name: string, canisterId: string): Promise<void>;
    addFleetSite(adminEmail: string, name: string, canisterId: string): Promise<void>;
    addFleetSoftware(adminEmail: string, name: string, canisterId: string): Promise<void>;
    addMarqueeLogo(logoUrl: string, logoLabel: string, adminEmail: string): Promise<{
        __kind__: "ok";
        ok: MarqueeLogo;
    } | {
        __kind__: "err";
        err: string;
    }>;
    adminUpdateClientProfile(adminEmail: string, clientId: string, firstName: string, lastName: string, phone: string, businessName: string, businessType: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approvePurchaseRequest(adminEmail: string, requestId: bigint, successUrl: string, cancelUrl: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approveReview(adminEmail: string, reviewId: ReviewId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignMeetingToLead(leadId: string, newDate: string, newTime: string, meetingMethod: string, adminEmail: string): Promise<{
        ok: boolean;
        meetLink: string;
    }>;
    blockDate(adminEmail: string, date: string): Promise<void>;
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
    clearGoogleCalendarConfig(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    clearGoogleSheetsConfig(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    clearNotificationLog(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    clearPendingPushNotifications(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    convertLeadToClient(adminEmail: string, leadId: string, name: string, email: string, phone: string, source: string, activeServices: Array<string>, onboardingBriefId: string | null): Promise<string>;
    createAdHocInvoiceSession(clientId: string, adminEmail: string, description: string, amountCents: bigint, successUrl: string, cancelUrl: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    createBlogPost(adminEmail: string, title: string, slug: string, category: string, excerpt: string, body: string, author: string, featured_image_url: string | null, featuredImageCaption: string, status: string, seoMetaDescription: string | null, seoMetaKeywords: string | null): Promise<UpsertResult>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createCompletionPaymentSession(clientId: string, adminEmail: string, successUrl: string, cancelUrl: string): Promise<string>;
    createDraftLead(name: string, email: string, phone: string, service: string, adminEmail: string): Promise<{
        ok: boolean;
        leadId: string;
    }>;
    createEditRequest(requestType: string, pageSection: string, description: string, attachmentUrl: string): Promise<UpsertResult>;
    createLead(path: string, name: string, email: string, business: string, message: string): Promise<string>;
    createPortfolioItem(adminEmail: string, client_name: string, site_url: string, thumbnail_url: string, imageCaption: string, tier_code: string, description: string, is_featured: boolean, seoMetaDescription: string | null, seoMetaKeywords: string | null): Promise<{
        __kind__: "ok";
        ok: string;
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
    declinePurchaseRequest(adminEmail: string, requestId: bigint, reason: string | null): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteBlogPost(adminEmail: string, id: BlogPostId): Promise<void>;
    deleteBuild(adminEmail: string, buildId: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteClient(adminEmail: string, clientId: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteClientFile(adminEmail: string, fileId: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deleteLead(adminEmail: string, leadId: string): Promise<void>;
    deleteMarqueeLogo(id: string, adminEmail: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    deletePortfolioItem(adminEmail: string, id: string): Promise<UpsertResult>;
    deleteQuestionnaire(adminEmail: string, questionnaireId: QuestionnaireId): Promise<void>;
    editBuild(adminEmail: string, id: string, clientName: string, siteUrl: string, description: string | null, category: string | null, thumbnailUrl: string | null): Promise<{
        __kind__: "ok";
        ok: Build;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generateAdminOTP(adminEmail: string): Promise<string>;
    generatePartnerLink(adminEmail: string, partnerName: string, partnerEmail: string): Promise<string>;
    getAdHocClientInvoices(adminEmail: string, clientId: string): Promise<Array<AdHocInvoice>>;
    getAdminAllActivity(): Promise<Array<ActivityLog>>;
    getAdminAllClients(adminEmail: string): Promise<Array<UserProfile>>;
    getAdminAllOrders(adminEmail: string): Promise<Array<Order>>;
    getAdminAllQuestionnaires(adminEmail: string): Promise<Array<Questionnaire>>;
    getAdminNotifications(adminEmail: string): Promise<Array<AdminNotification>>;
    getAdminStats(): Promise<AdminStats>;
    getAllBlogPostsAdmin(): Promise<Array<BlogPost>>;
    getAllPortfolioAdmin(): Promise<Array<PortfolioItem>>;
    getAllProductsAdmin(): Promise<Array<Product>>;
    getAllSiteText(): Promise<Array<[string, string]>>;
    getApprovedReviews(): Promise<Array<Review>>;
    getAvailability(): Promise<AvailabilitySettings>;
    getBlogPostBySlug(slug: string): Promise<BlogPost | null>;
    getBuilds(adminEmail: string): Promise<Array<Build>>;
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
    getClientByEmail(email: string): Promise<CrmClient | null>;
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
    getClientOrders(client: Principal): Promise<Array<Order>>;
    getClientPurchaseRequests(clientEmail: string): Promise<Array<PurchaseRequest>>;
    getClients(adminEmail: string): Promise<Array<CrmClient>>;
    getConversionStats(adminEmail: string, fromTs: bigint | null, toTs: bigint | null): Promise<{
        convertedLeads: bigint;
        totalLeads: bigint;
        conversionRate: number;
    }>;
    getCountryBreakdown(email: string): Promise<Array<[string, bigint, number]>>;
    getCycles(): Promise<bigint>;
    getDailyVisitorChart(email: string): Promise<Array<[string, bigint]>>;
    getDashboardMetrics(): Promise<DashboardMetrics>;
    getEmailLogs(adminEmail: string): Promise<Array<EmailLog>>;
    getEmailTemplates(): Promise<Array<EmailTemplate>>;
    getFilesForClient(callerEmail: string, clientEmail: string): Promise<Array<ClientFileMetadata>>;
    getFleetSites(): Promise<Array<FleetCanister>>;
    getFleetSoftware(): Promise<Array<FleetCanister>>;
    getGoogleCalendarConfig(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: GoogleCalendarConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getGoogleSheetsConfig(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: GoogleSheetsConfig;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getLeads(adminEmail: string): Promise<Array<Lead>>;
    getLiveVisitorCount(email: string): Promise<bigint>;
    getMarqueeLogos(): Promise<Array<MarqueeLogo>>;
    getMessages(callerEmail: string, targetClientEmail: string): Promise<Array<ClientMessage>>;
    getMyActivity(): Promise<Array<ActivityLog>>;
    getMyAdHocInvoices(): Promise<Array<AdHocInvoice>>;
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
    getNotificationLog(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: Array<NotificationLogEntry>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getOrCreateMyReferralCode(): Promise<string>;
    getPendingPushNotifications(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: Array<PendingNotification>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getPendingReviews(adminEmail: string): Promise<Array<Review>>;
    getPortalShopProductIds(): Promise<Array<bigint>>;
    getPortalShopProducts(): Promise<Array<Product>>;
    getProducts(): Promise<Array<Product>>;
    getProductsByType(productType: string): Promise<Array<Product>>;
    getPublicAvailability(): Promise<AvailabilitySettings>;
    getPublicBuilds(): Promise<Array<Build>>;
    getPublicBuildsCount(): Promise<bigint>;
    getPublishedBlogPosts(): Promise<Array<BlogPost>>;
    getPublishedPortfolio(): Promise<Array<PortfolioItem>>;
    getPurchaseRequests(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: Array<PurchaseRequest>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getPushSubscription(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: PushSubscription | null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getQuestionDefinitions(tierCode: string): Promise<Array<QuestionDefinition>>;
    getQuestionnaireByClientId(clientId: ClientId): Promise<Questionnaire | null>;
    getReferralStats(adminEmail: string): Promise<Array<ReferralStat>>;
    getRejectedReviews(adminEmail: string): Promise<Array<Review>>;
    getRescheduleHistory(adminEmail: string, leadId: string): Promise<Array<bigint>>;
    getRescheduleLeadByToken(token: string): Promise<{
        isExpired: boolean;
        lead: Lead;
    } | null>;
    getSiteLinkLog(adminEmail: string, clientId: string): Promise<{
        __kind__: "ok";
        ok: Array<SiteLinkEntry>;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getSiteText(key: string): Promise<string | null>;
    getStripeCharges(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStripeCustomers(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStripeDashboardData(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStripePayouts(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStripePublishableKey(): Promise<string>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getStripeSubscriptions(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    getStripeTestMode(): Promise<boolean>;
    getTopPages(email: string): Promise<Array<[string, bigint, number]>>;
    getUnreadMessageCounts(adminEmail: string): Promise<Array<[string, bigint]>>;
    getVapidPublicKey(): Promise<string>;
    getVisitorStats(email: string): Promise<{
        todayUnique: bigint;
        weekUnique: bigint;
        monthUnique: bigint;
        todaySessions: bigint;
        allTimeUnique: bigint;
        monthSessions: bigint;
        weekSessions: bigint;
        allTimeSessions: bigint;
    }>;
    handleStripeWebhook(payload: string, _signature: string): Promise<{
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
    markAllNotificationsRead(adminEmail: string): Promise<void>;
    markCompletionPaymentCharged(clientId: string, adminEmail: string): Promise<{
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
    markNotificationRead(adminEmail: string, id: string): Promise<void>;
    markQuestionnaireReviewed(adminEmail: string, questionnaireId: QuestionnaireId): Promise<void>;
    publishBlogPost(adminEmail: string, id: BlogPostId): Promise<void>;
    publishPortfolioItem(adminEmail: string, id: string): Promise<UpsertResult>;
    recordVisit(pagePath: string, timestamp: bigint, sessionId: string, countryCode: string | null): Promise<boolean>;
    registerUser(args: {
        email: string;
        passwordHash: Uint8Array;
        lastName: string;
        firstName: string;
    }): Promise<UpsertResult>;
    rejectReview(adminEmail: string, reviewId: ReviewId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    removeFleetCanister(adminEmail: string, canisterId: string): Promise<void>;
    removeFleetSite(adminEmail: string, canisterId: string): Promise<void>;
    removeFleetSoftware(adminEmail: string, canisterId: string): Promise<void>;
    removePushSubscription(adminEmail: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    reorderMarqueeLogos(orderedIds: Array<string>, adminEmail: string): Promise<{
        __kind__: "ok";
        ok: boolean;
    } | {
        __kind__: "err";
        err: string;
    }>;
    requestPasswordReset(email: string): Promise<string>;
    rescheduleLead(token: string, newDate: string, newTime: string, meetingMethod: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    resendEmail(adminEmail: string, clientId: string, templateKey: string): Promise<boolean>;
    resendSiteLink(adminEmail: string, clientId: string, url: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    resetPasswordWithToken(token: string, newPasswordHash: Uint8Array): Promise<string>;
    saveEmailTemplate(adminEmail: string, trigger_key: string, subject: string, body: string): Promise<void>;
    savePushSubscription(adminEmail: string, endpoint: string, p256dh: string, auth: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendAccountDeletionRequest(): Promise<void>;
    sendDepositInvoice(clientPrincipal: Principal, clientEmail: string, amountCents: bigint, description: string, dueDate: Timestamp): Promise<string>;
    sendMessage(callerEmail: string, targetClientEmail: string, body: string): Promise<{
        __kind__: "ok";
        ok: ClientMessage;
    } | {
        __kind__: "err";
        err: string;
    }>;
    sendOrderStatusEmail(clientPrincipal: Principal, status: Status, clientEmail: string): Promise<void>;
    sendRescheduleLink(adminEmail: string, leadId: string): Promise<{
        message: string;
        success: boolean;
    }>;
    sendSiteLink(adminEmail: string, clientId: string, siteUrl: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setAvailability(adminEmail: string, settings: AvailabilitySettings): Promise<void>;
    setGoogleCalendarConfig(config: GoogleCalendarConfig, adminEmail: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setGoogleSheetsConfig(config: GoogleSheetsConfig, adminEmail: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    setStripeConfiguration(config: StripeConfiguration, adminEmail: string): Promise<void>;
    setStripePublishableKey(key: string, adminEmail: string): Promise<void>;
    setStripeSecretKey(key: string, adminEmail: string): Promise<void>;
    setStripeTestMode(testMode: boolean, adminEmail: string): Promise<void>;
    setStripeWebhookSecret(secret: string, adminEmail: string): Promise<void>;
    setVapidKeys(adminEmail: string, privateKey: string, publicKey: string): Promise<{
        __kind__: "ok";
        ok: string;
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
    togglePortalShopProduct(adminEmail: string, productId: bigint): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    toggleProductStatus(adminEmail: string, productId: string): Promise<UpsertResult>;
    trackReferralClick(code: string): Promise<void>;
    trackReferralConversion(referralCode: string, buyerEmail: string, buyerName: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unblockDate(adminEmail: string, date: string): Promise<void>;
    unpublishBlogPost(adminEmail: string, id: BlogPostId): Promise<void>;
    unpublishPortfolioItem(adminEmail: string, id: string): Promise<UpsertResult>;
    updateBlogPost(adminEmail: string, id: BlogPostId, title: string, slug: string, category: string, excerpt: string, body: string, author: string, featured_image_url: string | null, featuredImageCaption: string, status: string, seoMetaDescription: string | null, seoMetaKeywords: string | null): Promise<void>;
    updateCategoryVisibility(adminEmail: string, category: string, active: boolean): Promise<UpsertResult>;
    updateClientBriefStatus(newStatus: string): Promise<UpsertResult>;
    updateClientHasAccount(clientId: string, hasAccount: boolean, adminEmail: string): Promise<UpsertResult>;
    updateClientMilestone(adminEmail: string, clientId: string, newMilestone: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateClientNotes(clientId: string, notes: string, adminEmail: string): Promise<UpsertResult>;
    updateClientStatus(adminEmail: string, clientId: string, newStatus: string): Promise<UpsertResult>;
    updateLeadStatus(adminEmail: string, leadId: string, newStatus: string): Promise<UpsertResult>;
    updateMarqueeLogo(id: string, logoUrl: string, logoLabel: string, adminEmail: string): Promise<{
        __kind__: "ok";
        ok: MarqueeLogo;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateOrderStatus(adminEmail: string, orderId: string, newStatus: string): Promise<UpsertResult>;
    updatePortfolioItem(adminEmail: string, id: string, client_name: string, site_url: string, thumbnail_url: string, imageCaption: string, tier_code: string, description: string, is_featured: boolean, seoMetaDescription: string | null, seoMetaKeywords: string | null): Promise<UpsertResult>;
    updateProductPrice(adminEmail: string, productId: string, newPriceMonthly: number | null, newPriceAnnual: number | null, newPriceOnetime: number | null): Promise<UpsertResult>;
    updateProfile(args: {
        businessName: string;
        businessType: string;
        email: string;
        phone: string;
        lastName: string;
        firstName: string;
    }): Promise<UpsertResult>;
    updateQuestionDefinitions(adminEmail: string, tierCode: string, questions: Array<QuestionDefinition>): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateSiteText(key: string, value: string, adminEmail: string): Promise<boolean>;
    uploadFileToClient(adminEmail: string, clientEmail: string, fileData: Uint8Array, fileName: string, fileLabel: string): Promise<{
        __kind__: "ok";
        ok: ClientFileMetadata;
    } | {
        __kind__: "err";
        err: string;
    }>;
    verifyAdminOTP(adminEmail: string, otp: string): Promise<string>;
    verifyAndRecordPurchase(sessionId: string, email: string, name: string, services: Array<string>): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    verifySession(sessionToken: string): Promise<boolean>;
}
