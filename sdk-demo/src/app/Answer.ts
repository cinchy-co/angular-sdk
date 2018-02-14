import { SafeResourceUrl } from '@angular/platform-browser/src/security/dom_sanitization_service';

export interface IAnswer {
    answer: string;
    answererName: string;
    answererUsername: string;
    answererPhoto: SafeResourceUrl;
}

export class Answer implements IAnswer {
    public answererPhoto: SafeResourceUrl;

    constructor(public answer: string,
                public answererName: string,
                public answererUsername: string
    ) { }

    setPhoto(photo: SafeResourceUrl) {
        this.answererPhoto = photo;
    }
}
