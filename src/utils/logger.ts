// Safe logging utility that redacts sensitive data

type LogData = Record<string, any> | any;

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'session',
  'email',
  'access_token',
  'refresh_token',
  'api_key',
  'secret',
  'auth',
  'authorization',
];

class Logger {
  private static sanitize(data: LogData): LogData {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some(field => lowerKey.includes(field));

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  static log(message: string, data?: LogData): void {
    if (__DEV__) {
      if (data) {
        console.log(message, this.sanitize(data));
      } else {
        console.log(message);
      }
    }
  }

  static info(message: string, data?: LogData): void {
    if (__DEV__) {
      if (data) {
        console.info(message, this.sanitize(data));
      } else {
        console.info(message);
      }
    }
  }

  static warn(message: string, data?: LogData): void {
    if (data) {
      console.warn(message, this.sanitize(data));
    } else {
      console.warn(message);
    }
  }

  static error(message: string, error?: any): void {
    if (error) {
      // Sanitize error objects
      const sanitizedError = this.sanitize(error);
      console.error(message, sanitizedError);
    } else {
      console.error(message);
    }
  }

  static debug(message: string, data?: LogData): void {
    if (__DEV__) {
      if (data) {
        console.debug(message, this.sanitize(data));
      } else {
        console.debug(message);
      }
    }
  }
}

export default Logger;
