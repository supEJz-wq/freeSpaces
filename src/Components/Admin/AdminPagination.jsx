import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdminPagination = ({ currentPage, totalItems, pageSize, onPageChange, isDarkMode }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages && totalItems > 0;

  const btnBase = isDarkMode
    ? 'bg-white/10 text-white hover:bg-white/20'
    : 'bg-gray-100 text-gray-800 hover:bg-gray-200';

  return (
    <div className={`flex items-center justify-between p-4 border-t-2 ${isDarkMode ? 'border-white/10' : 'border-gray-300'}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${!canGoPrev ? 'opacity-40 cursor-not-allowed' : ''} ${btnBase}`}
      >
        <ChevronLeft size={18} /> Previous
      </button>

      <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Page {currentPage} of {totalPages} · {pageSize} per page
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${!canGoNext ? 'opacity-40 cursor-not-allowed' : ''} ${btnBase}`}
      >
        Next <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default AdminPagination;
