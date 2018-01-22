# cinchy-angular

## Installation

To install this library, go to your angular project directory and use:

```bash
$ npm install cinchy-angular --save
```

## Importing the Cinchy Library

From your Angular `AppModule`:

```typescript
...
// Import Cinchy's module and service
import { CinchyModule, CinchyService } from 'cinchy-angular';

@NgModule({
  ...
  imports: [
    ...
    // Import CinchyModule in imports
    CinchyModule.forRoot()
  ],

  // Add CinchyService as one of the providers
  providers: [CinchyService],
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
  redirectUri: 'http://localhost:4200/',
  // The id of your applet
  clientId: 'your-applet-id'
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

    // Present login screen
    this._cinchyService.login().then( success => {
      if (success)
        console.log('Logged in success!');
    });
  }
```

## Example Usage
Once your Angular app is properly set-up and logged into Cinchy, you may start executing queries.

Executing a saved query:

```typescript
const data = [];
const domain = 'My Domain Name';
const query = 'My Query Name';

// Values such as connectionid, transactionid, and parameterized variables in the query
const params = {'@city': 'Toronto'};

this._cinchyService.executeJsonSavedQuery(domain, query, params, jsonQueryResult => {
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
  }
);
```

Executing a custom query:

```typescript
const data = [];

// CQL Query
const query = 'SELECT * FROM [DOMAIN].[TABLE NAME]';

// Values such as connectionid, transactionid, and parameterized variables in the query
const params = null;

this._cinchyService.executeJsonQuery(query, params, jsonQueryResult => {
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
  }
);
```


## API

## CinchyService
<a name="cinchy_service"></a>

**Kind**: global class  

* [CinchyService](#cinchy_service)
   * [.login()](#login) ⇒ <code>Promise</code>
   * [.executeJsonQuery(query, params, successCallback?, errorCallback?, callbackState?, continueOnFailure?, completionMonitor?)](#execute_json_query) 
   * [.executeJsonSavedQuery(domain, query, params, successCallback?, errorCallback?, callbackState?, continueOnFailure?, completionMonitor?)](#execute_json_saved_query)
   * [.openConnection(successCallback?, errorCallback?, callbackState?)](#open_connection)
   * [.closeConnection(connectionId, successCallback?, errorCallback?, callbackState?)](#close_connection)
   * [.beginTransaction(connectionId, successCallback?, errorCallback?, callbackState?)](#begin_transaction)
   * [.commitTransaction(connectionId, transactionId, successCallback?, errorCallback?, callbackState?)](#commit_transaction)
   * [.rollbackTransaction(connectionId, transactionId, successCallback?, errorCallback?, callbackState?)](#rollback_transaction)
   * [.executeMultipleJsonSavedQueries(savedQueryParams, callback?, callbackState?)](#execute_multiple_json_saved_queries)



<a name="login"></a>

### .login()
Redirects the page to Cinchy's login page.

Returns a boolean for a promise to indicate whether the login was successful or not.

```typescript
this._cinchyService.login().then( success => {
  if (success)
    console.log('Logged in success!');
});
```

<a name="execute_json_query"></a>

### .executeJsonQuery(query, params, successCallback?, errorCallback?, callbackState?, continueOnFailure?, completionMonitor?)
Performs a custom CQL query.

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | A CQL query as a string |
| params | <code>string</code> | An object with variables associated or needed with the query (connectionid, transactionid, parameterized values) |
| successCallback? | <code>callback</code> | Callback function that returns (jsonQueryResult, callbackState) on success of query |
| errorCallback? | <code>callback</code> | Callback function that returns (cinchyEx, callbackState) on failure/error of query |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |
| continueOnFailure? | <code>boolean</code> | For executeMultipleSavedQueries(). Ignore this param. |
| completionMonitor? | <code>object</code> | MultiQueryCompletionMonitor object for executeMultipleSavedQueries(). Ignore this param. |

<a name="execute_json_saved_query"></a>

### .executeJsonSavedQuery(domain, query, params, successCallback?, errorCallback?, callbackState?, continueOnFailure?, completionMonitor?)
Performs a saved query.

| Param | Type | Description |
| --- | --- | --- |
| domain | <code>string</code> | The domain in which the saved query is in. |
| query | <code>string</code> | The query's name in the domain. |
| params | <code>string</code> | An object with variables associated or needed with the query (connectionid, transactionid, parameterized values) |
| successCallback? | <code>callback</code> | Callback function that returns (jsonQueryResult, callbackState) on success of query |
| errorCallback? | <code>callback</code> | Callback function that returns (cinchyEx, callbackState) on failure/error of query |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |
| continueOnFailure? | <code>boolean</code> | For executeMultipleSavedQueries(). Ignore this param. |
| completionMonitor? | <code>object</code> | MultiQueryCompletionMonitor object for executeMultipleSavedQueries(). Ignore this param. |

<a name="open_connection"></a>

### .openConnection(successCallback?, errorCallback?, callbackState?)
Opens a connection with Cinchy for data transactions.

| Param | Type | Description |
| --- | --- | --- |
| successCallback? | <code>callback</code> | Callback function that returns (connectionId, callbackState) on success. |
| errorCallback? | <code>callback</code> | Callback function that returns (cinchyEx, callbackState) on failure/error. |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="close_connection"></a>

### .closeConnection(connectionId, successCallback?, errorCallback?, callbackState?)
Closes a connection with Cinchy for data transactions.

| Param | Type | Description |
| --- | --- | --- |
| connectionId | <code>string</code> | The connectionid of the connection you want to close. |
| successCallback? | <code>callback</code> | Callback function that returns (connectionId, callbackState) on success. |
| errorCallback? | <code>callback</code> | Callback function that returns (cinchyEx, callbackState) on failure/error. |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="begin_transaction"></a>

### .beginTransaction(connectionId, successCallback?, errorCallback?, callbackState?)
Starts a transaction.

Returns a transactionid in successCallback.

| Param | Type | Description |
| --- | --- | --- |
| connectionId | <code>string</code> | The connectionid of the connection you want to start a transaction on. |
| successCallback? | <code>callback</code> | Callback function that returns (transactionId, callbackState) on success. |
| errorCallback? | <code>callback</code> | Callback function that returns (cinchyEx, callbackState) on failure/error. |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="commit_transaction"></a>

### .commitTransaction(connectionId, transactionId, successCallback?, errorCallback?, callbackState?)
Commits a transaction.

| Param | Type | Description |
| --- | --- | --- |
| connectionId | <code>string</code> | The connectionid of the connection you want to commit the transaction on. |
| transactionId | <code>string</code> | The transactionid of the transaction you want to commit. |
| successCallback? | <code>callback</code> | Callback function that returns (connectionId, transactionId, callbackState) on success. |
| errorCallback? | <code>callback</code> | Callback function that returns (cinchyEx, callbackState) on failure/error. |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="rollback_transaction"></a>

### .rollbackTransaction(connectionId, transactionId, successCallback?, errorCallback?, callbackState?)
Rollback a transaction.

| Param | Type | Description |
| --- | --- | --- |
| connectionId | <code>string</code> | The connectionid of the connection you want to rollback the transaction on. |
| transactionId | <code>string</code> | The transactionid of the transaction you want to rollback. |
| successCallback? | <code>callback</code> | Callback function that returns (connectionId, transactionId, callbackState) on success. |
| errorCallback? | <code>callback</code> | Callback function that returns (cinchyEx, callbackState) on failure/error. |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

<a name="execute_multiple_json_saved_queries"></a>

### .executeMultipleJsonSavedQueries(savedQueryParams, callback?, callbackState?)
Executes multiple saved queries.

| Param | Type | Description |
| --- | --- | --- |
| savedQueryParams | <code>[object]</code> | An object array. Each object containing variables (domain, query, params, successCallback?, errorCallback?, callbackState?, continueOnFailure?, completionMonitor?) |
| callback? | <code>callback</code> | |
| callbackState? | <code>any</code> | Used for inserting an object of any type to be returned by the function's callbacks |

## More Documentation

See (link) TBD

## License
