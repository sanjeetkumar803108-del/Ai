import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  BackHandler,
  Platform,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

const WEB_APP_URL = 'https://ai-one-rust-97.vercel.app';

// Enhanced JS for mobile WebView with better error tracking
const INJECTED_JS = `
  (function() {
    console.log('🚀 Form Mitra App Loading...');
    
    // Capture all console logs to send back to React Native
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function(...args) {
      originalLog.apply(console, args);
      try {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'CONSOLE_LOG', message: args.join(' ') })
        );
      } catch(e) {}
    };
    
    console.error = function(...args) {
      originalError.apply(console, args);
      try {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'CONSOLE_ERROR', message: args.join(' ') })
        );
      } catch(e) {}
    };
    
    console.warn = function(...args) {
      originalWarn.apply(console, args);
    };
    
    // Force hardware compositing
    document.documentElement.style.transform = 'translateZ(0)';
    document.documentElement.style.webkitTransform = 'translateZ(0)';
    document.body.style.transform = 'translateZ(0)';
    document.body.style.webkitTransform = 'translateZ(0)';
    
    // Force visibility
    document.documentElement.style.visibility = 'visible';
    document.documentElement.style.opacity = '1';
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
    document.body.style.display = 'block';
    
    // Force background
    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';

    // Fix viewport
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    
    console.log('✅ Page initialization complete');
    
    // Send ready signal
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
  const [isOnline, setIsOnline] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const loadingTimerRef = useRef<any>(null);
  const hardErrorTimeoutRef = useRef<any>(null);

  // Back button handler
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

  const hideLoader = () => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    if (hardErrorTimeoutRef.current) clearTimeout(hardErrorTimeoutRef.current);
    setIsLoading(false);
  };

  const handleReload = () => {
    setHasError(false);
    setErrorInfo('');
    setIsLoading(true);
    if (hardErrorTimeoutRef.current) clearTimeout(hardErrorTimeoutRef.current);
    hardErrorTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        setErrorInfo('🔴 Server 10 seconds mein respond nahi kiya. Network slow hai!');
        setIsLoading(false);
      }
    }, 10000); // 10 second hard timeout
    webviewRef.current?.reload();
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView Error:', nativeEvent);
    const errorMsg = `❌ ${nativeEvent.code}: ${nativeEvent.description}`;
    setErrorInfo(errorMsg);
    setHasError(true);
    setIsLoading(false);
    if (hardErrorTimeoutRef.current) clearTimeout(hardErrorTimeoutRef.current);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('HTTP Error:', nativeEvent);
    if (nativeEvent.statusCode >= 400) {
      const errorMsg = `🌐 HTTP ${nativeEvent.statusCode} - Server mein problem hai!`;
      setErrorInfo(errorMsg);
      setHasError(true);
      setIsLoading(false);
      if (hardErrorTimeoutRef.current) clearTimeout(hardErrorTimeoutRef.current);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('📱 WebView Message:', data);
      
      if (data.type === 'CONTENT_READY') {
        console.log('✅ Content ready!');
        hideLoader();
      } else if (data.type === 'CONSOLE_LOG') {
        console.log('🌐 [WebApp]:', data.message);
      } else if (data.type === 'CONSOLE_ERROR') {
        console.error('🌐 [WebApp ERROR]:', data.message);
      }
    } catch (e) {
      console.log('Message parse error (normal):', e);
    }
  };

  // Aggressive timeout — 5 second mein pata chal jayega
  const handleLoadStart = () => {
    console.log('🚀 WebView load start');
    setIsLoading(true);
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    if (hardErrorTimeoutRef.current) clearTimeout(hardErrorTimeoutRef.current);
    
    // Much longer timeout - 8 seconds
    hardErrorTimeoutRef.current = setTimeout(() => {
      console.warn('⏱️ 8 second timeout - forcing close loader');
      if (isLoading) {
        setIsLoading(false);
      }
    }, 8000);
  };

  const handleLoadEnd = () => {
    console.log('✅ WebView load ended');
    if (hardErrorTimeoutRef.current) clearTimeout(hardErrorTimeoutRef.current);
    // Wait a bit before hiding to ensure content renders
    setTimeout(() => hideLoader(), 500);
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
          <Text style={styles.errorTitle}>Oops! Mein Tayyar Nahi Hoon</Text>
          <Text style={styles.errorSubtitle}>{errorInfo}</Text>
          
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={handleReload}
            activeOpacity={0.8}
          >
            <Text style={styles.retryText}>🔄 Dobara Load Karo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => setShowDebug(!showDebug)}
            activeOpacity={0.7}
          >
            <Text style={styles.debugButtonText}>🐛 Debug Info</Text>
          </TouchableOpacity>

          {showDebug && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>URL: {WEB_APP_URL}</Text>
              <Text style={styles.debugText}>Online: {isOnline ? '✅ Yes' : '❌ No'}</Text>
              <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
              <Text style={styles.debugText}>Error: {errorInfo}</Text>
            </View>
          )}
        </View>
      ) : (
        <>
          <WebView
            ref={webviewRef}
            source={{ uri: WEB_APP_URL }}
            style={styles.webview}

            // Core settings
            originWhitelist={['*']}
            mixedContentMode="always"
            domStorageEnabled={true}
            javaScriptEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            setSupportMultipleWindows={false}
            thirdPartyCookiesEnabled={true}

            // Hardware acceleration
            androidLayerType="hardware"
            androidHardwareAccelerationDisabled={false}

            // Cache & Storage
            cacheEnabled={true}
            cacheMode="LOAD_DEFAULT"

            // User Agent
            userAgent="Mozilla/5.0 (Linux; Android 13; TECNO LH8n Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"

            // Injection & Events
            injectedJavaScript={INJECTED_JS}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={handleHttpError}
            onMessage={handleMessage}
            onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}

            // Scroll behavior
            scrollEnabled={true}
            bounces={false}
            overScrollMode="never"
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          />

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingTitle}>✨ Form Mitra</Text>
                <Text style={styles.loadingSubtitle}>AI Tutor ready ho rahe ho...</Text>
                <Text style={styles.loadingTiny}>Processing loading...</Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  webview: { flex: 1, backgroundColor: '#ffffff' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#666666',
  },
  loadingTiny: {
    marginTop: 4,
    fontSize: 12,
    color: '#999999',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorEmoji: { fontSize: 56, marginBottom: 16 },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  retryText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600',
    textAlign: 'center',
  },
  debugButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cccccc',
    backgroundColor: '#f5f5f5',
  },
  debugButtonText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500',
  },
  debugInfo: {
    marginTop: 16,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    maxWidth: '100%',
  },
  debugText: {
    fontSize: 11,
    color: '#333333',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});