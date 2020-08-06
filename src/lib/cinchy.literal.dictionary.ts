export interface CinchyLiteralTranslation {
    translation: string;
    language: string;
    region: string;
    defaultText: boolean;
}

export interface CinchyLiteralDictionary {
    [guid: string]: CinchyLiteralTranslation;
}

export type QueryAcceptedTypes = "QUERY" | "DRAFT_QUERY" | "SCALAR" | "NONQUERY" | "VERSION_HISTORY_QUERY"
