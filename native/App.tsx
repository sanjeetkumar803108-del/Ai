import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { NamaskarSplash } from "./src/components/NamaskarSplash";

const systemFont = Platform.OS === "ios" ? "System" : "sans-serif";

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Handle hardware back button on Android to navigate back inside the WebView
  useEffect(() => {
    const handleBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
    };
  }, [canGoBack]);

  // LIVE Web URL for Form Mitra Suite (Loads your actual live AI Studio preview directly!)
  const webAppUrl = "https://ais-pre-tk4okibt4lij5wxepsulso-3794214422.asia-southeast1.run.app";

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryKey((prev) => prev + 1); // Triggers key change to force WebView reload attempt
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#008069" />
      
      <View style={styles.webWrapper}>
        {/* WebView: Loaded immediately in the background under the splash screen */}
        <WebView
          key={retryKey}
          ref={webViewRef}
          source={{ uri: webAppUrl }}
          style={hasError ? styles.hiddenWebview : styles.webview}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onLoadStart={() => {
            setHasError(false);
            setIsLoading(true);
          }}
          onLoadEnd={() => {
            setIsLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView error: ", nativeEvent);
            setHasError(true);
            setIsLoading(false);
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn("WebView HTTP error: ", nativeEvent);
            // Only trigger error screen for serious non-200 states of the main page
            if (nativeEvent.statusCode >= 400) {
              setHasError(true);
              setIsLoading(false);
            }
          }}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          originWhitelist={["*"]}
          mixedContentMode="always"
          thirdPartyCookiesEnabled={true}
          allowFileAccess={true}
          androidHardwareAccelerationDisabled={false}
          // Modern standard mobile User Agent to ensure full compatibility with modern Web APIs and JS libraries
          userAgent="Mozilla/5.0 (Linux; Android 13; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
        />

        {/* Custom loading indicator shown only when not showing full error or splash */}
        {isLoading && !showSplash && !hasError && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#008069" />
            <Text style={styles.loadingText}>Yojana details load ho rahi hain...</Text>
          </View>
        )}

        {/* Beautiful native error screen in Hindi/English if the URL fails to load */}
        {hasError && (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconBg}>
              <Ionicons name="wifi-outline" size={48} color="#D97706" />
            </View>
            <Text style={styles.errorTitle}>Internet Connection Nahi Mil Raha! 🌐</Text>
            <Text style={styles.errorSubtitle}>
              Sanjeet bhaiya, lagta hai aapka internet disconnected hai ya website temporarily available nahi hai. 
              Kripya apna mobile network check karein aur niche button par click karein!
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
              <Ionicons name="refresh" size={18} color="#ffffff" />
              <Text style={styles.retryButtonText}>Fir Se Koshish Karein</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Legendary Welcome Splash: Renders on top to mask the initial load phase and prevent white flashes */}
        {showSplash && (
          <NamaskarSplash onComplete={() => setShowSplash(false)} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#008069", // Matches Form Mitra primary theme color
  },
  webWrapper: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webview: {
    flex: 1,
  },
  hiddenWebview: {
    display: "none",
    height: 0,
    width: 0,
    opacity: 0,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Clean off-white background while loading
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#008069",
    fontWeight: "600",
    fontFamily: systemFont,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(217, 119, 6, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: systemFont,
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    fontFamily: systemFont,
    fontWeight: "500",
  },
  retryButton: {
    flexDirection: "row",
    backgroundColor: "#008069",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#008069",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    fontFamily: systemFont,
  },
});
