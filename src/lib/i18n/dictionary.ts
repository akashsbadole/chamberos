import { Locale } from "./locales";

export interface PageCopy {
  eyebrow: string;
  title: string;
  description: string;
}

export interface Dictionary {
  nav: {
    dashboard: string;
    cases: string;
    clients: string;
    onboarding: string;
    calendar: string;
    courtSync: string;
    voiceIntake: string;
    research: string;
    billing: string;
    assistant: string;
    portal: string;
    activity: string;
    settings: string;
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    continue: string;
    back: string;
    search: string;
    demoNotice: string;
  };
  lock: {
    title: string;
    subtitle: string;
    pinPlaceholder: string;
    unlock: string;
    unlocking: string;
  };
  status: {
    open: string;
    pending_filing: string;
    in_court: string;
    closed: string;
    intake: string;
    conflict_check: string;
    kyc: string;
    engagement: string;
    active: string;
  };
  pages: {
    dashboard: PageCopy;
    cases: PageCopy;
    clients: PageCopy;
    onboarding: PageCopy;
    calendar: PageCopy;
    courtSync: PageCopy;
    voiceIntake: PageCopy;
    research: PageCopy;
    billing: PageCopy;
    assistant: PageCopy;
    portal: PageCopy;
    activity: PageCopy;
    settings: PageCopy;
  };
}

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en: {
    nav: {
      dashboard: "Dashboard", cases: "Cases", clients: "Clients", onboarding: "Onboarding",
      calendar: "Calendar", courtSync: "eCourts Sync", voiceIntake: "Voice Intake",
      research: "Research & Glossary", billing: "Time & Billing", assistant: "AI Assistant",
      portal: "Client Portal", activity: "Activity Log", settings: "Settings",
    },
    common: {
      loading: "Loading…", save: "Save", cancel: "Cancel", continue: "Continue", back: "Back",
      search: "Search", demoNotice: "Demo build — see the AI Assistant and Settings pages to connect a real AI provider.",
    },
    lock: {
      title: "Enter your PIN", subtitle: "Your case data is encrypted at rest. Enter the PIN you set to unlock this device session.",
      pinPlaceholder: "PIN", unlock: "Unlock", unlocking: "Unlocking…",
    },
    status: {
      open: "Open", pending_filing: "Pending Filing", in_court: "In Court", closed: "Closed",
      intake: "Intake", conflict_check: "Conflict Check", kyc: "KYC Pending", engagement: "Engagement Pending", active: "Active",
    },
    pages: {
      dashboard: { eyebrow: "Overview", title: "Good morning, Counsel", description: "Here's what needs attention across your practice today." },
      cases: { eyebrow: "Matters", title: "Cases", description: "Every open and closed matter, with AI-detected clauses and filing status at a glance." },
      clients: { eyebrow: "Clients", title: "Clients", description: "Client records with conflict-check and KYC status from intake." },
      onboarding: { eyebrow: "Client onboarding", title: "New client intake", description: "A guided flow through conflict checking, KYC, and engagement." },
      calendar: { eyebrow: "Scheduling", title: "Calendar", description: "Schedule hearings, meetings, and deadlines. The assistant flags double-bookings and suggests open slots." },
      courtSync: { eyebrow: "Integration", title: "eCourts cause-list sync", description: "Pulls the next cause list from eCourts and matches entries to open matters by case number." },
      voiceIntake: { eyebrow: "Intake", title: "Voice case creation", description: "Dictate a new matter out loud — the transcript is parsed into a case draft for review." },
      research: { eyebrow: "Research", title: "AI legal research & glossary", description: "Search case law and legal terms, and save authorities to a matter." },
      billing: { eyebrow: "Billing", title: "Time & billing", description: "Log billable time, track what's outstanding, and generate an invoice." },
      assistant: { eyebrow: "Law AI Assistant", title: "Ask anything", description: "A general legal assistant — powered by a real model when connected." },
      portal: { eyebrow: "Client-facing", title: "Client portal", description: "What a client sees: their upcoming schedule and a way to raise a grievance." },
      activity: { eyebrow: "Trust & compliance", title: "Activity log", description: "An append-only record of who did what across the practice." },
      settings: { eyebrow: "Configuration", title: "Settings", description: "Connect a real AI provider, and set up encryption for this device." },
    },
  },
  hi: {
    nav: {
      dashboard: "डैशबोर्ड", cases: "मामले", clients: "मुवक्किल", onboarding: "नामांकन",
      calendar: "कैलेंडर", courtSync: "ईकोर्ट्स सिंक", voiceIntake: "वॉइस इनटेक",
      research: "शोध और शब्दावली", billing: "समय और बिलिंग", assistant: "एआई सहायक",
      portal: "क्लाइंट पोर्टल", activity: "गतिविधि लॉग", settings: "सेटिंग्स",
    },
    common: {
      loading: "लोड हो रहा है…", save: "सहेजें", cancel: "रद्द करें", continue: "जारी रखें", back: "वापस",
      search: "खोजें", demoNotice: "डेमो संस्करण — वास्तविक एआई प्रदाता जोड़ने के लिए एआई सहायक और सेटिंग्स पेज देखें।",
    },
    lock: {
      title: "अपना पिन दर्ज करें", subtitle: "आपका केस डेटा एन्क्रिप्टेड है। इस डिवाइस को अनलॉक करने के लिए अपना पिन दर्ज करें।",
      pinPlaceholder: "पिन", unlock: "अनलॉक करें", unlocking: "अनलॉक हो रहा है…",
    },
    status: {
      open: "खुला", pending_filing: "फाइलिंग लंबित", in_court: "अदालत में", closed: "बंद",
      intake: "नामांकन", conflict_check: "हितों का टकराव जांच", kyc: "केवाईसी लंबित", engagement: "अनुबंध लंबित", active: "सक्रिय",
    },
    pages: {
      dashboard: { eyebrow: "अवलोकन", title: "सुप्रभात, वकील साहब", description: "आज आपके कार्यालय में इन पर ध्यान देने की आवश्यकता है।" },
      cases: { eyebrow: "मामले", title: "मामले", description: "सभी खुले और बंद मामले, एआई द्वारा पहचानी गई शर्तों और फाइलिंग स्थिति के साथ।" },
      clients: { eyebrow: "मुवक्किल", title: "मुवक्किल", description: "नामांकन से प्राप्त हितों के टकराव और केवाईसी स्थिति सहित मुवक्किल अभिलेख।" },
      onboarding: { eyebrow: "मुवक्किल नामांकन", title: "नया मुवक्किल नामांकन", description: "हितों के टकराव की जांच, केवाईसी और अनुबंध की चरणबद्ध प्रक्रिया।" },
      calendar: { eyebrow: "समय-निर्धारण", title: "कैलेंडर", description: "सुनवाई, बैठकें और समय-सीमाएँ निर्धारित करें। सहायक टकराव को चिह्नित करता है और खाली समय सुझाता है।" },
      courtSync: { eyebrow: "एकीकरण", title: "ईकोर्ट्स कॉज़-लिस्ट सिंक", description: "ईकोर्ट्स से अगली कॉज़ लिस्ट लाता है और केस नंबर से खुले मामलों से मिलाता है।" },
      voiceIntake: { eyebrow: "नामांकन", title: "वॉइस केस निर्माण", description: "नया मामला बोलकर दर्ज करें — प्रतिलेख को समीक्षा हेतु केस ड्राफ्ट में बदला जाता है।" },
      research: { eyebrow: "शोध", title: "एआई विधिक शोध और शब्दावली", description: "केस लॉ और विधिक शब्द खोजें, और संदर्भों को मामले में सहेजें।" },
      billing: { eyebrow: "बिलिंग", title: "समय और बिलिंग", description: "बिल योग्य समय दर्ज करें, बकाया राशि देखें, और चालान बनाएँ।" },
      assistant: { eyebrow: "विधि एआई सहायक", title: "कुछ भी पूछें", description: "एक सामान्य विधिक सहायक — जुड़े होने पर वास्तविक मॉडल द्वारा संचालित।" },
      portal: { eyebrow: "मुवक्किल-मुखी", title: "क्लाइंट पोर्टल", description: "मुवक्किल को क्या दिखता है: उनकी आगामी अनुसूची और शिकायत दर्ज करने का तरीका।" },
      activity: { eyebrow: "विश्वास और अनुपालन", title: "गतिविधि लॉग", description: "कार्यालय में हुई हर कार्रवाई का सतत अभिलेख।" },
      settings: { eyebrow: "विन्यास", title: "सेटिंग्स", description: "वास्तविक एआई प्रदाता जोड़ें, और इस डिवाइस के लिए एन्क्रिप्शन सेट करें।" },
    },
  },
  mr: {
    nav: {
      dashboard: "डॅशबोर्ड", cases: "प्रकरणे", clients: "अशील", onboarding: "नोंदणी",
      calendar: "दिनदर्शिका", courtSync: "ईकोर्ट्स समक्रमण", voiceIntake: "आवाज नोंदणी",
      research: "संशोधन आणि शब्दकोश", billing: "वेळ आणि देयक", assistant: "एआय सहाय्यक",
      portal: "क्लायंट पोर्टल", activity: "क्रियाकलाप नोंद", settings: "सेटिंग्ज",
    },
    common: {
      loading: "लोड होत आहे…", save: "जतन करा", cancel: "रद्द करा", continue: "पुढे चला", back: "मागे",
      search: "शोधा", demoNotice: "डेमो आवृत्ती — खरा एआय प्रदाता जोडण्यासाठी एआय सहाय्यक व सेटिंग्ज पाहा.",
    },
    lock: {
      title: "तुमचा पिन टाका", subtitle: "तुमचा केस डेटा एन्क्रिप्ट केलेला आहे. हे डिव्हाइस अनलॉक करण्यासाठी पिन टाका.",
      pinPlaceholder: "पिन", unlock: "अनलॉक करा", unlocking: "अनलॉक होत आहे…",
    },
    status: {
      open: "उघडे", pending_filing: "दाखल प्रलंबित", in_court: "न्यायालयात", closed: "बंद",
      intake: "नोंदणी", conflict_check: "हितसंबंध तपासणी", kyc: "केवायसी प्रलंबित", engagement: "करार प्रलंबित", active: "सक्रिय",
    },
    pages: {
      dashboard: { eyebrow: "आढावा", title: "सुप्रभात, वकील साहेब", description: "आज तुमच्या कार्यालयात यांकडे लक्ष देण्याची गरज आहे." },
      cases: { eyebrow: "प्रकरणे", title: "प्रकरणे", description: "एआयने ओळखलेल्या कलमांसह आणि दाखल स्थितीसह सर्व उघडी व बंद प्रकरणे." },
      clients: { eyebrow: "अशील", title: "अशील", description: "नोंदणीतून मिळालेली हितसंबंध तपासणी व केवायसी स्थितीसह अशील नोंदी." },
      onboarding: { eyebrow: "अशील नोंदणी", title: "नवीन अशील नोंदणी", description: "हितसंबंध तपासणी, केवायसी आणि करार यांची टप्प्याटप्प्याने प्रक्रिया." },
      calendar: { eyebrow: "वेळापत्रक", title: "दिनदर्शिका", description: "सुनावणी, बैठका व मुदती ठरवा. सहाय्यक संघर्ष दाखवतो व मोकळा वेळ सुचवतो." },
      courtSync: { eyebrow: "एकत्रीकरण", title: "ईकोर्ट्स कॉज-लिस्ट समक्रमण", description: "ईकोर्ट्सवरून पुढील कॉज लिस्ट आणते व केस क्रमांकाने प्रकरणांशी जुळवते." },
      voiceIntake: { eyebrow: "नोंदणी", title: "आवाजाने प्रकरण तयार करा", description: "नवीन प्रकरण बोलून नोंदवा — उतारा पुनरावलोकनासाठी मसुद्यात रूपांतरित होतो." },
      research: { eyebrow: "संशोधन", title: "एआय विधी संशोधन व शब्दकोश", description: "न्यायनिवाडे व विधी संज्ञा शोधा, आणि संदर्भ प्रकरणात जतन करा." },
      billing: { eyebrow: "देयक", title: "वेळ आणि देयक", description: "देयक आकारणीयोग्य वेळ नोंदवा, थकबाकी पाहा, आणि बीजक तयार करा." },
      assistant: { eyebrow: "विधी एआय सहाय्यक", title: "काहीही विचारा", description: "एक सर्वसाधारण विधी सहाय्यक — जोडलेले असल्यास खऱ्या मॉडेलद्वारे चालतो." },
      portal: { eyebrow: "अशील-केंद्रित", title: "क्लायंट पोर्टल", description: "अशीलाला काय दिसते: त्यांचे आगामी वेळापत्रक आणि तक्रार नोंदवण्याचा मार्ग." },
      activity: { eyebrow: "विश्वास व अनुपालन", title: "क्रियाकलाप नोंद", description: "कार्यालयातील प्रत्येक कृतीची सलग नोंद." },
      settings: { eyebrow: "व्यवस्थापन", title: "सेटिंग्ज", description: "खरा एआय प्रदाता जोडा, आणि या डिव्हाइससाठी एन्क्रिप्शन सेट करा." },
    },
  },
  te: {
    nav: {
      dashboard: "డాష్‌బోర్డ్", cases: "కేసులు", clients: "క్లయింట్లు", onboarding: "నమోదు",
      calendar: "క్యాలెండర్", courtSync: "ఈకోర్ట్స్ సింక్", voiceIntake: "వాయిస్ ఇన్‌టేక్",
      research: "పరిశోధన & పదకోశం", billing: "సమయం & బిల్లింగ్", assistant: "AI సహాయకుడు",
      portal: "క్లయింట్ పోర్టల్", activity: "కార్యాచరణ లాగ్", settings: "సెట్టింగ్‌లు",
    },
    common: {
      loading: "లోడ్ అవుతోంది…", save: "సేవ్ చేయండి", cancel: "రద్దు చేయండి", continue: "కొనసాగించండి", back: "వెనుకకు",
      search: "వెతకండి", demoNotice: "డెమో వెర్షన్ — నిజమైన AI ప్రొవైడర్‌ను కనెక్ట్ చేయడానికి AI సహాయకుడు & సెట్టింగ్‌లు చూడండి.",
    },
    lock: {
      title: "మీ పిన్ నమోదు చేయండి", subtitle: "మీ కేసు డేటా ఎన్‌క్రిప్ట్ చేయబడింది. ఈ పరికరాన్ని అన్‌లాక్ చేయడానికి పిన్ నమోదు చేయండి.",
      pinPlaceholder: "పిన్", unlock: "అన్‌లాక్ చేయండి", unlocking: "అన్‌లాక్ అవుతోంది…",
    },
    status: {
      open: "తెరిచి ఉంది", pending_filing: "దాఖలు పెండింగ్‌లో", in_court: "కోర్టులో", closed: "మూసివేయబడింది",
      intake: "నమోదు", conflict_check: "వైరుధ్య తనిఖీ", kyc: "కేవైసీ పెండింగ్‌లో", engagement: "ఒప్పందం పెండింగ్‌లో", active: "క్రియాశీలం",
    },
    pages: {
      dashboard: { eyebrow: "అవలోకనం", title: "శుభోదయం, న్యాయవాది గారు", description: "ఈ రోజు మీ కార్యాలయంలో వీటిపై దృష్టి అవసరం." },
      cases: { eyebrow: "కేసులు", title: "కేసులు", description: "AI గుర్తించిన నిబంధనలు మరియు దాఖలు స్థితితో అన్ని తెరిచిన మరియు మూసిన కేసులు." },
      clients: { eyebrow: "క్లయింట్లు", title: "క్లయింట్లు", description: "నమోదు నుండి వచ్చిన వైరుధ్య తనిఖీ మరియు కేవైసీ స్థితితో క్లయింట్ రికార్డులు." },
      onboarding: { eyebrow: "క్లయింట్ నమోదు", title: "కొత్త క్లయింట్ నమోదు", description: "వైరుధ్య తనిఖీ, కేవైసీ, మరియు ఒప్పందం గుండా దశలవారీ ప్రక్రియ." },
      calendar: { eyebrow: "షెడ్యూలింగ్", title: "క్యాలెండర్", description: "విచారణలు, సమావేశాలు మరియు గడువులను షెడ్యూల్ చేయండి. సహాయకుడు వైరుధ్యాలను గుర్తించి ఖాళీ సమయాలను సూచిస్తాడు." },
      courtSync: { eyebrow: "ఇంటిగ్రేషన్", title: "ఈకోర్ట్స్ కాజ్-లిస్ట్ సింక్", description: "ఈకోర్ట్స్ నుండి తదుపరి కాజ్ లిస్ట్‌ను తీసుకువచ్చి కేసు నంబర్ ద్వారా తెరిచిన కేసులతో సరిపోల్చుతుంది." },
      voiceIntake: { eyebrow: "నమోదు", title: "వాయిస్ కేసు సృష్టి", description: "కొత్త కేసును మాట్లాడి నమోదు చేయండి — ట్రాన్స్‌క్రిప్ట్ సమీక్ష కోసం కేసు డ్రాఫ్ట్‌గా మారుతుంది." },
      research: { eyebrow: "పరిశోధన", title: "AI న్యాయ పరిశోధన & పదకోశం", description: "కేసు చట్టం మరియు న్యాయ పదాలను వెతకండి, మరియు మూలాలను కేసుకు సేవ్ చేయండి." },
      billing: { eyebrow: "బిల్లింగ్", title: "సమయం & బిల్లింగ్", description: "బిల్లు వేయదగిన సమయాన్ని లాగ్ చేయండి, బకాయిలను ట్రాక్ చేయండి, మరియు ఇన్‌వాయిస్ రూపొందించండి." },
      assistant: { eyebrow: "న్యాయ AI సహాయకుడు", title: "ఏదైనా అడగండి", description: "ఒక సాధారణ న్యాయ సహాయకుడు — కనెక్ట్ అయినప్పుడు నిజమైన మోడల్ ద్వారా నడుస్తుంది." },
      portal: { eyebrow: "క్లయింట్-ఎదుర్కొనే", title: "క్లయింట్ పోర్టల్", description: "క్లయింట్ చూసేది: వారి రాబోయే షెడ్యూల్ మరియు ఫిర్యాదు చేసే మార్గం." },
      activity: { eyebrow: "నమ్మకం & సమ్మతి", title: "కార్యాచరణ లాగ్", description: "కార్యాలయంలో ఎవరు ఏమి చేశారనే నిరంతర రికార్డు." },
      settings: { eyebrow: "కాన్ఫిగరేషన్", title: "సెట్టింగ్‌లు", description: "నిజమైన AI ప్రొవైడర్‌ను కనెక్ట్ చేయండి, మరియు ఈ పరికరం కోసం ఎన్‌క్రిప్షన్ సెటప్ చేయండి." },
    },
  },
  ta: {
    nav: {
      dashboard: "டாஷ்போர்டு", cases: "வழக்குகள்", clients: "வாடிக்கையாளர்கள்", onboarding: "பதிவு",
      calendar: "நாட்காட்டி", courtSync: "ஈகோர்ட்ஸ் ஒத்திசைவு", voiceIntake: "குரல் உள்ளீடு",
      research: "ஆராய்ச்சி & சொற்களஞ்சியம்", billing: "நேரம் & பில்லிங்", assistant: "AI உதவியாளர்",
      portal: "வாடிக்கையாளர் போர்டல்", activity: "செயல்பாட்டு பதிவு", settings: "அமைப்புகள்",
    },
    common: {
      loading: "ஏற்றுகிறது…", save: "சேமி", cancel: "ரத்துசெய்", continue: "தொடரவும்", back: "பின்செல்",
      search: "தேடு", demoNotice: "டெமோ பதிப்பு — உண்மையான AI வழங்குநரை இணைக்க AI உதவியாளர் & அமைப்புகளைப் பார்க்கவும்.",
    },
    lock: {
      title: "உங்கள் பின்னை உள்ளிடவும்", subtitle: "உங்கள் வழக்கு தரவு குறியாக்கம் செய்யப்பட்டுள்ளது. இந்த சாதனத்தை திறக்க பின்னை உள்ளிடவும்.",
      pinPlaceholder: "பின்", unlock: "திற", unlocking: "திறக்கிறது…",
    },
    status: {
      open: "திறந்துள்ளது", pending_filing: "தாக்கல் நிலுவையில்", in_court: "நீதிமன்றத்தில்", closed: "மூடப்பட்டது",
      intake: "பதிவு", conflict_check: "முரண்பாடு சரிபார்ப்பு", kyc: "KYC நிலுவையில்", engagement: "ஒப்பந்தம் நிலுவையில்", active: "செயலில்",
    },
    pages: {
      dashboard: { eyebrow: "மேலோட்டம்", title: "காலை வணக்கம், வழக்கறிஞர்", description: "இன்று உங்கள் நிறுவனத்தில் இவற்றுக்கு கவனம் தேவை." },
      cases: { eyebrow: "வழக்குகள்", title: "வழக்குகள்", description: "AI கண்டறிந்த விதிகள் மற்றும் தாக்கல் நிலையுடன் அனைத்து திறந்த மற்றும் மூடிய வழக்குகள்." },
      clients: { eyebrow: "வாடிக்கையாளர்கள்", title: "வாடிக்கையாளர்கள்", description: "பதிவிலிருந்து பெறப்பட்ட முரண்பாடு சரிபார்ப்பு மற்றும் KYC நிலையுடன் வாடிக்கையாளர் பதிவுகள்." },
      onboarding: { eyebrow: "வாடிக்கையாளர் பதிவு", title: "புதிய வாடிக்கையாளர் பதிவு", description: "முரண்பாடு சரிபார்ப்பு, KYC, மற்றும் ஒப்பந்தம் வழியாக படிப்படியான செயல்முறை." },
      calendar: { eyebrow: "திட்டமிடல்", title: "நாட்காட்டி", description: "விசாரணைகள், கூட்டங்கள் மற்றும் காலக்கெடுக்களை திட்டமிடுங்கள். உதவியாளர் முரண்பாடுகளைக் குறிக்கிறார் மற்றும் வெற்று நேரங்களை பரிந்துரைக்கிறார்." },
      courtSync: { eyebrow: "ஒருங்கிணைப்பு", title: "ஈகோர்ட்ஸ் காஸ்-லிஸ்ட் ஒத்திசைவு", description: "ஈகோர்ட்ஸிலிருந்து அடுத்த காஸ் லிஸ்டை கொண்டு வந்து வழக்கு எண்ணால் திறந்த வழக்குகளுடன் பொருத்துகிறது." },
      voiceIntake: { eyebrow: "பதிவு", title: "குரல் வழக்கு உருவாக்கம்", description: "புதிய வழக்கை பேசி பதிவு செய்யுங்கள் — படியெடுப்பு மறுஆய்வுக்காக வழக்கு வரைவாக மாற்றப்படுகிறது." },
      research: { eyebrow: "ஆராய்ச்சி", title: "AI சட்ட ஆராய்ச்சி & சொற்களஞ்சியம்", description: "வழக்கு சட்டம் மற்றும் சட்ட சொற்களைத் தேடி, மேற்கோள்களை வழக்கில் சேமிக்கவும்." },
      billing: { eyebrow: "பில்லிங்", title: "நேரம் & பில்லிங்", description: "பில் செய்யக்கூடிய நேரத்தை பதிவு செய்யுங்கள், நிலுவையைக் கண்காணிக்கவும், விலைப்பட்டியல் உருவாக்கவும்." },
      assistant: { eyebrow: "சட்ட AI உதவியாளர்", title: "எதையும் கேளுங்கள்", description: "ஒரு பொது சட்ட உதவியாளர் — இணைக்கப்படும் போது உண்மையான மாதிரியால் இயக்கப்படுகிறது." },
      portal: { eyebrow: "வாடிக்கையாளர்-நோக்கிய", title: "வாடிக்கையாளர் போர்டல்", description: "வாடிக்கையாளர் பார்ப்பது: அவர்களின் வரவிருக்கும் அட்டவணை மற்றும் புகார் அளிக்கும் வழி." },
      activity: { eyebrow: "நம்பிக்கை & இணக்கம்", title: "செயல்பாட்டு பதிவு", description: "நிறுவனத்தில் யார் என்ன செய்தார்கள் என்பதன் தொடர் பதிவு." },
      settings: { eyebrow: "கட்டமைப்பு", title: "அமைப்புகள்", description: "உண்மையான AI வழங்குநரை இணைக்கவும், இந்த சாதனத்திற்கான குறியாக்கத்தை அமைக்கவும்." },
    },
  },
  bn: {
    nav: {
      dashboard: "ড্যাশবোর্ড", cases: "মামলা", clients: "মক্কেল", onboarding: "নথিভুক্তি",
      calendar: "ক্যালেন্ডার", courtSync: "ইকোর্টস সিঙ্ক", voiceIntake: "ভয়েস ইনটেক",
      research: "গবেষণা ও শব্দকোষ", billing: "সময় ও বিলিং", assistant: "এআই সহায়ক",
      portal: "ক্লায়েন্ট পোর্টাল", activity: "কার্যকলাপ লগ", settings: "সেটিংস",
    },
    common: {
      loading: "লোড হচ্ছে…", save: "সংরক্ষণ করুন", cancel: "বাতিল করুন", continue: "চালিয়ে যান", back: "ফিরে যান",
      search: "অনুসন্ধান করুন", demoNotice: "ডেমো সংস্করণ — একটি প্রকৃত এআই প্রদানকারী সংযুক্ত করতে এআই সহায়ক ও সেটিংস দেখুন।",
    },
    lock: {
      title: "আপনার পিন লিখুন", subtitle: "আপনার মামলার তথ্য এনক্রিপ্ট করা আছে। এই ডিভাইসটি আনলক করতে আপনার পিন লিখুন।",
      pinPlaceholder: "পিন", unlock: "আনলক করুন", unlocking: "আনলক হচ্ছে…",
    },
    status: {
      open: "খোলা", pending_filing: "দাখিল মুলতুবি", in_court: "আদালতে", closed: "বন্ধ",
      intake: "নথিভুক্তি", conflict_check: "স্বার্থদ্বন্দ্ব যাচাই", kyc: "কেওয়াইসি মুলতুবি", engagement: "চুক্তি মুলতুবি", active: "সক্রিয়",
    },
    pages: {
      dashboard: { eyebrow: "সারসংক্ষেপ", title: "শুভ সকাল, আইনজীবী", description: "আজ আপনার কার্যালয়ে এগুলোর দিকে নজর দেওয়া প্রয়োজন।" },
      cases: { eyebrow: "মামলা", title: "মামলা", description: "এআই-শনাক্ত ধারা ও দাখিলের অবস্থাসহ সমস্ত খোলা ও বন্ধ মামলা।" },
      clients: { eyebrow: "মক্কেল", title: "মক্কেল", description: "নথিভুক্তি থেকে প্রাপ্ত স্বার্থদ্বন্দ্ব যাচাই ও কেওয়াইসি অবস্থাসহ মক্কেলের রেকর্ড।" },
      onboarding: { eyebrow: "মক্কেল নথিভুক্তি", title: "নতুন মক্কেল নথিভুক্তি", description: "স্বার্থদ্বন্দ্ব যাচাই, কেওয়াইসি ও চুক্তির ধাপে ধাপে প্রক্রিয়া।" },
      calendar: { eyebrow: "সময়সূচি", title: "ক্যালেন্ডার", description: "শুনানি, বৈঠক ও সময়সীমা নির্ধারণ করুন। সহায়ক দ্বন্দ্ব চিহ্নিত করে ও ফাঁকা সময় প্রস্তাব করে।" },
      courtSync: { eyebrow: "সংযোগ", title: "ইকোর্টস কজ-লিস্ট সিঙ্ক", description: "ইকোর্টস থেকে পরবর্তী কজ লিস্ট এনে মামলা নম্বর দিয়ে খোলা মামলার সাথে মেলায়।" },
      voiceIntake: { eyebrow: "নথিভুক্তি", title: "ভয়েস কেস তৈরি", description: "নতুন মামলা বলে নথিভুক্ত করুন — ট্রান্সক্রিপ্ট পর্যালোচনার জন্য একটি খসড়ায় রূপান্তরিত হয়।" },
      research: { eyebrow: "গবেষণা", title: "এআই আইনি গবেষণা ও শব্দকোষ", description: "মামলার আইন ও আইনি শব্দ অনুসন্ধান করুন, এবং তথ্যসূত্র মামলায় সংরক্ষণ করুন।" },
      billing: { eyebrow: "বিলিং", title: "সময় ও বিলিং", description: "বিলযোগ্য সময় লগ করুন, বকেয়া ট্র্যাক করুন, এবং চালান তৈরি করুন।" },
      assistant: { eyebrow: "আইনি এআই সহায়ক", title: "যেকোনো কিছু জিজ্ঞাসা করুন", description: "একটি সাধারণ আইনি সহায়ক — সংযুক্ত থাকলে প্রকৃত মডেল দ্বারা চালিত।" },
      portal: { eyebrow: "মক্কেল-মুখী", title: "ক্লায়েন্ট পোর্টাল", description: "মক্কেল যা দেখেন: তাদের আসন্ন সময়সূচি এবং অভিযোগ জানানোর উপায়।" },
      activity: { eyebrow: "বিশ্বাস ও সম্মতি", title: "কার্যকলাপ লগ", description: "কার্যালয়ে কে কী করেছে তার একটি ধারাবাহিক রেকর্ড।" },
      settings: { eyebrow: "কনফিগারেশন", title: "সেটিংস", description: "একটি প্রকৃত এআই প্রদানকারী সংযুক্ত করুন, এবং এই ডিভাইসের জন্য এনক্রিপশন সেট করুন।" },
    },
  },
};
