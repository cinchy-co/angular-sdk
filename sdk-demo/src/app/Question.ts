import { IAnswer, Answer } from './Answer';

export interface IQuestion {
    id: number;
    question: string;
    askerName: string;
    askerUsername: string;
    location: string;
    showAnswers: boolean;
    showAnswersButtonLabel: string;
    answers: IAnswer[];
}

export class Question implements IQuestion {
    public showAnswersButtonLabel: string;
    public answers: IAnswer[];
    public askerBase64ProfilePic: string;

    constructor(public id: number,
                public question: string,
                public askerName: string,
                public askerUsername: string,
                public location: string,
                public showAnswers: boolean
    ) {
        this.setShowAnswersButtonLabel();
     }

    setAnswers(answers: IAnswer[]) {
        this.answers = answers;
    }

    toggleShowAnswers() {
        this.showAnswers = !this.showAnswers;
        this.setShowAnswersButtonLabel();
    }

    private setShowAnswersButtonLabel() {
        if (this.showAnswers) {
            this.showAnswersButtonLabel = 'Hide Answers';
        } else {
            this.showAnswersButtonLabel = 'Show Answers';
        }
    }
}
