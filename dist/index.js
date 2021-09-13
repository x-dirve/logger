'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var utils = require('@x-drive/utils');

/**已存在的全局 Logger 实例 */
var LoggerSubjects = new Map();
var DEF_LOGGER_STYLES = {
    "gray": "color: gray;",
    "bule": "color: #03A9F4;",
    "bold": "font-weight: bold;",
    "lighter": "font-weight: lighter;",
    "orange": "color: #ff5722",
    "green": "color: #8bc34a",
    "violet": "color: #ff22ff"
};
/**默认头部信息样式 */
var DEF_LOGGER_HEAD_INFO_STYLE = {
    "app": "bule",
    "module": ["bold", "green"],
    "action": ["gray", "lighter"],
    "date": ["gray", "lighter"]
};
/**头部信息排列顺序 */
var DEF_HEAD_SEQUENCE = ["date", "app", "module", "action"];
/**默认头部信息类型模板 */
var DEF_HEAD_TYPE_TPLS = {
    "app": "%c{app}",
    "module": "%c{module}",
    "action": "%c@[{action}]",
    "date": "%c{date}"
};
/**日志 */
var Logger = function Logger(type, config) {
    if ( config === void 0 ) config = {};

    /**显示样式设置 */
    this.style = utils.copy(DEF_LOGGER_STYLES);
    /**头部内容样式 */
    this.headStyles = utils.copy(DEF_LOGGER_HEAD_INFO_STYLE);
    /**头部内容模版设置镀锡 */
    this.headTypeTpls = utils.copy(DEF_HEAD_TYPE_TPLS);
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
    type = utils.isString(type) ? type : "";
    this.processConfig(type, config);
};
Logger.prototype.processConfig = function processConfig (type, config) {
        var this$1 = this;

    this.module = type;
    var style = config.style;
        var app = config.app;
        var headSequence = config.headSequence; if ( headSequence === void 0 ) headSequence = utils.copy(DEF_HEAD_SEQUENCE);
        var showDate = config.showDate; if ( showDate === void 0 ) showDate = true;
        var dateFormat = config.dateFormat;
    if (style) {
        this.style = utils.extend(this.style, style);
    }
    if (utils.isString(app)) {
        this.app = app;
    }
    else if (utils.isUndefined(app)) {
        this.app = type;
    }
    if (utils.isObject(config.tpls)) {
        this.headTypeTpls = utils.extend(this.headTypeTpls, config.tpls);
    }
    var showHeadTypes = [];
    if (this.app) {
        showHeadTypes.push("app");
    }
    if (showDate) {
        showHeadTypes.push("date");
    }
    if (this.module !== this.app) {
        showHeadTypes.push("module");
    }
    if (utils.isString(dateFormat)) {
        this.dateFormat = dateFormat;
    }
    // "%c{date} %c{app} %c{module} %c@{action}"
    this.headTpl = showHeadTypes
        .sort(function (now, next) { return headSequence.indexOf(now) - headSequence.indexOf(next); })
        .reduce(function (tpl, type) {
        this$1.headTplTypes.push(type);
        return (tpl + " " + (this$1.headTypeTpls[type] || ""));
    }, "");
};
/**获取时间 */
Logger.prototype.getTime = function getTime () {
    return utils.date(new Date, this.dateFormat);
};
/**构建显示样式 */
Logger.prototype.buildStyle = function buildStyle (styles) {
        var this$1 = this;

    if (!utils.isArray(styles) || styles.length === 0) {
        return [];
    }
    return styles.map(function (type) {
        var style = this$1.headStyles[type];
        if (utils.isString(style)) {
            return this$1.style[style] || style;
        }
        if (utils.isArray(style)) {
            return style.map(function (mType) { return this$1.style[mType] || mType; }).join("");
        }
        return type;
    });
};
/**构建显示内容 */
Logger.prototype.build = function build (contents, withStyle) {
        if ( withStyle === void 0 ) withStyle = true;

    var tpl = this.headTpl;
    var headData = {
        "date": this.getTime(),
        "app": this.app,
        "module": this.module,
        "action": ""
    };
    var headStyle = utils.copy(this.headTplTypes);
    if (this.action && this.action.length) {
        headData.action = this.action.join(" > ");
        this.action = [];
        tpl = tpl + " " + (this.headTypeTpls.action);
        headStyle.push("action");
    }
    var result = [
        utils.labelReplace(tpl, headData)
    ];
    if (withStyle) {
        result = result.concat(this.buildStyle(headStyle));
    }
    result = result.concat(contents);
    return result;
};
/**
 * 获取当前 Logger 的子 Logger
 * @param type 子 Logger 名称
 * @param config 子 Logger 配置
 */
Logger.prototype.getLogger = function getLogger (type, config) {
        if ( type === void 0 ) type = "global";

    if (this.subLogger.has(type)) {
        return this.subLogger.get(type);
    }
    config = config || {};
    config.app = this.module;
    var typeLogger = new Logger(type, config);
    this.subLogger.set(type, typeLogger);
    return typeLogger;
};
/**
 * 增加操作行为记录
 * @param action 操作类型
 * @example
    ```ts
    Logger.at("getData").info("Done!");
    ```
 */
Logger.prototype.at = function at (action) {
    if (utils.isString(action)) {
        this.action.push(action);
    }
    return this;
};
/**
 * 普通日志
 * @param val 要打印的信息
 * @example
    ```ts
    Logger.info("Hello", { "a": 1});
    ```
 */
Logger.prototype.info = function info () {
        var val = [], len = arguments.length;
        while ( len-- ) val[ len ] = arguments[ len ];

    if (utils.isArray(val) && val.length) {
        console.log.apply(console, this.build(val));
    }
};
/**info 的别名 */
Logger.prototype.log = function log () {
        var val = [], len = arguments.length;
        while ( len-- ) val[ len ] = arguments[ len ];

    this.info.apply(this, val);
};
/**警告日志 */
Logger.prototype.warn = function warn () {
        var val = [], len = arguments.length;
        while ( len-- ) val[ len ] = arguments[ len ];

    console.warn.apply(console, this.build(val, false));
};
/**错误日志 */
Logger.prototype.error = function error () {
        var val = [], len = arguments.length;
        while ( len-- ) val[ len ] = arguments[ len ];

    console.error.apply(console, this.build(val, false));
};
/**显示当前执行的代码在堆栈中的调用路径 */
Logger.prototype.trace = function trace () {
        var val = [], len = arguments.length;
        while ( len-- ) val[ len ] = arguments[ len ];

    console.trace.apply(console, this.build(val));
};
Logger.prototype.group = function group (title) {
        var args = [], len = arguments.length - 1;
        while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];

    if (utils.isString(title)) {
        title = {
            "text": title,
            "collapsed": true
        };
    }
    var collapsed = title.collapsed; if ( collapsed === void 0 ) collapsed = true;
        var text = title.text;
    console[collapsed ? "groupCollapsed" : "group"].apply(console, this.build([text]));
    args.forEach(function (arg) {
        if (utils.isArray(arg) || utils.isObject(arg)) {
            console.dir(arg);
        }
        else {
            console.log(arg);
        }
    });
    console.groupEnd();
};
/**输出一个表格 */
Logger.prototype.table = function table () {
        var args = [], len = arguments.length;
        while ( len-- ) args[ len ] = arguments[ len ];

    if (!utils.isArray(args) || !args.length) {
        return;
    }
    var title = args.length > 1 && utils.isString(args[0]) && args[0] || "";
    console.group.apply(console, this.build([title]));
    console.table.apply(console, title ? args.slice(1) : args);
    console.groupEnd();
};
/**
 * 获取一个全局性质的 Logger
 * @param type Logger 名称
 * @param config Logger 配置
 */
function getLogger(type, config) {
    if (!utils.isString(type)) {
        throw (new Error("需要指定 Logger 的类型"));
    }
    if (LoggerSubjects.has(type)) {
        return LoggerSubjects.get(type);
    }
    var typeLogger = new Logger(type, config);
    LoggerSubjects.set(type, typeLogger);
    return typeLogger;
}

exports.Logger = Logger;
exports.default = getLogger;
//# sourceMappingURL=index.js.map
