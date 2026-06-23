import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
  BackHandler,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

const WEB_APP_URL = 'https://ai-one-rust-97.vercel.app';

const INJECTED_JS_BEFORE_LOAD = `
  (function() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.documentElement.style.touchAction = 'manipulation';
    document.documentElement.style.overscrollBehavior = 'none';
    true;
  })();
`;

const INJECTED_JS_AFTER_LOAD = `
  (function() {
    document.documentElement.style.visibility = 'visible';
    document.documentElement.style.opacity = '1';
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
    document.body.style.backgroundColor = document.body.style.backgroundColor || '#ffffff';
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'CONTENT_READY' })
    );
    true;
  })();
`;

export default function App() {
  const webviewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorInfo, setErrorInfo] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);

  React.useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }
      return false;
    };
    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [canGoBack]);

  const handleReload = () => {
    setHasError(false);
    setErrorInfo('');
    setIsLoading(true);
    webviewRef.current?.reload();
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setErrorInfo(`Code: ${nativeEvent.code} | ${nativeEvent.description}`);
    setHasError(true);
    setIsLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    if (nativeEvent.statusCode >= 400) {
      setErrorInfo(`HTTP ${nativeEvent.statusCode}: ${nativeEvent.url}`);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'CONTENT_READY') {
        setTimeout(() => setIsLoading(false), 300);
      }
    } catch (e) {}
  };

  const handleLoadEnd = () => {
    setTimeout(() => setIsLoading(false), 3000);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />

      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Form Mitra Load Nahi Hua</Text>
          <Text style={styles.errorSubtitle}>{errorInfo}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleReload}>
            <Text style={styles.retryText}>🔄 Dobara Try Karein</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <WebView
            ref={webviewRef}
            source={{ uri: WEB_APP_URL }}
            style={styles.webview}

            // ── Core settings ──────────────────────────────────────────
            originWhitelist={['*']}
            mixedContentMode="always"
            domStorageEnabled={true}
            javaScriptEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}

            // ── TECNO/INFINIX FIX — hardware + acceleration enabled ────
            // Tecno phones ka custom WebView "software" mode mein
            // content render nahi karta, isliye hardware use karo
            androidLayerType="hardware"
            androidHardwareAccelerationDisabled={false}

            // ── Cache settings ─────────────────────────────────────────
            cacheEnabled={true}
            cacheMode="LOAD_DEFAULT"

            // ── TECNO ke liye specific User Agent ─────────────────────
            userAgent="Mozilla/5.0 (Linux; Android 13; TECNO LH6n) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"

            // ── JavaScript injection ───────────────────────────────────
            injectedJavaScriptBeforeContentLoaded={INJECTED_JS_BEFORE_LOAD}
            injectedJavaScript={INJECTED_JS_AFTER_LOAD}

            // ── Event handlers ─────────────────────────────────────────
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={handleHttpError}
            onMessage={handleMessage}
            onNavigationStateChange={handleNavigationStateChange}

            // ── Scroll & interaction ───────────────────────────────────
            scrollEnabled={true}
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            decelerationRate="normal"
          />

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingTitle}>Form Mitra AI</Text>
              <Text style={styles.loadingSubtitle}>khul raha hai...</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingTitle: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorEmoji: {
    fontSize: 52,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 12,
    elevation: 3,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});