import { ChangeDetectionStrategy, Component, input } from "@angular/core";

/* Surface card primitive. Replaces the repeated `rounded-xl border bg-surface-0 p-4` literal; styling
 * lives in the `.ui-card` class (styles/shared/components.css). Set `dashed` for the empty-state look. */
@Component({
    selector: `ui-card`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<ng-content />`,
    host: {
        class: `ui-card`,
        "[class.ui-card-dashed]": `dashed()`,
    },
})
export class CardComponent {
    readonly dashed = input(false);
}
