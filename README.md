# **our**li — every hour, together

Start a Day with your friends. Every hour, everyone snaps a photo. Each hour's photos stay hidden until you post yours, then reveal side by side. At night you get an hour-by-hour recap, saved to a shared calendar that becomes your group's memory archive.

**Creator Days** let creators do the same with their Whop members: fans sign in with Whop, ourli checks they hold the creator's product, and every hour they see the creator's photo next to their own.

Built at the Consumer Mobile Hackathon with **Capy** (built it), **Convex** (backend, realtime, storage, scheduling), **Revyl** (cloud iOS builds and device testing), and **Whop** (Creator Day access).

## Stack

- Expo SDK 58 / React Native, Expo Router (`src/app`)
- Convex (`convex/`): schema, reactive queries for the hourly reveal, file storage for photos, a scheduled function that closes each Day and picks its cover, HTTP actions for Sign in with Whop (OAuth 2.1 + PKCE) and the Whop access check
- Local notifications for the hourly ping (`expo-notifications`)

## Run it

```bash
npm install
npx convex dev        # creates/links a Convex deployment and writes .env.local
npx expo start
```

Whop Creator Days need `WHOP_CLIENT_ID`, `WHOP_API_KEY` and `WHOP_PRODUCT_ID` set in the Convex deployment, with `<CONVEX_SITE_URL>/whop/callback` registered as the app's OAuth redirect URI. Without them, the join page offers a demo-mode join.
