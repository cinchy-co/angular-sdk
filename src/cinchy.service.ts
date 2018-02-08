/* tslint:disable:max-line-length curly */

import { Injectable, Injector, Inject, Optional } from '@angular/core';
import { HttpClient, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import { PACKAGE_ROOT_URL } from '@angular/core/src/application_tokens';
import { OAuthService, JwksValidationHandler, AuthConfig, OAuthStorage, OAuthResourceServerErrorHandler, OAuthModuleConfig } from 'angular-oauth2-oidc';
import { CinchyConfig } from './cinchy.config';
import { CinchyGlobalConfig } from './cinchy.global.config';
import { forkJoin } from 'rxjs/observable/forkJoin';
import 'rxjs/add/observable/from';

@Injectable()
export class CinchyService {

    private cinchyRootUrl;

    constructor(private _httpClient: HttpClient, private _oAuthService: OAuthService, private _cinchyGlobalConfig: CinchyGlobalConfig, @Inject(CinchyConfig) private config: CinchyConfig) {
        this._cinchyGlobalConfig.setUserValues(this.config);
        this.cinchyRootUrl = this.config.cinchyRootUrl;
    }

    login(): Promise<boolean> {
        const authConfig: AuthConfig = {
            issuer: this._cinchyGlobalConfig.authority,
            redirectUri: this._cinchyGlobalConfig.redirectUri,
            clientId: this._cinchyGlobalConfig.clientId,
            scope: this._cinchyGlobalConfig.scope,
            responseType: this._cinchyGlobalConfig.responseType,
            requireHttps: this._cinchyGlobalConfig.requireHttps
        }

        this._oAuthService.configure(authConfig);
        this._oAuthService.tokenValidationHandler = new JwksValidationHandler();

        return this._oAuthService.loadDiscoveryDocumentAndLogin();
    }

    private _executeJsonQuery(apiUrl: string, params: object, errorMsg: string, callbackState): Observable<{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}> {
        let form_data = null;
        if (isNonNullObject(params)) {
            form_data = this.getFormUrlEncodedData(params);
        }

        return <Observable <{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}>> this._httpClient.post(apiUrl,
            form_data,
            { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded') }
            ).map( data => {
                let jsonQueryResult = new CinchyService.JsonQueryResult(data);
                return {jsonQueryResult: jsonQueryResult, callbackState: callbackState};
            }).catch ( error => {
                let cinchyEx = new CinchyService.CinchyException(errorMsg, {
                    status: error.status,
                    statusText: error.statusText,
                    response: error.responseJSON
                });
                // if (isBoolean(continueOnFailure) && continueOnFailure) {
                //     cinchyEx.logError();
                //     if (isNonNullObject(completionMonitor) && isFunction(completionMonitor.incrementCompleted))
                //         completionMonitor.incrementCompleted();
                // }
                throw Observable.throw({cinchyException: cinchyEx, callbackState: callbackState});
            });
    }

    executeJsonQuery(query: string, params: object, callbackState?): Observable<{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}> {
        if (!isNonNullOrWhitespaceString(query))
            throw new CinchyService.CinchyException('Query cannot be empty', query);
        let formattedParams = {};
        formattedParams['Query'] = query;
        formattedParams['ResultFormat'] = 'JSON';
        if (isNonNullObject(params)) {
            let idx = 0;
            Object.keys(params).forEach(function (key) {
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
                idx++;
            });
        }
        let apiUrl = this.cinchyRootUrl + '/API/ExecuteCQL';
        let errorMsg = 'Failed to execute query ' + query;

        return <Observable <{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}>> this._executeJsonQuery(apiUrl, formattedParams, errorMsg, callbackState)
            .map( response => response)
            .catch( error => {
                throw Observable.throw(error);
        });
    }

    executeJsonSavedQuery(domain: string, query: string, params: object, callbackState?): Observable<{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}> {
        if (!isNonNullOrWhitespaceString(domain))
            throw new CinchyService.CinchyException('Domain must be a valid string', domain);
        if (!isNonNullOrWhitespaceString(query))
            throw new CinchyService.CinchyException('Query must be a valid string', query);
        let apiUrl = this.cinchyRootUrl + '/API/' + domain + '/' + query;
        let errorMsg = 'Failed to execute json saved query ' + query + ' within domain ' + domain;

        return <Observable <{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}>> this._executeJsonQuery(apiUrl, params, errorMsg, callbackState)
            .map( response => response)
            .catch(error => {
                throw Observable.throw(error);
            }
        );
    }

    openConnection(callbackState?): Observable<{connectionId: string, callbackState}> {
        let errorMsg = 'Failed to open connection';
        return <Observable<{connectionId: string, callbackState}>> this._httpClient.get(this.cinchyRootUrl + '/API/OpenConnection', { responseType: 'text' } )
            .map(data => {
                    let connectionId = data;
                    let returnVal = { connectionId: connectionId, callbackState: callbackState};
                    return { connectionId: connectionId, callbackState: callbackState};
                }
            ).catch(error => {
                    let cinchyEx = new CinchyService.CinchyException(errorMsg, {
                        status: error.status,
                        statusText: error.statusText,
                        response: error.responseJSON
                    });
                    throw Observable.throw({cinchyException: cinchyEx, callbackState: callbackState});
                }
            );
    }

    closeConnection(connectionId: string, callbackState?): Observable<{connectionId: string, callbackState}> {
        if (!connectionId)
            return;
        let errorMsg = 'Failed to close connection ' + connectionId;
        let form_data = this.getFormUrlEncodedData({ 'connectionId': connectionId });

        return <Observable<{connectionId: string, callbackState}>> this._httpClient.post(this.cinchyRootUrl + '/API/CloseConnection',
            form_data,
            {
                headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
                responseType: 'text'
            }
        ).map(data => {
            return({connectionId: connectionId, callbackState: callbackState});
        }).catch(error => {
            let cinchyEx = new CinchyService.CinchyException(errorMsg, {
                status: error.status,
                statusText: error.statusText,
                response: error.responseJSON
            });
                throw Observable.throw({cinchyException: cinchyEx, callbackState: callbackState});
        });
    }

    beginTransaction(connectionId: string, callbackState?): Observable<{transactionId: string, callbackState}> {
        if (!connectionId)
            return null;
        let errorMsg = 'Failed to begin transaction on connection ' + connectionId;
        let form_data = this.getFormUrlEncodedData({ 'connectionId': connectionId });

        return <Observable<{transactionId: string, callbackState}>> this._httpClient.post(this.cinchyRootUrl + '/API/BeginTransaction',
            form_data,
            {
                headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded'),
                responseType: 'text'
             }
        ).map(data => {
            let transactionId = data;
            return({transactionId: transactionId, callbackState: callbackState});
        }).catch(error => {
            let cinchyEx = new CinchyService.CinchyException(errorMsg, {
                status: error.status,
                statusText: error.statusText,
                response: error.responseJSON
            });
            throw Observable.throw({cinchyException: cinchyEx, callbackState: callbackState});
        });
    }

    commitTransaction(connectionId: string, transactionId: string, callbackState?): Observable<{connectionId: string, transactionId: string, callbackState}> {
        if (!connectionId || !transactionId)
            return null;
        let errorMsg = 'Failed to commit transaction ' + transactionId + ' on connection ' + connectionId;
        let form_data = this.getFormUrlEncodedData({ 'connectionId': connectionId, 'transactionId': transactionId });

        return <Observable<{connectionId: string, transactionId: string, callbackState}>> this._httpClient.post(this.cinchyRootUrl + '/API/CommitTransaction',
            form_data,
            { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded') }
        ).map( data => {
            return({connectionId: connectionId, transactionId: transactionId, callbackState});
        }).catch(error => {
            let cinchyEx = new CinchyService.CinchyException(errorMsg, {
                status: error.status,
                statusText: error.statusText,
                response: error.responseJSON
            });
            throw Observable.throw({cinchyException: cinchyEx, callbackState: callbackState});
        });
    }

    rollbackTransaction(connectionId: string, transactionId: string, callbackState?): Observable<{connectionId: string, transactionId: string, callbackState}> {
        if (!connectionId || !transactionId)
            return null;
        let errorMsg = 'Failed to rollback transaction ' + transactionId + ' on connection ' + connectionId;
        let form_data = this.getFormUrlEncodedData({ 'connectionId': connectionId, 'transactionId': transactionId });

        return <Observable<{connectionId: string, transactionId: string, callbackState}>> this._httpClient.post(this.cinchyRootUrl + '/API/RollbackTransaction',
            form_data,
            { headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded') }
        ).map(data => {
            return({connectionId: connectionId, transactionId: transactionId, callbackState});
        }).catch(error => {
            let cinchyEx = new CinchyService.CinchyException(errorMsg, {
                status: error.status,
                statusText: error.statusText,
                response: error.responseJSON
            });
            throw Observable.throw({cinchyException: cinchyEx, callbackState: callbackState});
        });
    }

    executeMultipleJsonSavedQueries(savedQueryParams: {domain: string, query: string, params, callbackState}[], callbackState?): Observable<{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}[]> {
        if (!isNonZeroLengthArray(savedQueryParams))
            throw new CinchyService.CinchyException('Failed to execute json saved queries, savedQueryParams must be specified as an array of objects, with each object containing the parameters required to invoke a single call to the executeJsonSavedQuery method', savedQueryParams);

        let allObservables = [];
        for (let i = 0; i < savedQueryParams.length; i++) {
            allObservables.push(<Observable<{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}>> this.executeJsonSavedQuery(savedQueryParams[i].domain, savedQueryParams[i].query, savedQueryParams[i].params, savedQueryParams[i].callbackState));

            if (i === savedQueryParams.length - 1) {
                return <Observable<{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}[]>> forkJoin(allObservables);
            }
        }
    }

    getGroupsCurrentUserBelongsTo(): Observable<any> {
        return this._httpClient.get(this.cinchyRootUrl + '/Account/GetGroupsCurrentUserBelongsTo',
            { headers: new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8'),     })
            .map(data => {
                return data;
            })
            .catch(error => {
                throw Observable.throw(error);
            });
    }

    getTableEntitlementsById(tableId): Observable<any> {
        return this._httpClient.post(this.cinchyRootUrl + '/Account/GetTableEntitlementsById',
            { 'tableId': tableId },
            { headers: new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8') })
            .map(data => {
                return data;
            })
            .catch(error => {
                throw Observable.throw(error);
            });
    }

    getTableEntitlementsByGuid(tableGuid): Observable<any> {
        return this._httpClient.post(this.cinchyRootUrl + '/Account/GetTableEntitlementsByGuid',
            { 'tableId': tableGuid },
            { headers: new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8') })
            .map(data => {
                return data;
            })
            .catch(error => {
                throw Observable.throw(error);
            });
    }

    getTableEntitlementsByName(domainName, tableName): Observable<any> {
        return this._httpClient.post(this.cinchyRootUrl + '/Account/GetTableEntitlementsByName',
            { 'domainName': domainName, 'tableName': tableName },
            { headers: new HttpHeaders().set('Content-Type', 'application/json; charset=utf-8') })
            .map(data => {
                return data;
            })
            .catch(error => {
                throw Observable.throw(error);
            });
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
    };
}

export namespace CinchyService {
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
    };

    export class JsonQueryResult {

        _columnsByName;
        _columnsByIdx;
        _currentRowIdx = -1;

        _jsonResult: any;

        constructor(_jsonResult: any) {
            this._jsonResult = _jsonResult;
            this.processColumnHeaders();
        }


        convertToObject(key) {
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

        getCellValue(col) {
            if (this._currentRowIdx >= this.getRowCount())
                throw new CinchyException('Unable to retrieve column value as the iterator is out of the bounds of the result set. Current row index is ' + this._currentRowIdx + ', while the total row count is ' + this.getRowCount());
            let colIdx = this.validateAndConvertColumnReferenceToIdx(col);
            let rowDataArray = this._jsonResult.data[this._currentRowIdx];
            if (!isNonZeroLengthArray(rowDataArray))
                throw new CinchyException('Failed to retrieve column value. Row data for index ' + this._currentRowIdx + ' is in an unexpected format (i.e. not an array of values)');
            return rowDataArray[colIdx];
        }

        getColCount() {
            if (!isNonNullObject(this._jsonResult) || !isNonZeroLengthArray(this._jsonResult.schema))
                return 0;
            return this._jsonResult.schema.length;
        }

        getColNames() {
            return this._columnsByIdx.map(function (obj) {
                return obj.columnName;
            });
        }

        getCurrentRowIdx() {
            return this._currentRowIdx;
        }

        getColumns() {
            // creates a cloned version of the column list
            return this._columnsByIdx.map(function (obj) {
                return {
                    columnName: obj.columnName,
                    type: obj.type
                };
            });
        }

        getMultiSelectCellValue(col) {
            let textValue = this.getCellValue(col);
            if (!isNonNullOrWhitespaceString(textValue))
                return null;
            return this.csvToArray(textValue);
        }

        getRowCount() {
            if (!isNonNullObject(this._jsonResult) || !isNonZeroLengthArray(this._jsonResult.data))
                return 0;
            return this._jsonResult.data.length;
        }

        moveToNextRow() {
            if (this._currentRowIdx < this.getRowCount()) {
                this._currentRowIdx++;
            } else {
                this._currentRowIdx = this.getRowCount();
            }
            return this._currentRowIdx < this.getRowCount();
        }

        moveToRow(idx) {
            if (idx < 0 || idx >= this.getRowCount())
                throw new CinchyException('Failed to move to row ' + idx + '. The specified index is out of the bounds of the result set which contains ' + this.getRowCount() + ' records');
            this._currentRowIdx = idx;
        }

        processColumnHeaders() {
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
    let re = /\s/gi;
    let result = text.replace(re, '');
   return (typeof text === 'string' && result !== '');
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
        let url = req.url.toLowerCase();

        if (url.startsWith(this._cinchyGlobalConfig.cinchyRootUrl.toLowerCase())) {
            let token = this._oAuthStorage.getItem('access_token');
            let header = 'Bearer ' + token;

            let headers = req.headers.set('Authorization', header);

            req = req.clone({ headers });
        }

        return next.handle(req);
    }
}
