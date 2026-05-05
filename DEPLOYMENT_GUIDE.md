# 🚀 Form Mitra AI: Play Store Deployment Guide

Follow these steps to deploy 'Form Mitra AI' to the Android Play Store.

## 1. Prerequisites
- Google Play Console Account ($25 one-time fee).
- App Icon (512x512px).
- Feature Graphic (1024x500px).
- Screenshots (at least 2 for phone, 7-inch tablet, and 10-inch tablet).

## 2. Configuration Changes
1. **Update `metadata.json`**: Ensure the name and description are perfect.
2. **Firebase Setup**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Add an Android App to your project.
   - Download `google-services.json` and place it in your local Android project (if exporting to Native).
   - Enable **Google Auth** and **Firestore** (Standard or Enterprise).

## 3. Building for Android
Since this is a Web App built with React, you have two options:
### Option A: Trusted Web Activity (TWA) - Recommended
1. Use **Bubblewrap CLI** to wrap this URL into a native Android APK.
2. Run `npx @bubblewrap/cli init --manifest=https://your-app-url.com/manifest.json`.
3. Follow the wizard to generate the Signed App Bundle (.aab).

### Option B: Capacitor/Cordova
1. Install Capacitor: `npm install @capacitor/core @capacitor/cli`.
2. Initialize: `npx cap init FormMitraAI com.formmitra.app`.
3. Add Android: `npx cap add android`.
4. Build Web: `npm run build`.
5. Sync: `npx cap sync`.
6. Open in Android Studio: `npx cap open android`.

## 4. Play Console Tasks
1. **Create App**: Choose "App" and "Free".
2. **Set up Store Listing**: Upload icons, graphics, and descriptions in Hindi & English.
3. **App Content**: Complete the declarations (Ads, Age Rating, Privacy Policy).
4. **Release**: Upload the `.aab` file to "Internal Testing" or "Production".

## 5. Tips for Indian Market
- **Lite Version**: Keep the APK size below 10MB if possible.
- **Hindi Localization**: Ensure the store listing description is primarily in Hindi/Hinglish to attract rural users.
- **Ads**: Use AdMob for revenue. Add your `App ID` in the manifest.

---
*Good luck with your launch! Jai Hind!* 🇮🇳
