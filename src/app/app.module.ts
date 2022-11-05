import { BrowserModule, Title } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { MainComponent } from './main/main.component';
import { sharedComponents, sharedEntryComponents } from './shared/components/index';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModules } from '@app/shared/modules/shared.module';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { DateUtil } from './shared/utils/date';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { TOAST_TIMEOUT } from '@app/configs/app-settings.config';
import { NgIdleKeepaliveModule } from '@ng-idle/keepalive';
import { DialogComponent } from '@app/shared/components/dialog/dialog.component';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
@NgModule({
  declarations: [MainComponent, ...sharedComponents],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModules,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
	NgMultiSelectDropDownModule.forRoot(),
    ToastrModule.forRoot({
      timeOut: TOAST_TIMEOUT,
      positionClass: 'toast-top-full-width',
      preventDuplicates: true,
      closeButton: true
    }),
    NgIdleKeepaliveModule.forRoot()
  ],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }, DateUtil, Title],
  entryComponents: [...sharedEntryComponents],
  exports: [
    DialogComponent
  ],
  bootstrap: [MainComponent]
})
export class AppModule {}
