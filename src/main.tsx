import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { testConnection } from './lib/firebase.ts';
import axios from 'axios';

// Detect if we are running in a packaged Mobile APK / WebView / local file environment
const isPackagedApp = 
  window.location.protocol === 'file:' || 
  window.location.protocol === 'capacitor:' || 
  window.location.protocol === 'chrome-extension:' ||
  (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '5173') ||
  !window.location.hostname; // Android WebView null origin or local assets

const storedUrl = localStorage.getItem("FORM_MITRA_API_URL");
const apiBaseUrl = storedUrl || "https://ais-pre-tk4okibt4lij5wxepsulso-3794214422.asia-southeast1.run.app";

if (isPackagedApp) {
  console.log(`[Form Mitra APK Proxy] Packaged mobile app detected! Setting default API base URL to: ${apiBaseUrl}`);
  axios.defaults.baseURL = apiBaseUrl;
}

// Intercept fetch calls for Mobile APK/WebView environments where relative paths fail
const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  value: function (input: RequestInfo | URL, init?: RequestInit) {
    let url = typeof input === "string" ? input : input instanceof Request ? input.url : "";
    
    if (url.startsWith("/api/")) {
      if (isPackagedApp) {
        const targetUrl = apiBaseUrl + url;
        console.log(`[Form Mitra APK Proxy] Intercepting fetch: ${url} -> Redirecting to: ${targetUrl}`);
        
        if (typeof input === "string") {
          return originalFetch(targetUrl, init);
        } else if (input instanceof Request) {
          // Clone the Request object with the new URL
          const newRequest = new Request(targetUrl, input);
          return originalFetch(newRequest, init);
        }
      }
    }
    return originalFetch(input, init);
  },
  writable: true,
  configurable: true,
});

// Initial connection test
testConnection();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
