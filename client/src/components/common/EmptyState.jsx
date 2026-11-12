import React from 'react';
import { FileQuestion } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = FileQuestion,
  title = 'No records found',
  description = 'There is currently no data to display in this view.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="state-empty">
      <div className="state-empty-icon">
        <Icon size={28} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button
          className="btn btn-primary btn-sm"
          onClick={onAction}
          style={{ marginTop: '1.25rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
