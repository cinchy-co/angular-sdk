# @cinchy-co/angular-sdk

## Installation

To install this library, go to your angular project directory and use:

```bash
$ npm install @cinchy-co/angular-sdk --save
```

## Importing the Cinchy Library

From your Angular `AppModule`:

```typescript
...
// Import Cinchy's module and service
import { CinchyModule } from 'cinchy-angular';

@NgModule({
  ...
  imports: [
    ...
    // Import CinchyModule in imports
    CinchyModule.forRoot()
  ],

  // Add CinchyModule as one of the providers
  providers: [CinchyModule],
  ...
})
export class AppModule { }
```

## Before Usage

Once CinchyModule is imported, you can use the library through CinchyService.
You may use CinchyService anywhere you inject it into.

Before you can make any API calls, you must configure CinchyService and login to Cinchy.
In this example, we do it in AppComponent:

```typescript
...
// Import CinchyService to make API calls and CinchyConfig to configure the service
import { CinchyService, CinchyConfig } from 'cinchy-angular';
...

// Create a config (as a class of CinchyConfig) to be loaded into CinchyService
export const MyCinchyAppConfig: CinchyConfig = {
  // The root url of your Cinchy instance
  cinchyRootUrl: 'http://qa1-app1.cinchy.co',
  // The url of your Cinchy IdentityServer
  authority: 'http://qa1-sso.cinchy.co/CinchySSO/identity',
  // The redirect url after logging in
  redirectUri: 'http://my-app-url/',
  // The id of your applet
  clientId: 'my-applet-id'
};

@Component({
  ...
  // Load the MyCinchyAppConfig into CinchyService
  providers: [CinchyService, {
    provide: CinchyConfig, useValue: MyCinchyAppConfig
  }]
  ...
})

export class AppComponent {

  // Inject CinchyService into this component
  constructor(private _cinchyService: CinchyService) {

    // Redirect to login screen
    this._cinchyService.login().then( response => {
        console.log('Login Success!');
    }).catch( error => {
        console.log('Login Failed');  
    });
  }
```

## Allowing App for Embedment
Apps can be embedded and launched within the Cinchy platfrom.

Before your app can be embedded, you must use the iframe-resizer library within your Angular App. This allows your app to be properly resized within an iFrame when integrated into Cinchy's platform.

The iframe-resizer package is already included in the cinchy-angular npm package.
Simply the iframe-resizer .js files into your project's scripts within `.angular-cli.json`:

```typescript
"scripts": [
    "../node_modules/cinchy-angular/node_modules/iframe-resizer/js/iframeResizer.min.js",
    "../node_modules/cinchy-angular/node_modules/iframe-resizer/js/iframeResizer.contentWindow.min.js"
],
```

## Example Usage
Once your Angular app is properly set-up and logged into Cinchy, you may start executing queries.

Executing a saved query and parsing returned data:

```typescript
const data = [];
const domain = 'My Domain Name';
const query = 'My Query Name';

// Values such as connectionid, transactionid, and parameterized variables in the query
const params = {'@city': 'Toronto'};

this._cinchyService.executeJsonSavedQuery(domain, query, params).subscribe(
    response => {
        let jsonQueryResult = response.jsonQueryResult;
        // Parses the result data
        while (jsonQueryResult.moveToNextRow()) {
            const this_row = {};
            for (const col of jsonQueryResult.getColNames()){
                this_row[col] = jsonQueryResult.getCellValue(col);
            }
            data.push(this_row);
        }

        // Printing the result after parsing
        console.log(data);
    },
    error => {
        console.log(error);
    });
```

Executing a custom query and parsing returned data:

```typescript
// CQL Query
const query = 'SELECT * FROM [DOMAIN].[TABLE NAME]';

// Values such as connectionid, transactionid, and parameterized variables in the query
const params = null;

const data = [];
this._cinchyService.executeJsonQuery(query, params).subscribe(
    response => {
        let jsonQueryResult = response.jsonQueryResult;
        // Parses the result data
        while (jsonQueryResult.moveToNextRow()) {
            const this_row = {};
            for (const col of jsonQueryResult.getColNames()){
                this_row[col] = jsonQueryResult.getCellValue(col);
            }
            data.push(this_row);
        }

        // Printing the result after parsing
        console.log(data);
    },
    error => {
        console.log(error);
    });
```


## API

* [CinchyService](#cinchy_service)
   * [.login()](#login) ⇒ <code>Promise</code>
   * [.executeJsonQuery(query, params, callbackState?)](#execute_json_query) ⇒ <code>Observable</code>
   * [.executeJsonSavedQuery(domain, query, params, callbackState?)](#execute_json_saved_query) ⇒ <code>Observable</code>
   * [.openConnection(callbackState?)](#open_connection) ⇒ <code>Observable</code>
   * [.closeConnection(connectionId, callbackState?)](#close_connection) ⇒ <code>Observable</code>
   * [.beginTransaction(connectionId, callbackState?)](#begin_transaction) ⇒ <code>Observable</code>
   * [.commitTransaction(connectionId, transactionId, callbackState?)](#commit_transaction) ⇒ <code>Observable</code>
   * [.rollbackTransaction(connectionId, transactionId, callbackState?)](#rollback_transaction) ⇒ <code>Observable</code>
   * [.executeMultipleJsonSavedQueries(savedQueryParams, callbackState?)](#execute_multiple_json_saved_queries) ⇒ <code>Observable</code>
   * [.getGroupsCurrentUserBelongsTo()](#get_groups_current_user_belongs_to) ⇒ <code>Observable</code>
   * [.getTableEntitlementsById(tableId)](#get_table_entitlements_by_id) ⇒ <code>Observable</code>
   * [.getTableEntitlementsByGuid(tableGuid)](#get_table_entitlements_by_guid) ⇒ <code>Observable</code>
   * [.getTableEntitlementsByName(domainName, tableName)](#get_table_entitlements_by_name) ⇒ <code>Observable</code>

<a name="cinchy_service"></a>

## CinchyService

<a name="login"></a>

### .login() => `Promise`
Redirects the page to Cinchy's login page.

The login function returns a promise indicating when the user is logged in.

```typescript
this._cinchyService.login().then( response => {
    console.log('Login Success!');
}).catch( error => {
    console.log('Login Failed');  
});
```

<a name="execute_json_query"></a>

### .executeJsonQuery(query, params, callbackState?) => `Observable`
Performs a custom CQL query.

#### returns `Observable<{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}>`

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | A CQL query as a string |
| params | <code>string</code> | An object with variables associated or needed with the query (connectionid, transactionid, parameterized values) |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="execute_json_saved_query"></a>

### .executeJsonSavedQuery(domain, query, params, callbackState?) => `Observable`
Performs a saved query.

#### returns `Observable<{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}>`

| Param | Type | Description |
| --- | --- | --- |
| domain | <code>string</code> | The domain in which the saved query is in. |
| query | <code>string</code> | The query's name in the domain. |
| params | <code>string</code> | An object with variables associated or needed with the query (connectionid, transactionid, parameterized values) |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="open_connection"></a>

### .openConnection(callbackState?) => `Observable`
Opens a connection with Cinchy for data transactions.

#### returns `Observable<{connectionId: string, callbackState}>`

| Param | Type | Description |
| --- | --- | --- |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="close_connection"></a>

### .closeConnection(connectionId, callbackState?) => `Observable`
Closes a connection with Cinchy for data transactions.

#### returns `Observable<{connectionId: string, callbackState}>`

| Param | Type | Description |
| --- | --- | --- |
| connectionId | <code>string</code> | The connectionid of the connection you want to close. |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="begin_transaction"></a>

### .beginTransaction(connectionId, callbackState?) => `Observable`
Starts a transaction.

#### returns `Observable<{transactionId: string, callbackState}>`

| Param | Type | Description |
| --- | --- | --- |
| connectionId | <code>string</code> | The connectionid of the connection you want to start a transaction on. |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="commit_transaction"></a>

### .commitTransaction(connectionId, transactionId, callbackState?) => `Observable`
Commits a transaction.

#### returns `Observable<{connectionId: string, transactionId: string, callbackState}>`

| Param | Type | Description |
| --- | --- | --- |
| connectionId | <code>string</code> | The connectionid of the connection you want to commit the transaction on. |
| transactionId | <code>string</code> | The transactionid of the transaction you want to commit. |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="rollback_transaction"></a>

### .rollbackTransaction(connectionId, transactionId, callbackState?) => `Observable`
Rollback a transaction.

#### returns `Observable<{connectionId: string, transactionId: string, callbackState}>`

| Param | Type | Description |
| --- | --- | --- |
| connectionId | <code>string</code> | The connectionid of the connection you want to rollback the transaction on. |
| transactionId | <code>string</code> | The transactionid of the transaction you want to rollback. |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="execute_multiple_json_saved_queries"></a>

### .executeMultipleJsonSavedQueries(savedQueryParams, callbackState?) => `Observable`
Executes multiple saved queries.

#### returns `Observable<{jsonQueryResult: CinchyService.JsonQueryResult, callbackState}[]>`

| Param | Type | Description |
| --- | --- | --- |
| savedQueryParams | <code>[object]</code> | An object array. Each object containing variables (domain: string, query: string, params: object, callbackState: any) |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="get_groups_current_user_belongs_to"></a>

### .getGroupsCurrentUserBelongsTo() => `Observable`
Retrieves the access control groups the current user belongs to.

#### returns `Observable<any>`

<a name="get_table_entitlements_by_id"></a>

### .getTableEntitlementsById(tableId) => `Observable`
Retrieves a table's entitlements by its id.

#### returns `Observable<any>`

| Param | Type | Description |
| --- | --- | --- |
| tableId | <code>string</code> | The Cinchy Id of the table you want the entitlements of. Can be found when exporting a table model or simply when you view a table in the Cinchy platform, you can see its Id in the url. |

<a name="get_table_entitlements_by_guid"></a>

### .getTableEntitlementsByGuid(tableGuid) => `Observable`
Retrieves a table's entitlements by its GUID.

#### returns `Observable<any>`

| Param | Type | Description |
| --- | --- | --- |
| tableGuid | <code>string</code> | The guid of the table you want the entitlements of. Can be found when exporting a table model. |

<a name="get_table_entitlements_by_name"></a>

### .getTableEntitlementsByName(tableDomain, tableName) => `Observable`
Retrieves a table's entitlements by its domain and name.

#### returns `Observable<any>`

| Param | Type | Description |
| --- | --- | --- |
| tableDomain | <code>string</code> | The name of the domain in which the table is in. |
| tableName | <code>string</code> | The name of the table. |

## More Documentaion
See [here](http://support.cinchy.co/) for more information.

## License
This project is license under the terms of the [GNU General Public License v3.0](https://github.com/cinchy-co/angular-sdk/blob/master/LICENSE)