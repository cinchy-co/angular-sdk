# SdkDemo

This project was created to demonstrate the capabilities of the Cinchy Angular SDK.

## Usage

Before running the app, you need to import the [SDK Demo Model.xml](https://github.com/cinchy-co/angular-sdk/blob/master/sdk-demo/SDK%20Demo%20Model.xml) file into your Cinchy instance and build the queries needed.

Within the main `app.component.ts` file, there is a CinchyConfig object that is declared at the beginning. You must config it to work with your Cinchy instance.
```typescript
export const MyCinchyAppConfig: CinchyConfig = {
  cinchyRootUrl: 'http://qa1-app1.cinchy.co',
  authority: 'http://qa1-sso.cinchy.co/CinchySSO/identity',
  redirectUri: 'http://localhost:3000/',
  clientId: 'alvin-rest-sample'
};
```
`cinchyRootUrl` is the URL to your own Cinchy instance.
`authority` is the URL to your own IdentityServer.
`redirectUri` is the URL to your application after logging in.
`clientId` is the Id of the integrated app. You need to register your application before running it by inserting the app's info into the Integrated Apps table.

Simply run `ng serve` for a local server that'll listen on port 4200.
You may also use `ng serve --port ####` for a specific port number.

## Needed Queries
You must also add the corresponding queries for the demo to work.

* [Get Questions](#get_questions)
* [Get Leaderboard](#get_leaderboard)
* [Get Answers](#get_answers)
* [Insert Answer](#insert_answer)
* [Get User Id](#get_user_id)

<a name="get_questions"></a>

### Get Questions
Obtains all the questions.
```SQL
SELECT [Cinchy Id] as QuestionId, [Question], [Asker].[Name].[Name] as AskerName, [Asker].[Name].[Username] as AskerUsername, [Location], [Asker].[Name].[Profile Photo] as AskerPhoto
FROM [SDK Demo].[Questions]
WHERE [Deleted] IS NULL
```

<a name="get_leaderboard"></a>

### Get Leaderboard
Obtains the leaderboard
```SQL
SELECT COUNT([Answer]) as Score, [User].[Name].[Name] as Name, [User].[Name].[Username] as Username
FROM [SDK Demo].[Answers]
WHERE [Deleted] IS NULL
GROUP BY [User].[Name].[Name], [User].[Name].[Username]
ORDER BY COUNT([Answer]) DESC
```

<a name="get_answers"></a>

### Get Answers
Obtains the questions given the question id.
```SQL
SELECT [Answer], [User].[Name].[Name] as Name, [User].[Name].[Username] as Username, [User].[Name].[Profile Photo] as AnswererPhoto
FROM [SDK Demo].[Answers]
WHERE [Deleted] IS NULL AND [Question].[Cinchy Id] = @questionid
```

<a name="insert_answer"></a>

### Insert Answer
Given the answer, question id, and user id, it inserts the answer into the answer table.
```SQL
INSERT INTO [SDK Demo].[Answers]([Answer], [Question], [User])
VALUES (@answer, @questionid, @userid);
```

<a name="get_user_id"></a>

### Get User Id
Obtains cinchy id of logged in user given their username from the Users table. This is used with the Insert Answer query.
```SQL
SELECT [Cinchy Id]
FROM [SDK Demo].[Users]
WHERE [Deleted] IS NULL AND [Name].[Username]=@username
```


## License
This project is license under the terms of the [GNU General Public License v3.0](https://github.com/cinchy-co/angular-sdk/blob/master/LICENSE)