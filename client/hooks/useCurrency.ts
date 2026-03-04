import { useState, useEffect, useCallback } from "react";
import { getSettings, Settings } from "@/lib/storage";

export function useCurrency() {
  const [currency, setCurrency] = useState<string>("RUB");

  const loadCurrency = useCallback(async () => {
    const settings = await getSettings();
    if (settings?.currency) {
      setCurrency(settings.currency);
    }
  }, []);

  useEffect(() => {
    loadCurrency();
  }, [loadCurrency]);

  return { currency, refreshCurrency: loadCurrency };
}
