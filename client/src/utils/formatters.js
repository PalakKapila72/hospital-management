export const formatCurrency = (amount) => {
  const num = parseFloat(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (timeStr) => {
  if (!timeStr) return '—';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'scheduled':
      return 'badge-scheduled';
    case 'completed':
      return 'badge-completed';
    case 'cancelled':
      return 'badge-cancelled';
    case 'no-show':
      return 'badge-noshow';
    case 'paid':
      return 'badge-paid';
    case 'partially paid':
      return 'badge-partial';
    case 'unpaid':
      return 'badge-unpaid';
    default:
      return '';
  }
};
