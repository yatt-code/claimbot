import { createLogger, transports, format } from 'winston';

const logger = createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // Add file transports for production if needed
    // new transports.File({ filename: 'error.log', level: 'error' }),
    // new transports.File({ filename: 'combined.log' }),
  ],
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest })`
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.simple(),
  }));
}

interface AuditLogParams {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}

export async function auditLog({ userId, action, entity, entityId, details }: AuditLogParams) {
  logger.info('Audit Log', { userId, action, entity, entityId, details });
  // In a real application, you would save this to a database
  // For now, we'll just log it.
}

export default logger;