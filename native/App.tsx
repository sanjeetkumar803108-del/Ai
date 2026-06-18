import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NamaskarSplash } from "./src/components/NamaskarSplash";
import { AntiScamWarning } from "./src/components/AntiScamWarning";

const { width } = Dimensions.get("window");

// Mock Indian State Scholarships & Sarkari Yojana Data
const SCHEME_DATA = [
  {
    id: "nsp-1",
    name: "National Scholarship Portal (NSP)",
    category: "Scholarship",
    deadline: "30th Sep 2026",
    rules: "Family Income < ₹2.5 LPA, Class 12th > 50%",
    sizeConstraint: "Photo < 50KB, Income Cert < 200KB",
    benefit: "₹10,000 to ₹25,000 per year",
    desc: "National level financial aid for higher secondary, college & university students.",
    icon: "school-outline",
    bg: "#E6F0FA",
    color: "#2563EB"
  },
  {
    id: "up-sc-1",
    name: "UP Pre & Post Matric Scholarship",
    category: "Scholarship",
    deadline: "15th Oct 2026",
    rules: "UP Domicile, Family Income < ₹2.0 LPA",
    sizeConstraint: "PDF Documents < 150KB",
    benefit: "Full Tuition Fee Reimbursement + Monthly Allowance",
    desc: "Fee reimbursement scheme for UP state students across post-matric & degree modules.",
    icon: "journal-outline",
    bg: "#FEF3C7",
    color: "#D97706"
  },
  {
    id: "pm-kushal-1",
    name: "PM Kaushal Vikas Yojana (PMKVY 4.0)",
    category: "Skill Dev",
    deadline: "Ongoing Application",
    rules: "Indian Citizen aged 15-45, Matric Pass",
    sizeConstraint: "Aadhaar Card < 100KB",
    benefit: "Free Skill Training + Govt of India Certification",
    desc: "National skill acquisition program supporting youth employability with full sponsorship.",
    icon: "ribbon-outline",
    bg: "#E0F2FE",
    color: "#0284C7"
  },
  {
    id: "mhrd-girl-1",
    name: "Pragati Scholarship for Girl Students",
    category: "Technical Edu",
    deadline: "31st Dec 2026",
    rules: "Maximum 2 daughters per family, Degree or Diploma",
    sizeConstraint: "JPEG Copy < 100KB",
    benefit: "₹50,000 per annum for course fee & devices",
    desc: "Empowering young girl students pursuing engineering or vocational training titles.",
    icon: "woman-outline",
    bg: "#FCE7F3",
    color: "#DB2777"
  },
];

// Carousel Slides representing the "Swagat Hai" features / live news items in web
const CAROUSEL_NEWS = [
  {
    id: "news-1",
    title: "🔥 LIVE Portal: PM-JAY Ayushman Bharat 2026",
    category: "Health Welfare",
    summary: "Health insurance benefit limit upgraded up to ₹5 Lakh per year for active cardholders. Click to check state credentials.",
    benefit: "₹5,00,000 Free Treatment List",
    tag: "Active",
    link: "https://dashboard.pmjay.gov.in"
  },
  {
    id: "news-2",
    title: "🎓 National Scholarship (NSP) Portal Live Now",
    category: "Education Support",
    summary: "Registration forms for college students are officially active. Link Aadhaar cards directly next to avoid verification hold-ups.",
    benefit: "Direct Benefit Transfer (DBT)",
    tag: "Updated Today",
    link: "https://scholarships.gov.in"
  },
  {
    id: "news-3",
    title: "🌾 PM-Kisan 17th Installment Status Out",
    category: "Farmers Subsidy",
    summary: "Double-check your DBT link status in our Digi-cabinet immediately to prevent clearance delay checks.",
    benefit: "Double Income Support Verification",
    tag: "Urgent Check",
    link: "https://pmkisan.gov.in"
  }
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState("home"); // "home" | "schemes" | "chat" | "guide" | "tools"
  
  // News Carousel Controller
  const [carouselIndex, setCarouselIndex] = useState(0);

  // States of Form Assistant
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScheme, setSelectedScheme] = useState<any>(SCHEME_DATA[0]);
  const [userInputName, setUserInputName] = useState("Sanjeet Kumar");
  const [userInputIncome, setUserInputIncome] = useState("1,80,000");
  const [isPhotoCompressed, setIsPhotoCompressed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  
  // Interactive "Bade Bhai Advice AI" Chat Logic
  const [aiPrompt, setAiPrompt] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "bhai", text: string }>>([
    { sender: "bhai", text: "Namaste Sanjeet bhai! Main aapka bada bhai hoon. Bihar pre-matric, NSP details ho ya padhai ki chinta—mujhe bejhijhak batayein!" }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  // Stats / streak counters
  const [streakDays, setStreakDays] = useState(12);

  // Auto carousel slide loop (simulating responsive web slideshow)
  useEffect(() => {
    if (showSplash) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_NEWS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [showSplash]);

  if (showSplash) {
    return <NamaskarSplash onComplete={() => setShowSplash(false)} />;
  }

  // Document Compressor simulator
  const handleCompress = () => {
    setStatusMessage("Compressing JPEG Certificate...");
    setTimeout(() => {
      setIsPhotoCompressed(true);
      setStatusMessage("✅ Success: JPEG resized to 42KB! NSP guidelines passed.");
      Alert.alert(
        "Auto-Compression Complete",
        "Form Mitra has successfully optimized your income certificate copy to exactly 42KB, matching official state caps."
      );
    }, 1200);
  };

  // Empathetic Elder Brother consult chat logic
  const handleChatSend = async () => {
    if (!aiPrompt.trim()) return;
    
    const userMsgText = aiPrompt;
    setChatHistory((prev) => [...prev, { sender: "user", text: userMsgText }]);
    setAiPrompt("");
    setAiLoading(true);

    try {
      const response = await fetch("/api/bade-bhai-advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: userMsgText }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        setChatHistory((prev) => [...prev, { sender: "bhai", text: data.reply }]);
      } else {
        // Precise Hindi-language fallbacks
        setTimeout(() => {
          let fallbackReply = `Mere bhai, tumhare sawal ka bade bhai ke paas seedha hal hai: `;
          const query = userMsgText.toLowerCase();
          
          if (query.includes("stress") || query.includes("sad") || query.includes("fail") || query.includes("marks") || query.includes("board")) {
            fallbackReply += "Sanjeet bhai, exams and marks humari kabliyat ka chota panna hai, poora jeevan nahi. Thoda dhyan hatane ke liye dosto se milo ya mere se baatein karo, chinta mat rakhna!";
          } else if (query.includes("nsp") || query.includes("scholarship")) {
            fallbackReply += "National Scholarship Portal me income certificate sub-limit 2.5 LPA hai. Aapne jo certificate apply kiya hai, uski online receipt register karke ready rakhein. Kuch bhi dikkat aayegi to tumhara bhai hai na madad ke liye!";
          } else if (query.includes("bihar") || query.includes("up")) {
            fallbackReply += "Bihar aur UP state scholarships ke verify ho jane par notification direct aapke Digi-Cabinet me notification status ke sath push hoga!";
          } else {
            fallbackReply += "Har mushkil ke samne himmat mat haariye. Padhai ho ya document verification, dhyan se ek-ek step poora karenge to sab standard tareeqe se hal ho jayega. Hum dono bhai hai na!";
          }
          setChatHistory((prev) => [...prev, { sender: "bhai", text: fallbackReply }]);
        }, 1100);
      }
    } catch {
      setChatHistory((prev) => [...prev, { sender: "bhai", text: "Bhaiya, technology me thodi rukawat aayi hai par aapka bhai ready hai. Kuch poonchna hai to fir se confirm kariye!" }]);
    } finally {
      setAiLoading(false);
    }
  };

  const currentNews = CAROUSEL_NEWS[carouselIndex];

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" id="status-bar" />

      {/* Premium Web-Matching Light Top Bar */}
      <View style={styles.appHeader}>
        <View style={styles.logoBadgeContainer}>
          <View style={styles.tealLogoBg}>
            <Ionicons name="sparkles" size={16} color="#ffffff" />
          </View>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.appTitle}>FORM MITRA</Text>
            <Text style={styles.appSubtitle}>AAPKA AI SATHI 🤝</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity 
            style={styles.streakBadge}
            onPress={() => Alert.alert("Abhyaas Streak", `Bahut badhiya! Aap rozana ${streakDays} dino se cyber alerts and yojana guidelines check kar rahe hain. Har roz seekhna jari rakhein!`)}
            activeOpacity={0.8}
          >
            <Ionicons name="flame" size={14} color="#D97706" />
            <Text style={styles.streakText}>{streakDays} Days</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.bellIconBtn}
            onPress={() => Alert.alert("Mitra Updates", "Sanjeet bhaiya, Bihar Post-Matric and Ayushman modules ke registration live updates are verified safe!")}
          >
            <View style={styles.bellUnreadDot} />
            <Ionicons name="notifications-outline" size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Anti-Scam Warning Banner (Required prominently) */}
        <AntiScamWarning />

        {activeTab === "home" && (
          <View>
            
            {/* Swagat Header Banner */}
            <View style={styles.swagatBanner}>
              <View style={styles.swagatInsideRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.swagatSub}>WELCOME BACK</Text>
                  <Text style={styles.swagatTitle}>Namaste, Sanjeet Bhai!</Text>
                  <Text style={styles.swagatBody}>
                    National level schemes, smart photo fitment aur official portal validation pane ke liye aapka dashboard ready hai.
                  </Text>
                </View>
                <View style={styles.verifiedRoundBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#008069" />
                </View>
              </View>
              <View style={styles.swagatBorderFooter}>
                <Ionicons name="shield-checkmark" size={14} color="#008069" />
                <Text style={styles.swagatFooterLabel}>Verified Secure Connection (SSL-Encrypt)</Text>
              </View>
            </View>

            {/* Premium Dynamic Carousel Slider (Exactly replicating the Web News Slider) */}
            <View style={styles.carouselOuterWrap}>
              <View style={styles.carouselSectionHeader}>
                <View>
                  <Text style={styles.carouselSectionTitle}>LATEST SCHEME HIGHLIGHTS</Text>
                  <Text style={styles.carouselSectionSub}>Aapke state state-wise auto-updates ✨</Text>
                </View>
                <View style={styles.carouselPagesDotRow}>
                  {CAROUSEL_NEWS.map((_, i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.carouselDot, 
                        carouselIndex === i ? styles.carouselDotActive : null
                      ]} 
                    />
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                style={styles.carouselCard}
                activeOpacity={0.9}
                onPress={() => {
                  Alert.alert(CAROUSEL_NEWS[carouselIndex].category, CAROUSEL_NEWS[carouselIndex].summary);
                }}
              >
                <View style={styles.carouselRowHeader}>
                  <View style={styles.carouselCategoryBadge}>
                    <Text style={styles.carouselCategoryText}>{currentNews.category}</Text>
                  </View>
                  <View style={styles.carouselActiveTag}>
                    <View style={styles.greenPulseDot} />
                    <Text style={styles.carouselTagText}>{currentNews.tag}</Text>
                  </View>
                </View>

                <Text style={styles.carouselTitleText}>{currentNews.title}</Text>
                <Text style={styles.carouselContentText}>{currentNews.summary}</Text>

                <View style={styles.carouselCardFooter}>
                  <View style={styles.benefitContainer}>
                    <Ionicons name="gift-outline" size={14} color="#008069" />
                    <Text style={styles.benefitValueText}>{currentNews.benefit}</Text>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={22} color="#008069" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Elder Brother Chat Advisor Desk Promo */}
            <View style={styles.bhaiQuickPromoCard}>
              <View style={styles.bhaiPromoIconBg}>
                <Ionicons name="chatbubbles" size={20} color="#008069" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bhaiPromoTitle}>Bade Bhai Se Salah Desk</Text>
                <Text style={styles.bhaiPromoBody}>Exam stress ho ya registration guidelines, direct chat karke tension door karein.</Text>
                <TouchableOpacity 
                  style={styles.bhaiPromoBtn}
                  onPress={() => setActiveTab("chat")}
                >
                  <Text style={styles.bhaiPromoBtnText}>Bhaiya Se Baat Karein</Text>
                  <Ionicons name="arrow-forward" size={12} color="#008069" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Overview Grid from Web */}
            <View style={styles.gridSectionHeading}>
              <Text style={styles.sectionHeadingTitle}>MOST POPULAR SERVICES</Text>
              <Text style={styles.sectionHeadingSub}>Auto-fit documents, verify constraints instantly</Text>
            </View>

            <View style={styles.servicesGridRow}>
              <TouchableOpacity 
                style={styles.serviceItemCard}
                onPress={() => setActiveTab("schemes")}
              >
                <View style={[styles.serviceIconFrame, { backgroundColor: "#E6F4EA" }]}>
                  <Ionicons name="school" size={20} color="#008069" />
                </View>
                <Text style={styles.serviceLabel}>Schemes Portal</Text>
                <Text style={styles.serviceDesc}>Search verified links</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.serviceItemCard}
                onPress={() => setActiveTab("guide")}
              >
                <View style={[styles.serviceIconFrame, { backgroundColor: "#FFF4E5" }]}>
                  <Ionicons name="document-text" size={20} color="#D97706" />
                </View>
                <Text style={styles.serviceLabel}>Auto-Fit Sizes</Text>
                <Text style={styles.serviceDesc}>Under 50KB tool</Text>
              </TouchableOpacity>
            </View>

          </View>
        )}

        {activeTab === "schemes" && (
          <View>
            <View style={styles.sectionTitleHeader}>
              <Text style={styles.tabSectionTitle}>VERIFIED SARKARI PORTALS</Text>
              <Text style={styles.tabSectionSub}>Click any card to load smart constraints assistant</Text>
            </View>

            {/* Live Search bar */}
            <View style={styles.searchBoxWrapper}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchTextInput}
                placeholder="Search state schemes (NSP, UP, Pragati)..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>

            {SCHEME_DATA.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
              <View key={s.id} style={styles.premiumSchemeCard}>
                <View style={styles.schemeCardHeadRow}>
                  <View style={[styles.schemeIconCircle, { backgroundColor: s.bg }]}>
                    <Ionicons name={s.icon as any} size={20} color={s.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.schemeCategoryLabel}>{s.category}</Text>
                    <Text style={styles.schemeNameHeader}>{s.name}</Text>
                  </View>
                </View>

                <Text style={styles.schemeDetailedDesc}>{s.desc}</Text>

                <View style={styles.schemeMetricShelf}>
                  <View style={styles.metricItemColumn}>
                    <Text style={styles.metricTitleLabel}>Benefit Value</Text>
                    <Text style={styles.metricValHighlightText}>{s.benefit}</Text>
                  </View>
                  <View style={styles.metricItemColumn}>
                    <Text style={styles.metricTitleLabel}>Last Date</Text>
                    <Text style={styles.metricValRedText}>{s.deadline}</Text>
                  </View>
                </View>

                <View style={styles.requirementsShelf}>
                  <Ionicons name="information-circle-outline" size={14} color="#4B5563" />
                  <Text style={styles.requirementsMiniText}>
                    <Text style={{ fontWeight: "700" }}>Rules: </Text>{s.rules}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.schemeSetupBtn}
                  onPress={() => {
                    setSelectedScheme(s);
                    setActiveTab("guide");
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.schemeSetupBtnText}>Apply with Smart Form Helper</Text>
                  <Ionicons name="arrow-forward-sharp" size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === "chat" && (
          <View style={styles.chatSectionContainer}>
            <View style={styles.chatIntroHeader}>
              <View style={styles.bhaiAvatarBig}>
                <Text style={styles.bhaiInitials}>🙏</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bhaiHeadlineMain}>Sanjeet bhai, tension khatam karo! 🤝</Text>
                <Text style={styles.bhaiSubtitleMain}>Ask me anything in Hinglish, English or Hindi.</Text>
              </View>
            </View>

            {/* Chat History View */}
            <View style={styles.chatHistoryBox}>
              {chatHistory.map((msg, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.chatHistoryRow,
                    msg.sender === "user" ? styles.chatMsgUser : styles.chatMsgBhai
                  ]}
                >
                  {msg.sender === "bhai" && (
                    <View style={styles.bhaiMiniBadge}>
                      <Text style={{ fontSize: 10 }}>🧑‍💻</Text>
                    </View>
                  )}
                  <View style={[
                    styles.chatBubble,
                    msg.sender === "user" ? styles.bubbleUserBg : styles.bubbleBhaiBg
                  ]}>
                    <Text style={[
                      styles.chatTextText,
                      msg.sender === "user" ? styles.textUserColor : styles.textBhaiColor
                    ]}>
                      {msg.text}
                    </Text>
                  </View>
                </View>
              ))}

              {aiLoading && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, marginVertical: 8 }}>
                  <ActivityIndicator size="small" color="#008069" />
                  <Text style={{ fontSize: 11, fontStyle: "italic", color: "#6B7280" }}>Apne bade bhai se behtarin salah taiyar ho rahi hai...</Text>
                </View>
              )}
            </View>

            {/* AI Prompts Suggestions */}
            <Text style={styles.suggestionTitle}>💡 QUICK ASK PROMPTS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsRowScroll}>
              <TouchableOpacity 
                style={styles.suggestionBtn}
                onPress={() => setAiPrompt("Board exam ya jobs details ko lekar tension ho rahi hai...")}
              >
                <Text style={styles.suggestionBtnText}>📚 Career Stress/Chinta</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.suggestionBtn}
                onPress={() => setAiPrompt("NSP Income certificate guidelines kya hain, Sanjeet bhai ke liye batao?")}
              >
                <Text style={styles.suggestionBtnText}>🎓 NSP Help</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.suggestionBtn}
                onPress={() => setAiPrompt("Scholarship rejected double checking kaise karein?")}
              >
                <Text style={styles.suggestionBtnText}>🛡️ Reject Prevent</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Message Input Box */}
            <View style={styles.messageInputStickyContainer}>
              <TextInput
                style={styles.chatTextInputField}
                value={aiPrompt}
                onChangeText={setAiPrompt}
                placeholder="Apne bade bhai se guidelines poochiye..."
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity 
                style={styles.chatSendBtnRound}
                onPress={handleChatSend}
                disabled={aiLoading}
              >
                <Ionicons name="send" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === "guide" && (
          <View>
            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircleGreen}>
                  <Ionicons name="document-text" size={18} color="#008069" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Smart Filling Helper</Text>
                  <Text style={styles.cardSubtitle}>Prepare files precisely below 50KB to pass state portal verification</Text>
                </View>
              </View>

              <View style={styles.selectedSchemeIndicator}>
                <Text style={styles.selectedSchemeLabel}>SCHEME SELECTED:</Text>
                <Text style={styles.selectedSchemeName}>
                  {selectedScheme ? selectedScheme.name : "National Scholarship Portal (NSP)"}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Applicant Full Name (As in Matric Record)</Text>
                <TextInput
                  style={styles.textInput}
                  value={userInputName}
                  onChangeText={setUserInputName}
                  placeholder="E.g. Sanjeet Kumar"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Annual Household Income (INR)</Text>
                <TextInput
                  style={styles.textInput}
                  value={userInputIncome}
                  onChangeText={setUserInputIncome}
                  placeholder="E.g. 1,80,000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.compressorContainer}>
                <Text style={styles.compressorHeading}>Document Fitment (Max Limit: 50KB)</Text>
                
                <View style={styles.compressorStatusRow}>
                  <Ionicons 
                    name={isPhotoCompressed ? "checkmark-circle" : "alert-circle"} 
                    size={22} 
                    color={isPhotoCompressed ? "#008069" : "#DC2626"} 
                  />
                  <Text style={styles.compressorStatusText}>
                    {isPhotoCompressed 
                      ? "Success: income_certificate_fit.png (42KB) optimized." 
                      : "Warning: document_preview.jpg (794KB) exceeds upload regulations."}
                  </Text>
                </View>

                {/* Touch friendly native button with minHeight 48px */}
                <TouchableOpacity 
                  style={styles.compressionBtnNative} 
                  onPress={handleCompress}
                  activeOpacity={0.8}
                >
                  <Text style={styles.compressionBtnText}>Fit & Compress Image (under 50KB)</Text>
                </TouchableOpacity>
              </View>

              {statusMessage ? (
                <View style={styles.statusToast}>
                  <Text style={styles.statusToastText}>{statusMessage}</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {activeTab === "tools" && (
          <View>
            <View style={styles.sectionTitleHeader}>
              <Text style={styles.tabSectionTitle}>🔒 DIGI-CABINET DIGITAL VAULT</Text>
              <Text style={styles.tabSectionSub}>Offline-first database encrypted on your mobile device</Text>
            </View>

            <View style={styles.vaultMetricCard}>
              <View style={styles.vaultCircularProgressMock}>
                <Ionicons name="lock-closed" size={24} color="#008069" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.vaultTitle}>Device Secure Storage</Text>
                <Text style={styles.vaultSubtitle}>2 documents pre-compressed & encrypted</Text>
              </View>
            </View>

            {/* Offline secure cache items */}
            <View style={styles.cabinetItem}>
              <View style={styles.cabinetItemInner}>
                <View style={styles.documentIconFrame}>
                  <Ionicons name="document-text" size={20} color="#008069" />
                </View>
                <View style={styles.cabinetItemTextWrap}>
                  <Text style={styles.cabinetItemName}>Income_Certificate_2026.pdf</Text>
                  <Text style={styles.cabinetItemMeta}>Size: 180KB • Offline Checked</Text>
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#008069" />
            </View>

            <View style={styles.cabinetItem}>
              <View style={styles.cabinetItemInner}>
                <View style={styles.documentIconFrame}>
                  <Ionicons name="image" size={20} color="#008069" />
                </View>
                <View style={styles.cabinetItemTextWrap}>
                  <Text style={styles.cabinetItemName}>Matric_Mark_Sheet_Comp.jpg</Text>
                  <Text style={styles.cabinetItemMeta}>Size: 42KB • NSP Compliant</Text>
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#008069" />
            </View>

            {/* Anti Fraud checklist from web */}
            <View style={styles.checklistOutlineArea}>
              <Text style={styles.checklistHeadline}>🛡️ STUDENT SECURITY SAFEGUARD CHECKS</Text>
              
              <View style={styles.checkListItemLine}>
                <Ionicons name="checkmark-circle-sharp" size={16} color="#008069" />
                <Text style={styles.checkListenText}>Domain ends in official <Text style={{fontWeight: "bold"}}>.gov.in</Text> verified list</Text>
              </View>

              <View style={styles.checkListItemLine}>
                <Ionicons name="checkmark-circle-sharp" size={16} color="#008069" />
                <Text style={styles.checkListenText}>No WhatsApp SMS links click redirects approved</Text>
              </View>

              <View style={styles.checkListItemLine}>
                <Ionicons name="checkmark-circle-sharp" size={16} color="#008069" />
                <Text style={styles.checkListenText}>Secure SSL certification locker active</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Premium Centered 5-Item Light Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "home" && styles.tabItemActive]}
          onPress={() => setActiveTab("home")}
          activeOpacity={0.85}
        >
          <Ionicons
            name="home-outline"
            size={18}
            color={activeTab === "home" ? "#008069" : "#6B7280"}
          />
          <Text style={[styles.tabLabel, activeTab === "home" && styles.tabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "schemes" && styles.tabItemActive]}
          onPress={() => setActiveTab("schemes")}
          activeOpacity={0.85}
        >
          <Ionicons
            name="book-outline"
            size={18}
            color={activeTab === "schemes" ? "#008069" : "#6B7280"}
          />
          <Text style={[styles.tabLabel, activeTab === "schemes" && styles.tabLabelActive]}>
            Schemes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "chat" && styles.tabItemActive]}
          onPress={() => setActiveTab("chat")}
          activeOpacity={0.85}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={activeTab === "chat" ? "#008069" : "#6B7280"}
          />
          <Text style={[styles.tabLabel, activeTab === "chat" && styles.tabLabelActive]}>
            Mitra AI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "guide" && styles.tabItemActive]}
          onPress={() => setActiveTab("guide")}
          activeOpacity={0.85}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={activeTab === "guide" ? "#008069" : "#6B7280"}
          />
          <Text style={[styles.tabLabel, activeTab === "guide" && styles.tabLabelActive]}>
            Forms
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "tools" && styles.tabItemActive]}
          onPress={() => setActiveTab("tools")}
          activeOpacity={0.85}
        >
          <Ionicons
            name="construct-outline"
            size={18}
            color={activeTab === "tools" ? "#008069" : "#6B7280"}
          />
          <Text style={[styles.tabLabel, activeTab === "tools" && styles.tabLabelActive]}>
            Tools
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB", // Minimal crisp white/light gray background (Premium Light Theme)
  },
  appHeader: {
    height: 64,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 2,
  },
  logoBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tealLogoBg: {
    width: 32,
    height: 32,
    backgroundColor: "#008069", // Premium clean teal green
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flexDirection: "column",
  },
  appTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1F2937",
    letterSpacing: 0.8,
  },
  appSubtitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#008069",
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7", // Soft warm amber / golden
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCD34D",
    minHeight: 36,
    alignSelf: "center",
  },
  streakText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
  },
  bellIconBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#F3F4F6",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellUnreadDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderColor: "#ffffff",
    borderWidth: 1.5,
    zIndex: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110, // Generous padding to clear sticky tab bar completely
  },
  swagatBanner: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  swagatInsideRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  swagatSub: {
    fontSize: 9,
    fontWeight: "800",
    color: "#9CA3AF",
    letterSpacing: 1,
  },
  swagatTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginVertical: 4,
  },
  swagatBody: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    paddingRight: 6,
    fontWeight: "500",
  },
  verifiedRoundBadge: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(0, 128, 105, 0.08)",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  swagatBorderFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swagatFooterLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#008069",
  },
  carouselOuterWrap: {
    marginBottom: 16,
  },
  carouselSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  carouselSectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#6B7280",
    letterSpacing: 0.8,
  },
  carouselSectionSub: {
    fontSize: 9,
    fontWeight: "700",
    color: "#008069",
    marginTop: 2,
  },
  carouselPagesDotRow: {
    flexDirection: "row",
    gap: 4,
  },
  carouselDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#D1D5DB",
  },
  carouselDotActive: {
    width: 14,
    backgroundColor: "#008069",
  },
  carouselCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  carouselRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  carouselCategoryBadge: {
    backgroundColor: "rgba(0, 128, 105, 0.06)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 128, 105, 0.12)",
  },
  carouselCategoryText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#008069",
    textTransform: "uppercase",
  },
  carouselActiveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F3F4F6",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  carouselTagText: {
    fontSize: 9,
    fontWeight: "750",
    color: "#4B5563",
  },
  carouselTitleText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 6,
  },
  carouselContentText: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: "500",
  },
  carouselCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    paddingTop: 10,
  },
  benefitContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  benefitValueText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#008069",
  },
  bhaiQuickPromoCard: {
    backgroundColor: "#EEFaf6", // Sweet teal soft tinted block
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#D1E7DD",
  },
  bhaiPromoIconBg: {
    width: 38,
    height: 38,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#A3D4C4",
  },
  bhaiPromoTitle: {
    fontSize: 13,
    fontWeight: "850",
    color: "#0F5132",
  },
  bhaiPromoBody: {
    fontSize: 12,
    color: "#356854",
    marginTop: 4,
    lineHeight: 17,
    fontWeight: "500",
  },
  bhaiPromoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  bhaiPromoBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#008069",
  },
  gridSectionHeading: {
    marginBottom: 10,
    paddingLeft: 2,
  },
  sectionHeadingTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#6B7280",
    letterSpacing: 0.8,
  },
  sectionHeadingSub: {
    fontSize: 9,
    color: "#9CA3AF",
    marginTop: 2,
    fontWeight: "700",
  },
  servicesGridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  serviceItemCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 3,
    elevation: 1,
  },
  serviceIconFrame: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111827",
  },
  serviceDesc: {
    fontSize: 9,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "600",
  },
  sectionTitleHeader: {
    marginBottom: 14,
    paddingLeft: 2,
  },
  tabSectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#1F2937",
    letterSpacing: 0.8,
  },
  tabSectionSub: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "600",
  },
  searchBoxWrapper: {
    backgroundColor: "#ffffff",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 16,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "650",
  },
  premiumSchemeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  schemeCardHeadRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  schemeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  schemeCategoryLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  schemeNameHeader: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
    marginTop: 1,
  },
  schemeDetailedDesc: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    marginVertical: 12,
    fontWeight: "500",
  },
  schemeMetricShelf: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  metricItemColumn: {
    flex: 1,
  },
  metricTitleLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  metricValHighlightText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#008069",
    marginTop: 2,
  },
  metricValRedText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#DC2626",
    marginTop: 2,
  },
  requirementsShelf: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  requirementsMiniText: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "500",
    flex: 1,
  },
  schemeSetupBtn: {
    backgroundColor: "#008069",
    height: 44,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  schemeSetupBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff",
  },
  chatSectionContainer: {
    flex: 1,
  },
  chatIntroHeader: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  bhaiAvatarBig: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 128, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 128, 105, 0.15)",
  },
  bhaiInitials: {
    fontSize: 20,
  },
  bhaiHeadlineMain: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
  },
  bhaiSubtitleMain: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "700",
  },
  chatHistoryBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    minHeight: 220,
    marginBottom: 14,
    gap: 12,
  },
  chatHistoryRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  chatMsgUser: {
    justifyContent: "flex-end",
  },
  chatMsgBhai: {
    justifyContent: "flex-start",
  },
  bhaiMiniBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E6F3F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  chatBubble: {
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  bubbleUserBg: {
    backgroundColor: "#008069",
    borderBottomRightRadius: 2,
  },
  bubbleBhaiBg: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 2,
  },
  chatTextText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500",
  },
  textUserColor: {
    color: "#ffffff",
    fontWeight: "600",
  },
  textBhaiColor: {
    color: "#1F2937",
  },
  suggestionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#6B7280",
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 2,
  },
  promptsRowScroll: {
    paddingBottom: 14,
    gap: 8,
  },
  suggestionBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 36,
  },
  suggestionBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4B5563",
  },
  messageInputStickyContainer: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  chatTextInputField: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    color: "#1F2937",
    fontWeight: "600",
    paddingHorizontal: 10,
  },
  chatSendBtnRound: {
    width: 36,
    height: 36,
    backgroundColor: "#008069",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconCircleGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 128, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },
  cardSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  selectedSchemeIndicator: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "rgba(0, 128, 105, 0.15)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  selectedSchemeLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#008069",
    letterSpacing: 0.5,
  },
  selectedSchemeName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1F2937",
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4B5563",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#ffffff",
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "650",
  },
  compressorContainer: {
    marginTop: 6,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  compressorHeading: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  compressorStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  compressorStatusText: {
    fontSize: 11,
    color: "#4B5563",
    flex: 1,
    lineHeight: 16,
    fontWeight: "500",
  },
  compressionBtnNative: {
    backgroundColor: "#ffffff",
    height: 48, // Native touch-friendly, minimum height 48px
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#008069",
    justifyContent: "center",
    alignItems: "center",
  },
  compressionBtnText: {
    fontSize: 12,
    fontWeight: "850",
    color: "#008069",
  },
  statusToast: {
    backgroundColor: "rgba(0, 128, 105, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 128, 105, 0.15)",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  statusToastText: {
    fontSize: 11,
    color: "#008069",
    fontWeight: "800",
    textAlign: "center",
  },
  vaultMetricCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  vaultCircularProgressMock: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 128, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 128, 105, 0.15)",
  },
  vaultTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },
  vaultSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "600",
  },
  cabinetItem: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cabinetItemInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  documentIconFrame: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0, 128, 105, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  cabinetItemTextWrap: {
    flex: 1,
  },
  cabinetItemName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1F2937",
  },
  cabinetItemMeta: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 1,
    fontWeight: "600",
  },
  checklistOutlineArea: {
    backgroundColor: "#EEFaf6",
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#D1E7DD",
    gap: 10,
  },
  checklistHeadline: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F5132",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  checkListItemLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkListenText: {
    fontSize: 11.5,
    color: "#356854",
    fontWeight: "600",
    flex: 1,
  },
  bottomTabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64, // Native native tabbar matching exactly
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  tabItemActive: {
    backgroundColor: "rgba(0, 128, 105, 0.05)",
    borderRadius: 12,
    marginVertical: 4,
    marginHorizontal: 4,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "#6B7280",
    marginTop: 2,
  },
  tabLabelActive: {
    fontWeight: "900",
    color: "#008069",
  },
});
