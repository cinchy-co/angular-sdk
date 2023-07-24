export interface CinchyLiteralTranslation {
    translation: string;
    language: string;
    region: string;
    defaultText: boolean;
}

export interface CinchyLiteralDictionary {
    [guid: string]: CinchyLiteralTranslation;
}