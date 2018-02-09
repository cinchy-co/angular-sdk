export interface IPerson {
    name: string;
    username: string;
    score: number;
}

export class Person implements IPerson {
    constructor(public name: string,
                public username: string,
                public score: number
    ) { }
}
