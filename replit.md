# Credit Calculator

## Overview

A cross-platform mobile application for calculating loan payments, interest rates, and total costs. Built with React Native and Expo, the app supports both annuity and differentiated loan calculations with a payment schedule breakdown. The app follows Apple's design language with refined minimalism, featuring a card-based elevation system and generous whitespace.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54, using the new architecture (React 19.1)

**Navigation**: React Navigation with native stack navigator
- Stack-only navigation pattern (no tabs in production)
- Modal presentations for History and Settings screens
- Calculator screen as the home/root screen

**State Management**:
- React Query (TanStack Query) for server state
- React Context for theme management
- Local component state for form inputs
- AsyncStorage for persistent local data (calculations history, settings)

**Styling Approach**:
- StyleSheet API with theme-aware colors
- Design tokens defined in `client/constants/theme.ts`
- Light/dark mode support with system preference detection
- Reanimated for smooth animations

**Key Design Patterns**:
- Path aliases: `@/` maps to `./client`, `@shared/` maps to `./shared`
- Keyboard-aware components with platform-specific handling
- Error boundaries for graceful error handling

### Backend Architecture

**Framework**: Express.js (v5) with TypeScript

**API Design**:
- RESTful endpoints prefixed with `/api`
- CORS configured for Replit domains and localhost development
- HTTP server created via `registerRoutes()` in `server/routes.ts`

**Storage Layer**:
- Abstract `IStorage` interface for data access
- In-memory implementation (`MemStorage`) as default
- PostgreSQL ready via Drizzle ORM (schema in `shared/schema.ts`)

### Data Storage

**Client-side**:
- AsyncStorage for calculations history and user settings
- Settings include: currency, default loan type, language, theme mode

**Server-side**:
- Drizzle ORM with PostgreSQL dialect
- Schema defined in `shared/schema.ts` with Zod validation via `drizzle-zod`
- Migrations output to `./migrations` directory

### Localization

Multi-language support with translations in `client/lib/translations.ts`:
- Russian (default), English, Spanish, Polish, German, Italian, French

### Monetization

**Subscription Model**:
- 10-day free trial period tracked via AsyncStorage
- €4.99/year subscription after trial expires
- RevenueCat SDK for iOS/Android in-app purchases (dynamically loaded on native platforms only)
- Web platform shows paywall but cannot process purchases

**Key Files**:
- `client/contexts/SubscriptionContext.tsx`: Manages trial state and RevenueCat integration
- `client/screens/PaywallScreen.tsx`: Subscription purchase UI
- Environment variable: `EXPO_PUBLIC_REVENUECAT_API_KEY` (required for native purchases)

## External Dependencies

### Core Frameworks
- **Expo SDK 54**: Cross-platform mobile development
- **React Navigation 7**: Native navigation with stack and bottom tabs
- **Express 5**: Backend HTTP server

### Database
- **PostgreSQL**: Primary database (via `pg` driver)
- **Drizzle ORM**: Type-safe database queries and migrations

### UI/UX Libraries
- **React Native Reanimated**: Performant animations
- **React Native Gesture Handler**: Touch interactions
- **Expo Blur/Glass Effect**: iOS-style blur effects
- **Expo Haptics**: Tactile feedback

### Data Management
- **TanStack React Query**: Server state caching
- **AsyncStorage**: Local persistence
- **Zod**: Schema validation

### Development
- **TSX**: TypeScript execution for server
- **Babel with module-resolver**: Path aliasing
- **ESLint + Prettier**: Code formatting