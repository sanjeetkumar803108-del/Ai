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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface NamaskarSplashProps {
  onComplete: () => void;
}

export const NamaskarSplash: React.FC<NamaskarSplashProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const orbAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in and scale up content on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 30,
        useNativeDriver: true,
      }),
    ]).start();

    // Constant rotation loop for the background mandala circle
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulsing orbs loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orbAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Automatic exit transition after 4.2 seconds
    const timer = setTimeout(() => {
      handleExit();
    }, 4200);

    return () => clearTimeout(timer);
  }, []);

  const handleExit = () => {
    if (isExiting) return;
    setIsExiting(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 500,
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

  const orbScale1 = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  const orbScale2 = orbAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.2, 1],
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
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Decorative Orbs resembling rich Indian saffron and emerald hues */}
      <View style={styles.backgroundPatternsContainer} pointerEvents="none">
        <Animated.View
          style={[
            styles.saffronOrb,
            { transform: [{ scale: orbScale1 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.emeraldOrb,
            { transform: [{ scale: orbScale2 }] },
          ]}
        />
      </View>

      {/* Main Glassmorphic Card Container */}
      <View style={styles.cardContainer}>
        <View style={styles.headerBadgeContainer}>
          {/* Animated decorative mandala */}
          <Animated.View
            style={[
              styles.mandalaOutline,
              { transform: [{ rotate: spinMandala }] },
            ]}
          >
            <View style={styles.mandalaDashRing} />
          </Animated.View>

          {/* Saffron & Emerald glow rings */}
          <View style={styles.glowRingSaffron} />
          <View style={styles.glowRingEmerald} />

          {/* Core Praying Hands Icon Badge */}
          <View style={styles.coreHandsBadge}>
            <View style={styles.innerBadgeFrame}>
              <Text style={styles.emojiHands}>🙏</Text>
            </View>
          </View>

          {/* Sparkly details */}
          <View style={styles.sparkleTop}>
            <Ionicons name="sparkles" size={22} color="#f59e0b" />
          </View>
          <View style={styles.sparkleBottom}>
            <Ionicons name="heart" size={18} color="#10b981" />
          </View>
        </View>

        {/* Greetings Section */}
        <View style={styles.greetingsBlock}>
          <Text style={styles.devanagariTitle}>नमस्ते</Text>
          
          <View style={styles.subTextWrap}>
            <Text style={styles.welcomeSubtitle}>
              SWAGAT HAI AAPKA FORM MITRA MEIN
            </Text>
            <Text style={styles.bhaiHeading}>
              Aapka Bada Bhai, Form Mitra 🤝
            </Text>
          </View>

          <View style={styles.dividerLine} />

          <Text style={styles.empatheticBhaiText}>
            Sarkari yojanaon aur scholarships ke safar mein koi bhi takleef ho, aapka bada bhai har mod par aapka sath dega!
          </Text>

          <Text style={styles.featurePillsText}>
            ✨ AI Form Assistant, Live Alerts & Smart Tools ✨
          </Text>
        </View>

        {/* Proceed Action Button */}
        <View style={styles.actionBlock}>
          <TouchableOpacity
            onPress={handleExit}
            activeOpacity={0.8}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Shuru Karein, Bade Bhai!</Text>
            <Ionicons name="chevron-forward" size={16} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.secureBadge}>
            <Text style={styles.secureBadgeText}>
              🔒 Secure & Encrypted by Form Mitra
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0b0f19",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backgroundPatternsContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    opacity: 0.25,
  },
  saffronOrb: {
    position: "absolute",
    top: "15%",
    left: "10%",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#ff9933",
    opacity: 0.4,
    // Note: react-native on Android does not natively support CSS filter blur.
    // Instead we use overlay gradients/opacities to achieve smooth lighting cards.
  },
  emeraldOrb: {
    position: "absolute",
    bottom: "20%",
    right: "10%",
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#138808",
    opacity: 0.35,
  },
  cardContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerBadgeContainer: {
    position: "relative",
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  mandalaOutline: {
    position: "absolute",
    width: 130,
    height: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  mandalaDashRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
    borderStyle: "dashed",
  },
  glowRingSaffron: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 153, 51, 0.08)",
  },
  glowRingEmerald: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(19, 136, 8, 0.05)",
  },
  coreHandsBadge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 2,
    backgroundColor: "#ff9933", // simplified elegant saffron border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  innerBadgeFrame: {
    flex: 1,
    borderRadius: 41,
    backgroundColor: "#0d1321",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiHands: {
    fontSize: 34,
  },
  sparkleTop: {
    position: "absolute",
    top: 6,
    right: 12,
  },
  sparkleBottom: {
    position: "absolute",
    bottom: 6,
    left: 12,
  },
  greetingsBlock: {
    alignItems: "center",
    marginBottom: 32,
    width: "100%",
  },
  devanagariTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#ff9933",
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: "center",
  },
  subTextWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#ffaa44",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 4,
  },
  bhaiHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
  },
  dividerLine: {
    height: 1,
    width: 110,
    backgroundColor: "rgba(245, 158, 11, 0.3)",
    marginBottom: 16,
  },
  empatheticBhaiText: {
    fontSize: 13,
    color: "#cbd5e1",
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  featurePillsText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#10b981",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  actionBlock: {
    width: "100%",
    alignItems: "center",
  },
  ctaButton: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: "#008069",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  secureBadge: {
    marginTop: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  secureBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ef4444",
    letterSpacing: 0.5,
  },
});
