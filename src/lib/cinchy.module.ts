import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OAuthModule, OAuthService, AuthConfig } from 'angular-oauth2-oidc';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';

import { CinchyService, CinchyAuthInterceptor } from './cinchy.service';
import { CinchyGlobalConfig } from './cinchy.global.config';

export * from './cinchy.service';
export * from './cinchy.config';
export * from './cinchy.global.config';
export * from './cinchy.literal.dictionary';
export * from './cinchy.user.preference';
export * from './cinchy.query.type';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    OAuthModule.forRoot()
  ],
  exports: [],
  providers: [],
  declarations: []
})
export class CinchyModule {
  static forRoot(): ModuleWithProviders<CinchyModule> {
      return{
          ngModule: CinchyModule,
          providers: [OAuthService, CinchyService, CinchyGlobalConfig, {
            provide: HTTP_INTERCEPTORS,
            useClass: CinchyAuthInterceptor,
            multi: true
          }]
      };
  }
}
