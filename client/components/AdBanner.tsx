import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface AdBannerProps {
  onPress?: () => void;
}

export function AdBanner({ onPress }: AdBannerProps) {
  const { theme } = useTheme();

  return (
    <Pressable 
      onPress={onPress}
      style={[
        styles.container, 
        { 
          backgroundColor: theme.backgroundSecondary,
          borderColor: theme.border,
        }
      ]}
      testID="ad-banner"
    >
      <View style={styles.content}>
        <ThemedText type="callout" style={{ color: theme.textSecondary }}>
          Ad
        </ThemedText>
        <View style={[styles.placeholder, { backgroundColor: theme.backgroundTertiary }]}>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
            Advertisement
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  content: {
    padding: Spacing.sm,
  },
  placeholder: {
    height: 50,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
});
