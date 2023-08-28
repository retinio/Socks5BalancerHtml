import {ServerStateType} from "./ServerStateType";

export interface DelayInfoItem {
    delay: number,
    time: string,
}

export interface SystemTine {
    startTime: string;
    runTime: number;
    nowTime: string;
}

export interface ServerBackendDelayInfo {
    BaseInfo: ServerStateType['pool']['upstream'][0];
    tcpPing?: DelayInfoItem[],
    httpPing?: DelayInfoItem[],
    relayFirstPing?: DelayInfoItem[],
    PingInfoTotal: {
        tcpPing: number,
        httpPing: number,
        relayFirstPing: number,
        total: number,
    };
    PingSetting: {
        tcpPingMax: number,
        httpPingMax: number,
        relayFirstPingMax: number,
    };
}

export interface ServerBackendDelayInfoOne extends SystemTine, ServerBackendDelayInfo {
    CollectWastTime: number;
}

export interface ServerBackendDelayInfoAll extends SystemTine {
    pool: ServerBackendDelayInfo[];
    CollectWastTime: number;
}

