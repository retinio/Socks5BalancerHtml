export interface I18NTableType {
    [key: string]: { s: string, f?: CallableFunction },

    formatDurationFunction: { s: string, f: (time: number) => string },
    emptyFilterFunction: { s: string, f: (s: string) => string },
    emptyFilterPingFunction: { s: string, f: (s: string) => string },
}
