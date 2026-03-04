import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getSettings, saveSettings, Settings, ThemeMode, getUserUuid } from "@/lib/storage";
import { Language, languages, getTranslation } from "@/lib/translations";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface SettingsScreenProps {
  navigation: any;
}

const currencySymbols: Record<string, string> = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
  PLN: "zł",
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { isSubscribed, isTrialActive, trialDaysRemaining } = useSubscription();
  const [settings, setSettings] = useState<Settings>({
    currency: "RUB",
    defaultLoanType: "annuity",
    language: "ru",
    themeMode: "system",
  });

  const t = getTranslation(settings.language);

  const loanTypes = [
    { value: "annuity" as const, label: t.annuity },
    { value: "differentiated" as const, label: t.differentiated },
  ];

  const currencies = [
    { code: "USD", symbol: currencySymbols.USD, name: t.currencyUSD },
    { code: "EUR", symbol: currencySymbols.EUR, name: t.currencyEUR },
    { code: "PLN", symbol: currencySymbols.PLN, name: t.currencyPLN },
    { code: "RUB", symbol: currencySymbols.RUB, name: t.currencyRUB },
  ];

  const themeModes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: "light", label: t.lightTheme, icon: "sun" },
    { value: "dark", label: t.darkTheme, icon: "moon" },
    { value: "system", label: t.systemTheme, icon: "smartphone" },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const saved = await getSettings();
    if (saved) {
      setSettings(saved);
    }
  };

  const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
    setSettings((prev) => ({ ...prev, themeMode: mode }));
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  const handleConnectTelegram = async () => {
    const userUuid = await getUserUuid();
    const telegramUrl = `https://t.me/ugarant_bot?start=${userUuid}`;
    Linking.openURL(telegramUrl);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t.settings,
    });
  }, [navigation, t.settings]);

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
      ]}
    >
      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t.subscription}
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <Pressable
            style={styles.settingRow}
            onPress={() => navigation.navigate("Paywall")}
            testID="button-subscription"
          >
            <View style={styles.subscriptionInfo}>
              <View style={[styles.subscriptionIcon, { backgroundColor: theme.link }]}>
                <Feather name="star" size={18} color="#FFFFFF" />
              </View>
              <View>
                <ThemedText type="body">
                  {isSubscribed ? "Pro" : isTrialActive ? t.trialDaysRemaining : t.trialExpired}
                </ThemedText>
                {!isSubscribed && isTrialActive ? (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {trialDaysRemaining} {trialDaysRemaining === 1 ? t.year : t.trialDaysRemaining.split(" ").pop()}
                  </ThemedText>
                ) : null}
              </View>
            </View>
            {isSubscribed ? (
              <Feather name="check-circle" size={20} color={theme.success} />
            ) : (
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t.appearance}
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {themeModes.map((mode, index) => (
            <Pressable
              key={mode.value}
              style={[
                styles.settingRow,
                index < themeModes.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
              ]}
              onPress={() => handleThemeChange(mode.value)}
              testID={`button-theme-${mode.value}`}
            >
              <View style={styles.themeInfo}>
                <View style={[styles.themeIcon, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name={mode.icon as any} size={18} color={theme.text} />
                </View>
                <ThemedText type="body">{mode.label}</ThemedText>
              </View>
              {themeMode === mode.value ? (
                <Feather name="check" size={20} color={theme.link} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t.language}
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {languages.map((lang, index) => (
            <Pressable
              key={lang.code}
              style={[
                styles.settingRow,
                index < languages.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
              ]}
              onPress={() => updateSetting("language", lang.code)}
              testID={`button-language-${lang.code}`}
            >
              <ThemedText type="body">{lang.nativeName}</ThemedText>
              {settings.language === lang.code ? (
                <Feather name="check" size={20} color={theme.link} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t.currency}
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {currencies.map((currency, index) => (
            <Pressable
              key={currency.code}
              style={[
                styles.settingRow,
                index < currencies.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
              ]}
              onPress={() => updateSetting("currency", currency.code)}
              testID={`button-currency-${currency.code}`}
            >
              <View style={styles.currencyInfo}>
                <ThemedText type="h4" style={styles.currencySymbol}>
                  {currency.symbol}
                </ThemedText>
                <ThemedText type="body">{currency.name}</ThemedText>
              </View>
              {settings.currency === currency.code ? (
                <Feather name="check" size={20} color={theme.link} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t.defaultPaymentType}
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          {loanTypes.map((type, index) => (
            <Pressable
              key={type.value}
              style={[
                styles.settingRow,
                index < loanTypes.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
              ]}
              onPress={() => updateSetting("defaultLoanType", type.value)}
              testID={`button-loan-type-${type.value}`}
            >
              <ThemedText type="body">{type.label}</ThemedText>
              {settings.defaultLoanType === type.value ? (
                <Feather name="check" size={20} color={theme.link} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          TELEGRAM
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <Pressable
            style={styles.settingRow}
            onPress={handleConnectTelegram}
            testID="button-connect-telegram"
          >
            <View style={styles.telegramInfo}>
              <View style={[styles.telegramIcon, { backgroundColor: "#0088cc" }]}>
                <Feather name="send" size={18} color="#FFFFFF" />
              </View>
              <ThemedText type="body">{t.connectTelegram}</ThemedText>
            </View>
            <Feather name="external-link" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {t.information}
        </ThemedText>
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}>
          <Pressable
            style={[styles.settingRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
            onPress={() => handleOpenLink("https://example.com/privacy")}
            testID="button-privacy"
          >
            <ThemedText type="body">{t.privacyPolicy}</ThemedText>
            <Feather name="external-link" size={18} color={theme.textSecondary} />
          </Pressable>
          <Pressable
            style={styles.settingRow}
            onPress={() => handleOpenLink("https://example.com/terms")}
            testID="button-terms"
          >
            <ThemedText type="body">{t.termsOfService}</ThemedText>
            <Feather name="external-link" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ThemedText type="small" style={[styles.version, { color: theme.textSecondary }]}>
        Credit Calculator v1.0.0
      </ThemedText>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.lg,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
  },
  currencyInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  currencySymbol: {
    width: 28,
    textAlign: "center",
  },
  themeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  themeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  subscriptionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  subscriptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  telegramInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  telegramIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  version: {
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
