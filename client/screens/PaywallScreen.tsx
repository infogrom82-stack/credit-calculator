import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Language, getTranslation } from "@/lib/translations";
import { getSettings } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

interface PaywallScreenProps {
  navigation: any;
}

const PRICE = "€4.99";

export default function PaywallScreen({ navigation }: PaywallScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { isTrialActive, trialDaysRemaining, packages, purchasePackage, restorePurchases } =
    useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>("en");

  const t = getTranslation(language);

  const loadSettings = useCallback(async () => {
    const settings = await getSettings();
    if (settings) {
      setLanguage(settings.language);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleSubscribe = async () => {
    if (packages.length === 0) {
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    try {
      const yearlyPackage = packages.find(
        (pkg) => pkg.packageType === "ANNUAL" || pkg.identifier.includes("annual")
      ) || packages[0];
      
      const success = await purchasePackage(yearlyPackage);
      if (success) {
        navigation.goBack();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    try {
      const success = await restorePurchases();
      if (success) {
        navigation.goBack();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueTrial = () => {
    navigation.goBack();
  };

  const features = [
    { icon: "calculator", text: t.unlimitedCalculations },
    { icon: "calendar", text: t.paymentSchedules },
    { icon: "clock", text: t.historySync },
    { icon: "x-circle", text: t.noAds },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.content, { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          style={[styles.closeButton, { top: insets.top + Spacing.lg }]}
          onPress={() => navigation.goBack()}
          testID="button-close"
        >
          <Feather name="x" size={24} color={theme.textSecondary} />
        </Pressable>

        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.link }]}>
            <Feather name="star" size={32} color="#FFFFFF" />
          </View>
          <ThemedText type="h1" style={styles.title}>
            {t.subscriptionTitle}
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t.subscriptionSubtitle}
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={[styles.featuresCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        >
          <ThemedText type="h4" style={styles.featuresTitle}>
            {t.premiumFeatures}
          </ThemedText>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: theme.link + "20" }]}>
                <Feather name={feature.icon as any} size={18} color={theme.link} />
              </View>
              <ThemedText type="body">{feature.text}</ThemedText>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.priceSection}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {t.trialInfo}
          </ThemedText>
          <View style={styles.priceRow}>
            <ThemedText type="display" style={{ color: theme.link }}>
              {PRICE}
            </ThemedText>
            <ThemedText type="h3" style={{ color: theme.textSecondary }}>
              {t.perYear}
            </ThemedText>
          </View>
        </Animated.View>

        <View style={styles.buttons}>
          <Pressable
            style={[styles.subscribeButton, { backgroundColor: theme.link }]}
            onPress={handleSubscribe}
            disabled={isLoading}
            testID="button-subscribe"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText type="h4" style={{ color: "#FFFFFF" }}>
                {t.startFreeTrial}
              </ThemedText>
            )}
          </Pressable>

          {isTrialActive && trialDaysRemaining > 0 ? (
            <Pressable
              style={[styles.secondaryButton, { borderColor: theme.border }]}
              onPress={handleContinueTrial}
              testID="button-continue-trial"
            >
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {t.continueWithTrial} ({trialDaysRemaining} {trialDaysRemaining === 1 ? t.year : t.trialDaysRemaining.split(" ").pop()})
              </ThemedText>
            </Pressable>
          ) : null}

          <Pressable
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isLoading}
            testID="button-restore"
          >
            <ThemedText type="small" style={{ color: theme.link }}>
              {t.restorePurchases}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "space-between",
  },
  closeButton: {
    position: "absolute",
    right: Spacing.lg,
    zIndex: 10,
    padding: Spacing.sm,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  featuresCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  featuresTitle: {
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  priceSection: {
    alignItems: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
  },
  buttons: {
    gap: Spacing.md,
  },
  subscribeButton: {
    height: 56,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    height: 48,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
});
