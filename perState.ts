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
import {ServerBackendDelayInfo, DelayInfoItem, ServerBackendDelayInfoOne} from './ServerBackendDelayInfo';
import {
    tryGetBackendConfigFromServer,
    serverTimeString2Moment,
    getBackend,
    getSearchParams,
    getI18nTable,
    SelectableI18NLanguageTable, setBackend
} from './utils';
import {ServerStateType} from "./ServerStateType";

function arrayOrEmpty<A>(a: (A[] | any)): A[] {
    return _.isArray(a) ? a : [];
}

getI18nTable(() => {
    app && app.flushI18nTable();
});
window.getI18nTable = getI18nTable.bind(undefined, () => {
    app && app.flushI18nTable();
});

type ClientIndexType = (ServerStateType['ClientIndex'][0] & { serverIndex?: string })[];
type ListenIndexType = (ServerStateType['ListenIndex'][0] & { serverIndex?: string })[];
type AuthIndexType = (ServerStateType['ListenIndex'][0] & { serverIndex?: string })[];
type DataRefType = (ClientIndexType | ListenIndexType | AuthIndexType);

class VueAppData {
    i18nTable: I18NTableType = {} as any;
    tableState = window.i18nTable;

    get backend() {
        return getBackend();
    };

    set backend(s) {
        setBackend(s);
    };

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


    get targetMode() {
        return getSearchParams('targetMode');
    };

    get target() {
        return getSearchParams('target');
    };

    ServerJsonInfo_Show = false;

    InternetState = {
        isOk: false,
        error: undefined,
    };

    ServerJsonInfo: ServerStateType | any = {};
    BaseInfo = {};
    UpstreamPool: ServerStateType['pool']['upstream'] = [];
    UpstreamIndex: ServerStateType['UpstreamIndex'] = [];
    ClientIndex: ClientIndexType = [];
    ListenIndex: ListenIndexType = [];
    AuthIndex: AuthIndexType = [];
    dataRef?: DataRefType = [];
    dataTable: {
        // header
        // server index,name
        h: { index: string, name: string, isWork: string, count: number }[],
        // footer
        f: [],
        // row
        r: DataRefType,
    } = {
        // header
        // server index,name
        h: [],
        // footer
        f: [],
        // row
        r: [],
    };
}

class VueAppMethods {
    flush = () => {
        const targetMode = app.$data.targetMode;
        let qPath = '';
        switch (targetMode) {
            case 'client':
                qPath = 'clientInfo';
                break;
            case 'listen':
                qPath = 'listenInfo';
                break;
            case 'auth':
                qPath = 'authInfo';
                break;
            default:
                app.InternetState.isOk = false;
                app.InternetState.error = undefined;
                return;
        }
        const target = app.$data.target;
        fetch('http://' + app.$data.backend + '/' + qPath + '?targetMode=' + targetMode + '&target=' + target, {
            credentials: 'omit'
        }).then(function (T) {
            if (T.ok) {
                return T.json();
            }
            return Promise.reject(T);
        }).then(function (T) {
            console.log(T);
            if (
                _.has(T, 'UpstreamPool') &&
                _.has(T, 'UpstreamIndex') &&
                (targetMode !== 'client' || _.has(T, 'ClientIndex')) &&
                (targetMode !== 'listen' || _.has(T, 'ListenIndex')) &&
                (targetMode !== 'auth' || _.has(T, 'AuthIndex')) &&
                _.has(T, 'BaseInfo') &&
                _.isObject(T.BaseInfo) &&
                _.isArray(T.UpstreamIndex) &&
                _.isArray(T.UpstreamPool)
            ) {
                app.ServerJsonInfo = T;

                app.BaseInfo = T.BaseInfo;
                app.UpstreamPool = arrayOrEmpty(T.UpstreamPool);
                app.UpstreamIndex = arrayOrEmpty(T.UpstreamIndex);
                app.ClientIndex = arrayOrEmpty(T.ClientIndex);
                app.ListenIndex = arrayOrEmpty(T.ListenIndex);
                app.AuthIndex = arrayOrEmpty(T.AuthIndex);

                app.dataRef = undefined;

                switch (targetMode) {
                    case 'client':
                        app.dataRef = app.ClientIndex;
                        break;
                    case 'listen':
                        app.dataRef = app.ListenIndex;
                        break;
                    case 'auth':
                        app.dataRef = app.AuthIndex;
                        break;
                    default:
                        break;
                }

                if (app.dataRef) {
                    // process data
                    app.dataTable = {
                        // header
                        // server index,name
                        h: app.UpstreamPool.map(T => {
                            return {
                                index: T.index as string,
                                name: T.name,
                                isWork: T.isWork,
                                count: app.dataRef!.reduce(function (acc, r, i) {
                                    if (T.index === r.serverIndex) {
                                        ++acc;
                                    }
                                    return acc;
                                }, 0)
                            };
                        }),
                        // footer
                        f: [],
                        // row
                        r: app.dataRef,
                    };

                }

                app.InternetState.isOk = true;
                app.InternetState.error = undefined;
            }
        }).then(function () {
            console.log(app);
        }).catch(function (e) {
            console.error(e);
            app.InternetState.isOk = false;
            app.InternetState.error = e;
        });
    };
    sendCommand = (cmd: string) => {
        fetch('http://' + app.$data.backend + cmd, {
            credentials: 'omit'
        }).then(function (T) {
            if (T.ok) {
                return T;
            }
            return Promise.reject(T);
        }).catch(function (e) {
            console.error(e);
        }).then(function () {
            app.flush();
        });
    };
    flushI18nTable = () => {
        console.log('flushI18nTable');
        app.$set(app.$data, 'i18nTable', window.i18nTable);
        console.log('i18nTable', app.$data.i18nTable);
        app.$forceUpdate();
    };
}


var app: Vue & VueAppData & VueAppMethods = new Vue({
    el: '#body',
    data: new VueAppData(),
    computed: {},
    methods: new VueAppMethods(),
});
app.flushI18nTable();
tryGetBackendConfigFromServer(() => {
    console.log('tryGetBackendConfigFromServer');
    return app.flush();
});

