import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TRIAL_START_KEY = "@credit_calc_trial_start";
const TRIAL_DAYS = 10;

interface MockPackage {
  packageType: string;
  identifier: string;
}

interface SubscriptionContextType {
  isSubscribed: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
  hasFullAccess: boolean; // subscribed OR trial active
  showAds: boolean; // not subscribed AND trial expired
  packages: MockPackage[];
  purchasePackage: (pkg: MockPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
}

let Purchases: any = null;

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(true);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(TRIAL_DAYS);
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<MockPackage[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    initializePurchases();
  }, []);

  const initializePurchases = async () => {
    try {
      if (Platform.OS !== "web") {
        try {
          const module = await import("react-native-purchases");
          Purchases = module.default;
          
          const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
          if (apiKey) {
            await Purchases.configure({ apiKey });
            setIsConfigured(true);
            await loadOfferings();
          }
        } catch (err) {
          console.log("RevenueCat not available:", err);
        }
      }
      
      await checkTrialStatus();
      await checkSubscriptionStatus();
    } catch (error) {
      console.log("RevenueCat initialization error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfferings = async () => {
    if (!Purchases) return;
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current?.availablePackages) {
        setPackages(offerings.current.availablePackages);
      }
    } catch (error) {
      console.log("Error loading offerings:", error);
    }
  };

  const checkTrialStatus = async () => {
    try {
      let trialStart = await AsyncStorage.getItem(TRIAL_START_KEY);
      
      if (!trialStart) {
        trialStart = new Date().toISOString();
        await AsyncStorage.setItem(TRIAL_START_KEY, trialStart);
      }
      
      const startDate = new Date(trialStart);
      const now = new Date();
      const diffTime = now.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, TRIAL_DAYS - diffDays);
      
      setTrialDaysRemaining(remaining);
      setIsTrialActive(remaining > 0);
    } catch (error) {
      console.log("Error checking trial status:", error);
      setIsTrialActive(true);
      setTrialDaysRemaining(TRIAL_DAYS);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!isConfigured || !Purchases || Platform.OS === "web") {
      return;
    }
    
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasActiveSubscription = 
        customerInfo.entitlements.active["premium"] !== undefined ||
        customerInfo.entitlements.active["pro"] !== undefined;
      setIsSubscribed(hasActiveSubscription);
    } catch (error) {
      console.log("Error checking subscription:", error);
    }
  };

  const purchasePackage = async (pkg: MockPackage): Promise<boolean> => {
    if (Platform.OS === "web" || !Purchases) {
      return false;
    }
    
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const hasActiveSubscription = 
        customerInfo.entitlements.active["premium"] !== undefined ||
        customerInfo.entitlements.active["pro"] !== undefined;
      setIsSubscribed(hasActiveSubscription);
      return hasActiveSubscription;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.log("Purchase error:", error);
      }
      return false;
    }
  };

  const restorePurchases = async (): Promise<boolean> => {
    if (Platform.OS === "web" || !Purchases) {
      return false;
    }
    
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasActiveSubscription = 
        customerInfo.entitlements.active["premium"] !== undefined ||
        customerInfo.entitlements.active["pro"] !== undefined;
      setIsSubscribed(hasActiveSubscription);
      return hasActiveSubscription;
    } catch (error) {
      console.log("Restore error:", error);
      return false;
    }
  };

  const hasFullAccess = isSubscribed || isTrialActive;
  const showAds = !isSubscribed && !isTrialActive;

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        isTrialActive,
        trialDaysRemaining,
        isLoading,
        hasFullAccess,
        showAds,
        packages,
        purchasePackage,
        restorePurchases,
        checkSubscriptionStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
