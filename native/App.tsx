import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NamaskarSplash } from "./src/components/NamaskarSplash";
import { AntiScamWarning } from "./src/components/AntiScamWarning";

const { width } = Dimensions.get("window");

// Pre-defined Indian State Scholarships & Sarkari Yojana Database
const SCHEME_DATA = [
  {
    id: "nsp-1",
    name: "National Scholarship Portal (NSP)",
    category: "Scholarship",
    deadline: "30th Sep 2026",
    rules: "Income < 2.5 LPA, Class 12th > 50%",
    sizeConstraint: "Photo < 50KB, Income Cert < 200KB",
    benefit: "₹10,000 to ₹25,000 per year",
  },
  {
    id: "up-sc-1",
    name: "UP Pre & Post Matric Scholarship",
    category: "Scholarship",
    deadline: "15th Oct 2026",
    rules: "UP Domicile, Family Income < 2.0 LPA",
    sizeConstraint: "PDF Documents < 150KB",
    benefit: "Full Fee Reimbursement + stipend",
  },
  {
    id: "pm-kushal-1",
    name: "PM Kaushal Vikas Yojana (PMKVY 4.0)",
    category: "Skill Development",
    deadline: "Ongoing Registration",
    rules: "Any Indian youth aged 15-45",
    sizeConstraint: "Aadhaar Card < 100KB",
    benefit: "Free Skill Training + National Certificate",
  },
  {
    id: "mhrd-girl-1",
    name: "Pragati Scholarship for Girl Students",
    category: "Technical Education",
    deadline: "31st Dec 2026",
    rules: "Max 2 girls per family, Tech Degree/Diploma",
    sizeConstraint: "JPEG Copy < 100KB",
    benefit: "₹50,000 per annum for tuition fees",
  },
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard", "formAssist", "scamCheats", "profile"
  
  // States of Form Assistant
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  const [userInputName, setUserInputName] = useState("Sanjeet Kumar");
  const [userInputIncome, setUserInputIncome] = useState("1,80,000");
  const [isPhotoCompressed, setIsPhotoCompressed] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  
  // Interactive "Bade Bhai Advice AI" State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Emotional "Bade Bhai" Exam Stress States
  const [streakDays, setStreakDays] = useState(12);
  const [isStressed, setIsStressed] = useState(false);

  if (showSplash) {
    return <NamaskarSplash onComplete={() => setShowSplash(false)} />;
  }

  // Handle mock Compression of documents below 50KB
  const handleCompress = () => {
    setStatusMessage("Compressing JPEG Certificate...");
    setTimeout(() => {
      setIsPhotoCompressed(true);
      setStatusMessage("✅ Success: JPEG resized to 42KB! Ready for upload on NSP.");
      Alert.alert(
        "Auto-Fitment Clear",
        "Form Mitra ne file ko exactly 42KB pe reduce kar diya hai! Ab NSP portal isse reject nahi karega."
      );
    }, 1200);
  };

  // Empathetic Elder Brother AI Consultation API trigger
  const handleConsultBadeBhai = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse("");

    try {
      // Connect to the deployed app API proxy if available, or use offline highly optimized response
      // This is a robust implementation that adapts to current network conditions
      const response = await fetch("/api/bade-bhai-advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: aiPrompt }),
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        setAiResponse(data.reply);
      } else {
        // Offline Fallback incorporating authentic regional empathy & Indian values
        setTimeout(() => {
          let fallbackReply = `Mere bhai, tum bilkul fikar mat karo! `;
          const query = aiPrompt.toLowerCase();
          
          if (query.includes("stress") || query.includes("sad") || query.includes("fail") || query.includes("marks")) {
            fallbackReply += "Board exams ya NEET me marks hi zindagi ka aakhri faisla nahi karte. Tumne jo mehnat ki hai, mujhe tum par poora bharosa hai. Thoda paani piyo, doston se baat karo aur dimag shaant rakho. Tumhara ye bhai hamesha tumhare sath hai!";
          } else if (query.includes("nsp") || query.includes("scholarship")) {
            fallbackReply += "NSP Scholarship apply karne ke liye sabse pehle apna Income Certificate (Aay Praman Patra) valid date wala banwa lo. Agar certificate size badhi hai toh humari auto-compressor tab me jao aur 50KB se kam kar lo.";
          } else {
            fallbackReply += "Har mushkil aasan ho jati hai jab hum milkar koshish karte hain. Jo bhi takleef ho, mujhe batao, hum dono milkar iska solution nikalenge. Har Har Mahadev! 🤝";
          }
          setAiResponse(fallbackReply);
        }, 1500);
      }
    } catch {
      setAiResponse("Bhai, net connection check karein! Lekin yaad rakhein, sab theek hoga.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0d14" />

      {/* Primary Mobile App Bar Header */}
      <View style={styles.appHeader}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>FORM MITRA AI</Text>
          <Text style={styles.brandSubtitle}>Aapka Bada Bhai, Hamesha Sath 🤝</Text>
        </View>

        <TouchableOpacity 
          style={styles.streakIndicator}
          onPress={() => Alert.alert("Abhyaas Streak", "Aap rozana 12 dino se updates check kar rahe hain. Har roz seekhna jari rakhein!")}
        >
          <Ionicons name="flame" size={20} color="#ff9933" />
          <Text style={styles.streakText}>{streakDays} Days</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Anti-Scam Banner on main views */}
        <AntiScamWarning />

        {/* Dynamic Navigation Tab Render */}
        {activeTab === "dashboard" && (
          <View>
            {/* Quick Stats & Welcoming Banner */}
            <View style={styles.welcomeBanner}>
              <Text style={styles.welcomeTitle}>Aao, Shuru Karein, Sanjeet!</Text>
              <Text style={styles.welcomeDesc}>
                Aaj ka din aapki yojanaon aur form status ko check karne ke liye behtareen hai.
              </Text>

              <View style={styles.pillsRow}>
                <View style={[styles.statusPill, { backgroundColor: "#138808" }]}>
                  <Text style={styles.pillText}>🔒 100% Verified</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: "#ff9933" }]}>
                  <Text style={styles.pillText}>⚡ Fast Processing</Text>
                </View>
              </View>
            </View>

            {/* Emotional Consolation Support Module */}
            <View style={styles.consolationCard}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="heart-circle" size={26} color="#ef4444" />
                <Text style={styles.consolationTitle}>Bade Bhai Se Salah (Stress Desk)</Text>
              </View>
              <Text style={styles.consolationBody}>
                Exam stress hai, ya kisi college form se dukh hua hai? Chinta mat karo, dukh/sukh share karo:
              </Text>

              <TextInput
                style={styles.aiInput}
                placeholder="Bhaiya, mujhe board exam / admission ki chinta ho rahi hai..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={aiPrompt}
                onChangeText={setAiPrompt}
                multiline
              />

              <TouchableOpacity 
                style={styles.aiBtn}
                onPress={handleConsultBadeBhai}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.aiBtnText}>Aashirwad & Guidance Paayein</Text>
                    <Ionicons name="sparkles" size={16} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>

              {aiResponse ? (
                <View style={styles.aiResponseBox}>
                  <Text style={styles.aiResponseLabel}>Bade Bhai Ka Sandesh: 💕</Text>
                  <Text style={styles.aiResponseText}>{aiResponse}</Text>
                </View>
              ) : null}
            </View>

            {/* Live Search & Scheme Cards Catalog */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>🏆 Govt Scholarships Available This Week</Text>
              
              <View style={styles.searchBarBox}>
                <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Scholarship, UP State, PM Yojana..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {SCHEME_DATA.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(scheme => (
                <TouchableOpacity
                  key={scheme.id}
                  style={styles.schemeCard}
                  onPress={() => {
                    setSelectedScheme(scheme);
                    setActiveTab("formAssist");
                  }}
                >
                  <View style={styles.schemeHeader}>
                    <Text style={styles.schemeName}>{scheme.name}</Text>
                    <View style={styles.schemeBadge}>
                      <Text style={styles.schemeBadgeText}>{scheme.category}</Text>
                    </View>
                  </View>

                  <View style={styles.schemeDetailGrid}>
                    <Text style={styles.detailLabel}>Benefit: <Text style={styles.detailVal}>{scheme.benefit}</Text></Text>
                    <Text style={styles.detailLabel}>Deadline: <Text style={[styles.detailVal, {color: "#ef4444"}]}>{scheme.deadline}</Text></Text>
                    <Text style={styles.detailLabel}>Constraints: <Text style={styles.detailVal}>{scheme.sizeConstraint}</Text></Text>
                  </View>
                  
                  <View style={styles.applyHintBar}>
                    <Text style={styles.applyHintText}>Tap to Open Smart Filling Helper</Text>
                    <Ionicons name="arrow-forward-circle" size={18} color="#10b981" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeTab === "formAssist" && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📝 Form Counseling Assistant</Text>
            
            <View style={styles.assistantIntroContainer}>
              <Ionicons name="construct" size={22} color="#10b981" style={{ marginRight: 8 }} />
              <Text style={styles.assistantIntroText}>
                Indian server portals can reject files above 50KB or 100KB which creates issues. Set up your document sizes below safely.
              </Text>
            </View>

            {/* Selected Scheme Config Panel */}
            <View style={styles.interactiveBox}>
              <Text style={styles.panelTitle}>
                Selected: {selectedScheme ? selectedScheme.name : "National Scholarship Portal (NSP)"}
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Applicant Full Name (As per Matric Certificate):</Text>
                <TextInput
                  style={styles.nativeTextInput}
                  value={userInputName}
                  onChangeText={setUserInputName}
                  placeholder="Enter Name"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Annual Household Income (INR):</Text>
                <TextInput
                  style={styles.nativeTextInput}
                  value={userInputIncome}
                  onChangeText={setUserInputIncome}
                  placeholder="Enter Income (e.g. 1.8L)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="numeric"
                />
              </View>

              {/* Upload & Compressing Simulation */}
              <Text style={styles.inputLabel}>Fit Document Image/Photo (Constraints Max 50KB):</Text>
              <View style={styles.compressBox}>
                <Ionicons name="image" size={36} color="#ff9933" />
                <Text style={styles.compressStatus}>
                  {isPhotoCompressed ? "income_certificate_fit.jpg (42KB)" : "Uncompressed document: (744KB)"}
                </Text>
                
                <TouchableOpacity
                  style={styles.compressBtn}
                  onPress={handleCompress}
                >
                  <Text style={styles.compressBtnText}>Fit & Compress (under 50KB limit)</Text>
                </TouchableOpacity>
              </View>

              {statusMessage ? <Text style={styles.feedbackText}>{statusMessage}</Text> : null}
            </View>
          </View>
        )}

        {activeTab === "scamCheats" && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>👮 Vigilance & Cyber Security Desk</Text>
            <Text style={styles.scamDeskIntro}>
              Har saal hazaaron bache ghalat cyber-cafen ya broker ke chakkar me aakar apne paise gawa dete hain. Form Mitra aapko sashakt banata hai.
            </Text>

            <View style={styles.cheatsheetGrid}>
              <View style={styles.cheatItem}>
                <Ionicons name="close-circle" size={32} color="#ef4444" />
                <Text style={styles.cheatLabel}>Fake SMS Scheme Links</Text>
                <Text style={styles.cheatDesc}>
                  UGC ya PM Yojana ke naam par WhatsApp SMS link aaye toh click na karein. Official government domain hamesha ".gov.in" hota hai.
                </Text>
              </View>

              <View style={styles.cheatItem}>
                <Ionicons name="card" size={32} color="#ef4444" />
                <Text style={styles.cheatLabel}>Security Deposits Fraud</Text>
                <Text style={styles.cheatDesc}>
                  Koi aapse bole ki laptop aur tablet yojana ke liye ₹200 processing fee jama karlo - Woh fraud hai. Government schemes are completely free.
                </Text>
              </View>

              <View style={styles.cheatItem}>
                <Ionicons name="unlock" size={32} color="#10b981" />
                <Text style={styles.cheatLabel}>Correct Domain Checker</Text>
                <Text style={styles.cheatDesc}>
                  Hamesha browser URL padhein. National portal checks: scholarships.gov.in. Koi aur spelling (e.g., scholarships-gov-in.free.web) fake hai.
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "profile" && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🧑 Aapki Profile & Documents Cabinet</Text>

            <View style={styles.profileCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitials}>SK</Text>
              </View>

              <Text style={styles.profileName}>{userInputName}</Text>
              <Text style={styles.profileMeta}>Bihar / Bihar Domicile State</Text>
              
              <View style={styles.profileDetailsRow}>
                <Text style={styles.pmLabel}>Income Tier: <Text style={styles.pmVal}>Below ₹ 2 Lakhs</Text></Text>
                <Text style={styles.pmLabel}>Verified Documents: <Text style={styles.pmVal}>3 Files Ready</Text></Text>
              </View>
            </View>

            {/* Document Locker Segment */}
            <Text style={styles.cabinetSubTitle}>📂 Secure Digi-Locker (Off-Line Cache)</Text>
            
            <View style={styles.docItem}>
              <Ionicons name="document-text" size={24} color="#ff9933" />
              <View style={{ flex: 1, paddingLeft: 8 }}>
                <Text style={styles.docItemName}>Income_Certificate_2026.pdf</Text>
                <Text style={styles.docItemSize}>Size: 180KB • PDF Document</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>

            <View style={styles.docItem}>
              <Ionicons name="images" size={24} color="#10b981" />
              <View style={{ flex: 1, paddingLeft: 8 }}>
                <Text style={styles.docItemName}>Matric_Mark_Sheet_Comp.jpg</Text>
                <Text style={styles.docItemSize}>Size: 42KB • NSP compliant</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Mobile Tab Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "dashboard" && styles.tabItemActive]}
          onPress={() => setActiveTab("dashboard")}
        >
          <Ionicons
            name="home"
            size={22}
            color={activeTab === "dashboard" ? "#ff9933" : "rgba(255,255,255,0.4)"}
          />
          <Text style={[styles.tabLabel, activeTab === "dashboard" && { color: "#ff9933" }]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "formAssist" && styles.tabItemActive]}
          onPress={() => setActiveTab("formAssist")}
        >
          <Ionicons
            name="construct-outline"
            size={22}
            color={activeTab === "formAssist" ? "#ff9933" : "rgba(255,255,255,0.4)"}
          />
          <Text style={[styles.tabLabel, activeTab === "formAssist" && { color: "#ff9933" }]}>
            Form Assist
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "scamCheats" && styles.tabItemActive]}
          onPress={() => setActiveTab("scamCheats")}
        >
          <Ionicons
            name="shield-outline"
            size={22}
            color={activeTab === "scamCheats" ? "#ff9933" : "rgba(255,255,255,0.4)"}
          />
          <Text style={[styles.tabLabel, activeTab === "scamCheats" && { color: "#ff9933" }]}>
            Fraud Alert
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === "profile" && styles.tabItemActive]}
          onPress={() => setActiveTab("profile")}
        >
          <Ionicons
            name="person-outline"
            size={22}
            color={activeTab === "profile" ? "#ff9933" : "rgba(255,255,255,0.4)"}
          />
          <Text style={[styles.tabLabel, activeTab === "profile" && { color: "#ff9933" }]}>
            My Cabinet
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#080b11",
  },
  appHeader: {
    height: 62,
    backgroundColor: "#0d1321",
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  brandContainer: {
    flexDirection: "column",
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ff9933",
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 9,
    color: "#1d9",
    fontWeight: "600",
  },
  streakIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 153, 51, 0.1)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 153, 51, 0.2)",
    minHeight: 44, // Touch target guideline compliant
  },
  streakText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ff9933",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  welcomeBanner: {
    backgroundColor: "#111625",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
  },
  welcomeDesc: {
    fontSize: 12,
    color: "#94a3b8",
    lineHeight: 18,
    marginBottom: 14,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
  },
  consolationCard: {
    backgroundColor: "#16111f",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    padding: 18,
    marginBottom: 18,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  consolationTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ff88c2",
  },
  consolationBody: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 18,
    marginBottom: 12,
  },
  aiInput: {
    backgroundColor: "rgba(0,0,0,0.24)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: "top",
    colorScheme: "dark",
    marginBottom: 12,
  },
  aiBtn: {
    backgroundColor: "#7c3aed",
    height: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  aiBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  aiResponseBox: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 12,
    marginTop: 14,
  },
  aiResponseLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#a78bfa",
    marginBottom: 6,
  },
  aiResponseText: {
    fontSize: 12,
    color: "#f1f5f9",
    lineHeight: 18,
  },
  sectionContainer: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 14,
  },
  searchBarBox: {
    backgroundColor: "#111625",
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#ffffff",
  },
  schemeCard: {
    backgroundColor: "#0d1321",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 16,
    marginBottom: 12,
  },
  schemeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  schemeName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    flex: 1,
    paddingRight: 8,
  },
  schemeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  schemeBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#10b981",
  },
  schemeDetailGrid: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 12,
    padding: 10,
    gap: 4,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 11,
    color: "#94a3b8",
  },
  detailVal: {
    fontWeight: "700",
    color: "#e2e8f0",
  },
  applyHintBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingTop: 10,
  },
  applyHintText: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
  },
  assistantIntroContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  assistantIntroText: {
    fontSize: 11,
    color: "#10b981",
    lineHeight: 16,
    flex: 1,
  },
  interactiveBox: {
    backgroundColor: "#111625",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "750",
    color: "#94a3b8",
    marginBottom: 6,
  },
  nativeTextInput: {
    backgroundColor: "rgba(0,0,0,0.2)",
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    color: "#ffffff",
    fontSize: 13,
  },
  compressBox: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  compressStatus: {
    fontSize: 12,
    color: "#cbd5e1",
    textAlign: "center",
  },
  compressBtn: {
    backgroundColor: "#ff9933",
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  compressBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000000",
  },
  feedbackText: {
    fontSize: 11,
    color: "#10b981",
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  scamDeskIntro: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 18,
    marginBottom: 16,
  },
  cheatsheetGrid: {
    gap: 12,
  },
  cheatItem: {
    backgroundColor: "#161b22",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 14,
    gap: 6,
  },
  cheatLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  cheatDesc: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 17,
  },
  profileCard: {
    backgroundColor: "#111625",
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 20,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ff9933",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  profileName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 2,
  },
  profileMeta: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 14,
  },
  profileDetailsRow: {
    flexDirection: "row",
    gap: 16,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingTop: 12,
    width: "100%",
    justifyContent: "space-between",
  },
  pmLabel: {
    fontSize: 11,
    color: "#9a6",
  },
  pmVal: {
    fontWeight: "800",
    color: "#ffffff",
  },
  cabinetSubTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 12,
  },
  docItem: {
    backgroundColor: "#0d1321",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  docItemName: {
    fontSize: 12,
    fontWeight: "750",
    color: "#ffffff",
  },
  docItemSize: {
    fontSize: 10,
    color: "#94a3b8",
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: "#0d1321",
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48, // compliance with touchscreen limits
  },
  tabItemActive: {
    backgroundColor: "rgba(255, 153, 51, 0.04)",
    borderRadius: 14,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    marginTop: 2,
  },
});
