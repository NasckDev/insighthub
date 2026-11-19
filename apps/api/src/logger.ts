/** Minimal structured logger (JSON lines on stdout/stderr). Swap for pino in production. */
function write(level: 'info' | 'warn' | 'error', message: string, detail?: unknown): void {
  const entry: Record<string, unknown> = { level, time: new Date().toISOString(), message };
  if (detail instanceof Error) entry.error = { name: detail.name, message: detail.message };
  else if (detail !== undefined) entry.detail = detail;
  const line = `${JSON.stringify(entry)}\n`;
  if (level === 'error') process.stderr.write(line);
  else process.stdout.write(line);
}

export const logger = {
  info: (message: string, detail?: unknown) => write('info', message, detail),
  warn: (message: string, detail?: unknown) => write('warn', message, detail),
  error: (message: string, detail?: unknown) => write('error', message, detail),
};
