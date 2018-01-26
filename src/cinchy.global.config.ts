import { Injectable } from '@angular/core';
import { CinchyConfig } from './cinchy.config';

@Injectable()
export class CinchyGlobalConfig {
    /**
     * Cinchy's root url for making API calls
     */
    cinchyRootUrl: string;

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

    scope = 'openid profile roles id adonet_api';

    responseType = 'id_token token';

    requireHttps= false;

    setUserValues(config: CinchyConfig) {
        this.cinchyRootUrl = config.cinchyRootUrl;
        this.authority = config.authority;
        this.clientId = config.clientId;
        this.redirectUri = config.redirectUri;
    }
}
