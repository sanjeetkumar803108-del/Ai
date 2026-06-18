import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AntiScamWarningProps {
  onDismiss?: () => void;
  scamType?: string; // "fees", "otp", "broker", etc.
}

export const AntiScamWarning: React.FC<AntiScamWarningProps> = ({
  onDismiss,
  scamType = "fees",
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.alertIconBg}>
          <Ionicons name="warning" size={24} color="#ef4444" />
        </View>
        <Text style={styles.alertTitle}>🚨 FRAUD ALERT / SCAM CHEAT SHEET!</Text>
      </View>

      <Text style={styles.alertSubtitle}>
        Sanjeet bhaiya, dhyan se padhein! Ye bahut zaroori hai!
      </Text>

      <View style={styles.cardInfo}>
        <View style={styles.infoRow}>
          <View style={styles.dotRed} />
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>No Upfront Fees: </Text>
            Legitimate government schemes, state scholarships (UGC, NSP), and genuine jobs <Text style={styles.boldText}>NEVER</Text> demand registration fees, security deposits, or device charging costs.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.dotRed} />
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>Never Share Secrets: </Text>
            Form Mitra or any bank representative will <Text style={styles.boldText}>NEVER</Text> ask for your OTP, Aadhaar PIN, ATM code, or Netbanking passwords.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.dotRed} />
          <Text style={styles.infoText}>
            <Text style={styles.boldText}>Beware Of Brokers: </Text>
            Avoid paying any third-party cyber cafe agent or online broker. Form Mitra's automated application tool handles forms directly and securely.
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.badgeSecure}>
          <Ionicons name="shield-checkmark" size={14} color="#10b981" />
          <Text style={styles.badgeSecureText}>Form Mitra Verified</Text>
        </View>

        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>Main Samajh Gaya, Bhai!</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e1b1b",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#ef4444",
    padding: 18,
    marginVertical: 12,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  alertIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ff3b30",
    letterSpacing: 0.5,
  },
  alertSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fca5a5",
    marginBottom: 12,
  },
  cardInfo: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  dotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
    marginTop: 6,
  },
  infoText: {
    fontSize: 12,
    color: "#e2e8f0",
    lineHeight: 17,
    flex: 1,
  },
  boldText: {
    fontWeight: "bold",
    color: "#ffffff",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeSecure: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  badgeSecureText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10b981",
  },
  dismissButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  dismissText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#ffffff",
  },
});
