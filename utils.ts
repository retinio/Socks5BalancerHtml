import _ from "lodash";
import moment from "moment/moment";
import {zhCN} from "./i18n-table/zh-CN";
import {enUS} from "./i18n-table/en-US";
import {ServerStateType} from "./ServerStateType";

export let defaultBackendHost = "127.0.0.1";
export let defaultBackendPort = 5010;

export function formatInt(int: number) {
    if (int < 10) {
        return `0${int}`;
    }
    return `${int}`;
}

// export let formatDuration = function (time: number) {
//     const seconds = moment.duration(time).seconds();
//     const minutes = moment.duration(time).minutes();
//     const hours = moment.duration(time).hours();
//     const days = moment.duration(time).days();
//     const months = moment.duration(time).months();
//     const years = moment.duration(time).years();
//     if (years > 0) {
//         return `${years}Y-${months}M-${days}Day ${formatInt(hours)}h:${formatInt(minutes)}m:${formatInt(seconds)}s`;
//     }
//     if (months > 0) {
//         return `${months}M-${days}Day ${formatInt(hours)}h:${formatInt(minutes)}m:${formatInt(seconds)}s`;
//     }
//     if (days > 0) {
//         return `${days}Day ${formatInt(hours)}h:${formatInt(minutes)}m:${formatInt(seconds)}s`;
//     }
//     if (hours > 0) {
//         return `${formatInt(hours)}h:${formatInt(minutes)}m:${formatInt(seconds)}s`;
//     }
//     if (minutes > 0) {
//         return `${formatInt(minutes)}m:${formatInt(seconds)}s`;
//     }
//     return `00m:${formatInt(seconds)}s`;
// }

export function formatNumber2FixedLength(n: number) {
    return n.toFixed(3);
}

export function speed2String(s: number) {
    if (s < 1024) {
        return '' + s + 'Byte/s';
    } else if (s < Math.pow(1024, 2)) {
        return '' + formatNumber2FixedLength(s / Math.pow(1024, 1)) + 'KB/s';
    } else if (s < Math.pow(1024, 3)) {
        return '' + formatNumber2FixedLength(s / Math.pow(1024, 2)) + 'MB/s';
    } else if (s < Math.pow(1024, 4)) {
        return '' + formatNumber2FixedLength(s / Math.pow(1024, 3)) + 'GB/s';
    } else if (s < Math.pow(1024, 5)) {
        return '' + formatNumber2FixedLength(s / Math.pow(1024, 4)) + 'TB/s';
    } else if (s < Math.pow(1024, 6)) {
        return '' + formatNumber2FixedLength(s / Math.pow(1024, 5)) + 'EB/s';
    }
    // never go there
    return '';
}

export function dataCount2String(d: number) {
    if (d < 1024) {
        return '' + d + 'Byte';
    } else if (d < Math.pow(1024, 2)) {
        return '' + formatNumber2FixedLength(d / Math.pow(1024, 1)) + 'KB';
    } else if (d < Math.pow(1024, 3)) {
        return '' + formatNumber2FixedLength(d / Math.pow(1024, 2)) + 'MB';
    } else if (d < Math.pow(1024, 4)) {
        return '' + formatNumber2FixedLength(d / Math.pow(1024, 3)) + 'GB';
    } else if (d < Math.pow(1024, 5)) {
        return '' + formatNumber2FixedLength(d / Math.pow(1024, 4)) + 'TB';
    } else if (d < Math.pow(1024, 6)) {
        return '' + formatNumber2FixedLength(d / Math.pow(1024, 5)) + 'EB';
    }
    // never go there
    return '';
}

export function formatSpeedMax(u: ServerStateType['pool']['upstream'][0]) {
    if (u.byteInfo === 'true') {
        return '↑' + speed2String(_.parseInt(u.byteUpChangeMax)) + ' ↓' + speed2String(_.parseInt(u.byteDownChangeMax));
    } else {
        return '↑' + speed2String(0) + ' ↓' + speed2String(0);
    }
}

export function formatSpeed(u: ServerStateType['pool']['upstream'][0]) {
    if (u.byteInfo === 'true') {
        return '↑' + speed2String(_.parseInt(u.byteUpChange)) + ' ↓' + speed2String(_.parseInt(u.byteDownChange));
    } else {
        return '↑' + speed2String(0) + ' ↓' + speed2String(0);
    }
}

export function formatData(u: ServerStateType['pool']['upstream'][0]) {
    if (u.byteInfo === 'true') {
        return '↑' + dataCount2String(_.parseInt(u.byteUpLast)) + ' ↓' + dataCount2String(_.parseInt(u.byteDownLast));
    } else {
        return '↑' + dataCount2String(0) + ' ↓' + dataCount2String(0);
    }
}

export function reduceField<TType>(T: TType[], F: keyof TType) {
    return _.reduce(T, function (acc, n) {
        return acc + _.parseInt(_.get(n, F, "0"));
    }, 0);
}

export function getSearchParams(key: string) {
    var q = (new URL(document.location as unknown as string)).searchParams;
    return q.get(key);
}

export function setSearchParams(key: string, value: string) {
    var newQ = (new URL(document.location as unknown as string)).searchParams;
    newQ.set(key, value);
    window.history.pushState(null, null as unknown as string, '?' + newQ.toString());
}

export function tryGetBackendConfigFromServer<CallbackType extends (...args: any) => any>(
    callback?: CallableFunction
): (typeof callback extends CallbackType ? Promise<ReturnType<CallbackType>> : Promise<void>) {
    return fetch('backend', {
        credentials: 'omit'
    }).then(function (T) {
        if (T.ok) {
            return T.json();
        }
        return Promise.reject(T);
    }).then(function (T) {
        var s = getSearchParams('backend');
        console.log('getSearchParams(\'backend\'):', s);
        if (s) {
            setSearchParams('backend', s);
            return;
        } else {
            console.log('tryGetBackendConfigFromServer T:', T);
            var host = _.get(T, 'host', defaultBackendHost);
            var port = _.get(T, 'port', defaultBackendPort);
            if (!(_.isString(host) && host.length > 0)) {
                host = document.location.hostname;
            }
            if (_.isString(port)) {
                port = _.parseInt(port);
            }
            if (!(port > 0 && port < 65536)) {
                port = defaultBackendPort;
            }
            console.log('tryGetBackendConfigFromServer [host, port]:', [host, port]);
            setSearchParams('backend', host + ':' + port);
            return;
        }
    }).catch(function (e) {
        console.warn(e);
        var s = getSearchParams('backend');
        if (s) {
            setSearchParams('backend', s);
        } else {
            setSearchParams('backend', defaultBackendHost + ':' + defaultBackendPort);
        }
    }).then(function () {
        return callback && callback();
    })
}

export function getBackend() {
    var s = getSearchParams('backend');
    if (s) {
        return s;
    } else {
        // setSearchParams('backend', defaultBackendHost + ':' + defaultBackendPort);
        return defaultBackendHost + ':' + defaultBackendPort;
    }
}

export function setBackend(s: string) {
    setSearchParams('backend', s);
}

export function serverTimeString2Moment(ts: string): moment.Moment {
    return moment(ts, [
        "YYYY.MM.DD-HH.mm.ss.SSS",
        "YYYY.MM.DD-HH.mm.ss.SS",
        "YYYY.MM.DD-HH.mm.ss.S",
    ], true);
}


export const SelectableI18NLanguageTable = [
    ['zh-CN', '中文'],
    ['en-US', 'English']
];

export function getI18nTable<CallbackType extends (...args: any) => any>(
    callback: CallbackType | undefined = undefined,
    l: 'zh-CN' | 'en-US' | string | undefined = undefined
): (typeof callback extends CallbackType ? ReturnType<CallbackType> : void) {
    const ls = localStorage.getItem('selectedLanguageI18nTable');
    const lang = l || ls || window.navigator.language;
    if (lang === "zh-CN") {
        console.log('chinese');
        // chinese
        window.i18nTable = zhCN;
        moment.locale('zh-CN');
    } else if (lang === "en-US") {
        console.log('english');
        // english
        window.i18nTable = enUS;
        moment.locale('en-US');
    } else {
        console.log('none');
        // english
        window.i18nTable = enUS;
        moment.locale('en-US');
    }
    // formatDuration = window.i18nTable.formatDurationFunction.f as any;
    localStorage.setItem('selectedLanguageI18nTable', lang);
    return callback && callback();
}
