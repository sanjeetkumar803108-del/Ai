import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
  ActivityIndicator,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // LIVE Web URL for Form Mitra Suite (Loads the beautiful web-app preview directly)
  const webAppUrl = "https://ais-pre-tk4okibt4lij5wxepsulso-3794214422.asia-southeast1.run.app";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#008069" />
      <View style={styles.webWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri: webAppUrl }}
          style={styles.webview}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          allowsBackForwardNavigationGestures={true}
        />
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#008069" />
          </View>
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
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.95)", // Clean off-white background while loading
    justifyContent: "center",
    alignItems: "center",
  },
});
