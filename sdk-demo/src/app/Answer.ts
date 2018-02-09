export interface IAnswer {
    answer: string;
    answererName: string;
    answererUsername: string;
}

export class Answer implements IAnswer {
    constructor(public answer: string,
                public answererName: string,
                public answererUsername: string
    ) { }
}
