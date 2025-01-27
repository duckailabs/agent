import fs from "fs/promises";
import path from "path";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogHandler = (
  level: LogLevel,
  namespace: string,
  message: string,
  meta?: any
) => void;

export class Logger {
  private static logHandler: LogHandler | null = null;
  private static useStdout = false; // Default to false
  private static useFile = false;
  private static logFile: string | null = null;

  static async init(
    namespace: string,
    options: { useStdout?: boolean; useFile?: boolean } = {}
  ) {
    // Check environment variable for console output
    this.useStdout =
      process.env.LOG_TO_CONSOLE === "true" || options.useStdout === true;
    this.useFile = options.useFile ?? false;

    if (this.useFile) {
      const logsDir = path.resolve(process.cwd(), "logs");
      try {
        await fs.mkdir(logsDir, { recursive: true });
      } catch (error) {
        console.error("Failed to create logs directory:", error);
      }

      this.logFile = path.resolve(logsDir, `${namespace}.log`);
    }
  }

  static setLogHandler(handler: LogHandler) {
    this.logHandler = handler;
  }

  private static getColor(level: LogLevel): string {
    switch (level) {
      case "debug":
        return "\x1b[36m"; // Cyan
      case "info":
        return "\x1b[32m"; // Green
      case "warn":
        return "\x1b[33m"; // Yellow
      case "error":
        return "\x1b[31m"; // Red
      default:
        return "\x1b[0m"; // Reset
    }
  }

  private static async log(
    level: LogLevel,
    namespace: string,
    message: string,
    meta?: any
  ) {
    if (this.logHandler) {
      this.logHandler(level, namespace, message, meta);
      return;
    }

    const timestamp = new Date().toISOString();
    const color = this.getColor(level);
    const reset = "\x1b[0m";
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    const logLine = `[${timestamp}] [${level.toUpperCase()}] [${namespace}] ${message}${metaStr}`;
    const coloredLogLine = `${color}${logLine}${reset}`;

    // Write to stdout if enabled
    if (this.useStdout) {
      console.log(coloredLogLine);
    }

    // Write to file if enabled
    if (this.useFile && this.logFile) {
      try {
        await fs.appendFile(this.logFile, logLine + "\n");
      } catch (error) {
        console.error("Failed to write to log file:", error);
      }
    }
  }

  static async cleanup() {
    // Nothing to clean up in this simplified version
  }

  static debug(namespace: string, message: string, meta?: any) {
    this.log("debug", namespace, message, meta);
  }

  static info(namespace: string, message: string, meta?: any) {
    this.log("info", namespace, message, meta);
  }

  static warn(namespace: string, message: string, meta?: any) {
    this.log("warn", namespace, message, meta);
  }

  static error(namespace: string, message: string, meta?: any) {
    this.log("error", namespace, message, meta);
  }
}
