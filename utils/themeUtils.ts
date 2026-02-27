import {
  argbFromHex,
  themeFromSourceColor,
  hexFromArgb,
  Theme,
  Scheme,
  TonalPalette
} from "@material/material-color-utilities";

/**
 * Generates a complete Material 3 color scheme from a single source color
 * and applies it to the document root as CSS variables.
 * 
 * @param sourceColorHex The source color in Hex format (e.g. #6750A4)
 * @param isDark Whether to generate a dark mode scheme
 */
export const applyThemeFromColor = (sourceColorHex: string, isDark: boolean) => {
  try {
    // 1. Convert HEX to ARGB (int)
    const sourceColorArgb = argbFromHex(sourceColorHex);

    // 2. Generate the Theme object (contains palettes and tonal schemes)
    const theme: Theme = themeFromSourceColor(sourceColorArgb);

    // 3. Select the correct scheme (light or dark)
    const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
    const palettes = theme.palettes;

    // 4. Map the Material 3 tokens to our CSS variables
    const root = document.documentElement;

    // Helper to set property
    const set = (name: string, argb: number) => {
      root.style.setProperty(name, hexFromArgb(argb));
    };

    // --- Primary Tones ---
    set('--color-primary', scheme.primary);
    set('--color-on-primary', scheme.onPrimary);
    set('--color-primary-container', scheme.primaryContainer);
    set('--color-on-primary-container', scheme.onPrimaryContainer);

    // --- Secondary Tones ---
    set('--color-secondary', scheme.secondary);
    set('--color-on-secondary', scheme.onSecondary);
    set('--color-secondary-container', scheme.secondaryContainer);
    set('--color-on-secondary-container', scheme.onSecondaryContainer);

    // --- Tertiary Tones ---
    set('--color-tertiary', scheme.tertiary);
    set('--color-on-tertiary', scheme.onTertiary);
    set('--color-tertiary-container', scheme.tertiaryContainer);
    set('--color-on-tertiary-container', scheme.onTertiaryContainer);

    // --- Error Tones ---
    set('--color-error', scheme.error);
    set('--color-on-error', scheme.onError);
    set('--color-error-container', scheme.errorContainer);
    set('--color-on-error-container', scheme.onErrorContainer);

    // --- Background & Surface ---
    set('--color-background', scheme.background);
    set('--color-on-background', scheme.onBackground);

    set('--color-surface', scheme.surface);
    set('--color-on-surface', scheme.onSurface);
    set('--color-surface-variant', scheme.surfaceVariant);
    set('--color-on-surface-variant', scheme.onSurfaceVariant);

    // --- Surface Containers (Manual Derivation from Neutral Palette) ---
    // M3 Spec:
    // Light: Lowest(100), Low(96), Container(94), High(92), Highest(90)
    // Dark: Lowest(4), Low(10), Container(12), High(17), Highest(22)
    
    if (isDark) {
        set('--color-surface-container-lowest', palettes.neutral.tone(4));
        set('--color-surface-container-low', palettes.neutral.tone(10));
        set('--color-surface-container', palettes.neutral.tone(12));
        set('--color-surface-container-high', palettes.neutral.tone(17));
        set('--color-surface-container-highest', palettes.neutral.tone(22));
    } else {
        set('--color-surface-container-lowest', palettes.neutral.tone(100));
        set('--color-surface-container-low', palettes.neutral.tone(96));
        set('--color-surface-container', palettes.neutral.tone(94));
        set('--color-surface-container-high', palettes.neutral.tone(92));
        set('--color-surface-container-highest', palettes.neutral.tone(90));
    }

    // --- Outlines ---
    set('--color-outline', scheme.outline);
    set('--color-outline-variant', scheme.outlineVariant);

    // --- IBM Carbon Design System Overrides ---
    // Map the generated primary color to Carbon's interactive tokens
    set('--cds-interactive-01', scheme.primary);
    set('--cds-interactive-01-hover', palettes.primary.tone(isDark ? 90 : 30)); // Darker/Lighter based on mode
    set('--cds-interactive-04', scheme.primary);
    set('--cds-focus', scheme.primary);
    
    // Optional: Tint the background slightly if desired, but Carbon usually keeps it neutral.
    // We will keep Carbon backgrounds neutral for now to adhere to the design system.

  } catch (error) {
    console.error("Failed to generate Material Theme:", error);
  }
};