# Axiom Connect

Axiom Connect is a React Native mobile application built with Expo and TypeScript that enables seamless volunteer coordination and team management. The app provides real-time messaging, scheduling, task assignments, and crew management capabilities.

## Features

- **Authentication**: Secure login and verification system
- **Dashboard**: Home screen with key metrics and quick actions
- **Crew Management**: View and manage volunteer crews and team members
- **Messaging**: Real-time chat functionality with team members
- **Inbox**: Centralized message management
- **Notifications**: Stay updated with real-time notifications
- **Schedule**: View and manage volunteer schedules
- **Task Management**: Create, assign, and track tasks
- **Responsive Design**: Mobile-optimized UI with Tailwind CSS

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Routing**: Expo Router with file-based routing
- **Styling**: Tailwind CSS (via NativeWind)
- **Backend**: Supabase
- **UI Components**: iconsax-react-native icons
- **State Management**: Built-in React hooks with async storage
- **Build**: Metro bundler

## Project Structure

```
axiom-connect/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout
│   ├── global.css         # Global styles
│   ├── (auth)/            # Authentication routes
│   │   ├── login.tsx
│   │   └── verify.tsx
│   ├── (tabs)/            # Tab-based routes
│   │   ├── _layout.tsx
│   │   ├── crew.tsx
│   │   ├── inbox.tsx
│   │   ├── index.tsx
│   │   ├── notifications.tsx
│   │   └── schedule.tsx
│   └── chat/              # Chat routes
│       └── [id].tsx       # Dynamic chat room
├── components/            # Reusable UI components
├── constants/             # Global constants and theme
├── lib/                   # Utility functions and configs
├── assets/                # Images and static assets
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
└── tailwind.config.js    # Tailwind CSS configuration
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd axiom-connect
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables**
   Create a `.env` or `.env.local` file with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device
- `npm run web` - Run in web browser

## Key Components

- **BottomNav**: Tab navigation component
- **TaskCard**: Display task information
- **VolunteerCard**: Display volunteer profiles
- **Accordion**: Expandable content component
- **InboxCard**: Message/inbox item display
- **NotificationCard**: Notification display component

## Navigation

The app uses Expo Router for file-based routing:
- **(auth)** group - Authentication screens (login, verification)
- **(tabs)** group - Main tabbed interface (home, crew, inbox, notifications, schedule)
- **chat** - Dynamic chat room screens

## Development

- Built with React 19.1.0 and React Native 0.81.5
- Strict TypeScript configuration for type safety
- NativeWind integration for Tailwind CSS support
- Responsive design that works across iOS, Android, and web

## Dependencies

Key dependencies include:
- `expo`: Framework for React Native development
- `expo-router`: Navigation framework
- `nativewind`: Tailwind CSS for React Native
- `@supabase/supabase-js`: Backend service
- `react-native-reanimated`: Animation library
- `iconsax-react-native`: Icon library

## License

Private project - All rights reserved

---

For more information about Expo, visit [expo.dev](https://expo.dev)
