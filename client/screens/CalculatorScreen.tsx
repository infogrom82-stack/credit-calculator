import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { AdBanner } from "@/components/AdBanner";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { formatCurrency, formatNumber, calculateLoan, LoanResult } from "@/lib/calculator";
import { saveCalculation, getSettings, getUserUuid, Calculation } from "@/lib/storage";
import { Language, getTranslation } from "@/lib/translations";
import { useSubscription } from "@/contexts/SubscriptionContext";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const cleanInput = (value: string): number => {
  if (!value || value.trim() === "") return 0;
  const sanitized = value.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const parts = sanitized.split(".");
  const normalized = parts.length > 2 
    ? parts[0] + "." + parts.slice(1).join("") 
    : sanitized;
  const result = parseFloat(normalized);
  return isNaN(result) ? 0 : result;
};

interface CalculatorScreenProps {
  navigation: any;
  route: any;
}

export default function CalculatorScreen({ navigation, route }: CalculatorScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { hasFullAccess, showAds } = useSubscription();

  const [amount, setAmount] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [downPaymentType, setDownPaymentType] = useState<"percent" | "amount">("percent");
  const [rate, setRate] = useState("");
  const [term, setTerm] = useState("");
  const [termType, setTermType] = useState<"months" | "years">("months");
  const [loanType, setLoanType] = useState<"annuity" | "differentiated">("annuity");
  const [result, setResult] = useState<LoanResult | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [currency, setCurrency] = useState("RUB");
  const [language, setLanguage] = useState<Language>("ru");

  const t = getTranslation(language);
  const saveButtonScale = useSharedValue(1);

  const handleClearAll = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAmount("");
    setDownPayment("");
    setDownPaymentType("percent");
    setRate("");
    setTerm("");
    setTermType("months");
    setResult(null);
    setShowSchedule(false);
  }, []);

  const loadSettings = useCallback(async () => {
    const settings = await getSettings();
    if (settings) {
      setCurrency(settings.currency);
      setLoanType(settings.defaultLoanType);
      setLanguage(settings.language);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t.appName,
    });
  }, [navigation, t.appName]);

  React.useEffect(() => {
    if (route.params?.calculation) {
      const calc = route.params.calculation as Calculation;
      setAmount(calc.amount.toString());
      setRate(calc.rate.toString());
      setTerm(calc.term.toString());
      setTermType(calc.termType);
      setLoanType(calc.loanType);
    }
  }, [route.params?.calculation]);

  React.useEffect(() => {
    const timerId = setTimeout(() => {
      const amountNum = cleanInput(amount);
      const rateNum = cleanInput(rate);
      const termNum = Math.floor(cleanInput(term));
      const downPaymentNum = cleanInput(downPayment);

      if (amountNum > 0 && rateNum > 0 && termNum > 0) {
        let effectiveAmount = amountNum;
        if (downPaymentNum > 0) {
          if (downPaymentType === "percent") {
            const downPaymentValue = Math.min(downPaymentNum, 100);
            effectiveAmount = amountNum - (amountNum * downPaymentValue / 100);
          } else {
            effectiveAmount = amountNum - Math.min(downPaymentNum, amountNum);
          }
        }
        if (effectiveAmount > 0) {
          const loanResult = calculateLoan(effectiveAmount, rateNum, termNum, termType, loanType);
          setResult(loanResult);
        } else {
          setResult(null);
        }
      } else {
        setResult(null);
      }
    }, 150);

    return () => clearTimeout(timerId);
  }, [amount, rate, term, termType, loanType, downPayment, downPaymentType]);

  const [showSaveToast, setShowSaveToast] = useState(false);

  const handleSave = useCallback(async () => {
    if (!result) return;

    const amountNum = cleanInput(amount);
    const rateNum = cleanInput(rate);
    const termNum = Math.floor(cleanInput(term));

    const calculation: Calculation = {
      id: Date.now().toString(),
      amount: amountNum,
      rate: rateNum,
      term: termNum,
      termType,
      loanType,
      monthlyPayment: result.monthlyPayment,
      totalInterest: result.totalInterest,
      totalAmount: result.totalAmount,
      createdAt: new Date().toISOString(),
    };

    await saveCalculation(calculation);

    const downPaymentNum = cleanInput(downPayment);

    let downPaymentAmount: number;
    let downPaymentPercent: number;

    if (downPaymentType === "percent") {
      downPaymentPercent = parseFloat(downPaymentNum.toFixed(1));
      downPaymentAmount = parseFloat(((amountNum * downPaymentNum) / 100).toFixed(2));
    } else {
      downPaymentAmount = parseFloat(downPaymentNum.toFixed(2));
      downPaymentPercent = amountNum > 0 
        ? parseFloat(((downPaymentNum / amountNum) * 100).toFixed(1)) 
        : 0;
    }

    const currencySymbols: Record<string, string> = {
      RUB: "₽",
      USD: "$",
      EUR: "€",
      PLN: "zł",
    };

    const webhookTranslations: Record<string, {
      title: string;
      credit: string;
      downPayment: string;
      rate: string;
      term: string;
      monthly: string;
      overpayment: string;
      total: string;
      unitMonths: string;
      unitYears: string;
      termFrom: string;
      termTo: string;
    }> = {
      ru: {
        title: "Новый расчет",
        credit: "Кредит",
        downPayment: "Аванс",
        rate: "Ставка",
        term: "Срок",
        monthly: "Ежемесячно",
        overpayment: "Переплата",
        total: "Итого",
        unitMonths: "мес.",
        unitYears: "лет",
        termFrom: "от",
        termTo: "до",
      },
      en: {
        title: "New Calculation",
        credit: "Loan Amount",
        downPayment: "Down Payment",
        rate: "Rate",
        term: "Duration",
        monthly: "Monthly Payment",
        overpayment: "Overpayment",
        total: "Total",
        unitMonths: "months",
        unitYears: "years",
        termFrom: "from",
        termTo: "to",
      },
      pl: {
        title: "Nowa kalkulacja",
        credit: "Kredyt",
        downPayment: "Wkład własny",
        rate: "Oprocentowanie",
        term: "Okres",
        monthly: "Miesięcznie",
        overpayment: "Nadpłata",
        total: "Do zapłaty",
        unitMonths: "mies.",
        unitYears: "lat",
        termFrom: "od",
        termTo: "do",
      },
      de: {
        title: "Neue Berechnung",
        credit: "Kreditbetrag",
        downPayment: "Anzahlung",
        rate: "Zinssatz",
        term: "Laufzeit",
        monthly: "Monatliche Rate",
        overpayment: "Überzahlung",
        total: "Gesamt",
        unitMonths: "Mon.",
        unitYears: "Jahre",
        termFrom: "von",
        termTo: "bis",
      },
      es: {
        title: "Nuevo cálculo",
        credit: "Monto del préstamo",
        downPayment: "Pago inicial",
        rate: "Tasa",
        term: "Plazo",
        monthly: "Pago mensual",
        overpayment: "Sobrepago",
        total: "Total",
        unitMonths: "meses",
        unitYears: "años",
        termFrom: "de",
        termTo: "a",
      },
      fr: {
        title: "Nouveau calcul",
        credit: "Montant du prêt",
        downPayment: "Apport",
        rate: "Taux",
        term: "Durée",
        monthly: "Mensualité",
        overpayment: "Surcoût",
        total: "Total",
        unitMonths: "mois",
        unitYears: "ans",
        termFrom: "de",
        termTo: "à",
      },
      it: {
        title: "Nuovo calcolo",
        credit: "Importo del prestito",
        downPayment: "Anticipo",
        rate: "Tasso",
        term: "Durata",
        monthly: "Rata mensile",
        overpayment: "Sovrapprezzo",
        total: "Totale",
        unitMonths: "mesi",
        unitYears: "anni",
        termFrom: "da",
        termTo: "a",
      },
    };

    const wt = webhookTranslations[language] || webhookTranslations.en;

    let monthlyPaymentValue: string | number;

    if (loanType === "differentiated" && result.lastPayment !== undefined) {
      monthlyPaymentValue = `${wt.termFrom} ${result.monthlyPayment.toFixed(2)} ${wt.termTo} ${result.lastPayment.toFixed(2)}`;
    } else {
      monthlyPaymentValue = result.monthlyPayment;
    }

    const termUnit = termType === "months" ? wt.unitMonths : wt.unitYears;

    const userCode = await getUserUuid();

    const webhookData = {
      user_code: userCode,
      amount: parseFloat(amountNum.toFixed(2)),
      rate: parseFloat(rateNum.toFixed(2)),
      term: termNum,
      termType,
      termUnit,
      loanType,
      monthlyPayment: monthlyPaymentValue,
      totalAmount: result.totalAmount,
      totalInterest: result.totalInterest,
      downPayment: downPaymentAmount,
      downPaymentPercent,
      currency: currencySymbols[currency] || "₽",
      language,
      labelTitle: wt.title,
      labelCredit: wt.credit,
      labelDownPayment: wt.downPayment,
      labelRate: wt.rate,
      labelTerm: wt.term,
      labelMonthly: wt.monthly,
      labelOverpayment: wt.overpayment,
      labelTotal: wt.total,
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch("https://ugarant-online.ru/webhook/credit-calc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookData),
      });

      if (response.ok) {
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 2000);
      }
    } catch {
      // Silently fail - data is already saved locally
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [amount, rate, term, termType, loanType, result, language, downPayment, downPaymentType, currency]);

  const saveButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveButtonScale.value }],
  }));

  const handleSavePress = () => {
    saveButtonScale.value = withSpring(0.9, { damping: 15 });
    setTimeout(() => {
      saveButtonScale.value = withSpring(1, { damping: 15 });
    }, 100);
    handleSave();
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.backgroundDefault,
      color: theme.text,
      borderColor: theme.border,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: insets.bottom + Spacing["5xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        >
          <View style={styles.titleRow}>
            <ThemedText type="h4" style={styles.cardTitle}>
              {t.loanAmount}
            </ThemedText>
            <Pressable onPress={handleClearAll} testID="button-clear-all">
              <ThemedText type="callout" style={{ color: theme.link }}>
                {t.clearAll}
              </ThemedText>
            </Pressable>
          </View>
          <TextInput
            style={inputStyle}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            returnKeyType="done"
            testID="input-amount"
          />

          <ThemedText type="h4" style={[styles.cardTitle, styles.marginTop]}>
            {t.downPayment}
          </ThemedText>
          <View style={styles.termRow}>
            <TextInput
              style={[inputStyle, styles.downPaymentInput]}
              value={downPayment}
              onChangeText={setDownPayment}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              returnKeyType="done"
              testID="input-down-payment"
            />
            <View style={[styles.termSegmentedControl, { backgroundColor: theme.backgroundSecondary }]}>
              <Pressable
                style={[
                  styles.termSegment,
                  downPaymentType === "percent" && { backgroundColor: theme.backgroundRoot },
                ]}
                onPress={() => setDownPaymentType("percent")}
                testID="button-down-payment-percent"
              >
                <ThemedText
                  type="callout"
                  style={downPaymentType === "percent" ? { fontWeight: "600" } : { color: theme.textSecondary }}
                >
                  {t.downPaymentPercent}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.termSegment,
                  downPaymentType === "amount" && { backgroundColor: theme.backgroundRoot },
                ]}
                onPress={() => setDownPaymentType("amount")}
                testID="button-down-payment-amount"
              >
                <ThemedText
                  type="callout"
                  style={downPaymentType === "amount" ? { fontWeight: "600" } : { color: theme.textSecondary }}
                >
                  {t.downPaymentAmount}
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <ThemedText type="h4" style={[styles.cardTitle, styles.marginTop]}>
            {t.interestRate}
          </ThemedText>
          <TextInput
            style={inputStyle}
            value={rate}
            onChangeText={setRate}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            returnKeyType="done"
            testID="input-rate"
          />

          <ThemedText type="h4" style={[styles.cardTitle, styles.marginTop]}>
            {t.term}
          </ThemedText>
          <View style={styles.termRow}>
            <TextInput
              style={[inputStyle, styles.termInput]}
              value={term}
              onChangeText={setTerm}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              returnKeyType="done"
              testID="input-term"
            />
            <View style={[styles.termSegmentedControl, { backgroundColor: theme.backgroundSecondary }]}>
              <Pressable
                style={[
                  styles.termSegment,
                  termType === "months" && { backgroundColor: theme.backgroundRoot },
                ]}
                onPress={() => setTermType("months")}
                testID="button-months"
              >
                <ThemedText
                  type="callout"
                  style={termType === "months" ? { fontWeight: "600" } : { color: theme.textSecondary }}
                >
                  {t.months}
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.termSegment,
                  termType === "years" && { backgroundColor: theme.backgroundRoot },
                ]}
                onPress={() => setTermType("years")}
                testID="button-years"
              >
                <ThemedText
                  type="callout"
                  style={termType === "years" ? { fontWeight: "600" } : { color: theme.textSecondary }}
                >
                  {t.years}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={[styles.card, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
        >
          <ThemedText type="h4" style={styles.cardTitle}>
            {t.paymentType}
          </ThemedText>
          <View style={[styles.paymentSegmentedControl, { backgroundColor: theme.backgroundSecondary }]}>
            <Pressable
              style={[
                styles.paymentSegment,
                loanType === "annuity" && { backgroundColor: theme.backgroundRoot },
              ]}
              onPress={() => setLoanType("annuity")}
              testID="button-annuity"
            >
              <ThemedText
                type="callout"
                numberOfLines={1}
                style={loanType === "annuity" ? { fontWeight: "600" } : { color: theme.textSecondary }}
              >
                {t.annuityShort}
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.paymentSegment,
                loanType === "differentiated" && { backgroundColor: theme.backgroundRoot },
              ]}
              onPress={() => setLoanType("differentiated")}
              testID="button-differentiated"
            >
              <ThemedText
                type="callout"
                numberOfLines={1}
                style={loanType === "differentiated" ? { fontWeight: "600" } : { color: theme.textSecondary }}
              >
                {t.differentiatedShort}
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        {result ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[styles.resultCard, { backgroundColor: theme.backgroundDefault, borderColor: theme.border }]}
          >
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {t.monthlyPayment}
            </ThemedText>
            <ThemedText type="display" style={[styles.monthlyPayment, { color: theme.link }]}>
              {formatCurrency(result.monthlyPayment, currency)}
            </ThemedText>
            {loanType === "differentiated" && result.lastPayment !== undefined ? (
              <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: -Spacing.sm }}>
                {t.to} {formatCurrency(result.lastPayment, currency)}
              </ThemedText>
            ) : null}

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.resultRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {t.totalAmount}
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {formatCurrency(result.totalAmount, currency)}
              </ThemedText>
            </View>
            <View style={styles.resultRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {t.overpayment}
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600", color: theme.error }}>
                {formatCurrency(result.totalInterest, currency)}
              </ThemedText>
            </View>

            <Pressable
              style={[styles.scheduleButton, { borderColor: theme.border }]}
              onPress={() => {
                if (hasFullAccess) {
                  setShowSchedule(!showSchedule);
                } else {
                  navigation.navigate("Paywall");
                }
              }}
              testID="button-schedule"
            >
              <View style={styles.scheduleButtonContent}>
                {!hasFullAccess ? (
                  <Feather name="lock" size={16} color={theme.textSecondary} style={{ marginRight: Spacing.xs }} />
                ) : null}
                <ThemedText type="body" style={{ color: hasFullAccess ? theme.link : theme.textSecondary }}>
                  {showSchedule ? t.hideSchedule : t.showSchedule}
                </ThemedText>
              </View>
              <Feather
                name={showSchedule ? "chevron-up" : "chevron-down"}
                size={20}
                color={hasFullAccess ? theme.link : theme.textSecondary}
              />
            </Pressable>

            {showSchedule && hasFullAccess && result.schedule.length > 0 ? (
              <Animated.View entering={FadeIn.duration(200)} style={styles.schedule}>
                <View style={[styles.scheduleHeader, { borderBottomColor: theme.border }]}>
                  <ThemedText type="small" style={[styles.scheduleCol, { color: theme.textSecondary }]}>
                    {t.month}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.scheduleCol, { color: theme.textSecondary }]}>
                    {t.payment}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.scheduleCol, { color: theme.textSecondary }]}>
                    {t.principal}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.scheduleCol, { color: theme.textSecondary }]}>
                    {t.interest}
                  </ThemedText>
                  <ThemedText type="small" style={[styles.scheduleCol, { color: theme.textSecondary }]}>
                    {t.balance}
                  </ThemedText>
                </View>
                {result.schedule.map((item, index) => (
                  <View
                    key={item.month}
                    style={[
                      styles.scheduleRow,
                      index < result.schedule.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <ThemedText type="small" style={styles.scheduleCol}>
                      {item.month}
                    </ThemedText>
                    <ThemedText type="small" style={styles.scheduleCol}>
                      {formatNumber(item.payment)}
                    </ThemedText>
                    <ThemedText type="small" style={styles.scheduleCol}>
                      {formatNumber(item.principal)}
                    </ThemedText>
                    <ThemedText type="small" style={styles.scheduleCol}>
                      {formatNumber(item.interest)}
                    </ThemedText>
                    <ThemedText type="small" style={styles.scheduleCol}>
                      {formatNumber(item.balance)}
                    </ThemedText>
                  </View>
                ))}
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}

        {showAds ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <AdBanner onPress={() => navigation.navigate("Paywall")} />
          </Animated.View>
        ) : null}
      </ScrollView>

      {result ? (
        <AnimatedPressable
          style={[
            styles.saveButton,
            { backgroundColor: theme.link, bottom: insets.bottom + Spacing.xl },
            saveButtonAnimatedStyle,
          ]}
          onPress={handleSavePress}
          testID="button-save"
        >
          <Feather name="bookmark" size={24} color="#FFFFFF" />
        </AnimatedPressable>
      ) : null}

      {showSaveToast ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.toast,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.border, top: insets.top + headerHeight + Spacing.md },
          ]}
        >
          <Feather name="check-circle" size={18} color={theme.success} />
          <ThemedText type="callout">{t.calculationSavedAndSent}</ThemedText>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  resultCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: {
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  marginTop: {
    marginTop: Spacing.lg,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
    borderWidth: StyleSheet.hairlineWidth,
  },
  termRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  termInput: {
    flex: 0.5,
  },
  downPaymentInput: {
    flex: 0.5,
  },
  termSegmentedControl: {
    flex: 1,
    flexDirection: "row",
    borderRadius: BorderRadius.xs,
    padding: 3,
  },
  termSegment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xs - 2,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentSegmentedControl: {
    flexDirection: "row",
    borderRadius: BorderRadius.xs,
    padding: 3,
    marginTop: Spacing.sm,
  },
  paymentSegment: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs - 2,
    alignItems: "center",
    justifyContent: "center",
  },
  monthlyPayment: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.lg,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  scheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
  },
  scheduleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  schedule: {
    marginTop: Spacing.lg,
  },
  scheduleHeader: {
    flexDirection: "row",
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scheduleRow: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
  },
  scheduleCol: {
    flex: 1,
    textAlign: "center",
  },
  saveButton: {
    position: "absolute",
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  toast: {
    position: "absolute",
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xs,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
