const winston = require('winston');
require('winston-daily-rotate-file');

const transport = new winston.transports.DailyRotateFile({
    filename: 'logs/%DATE%.log',   // file name format
    datePattern: 'YYYY-MM-DD',     // creates file per day
    zippedArchive: false,
    maxSize: '20m',
    maxFiles: '14d'                // keep logs for 14 days
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`
        })
    ),
    transports: [
        transport,
        new winston.transports.Console() // optional
    ]
});

module.exports=logger;