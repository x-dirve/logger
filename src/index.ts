import { copy, extend, isString, date, isArray, labelReplace, isUndefined, isObject } from "@x-drive/utils";

/**已存在的全局 Logger 实例 */
const LoggerSubjects = new Map<string, Logger>();

interface ILoggerStyles {
    gray: string;
    bule: string;
    bold: string;
    lighter: string;
    orange: string;
    green:string;
    [name:string]: string;
}

interface ILoggerConfig {
    /**显示样式 */
    style: ILoggerStyles;

    /**业务类型 */
    app:string;

    /**头信息排列顺序 */
    headSequence: Array<keyof ILoggerHeadInfoTypes>;

    /**是否显示时间 */
    showDate:boolean;

    /**显示模版 */
    tpls: Partial<ILoggerHeadInfoTpls>;

    /**时间显示格式 */
    dateFormat: string;
}

/**Group 标题设置 */
interface IGroupTitleConfig {
    /**Group 标题 */
    text:string;

    /**是否折叠 */
    collapsed:true | false;
}

/**日志基础头信息样式 */
type ILoggerHeadInfoTypes = {
    /**日志业务样式 */
    app: string | string[];

    /**日志模块样式 */
    module: string | string[];

    /**日志操作样式 */
    action: string | string[];

    /**日志日期样式 */
    date: string | string[];
}

type ILoggerHeadInfoTpls = {
    /**日志业务模版 */
    app: string;

    /**日志模块模版 */
    module: string;

    /**日志操作模版 */
    action: string;

    /**日志日期模版 */
    date: string;
}

const DEF_LOGGER_STYLES: ILoggerStyles = {
    "gray": "color: gray;"
    , "bule": "color: #03A9F4;"
    , "bold": "font-weight: bold;"
    , "lighter": "font-weight: lighter;"
    , "orange": "color: #ff5722"
    , "green": "color: #8bc34a"
    , "violet": "color: #ff22ff"
};

/**默认头部信息样式 */
const DEF_LOGGER_HEAD_INFO_STYLE: ILoggerHeadInfoTypes = {
    "app": "bule"
    , "module": ["bold", "green"]
    , "action": ["gray", "lighter"]
    , "date": ["gray", "lighter"]
}

/**头部信息排列顺序 */
const DEF_HEAD_SEQUENCE = ["date", "app", "module", "action"];

/**默认头部信息类型模板 */
const DEF_HEAD_TYPE_TPLS: ILoggerHeadInfoTpls = {
    "app": "%c{app}"
    , "module": "%c{module}"
    , "action": "%c@[{action}]"
    , "date": "%c{date}"
}

/**日志 */
class Logger {

    /**显示样式设置 */
    private style: ILoggerStyles = copy(DEF_LOGGER_STYLES);

    /**头部内容样式 */
    private headStyles: ILoggerHeadInfoTypes = copy(DEF_LOGGER_HEAD_INFO_STYLE);

    /**头部内容模版设置镀锡 */
    private headTypeTpls = copy(DEF_HEAD_TYPE_TPLS);

    /**固定的头部内容模版 */
    private headTpl:string;

    /**头部内容类型数组 */
    private headTplTypes: string[] = [];

    /**日志归属业务 */
    private app:string = "";

    /**日志归属模块 */
    private module:string;

    /**日志归属的行为 */
    private action:string[] = [];

    /**子模块 */
    private subLogger = new Map<string, Logger>();

    /**时间显示格式 */
    private dateFormat: string = "i:s.M";

    /**
     * 日志
     * @param type   日志归属模块
     * @param config 日志模块配置
     */
    constructor(type?: string, config: Partial<ILoggerConfig> = {}) {
        type = isString(type) ? type : "";
        this.processConfig(type, config);
    }

    private processConfig(type:string, config: Partial<ILoggerConfig>) {
        this.module = type;

        const {
            style
            , app
            , headSequence = copy(DEF_HEAD_SEQUENCE)
            , showDate = true
            , dateFormat
        } = config;

        if (style) {
            this.style = extend(this.style, style);
        }

        if (isString(app)) {
            this.app = app;
        } else if (isUndefined(app)) {
            this.app = type;
        }

        if (isObject(config.tpls)) {
            this.headTypeTpls = extend(
                this.headTypeTpls
                , config.tpls
            );
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
            .reduce(
                (tpl, type) => {
                    this.headTplTypes.push(type);
                    return `${tpl} ${this.headTypeTpls[type] || ""}`;
                }
                , ""
            );
    }

    /**获取时间 */
    private getTime() {
        return date(new Date, this.dateFormat);
    }

    /**构建显示样式 */
    private buildStyle(styles:string[]): Array<string> {
        if (!isArray(styles) || styles.length === 0) {
            return [];
        }
        return styles.map(type => {
                        const style = this.headStyles[type];
                        if (isString(style)) {
                            return this.style[style] || style;
                        }
                        if (isArray(style)) {
                            return style.map((mType: string) => this.style[mType] || mType).join("");
                        }
                        return type;
                    });
    }

    /**构建显示内容 */
    private build(contents:any[], withStyle:boolean = true) {
        var tpl = this.headTpl;
        const headData = {
            "date": this.getTime()
            ,"app": this.app
            , "module": this.module
            , "action": ""
        }
        const headStyle = copy(this.headTplTypes);

        if (this.action && this.action.length) {
            headData.action = this.action.join(" > ");
            this.action = [];
            tpl = `${tpl} ${this.headTypeTpls.action}`;
            headStyle.push("action");

            if (!withStyle) {
                // 不带样式的要把标识去掉
                tpl = tpl.replace(/(%c)/g, "");
            }
        }

        var result = [
            labelReplace(tpl, headData)
        ];
        if (withStyle) {
            result = result.concat(this.buildStyle(headStyle))
        }
        result = result.concat(contents);

        return result;
    }

    /**
     * 获取当前 Logger 的子 Logger
     * @param type 子 Logger 名称
     * @param config 子 Logger 配置
     */
    getLogger(type: string = "global", config?: Partial<ILoggerConfig>) {
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
    at(action:string) {
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
    info(...val: any[]) {
        if (isArray(val) && val.length) {
            console.log.apply(
                console
                , this.build(val)
            );
        }
    }

    /**info 的别名 */
    log(...val: any[]) {
        this.info.apply(this, val);
    }

    /**警告日志 */
    warn(...val: any[]) {
        console.warn.apply(
            console
            , this.build(val, false)
        );
    }

    /**错误日志 */
    error(...val: any[]) {
        console.error.apply(
            console
            , this.build(val, false)
        );
    }

    /**显示当前执行的代码在堆栈中的调用路径 */
    trace(...val: any[]) {
        console.trace.apply(
            console
            , this.build(val)
        );
    }

    /**
     * 信息分组日志
     * @param title 群组标题
     * @param args  打印的内容
     * @example
    ```ts
    // 默认是折叠方式
    Logger.group("Group...", {"b": 2});
    // 展开 Group
    PagesLoger.at("getData").group(
        {
            "text": "Group Done!"
            ,"collapsed": false
        }
        , "anything..."
        , {"e": 4}
    );
    ```
     */
    group(title: IGroupTitleConfig, ...args: any[]):void
    group(title: string, ...args: any[]):void
    group(title, ...args) {
        if (isString(title)) {
            (title as IGroupTitleConfig) = {
                "text": title
                ,"collapsed": true
            };
        }

        const { collapsed = true, text} = title;

        console[
            collapsed ? "groupCollapsed" : "group"
        ].apply(
            console
            , this.build([text])
        );

        args.forEach(arg => {
            if (isArray(arg) || isObject(arg)) {
                console.dir(arg);
            } else {
                console.log(arg);
            }
        });

        console.groupEnd();
    }

    /**输出一个表格 */
    table(...args: any[]) {
        if (!isArray(args) || !args.length) {
            return;
        }
        const title = args.length > 1 && isString(args[0]) && args[0] || "";
        console.group.apply(
            console
            , this.build([title])
        );
        console.table.apply(console, title ? args.slice(1) : args);
        console.groupEnd();
    }
}

export { Logger };

/**
 * 获取一个全局性质的 Logger
 * @param type Logger 名称
 * @param config Logger 配置
 */
function getLogger(type:string, config?:Partial<ILoggerConfig>) {
    if (!isString(type)) {
        throw(
            new Error("需要指定 Logger 的类型")
        );
    }
    if (LoggerSubjects.has(type)) {
        return LoggerSubjects.get(type);
    }
    const typeLogger = new Logger(type, config);
    LoggerSubjects.set(type, typeLogger);
    return typeLogger;
}

export default getLogger;