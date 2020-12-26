import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgxHorizontalComponent } from "./ngx-horizontal.component";
import { NgxHorizontalItemDirective } from "./ngx-horizontal-item.directive";

@NgModule({
  declarations: [NgxHorizontalComponent, NgxHorizontalItemDirective],
  imports: [CommonModule],
  exports: [NgxHorizontalComponent, NgxHorizontalItemDirective]
})
export class NgxHorizontalModule {}
