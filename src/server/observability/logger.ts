export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogRecord = {
  level: LogLevel;
  event: string;
  message: string;
  timestamp: string;
  requestId?: string;
  data?: Record<string, unknown>;
};

export type LoggerSink = {
  write: (record: LogRecord) => void;
};

export type Logger = {
  debug: (event: string, message: string, data?: Record<string, unknown>) => void;
  info: (event: string, message: string, data?: Record<string, unknown>) => void;
  warn: (event: string, message: string, data?: Record<string, unknown>) => void;
  error: (event: string, message: string, data?: Record<string, unknown>) => void;
};

export function createLogger(sink: LoggerSink = consoleLoggerSink): Logger {
  const write = (
    level: LogLevel,
    event: string,
    message: string,
    data?: Record<string, unknown>,
  ) => {
    sink.write({
      level,
      event,
      message,
      timestamp: new Date().toISOString(),
      requestId: typeof data?.requestId === "string" ? data.requestId : undefined,
      data,
    });
  };

  return {
    debug: (event, message, data) => write("debug", event, message, data),
    info: (event, message, data) => write("info", event, message, data),
    warn: (event, message, data) => write("warn", event, message, data),
    error: (event, message, data) => write("error", event, message, data),
  };
}

export const consoleLoggerSink: LoggerSink = {
  write(record) {
    if (record.level === "error") {
      console.error(record);
      return;
    }

    if (record.level === "warn") {
      console.warn(record);
      return;
    }

    console.info(record);
  },
};

export const logger = createLogger();
