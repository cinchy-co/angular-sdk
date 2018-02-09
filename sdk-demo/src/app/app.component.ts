import { Component } from '@angular/core';
import { CinchyConfig, CinchyService } from '@cinchy-co/angular-sdk';
import { IQuestion, Question } from './Question';
import { IPerson, Person } from './Person';
import { IAnswer, Answer } from './Answer';

export const MyCinchyAppConfig: CinchyConfig = {
  cinchyRootUrl: 'http://qa1-app1.cinchy.co',
  authority: 'http://qa1-sso.cinchy.co/CinchySSO/identity',
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
  answersTableEntitled = true;

  constructor(private _cinchyService: CinchyService) {
    this._cinchyService.login().then( response => {
      console.log(response);
      console.log('Logged In!');

      this.fetchAndLoadInitialData();

      this.logGetGroupsCurrentUserBelongsTo();
      this.logGetTableEntitlementsByName('SDK Demo', 'Questions');

      console.log(this._cinchyService.getUserIdentity());
    }).catch( error => {
      console.log(error);
    });
  }

  // Fetches Questions and Leaderboard data
  fetchAndLoadInitialData() {
    const savedQueriesToExecute = [
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

    this._cinchyService.executeMultipleJsonSavedQueries(savedQueriesToExecute)
      .subscribe(
        response => {
          this.loadQuestions(response[0]);
          this.loadLeaderboard(response[1]);
        },
        error => {
          console.log(error);
        }
      );
  }

  // Takes the response of Questions data and parses it and loads it
  loadQuestions(response) {
    const data = [];
    const result = response.jsonQueryResult;
      while (result.moveToNextRow()) {
        const this_row = {};
        for (const col of result.getColNames()) {
          this_row[col] = result.getCellValue(col);
        }
        data.push(new Question(this_row['QuestionId'],
                      this_row['Question'],
                      this_row['AskerName'],
                      this_row['AskerUsername'],
                      this_row['Location'],
                      false
            ));
      }
    this.questions = data;
  }

  // Takes the response of Leaderboard data and parses it and loads it
  loadLeaderboard(response) {
    const data = [];
    const result = response.jsonQueryResult;
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

    this._cinchyService.executeJsonSavedQuery(domain, query, params)
      .subscribe( response => {
        const result = response.jsonQueryResult;
        while (result.moveToNextRow()) {
          const this_row = {};
          for (const col of result.getColNames()) {
            this_row[col] = result.getCellValue(col);
          }
          data.push(new Answer(this_row['Answer'], this_row['Name'], this_row['Username']));
        }
        this.questions[questionIndex].setAnswers(data);
        this.questions[questionIndex].toggleShowAnswers();
      });
  }

  // Activated on "SUBMIT" button click
  // it starts a chain of function calls that open a connection, starts a transaction, submits an answer, commits, and closes the connection
  submitAnswer(questionIndex, questionId) {
    const domain = 'SDK Demo';
    const query = 'Get User Id';
    const params = {'@username': this._cinchyService.getUserIdentity()['id']};

    const data = [];

    this._cinchyService.executeJsonSavedQuery(domain, query, params)
      .subscribe( response => {
        const result = response.jsonQueryResult;
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
        this.sendAnswerTransaction(answer, questionIndex, questionId, userId, connectionId, response.transactionId);
    });
  }

  // sends the answer based on the connectionid
  sendAnswerTransaction(answer, questionIndex, questionId, userId, connectionId, transactionId) {
    const domain = 'SDK Demo';
    const queryAnswer = 'Insert Answer';
    const paramsAnswer = {
      '@answer': this.currentAnswer,
      '@questionid': '[Cinchy Id]' + questionId,
      '@userid': '[Cinchy Id]' + userId,
      '@connectionid': connectionId,
      '@transactionid': transactionId // deprecated
    };

    // Executing the Insert Answer Query
    this._cinchyService.executeJsonSavedQuery(domain, queryAnswer, paramsAnswer)
      .subscribe(
        // if success, commit transaction
        resp => {
          console.log('Sent Answer Transaction');
          this.commitTransaction(connectionId, transactionId);
          this.fetchAndLoadAnswers(questionIndex, questionId);
          this.currentAnswer = '';
      },
      // if error, check entitlements for answer table
        error => {
          console.log('Could not send answer.');
          console.log(error);
          console.log('Checking Answers table entitlements');

          this._cinchyService.getTableEntitlementsByName(domain, 'Answers')
          .subscribe(
            response => {
              console.log(response);
              if (!response['canAdRows']) {
                // binded to error message in html ui
                this.answersTableEntitled = false;
              }
          });
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

    this._cinchyService.executeJsonSavedQuery(domain, query, params)
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

  // fetches table entitlements and just logs it
  logGetTableEntitlementsByName(domainName: string, tableName: string) {
    this._cinchyService.getTableEntitlementsByName(domainName, tableName)
    .subscribe(
      response => {
        console.log('The table entitlements of ' + domainName + ': ' + tableName + ' is:');
        console.log(response);
    });
  }

}
