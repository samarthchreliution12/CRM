import React from 'react';

import dematImg from '../../assets/website/services/DEMAT-services.png';
import mutualFundImg from '../../assets/website/services/MUTUAL-FUND.png';
import ipoImg from '../../assets/website/services/Ipo-services.png';
import slbmImg from '../../assets/website/services/SLBM-services.png';
import insuranceImg from '../../assets/website/services/INSURANCE-ADVISORY-services.png';
import physicalSharesImg from '../../assets/website/services/PHYSICAL-SHARES-services .png';
import iepfImg from '../../assets/website/services/IEPF-SERVICES-services.png';
import tradingImg from '../../assets/website/services/TRADING-services.png';
import pmsImg from '../../assets/website/services/ PMS — Portfolio Management Services..png';
import aifImg from '../../assets/website/services/Alternative Investment Fund.png';

export const servicesData = [
  {
    id: 'demat',
    slug: 'demat',
    title: 'Demat Services',
    description: 'Secure Electronic Storage & Securities Management',
    intro: 'A Demat (Dematerialized) account provides a secure, electronic repository to hold equity shares, mutual fund units, government bonds, and Sovereign Gold Bonds (SGBs) under NSDL/CDSL depositories.',
    image: dematImg,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    overviewHeading: 'Manage & Safeguard Your Securities Digitally',
    overviewParagraphs: [
      'Dematerialization converts physical paper share certificates into electronic book-entry format maintained with national depositories NSDL and CDSL. This completely eliminates the risks of paper certificate loss, theft, forgery, or transit damage.',
      'A Demat account serves as the central digital vault for all your investments. Whether you hold stock equity, mutual fund units, corporate debentures, or Sovereign Gold Bonds, all assets are recorded seamlessly in a single consolidated holding account.',
      'Parshwa Consultancy assists clients with seamless Demat account opening, consolidation of multiple old accounts, nomination updates, signature mismatch resolutions, and direct dematerialization of paper share certificates.',
    ],
    keyBenefits: [
      { title: 'Electronic Storage', desc: 'Secure digital vault for shares, mutual funds, corporate bonds, and government securities.' },
      { title: 'Automated Credit', desc: 'Instant credit of corporate benefits like bonus shares, stock splits, and dividend entitlements.' },
      { title: 'Nomination & Joint Access', desc: 'Simplified online nomination additions and joint holder management for full legal security.' },
      { title: 'Consolidated Tracking', desc: 'One unified statement providing complete clarity across all asset classes.' },
    ],
    whoItIsFor: [
      'Individual Investors',
      'High Net Worth Individuals (HNIs)',
      'Hindu Undivided Families (HUFs)',
      'Corporate Bodies & Trusts',
      'Non-Resident Indians (NRIs)',
    ],
    process: [
      { step: '01', title: 'Document Verification', desc: 'Submit PAN, Aadhaar, address proof, and bank account proof for digital KYC verification.' },
      { step: '02', title: 'Depository Registration', desc: 'Opening of your Demat account under NSDL or CDSL Depository Participant (DP) framework.' },
      { step: '03', title: 'Holdings Integration', desc: 'Link existing electronic portfolios or submit physical share certificates for dematerialization.' },
      { step: '04', title: 'Ongoing Support', desc: 'Access consolidated holding statements, nomination management, and assistance for transfers.' },
    ],
    importantConsiderations: [
      'Requires a valid PAN card linked with Aadhaar and an active savings bank account.',
      'Nomination details must be registered to ensure seamless transmission to legal nominees.',
      'Periodic KYC updates are required in compliance with SEBI and Depository regulations.',
    ],
  },
  {
    id: 'mutual-fund',
    slug: 'mutual-fund',
    title: 'Mutual Fund Advisory',
    description: 'Disciplined Asset Allocation & Goal-Based Wealth Growth',
    intro: 'Mutual fund advisory focuses on building customized, research-backed portfolios across equity, debt, index, and hybrid schemes tailored to your unique financial goals and risk capacity.',
    image: mutualFundImg,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    overviewHeading: 'Strategic Wealth Creation Through Professional Asset Management',
    overviewParagraphs: [
      'Mutual funds offer investors access to professionally managed, diversified portfolios across domestic equity, fixed income, debt instruments, and global indices. By spreading risk across multiple asset classes, mutual funds help optimize capital growth while controlling volatility.',
      'We focus on a goal-based investment methodology. Whether you are planning for long-term wealth creation, child education, retirement accumulation, or tax saving under Section 80C, we help select schemes that match your specific investment horizon.',
      'Our advisory includes regular portfolio reviews, Systematic Investment Plan (SIP) strategy setup, tax-efficient ELSS planning, and tactical rebalancing to adapt to changing macroeconomic and market cycles.',
    ],
    keyBenefits: [
      { title: 'Goal-Aligned Portfolios', desc: 'Customized asset allocation blueprints tailored to your time horizon and risk tolerance.' },
      { title: 'Disciplined SIP Execution', desc: 'Automated Systematic Investment Plans (SIP) to benefit from rupee-cost averaging.' },
      { title: 'Tax Efficiency (ELSS)', desc: 'Save tax under Section 80C while building long-term equity capital.' },
      { title: 'Periodic Rebalancing', desc: 'Regular performance reviews and tactical adjustments across debt and equity categories.' },
    ],
    whoItIsFor: [
      'Salaried Professionals',
      'Business Owners',
      'Families Planning Long-Term Goals',
      'Retirees Seeking Stable Income',
      'Tax-conscious Investors',
    ],
    process: [
      { step: '01', title: 'Goal & Risk Profiling', desc: 'Evaluating your financial targets, liquidity requirements, and risk appetite.' },
      { step: '02', title: 'Scheme Shortlisting', desc: 'Selecting top-tier, research-evaluated mutual fund schemes across AMCs.' },
      { step: '03', title: 'SIP / Lumpsum Execution', desc: 'Completing digital onboarding, Mandate registration, and investment execution.' },
      { step: '04', title: 'Review & Rebalancing', desc: 'Conducting periodic portfolio performance reviews and strategic asset rebalancing.' },
    ],
    importantConsiderations: [
      'Mutual fund investments are subject to market risks; read scheme offer documents carefully.',
      'Past scheme performance is evaluated for research purposes and does not guarantee future returns.',
      'SIP investments benefit from compounding over longer time horizons of 5 to 7+ years.',
    ],
  },
  {
    id: 'ipo',
    slug: 'ipo',
    title: 'IPO Services',
    description: 'Primary Market Opportunities & Issue Allocation Guidance',
    intro: 'Initial Public Offering (IPO) services provide timely analysis, quota guidance, and application assistance for upcoming mainboard and SME public issues listing on NSE and BSE.',
    image: ipoImg,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71 1.26-1.55 1.5-2.5" />
        <path d="M15 9l-6 6" />
        <path d="M9 9h6v6" />
      </svg>
    ),
    overviewHeading: 'Early Access to High-Growth Companies Going Public',
    overviewParagraphs: [
      'An Initial Public Offering (IPO) allows investors to apply for shares when a private company expands capital by listing its stock on the primary market. Participating in well-managed IPOs offers early access to emerging industry leaders.',
      'We provide objective analysis of Red Herring Prospectuses (RHP), evaluating promoter credibility, valuation metrics, financial performance, and market growth drivers before you submit your application.',
      'Our team assists clients across Retail (RII), Non-Institutional (NII / HNI), and Shareholder categories using ASBA (Application Supported by Blocked Amount) via bank portals and UPI payment frameworks.',
    ],
    keyBenefits: [
      { title: 'Mainboard & SME Evaluation', desc: 'Objective research breakdowns of financial statements, valuation, and growth potential.' },
      { title: 'ASBA & UPI Guidance', desc: 'Seamless bid submission assistance via net-banking ASBA or UPI handles.' },
      { title: 'Category Strategy', desc: 'Guidance across Retail, HNI (Small/Big HNI), and Shareholder application quotas.' },
      { title: 'Allotment Tracking', desc: 'Real-time tracking of allotment results and direct credit of allocated shares to Demat.' },
    ],
    whoItIsFor: [
      'Retail Stock Investors',
      'High Net Worth Individuals (HNIs)',
      'Existing Corporate Shareholders',
      'Early-Stage Growth Seekers',
    ],
    process: [
      { step: '01', title: 'Issue Analysis', desc: 'Reviewing company RHP prospectus, valuation multiples, and business prospects.' },
      { step: '02', title: 'Bid Preparation', desc: 'Selecting price band, lot sizes, and appropriate application category.' },
      { step: '03', title: 'ASBA Bid Submission', desc: 'Executing bid authorization via net-banking ASBA or UPI mandate.' },
      { step: '04', title: 'Allotment & Credit', desc: 'Monitoring registrar allotment status and verifying Demat share credit.' },
    ],
    importantConsiderations: [
      'Share allotment in oversubscribed IPOs is governed by SEBI-mandated computerised draw mechanisms.',
      'Funds remain safely blocked in your bank account via ASBA until the allotment process is completed.',
      'IPO investments carry business and market listing risk; thorough prospectus review is essential.',
    ],
  },
  {
    id: 'slbm',
    slug: 'slbm',
    title: 'SLBM Services',
    description: 'Securities Lending & Borrowing Yield Enhancement',
    intro: 'Securities Lending & Borrowing Mechanism (SLBM) is a SEBI-regulated, exchange-cleared platform allowing long-term equity investors to lend idle Demat stocks to earn yield without selling holdings.',
    image: slbmImg,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4M7 4L3 8M7 4L11 8" />
        <path d="M17 8V20M17 20L21 16M17 20L13 16" />
      </svg>
    ),
    overviewHeading: 'Earn Additional Income from Idle Long-Term Stocks',
    overviewParagraphs: [
      'SLBM enables investors who hold long-term equity shares in their Demat account to lend them to market borrowers for specific contract tenures (1 to 12 months) in exchange for a lending fee, boosting overall portfolio yield.',
      'Because SLBM transactions are executed through exchange clearing houses (NSCCL and ICCL), transactions carry a 100% clearing corporation settlement guarantee, protecting lenders against counterparty default risk.',
      'As a lender, you continue to retain full economic benefit of all corporate actions. Any dividends, bonus shares, or stock splits declared during the lending tenure are credited directly to you by the exchange.',
    ],
    keyBenefits: [
      { title: 'Portfolio Yield Enhancement', desc: 'Earn extra lending fees on long-term idle stocks sitting in your Demat account.' },
      { title: 'Clearing Guarantee', desc: '100% settlement and default protection guaranteed by National Clearing Corporations.' },
      { title: 'Retain Corporate Benefits', desc: 'Lender continues receiving all dividends, bonuses, and rights benefits.' },
      { title: 'Flexible Tenures', desc: 'Select standard monthly contract durations ranging from 1 to 12 months.' },
    ],
    whoItIsFor: [
      'Long-Term Buy & Hold Investors',
      'HNIs with Substantial Stock Portfolios',
      'Family Offices',
      'Institutional Asset Holders',
    ],
    process: [
      { step: '01', title: 'Portfolio Audit', desc: 'Identifying eligible SEBI-approved liquid equity securities in your Demat account.' },
      { step: '02', title: 'Lending Order Placement', desc: 'Submitting lending quotes with desired lending fee rate and contract month.' },
      { step: '03', title: 'Trade Matching & Clearing', desc: 'Exchange matching of quotes and clearing house transfer confirmation.' },
      { step: '04', title: 'Fee Credit & Share Return', desc: 'Upfront credit of lending fee and automated return of shares upon contract maturity.' },
    ],
    importantConsiderations: [
      'Only securities listed on SEBI’s approved SLBM list are eligible for lending transactions.',
      'Lending fees earned through SLBM are treated as income and taxed according to applicable IT rules.',
      'Share voting rights during the specific contract tenure rest with the borrower.',
    ],
  },
  {
    id: 'insurance',
    slug: 'insurance',
    title: 'Insurance Advisory',
    description: 'Comprehensive Term & Health Risk Protection Planning',
    intro: 'Insurance advisory assists families and business owners in evaluating financial risk, calculating human life value, and selecting term life and health insurance coverage to protect family assets.',
    image: insuranceImg,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    overviewHeading: 'Protecting Family Wealth Against Unforeseen Life & Health Risks',
    overviewParagraphs: [
      'A sound financial plan requires a strong risk-protection foundation. Without adequate term life and health insurance, unexpected medical emergencies or the premature loss of a primary earner can erode years of accumulated savings.',
      'We evaluate your Human Life Value (HLV), current liabilities, and medical requirements to recommend pure term insurance and comprehensive health policies with cashless hospital network access.',
      'We compare policy features, claim settlement ratios (CSR), exclusion clauses, and rider options across top IRDAI-regulated insurers to ensure complete transparency during policy issuance and claim settlement.',
    ],
    keyBenefits: [
      { title: 'Pure Term Protection', desc: 'High sum-assured life coverage at affordable premiums to safeguard family dependents.' },
      { title: 'Cashless Health Coverage', desc: 'Comprehensive medical coverage with extensive hospital network access and critical illness riders.' },
      { title: 'Unbiased Policy Comparison', desc: 'Transparent evaluation of claim settlement ratios and terms across leading insurers.' },
      { title: 'Dedicated Claim Assistance', desc: 'End-to-end guidance during claim documentation, submission, and annual policy renewals.' },
    ],
    whoItIsFor: [
      'Primary Family Breadwinners',
      'Parents with Dependent Children',
      'Business Partners & Keymen',
      'Individuals Seeking Medical Protection',
    ],
    process: [
      { step: '01', title: 'Risk & Needs Assessment', desc: 'Calculating Human Life Value, existing liabilities, and medical coverage needs.' },
      { step: '02', title: 'Policy Comparison', desc: 'Evaluating policies based on claim settlement history, sub-limits, and exclusions.' },
      { step: '03', title: 'Underwriting & Issuance', desc: 'Completing medical disclosures, health check-ups, and policy issuance.' },
      { step: '04', title: 'Annual Renewal & Claim Support', desc: 'Managing timely policy renewals and offering 24/7 dedicated claim assistance.' },
    ],
    importantConsiderations: [
      'Full and accurate disclosure of pre-existing medical conditions is essential to ensure claim validity.',
      'Term insurance provides risk coverage without investment returns, ensuring maximum sum-assured efficiency.',
      'Health insurance policies carry pre-existing disease waiting periods specified in IRDAI guidelines.',
    ],
  },
  {
    id: 'physical-shares',
    slug: 'physical-shares',
    title: 'Physical Shares Solutions',
    description: 'Dematerialization, Duplicate Certificate & Legacy Transmission',
    intro: 'Physical share services help investors and legal heirs convert old paper share certificates into modern electronic Demat holdings, handling duplicate issuance, signature mismatches, and RTA transmissions.',
    image: physicalSharesImg,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    overviewHeading: 'Transforming Legacy Paper Certificates Into Digital Demat Assets',
    overviewParagraphs: [
      'Many Indian families hold old paper share certificates inherited from parents or purchased decades ago. Under current SEBI regulations, physical paper shares cannot be traded or transferred on stock exchanges without first being dematerialized into electronic form.',
      'The dematerialization process often involves complex documentation issues such as misplaced certificates, signature variations, address changes, name discrepancies, or legal transmission following the demise of the registered holder.',
      'Parshwa Consultancy brings over 35 years of specialized expertise in coordinating with company Registrar & Transfer Agents (RTAs) like CAMS, KFintech, and Link Intime to audit paper folios, draft legal affidavits, and convert paper shares into your electronic Demat account.',
    ],
    keyBenefits: [
      { title: 'Paper Dematerialization', desc: 'Converting physical paper share certificates into electronic book-entry Demat holdings.' },
      { title: 'Duplicate Share Issuance', desc: 'Documentation assistance for lost, misplaced, or damaged paper share certificates.' },
      { title: 'Legal Heir Transmission', desc: 'Handling share transmission in legal heir, joint holder, and probate succession cases.' },
      { title: 'RTA Signature Resolution', desc: 'Resolving signature mismatch, name variations, and address updates with RTAs.' },
    ],
    whoItIsFor: [
      'Senior Citizens Holding Paper Certificates',
      'Legal Heirs & Executors of Estates',
      'Families Inheriting Ancestral Portfolios',
      'Investors Resolving Lost Certificate Folios',
    ],
    process: [
      { step: '01', title: 'Folio & Certificate Audit', desc: 'Inspecting physical certificates, company status, folio numbers, and RTA records.' },
      { step: '02', title: 'Legal Documentation', desc: 'Drafting affidavits, indemnity bonds, surety forms, and DRF Demat Request Forms.' },
      { step: '03', title: 'RTA Verification', desc: 'Submitting documentation dossiers to Registrar & Transfer Agents for verification.' },
      { step: '04', title: 'Electronic Demat Credit', desc: 'Tracking verification approval and credit of electronic shares into your Demat account.' },
    ],
    importantConsiderations: [
      'Physical share certificates must be verified for active corporate changes, face value splits, or mergers.',
      'Transmission cases require succession certificates, legal heir affidavits, or probated wills as per RTA norms.',
      'Public advertisement notices may be required for issuing duplicate certificates above prescribed market value thresholds.',
    ],
  },
  {
    id: 'iepf',
    slug: 'iepf',
    title: 'IEPF Services',
    description: 'Reclaiming Unclaimed Dividends & Transferred IEPF Shares',
    intro: 'IEPF claim services assist original shareholders and legal heirs in recovering shares and unclaimed dividends transferred to the Investor Education and Protection Fund (IEPF) Authority under Section 124(6).',
    image: iepfImg,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    overviewHeading: 'Restoring Unclaimed Family Shares & Dividends From IEPF',
    overviewParagraphs: [
      'Under Section 124(6) of the Companies Act, if dividends on a equity share folio remain unclaimed or unpaid for seven consecutive years, the company is legally required to transfer both the unclaimed dividend amount and the underlying shares to the IEPF Authority under the Ministry of Corporate Affairs (MCA).',
      'Recovering assets from the IEPF Authority requires a multi-stage claim procedure involving online e-form IEPF-5 filing, verification dossier submission to the company Nodal Officer, RTA audit reports, and final approval by the IEPF Authority.',
      'Our dedicated IEPF claim division specializes in tracing lost folios, calculating accumulated dividends, preparing legal claim dossiers, liaising with corporate Nodal Officers, and ensuring direct credit of recovered shares into your Demat account.',
    ],
    keyBenefits: [
      { title: 'Comprehensive Folio Trace', desc: 'Locating transferred company folios, accumulated dividends, and exact share counts.' },
      { title: 'IEPF-5 E-Filing Support', desc: 'Precise online submission of e-form IEPF-5 on the Ministry of Corporate Affairs portal.' },
      { title: 'Nodal Officer Coordination', desc: 'Filing physical dossiers and coordinating with company Nodal Officers and RTAs.' },
      { title: 'Direct Share & Dividend Credit', desc: 'Direct credit of recovered electronic shares to Demat and dividends to linked bank account.' },
    ],
    whoItIsFor: [
      'Shareholders with Long-Pending Unclaimed Dividends',
      'Legal Heirs of Transferred IEPF Shares',
      'Families Seeking Recovery of Dormant Wealth',
      'Investors Resolving Old Paper Folios Transferred to MCA',
    ],
    process: [
      { step: '01', title: 'Search & Entitlement Check', desc: 'Searching IEPF database, verifying company folio records, and entitlement amounts.' },
      { step: '02', title: 'Form IEPF-5 Submission', desc: 'Filing online claim form IEPF-5 on MCA portal and generating SRN acknowledgment.' },
      { step: '03', title: 'Physical Dossier Filing', desc: 'Submitting verified original certificates, indemnities, and affidavits to Nodal Officer.' },
      { step: '04', title: 'MCA Approval & Credit', desc: 'Tracking Nodal Officer verification report and credit of shares/funds upon MCA approval.' },
    ],
    importantConsiderations: [
      'Claims require exact matching of PAN, bank account details, and address proof with RTA records.',
      'In joint holder or deceased holder cases, share transmission documentation must precede IEPF filing.',
      'The IEPF Authority approves claims after verification report approval by company Nodal Officers.',
    ],
  },
  {
    id: 'trading',
    slug: 'trading',
    title: 'Trading Account Services',
    description: 'Multi-Asset Exchange Access & Executive Desk Execution',
    intro: 'Trading account services provide active investors with seamless access to equity cash, futures & options (F&O), and currency trading platforms backed by real-time streaming data and relationship desk support.',
    image: tradingImg,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    overviewHeading: 'Direct Exchange Access & Intraday Trading Capabilities',
    overviewParagraphs: [
      'A trading account acts as the transaction bridge between your bank account and stock exchanges (NSE / BSE). It allows investors to place buy and sell orders across cash equity, stock futures, index options, and currency pairs.',
      'Our trading account solutions provide robust mobile trading applications, browser-based web portals, and dedicated executive desk call-and-trade support to ensure smooth order execution during market hours.',
      'We emphasize risk management, margin transparency, instant fund transfers via UPI/Netbanking, and comprehensive contract note generation to assist active market participants in managing trade logistics efficiently.',
    ],
    keyBenefits: [
      { title: 'Multi-Asset Class Access', desc: 'Trade across NSE & BSE Equity Cash, Intraday, Futures, Options, and Currency segments.' },
      { title: 'Advanced Trading Platforms', desc: 'Feature-rich web portals, mobile apps, streaming charts, and technical indicators.' },
      { title: 'Instant Fund Transfers', desc: 'Seamless fund pay-in and pay-out linked directly with your primary bank account.' },
      { title: 'Executive Desk Execution', desc: 'Dedicated phone order placement assistance and margin management support.' },
    ],
    whoItIsFor: [
      'Intraday & Swing Equity Traders',
      'Futures & Options (F&O) Strategists',
      'Active Market Participants',
      'Investors Seeking Exchange Execution Access',
    ],
    process: [
      { step: '01', title: 'KYC & Segment Activation', desc: 'Completing digital KYC and activating Equity, F&O, and Currency segments.' },
      { step: '02', title: 'Trading Platform Setup', desc: 'Setting up mobile/web trading interface, market watchlists, and price alerts.' },
      { step: '03', title: 'Order Execution & Margin', desc: 'Placing market/limit orders and managing margin requirements.' },
      { step: '04', title: 'Contract Notes & Reporting', desc: 'Receiving automated digital contract notes, P&L statements, and ledger reports.' },
    ],
    importantConsiderations: [
      'Trading in derivative segments (F&O) involves high market volatility and risk of capital loss.',
      'Intraday trades require strict stop-loss discipline and awareness of square-off timings.',
      'Statutory charges including STT, Stamp Duty, Exchange Turnover Fees, and GST apply to trades.',
    ],
  },
  {
    id: 'pms',
    slug: 'pms',
    title: 'Portfolio Management Services (PMS)',
    description: 'Customized Equity Portfolio Management for High Net Worth Investors',
    intro: 'Portfolio Management Services (PMS) provide professional, customized equity portfolio management for High Net Worth Individuals, offering direct stock ownership in the client’s individual Demat account.',
    image: pmsImg,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    overviewHeading: 'Direct Stock Ownership with Focused Equity Strategies',
    overviewParagraphs: [
      'Portfolio Management Services (PMS) offer customized equity management by professional fund managers tailored specifically for HNIs and family offices. Unlike mutual funds, equity shares in a PMS strategy are held directly in your individual Demat account.',
      'PMS strategies focus on concentrated, high-conviction stock portfolios (typically 15 to 30 stocks) across mid-cap, small-cap, or multi-cap themes, aiming for alpha generation through disciplined fundamental research.',
      'Clients receive total transparency with direct visibility into every transaction, trade execution price, holding statement, and capital gains report, alongside direct access to portfolio manager interactions.',
    ],
    keyBenefits: [
      { title: 'Direct Stock Ownership', desc: 'Equity shares are owned directly in your individual Demat account rather than a pooled fund.' },
      { title: 'High-Conviction Portfolios', desc: 'Focused, research-backed stock selection across mid-cap, small-cap, and multi-cap themes.' },
      { title: 'Complete Transparency', desc: 'Real-time visibility into individual stock trades, costs, and holding reports.' },
      { title: 'Professional Fund Management', desc: 'SEBI-registered portfolio managers actively managing portfolio risk and asset allocation.' },
    ],
    whoItIsFor: [
      'High Net Worth Individuals (HNIs)',
      'Ultra HNIs & Business Owners',
      'Family Offices',
      'Corporate Treasuries (Min ₹50 Lakhs Ticket)',
    ],
    process: [
      { step: '01', title: 'Investment Mandate Review', desc: 'Defining return expectations, risk tolerance, and selecting suitable PMS strategy themes.' },
      { step: '02', title: 'Account Onboarding', desc: 'Opening dedicated PMS Demat and bank account pool under custodian framework.' },
      { step: '03', title: 'Capital Deployment', desc: 'Executing portfolio stock purchases according to discretionary or non-discretionary mandate.' },
      { step: '04', title: 'Performance Audits', desc: 'Receiving monthly NAV statements, tax P&L reports, and participating in manager reviews.' },
    ],
    importantConsiderations: [
      'PMS is regulated under SEBI (Portfolio Managers) Regulations with a mandatory minimum investment of ₹50 Lakhs.',
      'Concentrated equity portfolios carry higher stock-specific volatility compared to broad mutual fund schemes.',
      'Capital gains tax applies directly to transactions executed within your individual Demat account.',
    ],
  },
  {
    id: 'aif',
    slug: 'aif',
    title: 'Alternative Investment Funds (AIF)',
    description: 'Private Equity, Venture Capital & Non-Correlated Asset Exposure',
    intro: 'Alternative Investment Funds (AIFs) are privately pooled investment vehicles catering to sophisticated investors seeking exposure to unlisted growth equity, private debt, real estate, and hedge fund strategies.',
    image: aifImg,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    overviewHeading: 'Institutional-Grade Access to Private Markets & Structured Assets',
    overviewParagraphs: [
      'Alternative Investment Funds (AIFs) represent pooled investment funds regulated by SEBI under Category I, II, and III mandates. They allow eligible investors to access asset classes beyond public stock exchanges.',
      'Category I AIFs focus on venture capital, angel funds, and SME infrastructure; Category II AIFs cover private equity, real estate funds, and venture debt; Category III AIFs employ complex hedge fund and derivative trading strategies.',
      'AIFs provide strategic diversification by investing in unlisted pre-IPO private companies, structured corporate credit, and commercial real estate assets that offer return profiles independent of public equity market swings.',
    ],
    keyBenefits: [
      { title: 'Private Market Access', desc: 'Direct participation in unlisted private equity, venture capital, and pre-IPO companies.' },
      { title: 'Non-Correlated Returns', desc: 'Sophisticated investment mandates designed to generate returns independent of public equity cycles.' },
      { title: 'SEBI Regulated Governance', desc: 'Institutional fund management governed by SEBI (Alternative Investment Funds) Regulations.' },
      { title: 'Strategic Diversification', desc: 'Portfolio allocation across structured credit, real estate assets, and private growth equity.' },
    ],
    whoItIsFor: [
      'Ultra High Net Worth Individuals (UHNIs)',
      'Family Offices & Institutional Treasuries',
      'Corporate Investors',
      'Sophisticated Private Equity Seekers (Min ₹1 Cr Ticket)',
    ],
    process: [
      { step: '01', title: 'Fund Mandate Evaluation', desc: 'Analyzing Category I, II, or III AIF Private Placement Memorandum (PPM) documents.' },
      { step: '02', title: 'Subscription & Onboarding', desc: 'Executing contribution agreement, KYC verification, and capital commitment.' },
      { step: '03', title: 'Capital Drawdown Calls', desc: 'Managing phased capital calls as the fund manager deploys capital into target assets.' },
      { step: '04', title: 'NAV Statements & Distributions', desc: 'Receiving quarterly NAV statements and capital realization distributions upon fund exits.' },
    ],
    importantConsiderations: [
      'AIFs are regulated under SEBI (AIF) Regulations with a mandatory minimum investment threshold of ₹1 Crore.',
      'Category I and II AIFs typically have lock-in periods of 3 to 7 years with limited early redemption liquidity.',
      'Private Placement Memorandum (PPM) documents must be thoroughly reviewed prior to capital subscription.',
    ],
  },
];

export default servicesData;
