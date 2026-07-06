import React, { useState } from "react";
import { 
  Briefcase, 
  Coins, 
  Search, 
  ShieldAlert, 
  CheckCircle, 
  ExternalLink,
  Sparkles,
  Loader2,
  Clock,
  Wrench,
  BookOpen,
  Bookmark,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { UserProfile } from "../types";

interface GigItem {
  name: string;
  earnings: string;
  commitment: string;
  description: string;
  skills: string[];
  applyLink: string;
  categories: string[];
  minClass: string;
  popularLabel?: string;
  whySecret?: string;
  mobileRoadmap?: string[];
  paymentSolution?: string;
  realityCheck?: string;
}

const DEFAULT_GIGS: GigItem[] = [
  {
    name: "AI Sticker Designer & Seller on Redbubble",
    earnings: "₹4,000 - ₹15,000 / month (Passive royalty income)",
    commitment: "Flexible (1 hour/day on mobile/laptop)",
    description: "Generate beautiful aesthetic, anime, or quote stickers using free AI tools (like Bing Image Creator or Leonardo.ai) and upload them to Redbubble to earn royalties automatically when people buy them.",
    skills: ["Free AI prompt generation", "Aesthetic layout creation", "Basic search tag research"],
    applyLink: "https://www.redbubble.com/about/selling",
    categories: ["Arts", "Others", "General"],
    minClass: "10",
    popularLabel: "💎 Ultimate Secret Hack",
    whySecret: "Mainstream sellers manually design for hours, but you can use free AI tools on your smartphone to generate 20+ viral-style aesthetic stickers (like cute cats, programming jokes, or motivational study quotes) in 10 minutes. Redbubble handles printing, shipping, and payments completely, giving you pure passive income.",
    mobileRoadmap: [
      "Leonardo.ai ya Bing Image Creator (free AI tools) mobile par open karke cute stickers ya trendy designs generate karein (e.g. 'cute cat drinking boba sticker, vector, white background').",
      "Photoroom web tool se image ka background 1-second me transparent karke HD quality me save karein.",
      "Redbubble artist signup page par register karein aur apna custom design store setup karein.",
      "Trending tags (like #anime, #studygram) ke sath design upload karein aur passive monthly income receive karein."
    ],
    paymentSolution: "Direct monthly payment to your bank account via PayPal link. Pure passive income once designs are uploaded.",
    realityCheck: "Initial designs might take time to get noticed. Uploading 30-50 high-quality trendy stickers increases your chances of consistent sales dramatically!"
  },
  {
    name: "Pinterest Niche Traffic Curator & Affiliate Marketer",
    earnings: "₹5,000 - ₹20,000 / month (Passive affiliate commissions)",
    commitment: "Flexible (30-45 mins/day)",
    description: "Create visual ideas, aesthetic boards, or motivational prints on Pinterest using free Canva templates and link them to reputable Indian affiliate programs (like Amazon Associates or EarnKaro).",
    skills: ["Canva image selection", "Affiliate product curation", "Pinterest SEO"],
    applyLink: "https://www.pinterest.com/",
    categories: ["Commerce", "Others", "General"],
    minClass: "11",
    popularLabel: "💸 Passive Money Glitch",
    whySecret: "Most people spam WhatsApp groups, but Pinterest is a massive visual search engine where millions search for outfits, study notes, or home decor. By posting aesthetic pins with your affiliate links, your pins keep driving traffic and sales for years without any active effort.",
    mobileRoadmap: [
      "EarnKaro ya Amazon Associates program par free account banakar high-demand lifestyle/study products select karein.",
      "Canva app open karke beautiful aesthetic pins (photos with smart text overlays) design karein.",
      "Pinterest Business Account signup karke setup karein aur daily 2-3 high-quality pins publish karein.",
      "Pin description me apna affiliate link insert karein taaki jab bhi koi shop kare, aapko direct commission mile."
    ],
    paymentSolution: "Direct bank account transfer (NEFT/UPI) from EarnKaro or Amazon India Associates panel once earnings reach ₹250.",
    realityCheck: "Requires patience to build initial organic reach. Consistency in pinning daily for 2-3 weeks is key to driving thousands of free visits."
  },
  {
    name: "AI Stock Image Contributor on Shutterstock",
    earnings: "₹3,000 - ₹12,000 / month (Royalty per download)",
    commitment: "Flexible (1 hour/day on smartphone)",
    description: "Generate beautiful high-resolution landscape backgrounds, abstract office textures, or realistic vector icons using free AI image generators and submit them to Shutterstock's Contributor portal.",
    skills: ["AI text-to-image prompt writing", "Stock photography guidelines", "Image tag research"],
    applyLink: "https://submit.shutterstock.com/",
    categories: ["Arts", "Others", "General"],
    minClass: "10",
    popularLabel: "✨ Global Royalty Hack",
    whySecret: "Global marketing agencies constantly buy background graphics, textures, and vector concepts on Shutterstock. Instead of holding an expensive camera, you can use advanced free AI generators on your phone to create stunning stock graphics and earn royalties globally!",
    mobileRoadmap: [
      "Shutterstock Contributor website par free registration karein aur profile setup karein.",
      "Free mobile AI tools (jaise Copilot ya Adobe Firefly) se beautiful abstract textures ya office wallpaper designs generate karein.",
      "Check karein ki dimensions standard high-resolution (4MP+) ho, aur clean output maintain ho.",
      "Shutterstock board par relevant tags aur title ke sath images upload karein aur har download par royalty kamayein."
    ],
    paymentSolution: "Paid monthly via PayPal or Payoneer directly into your linked Indian Bank Account. Global royalty income!",
    realityCheck: "Images must pass Shutterstock's quality check. Avoid uploading blurry images or trademarked icons to ensure fast approval."
  },
  {
    name: "Carrd One-Page Mobile Web Designer for Shops",
    earnings: "₹4,000 - ₹10,000 per website design",
    commitment: "Flexible (2-3 hours per project)",
    description: "Design elegant, high-converting one-page portfolio websites or digital menus for local cafes, coaching institutes, and boutiques using the free Carrd.co platform on your mobile or PC.",
    skills: ["Carrd.co interface", "Basic layout copywriting", "Client communication"],
    applyLink: "https://carrd.co/",
    categories: ["Arts", "Commerce", "Others", "General"],
    minClass: "10",
    popularLabel: "⚡ High-Yield Agency Hack",
    whySecret: "Local businesses (home-bakers, boutiques, tuition teachers) want a modern online presence but find agency web development too expensive. You can build a stunning, fully-functional 1-page website using ready-made Carrd templates in 30 minutes on your phone and charge ₹1500 to ₹5000 per client!",
    mobileRoadmap: [
      "Carrd.co par free profile register karein aur unke slick, mobile-responsive layouts customize karna seekhein.",
      "Local Instagram-based small businesses ya coaching centers ko approach karke modern website portfolio design provide karne ka pitch karein.",
      "Client ki custom requirements (photos, operational timing, UPI qr, location links) collect karein.",
      "Website build karein aur standard custom domain redirect add karke complete transfer setup karein."
    ],
    paymentSolution: "Get paid 50% advance and 50% post-delivery directly via GPay, Paytm, or UPI transfer from the business owner.",
    realityCheck: "Most local owners don't realize how simple and cheap web design is. Your visual design and pitch are everything!"
  },
  {
    name: "Notion Custom Template Maker & Gumroad Seller",
    earnings: "₹5,000 - ₹25,000 / month (Product royalty)",
    commitment: "Flexible (1-2 hours/day)",
    description: "Create highly organized, aesthetic Notion workspaces, exam trackers, bullet journals, or study planners and list them on free digital shelves like Gumroad or Twitter.",
    skills: ["Notion databases and layouts", "Aesthetic design coordination", "Social media distribution"],
    applyLink: "https://www.notion.so/",
    categories: ["PCM", "PCB", "Commerce", "Arts", "Others", "General"],
    minClass: "11",
    popularLabel: "🧠 Elite Brain-Asset Hack",
    whySecret: "Gen Z students and working professionals are obsessed with aesthetic productivity, but they don't want to design complex Notion trackers from scratch. One highly polished study planner can sell thousands of copies passively for years on Gumroad as a free digital download with optional tips!",
    mobileRoadmap: [
      "Notion web or mobile app download karke custom aesthetic dashboard build karna seekhein (e.g. daily syllabus planner, water tracker, study streak board).",
      "Template sharing link generate karein aur dynamic thumbnail covers design karein Canva use karke.",
      "Gumroad.com par free account banakar template price setup karein (keep it free with pay-what-you-want option, or low cost like ₹49/₹99).",
      "Pinterest, WhatsApp groups, ya student Reddit threads par aesthetic screen-grabs post karke link promote karein."
    ],
    paymentSolution: "Gumroad processes international and domestic student card/UPI payments and transfers payouts directly to your linked bank account.",
    realityCheck: "Aesthetic appeal matters! High-quality mockups and active distribution on student forums guarantee continuous sales."
  },
  {
    name: "AI Local Dialect Voice Recording on Karya App",
    earnings: "₹3,000 - ₹8,000 / month (Based on task approval)",
    commitment: "Flexible (1 hour/day on smartphone)",
    description: "Read and record simple sentences on screen in your native Indian regional language (Bhojpuri, Maithili, Hindi, Tamil, etc.) to train localized LLM translation models.",
    skills: ["Native regional language fluency", "Clear pronunciation", "A quiet room for recording"],
    applyLink: "https://www.karya.in/",
    categories: ["Arts", "Others", "General"],
    minClass: "10",
    popularLabel: "🔥 Best 2026 Mobile Gig",
    whySecret: "Large AI corporations are spending billions to make LLMs understand regional Indian accents, but they recruit via quiet crowd-work portals. Most students are busy searching 'data entry' on Google and miss these high-paying, direct-transfer tasks.",
    mobileRoadmap: [
      "Karya app play store se directly download karein aur native language select karein.",
      "Profile verify karne ke liye 1-minute ka demo recording sample submit karein.",
      "Task board se active voice reading and labeling projects select karein.",
      "Sentence reading complete karke instant approve hone ka wait karein."
    ],
    paymentSolution: "Direct Bank account or UPI transfer (IMPS/NEFT) integrated right inside the Karya app — withdraw anytime!",
    realityCheck: "Earning totally depends on task volume. Make sure to record in a quiet room with zero background fan noise for fast approval!"
  },
  {
    name: "Local Google Maps Business Profiler & Optimizer",
    earnings: "₹500 - ₹1,200 per local business optimization",
    commitment: "Flexible (1-2 hours / client, WFH/Local)",
    description: "Help unmapped local shops, boutiques, and cafes in your city set up and optimize their Google Business Profiles with high-quality photos and accurate operational hours.",
    skills: ["Google Maps app usage", "Smartphone photography", "Basic conversational skills"],
    applyLink: "https://www.google.com/business/",
    categories: ["Commerce", "Others", "General"],
    minClass: "10",
    popularLabel: "✨ Zero Investment Local Gig",
    whySecret: "Local Indian shops lose 30%+ of walk-in customers because they are unlisted or have incorrect numbers on maps. They will happily pay ₹500 to a student who sets up their official map listing and takes nice pictures of their storefront.",
    mobileRoadmap: [
      "Apne locality ke unlisted ya incorrect timings wale shops ko identify karein.",
      "Shop owner ko map listing ke benefits explain karke simple pitch karein.",
      "Google Business Profile app download karke shop details, photos aur timings update karein.",
      "Listing verification code submit karein aur owner ko map management handover karein."
    ],
    paymentSolution: "Direct payment to your personal UPI (Paytm/GPay/PhonePe) by the shop owner once their listing is live on maps.",
    realityCheck: "Easy to start, zero capital. Pitching to 5 shop owners usually gets 1-2 clients. Requires basic communication."
  },
  {
    name: "Faceless Instagram Reels Creator for Local Boutiques",
    earnings: "₹4,000 - ₹10,000 / month per client business",
    commitment: "Flexible (1-2 hours/day remote)",
    description: "Edit and post attractive product reels and aesthetic slide video collections on Instagram for local boutiques, bakeries, or shoe shops using free CapCut templates on your phone.",
    skills: ["CapCut or InShot editing", "Basic Instagram Reels trends"],
    applyLink: "https://internshala.com/internships/part-time-work-from-home-social-media-marketing-internships/",
    categories: ["Arts", "Others", "General"],
    minClass: "11",
    popularLabel: "🔥 Emerging 2026 Trend",
    whySecret: "Small boutique and local shop owners want to leverage Instagram Reels to go viral but have zero time or video editing skills. No competitor goes shop-to-shop digitally. You don't need to visit; they send product photos, you edit them on CapCut on your phone!",
    mobileRoadmap: [
      "CapCut or InShot photo template transitions video-making seekhein.",
      "Local bakeries ya dress boutiques ke Instagram accounts find karke unhe DM karein.",
      "Unke product images curate karke 3 modern free reels demo bana kar bhejein.",
      "Monthly package (e.g. ₹4000 for 12 Reels) agree karein aur reels manage karna shuru karein."
    ],
    paymentSolution: "Direct client payment to your GPay / PhonePe / UPI ID, or bank transfer.",
    realityCheck: "Requires a good aesthetic sense and regular posting. Getting your first client is the hardest step, but 1 client leads to more!"
  },
  {
    name: "Canva Social Media Designer on Internshala",
    earnings: "₹4,000 - ₹8,000 / month (Part-time stipend)",
    commitment: "2-3 hours/day (Work From Home)",
    description: "Design attractive social media graphics, templates, and basic posters for Indian startups and boutiques using ready-made Canva elements & templates.",
    skills: ["Canva design", "Basic creative layout sense"],
    applyLink: "https://internshala.com/internships/part-time-work-from-home-graphic-design-internships/",
    categories: ["Arts", "Others", "General"],
    minClass: "10",
    popularLabel: "Highly Creative",
    whySecret: "Local agencies are flooded with client work, but startups don't need expert Adobe designers — they just need simple, clean designs made inside 10 minutes using standard Canva templates on mobile.",
    mobileRoadmap: [
      "Canva app mobile me download karein aur standard templates edit karna sikhein.",
      "Apna custom portfolio (e.g. 5 sample posts) ready karke simple Link sharing share karein.",
      "Internshala par profile register karke 'Part-time graphic design' internships me apply karein.",
      "Selection interview call milte hi apna Canva live link portfolio share karein."
    ],
    paymentSolution: "Paid monthly via direct bank transfer or GPay/PhonePe linked to your Indian phone number.",
    realityCheck: "Stipend range is strict. Needs 2 hours daily of smartphone layouts crafting. Highly secure."
  },
  {
    name: "Audio-to-Text Transcriptionist on Scribie",
    earnings: "₹350 - ₹1,200 per audio hour",
    commitment: "Flexible, no minimum target",
    description: "Listen to clean recorded audio files (conversations, speeches, or interviews) and accurately type them down into clear text format.",
    skills: ["Good English listening", "Clean and fast computerized typing"],
    applyLink: "https://scribie.com/freelance-transcription",
    categories: ["Arts", "Others", "General"],
    minClass: "10",
    popularLabel: "Best for Focus & Typing",
    whySecret: "Global corporations record hours of research but cannot use AI auto-captioning because of thick local accents. They pay humans per audio minute to ensure accuracy.",
    mobileRoadmap: [
      "Scribie.com par freelancer account link register karein.",
      "Mobile screen aur earphone use karke online audio transcription test complete karein.",
      "Low-difficulty short audio clips (1-3 minutes) se start karein.",
      "Scribie automatic proofing platform se correction check karke submit karein."
    ],
    paymentSolution: "PayPal transfer linked inside Scribie dashboard, which triggers automatic zero-fee sweep to Indian Bank accounts next business morning.",
    realityCheck: "₹3,000 - ₹7,000 / month. Requires extreme silence, concentration, and good audio parsing ability."
  },
  {
    name: "AI-Powered Local Web Developer (AI Website Builder)",
    earnings: "₹15,000 - ₹45,000 / month (Based on 1-3 local client projects)",
    commitment: "Flexible (2-4 hours/day)",
    description: "Build modern, highly professional websites, digital menus, or catalog applications for local restaurants, dhabas, hotels, clinics, and stores using advanced free/trial AI web builders (like v0.dev, Bolt.new, or Wix ADI) without any complex coding experience.",
    skills: ["AI web prompt engineering", "v0.dev / Bolt.new interface", "Local client negotiation & pitching"],
    applyLink: "https://v0.dev/",
    categories: ["Commerce", "General", "Others"],
    minClass: "10",
    popularLabel: "🔥 High-Earning AI Gig",
    whySecret: "Thousands of local dhabas, family restaurants, clinics, hotels, and retail stores in your area have absolutely zero web presence or outdated map listings. Custom coding usually takes software agencies weeks and costs ₹30,000+, but using cutting-edge AI website builders on your laptop/mobile, you can generate a complete, stunning, mobile-responsive custom website or booking page in less than 2 hours! You can easily pitch and charge local business owners ₹10,000 to ₹20,000 per site.",
    mobileRoadmap: [
      "Apne aas-paas ke local restaurants, dhabas, clinics, hotels, ya stores ko select karein jinka internet par koi website nahi hai ya details galat hain.",
      "Business owner se milkar politely batayein ki ek customized digital menu aur website se unki customer reach aur monthly sales 30% badh sakti hain.",
      "v0.dev ya Bolt.new jaise modern free AI generators open karke client ki business theme ke hisab se ek basic visual website structure generate karein (e.g. 'Create a modern mobile-first vegetarian restaurant website with online menu and WhatsApp booking').",
      "AI dwara bane code/page me restaurant ke exact items, price list, contact number, aur direct pay-via-UPI QR code scan button load karein, aur use free platform jaise Netlify or Vercel par live karke link client ko dikhayein."
    ],
    paymentSolution: "Take a 40% advance token money before starting the development, and receive the remaining 60% balance via UPI (GPay/Paytm/PhonePe) immediately when you deliver the live working website link to the owner.",
    realityCheck: "Owner ko direct technology ya coding se koi lena-dena nahi hota. Unhe attractive visual layout, accurate prices aur setup complete milna chahiye. Agar aap unke menu card ke real photos click karke pehle se ek demo design dikhayenge, toh deal lock karne ka chance 5 guna badh jata hai!"
  }
];

const LOCALIZED_FIELD_MAP: Record<string, Record<'en' | 'hi' | 'hinglish', Partial<GigItem>>> = {
  "AI Sticker Designer & Seller on Redbubble": {
    hinglish: {},
    en: {
      name: "AI Sticker Designer & Seller on Redbubble",
      earnings: "₹4,000 - ₹15,000 / month (Passive royalty income)",
      commitment: "Flexible (1 hour/day on mobile/laptop)",
      description: "Generate beautiful aesthetic, anime, or quote stickers using free AI tools (like Bing Image Creator or Leonardo.ai) and upload them to Redbubble to earn royalties automatically when people buy them.",
      skills: ["Free AI prompt generation", "Aesthetic layout creation", "Basic search tag research"],
      whySecret: "Mainstream sellers manually design for hours, but you can use free AI tools on your smartphone to generate 20+ viral-style aesthetic stickers (like cute cats, programming jokes, or motivational study quotes) in 10 minutes. Redbubble handles printing, shipping, and payments completely, giving you pure passive income.",
      mobileRoadmap: [
        "Open Leonardo.ai or Bing Image Creator on your mobile and generate cute stickers or trendy designs (e.g. 'cute cat drinking boba sticker, vector, white background').",
        "Use Photoroom web tool to make the image background transparent and save it in HD quality.",
        "Register on the Redbubble artist signup page and set up your custom store.",
        "Upload with trending tags (like #anime, #studygram) and receive passive monthly royalties."
      ],
      paymentSolution: "Direct monthly payment to your bank account via PayPal link. Pure passive income once uploaded.",
      realityCheck: "Initial designs might take time to get noticed. Uploading 30-50 high-quality trendy stickers increases your chances of consistent sales dramatically!"
    },
    hi: {
      name: "एआई स्टिकर डिजाइनर और रेडबबल सेलर",
      earnings: "₹4,000 - ₹15,000 / महीना (निष्क्रिय रॉयल्टी आय)",
      commitment: "लचीला (मोबाइल/लपटॉप पर रोजाना 1 घंटा)",
      description: "मुफ्त एआई टूल्स (जैसे बिंग इमेज क्रिएटर या लियोनार्डो एआई) का उपयोग करके सुंदर कलात्मक, एनीमे या कोट्स स्टिकर बनाएं और स्वचालित रूप से रॉयल्टी कमाने के लिए उन्हें रेडबबल पर अपलोड करें।",
      skills: ["मुफ्त एआई प्रॉम्ट जनरेशन", "कलात्मक लेआउट निर्माण", "बुनियादी सर्च टैग रिसर्च"],
      whySecret: "मुख्यधारा के विक्रेता घंटों तक मैन्युअल रूप से डिज़ाइन करते हैं, लेकिन आप केवल 10 मिनट में 20+ वायरल-शैली के सुंदर स्टिकर बनाने के लिए अपने स्मार्टफोन पर मुफ्त एआई टूल का उपयोग कर सकते हैं। रेडबबल प्रिंटिंग, शिपिंग और भुगतान को पूरी तरह से संभालता है, जिससे आपको निष्क्रिय आय मिलती है।",
      mobileRoadmap: [
        "अपने मोबाइल पर Leonardo.ai या Bing Image Creator खोलें और सुंदर स्टिकर या ट्रेंडी डिज़ाइन बनाएं (जैसे 'cute cat drinking boba sticker, vector, white background')।",
        "फ़ोटोरूम वेब टूल का उपयोग करके छवि की पृष्ठभूमि को पारदर्शी बनाएं और इसे एचडी गुणवत्ता में सहेजें।",
        "रेडबबल आर्टिस्ट साइनअप पेज पर पंजीकरण करें और अपना कस्टम स्टोर सेट करें।",
        "ट्रेंडी टैग (जैसे #anime, #studygram) के साथ अपलोड करें और मासिक निष्क्रिय रॉयल्टी प्राप्त करें।"
      ],
      paymentSolution: "पेपैल लिंक के माध्यम से सीधे आपके बैंक खाते में मासिक भुगतान। डिज़ाइन अपलोड होने के बाद पूरी तरह से निष्क्रिय आय।",
      realityCheck: "शुरुआती डिज़ाइनों पर ध्यान जाने में समय लग सकता है। 30-50 उच्च-गुणवत्ता वाले ट्रेंडी स्टिकर अपलोड करने से आपकी लगातार बिक्री की संभावना बढ़ जाती है!"
    }
  },
  "Pinterest Niche Traffic Curator & Affiliate Marketer": {
    hinglish: {},
    en: {
      name: "Pinterest Niche Traffic Curator & Affiliate Marketer",
      earnings: "₹5,000 - ₹20,000 / month (Passive affiliate commissions)",
      commitment: "Flexible (30-45 mins/day)",
      description: "Create visual ideas, aesthetic boards, or motivational prints on Pinterest using free Canva templates and link them to reputable Indian affiliate programs (like Amazon Associates or EarnKaro).",
      skills: ["Canva image selection", "Affiliate product curation", "Pinterest SEO"],
      whySecret: "Most people spam WhatsApp groups, but Pinterest is a massive visual search engine where millions search for outfits, study notes, or home decor. By posting aesthetic pins with your affiliate links, your pins keep driving traffic and sales for years without any active effort.",
      mobileRoadmap: [
        "Create a free account on EarnKaro or Amazon Associates and select high-demand lifestyle/study products.",
        "Open Canva app and design beautiful aesthetic pins with smart text overlays.",
        "Sign up for a Pinterest Business Account and publish 2-3 high-quality pins daily.",
        "Insert your affiliate link in the Pin description so you get direct commission when someone shops."
      ],
      paymentSolution: "Direct bank account transfer (NEFT/UPI) from EarnKaro or Amazon India Associates once earnings reach ₹250.",
      realityCheck: "Requires patience to build initial organic reach. Consistency in pinning daily for 2-3 weeks is key to driving thousands of free visits."
    },
    hi: {
      name: "पिंटरेस्ट नीश ट्रैफिक क्यूरेटर और एफिलिएट मार्केटर",
      earnings: "₹5,000 - ₹20,000 / महीना (निष्क्रिय एफिलिएट कमीशन)",
      commitment: "लचीला (30-45 मिनट/दिन)",
      description: "मुफ्त कैनवा टेम्प्लेट का उपयोग करके पिंटरेस्ट पर विज़ुअल विचार, सुंदर बोर्ड या प्रेरक चित्र बनाएं और उन्हें भारत के प्रतिष्ठित एफिलिएट कार्यक्रमों (जैसे अमेज़ॅन एसोसिएट्स या अर्नकरो) से लिंक करें।",
      skills: ["कैनवा छवि चयन", "एफिलिएट उत्पाद क्यूरेशन", "पिंटरेस्ट एसईओ"],
      whySecret: "ज्यादातर लोग व्हाट्सएप ग्रुपों में स्पैम करते हैं, लेकिन पिंटरेस्ट एक बड़ा विज़ुअल सर्च इंजन है जहां लाखों लोग कपड़े, स्टडी नोट्स या घरेलू सजावट की खोज करते हैं। अपने एफिलिएट लिंक के साथ सुंदर पिन पोस्ट करके, आपके पिन बिना किसी सक्रिय प्रयास के सालों तक ट्रैफ़िक और बिक्री लाते रहते हैं।",
      mobileRoadmap: [
        "EarnKaro या Amazon Associates प्रोग्राम पर एक मुफ्त खाता बनाएं और उच्च-मांग वाले लाइफस्टाइल/स्टडी उत्पाद चुनें।",
        "कैनवा ऐप खोलें और आकर्षक टेक्स्ट ओवरले के साथ सुंदर पिन डिज़ाइन करें।",
        "पिंटरेस्ट बिजनेस अकाउंट पर साइन अप करें और दैनिक 2-3 उच्च-गुणवत्ता वाले पिन प्रकाशित करें।",
        "पिन विवरण में अपना एफिलिएट लिंक डालें ताकि जब भी कोई खरीदारी करे, आपको सीधा कमीशन मिले।"
      ],
      paymentSolution: "कमाई ₹250 तक पहुंचने पर अर्नकरो या अमेज़न इंडिया एसोसिएट्स पैनल से सीधे बैंक खाते में ट्रांसफर (NEFT/UPI)।",
      realityCheck: "प्रारंभिक जैविक पहुंच बनाने के लिए धैर्य की आवश्यकता होती है। हजारों मुफ्त विज़िट प्राप्त करने के लिए रोजाना 2-3 सप्ताह तक लगातार पिन करना सबसे महत्वपूर्ण है।"
    }
  },
  "AI Stock Image Contributor on Shutterstock": {
    hinglish: {},
    en: {
      name: "AI Stock Image Contributor on Shutterstock",
      earnings: "₹3,000 - ₹12,000 / month (Royalty per download)",
      commitment: "Flexible (1 hour/day on smartphone)",
      description: "Generate beautiful high-resolution landscape backgrounds, abstract office textures, or realistic vector icons using free AI image generators and submit them to Shutterstock's Contributor portal.",
      skills: ["AI text-to-image prompt writing", "Stock photography guidelines", "Image tag research"],
      whySecret: "Global marketing agencies constantly buy background graphics, textures, and vector concepts on Shutterstock. Instead of holding an expensive camera, you can use advanced free AI generators on your phone to create stunning stock graphics and earn royalties globally!",
      mobileRoadmap: [
        "Register for free on the Shutterstock Contributor website and set up your profile.",
        "Use free mobile AI tools like Copilot or Adobe Firefly to generate beautiful abstract textures or office backgrounds.",
        "Ensure the dimensions are standard high-resolution (4MP+) and maintain clean output.",
        "Upload images on Shutterstock with relevant tags and titles to earn royalty on every download."
      ],
      paymentSolution: "Paid monthly via PayPal or Payoneer directly into your linked Indian Bank Account. Global royalty income!",
      realityCheck: "Images must pass Shutterstock's quality check. Avoid uploading blurry images or trademarked icons to ensure fast approval."
    },
    hi: {
      name: "शटरस्टॉक पर एआई स्टॉक इमेज कंट्रीब्यूटर",
      earnings: "₹3,000 - ₹12,000 / महीना (प्रति डाउनलोड रॉयल्टी)",
      commitment: "लचीला (स्मार्टफोन पर रोजाना 1 घंटा)",
      description: "मुफ्त एआई इमेज जनरेटर का उपयोग करके सुंदर उच्च-रिज़ॉल्यूशन परिदृश्य पृष्ठभूमि, अमूर्त कार्यालय बनावट, या यथार्थवादी वेक्टर आइकन बनाएं और उन्हें शटरस्टॉक के कंट्रीब्यूटर पोर्टल पर सबमिट करें।",
      skills: ["एआई टेक्स्ट-टू-इमेज प्रॉम्ट राइटिंग", "स्टॉक फोटोग्राफी दिशानिर्देश", "छवि टैग अनुसंधान"],
      whySecret: "वैश्विक विपणन एजेंसियां शटरस्टॉक पर पृष्ठभूमि ग्राफिक्स, बनावट और वेक्टर अवधारणाएं लगातार खरीदती हैं। महंगे कैमरे के बजाय, आप शानदार स्टॉक ग्राफिक्स बनाने और वैश्विक रॉयल्टी कमाने के लिए अपने फोन पर मुफ्त एआई जनरेटर का उपयोग कर सकते हैं!",
      mobileRoadmap: [
        "शटरस्टॉक कंट्रीब्यूटर वेबसाइट पर मुफ्त पंजीकरण करें और अपनी प्रोफाइल सेट करें।",
        "सुंदर अमूर्त बनावट या कार्यालय पृष्ठभूमि डिजाइन उत्पन्न करने के लिए कोपायलट या एडोब फायरफ्लाई जैसे मुफ्त मोबाइल एआई टूल का उपयोग करें।",
        "सुनिश्चित करें कि आयाम मानक उच्च-रिज़ॉल्यूशन (4MP+) के हों और साफ आउटपुट बनाए रखें।",
        "हर डाउनलोड पर रॉयल्टी अर्जित करने के लिए प्रासंगिक टैग और शीर्षक के साथ शटरस्टॉक पर चित्र अपलोड करें।"
      ],
      paymentSolution: "पेपैल या पेयोनियर के माध्यम से सीधे आपके लिंक्ड भारतीय बैंक खाते में मासिक भुगतान। वैश्विक रॉयल्टी आय!",
      realityCheck: "चित्रों को शटरस्टॉक के गुणवत्ता परीक्षण को पास करना होगा। त्वरित मंजूरी सुनिश्चित करने के लिए धुंधली तस्वीरें या ट्रेडमार्क वाले आइकन अपलोड करने से बचें।"
    }
  },
  "Carrd One-Page Mobile Web Designer for Shops": {
    hinglish: {},
    en: {
      name: "Carrd One-Page Mobile Web Designer for Shops",
      earnings: "₹4,000 - ₹10,000 per website design",
      commitment: "Flexible (2-3 hours per project)",
      description: "Design elegant, high-converting one-page portfolio websites or digital menus for local cafes, coaching institutes, and boutiques using the free Carrd.co platform on your mobile or PC.",
      skills: ["Carrd.co interface", "Basic layout copywriting", "Client communication"],
      whySecret: "Local businesses (home-bakers, boutiques, tuition teachers) want a modern online presence but find agency web development too expensive. You can build a stunning, fully-functional 1-page website using ready-made Carrd templates in 30 minutes on your phone and charge ₹1500 to ₹5000 per client!",
      mobileRoadmap: [
        "Register a free profile on Carrd.co and learn to customize their slick, mobile-responsive layouts.",
        "Approach local Instagram-based small businesses or coaching centers with a pitch to provide modern website portfolio design.",
        "Collect client's custom requirements (photos, operational hours, UPI QR code, location links).",
        "Build the website and set up standard custom domain redirects to complete the transfer setup."
      ],
      paymentSolution: "Get paid 50% advance and 50% post-delivery directly via GPay, Paytm, or UPI transfer from the business owner.",
      realityCheck: "Most local owners don't realize how simple and cheap web design is. Your visual design and pitch are everything!"
    },
    hi: {
      name: "दुकानों के लिए कार्ड (Carrd) वन-पेज मोबाइल वेब डिजाइनर",
      earnings: "₹4,000 - ₹10,000 प्रति वेबसाइट डिज़ाइन",
      commitment: "लचीला (प्रति प्रोजेक्ट 2-3 घंटे)",
      description: "अपने मोबाइल या पीसी पर मुफ्त Carrd.co प्लेटफॉर्म का उपयोग करके स्थानीय कैफे, कोचिंग संस्थानों और बुटीक के लिए सुंदर पोर्टफोलियो वेबसाइट या डिजिटल मेनू डिज़ाइन करें।",
      skills: ["कैरड इंटरफ़ेस", "मूल लेआउट कॉपिराइटिंग", "ग्राहक संचार"],
      whySecret: "स्थानीय व्यवसाय (होम-बेकर्स, बुटीक, ट्यूशन शिक्षक) एक आधुनिक ऑनलाइन उपस्थिति चाहते हैं लेकिन उन्हें बड़ी एजेंसियों का वेब विकास बहुत महंगा लगता है। आप अपने फोन पर केवल 30 मिनट में तैयार कार्ड टेम्प्लेट का उपयोग करके एक शानदार वेबसाइट बना सकते हैं और प्रति क्लाइंट ₹1500 से ₹5000 तक चार्ज कर सकते हैं!",
      mobileRoadmap: [
        "Carrd.co पर एक मुफ्त प्रोफ़ाइल पंजीकृत करें और उनके सुंदर, मोबाइल-उत्तरदायी लेआउट को अनुकूलित करना सीखें।",
        "आधुनिक वेबसाइट पोर्टफोलियो डिज़ाइन प्रदान करने के लिए स्थानीय इंस्टाग्राम-आधारित छोटे व्यवसायों या कोचिंग सेंटरों से संपर्क करें।",
        "क्लाइंट की कस्टम ज़रूरतें (फ़ोटो, परिचालन घंटे, यूपीआई क्यूआर कोड, स्थान लिंक) एकत्र करें।",
        "वेबसाइट बनाएं और ट्रांसफर सेटअप पूरा करने के लिए मानक कस्टम डोमेन रीडायरेक्ट जोड़ें।"
      ],
      paymentSolution: "व्यवसाय के मालिक से सीधे GPay, Paytm, या UPI ट्रांसफर के माध्यम से 50% अग्रिम और 50% डिलीवरी के बाद भुगतान प्राप्त करें।",
      realityCheck: "अधिकांश स्थानीय मालिकों को यह नहीं पता होता है कि वेब डिज़ाइन कितना आसान और सस्ता है। आपका विज़ुअल डिज़ाइन और बात करने का तरीका ही सब कुछ है!"
    }
  },
  "Notion Custom Template Maker & Gumroad Seller": {
    hinglish: {},
    en: {
      name: "Notion Custom Template Maker & Gumroad Seller",
      earnings: "₹5,000 - ₹25,000 / month (Product royalty)",
      commitment: "Flexible (1-2 hours/day)",
      description: "Create highly organized, aesthetic Notion workspaces, exam trackers, bullet journals, or study planners and list them on free digital shelves like Gumroad.",
      skills: ["Notion databases and layouts", "Aesthetic design coordination", "Social media distribution"],
      whySecret: "Gen Z students and working professionals are obsessed with aesthetic productivity, but they don't want to design complex Notion trackers from scratch. One highly polished study planner can sell thousands of copies passively for years on Gumroad as a free digital download with optional tips!",
      mobileRoadmap: [
        "Download Notion web or mobile app and learn to build a custom aesthetic dashboard (e.g. daily syllabus planner, study streak board).",
        "Generate a template sharing link and design dynamic thumbnail covers using Canva.",
        "Create a free account on Gumroad.com and set up template pricing (keep it free with pay-what-you-want option, or low cost like ₹49/₹99).",
        "Post aesthetic screenshots on Pinterest, WhatsApp groups, or student Reddit threads to promote your link."
      ],
      paymentSolution: "Gumroad processes international and domestic student card/UPI payments and transfers payouts directly to your linked bank account.",
      realityCheck: "Aesthetic appeal matters! High-quality mockups and active distribution on student forums guarantee continuous sales."
    },
    hi: {
      name: "नोशन कस्टम टेम्प्लेट मेकर और गमरोड सेलर",
      earnings: "₹5,000 - ₹25,000 / महीना (उत्पाद रॉयल्टी)",
      commitment: "लचीला (रोजाना 1-2 घंटे)",
      description: "अत्यधिक व्यवस्थित, कलात्मक नोशन वर्कस्पेस, परीक्षा ट्रैकर, बुलेट जर्नल या अध्ययन योजनाकार बनाएं और उन्हें गमरोड जैसे मुफ्त डिजिटल स्टोर पर सूचीबद्ध करें।",
      skills: ["नोशन डेटाबेस और लेआउट", "कलात्मक डिजाइन समन्वय", "सोशल मीडिया प्रचार"],
      whySecret: "आज के छात्र और पेशेवर सुंदर उत्पादकता डैशबोर्ड के दीवाने हैं, लेकिन वे खुरदरे नोशन ट्रैकर्स को शुरू से डिजाइन नहीं करना चाहते। एक शानदार अध्ययन योजनाकार गमरोड पर वर्षों तक निष्क्रिय रूप से हजारों प्रतियों में बिक सकता है!",
      mobileRoadmap: [
        "नोशन वेब या मोबाइल ऐप डाउनलोड करें और एक कस्टम कलात्मक डैशबोर्ड बनाना सीखें (जैसे दैनिक सिलेबस योजनाकार, स्टडी स्ट्रीक बोर्ड)।",
        "टेम्प्लेट शेयरिंग लिंक जेनरेट करें और कैनवा का उपयोग करके थंबनेल कवर डिजाइन करें।",
        "Gumroad.com पर मुफ्त खाता बनाएं और कीमत तय करें (इसे भुगतान विकल्प के साथ मुफ्त रखें, या ₹49/₹99 जैसी कम कीमत रखें)।",
        "लिंक को बढ़ावा देने के लिए पिनटेरेस्ट, व्हाट्सएप ग्रुपों या छात्र रेडिट थ्रेड्स पर स्क्रीनशॉट पोस्ट करें।"
      ],
      paymentSolution: "गमरोड भारतीय और अंतर्राष्ट्रीय कार्ड/यूपीआई भुगतान संसाधित करता है और सीधे आपके लिंक्ड बैंक खाते में ट्रांसफर करता है।",
      realityCheck: "कलात्मक बनावट (लुक) बहुत मायने रखती है! उच्च-गुणवत्ता वाले मॉकअप और छात्र मंचों पर सक्रिय प्रचार निरंतर बिक्री की गारंटी देते हैं।"
    }
  },
  "AI Local Dialect Voice Recording on Karya App": {
    hinglish: {},
    en: {
      name: "AI Local Dialect Voice Recording on Karya App",
      earnings: "₹3,000 - ₹8,000 / month (Based on task approval)",
      commitment: "Flexible (1 hour/day on smartphone)",
      description: "Read and record simple sentences on screen in your native Indian regional language (Bhojpuri, Maithili, Hindi, Tamil, etc.) to train localized LLM translation models.",
      skills: ["Native regional language fluency", "Clear pronunciation", "A quiet room for recording"],
      whySecret: "Large AI corporations are spending billions to make LLMs understand regional Indian accents, but they recruit via quiet crowd-work portals. Most students are busy searching 'data entry' on Google and miss these high-paying, direct-transfer tasks.",
      mobileRoadmap: [
        "Download the Karya app directly from Play Store and select your native language.",
        "Submit a 1-minute demo recording sample to verify your profile.",
        "Select active voice reading and labeling projects from the task board.",
        "Complete reading sentences and wait for instant approval."
      ],
      paymentSolution: "Direct Bank account or UPI transfer (IMPS/NEFT) integrated right inside the Karya app — withdraw anytime!",
      realityCheck: "Earning totally depends on task volume. Make sure to record in a quiet room with zero background fan noise for fast approval!"
    },
    hi: {
      name: "कार्या (Karya) ऐप पर स्थानीय बोली की वॉयस रिकॉर्डिंग",
      earnings: "₹3,000 - ₹8,000 / महीना (काम की मंजूरी के आधार पर)",
      commitment: "लचीला (स्मार्टफोन पर रोजाना 1 घंटा)",
      description: "स्थानीय भारतीय क्षेत्रीय भाषाओं (भोजपुरी, मैथिली, हिंदी, तमिल, आदि) में स्क्रीन पर सरल वाक्यों को पढ़ें और रिकॉर्ड करें ताकि एआई अनुवाद मॉडल को प्रशिक्षित किया जा सके।",
      skills: ["मूल क्षेत्रीय भाषा प्रवाह", "स्पष्ट उच्चारण", "रिकॉर्डिंग के लिए एक शांत कमरा"],
      whySecret: "बड़ी एआई कंपनियां क्षेत्रीय भारतीय लहजे को समझने के लिए अरबों खर्च कर रही हैं, लेकिन वे शांत क्राउड-वर्क पोर्टल्स के माध्यम से भर्ती करती हैं। अधिकांश छात्र गूगल पर 'डेटा एंट्री' खोजने में व्यस्त हैं और इन सीधे ट्रांसफर वाले कामों से चूक जाते हैं।",
      mobileRoadmap: [
        "प्ले स्टोर से सीधे कार्या ऐप डाउनलोड करें और अपनी मूल भाषा चुनें।",
        "अपनी प्रोफाइल सत्यापित करने के लिए 1 मिनट का डेमो रिकॉर्डिंग सैंपल जमा करें।",
        "टास्क बोर्ड से सक्रिय वॉयस रीडिंग और लेबलिंग प्रोजेक्ट चुनें।",
        "वाक्यों को पढ़ना पूरा करें और त्वरित मंजूरी की प्रतीक्षा करें।"
      ],
      paymentSolution: "कार्या ऐप के भीतर सीधे बैंक खाते या यूपीआई ट्रांसफर (IMPS/NEFT) की सुविधा — कभी भी राशि निकालें!",
      realityCheck: "कमाई पूरी तरह से उपलब्ध प्रोजेक्ट्स की संख्या पर निर्भर करती है। त्वरित मंजूरी के लिए शोर के बिना शांत कमरे में रिकॉर्ड करना सुनिश्चित करें!"
    }
  },
  "Local Google Maps Business Profiler & Optimizer": {
    hinglish: {},
    en: {
      name: "Local Google Maps Business Profiler & Optimizer",
      earnings: "₹500 - ₹1,200 per local business optimization",
      commitment: "Flexible (1-2 hours / client, WFH/Local)",
      description: "Help unmapped local shops, boutiques, and cafes in your city set up and optimize their Google Business Profiles with high-quality photos.",
      skills: ["Google Maps app usage", "Smartphone photography", "Basic conversational skills"],
      whySecret: "Local Indian shops lose 30%+ of walk-in customers because they are unlisted or have incorrect numbers on maps. They will happily pay ₹500 to a student who sets up their official map listing and takes nice pictures of their storefront.",
      mobileRoadmap: [
        "Identify unlisted shops or those with incorrect timings in your locality.",
        "Explain the benefits of map listing to the shop owner and make a simple pitch.",
        "Download Google Business Profile app and update shop details, photos, and timings.",
        "Submit the listing verification code and hand over the map management to the owner."
      ],
      paymentSolution: "Direct payment to your personal UPI (Paytm/GPay/PhonePe) by the shop owner once their listing is live on maps.",
      realityCheck: "Easy to start, zero capital. Pitching to 5 shop owners usually gets 1-2 clients. Requires basic communication."
    },
    hi: {
      name: "स्थानीय गूगल मैप्स बिजनेस प्रोफाइलर और ऑप्टिमाइज़र",
      earnings: "₹500 - ₹1,200 प्रति स्थानीय व्यवसाय ऑप्टिमाइज़ेशन",
      commitment: "लचीला (1-2 घंटे / क्लाइंट, स्थानीय काम)",
      description: "अपने शहर में मैप पर न दिखने वाली स्थानीय दुकानों, बुटीक और कैफे को गूगल बिजनेस प्रोफाइल सेट करने और उच्च गुणवत्ता वाली तस्वीरों के साथ ऑप्टिमाइज़ करने में मदद करें।",
      skills: ["गूगल मैप्स ऐप का उपयोग", "स्मार्टफोन फोटोग्राफी", "बुनियादी बातचीत कौशल"],
      whySecret: "स्थानीय भारतीय दुकानें 30% से अधिक ग्राहकों को खो देती हैं क्योंकि वे मैप पर लिस्टेड नहीं होती हैं। वे खुशी-खुशी एक छात्र को ₹500 का भुगतान करेंगे जो उनकी आधिकारिक मैप लिस्टिंग सेट करता है और सुंदर तस्वीरें लेता है।",
      mobileRoadmap: [
        "अपने इलाके में लिस्टेड न होने वाली या गलत समय वाली दुकानों की पहचान करें।",
        "दुकान मालिक को मैप लिस्टिंग के लाभ समझाएं और एक सरल पिच पेश करें।",
        "गूगल बिजनेस प्रोफाइल ऐप डाउनलोड करें और दुकान का विवरण, फोटो और समय अपडेट करें।",
        "सत्यापन कोड सबमिट करें और दुकान मालिक को मैप प्रबंधन सौंपें।"
      ],
      paymentSolution: "नक्शे पर उनकी लिस्टिंग लाइव होने के बाद दुकान के मालिक द्वारा सीधे आपके व्यक्तिगत यूपीआई (Paytm/GPay/PhonePe) पर भुगतान।",
      realityCheck: "शुरू करना आसान, शून्य निवेश। 5 दुकान मालिकों से बात करने पर आमतौर पर 1-2 क्लाइंट मिल जाते हैं। मूल बातचीत कौशल की आवश्यकता है।"
    }
  },
  "Faceless Instagram Reels Creator for Local Boutiques": {
    hinglish: {},
    en: {
      name: "Faceless Instagram Reels Creator for Local Boutiques",
      earnings: "₹4,000 - ₹10,000 / month per client business",
      commitment: "Flexible (1-2 hours/day remote)",
      description: "Edit and post attractive product reels and aesthetic slide video collections on Instagram for local boutiques using free CapCut templates.",
      skills: ["CapCut or InShot editing", "Basic Instagram Reels trends"],
      whySecret: "Small boutique and local shop owners want to leverage Instagram Reels to go viral but have zero time or video editing skills. No competitor goes shop-to-shop digitally. You don't need to visit; they send product photos, you edit them on CapCut on your phone!",
      mobileRoadmap: [
        "Learn transition video editing on CapCut or InShot using templates.",
        "Find and DM local bakeries or dress boutiques on Instagram.",
        "Curate their product images and send them 3 modern demo reels.",
        "Agree on a monthly package (e.g., ₹4000 for 12 Reels) and start managing their reels."
      ],
      paymentSolution: "Direct client payment to your GPay / PhonePe / UPI ID, or bank transfer.",
      realityCheck: "Requires a good aesthetic sense and regular posting. Getting your first client is the hardest step, but 1 client leads to more!"
    },
    hi: {
      name: "स्थानीय बुटीक के लिए फेसलेस इंस्टाग्राम रील्स निर्माता",
      earnings: "₹4,000 - ₹10,000 / प्रति क्लाइंट मासिक",
      commitment: "लचीला (रोजाना 1-2 घंटे रिमोट)",
      description: "स्थानीय बुटीक, बेकरी या जूतों की दुकानों के लिए अपने फोन पर मुफ्त कैपकट (CapCut) टेम्प्लेट का उपयोग करके इंस्टाग्राम पर आकर्षक उत्पाद रील्स और स्लाइड वीडियो संपादित और पोस्ट करें।",
      skills: ["कैपकट या इनशॉट संपादन", "मूल इंस्टाग्राम रील्स ट्रेंड्स"],
      whySecret: "छोटे बुटीक और स्थानीय दुकान मालिक वायरल होने के लिए इंस्टाग्राम रील्स का लाभ उठाना चाहते हैं लेकिन उनके पास समय या वीडियो संपादन कौशल नहीं है। आपको दुकान पर जाने की आवश्यकता नहीं है; वे उत्पाद तस्वीरें भेजते हैं, आप उन्हें अपने फोन पर संपादित करते हैं!",
      mobileRoadmap: [
        "टेम्प्लेट का उपयोग करके कैपकट या इनशॉट पर वीडियो संपादन सीखें।",
        "इंस्टाग्राम पर स्थानीय बेकरी या ड्रेस बुटीक खोजें और उन्हें डायरेक्ट मैसेज (DM) भेजें।",
        "उनकी उत्पाद छवियों को क्यूरेट करें और उन्हें 3 आधुनिक मुफ्त रील्स डेमो भेजें।",
        "मासिक पैकेज (जैसे 12 रील्स के लिए ₹4000) पर सहमति दें और उनकी रील्स का प्रबंधन शुरू करें।"
      ],
      paymentSolution: "ग्राहक द्वारा सीधे आपके जीपे / फोनपे / यूपीआई आईडी या बैंक ट्रांसफर पर भुगतान।",
      realityCheck: "एक अच्छे सौंदर्य बोध और नियमित पोस्टिंग की आवश्यकता होती है। अपना पहला क्लाइंट पाना सबसे कठिन कदम है, लेकिन 1 क्लाइंट से आगे के रास्ते खुलते हैं!"
    }
  },
  "Canva Social Media Designer on Internshala": {
    hinglish: {},
    en: {
      name: "Canva Social Media Designer on Internshala",
      earnings: "₹4,000 - ₹8,000 / month (Part-time stipend)",
      commitment: "2-3 hours/day (Work From Home)",
      description: "Design attractive social media graphics, templates, and basic posters for Indian startups and boutiques using ready-made Canva elements.",
      skills: ["Canva design", "Basic creative layout sense"],
      whySecret: "Local agencies are flooded with client work, but startups don't need expert Adobe designers — they just need simple, clean designs made inside 10 minutes using standard Canva templates on mobile.",
      mobileRoadmap: [
        "Download the Canva app on mobile and learn to edit standard templates.",
        "Ready your custom portfolio (e.g., 5 sample posts) and share a viewable link.",
        "Register a profile on Internshala and apply for 'Part-time graphic design' internships.",
        "Once you receive an interview call, share your live Canva portfolio link."
      ],
      paymentSolution: "Paid monthly via direct bank transfer or GPay/PhonePe linked to your Indian phone number.",
      realityCheck: "Stipend range is strict. Needs 2 hours daily of smartphone layouts crafting. Highly secure."
    },
    hi: {
      name: "इंटर्नशाला पर कैनवा सोशल मीडिया डिजाइनर",
      earnings: "₹4,000 - ₹8,000 / महीना (अंशकालिक वजीफा)",
      commitment: "2-3 घंटे/दिन (घर से काम)",
      description: "तैयार कैनवा तत्वों और टेम्प्लेट का उपयोग करके भारतीय स्टार्टअप और बुटीक के लिए आकर्षक सोशल मीडिया ग्राफिक्स, टेम्प्लेट और बुनियादी पोस्टर डिजाइन करें।",
      skills: ["कैनवा डिज़ाइन", "बुनियादी रचनात्मक लेआउट भावना"],
      whySecret: "स्थानीय एजेंसियां क्लाइंट्स के काम से भरी हुई हैं, लेकिन स्टार्टअप्स को एडोब एक्सपर्ट्स की आवश्यकता नहीं होती है - उन्हें सिर्फ मोबाइल पर कैनवा टेम्प्लेट का उपयोग करके 10 मिनट में बने सरल, साफ डिजाइन की आवश्यकता होती है।",
      mobileRoadmap: [
        "मोबाइल में कैनवा ऐप डाउनलोड करें और सामान्य टेम्प्लेट संपादित करना सीखें।",
        "अपना खुद का पोर्टफोलियो (जैसे 5 नमूना पोस्ट) तैयार करें और लिंक साझा करें।",
        "इंटर्नशाला पर प्रोफाइल रजिस्टर करें और 'पार्ट-टाइम ग्राफिक डिजाइन' इंटर्नशिप के लिए आवेदन करें।",
        "चयन इंटरव्यू कॉल मिलते ही अपना कैनवा लाइव लिंक पोर्टफोलियो साझा करें।"
      ],
      paymentSolution: "सीधे बैंक ट्रांसफर या आपके भारतीय फोन नंबर से जुड़े जीपे/फोनपे के माध्यम से मासिक भुगतान।",
      realityCheck: "वजीफा सीमा सख्त है। स्मार्टफोन पर रोजाना 2 घंटे काम करने की आवश्यकता है। अत्यधिक सुरक्षित काम।"
    }
  },
  "Audio-to-Text Transcriptionist on Scribie": {
    hinglish: {},
    en: {
      name: "Audio-to-Text Transcriptionist on Scribie",
      earnings: "₹350 - ₹1,200 per audio hour",
      commitment: "Flexible, no minimum target",
      description: "Listen to clean recorded audio files (conversations, speeches, or interviews) and accurately type them down into clear text format.",
      skills: ["Good English listening", "Clean and fast computerized typing"],
      whySecret: "Global corporations record hours of research but cannot use AI auto-captioning because of thick local accents. They pay humans per audio minute to ensure accuracy.",
      mobileRoadmap: [
        "Register a freelancer account on Scribie.com.",
        "Complete the online audio transcription test using your mobile screen and earphones.",
        "Start with low-difficulty short audio clips (1-3 minutes).",
        "Correct errors using Scribie's automatic proofing tool and submit."
      ],
      paymentSolution: "PayPal transfer linked inside Scribie dashboard, which automatically sweeps to your Indian bank account next business morning with zero fees.",
      realityCheck: "₹3,000 - ₹7,000 / month. Requires extreme silence, concentration, and good audio parsing ability."
    },
    hi: {
      name: "स्क्राइबी (Scribie) पर ऑडियो-टू-टेक्स्ट ट्रांसक्रिप्शनिस्ट",
      earnings: "₹350 - ₹1,200 प्रति ऑडियो घंटा",
      commitment: "लचीला, कोई न्यूनतम लक्ष्य नहीं",
      description: "साफ रिकॉर्ड की गई ऑडियो फाइलों (वार्तालाप, भाषण या साक्षात्कार) को सुनें और उन्हें स्पष्ट रूप से टेक्स्ट प्रारूप में टाइप करें।",
      skills: ["अच्छी अंग्रेजी सुनने की क्षमता", "साफ और तेज कंप्यूटर टाइपिंग"],
      whySecret: "वैश्विक कंपनियां शोध के घंटों को रिकॉर्ड करती हैं लेकिन स्थानीय लहजे के कारण एआई ऑटो-कैप्शनिंग का उपयोग नहीं कर पाती हैं। वे सटीकता सुनिश्चित करने के लिए मनुष्यों को प्रति ऑडियो मिनट भुगतान करती हैं।",
      mobileRoadmap: [
        "Scribie.com पर एक फ्रीलांसर खाता पंजीकृत करें।",
        "अपने मोबाइल स्क्रीन और ईयरफोन का उपयोग करके ऑनलाइन ऑडियो ट्रांसक्रिप्शन टेस्ट पूरा करें।",
        "कम कठिनाई वाली छोटी ऑडियो क्लिप (1-3 मिनट) से शुरुआत करें।",
        "स्क्राइबी के स्वचालित प्रूफिंग प्लेटफॉर्म से गलतियां सुधारें और सबमिट करें।"
      ],
      paymentSolution: "Scribie डैशबोर्ड के अंदर जुड़ा हुआ पेपैल ट्रांसफर, जो अगले दिन बिना किसी शुल्क के सीधे भारतीय बैंक खातों में जमा हो जाता है।",
      realityCheck: "₹3,000 - ₹7,000 / महीना। इसके लिए शांत वातावरण, एकाग्रता और अच्छी ऑडियो सुनने की क्षमता की आवश्यकता होती है।"
    }
  },
  "AI-Powered Local Web Developer (AI Website Builder)": {
    hinglish: {},
    en: {
      name: "AI-Powered Local Web Developer (AI Website Builder)",
      earnings: "₹15,000 - ₹45,000 / month (Based on 1-3 local client projects)",
      commitment: "Flexible (2-4 hours/day)",
      description: "Build modern, highly professional websites, digital menus, or catalog applications for local restaurants, dhabas, hotels, clinics, and stores using advanced free/trial AI web builders (like v0.dev, Bolt.new, or Wix ADI) without any complex coding experience.",
      skills: ["AI web prompt engineering", "v0.dev / Bolt.new interface", "Local client negotiation & pitching"],
      whySecret: "Thousands of local dhabas, family restaurants, clinics, hotels, and retail stores in your area have absolutely zero web presence or outdated map listings. Custom coding usually takes software agencies weeks and costs ₹30,000+, but using cutting-edge AI website builders on your laptop/mobile, you can generate a complete, stunning, mobile-responsive custom website or booking page in less than 2 hours! You can easily pitch and charge local business owners ₹10,000 to ₹20,000 per site.",
      mobileRoadmap: [
        "Identify local restaurants, clinics, hotels, or stores in your area that do not have a website or have incorrect details on Google Maps.",
        "Meet with the business owner and politely explain how a custom digital menu or website can increase their reach and sales by 30%.",
        "Open modern free AI generators like v0.dev or Bolt.new and generate a basic website based on the client's theme (e.g. 'Create a modern mobile-first vegetarian restaurant website with online menu').",
        "Load the exact item list, prices, contact number, and direct pay-via-UPI QR code scan buttons into the AI-generated page, then host it for free on Netlify or Vercel and present the live working link to the client.",
      ],
      paymentSolution: "Take a 40% advance before starting, and receive the remaining 60% balance via UPI or bank transfer immediately upon delivering the live website link.",
      realityCheck: "The owners don't care about the underlying technology; they care about visual appeal, accuracy, and ease of use. If you show them a pre-designed demo with their actual menu, your conversion chances increase 5x!"
    },
    hi: {
      name: "एआई-पावर्ड लोकल वेब डेवलपर (एआई वेबसाइट बिल्डर)",
      earnings: "₹15,000 - ₹45,000 / महीना (1-3 लोकल क्लाइंट प्रोजेक्ट्स पर आधारित)",
      commitment: "लचीला (रोजाना 2-4 घंटे)",
      description: "बिना किसी जटिल कोडिंग अनुभव के उन्नत मुफ्त/ट्रायल एआई वेब बिल्डर्स (जैसे v0.dev, Bolt.new, या Wix ADI) का उपयोग करके स्थानीय रेस्तरां, ढाबों, होटलों, क्लीनिकों और दुकानों के लिए आधुनिक, अत्यधिक पेशेवर वेबसाइटें, डिजिटल मेनू या कैटलॉग एप्लिकेशन बनाएं।",
      skills: ["एआई वेब प्रॉम्ट इंजीनियरिंग", "v0.dev / Bolt.new इंटरफ़ेस", "लोकल क्लाइंट बातचीत और पिचिंग"],
      whySecret: "आपके क्षेत्र में हजारों स्थानीय ढाबों, पारिवारिक रेस्तरां, क्लीनिकों, होटलों और खुदरा दुकानों की इंटरनेट पर बिल्कुल शून्य उपस्थिति है। कस्टम कोडिंग में आमतौर पर सॉफ्टवेयर एजेंसियों को कई सप्ताह लगते हैं और ₹30,000+ का खर्च आता है, लेकिन अपने लैपटॉप/मोबाइल पर अत्याधुनिक एआई वेबसाइट बिल्डरों का उपयोग करके, आप 2 घंटे से भी कम समय में एक पूर्ण, शानदार, मोबाइल-अनुकूलित कस्टम वेबसाइट बना सकते हैं! आप आसानी से स्थानीय व्यवसायों से ₹10,000 से ₹20,000 प्रति साइट चार्ज कर सकते हैं।",
      mobileRoadmap: [
        "अपने आस-पास के उन स्थानीय रेस्तरां, क्लीनिकों, होटलों या दुकानों की पहचान करें जिनकी कोई वेबसाइट नहीं है या गूगल मैप्स पर गलत विवरण हैं।",
        "व्यवसाय के मालिक से मिलें और विनम्रतापूर्वक समझाएं कि एक कस्टम डिजिटल मेनू और वेबसाइट उनके ग्राहकों और बिक्री को 30% तक बढ़ा सकती है।",
        "v0.dev या Bolt.new जैसे आधुनिक मुफ्त एआई जनरेटर खोलें और क्लाइंट के थीम के आधार पर एक बुनियादी वेबसाइट संरचना तैयार करें (जैसे 'Create a modern mobile-first vegetarian restaurant website with online menu')।",
        "एआई द्वारा बनाए गए पेज में रेस्तरां की सटीक वस्तुएं, मूल्य सूची, संपर्क नंबर और सीधे यूपीआई भुगतान क्यूआर कोड बटन लोड करें, फिर इसे नेटलिफाई या वर्सेल पर मुफ्त में लाइव करें और मालिक को दिखाएं।"
      ],
      paymentSolution: "काम शुरू करने से पहले 40% अग्रिम टोकन राशि लें, और मालिक को लाइव वेबसाइट लिंक सौंपने पर शेष 60% राशि सीधे यूपीआई (GPay/Paytm/PhonePe) या बैंक ट्रांसफर के माध्यम से प्राप्त करें।",
      realityCheck: "मालिक को तकनीक या कोडिंग से कोई सरोकार नहीं होता है; उन्हें सुंदर डिज़ाइन, सटीक कीमतें और आसान सेटअप चाहिए होता है। यदि आप उनके वास्तविक मेनू कार्ड की तस्वीरें क्लिक करके पहले से ही एक डेमो लेआउट दिखाएंगे, तो डील पक्की होने की संभावना 5 गुना बढ़ जाती है!"
    }
  }
};

const UI_TEXT = {
  title: {
    hinglish: "Mitra AI Student Pocket-Money Gig Finder",
    en: "Mitra AI Student Pocket-Money Gig Finder",
    hi: "मित्रा एआई छात्र पॉकेट-मनी गिग फाइंडर"
  },
  subtitle: {
    hinglish: "Bhai, special legal online earning side-hustles jo aap apne mobile phone se side me kar sakte hain!",
    en: "Bro, special legal online earning side-hustles that you can do easily on your mobile phone alongside your studies!",
    hi: "भैया, विशेष कानूनी ऑनलाइन कमाई के तरीके जिन्हें आप अपने मोबाइल फोन से अपनी पढ़ाई के साथ-साथ कर सकते हैं!"
  },
  searchPlaceholder: {
    hinglish: "Earning topic search (e.g., Canva, sticker, transcription, typing...)",
    en: "Search side-hustles (e.g., Canva, sticker, transcription, typing...)",
    hi: "कमाने का विषय खोजें (जैसे कैनवा, स्टिकर, ट्रांसक्रिप्शन, टाइपिंग...)"
  },
  searchBtn: {
    hinglish: "Ideas Khojein",
    en: "Search Ideas",
    hi: "कमाई के विचार खोजें"
  },
  resetBtn: {
    hinglish: "Reset to Default",
    en: "Reset to Default",
    hi: "डिफ़ॉल्ट पर रीसेट करें"
  },
  shuffleBtn: {
    hinglish: "Shuffle Ideas",
    en: "Shuffle Ideas",
    hi: "विचार बदलें"
  },
  recFilter: {
    hinglish: "🌟 Recommended for You",
    en: "🌟 Recommended for You",
    hi: "🌟 आपके लिए अनुशंसित"
  },
  allFilter: {
    hinglish: "🌎 All Secret Gigs",
    en: "🌎 All Secret Gigs",
    hi: "🌎 सभी गुप्त गिग्स"
  },
  savedFilter: {
    hinglish: "💾 Saved Gigs",
    en: "💾 Saved Gigs",
    hi: "💾 सहेजे गए"
  },
  expectedEarning: {
    hinglish: "Expected Earning",
    en: "Expected Earning",
    hi: "अनुमानित कमाई"
  },
  commitment: {
    hinglish: "Commitment",
    en: "Commitment",
    hi: "समय प्रतिबद्धता"
  },
  whatToDo: {
    hinglish: "What You Have To Do",
    en: "What You Have To Do",
    hi: "आपको क्या करना होगा"
  },
  skillsNeeded: {
    hinglish: "Skills Needed",
    en: "Skills Needed",
    hi: "आवश्यक कौशल"
  },
  whySecret: {
    hinglish: "Why is this a Secret Hack?",
    en: "Why is this a Secret Hack?",
    hi: "यह एक गुप्त तरीका क्यों है?"
  },
  mobileRoadmap: {
    hinglish: "4-Step Mobile Roadmap",
    en: "4-Step Mobile Roadmap",
    hi: "4-चरणीय मोबाइल रोडमैप"
  },
  paymentSolution: {
    hinglish: "How You Get Paid",
    en: "How You Get Paid",
    hi: "भुगतान कैसे मिलेगा"
  },
  realityCheck: {
    hinglish: "Reality Check (Truth)",
    en: "Reality Check (Truth)",
    hi: "वास्तविकता की जांच (सच्चाई)"
  },
  startEarning: {
    hinglish: "Start Earning Now 🚀",
    en: "Start Earning Now 🚀",
    hi: "अभी कमाई शुरू करें 🚀"
  },
  showDetails: {
    hinglish: "Show Full Guide & Roadmap",
    en: "Show Full Guide & Roadmap",
    hi: "पूर्ण गाइड और रोडमैप देखें"
  },
  hideDetails: {
    hinglish: "Hide Guide & Roadmap",
    en: "Hide Guide & Roadmap",
    hi: "गाइड और रोडमैप छिपाएं"
  },
  guaranteeTitle: {
    hinglish: "100% Assured Earnings Guarantee (Consistency Challenge)",
    en: "100% Assured Earnings Guarantee (Consistency Challenge)",
    hi: "100% सुनिश्चित कमाई की गारंटी (निरंतरता चुनौती)"
  },
  guaranteeBody: {
    hinglish: "Bhai, Mitra AI aapko 100% Assurance deta hai: Agar aap is roadmap ko follow karke daily 1-2 hours consistently bina rukey 2-3 weeks kaam karenge, toh aapki learning aur online earnings guaranteed hogi! Aapka struggle kabhi waste nahi jayega. Bas routine maintain rakhein!",
    en: "My friend, Mitra AI gives you 100% Assurance: If you follow this roadmap and work consistently for 1-2 hours daily without stopping for 2-3 weeks, your learning and online earnings are guaranteed! Your effort will never go to waste. Just maintain the routine!",
    hi: "दोस्त, मित्रा एआई आपको 100% सुनिश्चित आश्वासन देता है: यदि आप इस रोडमैप का पालन करते हैं और 2-3 सप्ताह तक बिना रुके रोजाना 1-2 घंटे लगातार काम करते हैं, तो आपकी सीख और ऑनलाइन कमाई की गारंटी है! आपका संघर्ष कभी बेकार नहीं जाएगा। बस अपना रूटीन बनाए रखें!"
  },
  scamShieldTitle: {
    hinglish: "🛡️ SCAM SHIELD ACTIVATED",
    en: "🛡️ SCAM SHIELD ACTIVATED",
    hi: "🛡️ स्कैम शील्ड सक्रिय"
  },
  scamShieldBody: {
    hinglish: "Legitimate platforms check your skill and portfolios. Aap se registration fee, computer training tax, security deposit ya OTP maangne wali agencies 100% fake hoti hain. Kabhi kisi ko job ke liye paise na dein!",
    en: "Legitimate platforms only check your skills and portfolios. Any agency asking you for registration fees, computer training tax, security deposit, or OTP is 100% fake. Never pay money to anyone for a job or work!",
    hi: "वैध प्लेटफॉर्म केवल आपके कौशल और पोर्टफोलियो की जांच करते हैं। आपसे पंजीकरण शुल्क, कंप्यूटर प्रशिक्षण कर, सुरक्षा जमा या ओटीपी मांगने वाली कोई भी एजेंसी 100% फर्जी है। नौकरी के लिए कभी किसी को पैसे न दें!"
  }
};

export const StudentGigFinderWidget = ({
  userProfile,
  onAskMitra
}: {
  userProfile: UserProfile;
  onAskMitra: (q: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<GigItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"recommended" | "all" | "saved">("recommended");
  const [savedGigs, setSavedGigs] = useState<GigItem[]>(() => {
    try {
      const cached = localStorage.getItem("mitra_saved_gigs");
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  const [gigsList, setGigsList] = useState<GigItem[]>(() => {
    let offsetVal = 0;
    try {
      const stored = localStorage.getItem("mitra_gigs_rotation_offset");
      offsetVal = stored ? parseInt(stored, 10) : 0;
      // Increment and save for the next mount
      localStorage.setItem("mitra_gigs_rotation_offset", String(offsetVal + 1));
    } catch (e) {
      console.error(e);
    }

    const arr = [...DEFAULT_GIGS];
    const N = arr.length;
    if (N > 0) {
      const shift = (offsetVal * 3) % N;
      return [...arr.slice(shift), ...arr.slice(0, shift)];
    }
    return arr;
  });
  const [isShuffling, setIsShuffling] = useState(false);
  const [expandedGigs, setExpandedGigs] = useState<Record<string, boolean>>({});

  const toggleGigDetails = (gigName: string) => {
    setExpandedGigs((prev) => ({
      ...prev,
      [gigName]: !prev[gigName]
    }));
  };

  const handleShuffleGigs = () => {
    setIsShuffling(true);
    setTimeout(() => {
      setGigsList((prev) => {
        let offsetVal = 0;
        try {
          const stored = localStorage.getItem("mitra_gigs_rotation_offset");
          offsetVal = stored ? parseInt(stored, 10) : 0;
          localStorage.setItem("mitra_gigs_rotation_offset", String(offsetVal + 1));
        } catch (e) {
          console.error(e);
        }
        const arr = [...DEFAULT_GIGS];
        const N = arr.length;
        if (N > 0) {
          const shift = (offsetVal * 3) % N;
          return [...arr.slice(shift), ...arr.slice(0, shift)];
        }
        return arr;
      });
      setIsShuffling(false);
    }, 600);
  };

  const handleToggleSaveGig = (gig: GigItem) => {
    setSavedGigs((prev) => {
      const alreadySaved = prev.some((g) => g.name === gig.name);
      let updated;
      if (alreadySaved) {
        updated = prev.filter((g) => g.name !== gig.name);
      } else {
        updated = [...prev, gig];
      }
      localStorage.setItem("mitra_saved_gigs", JSON.stringify(updated));
      return updated;
    });
  };

  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gigs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, profile: userProfile })
      });

      if (!response.ok) {
        throw new Error("Gig details search failed. Please try again.");
      }

      const data = await response.json();
      if (data.gigs && Array.isArray(data.gigs)) {
        const sanitizedGigs = data.gigs.map((g: any) => ({
          ...g,
          categories: g.categories || ["General"],
          minClass: g.minClass || "10"
        }));
        setSearchResults(sanitizedGigs);
      } else {
        throw new Error("Unexpected answer structure.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Dost, networks mein thodi dikqat hai. Default gigs check kijiye ya firse search koshish kijiye!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setError(null);
    setActiveFilter("recommended");
  };

  const userStream = userProfile.stream || "General";

  const getFilteredGigs = () => {
    if (searchResults) return searchResults;
    if (activeFilter === "saved") return savedGigs;
    return gigsList;
  };

  const lang = userProfile.preferredLanguage || "hinglish";

  const currentGigs = getFilteredGigs().map((gig) => {
    if (lang === "hinglish") return gig;
    
    // Find matching localization by trying to match gig.name
    const key = Object.keys(LOCALIZED_FIELD_MAP).find(
      (k) => k.toLowerCase() === gig.name.toLowerCase() || gig.name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(gig.name.toLowerCase())
    );
    if (key && LOCALIZED_FIELD_MAP[key] && LOCALIZED_FIELD_MAP[key][lang]) {
      return {
        ...gig,
        ...LOCALIZED_FIELD_MAP[key][lang]
      } as GigItem;
    }
    return gig;
  });

  return (
    <div className="flex flex-col gap-6" id="student-gig-finder-panel">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-br from-[#008069] to-[#005c4b] p-6 rounded-[2rem] text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <span className="text-[8px] font-black tracking-widest bg-emerald-400 text-[#005c4b] px-2.5 py-1 rounded-full uppercase">
          💰 {UI_TEXT.title[lang]}
        </span>
        <h2 className="text-lg font-black mt-2 leading-tight">
          {lang === "hi" 
            ? "100% मुफ्त, शून्य-निवेश वाले माइक्रो गिग्स खोजें" 
            : lang === "en" 
            ? "Find 100% Free, Zero-Investment Micro Gigs" 
            : "Find 100% Free, Zero-Investment Micro Gigs"}
        </h2>
        <p className="text-[10px] font-medium text-emerald-100 mt-1 leading-snug">
          {lang === "hi" 
            ? `बिना एक भी पैसा लगाए कक्षा ${userProfile.class || "10/12/कक्षा"} की पढ़ाई के साथ सीधे सुरक्षित पॉकेट-मनी कमाना शुरू करें। कोई पंजीकरण शुल्क नहीं, कोई धोखा नहीं!`
            : lang === "en"
            ? `Start earning secure pocket money alongside Class ${userProfile.class || "10/12/College"} studies without investing a single rupee. No registration fees, no frauds!`
            : `Bina ek bhi paisa lagaye starting earning secure pockets alongside Class ${userProfile.class || "10/12/College"} studies. NO registrations fees, NO frauds!`
          }
        </p>

        {/* Live Search Form */}
        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={UI_TEXT.searchPlaceholder[lang]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-800 text-xs font-semibold pl-10 pr-3 py-2.5 rounded-xl border border-transparent focus:border-emerald-300 outline-none placeholder-gray-400 shadow-3xs"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-0 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              UI_TEXT.searchBtn[lang]
            )}
          </button>
        </form>

        {/* Quick Hidden Suggestions */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-black text-emerald-150 uppercase tracking-wider">
            {lang === "hi" ? "💡 गुप्त तरीके आजमाएं:" : lang === "en" ? "💡 TRY SECRET HACKS:" : "💡 TRY SECRET HACKS:"}
          </span>
          {[
            "AI Sticker Designer",
            "Pinterest Affiliate",
            "Stock Photo Contributor",
            "Carrd Web Designer",
            "Notion Template Maker"
          ].map((tag) => {
            const localizedTagLabel = lang === "hi" 
              ? tag === "AI Sticker Designer" ? "एआई स्टिकर"
                : tag === "Pinterest Affiliate" ? "पिनटरेस्ट एफिलिएट"
                : tag === "Stock Photo Contributor" ? "स्टॉक फोटो"
                : tag === "Carrd Web Designer" ? "कैरड वेब डिजाइनर"
                : "नोशन टेम्प्लेट"
              : tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={async () => {
                  setSearchQuery(tag);
                  await executeSearch(tag);
                }}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border-0 text-white rounded-lg text-[9px] font-black cursor-pointer active:scale-95 transition-all flex items-center gap-1 shrink-0"
              >
                ✨ {localizedTagLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Safety Shield Alert Bar */}
      <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[10px] font-black text-rose-950 uppercase tracking-wider leading-none">
            {UI_TEXT.scamShieldTitle[lang]}
          </h4>
          <p className="text-[10px] font-bold text-rose-700 mt-1 leading-tight">
            {UI_TEXT.scamShieldBody[lang]}
          </p>
        </div>
      </div>

      {/* 🤝 Mitra Trust & Consistency Guarantee Bar */}
      <div className="p-4.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl relative overflow-hidden group">
        <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-[#008069]/10 rounded-full blur-md" />
        <div className="flex items-start gap-3 relative z-10">
          <span className="text-xl shrink-0">🤝</span>
          <div>
            <h4 className="text-[11px] font-black text-emerald-950 uppercase tracking-wider leading-none flex items-center gap-1.5">
              {UI_TEXT.guaranteeTitle[lang]}
            </h4>
            <p className="text-[10px] font-bold text-emerald-800 mt-1 leading-relaxed">
              {UI_TEXT.guaranteeBody[lang]}
            </p>
          </div>
        </div>
      </div>

      {/* Gigs List section */}
      <div className="flex flex-col gap-4">
        {/* Profile-matching Filters */}
        {!searchResults && (
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2 rounded-[2rem] border border-slate-100">
            <button
              type="button"
              onClick={() => setActiveFilter("recommended")}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border-0 ${
                activeFilter === "recommended"
                  ? "bg-[#008069] text-white shadow-xs"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {UI_TEXT.recFilter[lang]}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border-0 ${
                activeFilter === "all"
                  ? "bg-[#008069] text-white shadow-xs"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {UI_TEXT.allFilter[lang]}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("saved")}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border-0 flex items-center gap-1 ${
                activeFilter === "saved"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-amber-50/60 text-amber-800 hover:bg-amber-100"
              }`}
            >
              📌 {UI_TEXT.savedFilter[lang]} ({savedGigs.length})
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-1 flex-wrap gap-2">
          <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
            {searchResults ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> {lang === "hi" ? "कस्टम खोजे गए छात्र गिग्स" : lang === "en" ? "Custom Searched Student Gigs" : "Custom Searched Student Gigs"}
              </>
            ) : activeFilter === "saved" ? (
              <>
                <Bookmark className="w-3.5 h-3.5 text-amber-500" /> {lang === "hi" ? "आपके सहेजे गए पॉकेट-मनी गिग्स" : lang === "en" ? "Your Saved Pocket-Money Gigs" : "Aapke Saved Pocket-Money Gigs"}
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-[#008069]" /> {lang === "hi" ? "विशेष छात्र गिग्स (100% मुफ्त)" : lang === "en" ? "Hand-Picked Student Gigs (100% Free)" : "Hand-Picked Student Gigs (100% Free)"}
              </>
            )}
          </h3>

          <div className="flex items-center gap-2">
            {!searchResults && activeFilter !== "saved" && (
              <button
                type="button"
                onClick={handleShuffleGigs}
                disabled={isShuffling}
                className="text-[9px] font-black text-[#008069] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-150 cursor-pointer active:scale-95 transition-all uppercase tracking-wider flex items-center gap-1"
                title="Refresh jobs feed dynamically"
              >
                <RefreshCw className={`w-3 h-3 ${isShuffling ? "animate-spin" : ""}`} />
                {isShuffling 
                  ? (lang === "hi" ? "बदला जा रहा है..." : lang === "en" ? "Refreshing..." : "Refreshing...") 
                  : UI_TEXT.shuffleBtn[lang]}
              </button>
            )}

            {searchResults && (
              <button
                onClick={handleClearSearch}
                className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1.5 rounded-md border-0 cursor-pointer active:scale-95 hover:bg-emerald-100 transition-all uppercase tracking-wider"
              >
                {UI_TEXT.resetBtn[lang]}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-[10px] text-amber-600 font-bold ml-1">
            ⚠️ {error}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentGigs.map((gig, idx) => {
            const isExpanded = !!expandedGigs[gig.name];
            return (
              <div 
                key={idx}
                className="bg-white border border-gray-100 shadow-xs p-5 rounded-[2rem] flex flex-col justify-between hover:border-emerald-150 hover:shadow-sm transition-all relative overflow-hidden group"
              >
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#008069]/5 rounded-bl-3xl pointer-events-none group-hover:scale-125 transition-transform" />
              
              {/* Save/Bookmark Icon Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleSaveGig(gig);
                }}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-400 hover:text-[#008069] transition-all cursor-pointer active:scale-90 flex items-center justify-center"
                title={savedGigs.some((g) => g.name === gig.name) ? "Remove from Saved" : "Save Earning Idea"}
              >
                <Bookmark 
                  className="w-3.5 h-3.5" 
                  fill={savedGigs.some((g) => g.name === gig.name) ? "#008069" : "none"} 
                  color={savedGigs.some((g) => g.name === gig.name) ? "#008069" : "currentColor"}
                />
              </button>

              <div>
                {/* Compatibility Badges */}
                <div className="flex flex-wrap gap-1 mb-2 pr-9">
                  {gig.popularLabel && (
                    <span className="bg-amber-50 text-amber-700 border border-amber-150 text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      🔥 {gig.popularLabel}
                    </span>
                  )}
                  <span className="bg-blue-50 text-blue-700 border border-blue-150 text-[7px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {lang === "hi" ? `कक्षा ${gig.minClass || "10"}+ सुरक्षित` : `Class ${gig.minClass || "10"}+ safe`}
                  </span>
                </div>

                {/* 💼 Verified Pocket-Money Gig Name */}
                <div className="flex items-start gap-2.5">
                  <span className="text-md shrink-0 mt-0.5">💼</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800 tracking-tight leading-tight group-hover:text-[#005c4b] transition-colors">
                      {gig.name}
                    </h4>
                  </div>
                </div>

                {/* Earning and Commitment Info Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-500" /> {UI_TEXT.expectedEarning[lang]}
                    </span>
                    <span className="text-[10px] font-black text-slate-700 mt-0.5">
                      {gig.earnings}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500" /> {UI_TEXT.commitment[lang]}
                    </span>
                    <span className="text-[10px] font-black text-slate-700 mt-0.5">
                      {gig.commitment}
                    </span>
                  </div>
                </div>

                {/* 🎯 What you have to do */}
                <div className="mt-4 border-t border-gray-100 pt-3.5">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-indigo-500" /> {UI_TEXT.whatToDo[lang]}
                  </span>
                  <p className="text-[11px] font-semibold text-slate-600 leading-normal mt-1">
                    {gig.description}
                  </p>
                </div>

                {/* Skills Needed */}
                <div className="mt-3.5">
                  <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-slate-500" /> {UI_TEXT.skillsNeeded[lang]} ({lang === "hi" ? "शुरुआती अनुकूल" : "Beginner Friendly"})
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {gig.skills.map((skill, sIdx) => (
                      <span key={sIdx} className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ➕ "See More Details" Expandable toggle button */}
                <div className="mt-4 pt-3 border-t border-dashed border-slate-150 flex justify-center">
                  <button
                    type="button"
                    onClick={() => toggleGigDetails(gig.name)}
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#008069] hover:text-[#005c4b] rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <span>{lang === "hi" ? "पूर्ण विवरण छिपाएं" : lang === "en" ? "Hide Full Details" : "Hide Full Details"}</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>{lang === "hi" ? "और अधिक विवरण देखें (रोडमैप, सीक्रेट्स और भुगतान)" : lang === "en" ? "See More Details (Roadmap, Secrets & Pay)" : "See More Details (Roadmap, Secrets & Pay)"}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-[#008069] animate-bounce" />
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Sections containing Secret, Roadmap, Payment and Reality Check */}
                {isExpanded && (
                  <div className="mt-4 flex flex-col gap-3.5 border-t border-dashed border-gray-150 pt-3.5 animate-fadeIn">
                    {/* 🕵️‍♂️ Why it's a Secret */}
                    {gig.whySecret && (
                      <div className="bg-emerald-50/50 border border-emerald-100/80 p-3 rounded-2xl">
                        <span className="text-[8px] font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                          🕵️‍♂️ {UI_TEXT.whySecret[lang]}
                        </span>
                        <p className="text-[10px] font-bold text-emerald-950 leading-normal mt-1">
                          {gig.whySecret}
                        </p>
                      </div>
                    )}

                    {/* 🗺️ The Mobile Roadmap */}
                    {gig.mobileRoadmap && Array.isArray(gig.mobileRoadmap) && gig.mobileRoadmap.length > 0 && (
                      <div className="border-t border-gray-100/50 pt-3">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          🗺️ {UI_TEXT.mobileRoadmap[lang]} ({lang === "hi" ? "4 आसान चरण" : "4 Easy Steps"})
                        </span>
                        <div className="flex flex-col gap-1.5 mt-2">
                          {gig.mobileRoadmap.map((step, sIdx) => (
                            <div key={sIdx} className="flex gap-2 items-start">
                              <span className="bg-emerald-100 text-emerald-800 text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <p className="text-[10px] font-semibold text-slate-600 leading-snug">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 💸 Indian Payment Solution */}
                    {gig.paymentSolution && (
                      <div className="border-t border-gray-100/50 pt-3">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                          💸 {UI_TEXT.paymentSolution[lang]}
                        </span>
                        <p className="text-[10px] font-bold text-slate-800 leading-normal mt-1 flex items-center gap-1.5">
                          <span className="text-emerald-600">🇮🇳</span> {gig.paymentSolution}
                        </p>
                      </div>
                    )}

                    {/* ⚖️ Reality Check */}
                    {gig.realityCheck && (
                      <div className="bg-amber-50/40 border border-amber-100 p-2.5 rounded-2xl">
                        <span className="text-[8px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                          ⚖️ {UI_TEXT.realityCheck[lang]}
                        </span>
                        <p className="text-[9px] font-bold text-amber-900 leading-snug mt-1">
                          {gig.realityCheck}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Verified Apply Button */}
              <div className="mt-4 pt-3.5 border-t border-gray-150 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onAskMitra(
                      lang === "hi"
                        ? `बधाई हो भाई! मुझे इस काम "${gig.name}" के बारे में एकदम शुरुआत से, नर्सरी लेवल पर समझाओ। इसे कहाँ से और कैसे करना है, और पैसे कैसे कमाएँ? एकदम ग्राउंड लेवल से गाइड करो ताकि मैं बिना किसी गलती के इसे कर सकूँ।`
                        : `Bhai, mujhe is gig "${gig.name}" ke baare me ekdam shuruaat se, nursery level par simple steps me samjhao. Kaise start karein, kaha se kaam milega, aur payment kaise nikalenge? Ground level se fully explain karo.`
                    );
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-800 text-[10px] font-black rounded-xl border border-amber-200/50 transition-all cursor-pointer uppercase tracking-wider shadow-xs active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>{lang === "hi" ? "एआई मित्रा से स्टेप-बाय-स्टेप समझें" : "Ask AI Step-by-Step Guide"}</span>
                </button>

                <a
                  href={gig.applyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#008069] hover:bg-[#005c4b] text-white text-[10px] font-black rounded-xl transition-all shadow-xs shrink-0 select-none border-0 uppercase tracking-wider"
                >
                  {lang === "hi" ? "100% मुफ्त आवेदन करें" : lang === "en" ? "Apply 100% Free" : "Apply 100% Free"} <ExternalLink className="w-3 h-3 text-white" />
                </a>
                <p className="text-[8px] text-[#008069] font-black text-center uppercase tracking-widest leading-none mt-1 shrink-0">
                  {lang === "hi" ? "🛡️ 100% मुफ्त सुरक्षित आवेदन लिंक" : "🛡️ 100% Free Safe Application Link"}
                </p>
              </div>
            </div>
            );
          })}
        </div>

        {/* Safety Guarantee Footer */}
        <div className="mt-4 p-4 border border-dashed border-[#008069]/30 rounded-2xl bg-emerald-50/10 text-center">
          <p className="text-[9px] font-semibold text-slate-500 italic">
            🚨 <strong>{lang === "hi" ? "सुरक्षा गारंटी" : "Safety Guarantee"}:</strong> {
              lang === "hi" 
                ? '"फ्यूचर मित्रा सत्यापित करता है कि यह प्लेटफॉर्म कोई पैसा नहीं मांगता है। नौकरी या सत्यापन जमा के लिए किसी को कभी भुगतान न करें।"'
                : lang === "en"
                ? '"Future Mitra verifies that this platform does NOT ask for any money. Never pay anyone for a job or verification deposit."'
                : '"Future Mitra verifies that this platform does NOT ask for any money. Never pay anyone for a job or verification deposit."'
            }
          </p>
          <button
            onClick={() => onAskMitra(
              lang === "hi" 
                ? "दोस्त, ऑनलाइन छात्र माइक्रो-जॉब्स चुनते समय फर्जी नियोक्ताओं को कैसे पहचानें?"
                : lang === "en"
                ? "Dost, how to identify fake recruiters when choosing online student micro-jobs?"
                : "Dost, online student micro-jobs or remote part-time gigs choose karte samay fake recruiters ko kaise pehchanein?"
            )}
            className="mt-2 text-[9px] font-extrabold text-[#008069] bg-transparent border-0 underline hover:text-[#005c4b] cursor-pointer"
          >
            {lang === "hi"
              ? "मित्रा से पूछें: नकली ऑनलाइन नौकरियों से पूरी तरह सुरक्षित कैसे रहें?"
              : lang === "en"
              ? "Ask Mitra: How to stay fully safe from fake online jobs?"
              : "Ask Mitra: How to stay fully safe from fake online jobs?"
            }
          </button>
        </div>
      </div>
    </div>
  );
};
