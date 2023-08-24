export type I18nTable<P> = { [key: string]: string };

export class TranslationCache<P> {
    constructor(
        public i18nTable: I18nTable<P>,
    ) {
    }
}