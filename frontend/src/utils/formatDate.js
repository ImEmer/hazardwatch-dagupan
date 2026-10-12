export function formatDateTime(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return `${new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsedDate)} PHT`;
}
