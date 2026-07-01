import { Directive, ElementRef, inject, input, type OnChanges } from "@angular/core";
import { twMerge } from "tailwind-merge";

/* Applies conditional Tailwind classes with conflict resolution. Pass an array of class strings (falsy
 * entries ignored); tailwind-merge collapses conflicts so the last wins.
 *
 *   <div [tw]="[base, active() && 'bg-primary-500', !active() && 'bg-surface-100']"></div>
 */
@Directive({
    selector: `[tw]`,
})
export class TwDirective implements OnChanges {
    readonly tw = input<(string | boolean | null | undefined)[]>();

    private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private previous: string[] = [];

    ngOnChanges(): void {
        const tokens = (this.tw() ?? []).filter((value): value is string => typeof value === `string` && value.length > 0);
        const next = twMerge(tokens.join(` `)).split(` `).filter(Boolean);
        const nextSet = new Set(next);

        for (const cls of this.previous) {
            if (!nextSet.has(cls)) {
                this.element.classList.remove(cls);
            }
        }
        if (next.length > 0) {
            this.element.classList.add(...next);
        }
        this.previous = next;
    }
}
