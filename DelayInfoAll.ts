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
import {I18NTableType} from './I18NTableType';
import {
    ServerBackendDelayInfo,
    DelayInfoItem,
    ServerBackendDelayInfoOne,
    ServerBackendDelayInfoAll
} from './ServerBackendDelayInfo';
import {
    tryGetBackendConfigFromServer,
    serverTimeString2Moment,
    getBackend,
    getSearchParams,
    getI18nTable,
    SelectableI18NLanguageTable
} from './utils';

import {ChartData, Chart, registerables, ChartItem} from "chart.js";
import 'chartjs-adapter-moment';
import {CartesianScaleTypeRegistry, LogarithmicScaleOptions, TimeScaleOptions} from "chart.js/dist/types";

Chart.register(...registerables);

getI18nTable(() => {
    app && app.flushI18nTable();
});
window.getI18nTable = getI18nTable.bind(undefined, () => {
    app && app.flushI18nTable();
});


console.log('start')

function makeChartTimeBase(element: ChartItem, data: ChartData<'line'>, logarithmic: boolean = false) {
    return new Chart(
        element,
        {
            type: 'line',
            data: data,
            options: {
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: {
                        // https://www.chartjs.org/docs/latest/axes/cartesian/time.html#display-formats
                        // https://stackoverflow.com/questions/73576685/chartjs-moment-and-chartjs-time-format-parsing
                        type: 'time',
                        options: {
                            adapters: {
                                date: moment,
                            },
                        },
                        time: {
                            unit: 'second',
                            displayFormats: {
                                second: 'YYYY.MM.DD-HH.mm.ss',
                                millisecond: 'YYYY.MM.DD-HH.mm.ss.SSS',
                            },
                        },
                    } as any as TimeScaleOptions,
                    y: logarithmic ? ({
                        type: 'logarithmic',
                        bounds: 'ticks'
                    } as any as LogarithmicScaleOptions) : {},
                },
            },
        }
    );
}

function makeChart(element: ChartItem, data: ChartData<'line'>) {
    return new Chart(
        element,
        {
            type: 'line',
            data: data,
            options: {
                maintainAspectRatio: false,
                animation: false,
            },
        }
    );
}


class VueAppData {
    i18nTable: I18NTableType = {} as any;
    tableState = window.i18nTable;

    set nowLang(l: string) {
        getI18nTable(() => {
            app && app.flushI18nTable();
        }, l as any);
        location.reload();
    }

    get nowLang() {
        const ls = localStorage.getItem('selectedLanguageI18nTable');
        const lang = ls || window.navigator.language;
        return lang;
    }

    SelectableI18NLanguageTable = SelectableI18NLanguageTable;

    totalWastID = '';

    startTimeID = '';
    runTimeID = '';
    nowTimeID = '';

    tcpPingC?: ReturnType<typeof makeChart>;
    httpPingC?: ReturnType<typeof makeChart>;
    relayFirstPingC?: ReturnType<typeof makeChart>;
}

class VueAppMethods {
    flush = () => {
        fetch('http://' + getBackend() + '/delayInfo', {
            credentials: 'omit'
        }).then((T) => {
            if (T.ok) {
                return T.json();
            }
            return Promise.reject(T);
        }).then((T: ServerBackendDelayInfoAll) => {
            // wash data
            // T.PingInfoTotal = {
            //     tcpPing: _.parseInt(T.PingInfoTotal.tcpPing as unknown as string),
            //     httpPing: _.parseInt(T.PingInfoTotal.httpPing as unknown as string),
            //     relayFirstPing: _.parseInt(T.PingInfoTotal.relayFirstPing as unknown as string),
            //     total: _.parseInt(T.PingInfoTotal.total as unknown as string),
            // };
            // init chart
            const createDatasets = (AAA: keyof Pick<ServerBackendDelayInfo, 'tcpPing' | 'httpPing' | 'relayFirstPing'>) => {
                return T.pool.map(A => {
                    return {
                        label: `(${A.BaseInfo.index}) ${A.BaseInfo.name} [${A.BaseInfo.host}:${A.BaseInfo.port}]`,
                        data: (A[AAA] ? A[AAA]!.map(N => {
                            return {
                                x: serverTimeString2Moment(N.time) as any,
                                y: _.parseInt(N.delay as unknown as string),
                            };
                        }) : []) as ChartData<'line'>['datasets'][0]['data'],
                        fill: false,
                    } as ChartData<'line'>['datasets'][0];
                });
            };
            app.tcpPingC = makeChartTimeBase('tcpPingC', {
                datasets: createDatasets("tcpPing"),
            }, true);
            app.httpPingC = makeChartTimeBase('httpPingC', {
                datasets: createDatasets("httpPing"),
            }, true);
            app.relayFirstPingC = makeChartTimeBase('relayFirstPingC', {
                datasets: createDatasets("relayFirstPing"),
            }, true);
            // app.tcpPingWastID = '' + T.PingInfoTotal.tcpPing + ' ' + window.i18nTable.timeMs.s;
            // app.httpPingWastID = '' + T.PingInfoTotal.httpPing + ' ' + window.i18nTable.timeMs.s;
            // app.relayFirstPingWastID = '' + T.PingInfoTotal.relayFirstPing + ' ' + window.i18nTable.timeMs.s;


            app.totalWastID = '' + T.CollectWastTime + ' ' + window.i18nTable.timeMs.s;

            // show info
            app.startTimeID = T.startTime;
            T.runTime = _.parseInt(T.runTime as unknown as string);
            app.runTimeID = '' + T.runTime;
            app.nowTimeID = T.nowTime;
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
tryGetBackendConfigFromServer(() => {
    return app.flush();
});

