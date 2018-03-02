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
import { CinchyModule } from '@cinchy-co/angular-sdk';

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
import { CinchyService, CinchyConfig } from '@cinchy-co/angular-sdk';
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

The iframe-resizer package is already included in the Cinchy npm package so it installed it within your node_modules.
Simply the iframe-resizer .js files into your project's scripts within `.angular-cli.json`:

```typescript
"scripts": [
    "../node_modules/iframe-resizer/js/iframeResizer.min.js",
    "../node_modules/iframe-resizer/js/iframeResizer.contentWindow.min.js"
],
```

Please note that in order for iFrame to properly resize within the Cinchy platform, the height of your outer most elements (a div container for example) needs to have a style `height` of `auto`.

## Example Usage
Once your Angular app is properly set-up and logged into Cinchy, you may start executing queries.

Executing a query and parsing returned data:

```typescript
const data = [];
const domain = 'My Domain Name';
const query = 'My Query Name';

// Values such as connectionid, transactionid, and parameterized variables in the query
const params = {'@city': 'Toronto'};

this._cinchyService.executeQuery(domain, query, params).subscribe(
    response => {
        let queryResult = response.queryResult;
        // Parses the result data
        while (queryResult.moveToNextRow()) {
            const this_row = {};
            for (const col of queryResult.getColNames()){
                this_row[col] = queryResult.getCellValue(col);
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
// CSQL Query
const query = 'SELECT * FROM [DOMAIN].[TABLE NAME]';

// Values such as connectionid, transactionid, and parameterized variables in the query
const params = null;

const data = [];
this._cinchyService.executeCsql(query, params).subscribe(
    response => {
        let queryResult = response.QueryResult;
        // Parses the result data
        while (queryResult.moveToNextRow()) {
            const this_row = {};
            for (const col of queryResult.getColNames()){
                this_row[col] = queryResult.getCellValue(col);
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
   * [.login(redirectUriOverride?)](#login) ⇒ <code>Promise</code>
   * [.getUserIdentity()](#get_user_identity) ⇒ <code>Object</code>
   * [.executeCsql(query, params, callbackState?)](#execute_csql) ⇒ <code>Observable</code>
   * [.executeQuery(domain, query, params, callbackState?)](#execute_query) ⇒ <code>Observable</code>
   * [.openConnection(callbackState?)](#open_connection) ⇒ <code>Observable</code>
   * [.closeConnection(connectionId, callbackState?)](#close_connection) ⇒ <code>Observable</code>
   * [.beginTransaction(connectionId, callbackState?)](#begin_transaction) ⇒ <code>Observable</code>
   * [.commitTransaction(connectionId, transactionId, callbackState?)](#commit_transaction) ⇒ <code>Observable</code>
   * [.rollbackTransaction(connectionId, transactionId, callbackState?)](#rollback_transaction) ⇒ <code>Observable</code>
   * [.executeQueries(queryParams, callbackState?)](#execute_queries) ⇒ <code>Observable</code>
   * [.getGroupsCurrentUserBelongsTo()](#get_groups_current_user_belongs_to) ⇒ <code>Observable</code>
   * [.getTableEntitlementsById(tableId)](#get_table_entitlements_by_id) ⇒ <code>Observable</code>
   * [.getTableEntitlementsByGuid(tableGuid)](#get_table_entitlements_by_guid) ⇒ <code>Observable</code>
   * [.getTableEntitlementsByName(domainName, tableName)](#get_table_entitlements_by_name) ⇒ <code>Observable</code>

<a name="cinchy_service"></a>

## CinchyService

<a name="login"></a>

### .login(redirectUriOverride?) => `Promise`
Redirects the page to Cinchy's login page.

The login function returns a promise indicating when the user is logged in.

| Param | Type | Description |
| --- | --- | --- |
| redirectUriOverride | <code>string</code> | Optional. A redirect url after successfully logging in. This overrides the redirect url in the initial CinchyConfig. |

```typescript
this._cinchyService.login().then( response => {
    console.log('Login Success!');
}).catch( error => {
    console.log('Login Failed');  
});
```

<a name="get_user_identity"></a>

### .getUserIdentity() => `object`
Returns the logged in user's identity information.

Example the return object.id is the user's username. object.sub is the user's Cinchy Id.

<a name="execute_csql"></a>

### .executeCsql(query, params, callbackState?) => `Observable`
Performs a custom CSQL query.

#### returns `Observable<{queryResult: CinchyService.QueryResult, callbackState}>`

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | A CSQL query as a string |
| params | <code>string</code> | An object with variables associated or needed with the query (connectionid, transactionid, parameterized values) |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="execute_query"></a>

### .executeQuery(domain, query, params, callbackState?) => `Observable`
Performs a query that's within Cinchy.

#### returns `Observable<{queryResult: CinchyService.QueryResult, callbackState}>`

| Param | Type | Description |
| --- | --- | --- |
| domain | <code>string</code> | The domain in which the query is in. |
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

<a name="execute_queries"></a>

### .executeQueries(queryParams, callbackState?) => `Observable`
Executes multiple queries.

#### returns `Observable<{queryResult: CinchyService.QueryResult, callbackState}[]>`

| Param | Type | Description |
| --- | --- | --- |
| queryParams | <code>[object]</code> | An object array. Each object containing variables (domain: string, query: string, params: object, callbackState: any) |
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