import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  // Yeh tumhara asli Vercel link hai
  const webAppUrl = "https://ai-one-rust-97.vercel.app";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView 
        source={{ uri: webAppUrl }} 
        style={{ flex: 1 }} 
        
        /* THE MAGIC VIP PASSES (White Screen Fix) */
        originWhitelist={['*']} 
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        thirdPartyCookiesEnabled={true}
      />
    </SafeAreaView>
  );
}
