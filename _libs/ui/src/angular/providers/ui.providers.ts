import { type EnvironmentProviders, makeEnvironmentProviders } from "@angular/core";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { providePrimeNG } from "primeng/config";
import { Theme } from "../../styles/theme.js";

/* Single entry point for the design system: wires the bridged PrimeNG preset, the dark-mode selector (kept
 * in sync by ThemeService), and — crucially — the cssLayer order so the cascade is deterministic:
 * `utilities` is last, so Tailwind utility classes always beat PrimeNG's component styles. */
export function provideUi(): EnvironmentProviders {
    return makeEnvironmentProviders([
        provideAnimationsAsync(),
        providePrimeNG({
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
            ripple: true,
        }),
    ]);
}
