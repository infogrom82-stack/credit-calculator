import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { HeaderButton } from "@react-navigation/elements";

import CalculatorScreen from "@/screens/CalculatorScreen";
import HistoryScreen from "@/screens/HistoryScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import PaywallScreen from "@/screens/PaywallScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { Calculation } from "@/lib/storage";

export type RootStackParamList = {
  Calculator: { calculation?: Calculation } | undefined;
  History: undefined;
  Settings: undefined;
  Paywall: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Calculator"
        component={CalculatorScreen}
        options={({ navigation }) => ({
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.navigate("Settings")}>
              <Feather name="settings" size={22} color={theme.text} />
            </HeaderButton>
          ),
          headerRight: () => (
            <HeaderButton onPress={() => navigation.navigate("History")}>
              <Feather name="clock" size={22} color={theme.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={22} color={theme.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={({ navigation }) => ({
          presentation: "modal",
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={22} color={theme.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
