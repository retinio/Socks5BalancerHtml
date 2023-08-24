export class TextCache {
    cachePool = new Map<string, string>()

    constructor(
        public baseFilePath: string,
        public translateFilePath: string,
    ) {
    }
}


/**
 * build [translationsStringLineCache, translationsLineStringCache] for TranslationStringCache
 * @param {string[]} translations - An array of strings in translation file format (with EN and translated values on alternate lines)
 * @returns {[Map<string, number>, Map<number, string>]} - The translated cache [translationsStringLineCache, translationsLineStringCache]
 */
function TranslationStringCachePreBuild(translations: string[]): [Map<string, number>, Map<number, string>] {
    let translationsStringLineCache = new Map();
    let translationsLineStringCache = new Map();
    translations.forEach((T, i) => {
        translationsStringLineCache.set(T, i);
        translationsLineStringCache.set(i, T);
    })
    return [translationsStringLineCache, translationsLineStringCache];
}

/**
 * Translates a string to another language from the array,
 * the translation is always the one right after the english line
 * this is the cache mode of TranslationString
 * @param {string} S - The original english string to translate
 * @param {Map<string, number>} translationsStringLineCache - The active translation dictionary <string, stringLine>
 * @param {Map<number, string>} translationsLineStringCache - The active translation dictionary <stringLine, string>
 * @returns {string} - The translated string
 */
function TranslationStringCache(S: string, translationsStringLineCache: Map<string, number>, translationsLineStringCache: Map<number, string>): string {
    if (S != null) {
        let S1 = S.trim();
        if (S1 !== "") {
            try {
                let l = translationsStringLineCache.get(S1);
                if (l) {
                    // the translation is always the one right after the english line
                    let s = translationsLineStringCache.get(l + 1);
                    if (s) {
                        return s;
                    }
                    console.warn('TranslationStringCache lost translationsLineStringCache:', S, l);
                }
                return S;
            } catch (e) {
                // ignore
                console.warn('TranslationStringCache catch:', S, translationsStringLineCache.get(S1), e);
            }
        }
    }
    return S;
}
