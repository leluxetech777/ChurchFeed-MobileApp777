# ChurchFeed Development Guide

## 🛠️ Development Mode Only
This setup is optimized for **development only** until all features are complete.

## 🏠 Daily Development (Default)

### Command for 99% of development work:
```bash
npm start
```

**What this does:**
- ✅ Uses your **local LAN** (192.168.40.78:3000)
- ✅ Both laptop and phone are on same WiFi
- ✅ Hot reload works perfectly
- ✅ No tunnels, no ngrok, no network errors
- ✅ Fast and reliable for UI work, database testing, auth flows

**When to use:**
- Building UI components
- Testing user registration/login
- Database operations
- General app development
- Any time Stripe checkout is NOT needed

---

## 💳 Stripe Checkout Testing (Occasional)

### Command for Stripe testing only:
```bash
npm run start:stripe
```

**What this does:**
- 🔴 Starts backend server
- 🔴 Creates ngrok tunnel automatically  
- 🔴 Updates .env with tunnel URL
- 🔴 Starts Expo development server
- 🔴 Enables Stripe checkout in Expo Go
- 🔴 Cleans up when you stop (Ctrl+C)

**When to use:**
- Testing church registration with payment
- Testing Stripe webhooks
- Verifying payment success flow
- Only when you need actual Stripe checkout

---

## 🔍 How to Confirm Your API Server

### Check the console logs when app starts:

**LAN Mode (Daily Dev):**
```
🏠 Using Development LAN: http://192.168.40.78:3000
🌍 API Client initialized with URL: http://192.168.40.78:3000
```

**Stripe Testing Mode:**
```
🔴 Using Stripe Testing Tunnel: https://abc123.ngrok-free.app
🌍 API Client initialized with URL: https://abc123.ngrok-free.app
```

### Check your .env file:

**LAN Mode:**
```bash
EXPO_PUBLIC_API_URL=http://192.168.40.78:3000
# EXPO_PUBLIC_STRIPE_TUNNEL_URL=
```

**Stripe Testing Mode:**
```bash
EXPO_PUBLIC_API_URL=http://192.168.40.78:3000
EXPO_PUBLIC_STRIPE_TUNNEL_URL=https://abc123.ngrok-free.app
```

---

## 🎯 Simple Workflow

### Starting Development
1. Make sure your backend is running: `cd backend && npm start`
2. Run: `npm start`  
3. Scan QR with Expo Go
4. Develop normally - everything should "just work"

### When You Need Stripe Testing
1. Stop regular development server (Ctrl+C)
2. Run: `npm run start:stripe`
3. Wait for ngrok tunnel to establish
4. Test your Stripe checkout flows
5. When done, stop (Ctrl+C) - automatically returns to LAN mode

### Back to Regular Development
1. Run: `npm start` (back to fast LAN mode)

---

## 🔧 Environment Details

### .env Configuration
- **EXPO_PUBLIC_APP_ENV:** `development` (always)
- **EXPO_PUBLIC_API_URL:** `http://192.168.40.78:3000` (your LAN)
- **EXPO_PUBLIC_STRIPE_TUNNEL_URL:** Set automatically by `npm run start:stripe`

### Network Priority
1. **Stripe tunnel URL** (when set by stripe testing mode)
2. **LAN URL** (default for daily development)

### No Configuration Needed
- App automatically detects which URL to use
- No manual .env editing required
- Clean switching between modes

---

## 📱 What You'll See

### In Expo Go Console (LAN Mode):
```
🏠 Using Development LAN: http://192.168.40.78:3000
🚀 Making API request to: http://192.168.40.78:3000/create-checkout-session
❌ API Request failed: [Network request failed]
```
*This is expected - Stripe checkout needs tunnel mode*

### In Expo Go Console (Stripe Mode):
```
🔴 Using Stripe Testing Tunnel: https://abc123.ngrok-free.app
🚀 Making API request to: https://abc123.ngrok-free.app/create-checkout-session  
✅ Response status: 200
```
*Stripe checkout now works perfectly*

---

## ✨ Benefits of This Setup

- **Simple:** Two commands total - `npm start` and `npm run start:stripe`
- **Fast:** LAN mode is instant, no tunnels for daily work
- **Reliable:** No network timeouts in daily development
- **Clean:** Automatic cleanup, no manual env switching
- **Clear:** Console logs tell you exactly which server you're using

---

## 🚨 Troubleshooting

### "Network request failed" during daily development
- ✅ **This is normal** if you're trying Stripe checkout in LAN mode
- 💡 **Solution:** Use `npm run start:stripe` for Stripe testing

### Stripe checkout not working
- ❌ Don't use `npm start` for Stripe testing
- ✅ **Use:** `npm run start:stripe` 

### Hot reload not working
- 🔄 Use `npm run start:clean` to clear Expo cache
- 📱 Make sure phone and laptop are on same WiFi

### Can't find backend server
- 🖥️ Make sure backend is running: `cd backend && npm start`
- 🌐 Verify your IP address in .env matches your actual LAN IP

---

**Keep it simple: `npm start` for everything, `npm run start:stripe` only when needed.**