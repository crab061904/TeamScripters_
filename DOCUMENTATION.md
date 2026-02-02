# MyNagaAssist - Frontend Documentation

## Tech Stack

### Core Technologies

- **React Native** with Expo
- **TypeScript** for type safety
- **NativeWind** (Tailwind CSS for React Native)
- **Expo Router** for navigation
- **Google Fonts (Poppins)** for typography

### Key Libraries

- `@expo-google-fonts/poppins` - Font family
- `@expo/vector-icons` - Icon components
- `react-native-safe-area-context` - Safe area handling
- `nativewind` - Tailwind CSS implementation

---

## OCR Prototype (Phone vs Web)

### Web

On web, OCR runs directly in the browser.

### Android/iOS (Expo Go)

On phone, OCR runs via a small local backend server (because `tesseract.js` is not reliable inside Expo Go on-device).

#### 1) Start the OCR backend server

From the project root:

```bash
cd ocr-server
npm install
npm start
```

The server listens on port `8787`.

#### 2) Point the app to your backend server

Set `EXPO_PUBLIC_OCR_BACKEND_URL` to your PC’s LAN IP (not `localhost`). Example:

```env
EXPO_PUBLIC_OCR_BACKEND_URL=http://192.168.1.50:8787
```

Then restart Expo with a clean cache:

```bash
npx expo start -c
```

#### Notes

- Your phone and PC must be on the same Wi-Fi.
- If you get a network error, allow port `8787` through Windows Firewall.

---

## Styling System

### Light & Dark Mode

The app supports automatic light/dark mode switching with manual toggle capability.

#### Default Behavior

- **Default**: Light mode
- **System**: Follows device appearance settings
- **Manual**: Users can toggle via theme switcher button

#### Styling Syntax

**Light Mode (Default):**

```tsx
<View className="bg-white">
  <Text className="text-gray-900">Light mode text</Text>
</View>
```

**Dark Mode Override:**

```tsx
<View className="bg-white dark:bg-slate-950">
  <Text className="text-gray-900 dark:text-white">Adaptive text</Text>
</View>
```

**Pattern:** Use `dark:` prefix for dark mode specific styles

#### Common Color Patterns

| Element           | Light Mode         | Dark Mode               |
| ----------------- | ------------------ | ----------------------- |
| Main Background   | `bg-indigo-100/30` | `dark:bg-[#2C2932]`     |
| Card Background   | `bg-white`         | `dark:bg-[#1E1D23]`     |
| Header Background | `bg-orange-100`    | `dark:bg-indigo-950/60` |
| Primary Text      | `text-gray-900`    | `dark:text-white`       |
| Secondary Text    | `text-gray-600`    | `dark:text-gray-200`    |
| Borders           | `border-gray-200`  | `dark:border-slate-800` |

---

## Typography System

### Font Family Usage

All text should use Poppins font family with appropriate weights:

```tsx
{
  /* Regular (400) - Default */
}
<Text className="font-poppins-reg">Regular text</Text>;

{
  /* Semibold (600) */
}
<Text className="font-poppins-semibold">Semibold text</Text>;

{
  /* Bold (700) */
}
<Text className="font-poppins-bold">Bold text</Text>;
```

### Font Weight Guidelines

- **`font-poppins-reg`**: Body text, labels, descriptions
- **`font-poppins-semibold`**: Subtitles, button text, emphasis
- **`font-poppins-bold`**: Titles, headers, important text

---

## Icon System

### Icon Colors (Active/Inactive States)

#### Tab Bar Icons

```tsx
<FontAwesome6
  name="house"
  solid={focused}
  className={`${
    focused
      ? "text-[#F33C25] dark:text-[#FB634B]" // Active: Red (light), Orange (dark)
      : "text-[#5C596C] dark:text-[#A8A8A9]" // Inactive: Gray variants
  }`}
/>
```

#### Color Scheme

- **Active (Light)**: `text-[#F33C25]` (Red)
- **Active (Dark)**: `text-[#FB634B]` (Orange)
- **Inactive (Light)**: `text-[#5C596C]` (Dark Gray)
- **Inactive (Dark)**: `text-[#A8A8A9]` (Light Gray)

---

## NativeWind (Tailwind) Usage

### Basic Styling

```tsx
<View className="flex-1 bg-white dark:bg-slate-950">
  <Text className="font-poppins-bold text-xl dark:text-white">Hello World</Text>
</View>
```

### Common Patterns

#### Container Styling

```tsx
{/* Full screen container */}
<View className="flex-1 bg-indigo-100/30 dark:bg-[#2C2932]">

{/* Card container */}
<View className="bg-white dark:bg-[#1E1D23] rounded-2xl p-4 shadow-sm">

{/* Section container */}
<View className="px-4 py-6 bg-white dark:bg-[#1E1D23]">

{/* Header container */}
<View className="bg-orange-100 dark:bg-indigo-950/60 pt-12 pb-8 px-4">
```

#### Button Styling

```tsx
<TouchableOpacity className="bg-indigo-600 dark:bg-indigo-500 py-3 rounded-full">
  <Text className="text-white font-poppins-semibold text-center">Button</Text>
</TouchableOpacity>
```

#### Input Styling

```tsx
<TextInput
  className="bg-white dark:bg-[#1E1D23] p-3 rounded-xl border border-gray-200 dark:border-slate-700"
  placeholderTextColor="#9CA3AF"
/>
```

### Responsive Design

```tsx
{/* Flex layouts */}
<View className="flex-row justify-between items-center">
<View className="flex-col space-y-4">

{/* Grid layouts */}
<View className="flex-row flex-wrap justify-between">
```

---

## Theme Implementation

### Manual Theme Toggle

```tsx
import { useColorScheme } from "nativewind";

const { colorScheme, toggleColorScheme } = useColorScheme();

// Toggle button
<Pressable onPress={toggleColorScheme}>
  <Ionicons
    name={colorScheme === "dark" ? "moon" : "sunny"}
    size={24}
    color={colorScheme === "dark" ? "#FFFFFF" : "#000000"}
  />
</Pressable>;
```

### Theme-Aware Components

```tsx
function ThemedCard({ children }) {
  return (
    <View className="bg-white dark:bg-[#1E1D23] rounded-2xl p-4 shadow-sm">
      {children}
    </View>
  );
}
```

---

## Color Palette

### Primary Colors

- **Primary Red**: `#F33C25` (Light mode active)
- **Primary Orange**: `#FB634B` (Dark mode active)
- **Indigo**: `#3B1C6D` (Brand color)

### Background Colors

- **White**: `#FFFFFF` / `bg-white`
- **Slate 950**: `#0F172A` / `dark:bg-slate-950`
- **Custom Dark**: `#1E1D23` / `dark:bg-[#1E1D23]`
- **Custom Dark BG**: `#2C2932` / `dark:bg-[#2C2932]`
- **Main Background**: `bg-indigo-100/30` (light) / `dark:bg-[#2C2932]` (dark)
- **Header Background**: `bg-orange-100` (light) / `dark:bg-indigo-950/60` (dark)

### Text Colors

- **Primary Text**: `text-gray-900` / `dark:text-white`
- **Secondary Text**: `text-gray-600` / `dark:text-gray-200`
- **Muted Text**: `text-gray-400` / `dark:text-gray-400`

---

## Best Practices

### 1. Always Provide Dark Mode Variants

```tsx
// ✅ Good - Use consistent background pattern
<View className="bg-indigo-100/30 dark:bg-[#2C2932]">
  <Text className="text-gray-900 dark:text-white">Content</Text>
</View>

// ✅ Good - Use card background pattern
<View className="bg-white dark:bg-[#1E1D23]">
  <Text className="text-gray-900 dark:text-white">Content</Text>
</View>

// ❌ Bad - No dark mode support
<View className="bg-white">
  <Text className="text-gray-900">Content</Text>
</View>
```

### 2. Use Semantic Font Classes

```tsx
// ✅ Good
<Text className="font-poppins-semibold">Subtitle</Text>

// ❌ Bad - Inconsistent
<Text className="font-semibold">Subtitle</Text>
```

### 3. Consistent Icon Colors

```tsx
// ✅ Follow the established color scheme
className = "text-[#F33C25] dark:text-[#FB634B]";
```

### 4. Component Structure

```tsx
// ✅ Organized structure with consistent backgrounds
<View className="flex-1 bg-indigo-100/30 dark:bg-[#2C2932]">
  <ScrollView className="flex-1">
    <View className="px-4 py-6 bg-white dark:bg-[#1E1D23]">
      {/* Content */}
    </View>
  </ScrollView>
</View>
```

---

## File Structure

```
app/
├── _layout.tsx              # Root layout with theme provider
├── (tabs)/
│   ├── _layout.tsx          # Tab navigation with theme-aware styling
│   ├── index.tsx            # Home screen with theme toggle
│   ├── services.tsx         # Services screen
│   ├── news.tsx             # News screen
│   ├── emergency.tsx       # Emergency screen
│   └── account.tsx          # Account screen
├── global.css               # Tailwind base styles
└── ...

components/
├── themed-text.tsx          # Theme-aware text component
├── themed-view.tsx          # Theme-aware view component
└── ...

tailwind.config.js           # Tailwind configuration with custom fonts
```

---

## Screen Structure Pattern

All screens follow a consistent structure pattern:

```tsx
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

export default function ScreenName() {
  return (
    <SafeAreaProvider>
      <View className="flex-1 font-poppins-reg dark:text-white">
        <ScrollView className="font-poppins-reg bg-indigo-100/30 dark:bg-[#2C2932] flex-1 justify-center items-center">
          {/* Screen Content */}
        </ScrollView>
      </View>
    </SafeAreaProvider>
  );
}
```

### Key Pattern Elements:

- **SafeAreaProvider**: Ensures proper safe area handling
- **Main Container**: `flex-1 font-poppins-reg dark:text-white`
- **ScrollView**: `font-poppins-reg bg-indigo-100/30 dark:bg-[#2C2932] flex-1 justify-center items-center`

---

## Background Color System

### Consistent Background Pattern

- **Main Background**: `bg-indigo-100/30` (light) / `dark:bg-[#2C2932]` (dark)
- **Card Background**: `bg-white` (light) / `dark:bg-[#1E1D23]` (dark)
- **Header Background**: `bg-orange-100` (light) / `dark:bg-indigo-950/60` (dark)

### Usage Examples:

```tsx
// Main screen background
<View className="bg-indigo-100/30 dark:bg-[#2C2932]">

// Card/container background
<View className="bg-white dark:bg-[#1E1D23]">

// Header section
<View className="bg-orange-100 dark:bg-indigo-950/60">
```

---

## Quick Reference

### Common Classes

```tsx
// Layout
flex-1, flex-row, flex-col
justify-center, items-center
px-4, py-6, m-4

// Colors
bg-indigo-100/30, dark:bg-[#2C2932]  // Main background
bg-white, dark:bg-[#1E1D23]          // Card background
bg-orange-100, dark:bg-indigo-950/60 // Header background
text-gray-900, dark:text-white       // Primary text
text-gray-600, dark:text-gray-200    // Secondary text
border-gray-200, dark:border-slate-800 // Borders

// Typography
font-poppins-reg, font-poppins-semibold, font-poppins-bold
text-xs, text-sm, text-base, text-lg, text-xl

// Shapes
rounded-xl, rounded-2xl, rounded-full
shadow-sm, shadow-md
```

This documentation serves as a comprehensive guide for maintaining consistency across the MyNagaAssist frontend application.
