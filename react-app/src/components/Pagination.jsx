import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = ''
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(validCurrentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (validCurrentPage > 3) pages.push('...');

      const start = Math.max(2, validCurrentPage - 1);
      const end = Math.min(totalPages - 1, validCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (validCurrentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/60 text-xs text-zinc-400 ${className}`}>
      {/* Left: Summary Info */}
      <div className="flex items-center gap-2 font-mono text-[11px]">
        <span>
          Hiển thị <span className="font-bold text-zinc-200">{startItem}</span> - <span className="font-bold text-zinc-200">{endItem}</span> trên tổng số <span className="font-bold text-violet-400">{totalItems}</span> mục
        </span>
      </div>

      {/* Right: Page Size & Navigation */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Page size dropdown */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                if (onPageChange) onPageChange(1);
              }}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-zinc-200 focus:outline-none focus:border-violet-500 font-mono cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page buttons */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={validCurrentPage === 1}
            title="Trang đầu"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Prev Page */}
          <button
            onClick={() => onPageChange(validCurrentPage - 1)}
            disabled={validCurrentPage === 1}
            title="Trang trước"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-zinc-600 font-mono text-[11px]">
                  ...
                </span>
              );
            }
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  validCurrentPage === p
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30 border border-violet-500/50'
                    : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {p}
              </button>
            );
          })}

          {/* Next Page */}
          <button
            onClick={() => onPageChange(validCurrentPage + 1)}
            disabled={validCurrentPage === totalPages || totalPages === 0}
            title="Trang sau"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={validCurrentPage === totalPages || totalPages === 0}
            title="Trang cuối"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
