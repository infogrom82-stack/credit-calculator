# Credit Calculator - Design Guidelines

## Brand Identity

**Purpose**: A precise, trustworthy tool for calculating loan payments, interest rates, and total costs. Users need quick, accurate financial calculations without complexity.

**Aesthetic Direction**: **Refined Minimalism** - Inspired by Apple's design language. Characterized by generous whitespace, subtle depth through elevation (not shadows), precise typography, and restrained color use. The app feels precise, professional, and effortlessly elegant.

**Memorable Element**: The calculator interface uses a **card-based elevation system** with subtle gradient borders that respond to light/dark mode, creating depth without heavy shadows - distinctly premium.

## Navigation Architecture

**Root Navigation**: Stack-only (single focused task)

**Screen List**:
1. **Calculator** (Home) - Primary calculation interface
2. **History** (Modal) - Saved calculations list
3. **Settings** (Modal) - App preferences and user profile

No authentication required. Profile settings included for personalization.

## Screen-by-Screen Specifications

### 1. Calculator Screen (Home)
- **Purpose**: Calculate monthly payments, total interest, and loan summary
- **Header**: 
  - Transparent background
  - Title: "Credit Calculator" (centered)
  - Right button: "History" icon
  - No search bar
- **Layout**:
  - Root view: ScrollView
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
  - Content: Vertically stacked cards with generous spacing
- **Components**:
  - Input Card: Loan amount, interest rate, term (months/years toggle)
  - Segmented control for loan type (Annuity/Differentiated)
  - Results Card: Monthly payment (large, bold), total interest, total amount
  - Payment schedule button (expands inline to show month-by-month breakdown)
  - Floating "Save" button (bottom right) to save calculation to history
- **Empty State**: None (always interactive)

### 2. History Screen (Modal)
- **Purpose**: View and reload saved calculations
- **Header**: 
  - Title: "History"
  - Left button: "Close"
  - Right button: "Clear All" (if items exist)
- **Layout**:
  - Root view: FlatList
  - Top inset: Spacing.xl (non-transparent header)
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**:
  - List items: Compact cards showing loan amount, rate, term, monthly payment
  - Tap to load calculation back into calculator
  - Swipe-to-delete individual items
- **Empty State**: Centered illustration (empty-history.png) with "No Saved Calculations" text

### 3. Settings Screen (Modal)
- **Purpose**: Configure app preferences and user profile
- **Header**:
  - Title: "Settings"
  - Left button: "Close"
- **Layout**:
  - Root view: ScrollView (form-style)
  - Top inset: Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Components**:
  - Profile section: Avatar (1 preset), display name field
  - Preferences: Theme toggle (Light/Dark/Auto), currency selection, default loan type
  - Links: Privacy policy, terms of service (placeholder URLs)

## Color Palette

**Primary**: #1C1C1E (Deep Charcoal) - main UI elements
**Accent**: #0A84FF (Apple Blue) - interactive elements, key metrics
**Background Light**: #FFFFFF
**Background Dark**: #000000
**Surface Light**: #F2F2F7 (card backgrounds)
**Surface Dark**: #1C1C1E
**Border Light**: #C6C6C8
**Border Dark**: #38383A
**Text Primary Light**: #000000
**Text Primary Dark**: #FFFFFF
**Text Secondary Light**: #6E6E73
**Text Secondary Dark**: #98989D
**Success**: #34C759 (positive indicators)
**Error**: #FF3B30 (validation warnings)

## Typography

**Font Family**: SF Pro (system font) - Apple's native typeface for precision and legibility

**Type Scale**:
- Display: 34pt, Bold (monthly payment result)
- Title 1: 28pt, Bold (screen titles)
- Title 2: 22pt, Semibold (card headers)
- Title 3: 20pt, Semibold (section labels)
- Body: 17pt, Regular (input labels, descriptions)
- Callout: 16pt, Regular (secondary info)
- Footnote: 13pt, Regular (hints, disclaimers)

## Visual Design

- **Icons**: SF Symbols (system icons) for all UI actions
- **Touchable Feedback**: 0.6 opacity on press for all interactive elements
- **Card Elevation**: Subtle 1px border (Border color), NO drop shadows except floating button
- **Floating Button Shadow** (Save button):
  - shadowOffset: {width: 0, height: 2}
  - shadowOpacity: 0.10
  - shadowRadius: 2
- **Input Fields**: Rounded rectangles, 12pt corner radius, Surface color background
- **Corner Radius**: 12pt for cards, 8pt for buttons, 20pt for floating button

## Assets to Generate

1. **icon.png**
   - Description: Minimalist calculator icon with percentage symbol, monochromatic with subtle gradient
   - Where used: App icon on device home screen

2. **splash-icon.png**
   - Description: Same as app icon, simplified for splash screen
   - Where used: Launch screen during app startup

3. **empty-history.png**
   - Description: Simple line illustration of empty document/folder in grayscale tones
   - Where used: History screen when no saved calculations exist

4. **avatar-preset.png**
   - Description: Neutral geometric avatar (circle with initials placeholder)
   - Where used: Settings screen user profile section