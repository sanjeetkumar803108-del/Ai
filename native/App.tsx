import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const webAppUrl = "https://ai-one-rust-97.vercel.app";
  const [hasError, setHasError] = useState(false);

  // Agar app fail hoti hai, toh white screen ki jagah yeh error message aayega
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Oops! Internet Error ya Website Load nahi hui.</Text>
        <Text style={styles.errorSubText}>Apna internet connection check karein bhai!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView 
        source={{ uri: webAppUrl }} 
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']} // Claude Fix 4: Allow all links
        mixedContentMode="always" // Claude Fix 5: Allow external images/scripts
        userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36" // Claude Fix 2: Bypass Vercel Bot Protection
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#008060" />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
          setHasError(true); // Claude Fix 3: Catch errors instead of White Screen
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginTop: StatusBar.currentHeight || 25,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorSubText: {
    color: '#333',
    marginTop: 10,
  }
});
