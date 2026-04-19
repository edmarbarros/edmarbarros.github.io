export type MonthStr = string; // 'YYYY-MM' or 'present'

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function parseMonth(m: MonthStr): { year: number; month0: number } {
  if (m === 'present') {
    const now = new Date();
    return { year: now.getFullYear(), month0: now.getMonth() };
  }
  const [y, mo] = m.split('-').map(Number);
  if (!y || !mo) throw new Error(`Invalid month string: ${m}`);
  return { year: y, month0: mo - 1 };
}

export function formatMonth(m: MonthStr, lang: 'en' | 'pt'): string {
  if (m === 'present') return lang === 'en' ? 'Present' : 'Presente';
  const { year, month0 } = parseMonth(m);
  const names = lang === 'en' ? MONTHS_EN : MONTHS_PT;
  return `${names[month0]} ${year}`;
}

export function formatPeriod(start: MonthStr, end: MonthStr, lang: 'en' | 'pt'): string {
  return `${formatMonth(start, lang)} – ${formatMonth(end, lang)}`;
}

function diffInclusiveMonths(start: MonthStr, end: MonthStr): number {
  const s = parseMonth(start);
  const e = parseMonth(end);
  const total = (e.year - s.year) * 12 + (e.month0 - s.month0) + 1;
  return total < 0 ? 0 : total;
}

export function formatDuration(start: MonthStr, end: MonthStr, lang: 'en' | 'pt'): string {
  const total = diffInclusiveMonths(start, end);
  const years = Math.floor(total / 12);
  const months = total % 12;
  const parts: string[] = [];
  if (lang === 'en') {
    if (years > 0) parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
    if (months > 0 || years === 0) parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`);
  } else {
    if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
    if (months > 0 || years === 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
  }
  return parts.join(' ');
}

export function companyRange<T extends { startMonth: MonthStr; endMonth: MonthStr }>(
  roles: T[],
): { start: MonthStr; end: MonthStr } {
  if (roles.length === 0) throw new Error('companyRange: empty roles array');
  const rank = (m: MonthStr): number => {
    if (m === 'present') return Number.POSITIVE_INFINITY;
    const { year, month0 } = parseMonth(m);
    return year * 12 + month0;
  };
  let earliest = roles[0]!;
  let latest = roles[0]!;
  for (const r of roles) {
    if (rank(r.startMonth) < rank(earliest.startMonth)) earliest = r;
    if (rank(r.endMonth) > rank(latest.endMonth)) latest = r;
  }
  return { start: earliest.startMonth, end: latest.endMonth };
}
