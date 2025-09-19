import winston from 'winston';
import 'winston-daily-rotate-file';
import { config } from './config.js';
import path from 'path';
import fs from 'fs';

const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const transport = new winston.transports.DailyRotateFile({
  dirname: logDir,
  filename: '%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxFiles: '14d'
});

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [transport]
});

if (config.env !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    )
  }));
}

export function withRequest(logger, requestId) {
  return {
    info: (msg, meta) => logger.info(msg, { requestId, ...meta }),
    error: (msg, meta) => logger.error(msg, { requestId, ...meta }),
    warn: (msg, meta) => logger.warn(msg, { requestId, ...meta }),
    debug: (msg, meta) => logger.debug(msg, { requestId, ...meta }),
  };
}

export { logger };
