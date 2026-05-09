import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
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
import AIReceptionistPage from "./pages/AIReceptionistPage";
import AboutPage from "./pages/AboutPage";
import AdsBuilderPage from "./pages/AdsBuilderPage";
import AiReceptionistForm from "./pages/AiReceptionistForm";
import AuditCheckoutPage from "./pages/AuditCheckoutPage";
import BlogIndexPage from "./pages/BlogIndexPage";
import BlogPostPage from "./pages/BlogPostPage";
import CheckoutPage from "./pages/CheckoutPage";
import CustomSitesPage from "./pages/CustomSitesPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import GrowthHubPage from "./pages/GrowthHubPage";
import IntakeForm from "./pages/IntakeForm";
import IntakePage from "./pages/IntakePage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OurBuildsPage from "./pages/OurBuildsPage";
import PlatformLimitationsPage from "./pages/PlatformLimitationsPage";
import PrivacyPage from "./pages/PrivacyPage";
import ProcessPage from "./pages/ProcessPage";
import ProductAdsPage from "./pages/ProductAdsPage";
import ProductLabBriefPage from "./pages/ProductLabBriefPage";
import ProductsPage from "./pages/ProductsPage";
import ReferralPage from "./pages/ReferralPage";
import RegisterPage from "./pages/RegisterPage";
import ReschedulePage from "./pages/ReschedulePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ResultsPage from "./pages/ResultsPage";
import SaaSPlansPage from "./pages/SaaSPlansPage";
import SpeedySitesPage from "./pages/SpeedySitesPage";
import TermsPage from "./pages/TermsPage";
import TheDomePage from "./pages/TheDomePage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
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
import AdminPortfolioPage from "./pages/admin/AdminPortfolioPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import AdminQuestionnairesPage from "./pages/admin/AdminQuestionnairesPage";
import AdminReferralsPage from "./pages/admin/AdminReferralsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AdminSiteTextPage from "./pages/admin/AdminSiteTextPage";
import AdminSpreadsheetPage from "./pages/admin/AdminSpreadsheetPage";
import AdminStripeSettings from "./pages/admin/AdminStripeSettings";
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
import CinematicAdsDetail from "./pages/product-details/CinematicAdsDetail";
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
        let countryCode: string | null = null;
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 2000);
          const res = await fetch("https://ipapi.co/country/", {
            signal: ctrl.signal,
          });
          clearTimeout(timer);
          const text = (await res.text()).trim();
          if (/^[A-Z]{2}$/.test(text)) countryCode = text;
        } catch {
          // geolocation failed — use null
        }
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
  return (
    <>
      <ConditionalBanner />
      <GodModeOverlay />
      <FloatingGodModeToggle />
      <HelpWidget />
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

const customSitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services/custom-sites",
  component: CustomSitesPage,
});

// Legacy sub-route redirects
const productsCustomSitesRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/custom-sites",
  beforeLoad: () => {
    throw redirect({ to: "/services/custom-sites" });
  },
});

const speedySitesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services/speedy-sites",
  component: SpeedySitesPage,
});

const productsSpeedySitesRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/speedy-sites",
  beforeLoad: () => {
    throw redirect({ to: "/services/speedy-sites" });
  },
});

const saasPlansRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services/saas-plans",
  component: SaaSPlansPage,
});

const productsSaasPlansRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/saas-plans",
  beforeLoad: () => {
    throw redirect({ to: "/services/saas-plans" });
  },
});

const cinematicAdsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services/cinematic-ads",
  component: CinematicAdsDetail,
});

const productsCinematicAdsRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/cinematic-ads",
  beforeLoad: () => {
    throw redirect({ to: "/services/cinematic-ads" });
  },
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

const productAdsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/product-ads",
  beforeLoad: () => {
    throw redirect({ to: "/services/product-ads" });
  },
});

const productAdsDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services/product-ads",
  component: ProductAdsPage,
});

const productsProductAdsRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/product-ads",
  beforeLoad: () => {
    throw redirect({ to: "/services/product-ads" });
  },
});

const productLabBriefRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/product-lab-brief",
  component: ProductLabBriefPage,
});

const aiReceptionistRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services/ai-receptionist",
  component: AIReceptionistPage,
});

const productsAiReceptionistRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/ai-receptionist",
  beforeLoad: () => {
    throw redirect({ to: "/services/ai-receptionist" });
  },
});

const growthHubRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services/growth-hub",
  component: GrowthHubPage,
});

const productsGrowthHubRedirect = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/growth-hub",
  beforeLoad: () => {
    throw redirect({ to: "/services/growth-hub" });
  },
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

const platformLimitationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/platform-limitations",
  component: PlatformLimitationsPage,
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

const theDomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/the-dome",
  component: TheDomePage,
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
  customSitesRoute,
  productsCustomSitesRedirect,
  speedySitesRoute,
  productsSpeedySitesRedirect,
  saasPlansRoute,
  productsSaasPlansRedirect,
  cinematicAdsRoute,
  productsCinematicAdsRedirect,
  productLabRoute,
  productsProductLabRedirect,
  productAdsRoute,
  productAdsDetailRoute,
  productsProductAdsRedirect,
  productLabBriefRoute,
  aiReceptionistRoute,
  productsAiReceptionistRedirect,
  growthHubRoute,
  productsGrowthHubRedirect,
  processRoute,
  getStartedRoute,
  intakeRoute,
  onboardingRoute,
  adsBuilderRoute,
  aiReceptionistSetupRoute,
  checkoutRoute,
  aboutRoute,
  ourBuildsRoute,
  resultsRoute,
  loginRoute,
  registerRoute,
  orderConfirmationRoute,
  auditCheckoutRoute,
  blogIndexRoute,
  blogPostRoute,
  platformLimitationsRoute,
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
  portalEditRequestsRoute,
  portalReviewsRoute,
  portalFilesRoute,
  portalMessagesRoute,
  portalReferralsRoute,
  portalShopRoute,
  portalRequestsRoute,
  portalProfileRoute,
  adminDashboardRoute,
  adminAnalyticsRoute,
  adminClientsRoute,
  adminClientDetailRoute,
  adminQuestionnairesRoute,
  adminReviewsRoute,
  adminOrdersRoute,
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
  adminNotificationLogRoute,
  adminNotificationSettingsRoute,
  adminBuildsRoute,
  adminSpreadsheetRoute,
  adminProfileRoute,
  adminBulkEmailRoute,
  theDomeRoute,
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
