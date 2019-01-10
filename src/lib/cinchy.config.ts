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

    /**
     * The redirectUri after logging out, has to be permitted by auth server
     */
    logoutRedirectUri?: string;

    /**
     * The scopes seperated by whitespace the application can access
     * e.g. 'openid id profile roles'
     */
    scope?: string;

    /**
     * The url of the silent refresh page (eg: "http://localhost:3000/silent-refresh.html")
     */
    silentRefreshRedirectUri?: string;

    /**
     * Enable silent refresh for tokens, occurs at 75% of access_token lifetime
     */
    silentRefreshEnabled?: boolean;
}
