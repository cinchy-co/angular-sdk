import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { CinchyModule} from '@cinchy-co/angular-sdk';

import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatListModule} from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';
import {MatInputModule} from '@angular/material';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    CinchyModule.forRoot(),
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    MatInputModule
  ],
  providers: [CinchyModule],
  bootstrap: [AppComponent]
})
export class AppModule { }
