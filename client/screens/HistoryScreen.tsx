import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Image,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getCalculations, deleteCalculation, clearAllCalculations, getSettings, Calculation } from "@/lib/storage";
import { formatCurrency } from "@/lib/calculator";
import { Language, getTranslation, formatTermLabel } from "@/lib/translations";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface HistoryItemProps {
  item: Calculation;
  theme: any;
  currency: string;
  language: Language;
  onPress: () => void;
  onDelete: () => void;
  index: number;
}

function HistoryItem({ item, theme, currency, language, onPress, onDelete, index }: HistoryItemProps) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const t = getTranslation(language);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = Math.max(e.translationX, -80);
      }
    })
    .onEnd(() => {
      if (translateX.value < -40) {
        translateX.value = withSpring(-80, { damping: 20 });
      } else {
        translateX.value = withSpring(0, { damping: 20 });
      }
    });

  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.98, { damping: 15 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15 });
    })
    .onEnd(() => {
      scheduleOnRN(onPress);
    });

  const composed = Gesture.Race(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -20 ? 1 : 0,
  }));

  const termLabel = formatTermLabel(item.term, item.termType, language);
  const loanTypeLabel = item.loanType === "annuity" ? t.annuity : t.differentiated;

  const date = new Date(item.createdAt);
  const dateStr = date.toLocaleDateString(language === "ru" ? "ru-RU" : language === "de" ? "de-DE" : language === "es" ? "es-ES" : language === "pl" ? "pl-PL" : language === "it" ? "it-IT" : language === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short" });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
      style={styles.itemContainer}
    >
      <Animated.View style={[styles.deleteButton, { backgroundColor: theme.error }, deleteButtonStyle]}>
        <Pressable style={styles.deleteButtonInner} onPress={onDelete} testID={`button-delete-${item.id}`}>
          <Feather name="trash-2" size={20} color="#FFFFFF" />
        </Pressable>
      </Animated.View>
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            styles.historyItem,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border },
            animatedStyle,
          ]}
        >
          <View style={styles.itemLeft}>
            <ThemedText type="h4">{formatCurrency(item.amount, currency)}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {item.rate}% · {termLabel} · {loanTypeLabel.substring(0, 6)}.
            </ThemedText>
          </View>
          <View style={styles.itemRight}>
            <ThemedText type="body" style={{ fontWeight: "600", color: theme.link }}>
              {formatCurrency(item.monthlyPayment, currency)}{t.perMonth}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {dateStr}
            </ThemedText>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

interface HistoryScreenProps {
  navigation: any;
}

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { hasFullAccess } = useSubscription();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState("RUB");
  const [language, setLanguage] = useState<Language>("ru");

  const t = getTranslation(language);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [data, settings] = await Promise.all([getCalculations(), getSettings()]);
    setCalculations(data);
    if (settings) {
      if (settings.currency) setCurrency(settings.currency);
      if (settings.language) setLanguage(settings.language);
    }
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleItemPress = (item: Calculation) => {
    navigation.navigate("Calculator", { calculation: item });
  };

  const handleDelete = async (id: string) => {
    await deleteCalculation(id);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setCalculations((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearAll = () => {
    if (Platform.OS === "web") {
      clearAllCalculations();
      setCalculations([]);
    } else {
      Alert.alert(
        t.clearHistory,
        t.clearHistoryConfirm,
        [
          { text: t.cancel, style: "cancel" },
          {
            text: t.delete,
            style: "destructive",
            onPress: async () => {
              await clearAllCalculations();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setCalculations([]);
            },
          },
        ]
      );
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t.history,
      headerRight: () =>
        calculations.length > 0 ? (
          <Pressable onPress={handleClearAll} hitSlop={8} testID="button-clear-all">
            <ThemedText type="body" style={{ color: theme.error }}>
              {t.clear}
            </ThemedText>
          </Pressable>
        ) : null,
    });
  }, [navigation, calculations.length, theme, t]);

  const renderItem = useCallback(
    ({ item, index }: { item: Calculation; index: number }) => (
      <HistoryItem
        item={item}
        theme={theme}
        currency={currency}
        language={language}
        onPress={() => handleItemPress(item)}
        onDelete={() => handleDelete(item.id)}
        index={index}
      />
    ),
    [theme, currency, language]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.emptyContainer}>
        <Image
          source={require("../../assets/images/empty-history.png")}
          style={styles.emptyImage}
          resizeMode="contain"
        />
        <ThemedText type="h3" style={styles.emptyTitle}>
          {t.noSavedCalculations}
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
          {t.noSavedCalculationsDesc}
        </ThemedText>
      </Animated.View>
    ),
    [theme, t]
  );

  if (!hasFullAccess) {
    return (
      <View
        style={[
          styles.container,
          styles.lockedContainer,
          { backgroundColor: theme.backgroundRoot },
        ]}
      >
        <View style={{ paddingTop: headerHeight + Spacing.xl }}>
          <Animated.View entering={FadeIn.delay(200).duration(400)} style={styles.lockedContent}>
            <Feather name="lock" size={64} color={theme.textSecondary} />
            <ThemedText type="h3" style={[styles.lockedTitle, { marginTop: Spacing.lg }]}>
              {t.premiumFeature}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
              {t.premiumFeatureDesc}
            </ThemedText>
            <Pressable
              style={[styles.premiumButton, { backgroundColor: theme.link }]}
              onPress={() => navigation.navigate("Paywall")}
              testID="button-get-premium"
            >
              <ThemedText type="body" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                {t.getPremium}
              </ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        },
        calculations.length === 0 && styles.emptyContent,
      ]}
      data={calculations}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListEmptyComponent={isLoading ? null : ListEmptyComponent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
  },
  itemContainer: {
    position: "relative",
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  itemRight: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  deleteButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
    opacity: 0.6,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
  },
  lockedContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  lockedContent: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  lockedTitle: {
    textAlign: "center",
  },
  premiumButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.sm,
  },
});
