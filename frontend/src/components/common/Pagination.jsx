import React from 'react';

const pageNumbers = (pages, page) => pages <= 7
  ? Array.from({ length: pages }, (_, index) => index + 1)
  : [1, ...(page > 3 ? ['...'] : []), ...Array.from({ length: Math.min(pages - 1, page + 1) - Math.max(2, page - 1) + 1 }, (_, index) => Math.max(2, page - 1) + index), ...(page < pages - 2 ? ['...'] : []), pages];

const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, isDark = false }) => {
  const pages = Math.max(1, Number(totalPages) || 1);
  const page = Math.min(pages, Math.max(1, Number(currentPage) || 1));
  const total = Math.max(0, Number(totalItems) || 0);
  const perPage = Math.max(1, Number(itemsPerPage) || 1);
  const first = total ? (page - 1) * perPage + 1 : 0;
  const last = Math.min(page * perPage, total);
  const muted = isDark ? 'text-gray-400' : 'text-slate-500';
  const button = isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900';

  return (
    <footer className="mt-4 flex flex-col items-center gap-3 px-1 py-3 sm:flex-row sm:justify-between">
      <p className={`text-sm ${muted}`}>Showing {first}-{last} of {total} entries</p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)} className={`${button} disabled:cursor-not-allowed disabled:opacity-40`}>Previous</button>
        {pageNumbers(pages, page).map((value, index) => value === '...'
          ? <span key={`ellipsis-${index}`} className="text-gray-500">...</span>
          : <button type="button" key={value} onClick={() => onPageChange(value)} className={page === value ? 'font-bold text-[#3b82f6]' : button}>{value}</button>)}
        <button type="button" disabled={page >= pages} onClick={() => onPageChange(page + 1)} className={`${button} disabled:cursor-not-allowed disabled:opacity-40`}>Next</button>
      </div>
      <p className={`text-xs ${muted}`}>{total} total entries</p>
    </footer>
  );
};

export default Pagination;
