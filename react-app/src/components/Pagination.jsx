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
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-white text-xs text-slate-500 ${className}`}>
      {/* Left: Summary Info */}
      <div className="flex items-center gap-2 font-mono text-[11px]">
        <span>
          Hiển thị <span className="font-bold text-slate-800">{startItem}</span> - <span className="font-bold text-slate-800">{endItem}</span> trên tổng số <span className="font-bold text-indigo-600">{totalItems}</span> mục
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
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer shadow-xs"
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
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Prev Page */}
          <button
            onClick={() => onPageChange(validCurrentPage - 1)}
            disabled={validCurrentPage === 1}
            title="Trang trước"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1 text-slate-400 font-mono text-[11px]">
                  ...
                </span>
              );
            }
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer shadow-xs ${
                  validCurrentPage === p
                    ? 'bg-indigo-600 text-white shadow-sm border border-indigo-600'
                    : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={validCurrentPage === totalPages || totalPages === 0}
            title="Trang cuối"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
