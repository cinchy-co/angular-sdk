/* tslint:disable:max-line-length curly */

import { Observable, forkJoin, Subject, ReplaySubject, of, throwError, Subscription } from 'rxjs';
import { map, catchError, mergeMap } from 'rxjs/operators';

import { Injectable, Inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpHeaders } from '@angular/common/http';
import { NavigationEnd, Router } from "@angular/router";

import { OAuthService, AuthConfig, OAuthStorage } from 'angular-oauth2-oidc';

import { JwksValidationHandler } from './jwks-validation-handler';

import { CinchyConfig } from './cinchy.config';
import { CinchyGlobalConfig } from './cinchy.global.config';
import { CinchyLiteralDictionary } from './cinchy.literal.dictionary';
import { QueryType } from './cinchy.query.type';
import { CinchyUserPreference } from './cinchy.user.preference';


@Injectable({
    providedIn: 'root'
})
export class CinchyService implements OnDestroy {

    private cinchyRootUrl;
    private accessTokenSubject: Subject<string>;
    private userIdentitySubject: Subject<object>;

    private _routerSubscription: Subscription;

    constructor(
        private _httpClient: HttpClient,
        private _oAuthStorage: OAuthStorage,
        private _oAuthService: OAuthService,
        private _router: Router,
        private _cinchyGlobalConfig: CinchyGlobalConfig,
        @Inject(CinchyConfig) private config: CinchyConfig
    ) {
        this._cinchyGlobalConfig.setUserValues(this.config);
        this.cinchyRootUrl = this.config.cinchyRootUrl;
        this.accessTokenSubject = new ReplaySubject<string>();
        this.userIdentitySubject = new ReplaySubject<object>();

        // If there is a querystring present when the sdk loads, save it so that it can later be reloaded
        if (location.search.length) {
            localStorage.setItem("[Cinchy][login][queryParams]", location.search.substr(1));
        }

        // restart automatic silent refresh if the user refreshed the page while still logged in
        if (this._oAuthService.hasValidAccessToken()) {
            this.emitAccessToken();
            this.emitIdentityClaims();
            if (this._oAuthService.hasValidIdToken() && this._cinchyGlobalConfig.silentRefreshEnabled) {
                this._oAuthService.setupAutomaticSilentRefresh();
                this.refreshTokenOnLoadIfNeeded();
            }
        }

        // After the router resolves, it's probable that the authentication workflow has removed the querystring,
        // so if we have one stored, we need to add it back in
        this._router.events.subscribe({
            next: (event) => {

                if (event instanceof NavigationEnd) {
                    const storedQueryParams = localStorage.getItem("[Cinchy][login][queryParams]");

                    if (storedQueryParams?.length && !location.href.includes(storedQueryParams)) {
                        const separator = (location.href.includes("?") || location.href.includes("#id_token")) ? "&" : "?";

                        window.history.replaceState(window.history.state, document.title, `${location.href}${separator}${storedQueryParams}`);
                    }
                }
            }
        });
    }


    ngOnDestroy(): void {

        this._routerSubscription.unsubscribe();
    }


    login(redirectUriOverride?: string): Promise<Boolean> {

        let redirectUri: string;

        if (redirectUriOverride) {
            redirectUri = redirectUriOverride;
        } else {
            redirectUri = this._cinchyGlobalConfig.redirectUri;
        }

        const authConfig: AuthConfig = {
            issuer: this._cinchyGlobalConfig.authority,
            redirectUri: redirectUri,
            clientId: this._cinchyGlobalConfig.clientId,
            scope: this._cinchyGlobalConfig.scope,
            responseType: this._cinchyGlobalConfig.responseType,
            requireHttps: this._cinchyGlobalConfig.requireHttps,
            sessionChecksEnabled: this._cinchyGlobalConfig.sessionChecksEnabled,
            postLogoutRedirectUri: this._cinchyGlobalConfig.logoutRedirectUri,                
            useIdTokenHintForSilentRefresh: this._cinchyGlobalConfig.useIdTokenHintForSilentRefresh,
            silentRefreshRedirectUri: this._cinchyGlobalConfig.silentRefreshRedirectUri
        };

        this._oAuthService.configure(authConfig);
        this._oAuthService.tokenValidationHandler = new JwksValidationHandler();

        if (!this._oAuthService.hasValidIdToken() || !this._oAuthService.hasValidAccessToken()) {
            if (this._cinchyGlobalConfig.silentRefreshEnabled)
                this._oAuthService.setupAutomaticSilentRefresh();
        }

        let that = this;
        let emitInfo = true;

        if (this._oAuthService.hasValidAccessToken()) {
            emitInfo = false;
        }

        return new Promise<boolean>(function (resolve, reject) {
            that._oAuthService.loadDiscoveryDocumentAndLogin()
                .then(response => {

                    resolve(response);

                    if (response) {
                        if (emitInfo) {
                            that.emitAccessToken();
                            that.emitIdentityClaims();
                        }
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    private async refreshTokenOnLoadIfNeeded(): Promise<void> {
        this._oAuthService.timeoutFactor = 0.75;
        const tokenStoredAt: any = sessionStorage.getItem('access_token_stored_at');
        const expiration = this._oAuthService.getAccessTokenExpiration();
        const storedAt = parseInt(tokenStoredAt, 10);
        const timeout = (expiration - storedAt) * this._oAuthService.timeoutFactor;
        const refreshAt = timeout + storedAt;
        const now = Math.round(new Date().getTime() / 1000);
        if (now >= refreshAt) {
            await this._oAuthService.silentRefresh();
        }
    }

    logout() {
        this._oAuthService.logOut();
    }

    getAccessToken(): Observable<string> {
        return this.accessTokenSubject.asObservable();
    }

    getUserIdentity(): Observable<object> {
        return this.userIdentitySubject.asObservable();
    }

    private emitAccessToken() {
        this.accessTokenSubject.next(this._oAuthService.getAccessToken());
    }

    private emitIdentityClaims() {
        const url = this._cinchyGlobalConfig.authority + '/connect/userinfo';
        let reqHeaders = new HttpHeaders();
        reqHeaders = reqHeaders.append('Authorization', 'Bearer ' + this._oAuthService.getAccessToken());
        return this._httpClient.get(url,
            {
                headers: reqHeaders,
                observe: 'response'
            }).subscribe((data) => {
                const identityClaims = this._oAuthService.getIdentityClaims();
                identityClaims['profile'] = data.body['profile'] ? data.body['profile'] : null;
                identityClaims['email'] = data.body['email'] ? data.body['email'] : null;
                identityClaims['id'] = data.body['id'] ? data.body['id'] : null;
                identityClaims['role'] = data.body['role'] ? data.body['role'] : null;
                this.userIdentitySubject.next(identityClaims);
            });
    }

    checkIfSessionValid(): Observable<{ accessTokenIsValid: boolean }> {

        return <Observable<{ accessTokenIsValid: boolean }>>this._httpClient.get(
            this.cinchyRootUrl + '/Account/GetGroupsCurrentUserBelongsTo',
            { headers: new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8') }
        ).pipe(
            map(data => {

                return { accessTokenIsValid: true };
            }),
            catchError(() => {

                return of({ accessTokenIsValid: false });
            })
        );
    }

    private _executeQuery(apiUrl: string, params: object, errorMsg: string, callbackState): Observable<{ queryResult: Cinchy.QueryResult, callbackState }> {
        let form_data = null;
        if (!isNonNullObject(params)) {
            params = {
                resultformat: 'JSON'
            };
        }
        if (isNonNullObject(params)) {
            params['resultformat'] = 'JSON';
            form_data = this.getFormUrlEncodedData(params);
        }

        return <Observable<{ queryResult: Cinchy.QueryResult, callbackState }>>this._httpClient.post(apiUrl,
            form_data,
            {
                headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
            }).pipe(
                map(data => {
                    const queryResult = new Cinchy.QueryResult(data);
                    return { queryResult: queryResult, callbackState: callbackState };
                }),
                catchError(error => {
                    const cinchyEx = new Cinchy.CinchyException(errorMsg, {
                        status: error.status,
                        statusText: error.statusText,
                        response: error.responseJSON
                    });
                    return throwError({ cinchyException: cinchyEx, callbackState: callbackState });
                })
            );
    }

    executeCsql(query: string, params: object, callbackState?, type?: QueryType): Observable<{ queryResult: Cinchy.QueryResult, callbackState }> {

        if (!isNonNullOrWhitespaceString(query))
            throw new Cinchy.CinchyException('Query cannot be empty', query);
        let formattedParams = {};
        if (type)
            formattedParams['Type'] = type;
        formattedParams['Query'] = query;
        formattedParams['resultformat'] = 'JSON';
        if (isNonNullObject(params)) {
            let idx = 0;
            Object.keys(params).forEach(function (key) {
                if (key.toLowerCase() == 'connectionid') {
                    formattedParams['ConnectionId'] = params[key];
                } else if (key.toLowerCase() == 'transactionid') {
                    formattedParams['TransactionId'] = params[key];
                } else {
                    formattedParams['Parameters[' + idx + '].ParameterName'] = key;
                    let paramType = typeof params[key];
                    if (paramType === 'undefined' || paramType === 'object') {
                        formattedParams['Parameters[' + idx + '].ValueType'] = 'System.String';
                        formattedParams['Parameters[' + idx + '].XmlSerializedValue'] = '';
                    } else {
                        formattedParams['Parameters[' + idx + '].XmlSerializedValue'] = params[key];
                        if (paramType === 'number')
                            formattedParams['Parameters[' + idx + '].ValueType'] = 'System.Double';
                        else if (paramType === 'boolean')
                            formattedParams['Parameters[' + idx + '].ValueType'] = 'System.Boolean';
                        else
                            formattedParams['Parameters[' + idx + '].ValueType'] = 'System.String';
                    }
                }
                idx++;
            });
        }
        let apiUrl = this.cinchyRootUrl + '/API/ExecuteCQL';
        let errorMsg = 'Failed to execute query ' + query;

        return <Observable<{ queryResult: Cinchy.QueryResult, callbackState }>>this._executeQuery(apiUrl, formattedParams, errorMsg, callbackState).pipe(
            map(response => response),
            catchError(error => { return throwError(error); })
        );
    }

    executeQuery(domain: string, query: string, params: object, callbackState?): Observable<{ queryResult: Cinchy.QueryResult, callbackState }> {
        if (!isNonNullOrWhitespaceString(domain))
            throw new Cinchy.CinchyException('Domain must be a valid string', domain);
        if (!isNonNullOrWhitespaceString(query))
            throw new Cinchy.CinchyException('Query must be a valid string', query);
        let apiUrl = this.cinchyRootUrl + '/API/' + domain + '/' + query;
        let errorMsg = 'Failed to execute query ' + query + ' within domain ' + domain;

        return <Observable<{ queryResult: Cinchy.QueryResult, callbackState }>>this._executeQuery(apiUrl, params, errorMsg, callbackState).pipe(
            map(response => response),
            catchError(error => { return throwError(error); })
        );
    }

    openConnection(callbackState?): Observable<{ connectionId: string, callbackState }> {
        const errorMsg = 'Failed to open connection';
        return <Observable<{ connectionId: string, callbackState }>>this._httpClient.get(this.cinchyRootUrl + '/API/OpenConnection', { responseType: 'text' }).pipe(
            map(data => {
                let connectionId = data;
                let returnVal = { connectionId: connectionId, callbackState: callbackState };
                return { connectionId: connectionId, callbackState: callbackState };
            }),
            catchError(error => {
                let cinchyEx = new Cinchy.CinchyException(errorMsg, {
                    status: error.status,
                    statusText: error.statusText,
                    response: error.responseJSON
                });
                return throwError({ cinchyException: cinchyEx, callbackState: callbackState });
            })
        );
    }

    closeConnection(connectionId: string, callbackState?): Observable<{ connectionId: string, callbackState }> {
        if (!connectionId)
            return;
        let errorMsg = 'Failed to close connection ' + connectionId;
        let form_data = this.getFormUrlEncodedData({ 'connectionId': connectionId });

        return <Observable<{ connectionId: string, callbackState }>>this._httpClient.post(this.cinchyRootUrl + '/API/CloseConnection',
            form_data,
            {
                headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
                responseType: 'text'
            }).pipe(
                map(data => {
                    return ({ connectionId: connectionId, callbackState: callbackState });
                }),
                catchError(error => {
                    let cinchyEx = new Cinchy.CinchyException(errorMsg, {
                        status: error.status,
                        statusText: error.statusText,
                        response: error.responseJSON
                    });
                    return throwError({ cinchyException: cinchyEx, callbackState: callbackState });
                })
            );
    }

    beginTransaction(connectionId: string, callbackState?): Observable<{ transactionId: string, callbackState }> {
        if (!connectionId)
            return null;
        let errorMsg = 'Failed to begin transaction on connection ' + connectionId;
        let form_data = this.getFormUrlEncodedData({ 'connectionId': connectionId });

        return <Observable<{ transactionId: string, callbackState }>>this._httpClient.post(this.cinchyRootUrl + '/API/BeginTransaction',
            form_data,
            {
                headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
                responseType: 'text'
            }
        ).pipe(
            map(data => {
                let transactionId = data;
                return ({ transactionId: transactionId, callbackState: callbackState });
            }),
            catchError(error => {
                let cinchyEx = new Cinchy.CinchyException(errorMsg, {
                    status: error.status,
                    statusText: error.statusText,
                    response: error.responseJSON
                });
                return throwError({ cinchyException: cinchyEx, callbackState: callbackState });
            })
        );
    }

    commitTransaction(connectionId: string, transactionId: string, callbackState?): Observable<{ connectionId: string, transactionId: string, callbackState }> {
        if (!connectionId || !transactionId)
            return null;
        let errorMsg = 'Failed to commit transaction ' + transactionId + ' on connection ' + connectionId;
        let form_data = this.getFormUrlEncodedData({ 'connectionId': connectionId, 'transactionId': transactionId });

        return <Observable<{ connectionId: string, transactionId: string, callbackState }>>this._httpClient.post(this.cinchyRootUrl + '/API/CommitTransaction',
            form_data,
            {
                headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
                responseType: 'text'
            }).pipe(
                map(data => {
                    return ({ connectionId: connectionId, transactionId: transactionId, callbackState });
                }),
                catchError(error => {
                    let cinchyEx = new Cinchy.CinchyException(errorMsg, {
                        status: error.status,
                        statusText: error.statusText,
                        response: error.responseJSON
                    });
                    return throwError({ cinchyException: cinchyEx, callbackState: callbackState });
                })
            );
    }

    rollbackTransaction(connectionId: string, transactionId: string, callbackState?): Observable<{ connectionId: string, transactionId: string, callbackState }> {
        if (!connectionId || !transactionId)
            return null;
        let errorMsg = 'Failed to rollback transaction ' + transactionId + ' on connection ' + connectionId;
        let form_data = this.getFormUrlEncodedData({ 'connectionId': connectionId, 'transactionId': transactionId });

        return <Observable<{ connectionId: string, transactionId: string, callbackState }>>this._httpClient.post(this.cinchyRootUrl + '/API/RollbackTransaction',
            form_data,
            {
                headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
                responseType: 'text'
            }
        ).pipe(
            map(data => {
                return ({ connectionId: connectionId, transactionId: transactionId, callbackState });
            }),
            catchError(error => {
                let cinchyEx = new Cinchy.CinchyException(errorMsg, {
                    status: error.status,
                    statusText: error.statusText,
                    response: error.responseJSON
                });
                return throwError({ cinchyException: cinchyEx, callbackState: callbackState });
            })
        );
    }

    executeQueries(queryParams: { domain: string, query: string, params, callbackState }[], callbackState?): Observable<{ queryResult: Cinchy.QueryResult, callbackState }[]> {
        if (!isNonZeroLengthArray(queryParams))
            throw new Cinchy.CinchyException('Failed to execute queries, queryParams must be specified as an array of objects, with each object containing the parameters required to invoke a single call to the executeQuery method', queryParams);

        let allObservables = [];
        for (let i = 0; i < queryParams.length; i++) {
            allObservables.push(<Observable<{ queryResult: Cinchy.QueryResult, callbackState }>>this.executeQuery(queryParams[i].domain, queryParams[i].query, queryParams[i].params, queryParams[i].callbackState));

            if (i === queryParams.length - 1) {
                return <Observable<{ queryResult: Cinchy.QueryResult, callbackState }[]>>forkJoin(allObservables);
            }
        }
    }

    getGroupsCurrentUserBelongsTo(): Observable<any> {
        return this._httpClient.get(this.cinchyRootUrl + '/Account/GetGroupsCurrentUserBelongsTo',
            { headers: new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8') }).pipe(
                map(data => {
                    return data;
                }),
                catchError(error => {
                    return throwError(error);
                })
            );
    }

    getTableEntitlementsById(tableId): Observable<any> {
        return this._httpClient.post(this.cinchyRootUrl + '/Account/GetTableEntitlementsById',
            { 'tableId': tableId },
            { headers: new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8') }).pipe(
                map(data => {
                    return data;
                }),
                catchError(error => {
                    return throwError(error);
                })
            );
    }

    getTableEntitlementsByGuid(tableGuid): Observable<any> {
        return this._httpClient.post(this.cinchyRootUrl + '/Account/GetTableEntitlementsByGuid',
            { 'tableGuid': tableGuid },
            { headers: new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8') }).pipe(
                map(data => {
                    return data;
                }),
                catchError(error => {
                    return throwError(error);
                })
            );
    }

    getTableEntitlementsByName(domainName, tableName): Observable<any> {
        return this._httpClient.post(this.cinchyRootUrl + '/Account/GetTableEntitlementsByName',
            { 'domainName': domainName, 'tableName': tableName },
            { headers: new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8') }).pipe(
                map(data => {
                    return data;
                }),
                catchError(error => {
                    return throwError(error);
                })
            );
    }

    getUserPreferences(): Observable<CinchyUserPreference> {
        var query = `   SELECT u.[Username] as 'username', 
                            u.[Name] as 'name', u.[Display Name] as 'displayName',
                            u.[Email Address] as 'emailAddress',
                            u.[Profile Photo] as 'profilePhoto',
                            l.[Language].[Subtag] as 'language',
                            l.[Region].[Subtag] as 'region',
                            l.[Time Zone] as 'timeZone' 
                        FROM [Cinchy].[Users] u
                        LEFT JOIN [Cinchy].[User Preferences] l 
                            ON l.[User].[Cinchy Id] = u.[Cinchy Id]
                        WHERE u.[Cinchy Id] = CurrentUserID();`;
        var params = null;
        return <Observable<CinchyUserPreference>>this.executeCsql(query, params).pipe(
            map(data => {
                let queryResult = data.queryResult.toObjectArray()[0];
                let result: CinchyUserPreference = <CinchyUserPreference>queryResult;
                return result;
            }),
            catchError(error => { return throwError(error); })
        );
    }

    getTranslatedLiterals(guids: string[], debug: boolean = false): Observable<CinchyLiteralDictionary> {
        return this.getUserPreferences().pipe(
            mergeMap(data => {
                var language = data.language;
                var region = data.region;
                return this._httpClient.post(this.cinchyRootUrl + '/API/Translate',
                    { guids: guids, language: language, region: region, debug: debug },
                    { headers: new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8') }).pipe(
                        map((response) => {
                            let translationData: any = response['data'];
                            let result: CinchyLiteralDictionary = <CinchyLiteralDictionary>translationData;
                            return result;
                        }),
                        catchError(error => {
                            return throwError(error);
                        })
                    );
            }),
            catchError(error => { return throwError(error) })
        );
    }

    // Timestamp: 2016.03.07-12:29:28 (last modified)
    // Author(s): Bumblehead (www.bumblehead.com), JBlashill (james@blashill.com), Jumper423 (jump.e.r@yandex.ru)
    //
    // http://www.w3.org/TR/html5/forms.html#url-encoded-form-data
    // input: {one:1,two:2} return: '[one]=1&[two]=2'
    getFormUrlEncodedData(data, opts?) {
        'use strict';

        // ES5 compatible version of `/[^ !'()~\*]/gu`, https://mothereff.in/regexpu
        let encodechar = new RegExp([
            '(?:[\0-\x1F"-&\+-\}\x7F-\uD7FF\uE000-\uFFFF]|',
            '[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|',
            '(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])'
        ].join(''), 'g');

        opts = typeof opts === 'object' ? opts : {};

        function encode(value) {
            return String(value)
                .replace(encodechar, encodeURIComponent)
                .replace(/ /g, '+')
                .replace(/[!'()~\*]/g, function (ch) {
                    return '%' + ch.charCodeAt(0).toString(16).slice(-2).toUpperCase();
                });
        }

        function keys(obj) {
            let itemsKeys = Object.keys(obj);

            return opts.sorted ? itemsKeys.sort() : itemsKeys;
        }

        function filterjoin(arr) {
            return arr.filter(function (e) {
                return e;
            }).join('&');
        }

        function objnest(name, obj) {
            return filterjoin(keys(obj).map(function (key) {
                return nest(name + '[' + key + ']', obj[key]);
            }));
        }

        function arrnest(name, arr) {
            return arr.length ? filterjoin(arr.map(function (elem, index) {
                return nest(name + '[' + index + ']', elem);
            })) : encode(name + '[]');
        }

        function nest(name, value) {
            let type = typeof value,
                f = null;

            if (value === f) {
                f = opts.ignorenull ? f : encode(name) + '=' + f;
            } else if (/string|number|boolean/.test(type)) {
                f = encode(name) + '=' + encode(value);
            } else if (Array.isArray(value)) {
                f = arrnest(name, value);
            } else if (type === 'object') {
                f = objnest(name, value);
            }

            return f;
        }

        return data && filterjoin(keys(data).map(function (key) {
            return nest(key, data[key]);
        }));
    }
}

export namespace Cinchy {
    export class CinchyException {
        message: string;
        data: any;
        name: string;

        constructor(message: string, data?: any) {
            this.message = message;
            this.data = data;
            this.name = 'CinchyException';
        }

        logError(): void {
            console.error(this.message, this.data);
        }
    }

    export class QueryResult {

        _columnsByName;
        _columnsByIdx;
        _currentRowIdx = -1;

        _jsonResult: any;

        constructor(_jsonResult: any) {
            this._jsonResult = _jsonResult;
            this.processColumnHeaders();
        }


        convertToObject(key: string): Object {
            let colCount = this.getColCount();
            if (colCount < 2)
                throw new CinchyException('Result sets can only be convered to objects when they have at least two columns. The column count is ' + colCount, { jsonResult: this._jsonResult });
            this.resetIterator();
            let result = {};
            let keyColIdx = this.validateAndConvertColumnReferenceToIdx(key);
            while (this.moveToNextRow()) {
                let keyValue = this.getCellValue(keyColIdx);
                if (isUndefined(keyValue))
                    throw new CinchyException('Key value when attempting to convert result set to object can not be undefined', { val: keyValue, rowIdx: this._currentRowIdx, jsonResult: this._jsonResult });
                if (!isUndefined(result[keyValue]))
                    throw new CinchyException('Duplicate key found when attempting to convert result set to object', { val: keyValue, rowIdx: this._currentRowIdx, jsonResult: this._jsonResult });
                if (colCount === 2) {
                    for (let i = 0; i < colCount; i++) {
                        if (i === keyColIdx)
                            continue;
                        result[keyValue] = this.getCellValue(i);
                    }
                } else {
                    result[keyValue] = {};
                    for (let j = 0; j < colCount; j++) {
                        if (j === keyColIdx)
                            continue;
                        let columnName = this._columnsByIdx[j].columnName;
                        result[keyValue][columnName] = this.getCellValue(j);
                    }
                }
            }
            return result;
        }

        csvToArray(text) {
            if (text === null)
                return null;
            if (!isString(text))
                throw new CinchyException('Input text for csv to array conversion is not a string', text);
            if (text.killWhiteSpace() === '')
                return [];
            let re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
            let re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
            // Throw an exception if input string is not well formed CSV string.
            if (!re_valid.test(text))
                throw new CinchyException('Input text is not a valid csv string', text);
            let a = []; // Initialize array to receive values.
            text.replace(re_value, // "Walk" the string using replace with callback.
                function (m0, m1, m2, m3) {
                    // Remove backslash from \' in single quoted values.
                    if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
                    // Remove backslash from \" in double quoted values.
                    else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
                    else if (m3 !== undefined) a.push(m3);
                    return ''; // Return empty string.
                });
            // Handle special case of empty last value.
            if (/,\s*$/.test(text)) a.push('');
            return a;
        };

        getCellValue(col): any {
            if (this._currentRowIdx >= this.getRowCount())
                throw new CinchyException('Unable to retrieve column value as the iterator is out of the bounds of the result set. Current row index is ' + this._currentRowIdx + ', while the total row count is ' + this.getRowCount());
            let colIdx = this.validateAndConvertColumnReferenceToIdx(col);
            let rowDataArray = this._jsonResult.data[this._currentRowIdx];
            if (!isNonZeroLengthArray(rowDataArray))
                throw new CinchyException('Failed to retrieve column value. Row data for index ' + this._currentRowIdx + ' is in an unexpected format (i.e. not an array of values)');
            return rowDataArray[colIdx];
        }

        getColCount(): number {
            if (!isNonNullObject(this._jsonResult) || !isNonZeroLengthArray(this._jsonResult.schema))
                return 0;
            return this._jsonResult.schema.length;
        }

        getColNames(): Array<string> {
            return this._columnsByIdx.map(function (obj) {
                return obj.columnName;
            });
        }

        getCurrentRowIdx(): number {
            return this._currentRowIdx;
        }

        getColumns(): Array<{ columnName: string, type: string }> {
            // creates a cloned version of the column list
            return this._columnsByIdx.map(function (obj) {
                return {
                    columnName: obj.columnName,
                    type: obj.type
                };
            });
        }

        getMultiSelectCellValue(col: string): Array<string> {
            let textValue = this.getCellValue(col);
            if (!isNonNullOrWhitespaceString(textValue))
                return null;
            return this.csvToArray(textValue);
        }

        getRowCount(): number {
            if (!isNonNullObject(this._jsonResult) || !isNonZeroLengthArray(this._jsonResult.data))
                return 0;
            return this._jsonResult.data.length;
        }

        toObjectArray(): Array<Object> {
            let result = [];
            this._jsonResult.data.forEach((row) => {
                let rowObject = {};
                for (let i = 0; i < row.length; i++) {
                    rowObject[this._jsonResult.schema[i].columnName] = row[i];
                }
                result.push(rowObject);
            });
            return result;
        }

        moveToNextRow() {
            if (this._currentRowIdx < this.getRowCount()) {
                this._currentRowIdx++;
            } else {
                this._currentRowIdx = this.getRowCount();
            }
            return this._currentRowIdx < this.getRowCount();
        }

        moveToRow(idx: number) {
            if (idx < 0 || idx >= this.getRowCount())
                throw new CinchyException('Failed to move to row ' + idx + '. The specified index is out of the bounds of the result set which contains ' + this.getRowCount() + ' records');
            this._currentRowIdx = idx;
        }

        private processColumnHeaders() {
            this._columnsByName = {};
            this._columnsByIdx = [];
            if (!isNonNullObject(this._jsonResult) || !isNonZeroLengthArray(this._jsonResult.schema))
                return;
            for (let i = 0; i < this._jsonResult.schema.length; i++) {
                let colSpec = this._jsonResult.schema[i];
                if (!isNonNullObject(colSpec))
                    throw new CinchyException('Failed to parse column schema for column at index ' + i + '. Value is either null or not an object', this._jsonResult);
                if (!isNonNullOrWhitespaceString(colSpec.columnName))
                    throw new CinchyException('Failed to parse column schema for column at index ' + i + '. Column name is invalid', this._jsonResult);
                if (!isNonNullOrWhitespaceString(colSpec.type))
                    throw new CinchyException('Failed to parse column schema for column at index ' + i + '. Column type is invalid', this._jsonResult);
                if (!isUndefined(this._columnsByName[colSpec.columnName]))
                    throw new CinchyException('Failed to parse column schema for column at index ' + i + '. Column name is not unique', this._jsonResult);

                this._columnsByName[colSpec.columnName] = {
                    type: colSpec.type,
                    idx: i
                };
                this._columnsByIdx[i] = {
                    columnName: colSpec.columnName,
                    type: colSpec.type
                };
            }
        }

        resetIterator() {
            this._currentRowIdx = -1;
        }

        validateAndConvertColumnReferenceToIdx(col) {
            if (isNonNullOrWhitespaceString(col)) {
                if (!isNonNullObject(this._columnsByName[col]))
                    throw new CinchyException('Failed to retrieve column value. Column ' + col + ' could not be found in the result set');
                return this._columnsByName[col].idx;
            } else if (isInteger(col)) {
                if (col >= 0 && col < this.getColCount()) {
                    return col;
                } else {
                    throw new CinchyException('Failed to retrieve column value. The specified index value of ' + col + ' is outside of the bounds of the result set which has ' + this.getColCount() + ' columns');
                }
            } else {
                throw new CinchyException('Failed to retrieve column value. Parameter col must either be a valid column name belonging to the result set or a column index', { colParameterValue: col });
            }
        }
    }
}


function isFunction(obj: any): boolean {
    return (typeof obj === 'function');
}

function isNonNullOrWhitespaceString(text: string): boolean {
    if (typeof text !== 'string') return false;
    let re = /\s/gi;
    let result = text.replace(re, '');
    return (result !== '');
}

function isNonNullObject(obj: any): boolean {
    return (typeof obj === 'object' && obj !== null);
}

function isUndefined(obj: any): boolean {
    return (typeof obj === 'undefined');
}

function isBoolean(obj: any): boolean {
    return (typeof obj === 'boolean');
}

function isString(obj: any): boolean {
    return (typeof obj === 'string');
}

function isInteger(obj: any): boolean {
    return Number.isInteger(obj);
}

function isNonZeroLengthArray(obj) {
    if (!Array.isArray(obj))
        return false;
    if (obj.length === 0)
        return false;
    return true;
}

@Injectable()
export class CinchyAuthInterceptor implements HttpInterceptor {

    constructor(
        private _cinchyGlobalConfig: CinchyGlobalConfig,
        private _oAuthStorage: OAuthStorage
    ) {
    }

    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!isNonNullOrWhitespaceString(this._cinchyGlobalConfig.cinchyRootUrl))
            return next.handle(req);

        let url = req.url.toLowerCase();

        if (url.startsWith(this._cinchyGlobalConfig.cinchyRootUrl.toLowerCase())) {
            if (!req.headers.has('Authorization')) {
                let token = this._oAuthStorage.getItem('access_token');
                let header = 'Bearer ' + token;
                let headers = req.headers.set('Authorization', header);
                req = req.clone({ headers });
            }
        }
        return next.handle(req);
    }
}

declare global {
    interface String {
        killWhiteSpace(): string;
    }
}

String.prototype.killWhiteSpace = function () {
    return this.replace(/\s/g, '');
};
