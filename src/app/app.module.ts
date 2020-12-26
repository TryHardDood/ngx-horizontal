import { AppComponent } from "./app.component";
import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { NgxHorizontalModule } from "./ngx-horizontal/ngx-horizontal.module";

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, NgxHorizontalModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
