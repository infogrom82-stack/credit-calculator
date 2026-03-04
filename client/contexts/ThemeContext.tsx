import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { Colors } from "@/constants/theme";
import { getSettings, saveSettings, ThemeMode, Settings } from "@/lib/storage";

type ColorScheme = "light" | "dark";

interface ThemeContextType {
  theme: typeof Colors.light;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  const getEffectiveColorScheme = useCallback((): ColorScheme => {
    if (themeMode === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const colorScheme = getEffectiveColorScheme();
  const isDark = colorScheme === "dark";
  const theme = Colors[colorScheme];

  const loadTheme = useCallback(async () => {
    const settings = await getSettings();
    if (settings?.themeMode) {
      setThemeModeState(settings.themeMode);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    const settings = await getSettings();
    const newSettings: Settings = {
      currency: settings?.currency || "RUB",
      defaultLoanType: settings?.defaultLoanType || "annuity",
      language: settings?.language || "ru",
      themeMode: mode,
    };
    await saveSettings(newSettings);
  }, []);

  const refreshTheme = useCallback(async () => {
    await loadTheme();
  }, [loadTheme]);

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, themeMode, setThemeMode, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
