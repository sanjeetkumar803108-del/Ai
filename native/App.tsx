import React from 'react';
import { View, StatusBar, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const webAppUrl = "https://ai-one-rust-97.vercel.app";

  // Super-Chrome User Agent
  const chromeUserAgent = "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView 
        source={{ uri: webAppUrl }} 
        style={styles.webview} 
        userAgent={chromeUserAgent}
        originWhitelist={['*']} 
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        
        /* 🔥 YEH DO LINES CACHE AUR WHITE SCREEN KO JAD SE KHATAM KARENGI 🔥 */
        cacheEnabled={false} 
        incognito={true} 
      />
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
    backgroundColor: 'transparent', // Website ko apne asli colors dikhane dega
  }
});

