import type * as moment from 'moment';
import type * as _ from 'lodash';
import type {Vue as VueType} from 'vue/types/vue.d.ts';

export {};

export interface I18NTableType {
    [key: string]: { s: string, f?: CallableFunction },

    formatDurationFunction: { s: string, f: (time: number) => string },
    emptyFilterFunction: { s: string, f: (s: string) => string },
    emptyFilterPingFunction: { s: string, f: (s: string) => string },
}

declare global {
    const moment: typeof moment;
    // const Vue: any;
    const _: typeof _;

    interface Window {
        i18nTable: I18NTableType;
        i18n: {
            [key: string]: I18NTableType,
        };
        getI18nTable: (l: 'zh-CN' | 'en-US' | undefined) => void;
    }
}
