import { copy, isString, extend, isUndefined, isObject, date, isArray, labelReplace } from '@x-drive/utils';

/**已存在的全局 Logger 实例 */
const LoggerSubjects = new Map();
const DEF_LOGGER_STYLES = {
    "gray": "color: gray;",
    "bule": "color: #03A9F4;",
    "bold": "font-weight: bold;",
    "lighter": "font-weight: lighter;",
    "orange": "color: #ff5722",
    "green": "color: #8bc34a",
    "violet": "color: #ff22ff"
};
/**默认头部信息样式 */
const DEF_LOGGER_HEAD_INFO_STYLE = {
    "app": "bule",
    "module": ["bold", "green"],
    "action": ["gray", "lighter"],
    "date": ["gray", "lighter"]
};
/**头部信息排列顺序 */
const DEF_HEAD_SEQUENCE = ["date", "app", "module", "action"];
/**默认头部信息类型模板 */
const DEF_HEAD_TYPE_TPLS = {
    "app": "%c{app}",
    "module": "%c{module}",
    "action": "%c@[{action}]",
    "date": "%c{date}"
};
/**日志 */
class Logger {
    /**
     * 日志
     * @param type   日志归属模块
     * @param config 日志模块配置
     */
    constructor(type, config = {}) {
        /**显示样式设置 */
        this.style = copy(DEF_LOGGER_STYLES);
        /**头部内容样式 */
        this.headStyles = copy(DEF_LOGGER_HEAD_INFO_STYLE);
        /**头部内容模版设置镀锡 */
        this.headTypeTpls = copy(DEF_HEAD_TYPE_TPLS);
        /**头部内容类型数组 */
        this.headTplTypes = [];
        /**日志归属业务 */
        this.app = "";
        /**日志归属的行为 */
        this.action = [];
        /**子模块 */
        this.subLogger = new Map();
        /**时间显示格式 */
        this.dateFormat = "i:s.M";
        type = isString(type) ? type : "";
        this.processConfig(type, config);
    }
    processConfig(type, config) {
        this.module = type;
        const { style, app, headSequence = copy(DEF_HEAD_SEQUENCE), showDate = true, dateFormat } = config;
        if (style) {
            this.style = extend(this.style, style);
        }
        if (isString(app)) {
            this.app = app;
        }
        else if (isUndefined(app)) {
            this.app = type;
        }
        if (isObject(config.tpls)) {
            this.headTypeTpls = extend(this.headTypeTpls, config.tpls);
        }
        const showHeadTypes = [];
        if (this.app) {
            showHeadTypes.push("app");
        }
        if (showDate) {
            showHeadTypes.push("date");
        }
        if (this.module !== this.app) {
            showHeadTypes.push("module");
        }
        if (isString(dateFormat)) {
            this.dateFormat = dateFormat;
        }
        // "%c{date} %c{app} %c{module} %c@{action}"
        this.headTpl = showHeadTypes
            .sort((now, next) => headSequence.indexOf(now) - headSequence.indexOf(next))
            .reduce((tpl, type) => {
            this.headTplTypes.push(type);
            return `${tpl} ${this.headTypeTpls[type] || ""}`;
        }, "");
    }
    /**获取时间 */
    getTime() {
        return date(new Date, this.dateFormat);
    }
    /**构建显示样式 */
    buildStyle(styles) {
        if (!isArray(styles) || styles.length === 0) {
            return [];
        }
        return styles.map(type => {
            const style = this.headStyles[type];
            if (isString(style)) {
                return this.style[style] || style;
            }
            if (isArray(style)) {
                return style.map((mType) => this.style[mType] || mType).join("");
            }
            return type;
        });
    }
    /**构建显示内容 */
    build(contents, withStyle = true) {
        var tpl = this.headTpl;
        const headData = {
            "date": this.getTime(),
            "app": this.app,
            "module": this.module,
            "action": ""
        };
        const headStyle = copy(this.headTplTypes);
        if (this.action && this.action.length) {
            headData.action = this.action.join(" > ");
            this.action = [];
            tpl = `${tpl} ${this.headTypeTpls.action}`;
            headStyle.push("action");
        }
        if (!withStyle) {
            // 不带样式的要把标识去掉
            tpl = tpl.replace(/(%c)/g, "");
        }
        var result = [
            labelReplace(tpl, headData)
        ];
        if (withStyle) {
            result = result.concat(this.buildStyle(headStyle));
        }
        result = result.concat(contents);
        return result;
    }
    /**
     * 获取当前 Logger 的子 Logger
     * @param type 子 Logger 名称
     * @param config 子 Logger 配置
     */
    getLogger(type = "global", config) {
        if (this.subLogger.has(type)) {
            return this.subLogger.get(type);
        }
        config = config || {};
        config.app = this.module;
        const typeLogger = new Logger(type, config);
        this.subLogger.set(type, typeLogger);
        return typeLogger;
    }
    /**
     * 增加操作行为记录
     * @param action 操作类型
     * @example
        ```ts
        Logger.at("getData").info("Done!");
        ```
     */
    at(action) {
        if (isString(action)) {
            this.action.push(action);
        }
        return this;
    }
    /**
     * 普通日志
     * @param val 要打印的信息
     * @example
        ```ts
        Logger.info("Hello", { "a": 1});
        ```
     */
    info(...val) {
        if (isArray(val) && val.length) {
            console.log.apply(console, this.build(val));
        }
    }
    /**info 的别名 */
    log(...val) {
        this.info.apply(this, val);
    }
    /**警告日志 */
    warn(...val) {
        console.warn.apply(console, this.build(val, false));
    }
    /**错误日志 */
    error(...val) {
        console.error.apply(console, this.build(val, false));
    }
    /**显示当前执行的代码在堆栈中的调用路径 */
    trace(...val) {
        console.trace.apply(console, this.build(val));
    }
    group(title, ...args) {
        if (isString(title)) {
            title = {
                "text": title,
                "collapsed": true
            };
        }
        const { collapsed = true, text } = title;
        console[collapsed ? "groupCollapsed" : "group"].apply(console, this.build([text]));
        args.forEach(arg => {
            if (isArray(arg) || isObject(arg)) {
                console.dir(arg);
            }
            else {
                console.log(arg);
            }
        });
        console.groupEnd();
    }
    /**输出一个表格 */
    table(...args) {
        if (!isArray(args) || !args.length) {
            return;
        }
        const title = args.length > 1 && isString(args[0]) && args[0] || "";
        console.group.apply(console, this.build([title]));
        console.table.apply(console, title ? args.slice(1) : args);
        console.groupEnd();
    }
}
/**
 * 获取一个全局性质的 Logger
 * @param type Logger 名称
 * @param config Logger 配置
 */
function getLogger(type, config) {
    if (!isString(type)) {
        throw (new Error("需要指定 Logger 的类型"));
    }
    if (LoggerSubjects.has(type)) {
        return LoggerSubjects.get(type);
    }
    const typeLogger = new Logger(type, config);
    LoggerSubjects.set(type, typeLogger);
    return typeLogger;
}

export default getLogger;
export { Logger };
//# sourceMappingURL=index.esm.js.map
