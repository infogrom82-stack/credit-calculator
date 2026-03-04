import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";
import { Language } from "./translations";

const CALCULATIONS_KEY = "@credit_calculator_calculations";
const SETTINGS_KEY = "@credit_calculator_settings";
const USER_UUID_KEY = "@credit_calculator_user_uuid";

export interface Calculation {
  id: string;
  amount: number;
  rate: number;
  term: number;
  termType: "months" | "years";
  loanType: "annuity" | "differentiated";
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  createdAt: string;
}

export type ThemeMode = "light" | "dark" | "system";

export interface Settings {
  currency: string;
  defaultLoanType: "annuity" | "differentiated";
  language: Language;
  themeMode: ThemeMode;
}

export async function getCalculations(): Promise<Calculation[]> {
  try {
    const data = await AsyncStorage.getItem(CALCULATIONS_KEY);
    if (data) {
      const calculations = JSON.parse(data) as Calculation[];
      return calculations.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return [];
  } catch (error) {
    console.error("Error loading calculations:", error);
    return [];
  }
}

export async function saveCalculation(calculation: Calculation): Promise<void> {
  try {
    const existing = await getCalculations();
    const updated = [calculation, ...existing];
    await AsyncStorage.setItem(CALCULATIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving calculation:", error);
  }
}

export async function deleteCalculation(id: string): Promise<void> {
  try {
    const existing = await getCalculations();
    const updated = existing.filter((c) => c.id !== id);
    await AsyncStorage.setItem(CALCULATIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error deleting calculation:", error);
  }
}

export async function clearAllCalculations(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CALCULATIONS_KEY);
  } catch (error) {
    console.error("Error clearing calculations:", error);
  }
}

export async function getSettings(): Promise<Settings | null> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      return JSON.parse(data) as Settings;
    }
    return null;
  } catch (error) {
    console.error("Error loading settings:", error);
    return null;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

export async function getUserUuid(): Promise<string> {
  try {
    let uuid = await AsyncStorage.getItem(USER_UUID_KEY);
    if (!uuid) {
      uuid = uuidv4();
      await AsyncStorage.setItem(USER_UUID_KEY, uuid);
    }
    return uuid;
  } catch (error) {
    console.error("Error getting user UUID:", error);
    return uuidv4();
  }
}
