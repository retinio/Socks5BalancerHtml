import {ServerStateType} from "./ServerStateType";

export interface DelayInfoItem {
    delay: number,
    time: string,
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
    startTime: string;
    runTime: number;
    nowTime: string;
}

