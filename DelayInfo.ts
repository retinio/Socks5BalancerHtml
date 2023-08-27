/**
 * Socks5BalancerAsio : A Simple TCP Socket Balancer for balance Multi Socks5 Proxy Backend Powered by Boost.Asio
 * Copyright (C) <2020>  <Jeremie>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import moment from 'moment';
import 'moment/locale/zh-cn.js';
import Vue from 'vue';
import _ from "lodash";

import 'i18n-table/en-US';
import 'i18n-table/zh-CN';
import {I18NTableType, zhCN} from "./i18n-table/zh-CN";
import {enUS} from "./i18n-table/en-US";

import type {ServerStateType} from './boot'

import {ChartData, Chart, registerables, ChartItem} from "chart.js";

Chart.register(...registerables);

interface DelayInfoItem {
    delay: number,
    time: string,
}

export interface ServerBackendDelayInfo {
    BaseInfo: ServerStateType['pool']['upstream'][0];
    tcpPing: DelayInfoItem[],
    httpPing: DelayInfoItem[],
    relayFirstPing: DelayInfoItem[],
    PingInfoTotal: {
        tcpPing: number,
        httpPing: number,
        relayFirstPing: number,
        total: number,
    };
    startTime: string;
    runTime: number;
    nowTime: string;
}


let defaultBackendHost = "127.0.0.1";
let defaultBackendPort = 5010;


function getSearchParams(key: string) {
    var q = (new URL(document.location as unknown as string)).searchParams;
    return q.get(key);
}

function setSearchParams(key: string, value: string) {
    var newQ = (new URL(document.location as unknown as string)).searchParams;
    newQ.set(key, value);
    window.history.pushState(null, null as unknown as string, '?' + newQ.toString());
}

function tryGetBackendConfigFromServer() {
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
        app.flush();
    })
}

function getBackend() {
    var s = getSearchParams('backend');
    if (s) {
        return s;
    } else {
        // setSearchParams('backend', defaultBackendHost + ':' + defaultBackendPort);
        return defaultBackendHost + ':' + defaultBackendPort;
    }
}

function serverTimeString2Moment(ts: string): moment.Moment {
    return moment(ts, [
        "YYYY.MM.DD-HH.mm.ss.SSS",
        "YYYY.MM.DD-HH.mm.ss.SS",
        "YYYY.MM.DD-HH.mm.ss.S",
    ], true);
}

const SelectableI18NLanguageTable = [
    ['zh-CN', '中文'],
    ['en-US', 'English']
];
const getI18nTable = (l: 'zh-CN' | 'en-US' | string | undefined = undefined) => {
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
    app && app.flushI18nTable();
    localStorage.setItem('selectedLanguageI18nTable', lang);
};
getI18nTable();
window.getI18nTable = getI18nTable;


console.log('start')

function makeChart(element: ChartItem, data: ChartData<'line'>) {
    return new Chart(
        element,
        {
            type: 'line',
            data: data,
            options: {
                maintainAspectRatio: false,
            },
        }
    );
}


class VueAppData {
    i18nTable: I18NTableType = {} as any;
    tableState = window.i18nTable;

    set nowLang(l: string) {
        getI18nTable(l as any);
        location.reload();
    }

    get nowLang() {
        const ls = localStorage.getItem('selectedLanguageI18nTable');
        const lang = ls || window.navigator.language;
        return lang;
    }

    SelectableI18NLanguageTable = SelectableI18NLanguageTable;


    tcpPingWastID = '';
    httpPingWastID = '';
    relayFirstPingWastID = '';
    totalWastID = '';

    startTimeID = '';
    runTimeID = '';
    nowTimeID = '';

    tcpPingC: any;
    httpPingC: any;
    relayFirstPingC: any;
}

class VueAppMethods {
    flush = () => {
        fetch('http://' + getBackend() + '/delayInfo?backendServerIndex=' + getSearchParams('backendServerIndex'), {
            credentials: 'omit'
        }).then((T) => {
            if (T.ok) {
                return T.json();
            }
            return Promise.reject(T);
        }).then((T: ServerBackendDelayInfo) => {
            // wash data
            T.tcpPing = T.tcpPing.map(N => {
                return {
                    time: N.time,
                    delay: _.parseInt(N.delay as unknown as string),
                };
            });
            T.httpPing = T.httpPing.map(N => {
                return {
                    time: N.time,
                    delay: _.parseInt(N.delay as unknown as string),
                };
            });
            T.relayFirstPing = T.relayFirstPing.map(N => {
                return {
                    time: N.time,
                    delay: _.parseInt(N.delay as unknown as string),
                };
            });
            T.runTime = _.parseInt(T.runTime as unknown as string);
            T.PingInfoTotal = {
                tcpPing: _.parseInt(T.PingInfoTotal.tcpPing as unknown as string),
                httpPing: _.parseInt(T.PingInfoTotal.httpPing as unknown as string),
                relayFirstPing: _.parseInt(T.PingInfoTotal.relayFirstPing as unknown as string),
                total: _.parseInt(T.PingInfoTotal.total as unknown as string),
            };
            // init chart
            app.tcpPingC = makeChart('tcpPingC', {
                labels: T.tcpPing.map(N => N.time),
                datasets: [{
                    label: 'tcpPing',
                    data: T.tcpPing.map(N => N.delay),
                    fill: false,
                }],
            });
            app.httpPingC = makeChart('httpPingC', {
                labels: T.httpPing.map(N => N.time),
                datasets: [{
                    label: 'httpPing',
                    data: T.httpPing.map(N => N.delay),
                    fill: false,
                }],
            });
            app.relayFirstPingC = makeChart('relayFirstPingC', {
                labels: T.relayFirstPing.map(N => N.time),
                datasets: [{
                    label: 'relayFirstPing',
                    data: T.relayFirstPing.map(N => N.delay),
                    fill: false,
                }],
            });
            // show info
            app.startTimeID = T.startTime;
            app.runTimeID = '' + T.runTime;
            app.nowTimeID = T.nowTime;
            app.tcpPingWastID = '' + T.PingInfoTotal.tcpPing + ' ' + window.i18nTable.timeMs.s;
            app.httpPingWastID = '' + T.PingInfoTotal.httpPing + ' ' + window.i18nTable.timeMs.s;
            app.relayFirstPingWastID = '' + T.PingInfoTotal.relayFirstPing + ' ' + window.i18nTable.timeMs.s;
            app.totalWastID = '' + T.PingInfoTotal.total + ' ' + window.i18nTable.timeMs.s;
        });
        // (c.canvas.parentNode as HTMLDivElement).style.height = '800px';
        // (c.canvas.parentNode as HTMLDivElement).style.width = 'calc(100% - 2rem)';

    };
    flushI18nTable = () => {
        console.log('flushI18nTable');
        app.$set(app.$data, 'i18nTable', window.i18nTable);
        console.log('i18nTable', app.$data.i18nTable);
        app.$forceUpdate();
    };
}

var app: Vue & VueAppData & VueAppMethods = new Vue({
    el: '#app',
    data: new VueAppData(),
    computed: {},
    methods: new VueAppMethods(),
});
app.flushI18nTable();
tryGetBackendConfigFromServer();

