import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  // Yeh tumhara asli Vercel link hai jo us app mein khulega
  const webAppUrl = "https://ai-one-rust-97.vercel.app";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <WebView 
        source={{ uri: webAppUrl }} 
        style={styles.webview} 
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Yeh app ko poori screen lene ka order deta hai
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1, // Yeh website ko poori screen par failata hai
  }
});
