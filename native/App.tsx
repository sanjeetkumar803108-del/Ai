import React from 'react';
import { View, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  // Yeh tumhara asli Vercel link hai
  const webAppUrl = "https://ai-one-rust-97.vercel.app";

  return (
    <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView 
        source={{ uri: webAppUrl }} 
        style={{ flex: 1, width: '100%', height: '100%' }} 
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  );
}

