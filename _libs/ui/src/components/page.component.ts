import { ChangeDetectionStrategy, Component } from "@angular/core";

/* Centered, width-constrained page shell. Replaces the repeated `mx-auto max-w-* p-6` wrappers. */
@Component({
    selector: `ui-page`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<ng-content />`,
    host: {
        class: `ui-page`,
    },
})
export class PageComponent {}
