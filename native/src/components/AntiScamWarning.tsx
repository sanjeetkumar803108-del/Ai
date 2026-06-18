import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AntiScamWarningProps {
  onDismiss?: () => void;
  scamType?: string;
}

export const AntiScamWarning: React.FC<AntiScamWarningProps> = ({
  onDismiss,
  scamType = "fees",
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.alertIconBg}>
          <Ionicons name="shield-half-outline" size={18} color="#D97706" />
        </View>
        <Text style={styles.alertTitle}>🚨 SAMAY KA BACHAV AUR CYBER SURAKSHA</Text>
      </View>

      <Text style={styles.alertSubtitle}>
        Sanjeet bhaiya, dhyan se padhein! Ye bade bhai ki behtarin salah hai:
      </Text>

      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <View style={styles.dotGolden} />
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>No Upfront Fee: </Text>
            Govt scholarships ya jobs ke liye kabhi koi extra broker charges nahi dene hote. Direct apply karein!
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.dotGolden} />
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>Never Share OTPs: </Text>
            Aapna Aadhaar password, Bank PIN ya mobile OTP kabhi kisi ke sath share mat karein.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.dotGolden} />
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>Direct Form Helper: </Text>
            Browser me hamesha official domain <Text style={styles.highlightText}>.gov.in</Text> hi open karein.
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.badgeSecure}>
          <Ionicons name="shield-checkmark" size={12} color="#008069" />
          <Text style={styles.badgeSecureText}>Form Mitra Verified</Text>
        </View>

        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>Samajh Gaya, Bhai!</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFBEB", // Premium light yellow cream warning card (warm/cyber-conscious)
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FCD34D",
    padding: 16,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  alertIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(217, 119, 6, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#B45309",
    letterSpacing: 0.5,
  },
  alertSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#78350F",
    marginBottom: 10,
  },
  cardInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.08)",
  },
  infoRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  dotGolden: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D97706",
    marginTop: 6,
  },
  infoText: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
    flex: 1,
    fontWeight: "500",
  },
  boldText: {
    fontWeight: "800",
    color: "#1F2937",
  },
  highlightText: {
    color: "#008069",
    fontWeight: "850",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeSecure: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 128, 105, 0.08)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 128, 105, 0.15)",
  },
  badgeSecureText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#008069",
  },
  dismissButton: {
    backgroundColor: "#008069",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 32,
    justifyContent: "center",
  },
  dismissText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff",
  },
});
