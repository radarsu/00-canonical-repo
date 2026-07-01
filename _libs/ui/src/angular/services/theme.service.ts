import { DOCUMENT, Injectable, inject, signal } from "@angular/core";

export type ColorScheme = "light" | "dark";

const STORAGE_KEY = `ui-color-scheme`;
const DARK_ATTRIBUTE = `data-mode`;

/* Owns the active color scheme. Toggling flips the `data-mode` attribute on <html>, which is the selector
 * both the PrimeNG dark preset and the role tokens key off — so a single write recolors PrimeNG components
 * and Tailwind surfaces together. */
@Injectable({ providedIn: `root` })
export class ThemeService {
    private readonly document = inject(DOCUMENT);
    private readonly root = this.document.documentElement;

    readonly scheme = signal<ColorScheme>(this.read());

    constructor() {
        this.apply(this.scheme());
    }

    set(scheme: ColorScheme): void {
        this.scheme.set(scheme);
        this.apply(scheme);
        try {
            this.document.defaultView?.localStorage.setItem(STORAGE_KEY, scheme);
        } catch {
            // Storage may be unavailable (private mode); the in-memory signal still holds.
        }
    }

    toggle(): void {
        this.set(this.scheme() === `dark` ? `light` : `dark`);
    }

    private apply(scheme: ColorScheme): void {
        if (scheme === `dark`) {
            this.root.setAttribute(DARK_ATTRIBUTE, `dark`);
        } else {
            this.root.removeAttribute(DARK_ATTRIBUTE);
        }
    }

    private read(): ColorScheme {
        try {
            const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
            if (stored === `light` || stored === `dark`) {
                return stored;
            }
        } catch {
            // ignore
        }
        return this.root.getAttribute(DARK_ATTRIBUTE) ? `dark` : `light`;
    }
}
