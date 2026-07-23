# iOS Setup (Capacitor)

Wrap the Recruiting Hub web app as a native iOS app using Capacitor.

## Prerequisites
- Mac with **Xcode 15+** installed
- **CocoaPods**: `sudo gem install cocoapods`
- Apple Developer account ($99/yr) for App Store submission
- Node 18+ and npm/bun

## One-time setup (on your Mac)

```bash
# 1. Clone the repo from GitHub
git clone <your-repo-url>
cd recruiting-hub

# 2. Install dependencies
npm install     # or: bun install

# 3. Build the web app
npm run build

# 4. Add the iOS platform (only once)
npx cap add ios

# 5. Sync web assets into the iOS project
npx cap sync ios

# 6. Open in Xcode
npx cap open ios
```

## Every time you pull new changes from Lovable

```bash
git pull
npm install
npm run build
npx cap sync ios
```

Then hit **Run** in Xcode to test on a simulator or connected iPhone.

## Configuration

App identity is in `capacitor.config.ts`:
- **appId**: `com.recruitinghub.app` (change to your reverse-domain bundle ID)
- **appName**: `Recruiting Hub`
- **webDir**: `dist/client` (TanStack Start build output)

## Publishing to the App Store

1. In Xcode: **Signing & Capabilities** → select your Apple Developer team
2. Set a version number and build number
3. **Product → Archive**
4. Upload via **Organizer → Distribute App → App Store Connect**
5. Complete listing (screenshots, description, privacy) at appstoreconnect.apple.com
6. Submit for review (typically 1–3 days)

## Adding native features later

Common Capacitor plugins:
```bash
npm install @capacitor/camera @capacitor/push-notifications @capacitor/geolocation
npx cap sync ios
```

## Notes
- The web app runs inside a `WKWebView` — all existing routes, auth, and Supabase calls work unchanged.
- For push notifications, you'll need an Apple Push Notification service (APNs) key.
- Test on a real device before submitting — some behaviors differ from the simulator.
