import { Client, LegalCase, CalendarEvent, ChatMessage } from "./types";

const now = new Date();
const iso = (daysFromNow: number, hour = 10, minute = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const seedClients: Client[] = [
  {
    id: "cl_1",
    name: "Meridian Textiles Pvt. Ltd.",
    email: "legal@meridiantextiles.example",
    phone: "+91 98200 11223",
    matterType: "Commercial Contract",
    status: "active",
    conflictChecked: true,
    conflictFlags: [],
    kycVerified: true,
    engagementSigned: true,
    createdAt: iso(-40),
    notes: "Long-standing client. Supply agreement disputes recur annually.",
  },
  {
    id: "cl_2",
    name: "Ritika Sahni",
    email: "ritika.sahni@example.com",
    phone: "+91 90210 44556",
    matterType: "Property Dispute",
    status: "kyc",
    conflictChecked: true,
    conflictFlags: [],
    kycVerified: false,
    engagementSigned: false,
    createdAt: iso(-2),
    notes: "Inherited property partition matter, three siblings involved.",
  },
  {
    id: "cl_3",
    name: "Vantage Freight Logistics",
    email: "ops@vantagefreight.example",
    phone: "+91 88888 22110",
    matterType: "Employment",
    status: "conflict_check",
    conflictChecked: false,
    conflictFlags: ["Prior matter on record vs. same counterparty (2023)"],
    kycVerified: false,
    engagementSigned: false,
    createdAt: iso(-1),
    notes: "Wrongful termination claim filed by former regional manager.",
  },
];

export const seedCases: LegalCase[] = [
  {
    id: "case_1",
    title: "Meridian Textiles vs. Kalyan Dyeworks — Supply Breach",
    clientId: "cl_1",
    practiceArea: "Commercial",
    status: "in_court",
    courtName: "Bombay High Court",
    caseNumber: "COMM/2026/0442",
    nextHearing: iso(4, 11, 0),
    filingDeadline: iso(2, 18, 0),
    createdAt: iso(-35),
    compliance: [
      { id: "c1", label: "File rejoinder affidavit", dueDate: iso(2, 18, 0), done: false },
      { id: "c2", label: "Serve interrogatories on defendant", dueDate: iso(6), done: false },
      { id: "c3", label: "Court fee payment reconciliation", dueDate: iso(-3), done: true },
    ],
    documents: [
      {
        id: "doc_1",
        name: "Supply Agreement (2024 Renewal).txt",
        uploadedAt: iso(-30),
        content:
          "This Supply Agreement is entered into between Meridian Textiles Pvt. Ltd. and Kalyan Dyeworks. " +
          "Termination: Either party may terminate this agreement upon 30 days written notice for uncured material breach. " +
          "Indemnification: Kalyan Dyeworks shall indemnify and hold harmless Meridian Textiles against all claims arising from defective goods. " +
          "Limitation of Liability: In no event shall aggregate liability exceed the fees paid in the preceding 12 months. " +
          "Governing Law: This agreement shall be governed by the laws of India, with exclusive jurisdiction in Mumbai courts. " +
          "Force Majeure: Neither party is liable for delay caused by events beyond reasonable control. " +
          "Confidentiality: Both parties shall keep commercial terms confidential for a period of 3 years post termination. " +
          "Payment Terms: Invoices are due within 45 days of receipt; late payment accrues interest at 1.5% per month. " +
          "Arbitration: Disputes not resolved amicably within 30 days shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, seat Mumbai.",
      },
    ],
  },
  {
    id: "case_2",
    title: "Sahni Family Property Partition",
    clientId: "cl_2",
    practiceArea: "Property",
    status: "open",
    courtName: "Civil Court, Nagpur",
    caseNumber: "CIV/2026/1187",
    nextHearing: iso(11, 10, 30),
    filingDeadline: iso(9, 17, 0),
    createdAt: iso(-2),
    compliance: [
      { id: "c4", label: "Draft partition suit plaint", dueDate: iso(9, 17, 0), done: false },
      { id: "c5", label: "Collect mutation records", dueDate: iso(4), done: false },
    ],
    documents: [
      {
        id: "doc_2",
        name: "Family Settlement Draft v1.txt",
        uploadedAt: iso(-1),
        content:
          "Draft Family Settlement Deed between the three legal heirs. " +
          "Termination: This settlement is final and shall not be terminated except by mutual written consent of all heirs. " +
          "Governing Law: Governed by the laws of India and subject to the jurisdiction of courts in Nagpur. " +
          "Confidentiality: Terms of settlement shall remain confidential between the parties and their counsel. " +
          "Payment Terms: The equalisation payment of the second heir's share shall be made within 60 days of registration.",
      },
    ],
  },
  {
    id: "case_3",
    title: "Vantage Freight — Wrongful Termination Claim",
    clientId: "cl_3",
    practiceArea: "Employment",
    status: "pending_filing",
    courtName: "Labour Court, Pune",
    caseNumber: "PENDING",
    nextHearing: null,
    filingDeadline: iso(13, 17, 0),
    createdAt: iso(-1),
    compliance: [
      { id: "c6", label: "Resolve conflict-check flag before engagement", dueDate: iso(1), done: false },
      { id: "c7", label: "File written statement", dueDate: iso(13, 17, 0), done: false },
    ],
    documents: [],
  },
];

export const seedEvents: CalendarEvent[] = [
  {
    id: "ev_1",
    title: "Hearing — Meridian vs. Kalyan Dyeworks",
    caseId: "case_1",
    start: iso(4, 11, 0),
    end: iso(4, 12, 30),
    type: "hearing",
    location: "Bombay High Court, Court Room 4",
  },
  {
    id: "ev_2",
    title: "Client call — Ritika Sahni",
    caseId: "case_2",
    start: iso(1, 15, 0),
    end: iso(1, 15, 30),
    type: "meeting",
    location: "Video call",
  },
  {
    id: "ev_3",
    title: "Rejoinder affidavit filing deadline",
    caseId: "case_1",
    start: iso(2, 18, 0),
    end: iso(2, 18, 30),
    type: "deadline",
    location: "e-Filing portal",
  },
  {
    id: "ev_4",
    title: "Internal case strategy review",
    caseId: "case_3",
    start: iso(1, 15, 15),
    end: iso(1, 16, 0),
    type: "internal",
    location: "Conference Room B",
  },
];

export const seedChat: ChatMessage[] = [
  {
    id: "msg_1",
    caseId: "case_1",
    role: "user",
    content: "What's our exposure under the limitation of liability clause?",
    timestamp: iso(-1, 9, 0),
  },
  {
    id: "msg_2",
    caseId: "case_1",
    role: "assistant",
    content:
      "Per the Supply Agreement, aggregate liability is capped at fees paid in the preceding 12 months. Combined with the indemnification clause covering defective goods, our exposure on this claim is contractually bounded — worth citing in the rejoinder.",
    timestamp: iso(-1, 9, 1),
  },
];

export const LEGAL_CORPUS: Omit<import("./types").ResearchResult, "relevance">[] = [
  {
    id: "lc_1",
    title: "M/s. Saraswati Trading Co. v. Union of India — on force majeure and frustration of contract",
    citation: "(2021) 4 SCC 210",
    court: "Supreme Court of India",
    year: 2021,
    snippet:
      "Held that a force majeure clause must be read strictly; a party cannot invoke it merely because performance has become onerous — the event must fall within the clause's specific language or, absent such a clause, satisfy Section 56 of the Contract Act.",
    tags: ["force majeure", "contract", "frustration", "section 56"],
  },
  {
    id: "lc_2",
    title: "Vidya Drolia v. Durga Trading Corporation — arbitrability of disputes",
    citation: "(2021) 2 SCC 1",
    court: "Supreme Court of India",
    year: 2021,
    snippet:
      "Laid down the fourfold test for non-arbitrability and reaffirmed that landlord-tenant disputes under rent control legislation are generally non-arbitrable, clarifying the scope of Section 8 and 11 of the Arbitration and Conciliation Act, 1996.",
    tags: ["arbitration", "arbitrability", "section 8", "section 11"],
  },
  {
    id: "lc_3",
    title: "Kailash Nath Associates v. DDA — liquidated damages and Section 74",
    citation: "(2015) 4 SCC 136",
    court: "Supreme Court of India",
    year: 2015,
    snippet:
      "Clarified that under Section 74 of the Contract Act, a party claiming liquidated damages need not prove actual loss where the amount is a genuine pre-estimate, but reasonable compensation is still capped at the stipulated sum.",
    tags: ["liquidated damages", "section 74", "contract", "penalty"],
  },
  {
    id: "lc_4",
    title: "Nariman Point Building Services v. State — indemnity clauses and third-party claims",
    citation: "(2019) 6 Bom LR 884",
    court: "Bombay High Court",
    year: 2019,
    snippet:
      "Held that a one-directional indemnity clause does not automatically imply an obligation to defend, absent express language; indemnity and duty-to-defend are distinct obligations under Indian contract law.",
    tags: ["indemnification", "indemnity", "contract", "third-party claims"],
  },
  {
    id: "lc_5",
    title: "Anuradha Bhasin v. Union of India — proportionality in restraint of trade",
    citation: "(2020) 3 SCC 637",
    court: "Supreme Court of India",
    year: 2020,
    snippet:
      "While primarily on internet shutdowns, the proportionality test articulated here is regularly cited in restraint-of-trade and non-compete litigation to assess whether a restriction goes beyond what is necessary to protect a legitimate interest.",
    tags: ["proportionality", "non-compete", "restraint of trade"],
  },
  {
    id: "lc_6",
    title: "Rajiv Ghosh v. Satya Narayan Jaiswal — partition suits and limitation",
    citation: "(2018) 12 SCC 359",
    court: "Supreme Court of India",
    year: 2018,
    snippet:
      "Reaffirmed that a co-owner in joint possession can seek partition at any time absent an ouster; limitation under Article 65 of the Limitation Act runs from the date of ouster, not from the date of the original inheritance.",
    tags: ["partition", "property", "limitation", "co-ownership"],
  },
  {
    id: "lc_7",
    title: "Central Inland Water Transport Corp. v. Brojo Nath Ganguly — unconscionable termination clauses",
    citation: "(1986) 3 SCC 156",
    court: "Supreme Court of India",
    year: 1986,
    snippet:
      "Held that a service contract clause allowing termination on short notice without reason, where there is unequal bargaining power, is unconscionable and void under Section 23 of the Contract Act.",
    tags: ["termination", "employment", "unconscionable", "section 23"],
  },
  {
    id: "lc_8",
    title: "Devinder Singh v. State of Punjab — wrongful termination and back wages",
    citation: "(2008) 1 SCC 728",
    court: "Supreme Court of India",
    year: 2008,
    snippet:
      "Set out the factors courts weigh before awarding full back wages in wrongful termination claims, including the employee's post-termination employment status and the employer's financial condition.",
    tags: ["wrongful termination", "employment", "back wages", "labour"],
  },
];

export const GLOSSARY: import("./types").GlossaryTerm[] = [
  { id: "g1", term: "Vakalatnama", definition: "A written authorization by which a client appoints an advocate to represent them in court proceedings.", tags: ["procedure", "appointment"] },
  { id: "g2", term: "Cause of Action", definition: "The set of facts that gives a person the right to seek a judicial remedy against another.", tags: ["civil", "pleadings"] },
  { id: "g3", term: "Interlocutory Application (IA)", definition: "An application filed during the pendency of a suit seeking interim relief, such as a stay or injunction, before final judgment.", tags: ["civil", "procedure"] },
  { id: "g4", term: "Cause List", definition: "The list of cases scheduled to be heard by a court on a given day, published in advance.", tags: ["court", "procedure"] },
  { id: "g5", term: "Ex Parte", definition: "A proceeding conducted for the benefit of one party only, without requiring the other party to be present or heard.", tags: ["procedure"] },
  { id: "g6", term: "Rejoinder", definition: "A pleading filed by a party in response to the opposing party's reply, addressing new points raised in it.", tags: ["pleadings", "civil"] },
  { id: "g7", term: "Injunction", definition: "A court order requiring a party to do or refrain from doing a specific act, often used to preserve the status quo pending trial.", tags: ["remedy", "civil"] },
  { id: "g8", term: "Force Majeure", definition: "A contract clause that excuses performance when extraordinary events beyond a party's control prevent it.", tags: ["contract"] },
  { id: "g9", term: "Indemnity", definition: "A contractual obligation of one party to compensate the loss incurred by another party due to the act of the indemnitor or a third party.", tags: ["contract"] },
  { id: "g10", term: "Limitation Period", definition: "The statutorily prescribed time within which a legal proceeding must be initiated, after which the claim is time-barred.", tags: ["procedure", "limitation act"] },
  { id: "g11", term: "Arbitral Award", definition: "The final decision rendered by an arbitral tribunal that resolves the dispute referred to arbitration, binding on the parties.", tags: ["arbitration"] },
  { id: "g12", term: "Mutation (Property)", definition: "The process of updating land revenue records to reflect a change in ownership of property, following sale, inheritance, or gift.", tags: ["property"] },
  { id: "g13", term: "Partition Suit", definition: "A civil suit filed by a co-owner of property seeking division of the property into separate shares.", tags: ["property", "civil"] },
  { id: "g14", term: "Wrongful Termination", definition: "The dismissal of an employee in violation of statutory protections, the terms of the employment contract, or principles of natural justice.", tags: ["employment", "labour"] },
  { id: "g15", term: "Written Statement", definition: "The defendant's formal written response to a plaint, admitting or denying the allegations and raising defenses.", tags: ["pleadings", "civil"] },
  { id: "g16", term: "CNR Number", definition: "A unique 16-digit Case Number Record assigned to every case filed in Indian courts, used to track its status on the eCourts portal.", tags: ["court", "procedure"] },
  { id: "g17", term: "Affidavit", definition: "A written statement of facts, voluntarily made and confirmed by oath or affirmation, for use as evidence in court.", tags: ["evidence", "procedure"] },
  { id: "g18", term: "Bailable Offence", definition: "An offence for which bail is a matter of right, as specified in the schedule to the Code of Criminal Procedure / BNSS.", tags: ["criminal"] },
  { id: "g19", term: "Non-Compete Clause", definition: "A contractual restriction preventing a party (commonly an employee) from engaging in competing business for a specified period and geography.", tags: ["contract", "employment"] },
  { id: "g20", term: "Liquidated Damages", definition: "A pre-agreed sum specified in a contract as compensation payable upon breach, intended as a genuine pre-estimate of loss rather than a penalty.", tags: ["contract", "remedy"] },
];
