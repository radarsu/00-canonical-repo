import PrimeVue from "primevue/config";
import type { App } from "vue";
import { Theme } from "../styles/theme.js";

/* Single entry point for the design system: wires the bridged PrimeVue preset, the dark-mode selector
 * (kept in sync by useTheme), and — crucially — the cssLayer order so the cascade is deterministic:
 * `utilities` is last, so Tailwind utility classes always beat PrimeVue's component styles. Call it once
 * from the app's main.ts as `installUi(app)`. */
export function installUi(app: App): void {
    app.use(PrimeVue, {
        ripple: true,
        theme: {
            preset: Theme,
            options: {
                darkModeSelector: `[data-mode="dark"]`,
                cssLayer: {
                    name: `primeng`,
                    order: `theme, base, primeng, components, utilities`,
                },
            },
        },
    });
}
