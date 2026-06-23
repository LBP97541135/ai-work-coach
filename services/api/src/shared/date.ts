/**
 * 获取指定时区的本地日期（YYYY-MM-DD 格式）
 * 所有业务日期必须通过此函数获取，禁止使用 new Date().toISOString().split('T')[0]
 */
export function getLocalDate(timezone: string = 'Asia/Shanghai', now: Date = new Date()): string {
  // 使用 Intl.DateTimeFormat 获取指定时区的日期
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA locale 输出格式为 YYYY-MM-DD
  return formatter.format(now);
}

/**
 * 获取指定时区的本地日期时间（ISO 格式）
 */
export function getLocalDateTime(timezone: string = 'Asia/Shanghai', now: Date = new Date()): string {
  const date = getLocalDate(timezone, now);
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const time = timeFormatter.format(now);
  // 转换为 ISO 格式
  return `${date}T${time}`;
}

/**
 * 获取当前 ISO 时间戳
 */
export function nowISO(): string {
  return new Date().toISOString();
}
