# ChurchFeed - React Native Mobile App

ChurchFeed is a React Native mobile application built with Expo that allows churches to create announcement feeds for their members. Churches can register, create posts, and members can join to receive push notifications and view announcements.

## Features

### Core Features
- **Church Registration**: Churches can register as HQ or branches with subscription billing
- **Member Join**: Simple registration for members to join church feeds
- **Announcement Feed**: Real-time feed showing church announcements
- **Push Notifications**: Members receive notifications for new posts
- **Admin Dashboard**: Church administrators can manage posts and settings
- **Branch Management**: HQ churches can send posts to selected branches
- **Subscription Billing**: Tiered pricing based on member count

### User Roles
- **Admins**: Church staff who can post announcements and manage the church account
- **Members**: Church members who receive and view announcements

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (Database, Authentication, Real-time)
- **UI Framework**: React Native Paper
- **Navigation**: Expo Router
- **State Management**: React Context API
- **Forms**: React Hook Form
- **Payments**: Stripe
- **Notifications**: Expo Notifications
- **Image Handling**: Expo Image Picker

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Expo CLI installed: `npm install -g @expo/cli`
- Supabase account
- Stripe account
- iOS Simulator or Android Emulator (or physical device)

### 1. Clone and Install
```bash
npm install
```

### 2. Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in your environment variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

### 3. Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor
3. This will create all necessary tables, RLS policies, and functions

### 4. Stripe Setup
1. Create Stripe products and prices for subscription tiers:
   - Tier 1: $10/month (0-50 members)
   - Tier 2: $15/month (51-150 members)
   - Tier 3: $20/month (151-499 members)
   - Tier 4: $50/month (500+ members)
2. Update price IDs in `services/stripe.ts`

### 5. Run the App
```bash
# Start Expo development server
npm start

# Or run on specific platform
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser
```

## Subscription Tiers

| Tier | Member Range | Price/Month | Features |
|------|-------------|-------------|----------|
| 1    | 0-50        | $10         | Basic announcements |
| 2    | 51-150      | $15         | Basic + branch support |
| 3    | 151-499     | $20         | Advanced features |
| 4    | 500+        | $50         | Enterprise features |

All plans include:
- Unlimited announcements
- Push notifications
- Image attachments
- 7-day free trial

## Project Structure

```
ChurchFeed/
├── app/                          # Expo Router pages
├── contexts/                     # React Context providers
├── screens/                      # Screen components
├── services/                     # API and service layers
├── lib/                         # Utilities and configuration
├── types/                       # TypeScript type definitions
├── supabase-schema.sql          # Database schema for setup
└── .env.example                 # Environment variables template
```

## Deployment

### Expo Application Services (EAS)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build for production
eas build --platform all

# Submit to app stores
eas submit
```

## API Endpoints Needed

The app expects these backend API endpoints (implement using Supabase Edge Functions):

### Stripe Integration
- `POST /create-customer` - Create Stripe customer
- `POST /create-subscription` - Create subscription
- `POST /update-subscription` - Update subscription plan
- `POST /cancel-subscription` - Cancel subscription

### Notifications
- `POST /send-notifications` - Send push notifications
- `POST /send-church-notification` - Broadcast to church members

## Troubleshooting

**App won't start:**
- Check that all environment variables are set correctly
- Ensure Node.js version is 18+
- Clear Expo cache: `npx expo r -c`

**Database connection issues:**
- Verify Supabase URL and anon key
- Check that RLS policies are correctly set up
- Ensure database schema has been applied

**Stripe integration issues:**
- Confirm publishable key is correct
- Verify price IDs match your Stripe products

**Push notifications not working:**
- Check Expo notification permissions
- Test on physical device (doesn't work in simulator)
