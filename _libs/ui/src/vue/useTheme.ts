import { ref, type Ref } from "vue";

export type ColorScheme = "light" | "dark";

const STORAGE_KEY = `ui-color-scheme`;
const DARK_ATTRIBUTE = `data-mode`;

/* Owns the active color scheme as a module-level singleton. Toggling flips the `data-mode` attribute on
 * <html>, which is the selector both the PrimeVue dark preset and the role tokens key off, so a single write
 * recolors PrimeVue components and Tailwind surfaces together. */

const read = (): ColorScheme => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === `light` || stored === `dark`) {
            return stored;
        }
    } catch {
        // Storage may be unavailable (private mode); fall back to the attribute.
    }
    return document.documentElement.getAttribute(DARK_ATTRIBUTE) ? `dark` : `light`;
};

const apply = (value: ColorScheme): void => {
    if (value === `dark`) {
        document.documentElement.setAttribute(DARK_ATTRIBUTE, `dark`);
    } else {
        document.documentElement.removeAttribute(DARK_ATTRIBUTE);
    }
};

const scheme: Ref<ColorScheme> = ref(read());
apply(scheme.value); // restore the saved scheme when the design system loads (was the service constructor)

const set = (value: ColorScheme): void => {
    scheme.value = value;
    apply(value);
    try {
        localStorage.setItem(STORAGE_KEY, value);
    } catch {
        // Storage may be unavailable (private mode); the in-memory ref still holds.
    }
};

const toggle = (): void => {
    set(scheme.value === `dark` ? `light` : `dark`);
};

export function useTheme() {
    return { scheme, set, toggle };
}
