import React from 'react';

export const servicesData = [
  {
    id: 'demat',
    slug: 'demat',
    title: 'Demat Services',
    description: 'Demat account services',
    intro: 'A Demat account allows investors to hold shares, bonds, mutual funds and other securities in electronic form. We assist clients with Demat account-related services and help simplify the process of managing their investments electronically.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    overview: 'Our Demat account services provide a secure, seamless, and electronic repository for all your financial securities. We assist clients with opening new Demat accounts, consolidating existing holdings, updating nomination details, and converting physical securities into electronic form.',
    keyBenefits: [
      'Secure electronic storage of shares, mutual funds, and bonds',
      'Instant settlement and seamless transfer of securities',
      'Easy tracking of portfolio holdings and transaction statements',
      'Simplified nomination and joint account management',
    ],
    whoItIsFor: 'Individual investors, HUFs, companies, and trusts looking to hold securities electronically with full safety and regulatory compliance.',
    process: [
      { step: '01', title: 'Document Verification', desc: 'Submit PAN, Aadhaar, address proof, and bank details for initial KYC verification.' },
      { step: '02', title: 'Account Creation', desc: 'Opening of your Demat account linked with depository participants (NSDL/CDSL).' },
      { step: '03', title: 'Holding Integration', desc: 'Link existing investments or convert physical certificates into your Demat account.' },
    ],
  },
  {
    id: 'mutual-fund',
    slug: 'mutual-fund',
    title: 'Mutual Fund Advisory',
    description: 'Mutual fund distribution and advisory',
    intro: 'Mutual funds provide investors with access to professionally managed investment portfolios across different asset categories. We help clients understand mutual fund options and choose solutions based on their financial goals, investment horizon and requirements.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    overview: 'Our mutual fund distribution and advisory services focus on constructing tailored portfolios across equity, debt, and hybrid schemes. We guide you in selecting funds aligned with your investment horizon, liquidity needs, and risk tolerance.',
    keyBenefits: [
      'Goal-aligned asset allocation across equity, debt, and index funds',
      'Systematic Investment Plan (SIP) and lump-sum investment execution',
      'Regular portfolio monitoring and periodic rebalancing',
      'Tax-efficient investing strategies through ELSS schemes',
    ],
    whoItIsFor: 'Salaried individuals, business owners, and families seeking disciplined wealth growth through professionally managed mutual funds.',
    process: [
      { step: '01', title: 'Risk Profiling', desc: 'Assessing your financial goals, risk appetite, and investment timeline.' },
      { step: '02', title: 'Scheme Selection', desc: 'Shortlisting top-performing, research-backed mutual fund schemes.' },
      { step: '03', title: 'Execution & Review', desc: 'Executing investments and reviewing performance on a regular basis.' },
    ],
  },
  {
    id: 'ipo',
    slug: 'ipo',
    title: 'IPO Services',
    description: 'Initial Public Offering service',
    intro: 'An Initial Public Offering (IPO) allows investors to apply for shares when a company offers them to the public for the first time. We help clients understand the IPO process, application requirements and important considerations before participating.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71 1.26-1.55 1.5-2.5" />
        <path d="M15 9l-6 6" />
        <path d="M9 9h6v6" />
      </svg>
    ),
    overview: 'Our Initial Public Offering (IPO) service provides timely information, detailed company analysis, and seamless application assistance for upcoming mainboard and SME IPOs in India.',
    keyBenefits: [
      'Access to mainboard and SME IPO application guidance',
      'Comprehensive company analysis and financial evaluation',
      'Hassle-free ASBA application support through UPI / bank portals',
      'Guidance on retail, HNI, and shareholder quota applications',
    ],
    whoItIsFor: 'Investors seeking early-stage participation in growing companies going public.',
    process: [
      { step: '01', title: 'IPO Analysis', desc: 'Reviewing Red Herring Prospectus (RHP), valuation, and growth potential.' },
      { step: '02', title: 'Bid Submission', desc: 'Assisting in submitting ASBA applications with correct UPI IDs and Demat details.' },
      { step: '03', title: 'Allotment Track', desc: 'Tracking allotment status and credit of allocated shares to Demat.' },
    ],
  },
  {
    id: 'slbm',
    slug: 'slbm',
    title: 'SLBM Services',
    description: 'Securities Lending & Borrowing Mechanism',
    intro: 'Securities Lending & Borrowing Mechanism (SLBM) allows eligible investors to lend or borrow securities through a regulated market mechanism. We help clients understand how the process works and the requirements involved.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4M7 4L3 8M7 4L11 8" />
        <path d="M17 8V20M17 20L21 16M17 20L13 16" />
      </svg>
    ),
    overview: 'Securities Lending & Borrowing Mechanism (SLBM) allows investors to lend their idle Demat holdings to borrowers in exchange for a lending fee, enabling portfolio yield enhancement without selling long-term stock holdings.',
    keyBenefits: [
      'Earn additional yield on long-term idle equity shares',
      '100% clearing corporation guaranteed risk mitigation (NSCCL/ICCL)',
      'Retain ownership of corporate benefits like dividends and bonuses',
      'Flexible tenure options ranging from 1 to 12 months',
    ],
    whoItIsFor: 'Long-term equity investors and institutional holders seeking additional income from their existing portfolio holdings.',
    process: [
      { step: '01', title: 'Holding Review', desc: 'Identifying eligible SLBM approved securities in your Demat account.' },
      { step: '02', title: 'Lending Order Placement', desc: 'Placing lending quotes with desired yield fees and tenure.' },
      { step: '03', title: 'Fee Collection', desc: 'Receiving lending fees upfront while retaining underlying share ownership.' },
    ],
  },
  {
    id: 'insurance',
    slug: 'insurance',
    title: 'Insurance Advisory',
    description: 'Life and Health insurance',
    intro: 'Insurance helps individuals and families manage financial risks arising from unexpected events. We help clients understand life and health insurance options and evaluate coverage based on their protection requirements.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    overview: 'Our insurance advisory services help protect your family and assets against unforeseen health emergencies or financial risks through pure term insurance and comprehensive health policies.',
    keyBenefits: [
      'Tailored Term Life Insurance plans for financial security',
      'Comprehensive Health Insurance with cashless hospital network coverage',
      'Unbiased policy comparison across leading IRDAI approved insurers',
      'Dedicated support during claim settlement and policy renewals',
    ],
    whoItIsFor: 'Families, business owners, and individuals looking to establish a safety net against medical and life risks.',
    process: [
      { step: '01', title: 'Coverage Analysis', desc: 'Evaluating human life value and medical coverage needs.' },
      { step: '02', title: 'Policy Comparison', desc: 'Comparing policy terms, rider benefits, and claim settlement ratios.' },
      { step: '03', title: 'Issuance & Assistance', desc: 'Completing medical underwriting and providing ongoing claim assistance.' },
    ],
  },
  {
    id: 'physical-shares',
    slug: 'physical-shares',
    title: 'Physical Shares Solutions',
    description: 'Physical share certificate service',
    intro: 'Some investors may still hold securities in physical certificate form. We assist clients with processes related to physical share certificates, including documentation, dematerialization and other ownership-related requirements.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    overview: 'We specialize in handling complex physical share certificate services, including dematerialization of old paper shares, duplicate certificate issuance, name corrections, signature updates, and transmission to legal heirs.',
    keyBenefits: [
      'Dematerialization of old paper share certificates into electronic format',
      'Assistance in obtaining duplicate share certificates for lost paper shares',
      'Transmission of shares in legal heir and joint holder scenarios',
      'Signature mismatch resolution and address update with RTAs',
    ],
    whoItIsFor: 'Families and investors holding old physical paper share certificates requiring dematerialization or legal transmission.',
    process: [
      { step: '01', title: 'Certificate Audit', desc: 'Inspecting physical certificates, RTA status, and folio details.' },
      { step: '02', title: 'Legal Documentation', desc: 'Drafting affidavits, indemnities, and DRF forms for RTA submission.' },
      { step: '03', title: 'Demat Credit', desc: 'Tracking credit of electronic shares directly into your Demat account.' },
    ],
  },
  {
    id: 'iepf',
    slug: 'iepf',
    title: 'IEPF Services',
    description: 'Investor Education and Protection Fund service',
    intro: 'The Investor Education and Protection Fund (IEPF) provides a mechanism for dealing with certain unclaimed dividends and shares transferred to the fund under applicable regulations. We assist clients in understanding the claim process and required documentation.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    overview: 'Our IEPF claim services assist investors in recovering shares and unclaimed dividend amounts transferred to the Investor Education and Protection Fund (IEPF) Authority under Section 124(6) of the Companies Act.',
    keyBenefits: [
      'End-to-end IEPF Form 5 filing and verification guidance',
      'Document preparation including entitlement certificates and legal claim forms',
      'Coordination with company Nodal Officers and Registrar & Transfer Agents (RTAs)',
      'Recovery of both long-pending unclaimed dividends and transferred shares',
    ],
    whoItIsFor: 'Shareholders or legal heirs whose shares or dividends have been transferred to the IEPF Authority.',
    process: [
      { step: '01', title: 'IEPF Search', desc: 'Locating transferred folios and calculating total unclaimed shares and dividends.' },
      { step: '02', title: 'Form 5 Submission', desc: 'Filing online IEPF-5 claim and submitting physical documents to Nodal Officer.' },
      { step: '03', title: 'Approval & Release', desc: 'Monitoring verification report approval and credit of shares/funds.' },
    ],
  },
  {
    id: 'trading',
    slug: 'trading',
    title: 'Trading Account Services',
    description: 'Equity & F&O trading account',
    intro: 'Trading provides investors with access to financial markets for buying and selling securities. We help clients understand equity and F&O trading accounts, the basic process involved and the considerations associated with market participation.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    overview: 'Our trading account services provide access to equity cash, futures & options (F&O), and currency trading platforms with real-time market data, technical charts, and dedicated advisory support.',
    keyBenefits: [
      'Multi-asset trading access across NSE & BSE exchanges',
      'Real-time streaming market data and interactive technical charts',
      'Seamless fund transfers linked with your primary savings account',
      'Dedicated relationship support for executing orders',
    ],
    whoItIsFor: 'Active market participants and investors looking for robust trading platforms for cash and derivative segments.',
    process: [
      { step: '01', title: 'Segment Activation', desc: 'Completing KYC and activating cash, F&O, and currency segments.' },
      { step: '02', title: 'Platform Setup', desc: 'Setting up web/mobile trading interfaces and watchlists.' },
      { step: '03', title: 'Execution Support', desc: 'Providing order execution, margin management, and statement reports.' },
    ],
  },
  {
    id: 'pms',
    slug: 'pms',
    title: 'Portfolio Management Services (PMS)',
    description: 'Portfolio Management Services',
    intro: "Portfolio Management Services (PMS) provides professional management of an investment portfolio based on an investor's objectives and requirements. We help clients understand how PMS works, its structure and the factors that should be considered before choosing such a service.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    overview: 'Portfolio Management Services (PMS) offer customized equity management by professional fund managers for High Net Worth Individuals. Unlike mutual funds, equity shares are held directly in your individual Demat account.',
    keyBenefits: [
      'Direct ownership of equity stock portfolios in your Demat account',
      'Customized strategies tailored to specific market market-cap themes',
      'High transparency with detailed trade and holding reporting',
      'Direct interaction with fund managers and research personnel',
    ],
    whoItIsFor: 'High Net Worth Individuals (HNIs) seeking customized equity portfolio management with a minimum regulatory ticket size of ₹50 Lakhs.',
    process: [
      { step: '01', title: 'Investment Objective', desc: 'Defining return expectations, risk tolerance, and investment strategy.' },
      { step: '02', title: 'Account Onboarding', desc: 'Opening dedicated PMS Demat and bank accounts.' },
      { step: '03', title: 'Active Management', desc: 'Discretionary or non-discretionary equity portfolio execution.' },
    ],
  },
  {
    id: 'aif',
    slug: 'aif',
    title: 'Alternative Investment Funds (AIF)',
    description: 'Alternative Investment Funds',
    intro: 'Alternative Investment Funds (AIFs) are investment vehicles that invest in asset classes and strategies beyond traditional investment products. We help clients understand the structure, categories and suitability considerations associated with AIFs.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    overview: 'Alternative Investment Funds (AIFs) are privately pooled investment vehicles catering to sophisticated investors seeking exposure to venture capital, private equity, real estate, hedge funds, and structured credit.',
    keyBenefits: [
      'Access to non-traditional asset classes like Private Equity and Venture Capital',
      'Sophisticated fund strategies with potential for non-correlated market returns',
      'Professional management under Category I, II, or III SEBI AIF regulations',
      'Diversification beyond public equity and fixed-income markets',
    ],
    whoItIsFor: 'Sophisticated institutional investors, family offices, and ultra-HNIs seeking alternative asset exposure with a minimum investment threshold of ₹1 Crore.',
    process: [
      { step: '01', title: 'Strategy Evaluation', desc: 'Analyzing Category I, II, or III AIF fund mandates and track records.' },
      { step: '02', title: 'Subscription', desc: 'Completing private placement memorandum (PPM) documentation.' },
      { step: '03', title: 'Capital Calls & Reports', desc: 'Managing capital drawdown calls and receiving periodic NAV statements.' },
    ],
  },
];

export default servicesData;
