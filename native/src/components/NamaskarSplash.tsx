import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const systemFont = Platform.OS === "ios" ? "System" : "sans-serif";

const { width } = Dimensions.get("window");

interface NamaskarSplashProps {
  onComplete: () => void;
}

export const NamaskarSplash: React.FC<NamaskarSplashProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 25000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const timer = setTimeout(() => {
      handleExit();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  };

  const spinMandala = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Modern, light premium layout */}
      <View style={styles.container}>
        <View style={styles.logoAndBadgeContainer}>
          <Animated.View
            style={[
              styles.mandalaOutline,
              { transform: [{ rotate: spinMandala }] },
            ]}
          >
            <View style={styles.mandalaRing} />
          </Animated.View>

          <View style={styles.coreHandsBadge}>
            <Text style={styles.emojiHands}>🙏</Text>
          </View>
        </View>

        {/* Brand Text Section - Premium Light Typography */}
        <View style={styles.textContainer}>
          <Text style={styles.devanagariGreeting}>नमस्ते</Text>
          <Text style={styles.welcomeSubtitle}>WELCOME TO FORM MITRA AI</Text>
          <Text style={styles.bhaiHeading}>Aapka Bada Bhai, Form Mitra 🤝</Text>
          
          <View style={styles.divider} />

          <Text style={styles.empatheticBhaiText}>
            Sarkari yojanaon aur scholarships ke safar mein koi bhi takleef ho, aapka bada bhai har mod par aapka sath dega!
          </Text>

          <View style={styles.pillsContainer}>
            <Text style={styles.pillText}>✨ AI Form Assistant</Text>
            <Text style={styles.pillDivider}>•</Text>
            <Text style={styles.pillText}>Live Alerts</Text>
            <Text style={styles.pillDivider}>•</Text>
            <Text style={styles.pillText}>Smart Tools</Text>
          </View>
        </View>

        {/* Interactive Proceed Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            onPress={handleExit}
            activeOpacity={0.8}
            style={styles.primaryButton}
          >
            <Text style={styles.buttonText}>Aage Badhein, Bhai!</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.secureBadgeText}>
            🔒 Secure & Encrypted by Form Mitra
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F3F4F6", // Premium Light grey background
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ffffff", // Pure white card
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8,
  },
  logoAndBadgeContainer: {
    position: "relative",
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  mandalaOutline: {
    position: "absolute",
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  mandalaRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: "rgba(0, 128, 105, 0.2)", // Teal border
    borderStyle: "dashed",
  },
  coreHandsBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E6F3F0", // Soft light teal bg
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#008069", // Premium Teal accent
    shadowColor: "#008069",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  emojiHands: {
    fontSize: 32,
  },
  textContainer: {
    alignItems: "center",
    width: "100%",
    marginBottom: 32,
  },
  devanagariGreeting: {
    fontSize: 36,
    fontWeight: "900",
    color: "#008069", // Teal
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.5,
    fontFamily: systemFont,
  },
  welcomeSubtitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#9CA3AF",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 4,
    fontFamily: systemFont,
  },
  bhaiHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937", // Dark gray
    textAlign: "center",
    marginBottom: 16,
    fontFamily: systemFont,
  },
  divider: {
    height: 2,
    width: 60,
    backgroundColor: "rgba(0, 128, 105, 0.15)", // Subtle teal divider
    marginBottom: 16,
  },
  empatheticBhaiText: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: "500",
    fontFamily: systemFont,
  },
  pillsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#008069",
    fontFamily: systemFont,
  },
  pillDivider: {
    fontSize: 11,
    color: "#D1D5DB",
  },
  actionContainer: {
    width: "100%",
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    backgroundColor: "#008069", // Teal Green accent
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#008069",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  secureBadgeText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 14,
  },
});
