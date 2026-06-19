import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';

// Tumhari Vercel Website ka Link
const WEB_APP_URL = 'https://ai-one-rust-97.vercel.app';

// Vercel Bot Protection ko bypass karne ke liye Chrome ka User-Agent
const CHROME_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

export default function App() {
  const webviewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState('');

  // Retry Button ka logic
  const handleReload = () => {
    setHasError(false);
    setErrorInfo('');
    setIsLoading(true);
    webviewRef.current?.reload();
  };

  // Normal Errors pakadne ke liye
  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView error:', nativeEvent);
    setErrorInfo(`Code: ${nativeEvent.code} | ${nativeEvent.description}`);
    setHasError(true);
    setIsLoading(false);
  };

  // HTTP Errors pakadne ke liye
  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('HTTP error:', nativeEvent.statusCode, nativeEvent.url);
    if (nativeEvent.statusCode >= 500) {
      setErrorInfo(`HTTP ${nativeEvent.statusCode} on ${nativeEvent.url}`);
      setHasError(true);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />

      {hasError ? (
        // 🔴 Error Screen — White screen ki jagah ab yeh dikhega
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Form Mitra Load Nahi Hua</Text>
          <Text style={styles.errorSubtitle}>Internet check karein: {errorInfo}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <Text style={styles.retryText}>Retry (Phir Se Koshish Karein)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webviewRef}
          source={{ uri: WEB_APP_URL }}
          style={styles.webview}

          // ── JavaScript & Storage ──────────────────────────
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          userAgent={CHROME_USER_AGENT}
          mixedContentMode="always"

          // ── Performance & Rendering ───────────────────────
          androidHardwareAccelerationDisabled={false}
          androidLayerType="hardware"
          cacheEnabled={true}
          cacheMode="LOAD_DEFAULT"

          // ── Media & Permissions ───────────────────────────
          allowsFullscreenVideo={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}

          // ── Loading State (Hara Spinner) ──────────────────
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#008060" />
              <Text style={styles.loadingText}>Form Mitra AI khul raha hai...</Text>
            </View>
          )}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}

          // ── Error Handling ────────────────────────────────
          onError={handleError}
          onHttpError={handleHttpError}

          // ── Navigation & Security ─────────────────────────
          setSupportMultipleWindows={false}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          geolocationEnabled={false}
          javaScriptCanOpenWindowsAutomatically={false}

          // ── Scroll & UX ───────────────────────────────────
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
          pullToRefreshEnabled={true}

          // ── Injected JS: Mobile Viewport Fix ──────────────
          injectedJavaScript={`
            (function() {
              var meta = document.querySelector('meta[name="viewport"]');
              if (!meta) {
                meta = document.createElement('meta');
                meta.name = 'viewport';
                document.head.appendChild(meta);
              }
              meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
              window.isReactNativeWebView = true;
            })();
            true;
          `}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  webview: {
    flex: 1,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#008060',
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#cc0000',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#008060',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});
  
