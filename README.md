# @cinchy-co/angular-sdk

## Installation

To install this library, go to your angular project directory and use:

```bash
$ npm install @cinchy-co/angular-sdk --save
```

Please use version 2.x.x and 3.x.x if you are using **Angular 6** / **Angular 7** / **Angular 8** and **Cinchy v2.x.x** / **Cinchy v3.x.x**.

Please use version 4.x.x if you are using **Angular 6** / **Angular 7** / **Angular 8** and **Cinchy v4.x.x**.

If you are using **Angular 5** and a lower version of Cinchy, use version 1.x.x or lower.

In order to use the [.getUserPreferences()](#get_user_preferences) and [.getTranslatedLiterals(guids, debug?)](#get_translated_literals) functions in the API (added since version 4.0.0), your Cinchy version should be at least on **Cinchy v4.x.x**.
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
  cinchyRootUrl: 'http://my.cinchy.instance.co',
  // The url of your Cinchy IdentityServer
  authority: 'http://my.cinchy.instance.co/cinchyssocore',
  // The redirect url after logging in
  redirectUri: 'http://my-app-url/',
  // The client id for your applet
  clientId: 'my-applet-id',
  // (Optional) The redirect url after you logout
  logoutRedirectUri: 'http://localhost:3000/',
  // (Optional) The requested scopes for the applet (must be permitted for the client)
  // You must have openid and id requested
  scope: 'openid id email profile roles',
  // (Optional) Enable silent refresh
  silentRefreshEnabled: true,
  // (Optional) (Mandatory if silentRefreshEnabled = true) The silent refresh url
  silentRefreshRedirectUri: 'http://localhost:3000/silent-refresh.html'
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

## Enabling Silent Refresh
Silent refresh automatically refreshes your access token every 75% of your token's lifetime.

In order to use silent refresh, you must:

1). Set the silentRefreshEnabled property to true in your CinchyConfig object.

2). Add a silent-refresh.html file into your Angular project. This can be found within the /src/lib/ folder in the repo or copy & paste this:

```html
<html>
    <body>
        <script>
            parent.postMessage(location.hash, location.origin);
        </script>
    </body>
</html>
```

3). Within your angular.json file, specify the silent-refresh.html path and file within the "assets" property:

```json
...
"assets": [
    "src/favicon.ico",
    "src/assets",
    "src/silent-refresh.html"
],
...
```

Silent refresh works by using a hidden iframe to access a url that contains the silent-refresh.html page. This iframe makes a request to the server to retrieve a new access token.

4). Add the silent-refresh url into the "Permitted Login Redirect URLs" field of the "Integrated Clients" table within Cinchy (eg. http://localhost:3000/silent-refresh.html).

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

<a name="example_usage"></a>

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

## Using Translate API

In order to use the Translation API, you will have to use the [getTranslatedLiterals(guids)](#get_translated_literals) function and using the returned dictionary to bind the translation text into your view.

Assuming you have CinchyService setup and a user is logged in, follow these steps to get translation working:

1). In your component, import [CinchyLiteralDictionary](#cinchy_literal_dictionary) from @cinchy-co/angular-sdk.

```typescript
import { CinchyLiteralDictionary } from '@cinchy-co/angular-sdk';
```

2). Find the strings you want translated inside the `Literals` table in the `Cinchy` domain. Then gather the corresponding guids of the strings and insert them into an array inside your component. Also initialize a [CinchyLiteralDictionary](#cinchy_literal_dictionary) object.

```typescript
export class AppComponent {
  literalDictionary: CinchyLiteralDictionary;
  guids: string[] = ["27d4314b-adee-4e89-ad7f-2381a21729cf",
  "67c7dab0-9a7d-4ec9-88d0-271700c779b4",
  "47d9840d-0e09-4693-ae52-c726c5927a3a"];
```

3). Bind the guids to your component's view.

```html
<div *ngIf="literalDictionary">
    <h1>{{ literalDictionary['27d4314b-adee-4e89-ad7f-2381a21729cf'].translation }}</h1>
    <p>Translation 1: {{ literalDictionary['67c7dab0-9a7d-4ec9-88d0-271700c779b4'].translation }}!</p>
    <p>Translation 2: {{ literalDictionary['47d9840d-0e09-4693-ae52-c726c5927a3a'].translation }}!</p>
</div>
```

4). Make the API call by passing in the guids into [getTranslatedLiterals(guids)](#get_translated_literals) and setting dictionary you initialized in the previous step as the response.

```typescript
export class AppComponent {
    literalDictionary: CinchyLiteralDictionary;
    guids: string[] = ["27d4314b-adee-4e89-ad7f-2381a21729cf",
    "67c7dab0-9a7d-4ec9-88d0-271700c779b4",
    "47d9840d-0e09-4693-ae52-c726c5927a3a"];

    constructor(private _cinchyService: CinchyService) {
        var _this = this;
        this._cinchyService.login().then(function() {
        _this._cinchyService.getTranslatedLiterals(_this.guids).subscribe(
                resp => {
                    _this.literalDictionary = resp;
                },
                error => {
                    console.log('Error getting translations: ', error);
                }
            );
        });
    }
}
```

The translated text will then automatically bind into the view.

## API

* [CinchyService](#cinchy_service) : <code>Service</code>
   * [.login(redirectUriOverride?)](#login) ⇒ <code>Promise</code>
   * [.logout()](#logout) ⇒ <code>Void</code>
   * [.getUserIdentity()](#get_user_identity) ⇒ <code>Observable</code>
   * [.getAccessToken()](#get_access_token) ⇒ <code>Observable</code>
   * [.checkSessionValidity()](#check_session_validity) ⇒ <code>Observable</code>
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
   * [.getUserPreferences()](#get_user_preferences) ⇒ <code>Observable</code>
   * [.getTranslatedLiterals(guids, debug?)](#get_translated_literals) ⇒ <code>Observable</code>
* [Cinchy.QueryResult](#cinchy_query_result) : <code>Object</code>
   * [.convertToObject(key)](#convert_to_object) ⇒ <code>Object</code>
   * [.getColumns()](#get_columns) ⇒ <code>Array&lt;Object&gt;</code>
   * [.getColNames()](#get_col_names) ⇒ <code>Array&lt;String&gt;</code>
   * [.getColCount()](#get_col_count) ⇒ <code>number</code>
   * [.getRowCount()](#get_row_count) ⇒ <code>number</code>
   * [.moveToNextRow()](#move_to_next_row)
   * [.moveToRow(idx)](#move_to_row)
   * [.getCurrentRowIdx()](#get_current_row_idx) ⇒ <code>number</code>
   * [.resetIterator()](reset_iterator)
   * [.getCellValue(col)](#get_cell_value) ⇒ <code>any</code>
   * [.getMultiselectCellValue(col)](#get_multiselect_cell_value) ⇒ <code>Array&lt;String&gt;</code>
   * [.toObjectArray()](#to_object_array) ⇒ <code>Array&lt;Object&gt;</code>
* [CinchyUserPreference](#cinchy_user_preference) : <code>Object</code>
* [CinchyLiteralDictionary](#cinchy_literal_dictionary) : <code>Object</code>
* [CinchyLiteralTranslation](#cinchy_literal_translation) : <code>Object</code>

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

<a name="logout"></a>

### .logout() => `Void`
Logs the user out of the session.

<a name="get_user_identity"></a>

### .getUserIdentity() => `Observable`
Retrieves the logged in user's identity information when it is available.

Example: the return object.id is the user's username. object.sub is the user's Cinchy Id.

<a name="get_access_token"></a>

### .getAccessToken() => `Observable`
Retrieves the access token (string) for the authenticated user when it is available.

#### returns `Observable<string>`

<a name="check_session_validity"></a>

### .checkSessionValidity() => `Observable`
Checks whether or not the access token used to query Cinchy is still valid.
If invalid, the application will be unable to call queries on Cinchy.

#### returns `Observable<{accessTokenIsValid: boolean}>`

Example Usage
```typescript
this._cinchyService.checkSessionValidity().subscribe(
    success => {
        console.log('Session is valid!');
    },
    error => {
        console.log('Session timed out!');
    }
);
```

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

<a name="get_user_preferences"></a>

### .getUserPreferences() => `Observable`
Retrieves the current user's preferences (must be logged in).

#### returns `Observable<CinchyUserPreference>`
See [CinchyUserPreference](#cinchy_user_preference)

<a name="get_translated_literals"></a>

### .getTranslatedLiterals(guids, debug?) => `Observable`
Retrieves a dictionary of guids that map to their string translations. The language and region of the returned translated text will be based on the current user's language and region preferences inside Cinchy.

#### returns `Observable<CinchyLiteralDictionary>`

| Param | Type | Description |
| --- | --- | --- |
| guids | <code>string[]</code> | A string of guids corresponding to strings that you want translated. |
| debug | <code>boolean</code> | (Optional) A boolean flag. If set to true, the data returned will have more information about the translated text. See [CinchyLiteralTranslation](#cinchy_literal_translation) |

<a name="cinchy_query_result"></a>

## Cinchy.QueryResult

QueryResult is within the namespace `Cinchy`.

It is the object that gets returned whenever you make a query using CinchyService. The object represents the data returned by a query in table form; providing you with functions to iterate through rows and columns to obtain values in each cell.

Think of the QueryResult as a table with a pointer. We nagivate through the table by moving the pointer to each row (default points to -1). In basic useage, we use .moveToNextRow() or .moveToRow() to move the pointer to the next or another row in the table. While pointing to a row, you may use .getCellValue(col) to obtain a cell's value in the row the pointer is located (See [example usage](#example_usage)).

<a name="convert_to_object"></a>

### .convertToObject(key) => `Object`
This returns the QueryResult as an object with a given column (must have unique values) as the keys mapping to each row.

For example, if you have a QueryResult dataset with columns "Customer Id", "Age", and "Birthday", you may call .convertToObject('Customer Id') and have it return an object with each row mapped to its Customer Id. This way, you may access a row's values based on a Customer Id.

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | A column name that contains unique values. |

<a name="get_columns"></a>

### .getColumns() => `Array<Object>`
Returns an array of objects definining each column by their name and field type.

The array of objects returned are defined as Array<{columnName: string, type: string}> where `columnName` is the name of the column and `type` is the data type of the values in the column (e.g. "Int32", "String", "Byte[]", etc.)

<a name="get_col_names"></a>

### .getColNames() => `Array<String>`
Returns an array of column names as strings.

<a name="get_col_count"></a>

### .getColCount() => `number`
Returns the number of columns.

<a name="get_row_count"></a>

### .getRowCount() => `number`
Returns the number of rows.

<a name="move_to_next_row"></a>

### .moveToNextRow()
Moves the row pointer to the next row. 

<a name="move_to_row"></a>

### .moveToRow(idx)
Moves the row pointer to the given row index.

| Param | Type | Description |
| --- | --- | --- |
| idx | <code>number</code> | The index of the row you want the row pointer to move to. |

<a name="get_current_row_idx"></a>

### .getCurrentRowIdx() => `number`
Returns the index of the current row the row pointer is at.

<a name="reset_iterator"></a>

### .resetIterator()
Moves the row pointer back to index -1. 

<a name="get_cell_value"></a>

### .getCellValue(col) => `any`
Returns the cell value of the specified column on the current row.

| Param | Type | Description |
| --- | --- | --- |
| col | <code>string or number</code> | The name of a column or the index of a column. |

<a name="get_multiselect_cell_value"></a>

### .getMultiselectCellValue(col) => `Array<String>`
Returns an array of each value in a multiselect field.

When you use .getCellValue(col) on a multiselect column, it returns a string with commas separating each selected value. Using .getMultiselectCellValue(col) allows you to recieve an array instead. 

| Param | Type | Description |
| --- | --- | --- |
| col | <code>string</code> | The name of the multiselect column. |

<a name="to_object_array"></a>

### .toObjectArray() => `Array<Object>`
Returns an array of objects representing each row in the dataset.

Each key in the object is a column name and maps it to the corresponding cell value.
This is useful if you want to use a Array.prototype.map() function on each row.

<a name="cinchy_user_preference"></a>

## CinchyUserPreference : `Object`

CinchyUserPreference is the object returned by the method [getUserPreferences()](#get_user_preferences). It is a data structure containing properties of the user's preferences.

```typescript
interface CinchyUserPreference {
    username: string;
    name: string;
    displayName: string;
    emailAddress: string;
    profilePhoto: string;
    language: string;
    region: string;
}
```

| Property | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | The user's username. |
| name | <code>string</code> | The user's full name. |
| displayName | <code>string</code> | The user's name plus username in parentheses (e.g. "Jane Doe (jane.doe)"). |
| profilePhoto | <code>string</code> | The user's profile photo in base64 encoding. |
| language | <code>string</code> | The user's preferred language's subtag. |
| region | <code>string</code> | The user's preferred region's subtag. |

<a name="cinchy_literal_dictionary"></a>

## CinchyLiteralDictionary : `Object`

CinchyLiteralDictionary is the object returned by the method [getTranslatedLiterals(guids)](#get_translated_literals). It is a dictionary that maps guids to a [CinchyLiteralTranslation](#cinchy_literal_translation) object (which in turn contains the translation of the guid's corresponding string inside Cinchy).

```typescript
interface CinchyLiteralDictionary {
    [guid: string]: CinchyLiteralTranslation;
}
```

| Property | Type | Description |
| --- | --- | --- |
| `any guid string` | <code>CinchyLiteralTranslation</code> | Any guid key, maps to a CinchyLiteralTranslation object. |

See [CinchyLiteralTranslation](#cinchy_literal_translation).

<a name="cinchy_literal_translation"></a>

## CinchyLiteralTranslation : `Object`

CinchyLiteralTranslation is an object used within the [CinchyLiteralDictionary](#cinchy_literal_dictionary) dictionary. It is a data structure containing the translation of a literal within Cinchy.

```typescript
interface CinchyLiteralTranslation {
    translation: string;
    language: string;
    region: string;
    defaultText: boolean;
}
```

| Property | Type | Description |
| --- | --- | --- |
| translation | <code>string</code> | The translation string. |
| language | <code>string</code> | (only on debug) The language subtag of the translated text. |
| region | <code>string</code> | (only on debug) The region subtag of the translated text. |
| defaultText | <code>boolean</code> | (only on debug) Whether or not the default text was used for the translation text. |

See [CinchyLiteralTranslation](#cinchy_literal_translation).

## More Documentaion
See [here](http://support.cinchy.co/) for more information.

## License
This project is license under the terms of the [GNU General Public License v3.0](https://github.com/cinchy-co/angular-sdk/blob/master/LICENSE)