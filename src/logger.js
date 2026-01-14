/**
 * 日志工具模块
 * 提供结构化日志记录和可观测性功能
 */

/**
 * 日志级别
 */
export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

/**
 * 日志记录器
 */
export class Logger {
  constructor(context = {}) {
    this.context = context;
    this.startTime = Date.now();
  }

  /**
   * 格式化日志消息
   */
  formatLog(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const duration = Date.now() - this.startTime;

    return {
      timestamp,
      level,
      message,
      duration_ms: duration,
      ...this.context,
      ...data
    };
  }

  /**
   * 输出日志
   */
  log(level, message, data = {}) {
    const logData = this.formatLog(level, message, data);
    const logString = JSON.stringify(logData);

    switch (level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
      default:
        console.log(logString);
    }
  }

  debug(message, data = {}) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message, data = {}) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message, data = {}) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message, data = {}) {
    this.log(LogLevel.ERROR, message, data);
  }
}
