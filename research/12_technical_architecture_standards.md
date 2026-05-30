# Module 12: Technical Architecture, Performance, & Offline Standards

This document establishes the thorough technical specifications, bundle optimization guidelines, hot-update workflows, and permission strategies required to build a performant, cost-free, and premium pure React Native mobile application targeting **Expo SDK 56**.

---

## 💻 1. Coding & Folder Standards (TypeScript & Expo SDK 56)

To maintain a lean, bloat-free codebase and prevent technical debt, we enforce a strict coding standard:

### Folder Hierarchy (Single Pure React Native Project)
```
vibe/
├── GOAL.md                       # Product vision & 4-Tab Core Map
├── QUESTIONS_ANSWERS.md          # Living Q&A ledger
├── .agent_rules.md               # Strict coding & privacy rules
├── research/                     # Detailed modular research specs (01 to 14)
├── spec/                         # Crowning developer spec sheet
├── assets/                       # Minimal SVG icons, fire streak widgets
├── src/                          # Main Application Code
│   ├── components/               # Pure UI components (Sliders, ProgressBars)
│   ├── screens/                  # CoreScreen, DailyScreen, SnapshotScreen, LearnScreen
│   ├── navigation/               # TabNavigator (Bottom tabs)
│   ├── services/                 # Local MMKV database & Local Notifications scheduling
│   ├── math/                     # Pure JS/TS mathematical engines (SIP, SWP, FIRE, Monte Carlo)
│   └── styles/                   # Glassmorphic themes & premium style tokens
├── App.tsx                       # Main entry point (wrapped in Theme, BiometricLock, & ErrorBoundary)
├── app.json                      # Expo manifest and app settings
├── package.json                  # Lean, bloat-free dependencies list
└── tsconfig.json                 # Strict TypeScript configuration
```

### Key Engineering Practices
* **Strict TypeScript**: Set `strict: true` in `tsconfig.json`. Explicitly type all component props and mathematical inputs.
* **Expo SDK 56 Integration**: All core packages must target Expo SDK 56 (`expo@^56.0.0`) to utilize stable SwiftUI/Compose React Native UI primitives, Hermes v1 JS runtime, and compatibility fixes.
* **Path Aliasing**: Utilize absolute imports (e.g., `@/components/GlassPanel` mapped from `src/components`) to eliminate messy relative links (`../../../components/GlassPanel`).

---

## 🔒 2. Local Biometric Lock Security Spec

Because this is a wealth app containing private assets, we secure the dashboard using local biometrics.

### Library Selection
We utilize `expo-local-authentication` which wraps iOS Touch ID / Face ID and Android BiometricPrompt. It runs strictly on-device, calling the system's secure enclave hardware without contacting external servers (**Cost: ₹0.00**).

### TypeScript Authentication Handler

```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';

export const authenticateUser = async (): Promise<boolean> => {
  try {
    // 1. Check if hardware supports biometrics
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return true; // Fallback to app pass code (or bypass if no hardware)

    // 2. Check if user has enrolled biometrics
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return true;

    // 3. Trigger Biometric prompt
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Vibe Wealth',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false
    });

    return result.success;
  } catch (error) {
    console.error('Biometric auth failed: ', error);
    return false;
  }
};
```

---

## 📦 3. Performance & Minimal Bundle Size Optimization

To guarantee sub-second app launching and the smallest possible binary download size (target under **15MB** total app size on Android/iOS):

* **No Heavy Date Libraries**: Avoid `moment.js` or `date-fns`. Since our date calculations are strictly index-based or use standard calendar months (e.g., our logarithmic milestone date solver), we utilize native JavaScript `Date` functions. **Bundle Saved: ~1.2MB**.
* **MMKV Storage**: We bypass the heavy and slow AsyncStorage bridge. We utilize `react-native-mmkv` which uses a direct C++ JSI (JavaScript Interface) to read/write values in-memory. **Performance: >30x faster read/writes**.
* **Vector Graphics**: Store zero high-resolution PNG or JPG assets inside the bundle. Use `react-native-svg` for all logos, fire widgets, and icons. **Bundle Saved: >8.5MB**.
* **Minimalistic Charting**: Instead of importing heavy chart suites, utilize targeted `react-native-gifted-charts` (draws lightweight canvas charts) or bare-metal SVG paths.

---

## ⚡ 4. Over-The-Air (OTA) Hot Updates (EAS Update)

To bypass tedious Apple App Store and Google Play review delays (which can take 24 to 72 hours), we implement **EAS Update (Expo Application Services)**.

```
[Developer edits JS/Assets] ──> Run: `npx eas update` ──> Compiles & pushes bundle to Expo CDN
                                                                   │
                                                                   ▼
[App Launch / BG check] <── Downloads updated JS bundle <── [Client detects update OTA]
```

### EAS Update Workflow & Mechanics
1. **The Publish**: When a bug is fixed or a new story card is ready, we run `npx eas update --platform all --message "fix: adjust Monte Carlo volatility index"`.
2. **The Delivery**: Upon startup, the client Expo container makes a rapid, non-blocking check to the EAS update endpoint. If a new JS bundle is available, it downloads it in the background. The next time the user opens the app, the update is loaded instantly.
3. **The Cost**:
   * **Free Plan**: Includes updates for up to **1,000 Monthly Active Users (MAUs)** per month at no cost.
   * **Starter Plan ($19/month)**: Includes up to **3,000 MAUs**.
   * *This is perfect for early launch to friends/family (₹0 cost) and scales extremely affordably.*

---

## 🛡️ 5. App Permissions & The Privacy Slogan

Because we do not sync account data to a database, we achieve a massive market distinction: **We do not require system permissions.**

### Required App Manifest Declarations
* **Android / iOS Permissions**:
  * `android.permission.INTERNET`: Required to fetch daily stories from GitHub Pages CDN.
  * `android.permission.ACCESS_NETWORK_STATE`: Required to monitor connection status and check for AdMob network presence.
  * `android.permission.USE_BIOMETRIC` (and iOS equivalent FaceID usage description string): Required to unlock the app locally.
  * **UNSPECIFIED (Zero Privacy Permissions requested)**: No access to contacts, SMS, device storage read/writes, camera, locations, or Bluetooth.
* **Our Slogan**: *"Ultimate Security. Zero system permissions required. Your data belongs strictly on your phone."*

---

## 🔔 6. Push Notifications Cost Strategy

To sustain a daily **Wealth Streak** without paying monthly remote server notification costs:

### A. Local Push Notifications (Cost: ₹0.00 at scale)
* **The Strategy**: The app handles scheduling on-device using the local OS calendar framework (`expo-notifications`).
* **The Mechanics**: Every time the user logs their monthly net worth or opens the app to read a story, the app cancels any old notification and schedules a fresh one for tomorrow (24 hours later):
  * E.g., *"🔥 Keep your 12-day streak alive! Tap to confirm today's net worth."*
* **The Cost**: **₹0.00**. No servers, no FCM payloads, works 100% offline.

### B. Remote Push Notifications (Cost: ₹0.00 Standard Tier)
* If we need to send marketing notifications (e.g., introducing a new simulator story scenario to all users):
* **FCM (Android) & APNs (iOS)**: Direct payload delivery is entirely free.
* **Expo Push API**: EAS provides free push notifications delivery to FCM/APNs.

---

## 🎨 7. Premium UI shared Style System & Error Boundaries

### Shared Style Providers (Theme Wrapper)
We avoid messy styling variables. All React Native views are wrapped inside a glassmorphic Theme Provider.

```tsx
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext(ThemeColors);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeContext.Provider value={ThemeColors}>{children}</ThemeContext.Provider>;
};
```

### Dynamic Error Boundaries
To prevent the app from completely crashing and showing a blank screen on unexpected math/runtime errors, wrap the Core Navigation inside a premium `ErrorBoundary fallback UI.

```tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text } from 'react-native';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Local-only memory logging. Kept on device.
    console.warn("Uncaught local crash: ", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0B0C10', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: '#FFA500', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ color: '#FFF', textAlign: 'center' }}>The math engine encountered an anomaly. Tap below to reload local state safely.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
```

---

## 💎 8. Ad-Friendly UI Layouts (Google AdMob)

To maximize ad visibility without breaking our premium FinTech visual look, we implement specific layout rules:

1. **Collapsible Banner Ads (Snapshot & Learn Tabs)**:
   * Positioned at the very bottom of the Snapshot and Learn screens. Banner height is locked at **50dp** (smart banners).
   * Container uses our frosted, translucent theme background so the banner floats cleanly instead of looking like an ugly sticker.
2. **Interstitial outcome triggers (Daily Tab)**:
   * Render an ad *only* when the user clicks "View Outcome" in the Daily Stories card. Because the user is highly curious to see the simulated results, they will tolerate a brief ad slide.

---

## 📶 9. Offline Detection & Fallback Protocols

Because we fetch today's Daily Story via CDN fetch, we handle network drops gracefully:

1. **NetInfo Listener**: Using `@react-native-community/netinfo`, track connections.
2. **The "Offline Mode" Toast**: If disconnected, display a glowing, warm amber header bar reading: *"Offline Mode - Preloaded Stories Enabled"*.
3. **Local Fallback Pool**: If the network fetch fails, the app automatically selects one of **30 pre-cached, classic financial stories** stored directly in the offline bundle, guaranteeing 100% playable uptime.
