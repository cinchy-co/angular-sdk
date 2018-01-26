import { Injectable } from '@angular/core';
import { Conditional } from '@angular/compiler';

@Injectable()
export class CinchyConfig {
    /**
     * Cinchy's root url for making API calls
     */
    cinchyRootUrl?: string;

    /**
     * Cinchy's authentication server url
     */
    authority: string;

    /**
     * The integrated app's ID
     */
    clientId: string;

    /**
     * The redirectUri as registered with the auth server
     */
    redirectUri: string;
}
