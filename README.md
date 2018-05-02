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


## API

* [CinchyService](#cinchy_service) : <code>Service</code>
   * [.login(redirectUriOverride?)](#login) ⇒ <code>Promise</code>
   * [.logout()](#logout) ⇒ <code>Void</code>
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

<a name="cinchy_query_result"></a>

## Cinchy.QueryResult

QueryResult is within the namespace `Cinchy`.

It is the object that gets returned whenever you make a query using CinchyService. The object represents the data returned by a query in table form; providing you with functions to iterate through rows and columns to obtain values in each cell.

Think of the QueryResult as a table with a pointer. We nagivate through the table by moving the pointer to each row (default points to -1). In basic useage, we use .moveToNextRow() or .moveToRow() to move the pointer to the next or another row in the table. While pointing to a row, you may use .getCellValue(col) to obtain a cell's value in the row the pointer is located (see [example usage](#example_usage)).

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

## More Documentaion
See [here](http://support.cinchy.co/) for more information.

## License
This project is license under the terms of the [GNU General Public License v3.0](https://github.com/cinchy-co/angular-sdk/blob/master/LICENSE)