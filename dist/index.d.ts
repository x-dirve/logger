interface ILoggerStyles {
    gray: string;
    bule: string;
    bold: string;
    lighter: string;
    orange: string;
    green: string;
    [name: string]: string;
}
interface ILoggerConfig {
    /**显示样式 */
    style: ILoggerStyles;
    /**业务类型 */
    app: string;
    /**头信息排列顺序 */
    headSequence: Array<keyof ILoggerHeadInfoTypes>;
    /**是否显示时间 */
    showDate: boolean;
    /**显示模版 */
    tpls: Partial<ILoggerHeadInfoTpls>;
    /**时间显示格式 */
    dateFormat: string;
}
/**Group 标题设置 */
interface IGroupTitleConfig {
    /**Group 标题 */
    text: string;
    /**是否折叠 */
    collapsed: true | false;
}
/**日志基础头信息样式 */
declare type ILoggerHeadInfoTypes = {
    /**日志业务样式 */
    app: string | string[];
    /**日志模块样式 */
    module: string | string[];
    /**日志操作样式 */
    action: string | string[];
    /**日志日期样式 */
    date: string | string[];
};
declare type ILoggerHeadInfoTpls = {
    /**日志业务模版 */
    app: string;
    /**日志模块模版 */
    module: string;
    /**日志操作模版 */
    action: string;
    /**日志日期模版 */
    date: string;
};
/**日志 */
declare class Logger {
    /**显示样式设置 */
    private style;
    /**头部内容样式 */
    private headStyles;
    /**头部内容模版设置镀锡 */
    private headTypeTpls;
    /**固定的头部内容模版 */
    private headTpl;
    /**头部内容类型数组 */
    private headTplTypes;
    /**日志归属业务 */
    private app;
    /**日志归属模块 */
    private module;
    /**日志归属的行为 */
    private action;
    /**子模块 */
    private subLogger;
    /**时间显示格式 */
    private dateFormat;
    /**
     * 日志
     * @param type   日志归属模块
     * @param config 日志模块配置
     */
    constructor(type?: string, config?: Partial<ILoggerConfig>);
    private processConfig;
    /**获取时间 */
    private getTime;
    /**构建显示样式 */
    private buildStyle;
    /**构建显示内容 */
    private build;
    /**
     * 获取当前 Logger 的子 Logger
     * @param type 子 Logger 名称
     * @param config 子 Logger 配置
     */
    getLogger(type?: string, config?: Partial<ILoggerConfig>): Logger;
    /**
     * 增加操作行为记录
     * @param action 操作类型
     * @example
        ```ts
        Logger.at("getData").info("Done!");
        ```
     */
    at(action: string): this;
    /**
     * 普通日志
     * @param val 要打印的信息
     * @example
        ```ts
        Logger.info("Hello", { "a": 1});
        ```
     */
    info(...val: any[]): void;
    /**info 的别名 */
    log(...val: any[]): void;
    /**警告日志 */
    warn(...val: any[]): void;
    /**错误日志 */
    error(...val: any[]): void;
    /**显示当前执行的代码在堆栈中的调用路径 */
    trace(...val: any[]): void;
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
    group(title: IGroupTitleConfig, ...args: any[]): void;
    group(title: string, ...args: any[]): void;
    /**输出一个表格 */
    table(...args: any[]): void;
}
export { Logger };
/**
 * 获取一个全局性质的 Logger
 * @param type Logger 名称
 * @param config Logger 配置
 */
declare function getLogger(type: string, config?: Partial<ILoggerConfig>): Logger;
export default getLogger;
