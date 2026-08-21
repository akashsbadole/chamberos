const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://chambers:SGzgj6vR9cEWHvlRlcAHOGw5@localhost:5432/chambers_dev" });
const FIRM_ID = "firm_bfe6c122-34ff-465e-ac94-0ec88ceff273";

const seedClients = [
  { id: "cl_1", name: "Meridian Textiles Pvt. Ltd.", email: "legal@meridiantextiles.example", phone: "+91 98200 11223", matterType: "Commercial Contract", status: "active", conflictChecked: true, conflictFlags: [], kycVerified: true, engagementSigned: true, notes: "Long-standing client. Supply agreement disputes recur annually.", createdAt: new Date(Date.now()-40*24*3600*1000).toISOString() },
  { id: "cl_2", name: "Ritika Sahni", email: "ritika.sahni@example.com", phone: "+91 90210 44556", matterType: "Property Dispute", status: "kyc", conflictChecked: true, conflictFlags: [], kycVerified: false, engagementSigned: false, notes: "Inherited property partition matter, three siblings involved.", createdAt: new Date(Date.now()-2*24*3600*1000).toISOString() },
  { id: "cl_3", name: "Vantage Freight Logistics", email: "ops@vantagefreight.example", phone: "+91 88888 22110", matterType: "Employment", status: "conflict_check", conflictChecked: false, conflictFlags: ["Prior matter on record vs. same counterparty (2023)"], kycVerified: false, engagementSigned: false, notes: "Wrongful termination claim filed by former regional manager.", createdAt: new Date(Date.now()-1*24*3600*1000).toISOString() },
];

const seedCases = [
  { id: "case_1", title: "Meridian Textiles vs. Kalyan Dyeworks — Supply Breach", clientId: "cl_1", practiceArea: "Commercial", status: "in_court", courtName: "Bombay High Court", caseNumber: "COMM/2026/0442", nextHearing: new Date(Date.now()+4*24*3600*1000).toISOString(), filingDeadline: new Date(Date.now()+2*24*3600*1000).toISOString(), createdAt: new Date(Date.now()-35*24*3600*1000).toISOString(),
    compliance: [
      { id: "c1", label: "File rejoinder affidavit", dueDate: new Date(Date.now()+2*24*3600*1000).toISOString(), done: false },
      { id: "c2", label: "Serve interrogatories on defendant", dueDate: new Date(Date.now()+6*24*3600*1000).toISOString(), done: false },
      { id: "c3", label: "Court fee payment reconciliation", dueDate: new Date(Date.now()-3*24*3600*1000).toISOString(), done: true },
    ],
    documents: [
      { id: "doc_1", name: "Supply Agreement (2024 Renewal).txt", uploadedAt: new Date(Date.now()-30*24*3600*1000).toISOString(), content: "This Supply Agreement is entered into between Meridian Textiles Pvt. Ltd. and Kalyan Dyeworks. Termination: Either party may terminate upon 30 days notice. Indemnification: Kalyan Dyeworks shall indemnify Meridian. Limitation of Liability: capped at fees paid in preceding 12 months. Governing Law: laws of India, Mumbai jurisdiction. Force Majeure: beyond reasonable control. Confidentiality: 3 years. Payment Terms: 45 days, 1.5% per month. Arbitration: Arbitration and Conciliation Act, 1996, seat Mumbai." },
    ]
  },
  { id: "case_2", title: "Sahni Family Property Partition", clientId: "cl_2", practiceArea: "Property", status: "open", courtName: "Civil Court, Nagpur", caseNumber: "CIV/2026/1187", nextHearing: new Date(Date.now()+11*24*3600*1000).toISOString(), filingDeadline: new Date(Date.now()+9*24*3600*1000).toISOString(), createdAt: new Date(Date.now()-2*24*3600*1000).toISOString(),
    compliance: [
      { id: "c4", label: "Draft partition suit plaint", dueDate: new Date(Date.now()+9*24*3600*1000).toISOString(), done: false },
      { id: "c5", label: "Collect mutation records", dueDate: new Date(Date.now()+4*24*3600*1000).toISOString(), done: false },
    ],
    documents: [
      { id: "doc_2", name: "Family Settlement Draft v1.txt", uploadedAt: new Date(Date.now()-1*24*3600*1000).toISOString(), content: "Draft Family Settlement Deed between three legal heirs. Termination: final, mutual consent. Governing Law: India, Nagpur jurisdiction. Confidentiality: between parties and counsel. Payment Terms: equalisation within 60 days of registration." },
    ]
  },
  { id: "case_3", title: "Vantage Freight — Wrongful Termination Claim", clientId: "cl_3", practiceArea: "Employment", status: "pending_filing", courtName: "Labour Court, Pune", caseNumber: "PENDING", nextHearing: null, filingDeadline: new Date(Date.now()+13*24*3600*1000).toISOString(), createdAt: new Date(Date.now()-1*24*3600*1000).toISOString(),
    compliance: [
      { id: "c6", label: "Resolve conflict-check flag before engagement", dueDate: new Date(Date.now()+1*24*3600*1000).toISOString(), done: false },
      { id: "c7", label: "File written statement", dueDate: new Date(Date.now()+13*24*3600*1000).toISOString(), done: false },
    ],
    documents: []
  },
];

const seedEvents = [
  { id: "ev_1", title: "Hearing — Meridian vs. Kalyan Dyeworks", caseId: "case_1", start: new Date(Date.now()+4*24*3600*1000).toISOString(), end: new Date(Date.now()+4*24*3600*1000+1.5*3600*1000).toISOString(), type: "hearing", location: "Bombay High Court, Court Room 4" },
  { id: "ev_2", title: "Client call — Ritika Sahni", caseId: "case_2", start: new Date(Date.now()+1*24*3600*1000).toISOString(), end: new Date(Date.now()+1*24*3600*1000+0.5*3600*1000).toISOString(), type: "meeting", location: "Video call", meetingLink: "https://meet.google.com/demo-ritika" },
  { id: "ev_3", title: "Rejoinder affidavit filing deadline", caseId: "case_1", start: new Date(Date.now()+2*24*3600*1000).toISOString(), end: new Date(Date.now()+2*24*3600*1000+0.5*3600*1000).toISOString(), type: "deadline", location: "e-Filing portal" },
  { id: "ev_4", title: "Internal case strategy review", caseId: "case_3", start: new Date(Date.now()+1*24*3600*1000+0.25*3600*1000).toISOString(), end: new Date(Date.now()+1*24*3600*1000+1*3600*1000).toISOString(), type: "internal", location: "Conference Room B" },
];

async function seed(){
  const client = await pool.connect();
  try{
    await client.query('BEGIN');
    // Clear existing (keep Firm/User)
    await client.query('DELETE FROM "TrustTransaction"');
    await client.query('DELETE FROM "TrustAccount"');
    await client.query('DELETE FROM "Payment"');
    await client.query('DELETE FROM "Invoice"');
    await client.query('DELETE FROM "RecurringInvoice"');
    await client.query('DELETE FROM "Message"');
    await client.query('DELETE FROM "MessageThread"');
    await client.query('DELETE FROM "SignatureRequest"');
    await client.query('DELETE FROM "DocumentTemplate"');
    await client.query('DELETE FROM "Evidence"');
    await client.query('DELETE FROM "TimeEntry"');
    await client.query('DELETE FROM "MeetingNote"');
    await client.query('DELETE FROM "ChatMessage"');
    await client.query('DELETE FROM "CaseDocument"');
    await client.query('DELETE FROM "ComplianceItem"');
    await client.query('DELETE FROM "CalendarEvent"');
    await client.query('DELETE FROM "Grievance"');
    await client.query('DELETE FROM "ResearchQuestion"');
    await client.query('DELETE FROM "LegalCase"');
    await client.query('DELETE FROM "Client"');
    // Note: AuditEvent is append-only but we can clear for seed demo (trigger blocks delete? try)
    try{ await client.query('DELETE FROM "AuditEvent"'); }catch(e){ console.log("AuditEvent delete blocked by trigger, skipping", e.message.slice(0,80)); }
    await client.query('COMMIT');
  }catch(e){ await client.query('ROLLBACK'); throw e; } finally { client.release(); }

  // Insert clients
  for(const c of seedClients){
    await pool.query(`INSERT INTO "Client" (id,"firmId",name,email,phone,"matterType",status,"conflictChecked","conflictFlags","kycVerified","engagementSigned",notes,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13) ON CONFLICT (id) DO NOTHING`,
      [c.id, FIRM_ID, c.name, c.email, c.phone, c.matterType, c.status, c.conflictChecked, c.conflictFlags, c.kycVerified, c.engagementSigned, c.notes, c.createdAt]);
  }
  console.log("Clients seeded", seedClients.length);
  // Insert cases
  for(const cs of seedCases){
    await pool.query(`INSERT INTO "LegalCase" (id,"firmId","clientId",title,"practiceArea",status,"courtName","caseNumber","nextHearing","filingDeadline","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11) ON CONFLICT (id) DO NOTHING`,
      [cs.id, FIRM_ID, cs.clientId, cs.title, cs.practiceArea, cs.status, cs.courtName, cs.caseNumber, cs.nextHearing, cs.filingDeadline, cs.createdAt]);
    for(const comp of cs.compliance){
      await pool.query(`INSERT INTO "ComplianceItem" (id,"caseId",label,"dueDate",done,"createdAt") VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [comp.id, cs.id, comp.label, comp.dueDate, comp.done, new Date().toISOString()]);
    }
    for(const doc of cs.documents){
      await pool.query(`INSERT INTO "CaseDocument" (id,"caseId",name,content,"uploadedAt",version) VALUES ($1,$2,$3,$4,$5,1) ON CONFLICT (id) DO NOTHING`,
        [doc.id, cs.id, doc.name, doc.content, doc.uploadedAt]);
    }
  }
  console.log("Cases seeded", seedCases.length);
  // Events
  for(const ev of seedEvents){
    await pool.query(`INSERT INTO "CalendarEvent" (id,"firmId","caseId",title,start,"end",type,location,"meetingLink") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
      [ev.id, FIRM_ID, ev.caseId, ev.title, ev.start, ev.end, ev.type, ev.location, ev.meetingLink||null]);
  }
  console.log("Events seeded", seedEvents.length);
  // Time entries
  await pool.query(`INSERT INTO "TimeEntry" (id,"caseId",description,minutes,rate,billed,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
    ["time_1","case_1","Drafted rejoinder affidavit",120,6000,false,new Date().toISOString()]);
  await pool.query(`INSERT INTO "TimeEntry" (id,"caseId",description,minutes,rate,billed,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
    ["time_2","case_1","Client conference — strategy",60,6000,false,new Date().toISOString()]);
  console.log("Time entries seeded");
  // Document templates
  const templates = [
    { id: "tmpl_1", name: "Engagement Letter", category: "letter", body: "CHAMBERS — Engagement Letter\nDate: {{date}}\nClient: {{client.name}} ({{client.email}})\nMatter: {{case.title}} ({{case.practiceArea}})\nDear {{client.name}}, we confirm engagement for {{case.title}}." },
    { id: "tmpl_2", name: "Vakalatnama", category: "pleading", body: "VAKALATNAMA\nI, {{client.name}}, authorize {{firm.name}} to appear in {{case.title}} ({{case.caseNumber}}, {{case.courtName}}).\nDate: {{date}}" },
    { id: "tmpl_3", name: "Fee Agreement", category: "contract", body: "FEE AGREEMENT\nBetween {{firm.name}} and {{client.name}} for {{case.title}}.\nDate: {{date}}" },
  ];
  for(const t of templates){
    await pool.query(`INSERT INTO "DocumentTemplate" (id,"firmId",name,category,body,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$6) ON CONFLICT (id) DO NOTHING`,
      [t.id, FIRM_ID, t.name, t.category, t.body, new Date().toISOString()]);
  }
  console.log("Templates seeded", templates.length);
  // Invoice
  const invId = "inv_seed_1";
  await pool.query(`INSERT INTO "Invoice" (id,"firmId","caseId","clientId",number,status,"lineItems",subtotal,"total","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) ON CONFLICT (id) DO NOTHING`,
    [invId, FIRM_ID, "case_1","cl_1","INV-2026-0001","draft",JSON.stringify([{description:"Drafted rejoinder",amount:12000}]),12000,12000,new Date().toISOString()]);
  console.log("Invoice seeded");
  // Trust
  const trustId = "trust_seed_1";
  await pool.query(`INSERT INTO "TrustAccount" (id,"firmId","clientId",balance,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$5) ON CONFLICT ("firmId","clientId") DO NOTHING`,
    [trustId, FIRM_ID, "cl_1", 50000, new Date().toISOString()]);
  // Need to fetch actual id if conflict
  let tid = trustId;
  const q = await pool.query(`SELECT id FROM "TrustAccount" WHERE "firmId"=$1 AND "clientId"=$2`, [FIRM_ID, "cl_1"]);
  if(q.rows[0]) tid = q.rows[0].id;
  await pool.query(`INSERT INTO "TrustTransaction" (id,"accountId","firmId",type,amount,"balanceAfter","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
    ["ttxn_seed_1", tid, FIRM_ID, "deposit", 50000, 50000, new Date().toISOString()]);
  console.log("Trust seeded", tid);
  // Message thread
  const thrId = "thr_seed_1";
  await pool.query(`INSERT INTO "MessageThread" (id,"firmId","clientId","caseId",subject,"createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$6) ON CONFLICT (id) DO NOTHING`,
    [thrId, FIRM_ID, "cl_1","case_1","Fee clarification",new Date().toISOString()]);
  await pool.query(`INSERT INTO "Message" (id,"threadId",sender,body,"createdAt") VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
    ["msg_seed_1", thrId, "client", "Please share the next hearing date?", new Date().toISOString()]);
  await pool.query(`INSERT INTO "Message" (id,"threadId",sender,body,"createdAt") VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
    ["msg_seed_2", thrId, "firm", "Next hearing is on 4 days from now at Bombay High Court, Court Room 4.", new Date().toISOString()]);
  console.log("Messages seeded");

  // Verify
  const counts = await Promise.all([
    pool.query('SELECT COUNT(*) as c FROM "Client"'),
    pool.query('SELECT COUNT(*) as c FROM "LegalCase"'),
    pool.query('SELECT COUNT(*) as c FROM "CaseDocument"'),
    pool.query('SELECT COUNT(*) as c FROM "CalendarEvent"'),
    pool.query('SELECT COUNT(*) as c FROM "DocumentTemplate"'),
    pool.query('SELECT COUNT(*) as c FROM "Invoice"'),
    pool.query('SELECT COUNT(*) as c FROM "TrustAccount"'),
    pool.query('SELECT COUNT(*) as c FROM "MessageThread"'),
  ]);
  console.log("VERIFY", counts.map(r=>r.rows[0].c).join(", "));
  await pool.end();
  console.log("SEED DONE");
}

seed().catch(e=>{ console.error(e); process.exit(1); });
