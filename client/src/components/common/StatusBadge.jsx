import React from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  CreditCard,
} from 'lucide-react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = String(status).toLowerCase().trim();

  let badgeClass = 'badge-noshow';
  let Icon = HelpCircle;
  let label = status;

  switch (normalized) {
    case 'scheduled':
    case 'active':
      badgeClass = 'badge-scheduled';
      Icon = Calendar;
      break;
    case 'completed':
    case 'paid':
    case 'settled':
      badgeClass = 'badge-completed';
      Icon = CheckCircle2;
      break;
    case 'cancelled':
    case 'unpaid':
    case 'archived':
    case 'failed':
      badgeClass = 'badge-cancelled';
      Icon = XCircle;
      break;
    case 'partial':
    case 'pending':
    case 'in-progress':
      badgeClass = 'badge-partial';
      Icon = Clock;
      break;
    case 'no-show':
    case 'no_show':
      badgeClass = 'badge-noshow';
      Icon = AlertCircle;
      label = 'No Show';
      break;
    default:
      badgeClass = 'badge-noshow';
      Icon = HelpCircle;
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <Icon size={12} />
      <span>{label}</span>
    </span>
  );
};
