/**
 * Formats a UTC or ISO timestamp string into Indian Standard Time (IST, GMT+5:30).
 */
export function formatToIST(
  dateStr: string | null | undefined,
  includeDate = false
): string {
  if (!dateStr) return '-';
  const cleanStr =
    dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  const d = new Date(cleanStr);
  if (isNaN(d.getTime())) return dateStr;

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  };

  if (includeDate) {
    options.day = '2-digit';
    options.month = 'short';
  }

  return new Intl.DateTimeFormat('en-IN', options).format(d);
}

export function formatFullIST(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const cleanStr =
    dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  const d = new Date(cleanStr);
  if (isNaN(d.getTime())) return dateStr;

  return (
    new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d) + ' IST'
  );
}