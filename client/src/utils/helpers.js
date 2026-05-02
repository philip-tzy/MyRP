// Format date string (YYYY-MM-DD) → readable
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Days until a date (negative = overdue)
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Part type badge class
export function partTypeBadge(type) {
  if (type === 'Finished Good')  return 'badge-blue';
  if (type === 'Sub-Assembly')   return 'badge-amber';
  if (type === 'Raw Material')   return 'badge-green';
  return 'badge-gray';
}

// SO status badge class
export function soStatusBadge(status) {
  if (status === 'Confirmed') return 'badge-green';
  if (status === 'Shipped')   return 'badge-blue';
  if (status === 'Draft')     return 'badge-gray';
  if (status === 'Cancelled') return 'badge-red';
  return 'badge-gray';
}

// MRP suggestion status badge
export function suggStatusBadge(status) {
  if (status === 'Pending')   return 'badge-amber';
  if (status === 'Firm')      return 'badge-green';
  if (status === 'Cancelled') return 'badge-red';
  return 'badge-gray';
}

// Number format
export function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('id-ID');
}

// Generate SO number
export function genSoNumber() {
  const y = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 9000) + 1000);
  return `SO-${y}-${n}`;
}
