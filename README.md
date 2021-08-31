日志模块
==========

浏览器的 `console` 的表现方式较为基础，在项目开发中有时需要额外输出一些其他信息用于辅助定位问题。`@x-drive/logger` 支持简单的设置后即可在一个操作中额外显示附加的信息。

## 使用方式
1. 将本包添加到项目的开发依赖中 (以开发依赖为例)
    - 命令行方式
        ```shell
        #使用 npm
        npm install --save-dev @x-drive/logger @x-drive/utils

        #使用 yarn
        yarn add --dev @x-drive/logger @x-drive/utils
        ```
    - 直接修改 `package.json`
        ```json
        "devDependencies": {
            "@x-drive/logger": "1.1.0",
            "@x-drive/utils": "^1.1.12"
        }
        ```
1. 本包依赖 `@x-drive/utils`
1. 在项目中使用
    ```typescript
    import getLogger from "@x-drive/logger";
    const Logger = getLogger(`AwesomeApp(v1.0.0)`);

    Logger.info("Hello");
    ```

## 模块方法
- `getLogger` 获取当前 Logger 的子 Logger
    ```ts
    getLogger(type?: string, config?: Partial<ILoggerConfig>): Logger
    ```
    子 Logger 可以使日志的层级更为清晰，如上述例子 `AwesomeApp` 中我们要打印系统中 `PageA` 中信息：
    ```ts
    const PageALogger = Logger.getLogger("PageA");

    // PageA 将作为 AwesomeApp 的子模块显示
    PageALogger.info("Hello PageA");
    ```
- `at` 增加操作行为记录
    ```ts
    at(action: string): this;
    ```
    当希望区分当前的日志是什么行为操作的可用 `at` 方法
    ```ts
    Logger.at("getData").info("Done!");
    ```
    注意该方法会在调用任意输出方法之后被消费，多个 `at` 方法标记的行为最终将被合并显示。

- `info` 普通日志
    ```ts
    info(...val: any[]): void;
    ```
    以 log 的形式打印日志
    ```ts
    Logger.info("Hello", { "a": 1});
    ```
- `group` 群组日志
    ```ts
    group(title: IGroupTitleConfig, ...args: Array<any>): void;
    group(title: string, ...args: Array<any>): void;
    ```
    将传入的数据分组显示
    ```ts
    // 默认是折叠方式
    Logger.group("Group...", {"b": 2});
    // 展开 Group
    PageALoger.at("getData").group(
        {
            "text": "Group Done!"
            ,"collapsed": false
        }
        , "anything..."
        , {"e": 4}
    );
    ```
- `warn` 警告日志
    ```ts
    warn(...val: any[]): void;
    ```
- `error` 错误日志
    ```ts
    error(...val: any[]): void;
    ```
- `trace` 显示当前执行的代码在堆栈中的调用路径
    ```ts
    trace(...val: any[]): void;
    ```
- `table` 输出一个表格
    ```ts
    table(...val: any[]): void;
    ```
