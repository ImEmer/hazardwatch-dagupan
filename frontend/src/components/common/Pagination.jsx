import React from 'react';

const pageNumbers = (pages, page) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const start = page <= 2 ? 2 : page >= pages - 1 ? pages - 2 : page - 1;
  const end = page <= 2 ? 3 : page >= pages - 1 ? pages - 1 : page + 1;
  return [1, ...(start > 2 ? ['…'] : []), ...Array.from({ length: end - start + 1 }, (_, index) => start + index), ...(end < pages - 1 ? ['…'] : []), pages];
};

const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, isDark = false, showSummary = true }) => {
  const pages = Math.max(1, Number(totalPages) || 1);
  const page = Math.min(pages, Math.max(1, Number(currentPage) || 1));
  const total = Math.max(0, Number(totalItems) || 0);
  const perPage = Math.max(1, Number(itemsPerPage) || 1);
  const first = total ? (page - 1) * perPage + 1 : 0;
  const last = Math.min(page * perPage, total);
  const muted = isDark ? 'text-gray-400' : 'text-slate-500';
  const button = isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900';

  return (
    <footer className={showSummary ? 'mt-4 flex flex-col items-center gap-3 px-1 py-3 sm:flex-row sm:justify-between' : 'sticky bottom-0 z-10 mt-0 flex w-full items-center justify-center gap-3 border-t bg-inherit px-1 py-3'}>
      {showSummary && <p className={`text-sm ${muted}`}>Showing {first}-{last} of {total} entries</p>}
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        {page > 1 && <button type="button" onClick={() => onPageChange(page - 1)} className={button}>Previous</button>}
        {pageNumbers(pages, page).map((value, index) => value === '…'
          ? <span key={`ellipsis-${index}`} className="text-gray-500" aria-hidden="true">…</span>
          : <button type="button" key={value} aria-current={page === value ? 'page' : undefined} onClick={() => onPageChange(value)} className={page === value ? 'font-bold text-[#3b82f6]' : button}>{value}</button>)}
        {page < pages && <button type="button" onClick={() => onPageChange(page + 1)} className={button}>Next</button>}
      </div>
      {showSummary && <p className={`text-xs ${muted}`}>{total} total entries</p>}
    </footer>
  );
};

export default Pagination;
