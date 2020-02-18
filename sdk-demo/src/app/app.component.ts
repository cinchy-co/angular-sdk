import { Component } from '@angular/core';
import { CinchyConfig, CinchyService } from '@cinchy-co/angular-sdk';
import { IQuestion, Question } from './Question';
import { IPerson, Person } from './Person';
import { IAnswer, Answer } from './Answer';
import { DomSanitizer } from '@angular/platform-browser';

export const MyCinchyAppConfig: CinchyConfig = {
  cinchyRootUrl: 'http://localhost',
  authority: 'http://localhost:8081',
  redirectUri: 'http://localhost:3000/',
  clientId: 'alvin-rest-sample'
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [CinchyService, {
    provide: CinchyConfig, useValue: MyCinchyAppConfig
  }]
})
export class AppComponent {
  title = 'Curiousity';
  questions: Question[] = [];
  leaderboard: Person[] = [];
  currentAnswer = '';
  currentUserCanAnswer: boolean;

  userIdentity: object;

  constructor(private _cinchyService: CinchyService, private _domSanitizer: DomSanitizer) {
    this._cinchyService.login().then( response => {
      console.log(response);
      console.log('Logged In!');

      // Loads initial data by executing multiple queries
      this.fetchAndLoadInitialData();

      // If user is entitled to answer, display option to answer
      this.checkIfUserIsEntitledToAnswer();

      // Simply logs access rights groups of current user
      this.logGetGroupsCurrentUserBelongsTo();

      // Logs the current user's information
      this._cinchyService.getUserIdentity().subscribe(
        userIdentityResp => {
          this.userIdentity = userIdentityResp;
        }
      );

    }).catch( error => {
      console.log(error);
    });
  }

  // Fetches Questions and Leaderboard data
  fetchAndLoadInitialData() {
    const queriesToExecute = [
      {
        domain: 'SDK Demo',
        query: 'Get Questions',
        params: null,
        callbackState: null,
      }, {
        domain: 'SDK Demo',
        query: 'Get Leaderboard',
        params: null,
        callbackState: null
      }
    ];

    /*this._cinchyService.executeQueries(queriesToExecute)
      .subscribe(
        response => {
          this.loadQuestions(response[0]);
          this.loadLeaderboard(response[1]);
        },
        error => {
          console.log(error);
        }
      );*/
      this._cinchyService.executeQuery(queriesToExecute[0].domain, queriesToExecute[0].query, queriesToExecute[0].params)
        .subscribe(
          response => {
            this.loadQuestions(response);
          },
          error => {
            console.log(error);
          }
        );
      this._cinchyService.executeQuery(queriesToExecute[1].domain, queriesToExecute[1].query, queriesToExecute[1].params)
        .subscribe(
          response => {
            this.loadLeaderboard(response);
          },
          error => {
            console.log(error);
          }
      );
  }

  // Checks if user can add rows to the Answers table
  checkIfUserIsEntitledToAnswer() {
    const domain = 'SDK Demo';
    const tableName = 'Answers';

    this._cinchyService.getTableEntitlementsByName(domain, tableName)
      .subscribe(
        response => {
          console.log(response);
          this.currentUserCanAnswer = response['canAddRows'];
        }
      );
  }

  // Takes the response of Questions data and parses it and loads it
  loadQuestions(response) {
    const data = [];
    const result = response.queryResult;

    // Logging the result as an array of rows
    console.log(result.toObjectArray());

      while (result.moveToNextRow()) {
        const this_row = {};
        for (const col of result.getColNames()) {
          this_row[col] = result.getCellValue(col);
        }

        const question = new Question(this_row['QuestionId'],
                              this_row['Question'],
                              this_row['AskerName'],
                              this_row['AskerUsername'],
                              this_row['Location'],
                              false
        );

        if (this_row['AskerPhoto']) {
          question.setPhoto(this._domSanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + this_row['AskerPhoto']));
        }

        data.push(question);

      }
    this.questions = data;
  }

  // Takes the response of Leaderboard data and parses it and loads it
  loadLeaderboard(response) {
    const data = [];
    const result = response.queryResult;
      while (result.moveToNextRow()) {
        const this_row = {};
        for (const col of result.getColNames()) {
          this_row[col] = result.getCellValue(col);
        }
        data.push(new Person(this_row['Name'], this_row['Username'], this_row['Score']));
      }
    this.leaderboard = data;
  }

  // Fetches Answers given the question index in this.questions array and the question's cinchyid
  fetchAndLoadAnswers(questionIndex, questionId) {
    const domain = 'SDK Demo';
    const query = 'Get Answers';
    const params = {'@questionid': questionId};

    const data = [];

    this._cinchyService.executeQuery(domain, query, params)
      .subscribe( response => {
        const result = response.queryResult;
        while (result.moveToNextRow()) {
          const this_row = {};
          for (const col of result.getColNames()) {
            this_row[col] = result.getCellValue(col);
          }

          const answer = new Answer(this_row['Answer'], this_row['Name'], this_row['Username']);

          if (this_row['AnswererPhoto']) {
            answer.setPhoto(this._domSanitizer.bypassSecurityTrustResourceUrl('data:image/jpg;base64,' + this_row['AnswererPhoto']));
          }

          data.push(answer);
        }
        this.questions[questionIndex].setAnswers(data);
        this.questions[questionIndex].toggleShowAnswers();
      });
  }

  /* Activated on "SUBMIT" button click
   * Starts a chain of function calls in order to commit a transaction.
   * Steps:
   *  1. Execute "Get User Id" where we obtain the Cinchy Id of the current user in [SDK Demo].[Users] table. We need it for step 4.
   *  2. Call openConnectionForAnswerTransaction() function that opens a connection
   *  3. Call beginTransaction() function that begins a transaction
   *  4. Call sendAnswer() function that sends the inserts the answer into the table associated with the user id from step 1
   *  5. Call commitTransaction() function that commits the transaction.
   *  6. Call closeConnection() to finish.
   *  7. Call reloadLeaderboard()
  */
  submitAnswer(questionIndex, questionId) {
    const domain = 'SDK Demo';
    const query = 'Get User Id';
    const params = {'@username': this.userIdentity['id']};

    const data = [];

    this._cinchyService.executeQuery(domain, query, params)
      .subscribe( response => {
        const result = response.queryResult;
        result.moveToNextRow();
        const userId = result.getCellValue('Cinchy Id');

        this.openConnectionForAnswerTransaction(this.currentAnswer, questionIndex, questionId, userId);
      });
  }

  // opens a connection for submitting an answer
  openConnectionForAnswerTransaction(answer, questionIndex, questionId, userId) {
    this._cinchyService.openConnection()
    .subscribe(
      response => {
        console.log('Opened Connection');
        this.beginTransaction(answer, questionIndex, questionId, userId, response.connectionId);
    });
  }

  // begins a transaction on the connection for submitting the answer
  beginTransaction(answer, questionIndex, questionId, userId, connectionId) {
    this._cinchyService.beginTransaction(connectionId)
    .subscribe (
      response => {
        console.log('Began Transaction');
        this.sendAnswer(answer, questionIndex, questionId, userId, connectionId, response.transactionId);
    });
  }

  // sends the answer based on the connectionid
  sendAnswer(answer, questionIndex, questionId, userId, connectionId, transactionId) {
    const domain = 'SDK Demo';
    const queryAnswer = 'Insert Answer';
    const paramsAnswer = {
      '@answer': this.currentAnswer,
      '@questionid': '[Cinchy Id]' + questionId,
      '@userid': '[Cinchy Id]' + userId,
      'connectionid': connectionId,
      'transactionid': transactionId // deprecated
    };

    // Executing the Insert Answer Query
    this._cinchyService.executeQuery(domain, queryAnswer, paramsAnswer)
      .subscribe(
        // if success, commit transaction
        resp => {
          console.log('Sent Answer Transaction');
          this.commitTransaction(connectionId, transactionId);
          this.fetchAndLoadAnswers(questionIndex, questionId);
          this.currentAnswer = '';
      },
        error => {
          console.log('Could not send answer.');
          console.log(error);
      }
    );
  }

  // commits a transaction
  commitTransaction(connectionId, transactionId) {
    this._cinchyService.commitTransaction(connectionId, transactionId)
    .subscribe( response => {
        console.log('Committed Transaction');
        this.closeConnection(connectionId);
    });
  }

  // rollsback a transaction
  rollbackTransaction(connectionId, transactionId ) {
    this._cinchyService.rollbackTransaction(connectionId, transactionId)
    .subscribe( response => {
      console.log('Rolled Back Transaction');
      this.closeConnection(connectionId);
    });
  }

  // closes the conmection
  closeConnection(connectionId) {
    this._cinchyService.closeConnection(connectionId)
    .subscribe (
      response => {
        console.log('Connection Closed');
        console.log(connectionId);
        this.reloadLeaderboard();
    });
  }

  // reloads the leaderboard... needs to be done after submitting an answer
  reloadLeaderboard() {
    const domain = 'SDK Demo';
    const query = 'Get Leaderboard';
    const params = null;

    this._cinchyService.executeQuery(domain, query, params)
      .subscribe(
        response => {
          this.loadLeaderboard(response);
        }
      );
  }

  // fetches groups and just logs it
  logGetGroupsCurrentUserBelongsTo() {
    this._cinchyService.getGroupsCurrentUserBelongsTo()
    .subscribe(
      response => {
        console.log('Groups Current User Belongs to:');
        console.log(response);
    });
  }
}
