import React from 'react';
import { View, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const webAppUrl = "https://ai-one-rust-97.vercel.app";

  // The "Fake Mustache" - Website ko lagega ki wo asli Chrome browser hai!
  const chromeUserAgent = "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36";

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView 
        source={{ uri: webAppUrl }} 
        style={{ flex: 1 }} 
        userAgent={chromeUserAgent}
        originWhitelist={['*']} 
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        cacheEnabled={false} 
        bounces={false}
      />
    </View>
  );
}
