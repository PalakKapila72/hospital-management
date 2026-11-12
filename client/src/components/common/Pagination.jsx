import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;

  const { page, pages, total } = pagination;

  return (
    <div className="pagination">
      <span>
        Showing Page <strong>{page}</strong> of <strong>{pages}</strong> ({total} total records)
      </span>
      <div className="pagination-controls">
        <button
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous Page"
        >
          <ChevronLeft size={15} /> Previous
        </button>
        <button
          className="btn btn-secondary btn-sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next Page"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};
