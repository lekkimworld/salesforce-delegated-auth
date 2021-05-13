enum LEVEL {
    TRACE,
    DEBUG,
    INFO,
    WARN,
    ERROR,
}
const LOG_LEVEL = ((): LEVEL => {
    const ll = process.env.LOG_LEVEL;
    if (ll) {
        switch (ll) {
            case "TRACE":
            case "0":
                return LEVEL.TRACE;
            case "DEBUG":
            case "1":
                return LEVEL.DEBUG;
            case "INFO":
            case "2":
                return LEVEL.INFO;
            case "WARN":
            case "3":
                return LEVEL.WARN;
            case "ERROR":
            case "4":
                return LEVEL.ERROR;
        }
    }
    return LEVEL.INFO;
})();
const isLoggable = (l: LEVEL) => {
    return l >= LOG_LEVEL;
};

export const log = (level: LEVEL, msg: string, err?: Error) => {
    if (isLoggable(level)) {
        const strlevelTemp = `     ${LEVEL[level]}`;
        const strLevel = strlevelTemp.substring(LEVEL[level].length);
        if (err) {
            console.log(`${strLevel} - ${msg}`, err);
        } else {
            console.log(`${strLevel} - ${msg}`);
        }
    }
};
export const error = (s: string, err?: Error) => {
    log(LEVEL.ERROR, s, err);
};
export const warn = (s: string, err?: Error) => {
    log(LEVEL.WARN, s, err);
};
export const info = (s: string) => {
    log(LEVEL.INFO, s);
};
export const debug = (s: string) => {
    log(LEVEL.DEBUG, s);
};
export const trace = (s: string) => {
    log(LEVEL.TRACE, s);
};
export default {
    info,
    trace,
    debug,
    warn,
    error,
};
