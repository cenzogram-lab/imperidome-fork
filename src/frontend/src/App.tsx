import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createActor } from "./backend";
import type { backendInterface } from "./backend";
import AnnouncementBanner from "./components/AnnouncementBanner";
import CheckoutDrawer from "./components/CheckoutDrawer";
import { FloatingGodModeToggle } from "./components/FloatingGodModeToggle";
import { GodModeOverlay } from "./components/GodModeOverlay";
import { HelpWidget } from "./components/HelpWidget";
import ImperidomeHero from "./components/ImperidomeHero";
import { useReferralTracker } from "./hooks/useReferralTracker";
import { useSeoMeta } from "./hooks/useSeoMeta";
import AboutPage from "./pages/AboutPage";
import AdsBuilderPage from "./pages/AdsBuilderPage";
import AiReceptionistForm from "./pages/AiReceptionistForm";
import AuditCheckoutPage from "./pages/AuditCheckoutPage";
import BlogIndexPage from "./pages/BlogIndexPage";
import BlogPostPage from "./pages/BlogPostPage";
import BookPage from "./pages/BookPage";
import CheckoutPage from "./pages/CheckoutPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import IntakeForm from "./pages/IntakeForm";
import IntakePage from "./pages/IntakePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OurBuildsPage from "./pages/OurBuildsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ProcessPage from "./pages/ProcessPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductLabBriefPage from "./pages/ProductLabBriefPage";
import ProductsPage from "./pages/ProductsPage";
import ReferralPage from "./pages/ReferralPage";
import RegisterPage from "./pages/RegisterPage";
import ReschedulePage from "./pages/ReschedulePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ResultsPage from "./pages/ResultsPage";
import SocialFeedPage from "./pages/SocialFeedPage";
import TermsPage from "./pages/TermsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminAnnualRevenuePage from "./pages/admin/AdminAnnualRevenuePage";
import AdminBlogPage from "./pages/admin/AdminBlogPage";
import AdminBuildsPage from "./pages/admin/AdminBuildsPage";
import AdminBulkEmailPage from "./pages/admin/AdminBulkEmailPage";
import AdminClientDetailPage from "./pages/admin/AdminClientDetailPage";
import AdminClientsPage from "./pages/admin/AdminClientsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminEmailLogsPage from "./pages/admin/AdminEmailLogsPage";
import AdminEmailTemplatesPage from "./pages/admin/AdminEmailTemplatesPage";
import AdminFleetPage from "./pages/admin/AdminFleetPage";
import AdminGoogleCalendarPage from "./pages/admin/AdminGoogleCalendarPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminLeadsPage from "./pages/admin/AdminLeadsPage";
import AdminNotificationLogPage from "./pages/admin/AdminNotificationLogPage";
import AdminNotificationSettings from "./pages/admin/AdminNotificationSettings";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminPlatformDashboard from "./pages/admin/AdminPlatformDashboard";
import AdminPortfolioPage from "./pages/admin/AdminPortfolioPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import AdminQuestionnairesPage from "./pages/admin/AdminQuestionnairesPage";
import AdminReferralsPage from "./pages/admin/AdminReferralsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AdminSiteTextPage from "./pages/admin/AdminSiteTextPage";
import AdminSocialMediaPage from "./pages/admin/AdminSocialMediaPage";
import AdminSpreadsheetPage from "./pages/admin/AdminSpreadsheetPage";
import AdminStripeSettings from "./pages/admin/AdminStripeSettings";
import PortalAnnualStatementPage from "./pages/portal/PortalAnnualStatementPage";
import PortalBillingPage from "./pages/portal/PortalBillingPage";
import PortalDashboardPage from "./pages/portal/PortalDashboardPage";
import PortalEditRequestsPage from "./pages/portal/PortalEditRequestsPage";
import PortalFilesPage from "./pages/portal/PortalFilesPage";
import PortalInvoicesPage from "./pages/portal/PortalInvoicesPage";
import PortalLayout from "./pages/portal/PortalLayout";
import PortalMessagesPage from "./pages/portal/PortalMessagesPage";
import PortalProfilePage from "./pages/portal/PortalProfilePage";
import PortalProjectsPage from "./pages/portal/PortalProjectsPage";
import PortalPurchaseRequestsPage from "./pages/portal/PortalPurchaseRequestsPage";
import PortalQuestionnaireFormPage from "./pages/portal/PortalQuestionnaireFormPage";
import PortalQuestionnairesPage from "./pages/portal/PortalQuestionnairesPage";
import PortalReferralsPage from "./pages/portal/PortalReferralsPage";
import PortalReviewsPage from "./pages/portal/PortalReviewsPage";
import PortalShopPage from "./pages/portal/PortalShopPage";
import PortalSubscriptionsPage from "./pages/portal/PortalSubscriptionsPage";
import ShowcaseAIReceptionistPage from "./pages/showcase/ShowcaseAIReceptionistPage";
import ShowcaseCinematicAdsPage from "./pages/showcase/ShowcaseCinematicAdsPage";
import ShowcaseCustomSitesPage from "./pages/showcase/ShowcaseCustomSitesPage";
import ShowcaseGrowthHubPage from "./pages/showcase/ShowcaseGrowthHubPage";
import ShowcaseProductAdsPage from "./pages/showcase/ShowcaseProductAdsPage";
import ShowcaseSaaSPlansPage from "./pages/showcase/ShowcaseSaaSPlansPage";
import ShowcaseSpeedySitesPage from "./pages/showcase/ShowcaseSpeedySitesPage";

// IDL sync: actor interface updated to include saveEmailTemplate, getEmailTemplates, getProducts, getProductsByType, createLead, getLeads, updateLeadStatus

function HomePage() {
  useSeoMeta("home", "Imperidome — Sovereign Web Hosting");

  useEffect(() => {
    const track = async () => {
      try {
        let sid = sessionStorage.getItem("_vis_sid");
        if (!sid) {
          sid = crypto.randomUUID();
          sessionStorage.setItem("_vis_sid", sid);
        }
        const countryCode: string | null = null;
        const { createActorWithConfig } = await import("./config");
        const publicActor = await createActorWithConfig(createActor);
        await (publicActor as backendInterface).recordVisit(
          "/",
          BigInt(Math.floor(Date.now())) * 1_000_000n,
          sid,
          countryCode,
        );
      } catch {
        // silent
      }
    };
    track();
  }, []);

  return <ImperidomeHero />;
}

function RootLayout() {
  const isAdminRoute = window.location.pathname.startsWith("/admin");
  return (
    <>
      <ConditionalBanner />
      <GodModeOverlay />
      <FloatingGodModeToggle />
      {!isAdminRoute && <HelpWidget />}
      <Outlet />
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services",
  component: ProductsPage,
});

// Legacy /products redirect → /services
const productsRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  beforeLoad: () => {
    throw redirect({ to: "/services" });
  },
});

const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services/product/$productId",
  component: ProductDetailPage,
});

const productLabRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services/product-lab",
  component: ProductsPage,
});

const productsProductLabRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/product-lab",
  beforeLoad: () => {
    throw redirect({ to: "/services/product-lab" });
  },
});

const productLabBriefRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/product-lab-brief",
  component: ProductLabBriefPage,
});

const processRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/process",
  component: ProcessPage,
});

const getStartedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/get-started",
  beforeLoad: () => {
    throw redirect({ to: "/intake" });
  },
});

const intakeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/intake",
  component: IntakePage,
});

const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: IntakeForm,
});
const bookRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/book",
  component: BookPage,
});

const adsBuilderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ads-builder",
  component: AdsBuilderPage,
});

const aiReceptionistSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ai-receptionist-setup",
  component: AiReceptionistForm,
});

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/checkout",
  component: CheckoutPage,
});

const socialRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/social",
  component: SocialFeedPage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const ourBuildsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/our-builds",
  component: OurBuildsPage,
});

const resultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/results",
  component: ResultsPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const orderConfirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/order-confirmation",
  component: OrderConfirmationPage,
});

const auditCheckoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/audit-checkout",
  component: AuditCheckoutPage,
});

const blogIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog",
  component: BlogIndexPage,
});

const blogPostRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/blog/$slug",
  component: BlogPostPage,
});

const referralRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/referral",
  component: ReferralPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsPage,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const portalRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal",
  beforeLoad: () => {
    throw redirect({ to: "/portal/dashboard" });
  },
});

const portalDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/dashboard",
  component: PortalDashboardPage,
});

const portalProjectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/projects",
  component: PortalProjectsPage,
});

const portalQuestionnairesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/questionnaires",
  component: PortalQuestionnairesPage,
});

const portalQuestionnaireFormRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/questionnaires/$orderId",
  component: PortalQuestionnaireFormPage,
});

const portalSubscriptionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/subscriptions",
  component: PortalSubscriptionsPage,
});

const portalInvoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/invoices",
  component: PortalInvoicesPage,
});

const portalAnnualStatementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/annual-statement",
  component: PortalAnnualStatementPage,
});

const portalBillingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/billing",
  component: PortalBillingPage,
});

const portalEditRequestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/edit-requests",
  component: PortalEditRequestsPage,
});

const portalReviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/reviews",
  component: PortalReviewsPage,
});

const portalFilesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/files",
  component: PortalFilesPage,
});
const portalMessagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/messages",
  component: PortalMessagesPage,
});

const portalReferralsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/referrals",
  component: PortalReferralsPage,
});
const portalShopRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/shop",
  component: PortalShopPage,
});

const portalRequestsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/requests",
  component: PortalPurchaseRequestsPage,
});

const portalProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portal/profile",
  component: PortalProfilePage,
});

// Admin routes
const adminDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dashboard",
  component: AdminDashboardPage,
});

const adminAnalyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/analytics",
  component: AdminAnalyticsPage,
});

const adminClientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/clients",
  component: AdminClientsPage,
});

const adminClientDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/clients/$clientId",
  component: AdminClientDetailPage,
});

const adminQuestionnairesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/questionnaires",
  component: AdminQuestionnairesPage,
});

const adminReviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/reviews",
  component: AdminReviewsPage,
});

const adminOrdersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/orders",
  component: AdminOrdersPage,
});

const adminAnnualRevenueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/annual-revenue",
  component: AdminAnnualRevenuePage,
});

const adminProductsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/services",
  component: AdminProductsPage,
});

const adminEmailTemplatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/email-templates",
  component: AdminEmailTemplatesPage,
});

const adminEmailLogsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/email-logs",
  component: AdminEmailLogsPage,
});

const adminBlogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/blog",
  component: AdminBlogPage,
});

const adminLeadsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/leads",
  component: AdminLeadsPage,
});

const adminPortfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/portfolio",
  component: AdminPortfolioPage,
});

const adminFleetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/fleet",
  component: AdminFleetPage,
});

const adminSiteTextRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/site-text",
  component: AdminSiteTextPage,
});

const adminReferralsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/referrals",
  component: AdminReferralsPage,
});

const adminStripeSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/stripe-settings",
  component: AdminStripeSettings,
});

const adminGoogleCalendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/google-calendar",
  component: AdminGoogleCalendarPage,
});

const adminSocialMediaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/social-media",
  component: AdminSocialMediaPage,
});

const adminNotificationLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/notifications",
  component: AdminNotificationLogPage,
});

const adminNotificationSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/notification-settings",
  component: AdminNotificationSettings,
});

const adminBulkEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/bulk-email",
  component: AdminBulkEmailPage,
});

const adminBuildsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/builds",
  component: AdminBuildsPage,
});
const adminSpreadsheetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/spreadsheet",
  component: AdminSpreadsheetPage,
});

const adminProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/profile",
  component: AdminProfilePage,
});

const adminPlatformDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/platform",
  component: AdminPlatformDashboard,
});

const adminRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: async ({ location }) => {
    try {
      const { createActorWithConfig } = await import("./config");
      const actor = await createActorWithConfig(createActor);
      const isAdmin = await (actor as backendInterface).isCallerAdmin();
      if (!isAdmin) {
        throw redirect({ to: "/" });
      }
    } catch (e) {
      // Re-throw TanStack Router redirect/notFound errors without intercepting them
      if (
        e != null &&
        typeof e === "object" &&
        ("to" in e || "statusCode" in e || "isRedirect" in e)
      ) {
        throw e;
      }
      // Network or canister error — deny access for safety
      throw redirect({ to: "/" });
    }
    // Only redirect bare /admin to the dashboard; children pass through
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      throw redirect({ to: "/admin/dashboard" });
    }
  },
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  component: ResetPasswordPage,
});

const rescheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reschedule/$token",
  component: ReschedulePage,
});

// Catch-all 404 route
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  component: NotFoundPage,
});

const showcaseCustomSitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/showcase/custom-sites",
  component: ShowcaseCustomSitesPage,
});

const showcaseSpeedySitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/showcase/speedy-sites",
  component: ShowcaseSpeedySitesPage,
});

const showcaseSaaSPlansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/showcase/saas-plans",
  component: ShowcaseSaaSPlansPage,
});

const showcaseCinematicAdsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/showcase/cinematic-ads",
  component: ShowcaseCinematicAdsPage,
});

const showcaseProductAdsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/showcase/product-ads",
  component: ShowcaseProductAdsPage,
});

const showcaseAIReceptionistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/showcase/ai-receptionist",
  component: ShowcaseAIReceptionistPage,
});

const showcaseGrowthHubRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/showcase/growth-hub",
  component: ShowcaseGrowthHubPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  productsRoute,
  productsRedirectRoute,
  productDetailRoute,
  productLabRoute,
  productsProductLabRedirect,
  productLabBriefRoute,
  processRoute,
  getStartedRoute,
  intakeRoute,
  onboardingRoute,
  bookRoute,
  adsBuilderRoute,
  aiReceptionistSetupRoute,
  checkoutRoute,
  socialRoute,
  aboutRoute,
  ourBuildsRoute,
  resultsRoute,
  loginRoute,
  registerRoute,
  orderConfirmationRoute,
  auditCheckoutRoute,
  blogIndexRoute,
  blogPostRoute,
  referralRoute,
  termsRoute,
  privacyRoute,
  dashboardRoute,
  portalDashboardRoute,
  portalRootRoute,
  portalProjectsRoute,
  portalQuestionnairesRoute,
  portalQuestionnaireFormRoute,
  portalSubscriptionsRoute,
  portalInvoicesRoute,
  portalAnnualStatementRoute,
  portalBillingRoute,
  portalEditRequestsRoute,
  portalReviewsRoute,
  portalFilesRoute,
  portalMessagesRoute,
  portalReferralsRoute,
  portalShopRoute,
  portalRequestsRoute,
  portalProfileRoute,
  adminRootRoute,
  adminDashboardRoute,
  adminAnalyticsRoute,
  adminClientsRoute,
  adminClientDetailRoute,
  adminQuestionnairesRoute,
  adminReviewsRoute,
  adminOrdersRoute,
  adminAnnualRevenueRoute,
  adminProductsRoute,
  adminEmailTemplatesRoute,
  adminEmailLogsRoute,
  adminBlogRoute,
  adminLeadsRoute,
  adminPortfolioRoute,
  adminFleetRoute,
  adminSiteTextRoute,
  adminReferralsRoute,
  adminStripeSettingsRoute,
  adminGoogleCalendarRoute,
  adminSocialMediaRoute,
  adminNotificationLogRoute,
  adminNotificationSettingsRoute,
  adminBuildsRoute,
  adminSpreadsheetRoute,
  adminProfileRoute,
  adminPlatformDashboardRoute,
  adminBulkEmailRoute,

  forgotPasswordRoute,
  resetPasswordRoute,
  rescheduleRoute,
  showcaseCustomSitesRoute,
  showcaseSpeedySitesRoute,
  showcaseSaaSPlansRoute,
  showcaseCinematicAdsRoute,
  showcaseProductAdsRoute,
  showcaseAIReceptionistRoute,
  showcaseGrowthHubRoute,
  notFoundRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <ReferralTracker />
      <RouterProvider router={router} />
      <CheckoutDrawer />
    </>
  );
}

/** Mounts at the root to track ?ref=CODE on every page load/navigation */
function ReferralTracker() {
  useReferralTracker();
  return null;
}

/**
 * Renders the AnnouncementBanner only on non-admin routes.
 * useRouterState is available here because this renders inside RouterProvider
 * via the rootRoute component.
 */
function ConditionalBanner() {
  const { location } = useRouterState();
  if (location.pathname.startsWith("/admin")) return null;
  return <AnnouncementBanner />;
}

// Suppress unused import warnings for layout components used implicitly
void AdminLayout;
void PortalLayout;
