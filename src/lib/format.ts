const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatDisplayDate(isoDate: string) {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  const month = MONTH_NAMES[Number(m) - 1];
  if (!month) return isoDate;
  return `${month} ${Number(d)}, ${y}`;
}
