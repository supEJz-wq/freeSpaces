import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, handlePageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) { start = Math.max(1, end - maxVisible + 1); }
    if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
    for (let i = start; i <= end; i++) { pages.push(i); }
    if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8 mb-4">
      <button 
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2.5 rounded-xl bg-white/70 backdrop-blur-lg border border-white/50 text-purple-600 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <ChevronLeft size={18} />
      </button>

      {getPageNumbers().map((page, index) => (
        <button 
          key={index}
          onClick={() => typeof page === 'number' && handlePageChange(page)}
          disabled={page === '...'}
          className={`w-10 h-10 rounded-xl font-medium text-sm transition-all shadow-sm ${
            currentPage === page 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-110' 
              : 'bg-white/70 backdrop-blur-lg border border-white/50 text-purple-700 hover:bg-purple-100'
          }`}
        >
          {page}
        </button>
      ))}

      <button 
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2.5 rounded-xl bg-white/70 backdrop-blur-lg border border-white/50 text-purple-600 hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;