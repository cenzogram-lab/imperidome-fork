export interface SEOBlock {
  metaTitle: string;
  metaDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  bodySections: Array<{ heading: string; body: string }>;
  proofPoints: string[];
  faqItems: Array<{ question: string; answer: string }>;
  closingCTA: string;
}

const seoMap: Record<string, SEOBlock> = {
  // ─── CUSTOM SITES ────────────────────────────────────────────────────────────
  "digital presence": {
    metaTitle: "Digital Presence Website — Built in 5 Days | Imperidome",
    metaDescription:
      "Launch a professional business website in 5 days with Imperidome. Mobile-ready, conversion-optimized, and built to generate leads from day one. Get started today.",
    heroHeadline: "A Real Business Website Ready in 5 Days",
    heroSubheadline:
      "Stop losing customers to competitors with better-looking sites. Digital Presence delivers a mobile-optimized, lead-generating website crafted for your brand — fast.",
    bodySections: [
      {
        heading: "Why Your Business Can't Afford to Wait on a Website",
        body: "Consumers search online before every purchase decision. If your business doesn't appear professional at first glance, they move on instantly. A polished digital presence isn't optional — it's the cost of entry in today's market. We eliminate the 6-week agency timeline and deliver a site that commands trust in 5 business days.",
      },
      {
        heading: "Built to Convert Visitors Into Paying Customers",
        body: "Every section of your Digital Presence site is structured around conversion psychology: above-the-fold hooks, trust signals, clear calls-to-action, and a mobile layout that loads fast on any device. Most templated DIY sites fail because they're built to look good, not to sell. Ours does both.",
      },
      {
        heading: "Custom Design Without the Custom Price Tag",
        body: "At $749 one-time, Digital Presence gives you a site that would normally cost $3,000–$5,000 at a traditional web agency. You own it outright — no monthly licensing fees, no builder subscriptions, no lock-in. Pair it with a SaaS Plan for ongoing updates and support.",
      },
      {
        heading: "What Makes Imperidome Different From DIY Builders",
        body: "Website builders like Squarespace and Wix look fine in screenshots but underperform on real search results and real devices. Imperidome-built sites are coded for speed, structured for SEO from day one, and carry the visual weight of a brand that means business.",
      },
    ],
    proofPoints: [
      "Delivered in 5 business days, guaranteed",
      "Mobile-first, fully responsive design",
      "SEO-structured from the first page",
      "One-time payment — you own your site outright",
      "Trusted by 50+ businesses across service industries",
    ],
    faqItems: [
      {
        question: "How fast can Imperidome build my business website?",
        answer:
          "The Digital Presence package is completed in 5 business days from the time you submit your brand brief. You'll have a live, professional website in under a week.",
      },
      {
        question: "Do I need to provide content for my website?",
        answer:
          "We handle the copy based on your intake form. You provide your logo, any photos, and business details — our team writes the headlines, section copy, and CTAs that are built to convert.",
      },
      {
        question: "Is this website built on WordPress or a page builder?",
        answer:
          "No. Imperidome sites are custom-built for performance and SEO. They don't rely on bloated CMS platforms that slow load times and invite security vulnerabilities.",
      },
      {
        question: "What happens after the website goes live?",
        answer:
          "You can pair Digital Presence with any Imperidome SaaS Maintenance Plan for ongoing updates, performance monitoring, and support. Without a plan, you receive the delivered site and full ownership.",
      },
    ],
    closingCTA:
      "Your competitors went live last week. Let's get you online today.",
  },

  "authority site": {
    metaTitle: "Authority Website for SEO Rankings & Leads | Imperidome",
    metaDescription:
      "Multi-page SEO authority site that ranks on Google and converts visitors. Imperidome builds content-rich sites that drive organic traffic and qualified leads. Start now.",
    heroHeadline: "Rank on Google. Convert Traffic. Build Authority.",
    heroSubheadline:
      "An Authority Site is a multi-page, SEO-structured web presence engineered to dominate your local or national search rankings and turn organic visitors into booked clients.",
    bodySections: [
      {
        heading: "The Difference Between a Pretty Site and a Ranking Site",
        body: "Most web designers build for aesthetics. Imperidome builds for search performance first. The Authority Site is structured with keyword-targeted pages, proper heading hierarchy, internal linking, and schema markup — the technical foundation that Google rewards with rankings.",
      },
      {
        heading: "Multiple Pages, Multiple Entry Points, More Leads",
        body: "A single homepage can only rank for one cluster of keywords. A multi-page Authority Site creates dedicated service pages, location pages, and pillar content — each one a separate entry point from Google search. More pages means more chances to capture buyers at every stage of their research.",
      },
      {
        heading: "Built to Compete Against Established Competitors",
        body: "The Authority Site is designed for businesses ready to compete seriously for organic traffic. Each page is written with conversion copy and keyword integration that looks natural to readers and powerful to search engines. No thin content, no keyword stuffing — just strategic copy that ranks and persuades.",
      },
    ],
    proofPoints: [
      "Keyword-targeted page architecture from day one",
      "Schema markup and on-page SEO built in",
      "Optimized for local and national search rankings",
      "One-time investment — no ongoing platform fees",
      "Content written by conversion copywriters, not AI",
    ],
    faqItems: [
      {
        question: "How long does it take for an SEO website to rank on Google?",
        answer:
          "SEO timelines vary, but a properly structured Authority Site typically shows movement in search rankings within 60–90 days. The technical foundation we build gives you the best possible starting position.",
      },
      {
        question: "What makes an Authority Site better than a regular website?",
        answer:
          "An Authority Site is architected specifically to rank. It has multiple keyword-targeted pages, structured content hierarchies, proper metadata, and internal linking — not just a homepage and an about page.",
      },
      {
        question: "Is the Authority Site a good fit for service businesses?",
        answer:
          "Yes. Service businesses (law, healthcare, trades, consulting) benefit most from multi-page SEO sites because buyers are actively searching for providers. A strong Authority Site captures that intent.",
      },
    ],
    closingCTA: "Ready to own your search results? Let's build your authority.",
  },

  "booking pro": {
    metaTitle: "Booking Pro — Appointment Booking Website + CRM | Imperidome",
    metaDescription:
      "Automate appointments with a custom site, booking system, CRM integration, and email flows. Imperidome's Booking Pro eliminates no-shows and fills your calendar. Book a call.",
    heroHeadline: "Automate Your Calendar. Eliminate No-Shows. Grow Faster.",
    heroSubheadline:
      "Booking Pro is a complete appointment automation system — custom site, integrated booking, CRM, and automated email flows — built for service businesses that need their calendar full.",
    bodySections: [
      {
        heading: "The Hidden Cost of Manual Booking",
        body: "Every minute spent scheduling, rescheduling, and chasing confirmations is a minute not spent serving clients or growing your business. Businesses running on manual booking lose an average of 15–30 hours per month to administrative friction. Booking Pro eliminates that entirely.",
      },
      {
        heading: "Automated Reminders That Actually Reduce No-Shows",
        body: "Our automated email and SMS reminder sequences reduce no-show rates by up to 60%. Clients receive confirmation immediately after booking, a reminder 48 hours before, and a same-day nudge — all without you lifting a finger. Fewer no-shows means more revenue from your existing client base.",
      },
      {
        heading: "CRM Integration That Keeps Your Business Organized",
        body: "Every new booking flows directly into your CRM, building a client database you actually own. Track appointment history, client notes, follow-up status, and lifetime value from one dashboard. Stop managing clients across disconnected spreadsheets and inboxes.",
      },
      {
        heading: "Built for Service Businesses of Every Kind",
        body: "Booking Pro is ideal for salons, clinics, consultants, personal trainers, tutors, photographers, and any business that runs on appointments. Your booking page is branded, mobile-optimized, and live 24/7 — so clients can book while you sleep.",
      },
    ],
    proofPoints: [
      "Automated booking + reminders + CRM in one system",
      "Reduces no-show rates by up to 60%",
      "Clients can self-book 24/7 from any device",
      "One-time build — no monthly platform licensing",
      "Delivered in 7 business days",
    ],
    faqItems: [
      {
        question: "What booking software does Booking Pro use?",
        answer:
          "Imperidome integrates with leading booking platforms including Acuity, Calendly Business, and custom solutions depending on your workflow requirements. We recommend the best fit for your business type.",
      },
      {
        question:
          "Can I take deposits or prepayments through the booking system?",
        answer:
          "Yes. Booking Pro can be configured to collect deposits or full prepayment at the time of booking via Stripe integration, dramatically reducing no-shows and last-minute cancellations.",
      },
      {
        question:
          "Does Booking Pro work for multi-staff or multi-location businesses?",
        answer:
          "Yes. The system can be configured for multiple staff members, each with their own calendar and availability, across one or multiple locations.",
      },
    ],
    closingCTA:
      "Fill your calendar on autopilot. Let's build your booking machine.",
  },

  "restaurant pro": {
    metaTitle:
      "Restaurant Website with Online Ordering — Zero Commission | Imperidome",
    metaDescription:
      "Custom restaurant website with zero-commission online ordering, your brand, your profits. Imperidome builds ordering systems that compete with DoorDash without the fees. Get started.",
    heroHeadline: "Own Your Orders. Zero Commission. 100% Your Brand.",
    heroSubheadline:
      "Restaurant Pro is a custom online ordering system built on your own site — no third-party commissions, no shared customer data, and a brand experience that keeps guests coming back directly.",
    bodySections: [
      {
        heading: "Third-Party Delivery Apps Are Quietly Eating Your Margins",
        body: "DoorDash, Uber Eats, and GrubHub charge 15–30% commission on every order. On a $40 ticket, you're paying $6–$12 in fees before labor, food costs, or overhead. Restaurant Pro gives you a direct ordering channel where you keep every cent of every order.",
      },
      {
        heading: "Your Menu, Your Brand, Your Customer Data",
        body: "When customers order through third-party apps, those platforms own the customer relationship — and they use your customers to market your competitors. Restaurant Pro puts you in direct contact with your guests, letting you build loyalty programs, collect emails, and run your own promotions.",
      },
      {
        heading: "Fast, Mobile-Optimized Ordering Experience",
        body: "Guests expect the same seamless experience on your site as they get from major apps. Restaurant Pro delivers a fast, visually rich menu, real-time order tracking, and a checkout that works on any smartphone. First impressions convert — a slow or clunky menu costs you orders.",
      },
    ],
    proofPoints: [
      "Zero commission on every order — ever",
      "You own your customer data and email list",
      "Stripe-powered checkout, no third-party app required",
      "Real-time menu management from your phone",
      "Delivered in 7 business days",
    ],
    faqItems: [
      {
        question: "How do customers find my restaurant's online ordering page?",
        answer:
          "Your ordering page is hosted on your own domain, linked from your website, Google Business Profile, and social media. We set up all integrations as part of the build.",
      },
      {
        question: "Can I update my menu myself after the site is live?",
        answer:
          "Yes. Restaurant Pro includes a self-managed menu dashboard where you can add items, update prices, toggle availability, and manage specials in real time.",
      },
      {
        question:
          "What payment methods does the online ordering system support?",
        answer:
          "Stripe integration supports all major credit/debit cards, Apple Pay, and Google Pay. Funds deposit directly to your business bank account.",
      },
    ],
    closingCTA:
      "Stop paying commission. Start owning your orders. Let's build it.",
  },

  "restaurant empire": {
    metaTitle: "Multi-Location Restaurant Ordering System | Imperidome",
    metaDescription:
      "Full multi-location restaurant platform with menu control, zero commission, and branded ordering. Imperidome builds restaurant empires — your brand, your data, your profits.",
    heroHeadline: "Scale Your Restaurant Brand Across Every Location",
    heroSubheadline:
      "Restaurant Empire is the full-stack ordering and brand platform for multi-location restaurant groups — centralized menu management, location routing, and zero third-party commission across your entire footprint.",
    bodySections: [
      {
        heading: "Centralized Control for a Distributed Restaurant Operation",
        body: "Managing menus, pricing, and promotions across multiple locations using different systems is a liability. Restaurant Empire unifies your brand into one platform with location-level customization — change a price system-wide or create a location-specific special in minutes.",
      },
      {
        heading: "Brand Consistency That Builds Guest Loyalty at Scale",
        body: "Guests who visit your downtown location and your suburban location expect the same brand experience. Restaurant Empire delivers a unified visual identity, consistent ordering flow, and synchronized loyalty programs — so your brand grows with every additional location, not fragments.",
      },
      {
        heading: "Enterprise-Level Features Without Enterprise Licensing Costs",
        body: "Third-party platforms charge per-location fees on top of their per-order commissions. Restaurant Empire is a one-time build that scales with you — add new locations without adding new monthly fees. At $8,500, it replaces what would cost $20,000+ in platform licensing over two years.",
      },
    ],
    proofPoints: [
      "Centralized menu and pricing management across all locations",
      "Zero commission on all orders across your entire operation",
      "Location-specific pages with unified brand identity",
      "One-time investment — no per-location monthly fees",
      "Built for groups with 2–20+ locations",
    ],
    faqItems: [
      {
        question: "How many locations can Restaurant Empire support?",
        answer:
          "Restaurant Empire is built to scale from 2 to 20+ locations. Each location gets its own page, hours, and menu while sharing the master brand and ordering infrastructure.",
      },
      {
        question: "Can each location have different menu items and prices?",
        answer:
          "Yes. The system supports location-level overrides for items, prices, and availability while maintaining consistent brand presentation and centralized reporting.",
      },
    ],
    closingCTA:
      "Build the restaurant brand that owns its market. Let's scale you.",
  },

  "digital storefront": {
    metaTitle: "Custom E-Commerce Website That Looks Like $25K | Imperidome",
    metaDescription:
      "Custom e-commerce storefront for product brands — looks like a $25K build, costs $6,500. Imperidome builds Shopify-level experiences on your own infrastructure. Start selling.",
    heroHeadline: "A $25K E-Commerce Experience at a Fraction of the Cost",
    heroSubheadline:
      "Digital Storefront is a custom e-commerce build that competes visually and functionally with the best direct-to-consumer brands — without Shopify's monthly fees or platform dependency.",
    bodySections: [
      {
        heading: "Why Product Brands Need a Custom Storefront",
        body: "Shopify and BigCommerce make it easy to start but expensive to scale. Monthly platform fees, app subscriptions, and transaction fees erode your margins with every sale. Digital Storefront is a one-time build you own outright — every sale goes directly to your bottom line.",
      },
      {
        heading: "Built for Conversion, Not Just Product Display",
        body: "The best product pages in e-commerce combine editorial photography, benefit-driven copy, social proof, and frictionless checkout. Digital Storefront is architected around every conversion principle that separates $1M brands from forgotten ones. Your products deserve a stage that sells.",
      },
      {
        heading: "Complete Customer Ownership and Data Control",
        body: "Platform-dependent stores mean platform-dependent customer data. Digital Storefront gives you direct access to every customer, every email, every purchase history — with no third party sitting between you and your audience. Build a repeat-buyer engine, not just a transaction processor.",
      },
    ],
    proofPoints: [
      "Full custom design — not a modified template",
      "Stripe checkout — zero platform transaction fees",
      "You own every customer and their data",
      "Inventory management and order tracking built in",
      "Designed to compete with brands 10x your size",
    ],
    faqItems: [
      {
        question:
          "Is Digital Storefront better than Shopify for my product brand?",
        answer:
          "For brands serious about margins and brand control, yes. Shopify charges monthly platform fees plus 0.5–2% transaction fees. Digital Storefront is a one-time build with Stripe checkout — your only payment cost is Stripe's standard 2.9% + $0.30, not platform markup on top.",
      },
      {
        question: "Can I add new products after the storefront launches?",
        answer:
          "Yes. Your storefront includes a product management dashboard where you add items, set inventory levels, create variants, and manage pricing without developer involvement.",
      },
    ],
    closingCTA:
      "Build the storefront your products deserve. Let's get to work.",
  },

  "membership engine": {
    metaTitle: "Membership Website + Recurring Revenue Platform | Imperidome",
    metaDescription:
      "Custom membership site with class packs, subscriptions, and recurring billing. Imperidome builds membership engines that generate predictable monthly revenue. Start building.",
    heroHeadline: "Build Recurring Revenue With a Membership Engine",
    heroSubheadline:
      "Membership Engine is a complete platform for selling memberships, class packs, and subscription access — built on your brand, with recurring billing that grows your monthly revenue predictably.",
    bodySections: [
      {
        heading: "The Business Case for Recurring Revenue",
        body: "One-time transaction businesses live and die by new customer acquisition. Membership businesses build a base of recurring revenue that survives slow months. A well-run membership model can create 40–70% of revenue from existing members before a single new sale.",
      },
      {
        heading: "Sell Memberships, Class Packs, and Tiered Access",
        body: "Membership Engine supports multiple revenue structures: flat monthly memberships, class or session packs, tiered access levels, and one-time enrollment fees. Whether you run a gym, yoga studio, academy, or online community — the system is built to match your pricing model.",
      },
      {
        heading: "Automated Billing and Member Lifecycle Management",
        body: "Stripe powers all recurring billing with automatic retry logic, dunning emails, and churn prevention features. Members manage their own accounts, pause or cancel independently, and receive automated onboarding flows — reducing your administrative load while increasing retention.",
      },
    ],
    proofPoints: [
      "Recurring Stripe billing with automatic retry",
      "Supports memberships, class packs, and tiered access",
      "Member portal with self-service account management",
      "Automated onboarding and retention email flows",
      "One-time build — no platform licensing fees",
    ],
    faqItems: [
      {
        question:
          "What types of businesses benefit most from a membership site?",
        answer:
          "Fitness studios, martial arts schools, professional academies, online communities, co-working spaces, and any business with repeat-visit clients benefit greatly from a membership model.",
      },
      {
        question: "Can members pause or cancel their own memberships?",
        answer:
          "Yes. The member portal includes self-service pause and cancellation options, reducing support overhead while giving members the control they expect.",
      },
    ],
    closingCTA:
      "Ready to build predictable monthly revenue? Let's build your engine.",
  },

  "enterprise scale": {
    metaTitle: "Enterprise Web Platform for Growing Businesses | Imperidome",
    metaDescription:
      "Full digital ecosystem for enterprise-level businesses — custom platform, no SaaS fees, complete ownership. Imperidome builds the infrastructure serious brands grow on. Contact us.",
    heroHeadline:
      "Your Complete Digital Ecosystem, Built Without Platform Limits",
    heroSubheadline:
      "Enterprise Scale is a fully custom web and operations platform — built to your exact specifications with no platform dependencies, no monthly licensing fees, and no ceiling on what your business can do online.",
    bodySections: [
      {
        heading: "When SaaS Tools Stop Scaling With Your Business",
        body: "Every SaaS platform has limits: feature caps, user limits, integration restrictions, and monthly costs that compound as your business grows. Enterprise Scale replaces your stack of third-party tools with one owned, custom-built platform that scales with you indefinitely.",
      },
      {
        heading: "Custom Integrations With Your Existing Systems",
        body: "Enterprise Scale is built to integrate with your CRM, ERP, fulfillment systems, payment processors, and analytics tools — not the other way around. We architect around your workflow, not a template that forces you to compromise your operations.",
      },
      {
        heading: "Full Ownership, Full Control",
        body: "You own the code, the infrastructure, the data, and the architecture. There is no vendor to negotiate with when you need a change, no rate increases to absorb, and no risk of a platform sunsetting the features your business depends on.",
      },
    ],
    proofPoints: [
      "Fully custom — no templates, no platform constraints",
      "Complete code and data ownership",
      "Integrates with your existing systems and tools",
      "No ongoing platform fees or licensing costs",
      "Built for businesses doing $1M+ in annual revenue",
    ],
    faqItems: [
      {
        question: "What does Enterprise Scale typically include?",
        answer:
          "Enterprise Scale is scoped to each client's needs. Common components include custom e-commerce, client portal, CRM integration, booking automation, membership management, and multi-location management — all on one owned platform.",
      },
      {
        question: "How long does an Enterprise Scale build take?",
        answer:
          "Timeline depends on scope, typically 4–10 weeks. We provide a detailed project roadmap before development begins so you know exactly what's being built and when.",
      },
    ],
    closingCTA:
      "Ready to outgrow your tools and own your infrastructure? Let's talk.",
  },

  // ─── SPEEDY SITES ─────────────────────────────────────────────────────────────
  "speedy basic": {
    metaTitle: "Speedy Basic Website — Launched in 48 Hours | Imperidome",
    metaDescription:
      "Professional business website launched in 48 hours for $149. Imperidome's Speedy Basic is the fastest way to get online with a site that looks like it cost 10x more.",
    heroHeadline: "Go Live in 48 Hours for $149 — No Waiting, No Bloat",
    heroSubheadline:
      "Speedy Basic is Imperidome's fastest path from no website to a live, professional digital presence — a clean, mobile-optimized site launched in two business days.",
    bodySections: [
      {
        heading: "Built for Speed Without Sacrificing Quality",
        body: "Speedy Basic uses Imperidome's proven 48-hour deployment pipeline. You submit your intake form, we build, you approve, it goes live. No endless revision cycles, no feature bloat, no waiting weeks for a simple site.",
      },
      {
        heading: "Everything a New Business Needs to Look Legitimate",
        body: "A homepage, services or products section, about section, contact form, and mobile optimization. Speedy Basic has everything a new or early-stage business needs to present professionally — without the costs or complexity of a full custom build.",
      },
    ],
    proofPoints: [
      "Live site in 48 business hours",
      "Mobile-first, fully responsive",
      "$149 one-time — no builder subscriptions",
      "Hosting plan required to keep it live",
      "Ideal for new businesses and side projects",
    ],
    faqItems: [
      {
        question: "What's included in a Speedy Basic website?",
        answer:
          "A single-page or multi-section site including homepage, services/products overview, about section, contact form, and mobile optimization. Delivered in 48 hours.",
      },
      {
        question: "Does Speedy Basic include hosting?",
        answer:
          "Hosting is provided through the Basic Plan ($19/mo). The build fee is separate from the monthly hosting cost.",
      },
    ],
    closingCTA: "48 hours to a professional website. Let's launch you.",
  },

  "speedy booking": {
    metaTitle:
      "Speedy Booking Website with Appointments — 48 Hours | Imperidome",
    metaDescription:
      "Launch a booking-ready website in 48 hours for $249. Imperidome's Speedy Booking includes online appointment scheduling built directly into your fast-deployed site.",
    heroHeadline: "Booking-Ready Website Live in 48 Hours for $249",
    heroSubheadline:
      "Speedy Booking includes everything in Speedy Basic plus an integrated appointment booking system — so clients can schedule with you the moment your site goes live.",
    bodySections: [
      {
        heading: "Fast Deployment, Immediate Bookings",
        body: "Service businesses can't afford to wait weeks for a website. Speedy Booking is in your client's hands in 48 hours — with a live booking calendar so you start filling your schedule on day one.",
      },
      {
        heading: "Perfect for Solo Service Providers Going Digital Fast",
        body: "Personal trainers, hair stylists, therapists, tutors, and consultants who need a professional booking presence immediately love Speedy Booking. It's the fastest way from no web presence to actively taking appointments.",
      },
    ],
    proofPoints: [
      "Live booking website in 48 business hours",
      "Appointment calendar integrated at launch",
      "$249 one-time build fee",
      "Booking Plan hosting ($39/mo) required",
      "Ideal for solo service providers",
    ],
    faqItems: [
      {
        question:
          "Can clients book appointments immediately after my site launches?",
        answer:
          "Yes. The booking calendar is configured and live as part of the 48-hour build. Clients can book the day your site goes live.",
      },
      {
        question: "Which booking platform does Speedy Booking use?",
        answer:
          "We integrate with Calendly, Acuity Scheduling, or a compatible booking tool depending on your preferences and workflow. Setup is included in the build fee.",
      },
    ],
    closingCTA: "Get your bookings flowing in 48 hours. Let's go live.",
  },

  "speedy product storefront": {
    metaTitle:
      "Speedy Product Storefront — E-Commerce in 48 Hours | Imperidome",
    metaDescription:
      "Launch a product storefront with online ordering in 48 hours for $349. Imperidome's Speedy Product Storefront gets you selling fast without platform lock-in.",
    heroHeadline: "Sell Products Online in 48 Hours for $349",
    heroSubheadline:
      "Speedy Product Storefront is Imperidome's fastest e-commerce deployment — a clean, conversion-ready product store launched in two business days, no Shopify required.",
    bodySections: [
      {
        heading: "Start Selling Without the Shopify Tax",
        body: "Shopify charges monthly fees before you make your first sale. Speedy Product Storefront is a one-time build with Stripe checkout built in — you start selling for a fraction of the cost of any major platform.",
      },
      {
        heading: "Ideal for Physical Products, Merch, and Direct Sales",
        body: "Whether you're launching a product line, selling branded merchandise, or moving physical inventory, Speedy Product Storefront gives you a professional retail presence in hours, not weeks.",
      },
    ],
    proofPoints: [
      "Live e-commerce store in 48 business hours",
      "Stripe checkout included — no platform fees",
      "$349 one-time build fee",
      "Storefront Plan hosting ($49/mo) required",
      "Mobile-optimized product catalog",
    ],
    faqItems: [
      {
        question: "Can I add new products to my Speedy storefront myself?",
        answer:
          "Yes. Your storefront includes a simple product management panel where you add items, set prices, and manage inventory without developer help.",
      },
    ],
    closingCTA: "Start selling in 48 hours. Your storefront is ready to build.",
  },

  "speedy menu storefront": {
    metaTitle: "Speedy Menu Storefront for Restaurants — 48 Hours | Imperidome",
    metaDescription:
      "A fast restaurant menu storefront with online ordering, launched in 48 hours for $349. Imperidome deploys commission-free restaurant websites that are live in two days.",
    heroHeadline: "Your Restaurant Menu Online in 48 Hours for $349",
    heroSubheadline:
      "Speedy Menu Storefront gets restaurants and food businesses online with a mobile-optimized menu and ordering system — launched in 48 hours, zero commission on every order.",
    bodySections: [
      {
        heading: "Stop Losing Orders to Third-Party Apps",
        body: "Food delivery platforms take 15–30% of every order. Speedy Menu Storefront gives you a direct online ordering channel where you keep every dollar. For a restaurant doing $10K/month in delivery, that's $1,500–$3,000 back in your pocket monthly.",
      },
      {
        heading: "Fast to Launch, Easy to Update",
        body: "Your menu management dashboard lets you update items, prices, and availability in real time from your phone. No waiting on developers, no tech frustration — just a menu that stays current.",
      },
    ],
    proofPoints: [
      "Live restaurant storefront in 48 business hours",
      "Zero commission online ordering",
      "Mobile-optimized menu display",
      "$349 one-time build — Storefront Plan hosting required",
      "Menu updates manageable from any device",
    ],
    faqItems: [
      {
        question: "Does Speedy Menu Storefront replace DoorDash or Uber Eats?",
        answer:
          "It supplements them with a direct channel you control. Many restaurants run both — the third-party apps for discovery, their own site for returning customers who know to go direct.",
      },
    ],
    closingCTA: "Zero commission. 48 hours. Let's get your menu online.",
  },

  "speedy recurring storefront": {
    metaTitle:
      "Speedy Recurring Subscription Storefront — 48 Hours | Imperidome",
    metaDescription:
      "Launch a subscription-based product storefront in 48 hours for $349. Imperidome builds recurring revenue storefronts fast — subscriptions, refills, and membership products.",
    heroHeadline: "Subscription Commerce Live in 48 Hours for $349",
    heroSubheadline:
      "Speedy Recurring Storefront is Imperidome's fastest recurring revenue deployment — a subscription product storefront with Stripe billing, live in two business days.",
    bodySections: [
      {
        heading: "Turn One-Time Buyers Into Monthly Revenue",
        body: "Subscription storefronts are the most efficient way to build predictable revenue from physical or digital products. Speedy Recurring gets you to market in 48 hours with automated billing that runs without your involvement.",
      },
      {
        heading: "Ideal for Boxes, Refills, Digital Access, and Clubs",
        body: "Subscription boxes, product refill programs, digital content memberships, and product clubs are perfect candidates for Speedy Recurring. If your product has repeat-purchase potential, subscription packaging unlocks that revenue stream immediately.",
      },
    ],
    proofPoints: [
      "Recurring Stripe billing configured at launch",
      "Live subscription storefront in 48 hours",
      "$349 one-time build fee",
      "Storefront Plan hosting ($49/mo) required",
      "Supports multiple subscription tiers",
    ],
    faqItems: [
      {
        question:
          "What types of subscription products work best with this storefront?",
        answer:
          "Physical subscription boxes, product refill programs, digital content subscriptions, member discount clubs, and any product with a natural reorder cycle are ideal fits.",
      },
    ],
    closingCTA:
      "Build recurring revenue in 48 hours. Let's launch your subscription store.",
  },

  // ─── SAAS PLANS / HOSTING ────────────────────────────────────────────────────
  "basic plan": {
    metaTitle: "Speedy Sites Basic Hosting Plan — $19/mo | Imperidome",
    metaDescription:
      "Keep your Speedy Basic website live and running for $19/month. Imperidome's Basic Plan includes hosting, uptime monitoring, and core platform maintenance.",
    heroHeadline: "Keep Your Site Live and Running for $19 a Month",
    heroSubheadline:
      "The Basic Plan provides reliable hosting infrastructure for your Speedy Basic website — keeping your online presence live, fast, and monitored without the complexity of managing hosting yourself.",
    bodySections: [
      {
        heading: "What the Basic Plan Covers",
        body: "The Basic Plan includes managed hosting, SSL certificate maintenance, uptime monitoring, and core platform updates. Everything your Speedy Basic website needs to stay live and secure.",
      },
    ],
    proofPoints: [
      "$19/month — cancel anytime",
      "Managed hosting and SSL included",
      "Uptime monitoring 24/7",
      "Required for Speedy Basic websites",
    ],
    faqItems: [
      {
        question: "Is the Basic Plan required to keep my Speedy site online?",
        answer:
          "Yes. The monthly hosting plan covers the infrastructure that keeps your site live. Without it, the site would need to be moved to separate hosting.",
      },
    ],
    closingCTA:
      "Keep your site live for less than a daily coffee. Start your plan.",
  },

  "booking plan": {
    metaTitle: "Speedy Sites Booking Hosting Plan — $39/mo | Imperidome",
    metaDescription:
      "Hosting plan for Speedy Booking websites — $39/month includes hosting, booking system maintenance, and uptime monitoring. Keep your appointment calendar running smoothly.",
    heroHeadline: "Keep Your Booking Calendar Live for $39 a Month",
    heroSubheadline:
      "The Booking Plan provides the hosting infrastructure and booking system maintenance your Speedy Booking website needs to keep accepting appointments reliably.",
    bodySections: [
      {
        heading: "What the Booking Plan Covers",
        body: "Managed hosting, SSL, uptime monitoring, and booking platform maintenance — everything required to keep your appointment system running reliably for clients who want to book around the clock.",
      },
    ],
    proofPoints: [
      "$39/month — cancel anytime",
      "Booking platform maintenance included",
      "Uptime monitoring ensures clients can always book",
      "Required for Speedy Booking websites",
    ],
    faqItems: [
      {
        question:
          "What happens to my booking system if I cancel the Booking Plan?",
        answer:
          "Your site and booking system would need to be migrated to independent hosting. We recommend staying on the plan to avoid any disruption to client bookings.",
      },
    ],
    closingCTA: "Keep your bookings flowing. Activate your hosting plan today.",
  },

  "storefront plan": {
    metaTitle: "Speedy Sites Storefront Hosting Plan — $49/mo | Imperidome",
    metaDescription:
      "Hosting plan for Speedy Storefront websites — $49/month includes e-commerce hosting, payment processing uptime, and platform maintenance. Keep your store selling.",
    heroHeadline: "Keep Your Online Store Live and Selling for $49 a Month",
    heroSubheadline:
      "The Storefront Plan provides the managed hosting and e-commerce infrastructure your Speedy Storefront needs to process orders reliably, every day.",
    bodySections: [
      {
        heading: "What the Storefront Plan Covers",
        body: "E-commerce hosting, payment processing uptime, SSL maintenance, and platform updates — everything your storefront needs to keep selling without technical interruption.",
      },
    ],
    proofPoints: [
      "$49/month — cancel anytime",
      "E-commerce hosting and SSL included",
      "Payment processing uptime monitoring",
      "Required for all Speedy Storefront variants",
    ],
    faqItems: [
      {
        question: "Does the Storefront Plan include transaction fees?",
        answer:
          "No. Storefront Plan is a flat hosting fee. Transaction processing is handled by Stripe at their standard rates (2.9% + $0.30), with no additional markup from Imperidome.",
      },
    ],
    closingCTA:
      "Keep your store running. Activate your storefront hosting plan.",
  },

  "keep it live": {
    metaTitle: "Website Maintenance Plan — Keep It Live | Imperidome",
    metaDescription:
      "Basic website maintenance for $29/month. Imperidome's Keep It Live plan covers updates, uptime monitoring, and security patches — self-managed with no support included.",
    heroHeadline: "Basic Site Maintenance for $29 a Month",
    heroSubheadline:
      "Keep It Live is Imperidome's entry-level maintenance plan — covering essential updates, security patches, and uptime monitoring for businesses that manage their own content.",
    bodySections: [
      {
        heading: "What Keep It Live Covers",
        body: "Core platform updates, security patches, and uptime monitoring. Keep It Live is designed for technically comfortable business owners who manage their own content and only need infrastructure-level maintenance.",
      },
      {
        heading: "When to Upgrade Beyond Keep It Live",
        body: "If your site needs regular content updates, growth-focused changes, or any form of support from the Imperidome team, Stay Sharp or Stay Ahead will serve you better. Keep It Live is a self-service tier — you are responsible for content management.",
      },
    ],
    proofPoints: [
      "$29/month — most affordable maintenance option",
      "Security patches and platform updates included",
      "Uptime monitoring included",
      "Self-managed — no team support at this tier",
    ],
    faqItems: [
      {
        question: "Does Keep It Live include content updates?",
        answer:
          "No. Keep It Live covers infrastructure maintenance only. For content updates and team support, upgrade to Stay Sharp or Stay Ahead.",
      },
    ],
    closingCTA: "Keep your site secure and live for $29/month. Start today.",
  },

  "stay sharp": {
    metaTitle:
      "Website Maintenance with Light Support — Stay Sharp | Imperidome",
    metaDescription:
      "Website maintenance with light support for $89/month. Stay Sharp includes updates, monitoring, and limited Imperidome team access for growing businesses.",
    heroHeadline: "Maintenance Plus Light Support for $89 a Month",
    heroSubheadline:
      "Stay Sharp keeps your site updated, monitored, and backed by limited Imperidome team support — the right plan for businesses that want peace of mind without full partnership.",
    bodySections: [
      {
        heading: "Everything in Keep It Live, Plus Team Access",
        body: "Stay Sharp includes all infrastructure maintenance from Keep It Live, with added access to the Imperidome team for minor content update requests and technical questions. You're not on your own.",
      },
    ],
    proofPoints: [
      "$89/month — infrastructure + light support",
      "Minor content update requests included",
      "Security patches and platform updates",
      "Team access for technical questions",
    ],
    faqItems: [
      {
        question: "How many update requests are included in Stay Sharp?",
        answer:
          "Stay Sharp includes a limited number of minor content update requests per month. For regular ongoing changes and growth-focused work, Stay Ahead is the recommended upgrade.",
      },
    ],
    closingCTA: "Maintenance you can rely on. Activate Stay Sharp today.",
  },

  "stay ahead": {
    metaTitle:
      "Growth-Focused Website Maintenance Plan — Stay Ahead | Imperidome",
    metaDescription:
      "The most popular Imperidome maintenance plan at $249/mo. Stay Ahead includes proactive optimization, content updates, SEO maintenance, and full team support. Most popular.",
    heroHeadline: "The Growth Engine for Your Website — $249 a Month",
    heroSubheadline:
      "Stay Ahead is Imperidome's most popular plan — proactive optimization, content updates, SEO maintenance, and full team support that keeps your site performing better every month.",
    bodySections: [
      {
        heading: "Proactive Optimization, Not Just Maintenance",
        body: "Stay Ahead goes beyond keeping the lights on. Our team actively looks for performance improvements, broken elements, SEO opportunities, and conversion rate issues — then fixes them before they cost you business.",
      },
      {
        heading: "Content Updates on Demand",
        body: "Text changes, new service pages, image swaps, seasonal promotions — just send a request and the Imperidome team handles it. No developer retainer, no project quotes for small changes, no friction.",
      },
      {
        heading: "Why Stay Ahead Is the Most Popular Plan",
        body: "Businesses at $249/month get the equivalent of 2+ hours of agency time per month — at a fraction of the cost of keeping a developer on retainer. The ROI is immediate the first time you need a change made and it happens the same day.",
      },
    ],
    proofPoints: [
      "Most popular plan — chosen by 60% of Imperidome clients",
      "Content updates included on demand",
      "Proactive performance and SEO optimization",
      "Full Imperidome team support",
      "$249/month — no contracts",
    ],
    faqItems: [
      {
        question: "What is included in Stay Ahead that's not in Stay Sharp?",
        answer:
          "Stay Ahead includes unlimited minor content update requests, proactive performance optimization, SEO maintenance, and full team response priority — versus the limited support and update quota in Stay Sharp.",
      },
    ],
    closingCTA:
      "Join the majority of Imperidome clients on Stay Ahead. Let's keep you growing.",
  },

  "full partner": {
    metaTitle: "Full Partner Revenue System — Website + Growth | Imperidome",
    metaDescription:
      "Imperidome's Full Partner plan at $549/mo is a complete revenue-focused web operations system — unlimited updates, growth strategy, and full team support for scaling businesses.",
    heroHeadline: "A Revenue System, Not Just a Maintenance Plan",
    heroSubheadline:
      "Full Partner is Imperidome's comprehensive web operations engagement — unlimited updates, revenue-focused strategy, analytics reporting, and a dedicated team invested in your growth.",
    bodySections: [
      {
        heading: "Everything in Stay Ahead, Elevated",
        body: "Full Partner includes all Stay Ahead features plus unlimited content and design updates, monthly strategy calls, conversion rate optimization, and priority same-day response. It's the closest thing to having an in-house digital team without the overhead.",
      },
      {
        heading: "Built for Businesses Ready to Scale Aggressively",
        body: "If your business is actively growing and your website needs to keep up — new pages, new offers, new campaigns, new integrations — Full Partner removes every barrier to execution. You bring the vision; we implement it.",
      },
    ],
    proofPoints: [
      "$549/month — complete web operations coverage",
      "Unlimited content and design update requests",
      "Monthly strategy and performance reviews",
      "Conversion rate optimization included",
      "Priority same-day response from the Imperidome team",
    ],
    faqItems: [
      {
        question: "Is Full Partner worth it over Stay Ahead?",
        answer:
          "For businesses that regularly need changes, run campaigns, or are actively growing their web presence, yes. The value is in unlimited execution — there's no friction between your ideas and implementation.",
      },
    ],
    closingCTA:
      "Ready for a real web operations partner? Let's talk Full Partner.",
  },

  "enterprise partner": {
    metaTitle:
      "Enterprise Partner Plan — Dedicated Web Operations | Imperidome",
    metaDescription:
      "Enterprise-level web operations for $799/mo. Dedicated account manager, unlimited support, advanced analytics, and strategic oversight from Imperidome's senior team.",
    heroHeadline: "Enterprise-Level Web Operations With a Dedicated Manager",
    heroSubheadline:
      "Enterprise Partner is Imperidome's highest-tier engagement — a dedicated account manager, unlimited operations support, and strategic oversight built for businesses with complex, high-stakes web needs.",
    bodySections: [
      {
        heading: "Your Own Dedicated Account Manager",
        body: "Enterprise Partner assigns a dedicated Imperidome account manager to your business — someone who knows your brand, your goals, and your tech stack inside out. Requests are handled with executive priority.",
      },
      {
        heading: "For Complex, Multi-System Digital Operations",
        body: "Multi-location businesses, high-traffic platforms, and businesses with complex integration requirements need more than a maintenance plan — they need a partner who understands the full picture. Enterprise Partner is built for that complexity.",
      },
    ],
    proofPoints: [
      "Dedicated account manager assigned to your business",
      "$799/month — all-inclusive web operations",
      "Unlimited updates, changes, and requests",
      "Advanced analytics and strategic reporting",
      "For businesses with $2M+ in annual revenue",
    ],
    faqItems: [
      {
        question: "How is Enterprise Partner different from Full Partner?",
        answer:
          "Enterprise Partner includes a named dedicated account manager, executive-priority response times, advanced analytics reporting, and strategic oversight sessions — versus the shared team model in Full Partner.",
      },
    ],
    closingCTA:
      "Your business deserves a dedicated partner. Let's build that relationship.",
  },

  // ─── CINEMATIC ADS ───────────────────────────────────────────────────────────
  "growth protocol": {
    metaTitle: "Cinematic Brand Video Ad — Growth Protocol | Imperidome",
    metaDescription:
      "One cinematic brand video ad for $299. Imperidome's Growth Protocol delivers a high-production video ad optimized for Meta, Instagram, and YouTube. Order now.",
    heroHeadline: "One Cinematic Brand Ad That Stops the Scroll",
    heroSubheadline:
      "Growth Protocol is your entry point into professional video advertising — a single high-production cinematic brand ad that performs on Meta, Instagram, and YouTube.",
    bodySections: [
      {
        heading: "Why Most Business Video Ads Fail",
        body: "Amateur video production signals low-quality brands to buyers in the first three seconds. Cinematic production — professional color grading, sound design, motion graphics, and strategic pacing — is what separates ads that convert from ads that get skipped.",
      },
      {
        heading: "What Growth Protocol Delivers",
        body: "A single cinematic video ad, fully produced and optimized for social media platforms. Includes branded motion graphics, professional audio, and format variants for Meta feed, Stories, and YouTube pre-roll. Ready to upload directly to your ad manager.",
      },
    ],
    proofPoints: [
      "Professional cinematic production quality",
      "Optimized for Meta, Instagram, and YouTube",
      "Format variants for all major placements",
      "$299 one-time — delivered in 5 business days",
    ],
    faqItems: [
      {
        question:
          "What makes Imperidome's video ads different from standard commercial production?",
        answer:
          "Imperidome ads are produced with conversion intent — every frame, pacing decision, and audio choice is made to stop the scroll and drive action, not just look beautiful.",
      },
    ],
    closingCTA:
      "One ad that changes how your brand looks online. Let's create it.",
  },

  "the pilot": {
    metaTitle: "Cinematic Ads Quarterly Plan — The Pilot | Imperidome",
    metaDescription:
      "3 cinematic brand video ads per quarter for $1,049. Imperidome's The Pilot is the ad retainer for growing brands ready to maintain a consistent video content strategy.",
    heroHeadline: "3 Cinematic Ads Per Quarter to Keep Your Brand Visible",
    heroSubheadline:
      "The Pilot is Imperidome's quarterly ad retainer for brands that understand consistent video output is the engine of audience growth — three production-quality ads every quarter.",
    bodySections: [
      {
        heading: "Why Consistent Video Output Wins",
        body: "Brands that publish video ads consistently outperform those that run one campaign and go dark. The algorithm rewards frequency. Audiences build familiarity. Conversion costs decrease over time. The Pilot gives you the cadence to compete in the attention economy.",
      },
      {
        heading: "What You Get Each Quarter",
        body: "Three fully produced cinematic video ads per quarter, each crafted around your campaign objective — brand awareness, product launch, seasonal offer, or event promotion. Includes all format variants for Meta, Instagram, and YouTube.",
      },
    ],
    proofPoints: [
      "3 cinematic ads per quarter",
      "Consistent brand video strategy",
      "$1,049/quarter — billed every 3 months",
      "All format variants included for every placement",
    ],
    faqItems: [
      {
        question: "How are the 3 quarterly ads allocated?",
        answer:
          "You submit creative briefs for each ad at the start of the quarter. Imperidome produces them on a rolling schedule, with reviews between each deliverable.",
      },
    ],
    closingCTA:
      "Stay in front of your audience every quarter. Start The Pilot.",
  },

  "the pro": {
    metaTitle: "Cinematic Ads Pro Plan — 6 Ads Per Quarter | Imperidome",
    metaDescription:
      "6 cinematic brand video ads per quarter for $1,899. Imperidome's The Pro is the most popular ad retainer for brands serious about video marketing ROI and consistent output.",
    heroHeadline: "6 Cinematic Ads Per Quarter for Brands That Mean Business",
    heroSubheadline:
      "The Pro is Imperidome's most popular ad retainer — six production-quality cinematic video ads every quarter, built around your campaign strategy and optimized for maximum ROI.",
    bodySections: [
      {
        heading: "Double the Output, Double the Presence",
        body: "Six ads per quarter means you can cover two distinct campaign objectives simultaneously — one creative direction for brand awareness, another for direct response. Most brands at this level see a measurable decrease in CPM and CPA within the first two quarters.",
      },
      {
        heading: "Production Quality at Volume",
        body: "Scaling ad output typically means sacrificing quality. Not with The Pro. Imperidome maintains cinematic production standards across all six deliverables — the same color science, sound design, and motion craft that would cost $3,000+ per ad at a traditional production house.",
      },
    ],
    proofPoints: [
      "Most popular cinematic ads plan",
      "6 cinematic ads per quarter",
      "$1,899/quarter — best per-ad value",
      "All format variants for Meta, Instagram, YouTube",
      "Dedicated creative strategy per quarter",
    ],
    faqItems: [
      {
        question: "Why is The Pro the most popular plan?",
        answer:
          "Six ads per quarter hits the sweet spot for most active advertising brands — enough volume to test creatives, maintain frequency, and cover multiple campaign angles without overcommitting budget.",
      },
    ],
    closingCTA:
      "6 ads per quarter. Maximum brand visibility. Start The Pro today.",
  },

  "the elite": {
    metaTitle: "Cinematic Ads Elite Plan — 9 Ads Per Quarter | Imperidome",
    metaDescription:
      "9 cinematic brand video ads per quarter for $2,499. Imperidome's The Elite is the maximum output ad retainer for aggressive brands dominating their market with video.",
    heroHeadline: "9 Cinematic Ads Per Quarter for Market-Dominating Brands",
    heroSubheadline:
      "The Elite is Imperidome's maximum-output ad retainer — nine production-quality cinematic video ads every quarter for brands that compete aggressively across every digital channel.",
    bodySections: [
      {
        heading: "Dominate Every Placement With Maximum Ad Volume",
        body: "Nine ads per quarter means you have a creative for every funnel stage, every audience segment, and every platform. Top-of-funnel brand awareness, middle-of-funnel education, bottom-of-funnel conversion — The Elite covers all of them at production quality no competitor can match without a full in-house studio.",
      },
      {
        heading: "Built for Brands With Serious Ad Budgets",
        body: "The Elite is for brands spending $10,000+ per month on paid social. At that spend level, creative quality and volume directly impact your return on ad spend. A single high-performing creative from a nine-ad quarterly retainer can outperform an entire campaign of mediocre content.",
      },
    ],
    proofPoints: [
      "9 cinematic ads per quarter — maximum output",
      "$2,499/quarter — lowest per-ad rate across all plans",
      "Full funnel coverage: awareness + retargeting + conversion",
      "All platform format variants included",
      "For brands spending $10K+/mo on paid social",
    ],
    faqItems: [
      {
        question: "Who is The Elite plan designed for?",
        answer:
          "The Elite is for brands with substantial ad budgets that understand creative quality and volume as primary ROAS drivers. It's for marketers who know that bad creatives burn budget, not just miss opportunities.",
      },
    ],
    closingCTA:
      "Dominate your market with 9 cinematic ads per quarter. Let's start.",
  },

  // ─── PRODUCT ADS ──────────────────────────────────────────────────────────────
  flash: {
    metaTitle: "Product Video Ad — 15 Seconds — Flash | Imperidome",
    metaDescription:
      "One 15-second product video ad for $399. Imperidome's Flash delivers a single high-converting product ad optimized for social media placements. Perfect for product launches.",
    heroHeadline: "One 15-Second Product Ad That Sells on Contact",
    heroSubheadline:
      "Flash is Imperidome's single-shot product video — a 15-second, scroll-stopping product ad built for Meta, TikTok, and Instagram, delivered fast and produced to convert.",
    bodySections: [
      {
        heading: "15 Seconds to Make the Sale",
        body: "Short-form video is the highest-converting ad format on Meta and TikTok. A well-crafted 15-second product video — tight pacing, compelling visuals, and a clear CTA — consistently outperforms longer ads at half the CPM. Flash delivers exactly that.",
      },
      {
        heading: "Perfect for Product Launches and Seasonal Campaigns",
        body: "Launching a new product or running a limited-time offer? Flash gives you a single, production-quality video asset to support the push without committing to a full retainer. Get the creative you need, when you need it.",
      },
    ],
    proofPoints: [
      "15-second format — highest-converting short-form length",
      "Optimized for Meta, TikTok, and Instagram",
      "$399 one-time per ad",
      "Delivered in 5 business days",
    ],
    faqItems: [
      {
        question: "Can I use the Flash ad on multiple platforms?",
        answer:
          "Yes. Your Flash ad is delivered in multiple aspect ratios (16:9, 9:16, 1:1) ready for Meta feed, Stories/Reels, TikTok, and YouTube Shorts.",
      },
    ],
    closingCTA: "15 seconds to make an impression. Let's shoot your Flash ad.",
  },

  starter: {
    metaTitle: "Monthly Product Ads — 3 Videos/Month — Starter | Imperidome",
    metaDescription:
      "3 product video ads per month for $899. Imperidome's Starter plan gives growing product brands a consistent monthly video output for Meta, TikTok, and Instagram ads.",
    heroHeadline: "3 Product Video Ads Every Month for $899",
    heroSubheadline:
      "Starter is the entry retainer for product brands ready to run video ads consistently — three production-quality 15-second product videos delivered every month.",
    bodySections: [
      {
        heading: "Consistency Is the Competitive Advantage",
        body: "Ad fatigue kills campaigns. Brands that refresh their creative monthly see 30–50% better ROAS than brands running the same ad for 90 days. Starter gives you the cadence to stay fresh without managing a production team.",
      },
      {
        heading: "Enough Volume to Test and Optimize",
        body: "Three ads per month gives your media buyer or marketing team enough creative variants to run proper A/B tests, identify winning hooks, and optimize toward your best performers. Guessing stops, scaling starts.",
      },
    ],
    proofPoints: [
      "3 product ads per month — consistent output",
      "$899/month — cancel anytime",
      "All format variants for every placement",
      "Ideal for brands spending $2K-$10K/month on paid social",
    ],
    faqItems: [
      {
        question: "Can I direct the creative for my monthly Starter ads?",
        answer:
          "Yes. Each month you submit briefs for your three ads — angles, offers, and objectives. Imperidome produces to brief with creative direction applied to maximize platform performance.",
      },
    ],
    closingCTA:
      "3 ads a month. Consistent creative. Start your Starter plan today.",
  },

  scale: {
    metaTitle:
      "Monthly Product Ads — 5 Videos + Asset Vault — Scale | Imperidome",
    metaDescription:
      "5 product video ads per month plus the Asset Vault for $1,249. Imperidome's Scale plan is the most popular for product brands investing seriously in paid social video.",
    heroHeadline: "5 Product Ads a Month Plus Your Complete Asset Vault",
    heroSubheadline:
      "Scale is Imperidome's most popular product ads plan — five monthly 15-second product videos plus the Asset Vault, a growing library of reusable brand video elements.",
    bodySections: [
      {
        heading: "The Asset Vault: Creative Capital That Compounds",
        body: "Every month, Imperidome builds your Asset Vault — a library of brand video elements, motion graphics, product B-roll, and hooks that can be remixed into future ads. Over time, the Vault becomes a compounding creative asset that reduces production time and increases ad variety.",
      },
      {
        heading: "Five Ads a Month at Volume Pricing",
        body: "At Scale, you're producing five ads per month — enough to cover multiple products, multiple audiences, and multiple offer angles simultaneously. Combined with the Asset Vault, your creative output grows while your cost per asset decreases each month.",
      },
    ],
    proofPoints: [
      "Most popular product ads plan",
      "5 product ads per month",
      "Asset Vault grows your creative library every month",
      "$1,249/month — best value per ad",
      "Ideal for brands scaling to $50K+/month in revenue",
    ],
    faqItems: [
      {
        question: "What is the Asset Vault and how does it work?",
        answer:
          "The Asset Vault is a growing library of video elements, motion graphics, and brand-specific production assets Imperidome builds for you each month. These assets are reused and remixed across future ads — reducing production time and increasing creative consistency.",
      },
    ],
    closingCTA:
      "5 ads a month and a vault that grows. Scale your creative output today.",
  },

  "custom projects": {
    metaTitle: "Custom Video Production — 30-60 Second Ads | Imperidome",
    metaDescription:
      "Custom 30-60+ second video production for $1,500. Imperidome builds hero brand films, product showcases, and long-form ad content for businesses with unique creative needs.",
    heroHeadline: "Custom Video Production for Your Unique Brand Story",
    heroSubheadline:
      "Custom Projects is Imperidome's bespoke video production service — fully custom 30–60+ second brand films, product showcases, and long-form ad content scoped entirely to your creative vision.",
    bodySections: [
      {
        heading: "When Standard Formats Don't Tell Your Story",
        body: "Some brands have a story that can't be told in 15 seconds. Hero films, brand documentaries, product feature showcases, and campaign centerpieces require custom production — a longer canvas, more deliberate pacing, and a strategic narrative arc.",
      },
      {
        heading: "Scoped to Your Budget and Vision",
        body: "Custom Projects begins with a creative brief session. From there, Imperidome scopes the production to match your objective, budget, and timeline. Every element — concept, scripting, production, post-production — is handled in-house.",
      },
    ],
    proofPoints: [
      "Fully custom 30-60+ second production",
      "Scripting, production, and post-production included",
      "Starting at $1,500 — scoped to your needs",
      "Delivered in 10 business days",
    ],
    faqItems: [
      {
        question: "What types of custom video projects does Imperidome handle?",
        answer:
          "Hero brand films, product showcase videos, testimonial productions, event recap videos, explainer animations, and any long-form ad or content video your brand needs.",
      },
    ],
    closingCTA:
      "Your brand has a story worth telling right. Let's build your custom production.",
  },

  // ─── AI RECEPTIONIST ─────────────────────────────────────────────────────────
  "the safety net": {
    metaTitle: "AI Receptionist — Missed Call Text-Back | Imperidome",
    metaDescription:
      "Never lose a lead to a missed call again. Imperidome's AI Receptionist Safety Net responds to missed calls by text, captures leads, and routes messages for $199/mo.",
    heroHeadline: "Every Missed Call Gets a Response. Automatically.",
    heroSubheadline:
      "The Safety Net is Imperidome's entry-level AI receptionist — a 24/7 missed call text-back system that captures every lead and routes every message while you focus on your business.",
    bodySections: [
      {
        heading: "The Business You're Losing to Missed Calls",
        body: "Studies show that 62% of calls to small businesses go unanswered. Of those, 85% do not call back — they call your competitor. The Safety Net ensures that every unanswered call receives an immediate automated text response, keeping the lead in your pipeline.",
      },
      {
        heading: "24/7 Lead Capture Without a Human on Duty",
        body: "The Safety Net operates around the clock — capturing lead information via SMS, routing inquiries to the right team member, and logging every interaction. Your business never goes dark, even when you do.",
      },
      {
        heading: "No Setup Fee, No Commitment Beyond Monthly",
        body: "The Safety Net is the only AI Receptionist tier with no setup fee. At $199/month, it's the lowest barrier to AI-powered lead capture available — ideal for businesses testing the value of automated answering before committing to full AI voice.",
      },
    ],
    proofPoints: [
      "24/7 missed call text-back — zero leads lost",
      "SMS routing and lead capture automated",
      "$199/month — no setup fee",
      "Web-chat widget included",
      "Operational in 24-48 hours after activation",
    ],
    faqItems: [
      {
        question: "What happens when a customer calls and no one answers?",
        answer:
          "The Safety Net sends an immediate automated text message to the caller, acknowledges their call, and asks how it can help — capturing their information and routing it to your team.",
      },
      {
        question: "Does The Safety Net include an AI voice assistant?",
        answer:
          "No. The Safety Net is SMS-based only. For AI voice capabilities, The Receptionist or The Closer plans include a full AI voice assistant.",
      },
    ],
    closingCTA:
      "Stop losing leads to missed calls. Activate The Safety Net today.",
  },

  "the receptionist": {
    metaTitle: "AI Voice Receptionist — FAQ + Booking | Imperidome",
    metaDescription:
      "AI voice receptionist with FAQ answering, SMS booking links, call transcripts, and recordings for $399/mo + $249 setup. Imperidome's most popular AI receptionist plan.",
    heroHeadline: "An AI Receptionist That Answers, Books, and Records — 24/7",
    heroSubheadline:
      "The Receptionist is Imperidome's most popular AI voice plan — a fully trained AI voice receptionist that answers questions, sends booking links by SMS, transcribes calls, and captures every interaction.",
    bodySections: [
      {
        heading: "A Receptionist That Never Calls in Sick",
        body: "The Receptionist is an AI voice system trained on your business's specific FAQs, services, and workflows. It answers calls, handles common questions, and routes complex inquiries to a human — 24 hours a day, 365 days a year.",
      },
      {
        heading: "Booking Links by SMS — The Friction-Free Close",
        body: "After answering a caller's questions, The Receptionist sends a booking link directly to their phone via SMS. Instead of transferring to a voicemail or asking them to call back, the AI closes the loop by putting the appointment link in their hand immediately.",
      },
      {
        heading: "Call Transcripts and Recordings for Every Conversation",
        body: "Every call handled by The Receptionist is recorded and transcribed. Your dashboard shows you exactly what callers are asking, where leads are getting stuck, and how your AI is performing — giving you the data to optimize both your AI and your human follow-up.",
      },
    ],
    proofPoints: [
      "Most popular AI receptionist plan",
      "AI voice answers calls 24/7",
      "Sends booking links via SMS after the call",
      "Full call transcripts and recordings in your dashboard",
      "$399/month + $249 one-time setup",
    ],
    faqItems: [
      {
        question: "How is The Receptionist trained on my business?",
        answer:
          "During setup, Imperidome collects your FAQs, service descriptions, pricing, hours, and booking workflow. The AI is trained on this knowledge base and tested before going live.",
      },
      {
        question:
          "Can The Receptionist handle objections or just basic questions?",
        answer:
          "The Receptionist handles FAQs and common inquiries. For advanced objection handling, custom qualifying questions, and calendar integration for verbal booking, upgrade to The Closer.",
      },
    ],
    closingCTA:
      "A receptionist that works 24/7 and never misses a call. Let's activate yours.",
  },

  "the closer": {
    metaTitle: "AI Sales Receptionist — Calendar + CRM | Imperidome",
    metaDescription:
      "AI receptionist with calendar booking, CRM integration, objection handling, and call transcripts for $799/mo + $499 setup. Imperidome's most powerful AI voice plan.",
    heroHeadline:
      "An AI That Answers, Qualifies, and Books — Closing Leads on Every Call",
    heroSubheadline:
      "The Closer is Imperidome's most powerful AI receptionist — it answers, qualifies leads with custom questions, handles objections, and verbally books appointments directly into your calendar.",
    bodySections: [
      {
        heading: "Qualify Every Lead Before It Reaches Your Team",
        body: "The Closer asks your custom qualifying questions on every call — budget range, timeline, specific service interest, location — before routing to a human or booking an appointment. Your team only speaks to pre-qualified prospects.",
      },
      {
        heading: "Verbal Booking Directly Into Your Calendar",
        body: "No SMS link, no call-back required. The Closer verbally confirms appointment availability and books directly into your calendar on the call. The client hangs up with a confirmed appointment — the friction that kills 40% of leads is eliminated.",
      },
      {
        heading: "CRM Integration and Objection Handling",
        body: "Every call log, lead detail, and transcript flows automatically into your CRM. The Closer is also trained with objection handling scripts — so when a caller hesitates, the AI responds with the right reframe instead of going silent or transferring prematurely.",
      },
    ],
    proofPoints: [
      "Custom qualifying questions on every call",
      "Verbal calendar booking — no link required",
      "CRM integration — every lead auto-logged",
      "Trained objection handling scripts",
      "$799/month + $499 one-time setup",
    ],
    faqItems: [
      {
        question: "How does The Closer handle objections?",
        answer:
          "Imperidome works with you to build objection handling scripts during setup. The AI is trained on your most common objections and the corresponding responses that move the conversation forward.",
      },
      {
        question: "Which calendar platforms does The Closer integrate with?",
        answer:
          "The Closer integrates with Google Calendar, Calendly, and Acuity Scheduling. Other integrations are available depending on your CRM and booking platform.",
      },
    ],
    closingCTA:
      "Let your AI close leads while you sleep. Activate The Closer now.",
  },

  "ai receptionist setup fee - receptionist": {
    metaTitle: "AI Receptionist Setup Fee — Receptionist Plan | Imperidome",
    metaDescription:
      "One-time $249 setup fee for the AI Receptionist plan. Covers AI training, FAQ knowledge base build, SMS booking integration, and full system testing before go-live.",
    heroHeadline: "One-Time Setup That Gets Your AI Receptionist Live Right",
    heroSubheadline:
      "The $249 setup fee covers the full onboarding, training, and integration work required to get your AI Receptionist live — trained on your business, tested, and ready to answer calls.",
    bodySections: [
      {
        heading: "What the Setup Fee Covers",
        body: "Imperidome's setup team collects your business FAQs, service details, pricing, and booking workflow. They build and test the AI knowledge base, configure SMS booking links, and validate the complete system before your AI goes live. You don't do technical work — we handle everything.",
      },
    ],
    proofPoints: [
      "One-time fee — $249",
      "Full AI knowledge base build included",
      "SMS booking configuration included",
      "System tested before go-live",
    ],
    faqItems: [
      {
        question: "Can I skip the setup fee and configure the AI myself?",
        answer:
          "No. The setup fee is required for all Receptionist plan activations. It ensures your AI is properly trained and tested — a poorly configured AI costs you more in lost leads than the setup fee.",
      },
    ],
    closingCTA: "Get your AI Receptionist set up and live the right way.",
  },

  "ai receptionist setup fee - closer": {
    metaTitle: "AI Closer Setup Fee — Full AI Sales Setup | Imperidome",
    metaDescription:
      "One-time $499 setup fee for the AI Closer plan. Covers CRM integration, objection scripts, calendar booking setup, qualifying questions, and full system testing.",
    heroHeadline: "One-Time Setup That Builds Your AI Sales Closer",
    heroSubheadline:
      "The $499 setup fee covers the comprehensive configuration required for The Closer — CRM integration, custom qualifying scripts, objection handling, calendar booking, and end-to-end testing.",
    bodySections: [
      {
        heading: "What the Closer Setup Fee Covers",
        body: "Imperidome's team builds your qualifying question scripts, objection handling responses, CRM integration, and calendar booking configuration from scratch. Every element is tested on live calls before your Closer goes live — so it performs from day one.",
      },
    ],
    proofPoints: [
      "One-time fee — $499",
      "CRM and calendar integration configured",
      "Custom qualifying and objection scripts built",
      "End-to-end system testing before launch",
    ],
    faqItems: [
      {
        question: "How long does the Closer setup take?",
        answer:
          "The Closer setup typically takes 3-5 business days from brief submission to go-live, including two rounds of testing and client approval.",
      },
    ],
    closingCTA:
      "A properly built AI closer is your highest-ROI sales hire. Let's set it up.",
  },

  // ─── GROWTH HUB ──────────────────────────────────────────────────────────────
  "the lead engine package": {
    metaTitle: "Lead Engine Package — Full Traffic Bundle | Imperidome",
    metaDescription:
      "Complete traffic and lead generation bundle for $397/month. Imperidome's Lead Engine Package combines SEO, Google Ads, social media sync, and local optimization into one system.",
    heroHeadline: "The Complete Lead Generation System for $397 a Month",
    heroSubheadline:
      "The Lead Engine Package combines Imperidome's most powerful traffic tools into one discounted bundle — local SEO, content SEO, Google Ads management, and social media sync, working together to drive consistent inbound leads.",
    bodySections: [
      {
        heading: "Why Individual Traffic Tools Underperform Without a System",
        body: "Running SEO, paid ads, and social media independently creates fragmented data, inconsistent messaging, and poor attribution. The Lead Engine Package unifies these channels into a coordinated traffic system where each component amplifies the others.",
      },
      {
        heading: "What's Included in the Bundle",
        body: "Local SEO Booster, Blog/Content SEO, Google Ads Management, and Social Media Sync — combined at a significant discount from purchasing each individually. Everything is managed by Imperidome's team with monthly reporting on every channel.",
      },
    ],
    proofPoints: [
      "4 traffic channels in one coordinated bundle",
      "$397/month — discounted from individual prices",
      "Monthly cross-channel performance reporting",
      "Managed by Imperidome's growth team",
    ],
    faqItems: [
      {
        question: "What's included in The Lead Engine Package?",
        answer:
          "Local SEO Booster, Blog/Content SEO, Google Ads Management, and Social Media Sync — all managed by the Imperidome team and coordinated for cross-channel impact.",
      },
    ],
    closingCTA:
      "Turn your website into a lead generation machine. Start The Lead Engine.",
  },

  "local seo booster": {
    metaTitle: "Local SEO Optimization Service — $199/mo | Imperidome",
    metaDescription:
      "Local SEO management for $199/month. Imperidome optimizes your Google Business Profile, builds local citations, and targets geographic keywords to drive local search traffic.",
    heroHeadline: "Dominate Local Search Results for $199 a Month",
    heroSubheadline:
      "Local SEO Booster is Imperidome's targeted local search optimization service — Google Business Profile management, citation building, and geographic keyword targeting to get your business found by local buyers.",
    bodySections: [
      {
        heading:
          "Why Local SEO Is the Highest-ROI Channel for Local Businesses",
        body: "Over 80% of 'near me' searches result in a store visit or contact within 24 hours. Local SEO directly captures purchase-intent traffic from buyers actively looking for what you sell in your area. It's the most direct path from search to sale for location-based businesses.",
      },
      {
        heading: "What Local SEO Booster Includes Each Month",
        body: "Google Business Profile optimization and management, local citation building and cleanup, geographic keyword optimization on your site pages, and monthly ranking reports by location and keyword.",
      },
    ],
    proofPoints: [
      "Google Business Profile optimized and managed monthly",
      "Local citation building across 50+ directories",
      "Geographic keyword targeting on-page",
      "$199/month — results typically visible in 60-90 days",
    ],
    faqItems: [
      {
        question: "How long does local SEO take to show results?",
        answer:
          "Most businesses see measurable ranking improvements within 60-90 days of consistent local SEO work. Competitive markets may take 3-6 months for significant position gains.",
      },
    ],
    closingCTA:
      "Get found by local buyers. Start your Local SEO Booster today.",
  },

  "blog / content seo": {
    metaTitle: "Blog Content Writing & SEO Strategy — $299/mo | Imperidome",
    metaDescription:
      "Blog and content SEO for $299/month. Imperidome researches, writes, and publishes keyword-targeted blog content that builds organic search authority and drives traffic.",
    heroHeadline: "Consistent SEO Content That Builds Your Search Authority",
    heroSubheadline:
      "Blog/Content SEO is Imperidome's managed content marketing service — keyword research, content strategy, writing, and publishing — building the organic search presence that generates leads for years.",
    bodySections: [
      {
        heading: "Why Content Is the Foundation of Long-Term Organic Traffic",
        body: "Technical SEO gets you indexed. Content SEO builds the authority that ranks you for dozens or hundreds of valuable keywords over time. Businesses that invest in consistent content creation accumulate search equity that compounds — compounding that no paid campaign can replicate.",
      },
      {
        heading: "Imperidome Handles Everything — Research to Publish",
        body: "You don't write a word. Imperidome conducts keyword research, builds the editorial calendar, writes conversion-focused long-form content, optimizes for on-page SEO, and publishes on your site — monthly, consistently, at the standards that Google rewards.",
      },
    ],
    proofPoints: [
      "Keyword research and content strategy included",
      "Written, optimized, and published by Imperidome",
      "$299/month — consistent monthly output",
      "Builds compounding organic traffic over time",
    ],
    faqItems: [
      {
        question: "How many blog posts are published each month?",
        answer:
          "Publication frequency depends on your plan level and keyword strategy. Imperidome's standard Blog/Content SEO service includes two to four long-form posts per month.",
      },
    ],
    closingCTA:
      "Build organic traffic that grows every month. Start your content strategy.",
  },

  "google ads management": {
    metaTitle: "Google Ads Management Service — $399/mo | Imperidome",
    metaDescription:
      "Google Ads management for $399/month. Imperidome builds, optimizes, and scales your Google Search and Display campaigns to maximize ROAS and reduce wasted ad spend.",
    heroHeadline: "Google Ads Management That Maximizes Every Dollar You Spend",
    heroSubheadline:
      "Imperidome's Google Ads Management service builds, manages, and optimizes your campaigns — reducing wasted spend, improving Quality Score, and scaling what works to maximize return on every ad dollar.",
    bodySections: [
      {
        heading: "Stop Wasting Ad Budget on Mis-Targeted Campaigns",
        body: "The average small business running Google Ads without professional management wastes 40–60% of their budget on irrelevant queries, poor bid strategies, and underoptimized landing pages. Imperidome's management eliminates that waste on day one.",
      },
      {
        heading: "What Imperidome's Google Ads Management Includes",
        body: "Campaign architecture and keyword strategy, ad copywriting, bid management, negative keyword maintenance, landing page alignment, Quality Score optimization, and monthly ROAS reporting — everything required to run Google Ads at a professional level.",
      },
    ],
    proofPoints: [
      "Full campaign setup and ongoing optimization",
      "Negative keyword management to eliminate wasted spend",
      "$399/month management fee — ad spend is separate",
      "Monthly ROAS reporting",
    ],
    faqItems: [
      {
        question: "Is the $399/month the total I pay for Google Ads?",
        answer:
          "No. $399/month is the management fee for Imperidome's work. Your Google Ads budget (what you pay Google) is separate and set by you based on your goals.",
      },
    ],
    closingCTA:
      "Run Google Ads that actually convert. Let's build your campaigns.",
  },

  "social media sync": {
    metaTitle: "Social Media Management Service — $99/mo | Imperidome",
    metaDescription:
      "Social media sync for $99/month. Imperidome keeps your social profiles active with branded content, cross-platform publishing, and consistent posting that builds audience trust.",
    heroHeadline: "Stay Active on Social Media for $99 a Month",
    heroSubheadline:
      "Social Media Sync keeps your brand's social profiles populated with consistent, branded content — cross-published across platforms to maintain your online presence without consuming your time.",
    bodySections: [
      {
        heading: "Why Social Presence Matters Even Without Viral Growth",
        body: "Buyers check your social profiles before they buy from you — even for local service businesses. Profiles that haven't posted in months signal inactivity or closure. Social Media Sync keeps your profiles alive with consistent branded content that reassures prospects you're real, active, and professional.",
      },
    ],
    proofPoints: [
      "Consistent branded posting across major platforms",
      "$99/month — lowest-cost social media solution",
      "Cross-platform publishing included",
      "Keeps your profiles active for prospect credibility",
    ],
    faqItems: [
      {
        question: "What platforms does Social Media Sync cover?",
        answer:
          "Social Media Sync covers Facebook, Instagram, and Google Business Profile at the base level. Additional platforms available on request.",
      },
    ],
    closingCTA:
      "Stay visible on social for $99/month. Activate Social Media Sync.",
  },

  "lead capture upgrade": {
    metaTitle: "Website Lead Capture Upgrade — Forms & Pop-Ups | Imperidome",
    metaDescription:
      "Convert more website visitors into leads with Imperidome's Lead Capture Upgrade — optimized forms, lead magnets, and pop-up flows for $99/month.",
    heroHeadline: "Convert More Visitors Into Leads Without More Traffic",
    heroSubheadline:
      "Lead Capture Upgrade adds optimized capture mechanisms to your site — high-converting forms, strategic pop-up flows, and lead magnet delivery — turning existing traffic into a measurable lead pipeline.",
    bodySections: [
      {
        heading: "Most Websites Lose 95% of Their Visitors Without a Lead",
        body: "The average website converts only 2–5% of visitors into contacts. A strategically placed lead capture system — exit-intent pop-ups, inline forms, and lead magnet offers — can triple that conversion rate from the same traffic.",
      },
    ],
    proofPoints: [
      "Optimized lead capture forms installed and tested",
      "Pop-up and exit-intent flows configured",
      "$99/month — pay for results, not just tools",
      "Integrated with your email or CRM system",
    ],
    faqItems: [
      {
        question: "What integrations does Lead Capture Upgrade support?",
        answer:
          "Captured leads can be sent to Mailchimp, Klaviyo, HubSpot, Salesforce, or any CRM with a webhook integration.",
      },
    ],
    closingCTA:
      "Capture the leads your site is already letting walk away. Start today.",
  },

  "review generation": {
    metaTitle: "Online Review Generation Service — $99/mo | Imperidome",
    metaDescription:
      "Automated review generation for Google, Yelp, and Facebook for $99/month. Imperidome builds review collection workflows that generate 5-star reviews consistently.",
    heroHeadline: "Build a 5-Star Reputation on Autopilot",
    heroSubheadline:
      "Review Generation is Imperidome's automated review collection service — sending the right review request at the right time to your satisfied customers, building your online reputation consistently.",
    bodySections: [
      {
        heading: "Reviews Are Your Most Valuable Conversion Asset",
        body: "93% of buyers read online reviews before making a purchase decision. A business with 50+ five-star reviews converts at dramatically higher rates than an identical competitor with 10 reviews and a 3.8 average. Review Generation systematically builds the social proof that closes undecided buyers.",
      },
    ],
    proofPoints: [
      "Automated review requests sent after every transaction",
      "Targets Google, Yelp, Facebook, and industry platforms",
      "$99/month — reviews compound over time",
      "Integrates with your booking or CRM system",
    ],
    faqItems: [
      {
        question:
          "Does Imperidome's review system work for Google specifically?",
        answer:
          "Yes. Google reviews are the primary target, with direct links that reduce friction. The system is also configured for Yelp, Facebook, and platform-specific review sites depending on your industry.",
      },
    ],
    closingCTA:
      "Build the review count that wins undecided buyers. Start generating reviews.",
  },

  "site audit": {
    metaTitle: "Professional Website SEO Audit — $99 One-Time | Imperidome",
    metaDescription:
      "Professional website SEO and performance audit for $99. Imperidome identifies technical issues, keyword gaps, speed problems, and conversion barriers with a full written report.",
    heroHeadline: "Find Out Exactly What's Holding Your Website Back for $99",
    heroSubheadline:
      "Imperidome's Site Audit is a comprehensive technical, SEO, and conversion analysis of your website — a full written report identifying every issue costing you traffic, rankings, and sales.",
    bodySections: [
      {
        heading: "What the Site Audit Examines",
        body: "Page speed, Core Web Vitals, technical SEO (crawlability, indexing, schema), on-page optimization gaps, content quality and keyword coverage, conversion rate barriers, mobile usability, and security — a complete picture of your site's health and opportunity.",
      },
    ],
    proofPoints: [
      "$99 one-time — comprehensive written report",
      "Technical SEO, speed, and conversion analysis",
      "Delivered in 3 business days",
      "Includes prioritized action recommendations",
    ],
    faqItems: [
      {
        question: "What does the Site Audit report include?",
        answer:
          "A full written report covering technical SEO issues, speed and Core Web Vitals, on-page optimization gaps, conversion barriers, and a prioritized list of actions ordered by impact.",
      },
    ],
    closingCTA:
      "Know what's broken before spending another dollar on marketing. Get your audit.",
  },

  "restaurant menu refresh": {
    metaTitle: "Restaurant Menu Design & Update Service — $149/mo | Imperidome",
    metaDescription:
      "Keep your restaurant menu current and visually sharp for $149/month. Imperidome's Menu Refresh service handles design updates, seasonal changes, and item additions.",
    heroHeadline: "Your Menu Always Current, Always Converting",
    heroSubheadline:
      "Restaurant Menu Refresh is Imperidome's ongoing menu management service — keeping your digital and print menus current, well-designed, and optimized for upselling with every update.",
    bodySections: [
      {
        heading: "An Outdated Menu Costs You Orders and Credibility",
        body: "Seasonal items that aren't removed, sold-out dishes that appear on online menus, and prices that don't reflect your current pricing all create friction and frustration for customers. Menu Refresh keeps everything current without consuming your time or budget.",
      },
    ],
    proofPoints: [
      "Unlimited menu update requests per month",
      "$149/month — covers digital and print formats",
      "Turnaround in 24-48 hours",
      "Includes upsell optimization per update",
    ],
    faqItems: [
      {
        question: "What types of menu changes does Menu Refresh cover?",
        answer:
          "Item additions and removals, price updates, seasonal specials, photo replacements, redesigns, and format changes for both digital and print-ready files.",
      },
    ],
    closingCTA:
      "Keep your menu fresh and your orders flowing. Activate Menu Refresh.",
  },

  "idx/mls integration": {
    metaTitle: "IDX/MLS Real Estate Listing Integration — $299 | Imperidome",
    metaDescription:
      "Integrate live MLS listings into your real estate website for $299 one-time. Imperidome's IDX integration brings active property listings directly to your site.",
    heroHeadline: "Live MLS Listings on Your Real Estate Site — One-Time $299",
    heroSubheadline:
      "IDX/MLS Integration connects your real estate website to live MLS listing data — so buyers browse active properties on your branded site instead of Zillow or Realtor.com.",
    bodySections: [
      {
        heading: "Keep Buyers on Your Site, Not the Portals",
        body: "Real estate portals capture the buyer relationship and sell your leads back to competing agents. IDX integration gives buyers a reason to search on your site — keeping them in your funnel where you control the conversation and the conversion.",
      },
    ],
    proofPoints: [
      "Live MLS data updated in real time",
      "$299 one-time integration fee",
      "Buyers stay on your branded site",
      "Search, filter, and save listings on your domain",
    ],
    faqItems: [
      {
        question: "Do I need an MLS membership to use IDX integration?",
        answer:
          "Yes. IDX data feeds require an active MLS membership. Imperidome handles the technical integration — you provide the MLS credentials and access.",
      },
    ],
    closingCTA:
      "Keep buyers on your site. Get your IDX integration done today.",
  },

  "bulk data extraction": {
    metaTitle: "Bulk Data Extraction Service — $499 One-Time | Imperidome",
    metaDescription:
      "One-time bulk data extraction from websites, platforms, or legacy systems for $499. Imperidome extracts, structures, and delivers clean data for migration or analysis.",
    heroHeadline: "Extract, Structure, and Own Your Data for $499",
    heroSubheadline:
      "Bulk Data Extraction is Imperidome's one-time service for extracting large datasets from legacy systems, websites, or third-party platforms — delivering clean, structured data you can use immediately.",
    bodySections: [
      {
        heading: "When You Need Your Data Out of a System",
        body: "Platform migrations, CRM transitions, and business acquisitions often require extracting data from systems that make export difficult. Imperidome's extraction service handles the technical work of pulling, cleaning, and structuring data for your target system.",
      },
    ],
    proofPoints: [
      "$499 one-time — project-based pricing",
      "Data delivered clean and structured",
      "Supports web scraping, platform export, and API extraction",
      "Typical turnaround: 3-5 business days",
    ],
    faqItems: [
      {
        question: "What types of data can Imperidome extract?",
        answer:
          "Product catalogs, customer records, order histories, CRM data, web-scraped competitor data, real estate listings, and any structured data accessible via the web, API, or export functions.",
      },
    ],
    closingCTA: "Get your data out and usable. Start your extraction project.",
  },

  "custom page expansion": {
    metaTitle: "Custom Page Add-On for Your Website — $149 | Imperidome",
    metaDescription:
      "Add a new custom page to your existing website for $149 one-time. Imperidome builds additional pages — landing pages, service pages, location pages — matching your current design.",
    heroHeadline:
      "Add a New Page to Your Site for $149 — Matched to Your Design",
    heroSubheadline:
      "Custom Page Expansion adds a professionally designed, SEO-optimized page to your existing Imperidome site — a new service page, landing page, location page, or any section your business needs.",
    bodySections: [
      {
        heading: "When to Add Pages to Your Site",
        body: "New service offerings, additional locations, targeted landing pages for ad campaigns, blog pillar pages for SEO — every time your business grows, your website should reflect it. Custom Page Expansion makes that addition fast and affordable.",
      },
    ],
    proofPoints: [
      "$149 one-time per page",
      "Design matched to your existing site",
      "SEO-optimized from day one",
      "Delivered in 48 hours",
    ],
    faqItems: [
      {
        question: "What kinds of pages can I add with Custom Page Expansion?",
        answer:
          "Service pages, location-specific landing pages, ad campaign landing pages, about/team pages, portfolio pages, FAQ pages, and any other content page your business needs.",
      },
    ],
    closingCTA:
      "Your business grew — your website should too. Add your page today.",
  },

  "pwa upgrade": {
    metaTitle: "Progressive Web App Upgrade — $299 One-Time | Imperidome",
    metaDescription:
      "Upgrade your website to a Progressive Web App for $299. Imperidome's PWA upgrade adds offline access, home screen installation, and app-like performance to your site.",
    heroHeadline: "Your Website, Upgraded to a PWA for $299",
    heroSubheadline:
      "PWA Upgrade converts your existing Imperidome website into a Progressive Web App — giving users offline access, home screen installation, and a native app experience without the app store.",
    bodySections: [
      {
        heading: "What a PWA Does for Your Business",
        body: "Progressive Web Apps load instantly even on slow connections, work offline for key functions, and can be installed on a user's home screen like a native app — without requiring App Store submission or update approvals. PWAs increase engagement, reduce bounce rates, and build return-visit behavior.",
      },
    ],
    proofPoints: [
      "$299 one-time — no app store required",
      "Offline access for core site functions",
      "Home screen installation on Android and iOS",
      "Significantly faster load times",
    ],
    faqItems: [
      {
        question: "Does a PWA work on iPhone and Android?",
        answer:
          "Yes. PWAs are supported on both Android and iOS. Android has full PWA support including push notifications. iOS supports installation and offline access.",
      },
    ],
    closingCTA:
      "Give your visitors an app experience without the app store. Get your PWA upgrade.",
  },

  "annual site refresh": {
    metaTitle: "Annual Website Redesign Service — $499 | Imperidome",
    metaDescription:
      "Annual website refresh and redesign for $499 one-time. Imperidome updates your site's design, content, and performance — keeping your online presence sharp year after year.",
    heroHeadline: "Keep Your Website Sharp Year After Year for $499",
    heroSubheadline:
      "Annual Site Refresh is Imperidome's once-a-year design, content, and performance update service — keeping your website current, competitive, and converting as your business evolves.",
    bodySections: [
      {
        heading: "Why Websites Need Annual Attention",
        body: "Design trends shift, conversion best practices evolve, and your business changes over the course of a year. A website that looked cutting-edge 12 months ago can look dated today. Annual Site Refresh ensures you're always presenting the most current version of your brand.",
      },
      {
        heading: "What an Annual Refresh Includes",
        body: "Design updates to hero sections, color schemes, and typography; copy refreshes across key pages; performance optimization for Core Web Vitals; image updates and new photography integration; and SEO freshness signals that tell Google your site is actively maintained.",
      },
    ],
    proofPoints: [
      "$499 one-time annual service",
      "Design, content, and performance all updated",
      "Delivered in 5 business days",
      "Keeps your site competitive year over year",
    ],
    faqItems: [
      {
        question: "Is an annual site refresh different from a full rebuild?",
        answer:
          "Yes. A refresh updates and improves your existing site — it doesn't rebuild from scratch. Full rebuilds are for when the site's structure needs to change significantly. Refreshes are for keeping a working site current and optimized.",
      },
    ],
    closingCTA:
      "Keep your site sharp and your brand current. Schedule your annual refresh.",
  },
};

export default seoMap;
