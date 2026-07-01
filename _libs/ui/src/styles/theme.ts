import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

/* The bridge that makes Tailwind and PrimeVue one system: PrimeVue's `--p-*` design tokens are pointed at
 * the SAME CSS variables that drive the Tailwind utilities (defined in styles/shared/colors.css). Change a
 * palette there and both worlds update together. Both color schemes are defined so light/dark is a runtime
 * toggle (see useTheme), not a rebuild. */
const ramp = (name: string) => ({
    50: `var(--color-${name}-50)`,
    100: `var(--color-${name}-100)`,
    200: `var(--color-${name}-200)`,
    300: `var(--color-${name}-300)`,
    400: `var(--color-${name}-400)`,
    500: `var(--color-${name}-500)`,
    600: `var(--color-${name}-600)`,
    700: `var(--color-${name}-700)`,
    800: `var(--color-${name}-800)`,
    900: `var(--color-${name}-900)`,
    950: `var(--color-${name}-950)`,
});

const custom = {
    semantic: {
        primary: ramp(`primary`),
        colorScheme: {
            light: { surface: ramp(`surface`) },
            dark: { surface: ramp(`surface`) },
        },
    },
};

export const Theme = definePreset(Aura, custom) as typeof Aura & typeof custom;
