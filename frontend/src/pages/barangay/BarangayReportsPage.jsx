import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useTheme from "../../hooks/useTheme";
import api from "../../services/api";
import {
  HAZARD_CATEGORIES,
  HAZARD_CATEGORY_COLORS,
  STATUS_BADGES,
  STATUS_BADGES_LIGHT,
} from "../../services/reportOptions";
import { showError, showSuccess } from "../../services/alerts";
import Skeleton from "../../components/common/Skeleton";
import Pagination from "../../components/common/Pagination";
import useDebounce from "../../hooks/useDebounce";
import useVisibleReportPolling from "../../hooks/useVisibleReportPolling";
import { useSocket } from "../../context/SocketContext";

const PAGE_SIZE = 10;
const STATUSES = ["Pending", "In Progress", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const BarangayReportsPage = ({ resolvedOnly = false }) => {
  const { user, token } = useAuth();
  const { latestReport } = useSocket();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDark = theme === "dark";
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 1,
  });
  const [page, setPage] = useState(Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1));
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState(resolvedOnly ? "Resolved" : searchParams.get("status") || "all");
  const [priority, setPriority] = useState(searchParams.get("priority") || "all");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "createdAt");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sortOrder") === "asc" ? "asc" : "desc");
  const [searchFocused, setSearchFocused] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const filterChangeRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(resolvedOnly ? "Resolved" : searchParams.get("status") || "all");
  }, [resolvedOnly, searchParams]);

  useEffect(() => {
    if (!token || !user?.barangay) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    const params = {
      barangay: user.barangay,
      page,
      limit: PAGE_SIZE,
      includeResolved: resolvedOnly,
      status: resolvedOnly ? "Resolved" : status === "all" ? undefined : status,
      priority: priority === "all" ? undefined : priority,
      category: category === "all" ? undefined : category,
      q: debouncedSearch || undefined,
      sortBy,
      sortOrder,
    };
    setLoading(true);
    setError("");
    api
      .get("/reports/search", {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (cancelled) return;
        setReports(response.data?.reports || []);
        setPagination(
          response.data?.pagination || {
            page,
            limit: PAGE_SIZE,
            total: 0,
            pages: 1,
          },
        );
      })
      .catch((requestError) => {
        if (!cancelled)
          setError(
            requestError.response?.data?.message || "Unable to load reports.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    category,
    sortBy,
    sortOrder,
    page,
    priority,
    resolvedOnly,
    debouncedSearch,
    status,
    token,
    user?.barangay,
    reloadKey,
  ]);

  useVisibleReportPolling(() => setReloadKey((current) => current + 1), searchFocused || search !== debouncedSearch);

  useEffect(() => {
    if (
      latestReport?.barangay === user?.barangay
      && (!resolvedOnly || latestReport.status === "Resolved")
      && (status === "all" || latestReport.status === status)
      && (priority === "all" || latestReport.priority === priority)
      && (category === "all" || latestReport.category === category)
      && !searchFocused
      && search === debouncedSearch
    ) {
      setReloadKey((current) => current + 1);
    }
  }, [category, debouncedSearch, latestReport, priority, resolvedOnly, search, searchFocused, status, user?.barangay]);

  useEffect(() => {
    if (!filterChangeRef.current) {
      filterChangeRef.current = true;
      return;
    }
    setPage(1);
  }, [search, status, priority, category, sortBy, sortOrder]);

  useEffect(() => {
    const next = {};
    [["search", search], ["status", status], ["priority", priority], ["category", category]].forEach(([key, value]) => {
      if (value && value !== "all" && (!resolvedOnly || key !== "status")) next[key] = value;
    });
    if (page > 1) next.page = String(page);
    if (sortBy !== "createdAt") next.sortBy = sortBy;
    if (sortOrder !== "desc") next.sortOrder = sortOrder;
    setSearchParams(next, { replace: true });
  }, [search, status, priority, category, page, sortBy, sortOrder, resolvedOnly, setSearchParams]);

  const isVisible = (report) => {
    const isArchived = report.archived === true || report.status === "Closed";
    return resolvedOnly ? report.status === "Resolved" && !isArchived : !isArchived && !["Resolved", "Closed"].includes(report.status);
  };
  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };
  const resetFilters = () => {
    setSearch("");
    setStatus(resolvedOnly ? "Resolved" : "all");
    setPriority("all");
    setCategory("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };
  const exportCsv = async () => {
    try {
      const response = await api.get("/reports/export", {
        params: {
          barangay: user.barangay,
          includeResolved: resolvedOnly,
          status: resolvedOnly
            ? "Resolved"
            : status === "all"
              ? undefined
              : status,
          priority: priority === "all" ? undefined : priority,
          category: category === "all" ? undefined : category,
          search: search || undefined,
        },
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `barangay-reports-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      await showSuccess("Reports exported successfully.");
    } catch (requestError) {
      await showError(
        requestError.response?.data?.message || "Unable to export reports.",
      );
    }
  };
  const panel = isDark
    ? "border-[#2e303a] bg-[#14151d]"
    : "border-slate-200 bg-white";
  const field = `rounded-xl border px-3 py-2.5 text-sm focus:border-[#3b82f6] focus:outline-none ${isDark ? "border-[#2e303a] bg-[#0a0b0f] text-white" : "border-slate-200 bg-slate-50 text-slate-900"}`;
  const muted = isDark ? "text-gray-400" : "text-slate-500";

  return (
    <div className="space-y-6">
      <section className={`rounded-2xl border p-4 shadow-xl ${panel}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.25em] ${muted}`}>
              {user.barangay} {resolvedOnly ? "resolved queue" : "operational queue"}
            </p>
            <h1
              className={`mt-2 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {resolvedOnly ? "Resolved Cases" : "Reports management"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-[#3b82f6] px-3 py-2 text-sm font-medium text-[#60a5fa]"
            >
              Export CSV
            </button>
            {!resolvedOnly && (
              <button type="button"               onClick={() => navigate(`/barangay/reports/resolved${location.search}`)} className="inline-flex items-center gap-2 rounded-lg border border-emerald-500 px-3 py-2 text-sm font-medium text-emerald-500 hover:bg-emerald-500/10">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 2 2 4-4m5 2a9 9 0 11-18 0z" /><circle cx="12" cy="12" r="9" /></svg>
                Resolved Cases
              </button>
            )}
            {!resolvedOnly && (
              <button
                type="button"
                onClick={() => updateFilter(setStatus, "all")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${status === "all" ? "bg-[#3b82f6] text-white" : isDark ? "bg-[#0a0b0f] text-gray-300" : "bg-slate-100 text-slate-700"}`}
              >
                All
              </button>
            )}
            {!resolvedOnly && ["Pending", "In Progress"].map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => updateFilter(setStatus, item)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${status === item ? "bg-[#3b82f6] text-white" : isDark ? "bg-[#0a0b0f] text-gray-300" : "bg-slate-100 text-slate-700"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={search}
            onChange={(event) => updateFilter(setSearch, event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search report title, address, category..."
            className={field}
          />
          <select
            value={priority}
            onChange={(event) => updateFilter(setPriority, event.target.value)}
            className={field}
          >
            <option value="all">All priorities</option>
            {PRIORITIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(event) => updateFilter(setCategory, event.target.value)}
            className={field}
          >
            <option value="all">All categories</option>
            {HAZARD_CATEGORIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={user.barangay}
            disabled
            className={`${field} disabled:opacity-70`}
          >
            <option>{user.barangay}</option>
          </select>
          <select
            aria-label="Sort reports"
            value={`${sortBy}:${sortOrder}`}
            onChange={(event) => {
              const [nextSortBy, nextSortOrder] = event.target.value.split(":");
              setSortBy(nextSortBy);
              setSortOrder(nextSortOrder);
            }}
            className={field}
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="priority:desc">Priority high to low</option>
            <option value="priority:asc">Priority low to high</option>
            <option value="status:asc">Status A to Z</option>
            <option value="status:desc">Status Z to A</option>
          </select>
        </div>
        <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={resetFilters}
            title="Reset filters"
            aria-label="Reset filters"
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0011.9 2M18.5 9A7 7 0 006.6 7"
              />
            </svg>
            Reset Filters
          </button>
          <div className={`rounded-xl border px-3 py-2.5 text-sm ${panel}`}>
            {pagination.total} results
          </div>
        </div>
      </section>

      <section
        className={`overflow-hidden rounded-2xl border shadow-xl ${panel}`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[12%]" />
              <col className="w-[18%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[11%]" />
            </colgroup>
            <thead
              className={
                isDark
                  ? "bg-[#0a0b0f] text-gray-400"
                  : "bg-slate-100 text-slate-500"
              }
            >
              <tr>
                <th className="px-4 py-3">Report</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className={`border-t ${isDark ? "border-[#2e303a]" : "border-slate-200"}`}>
                    {Array.from({ length: 7 }).map((__, columnIndex) => <td key={columnIndex} className="px-4 py-4"><Skeleton className="h-5 w-3/4" /></td>)}
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-red-400">
                    {error}
                  </td>
                </tr>
              ) : !reports.filter(isVisible).length ? (
                <tr>
                  <td colSpan="7" className={`p-10 text-center ${muted}`}>
                    No matching reports found.
                  </td>
                </tr>
              ) : (
                reports.filter(isVisible).map((report) => (
                  <tr
                    key={report._id}
                    className={`border-t ${isDark ? "border-[#2e303a]" : "border-slate-200"}`}
                  >
                    <td className="px-4 py-4">
                      <p className={isDark ? "text-white" : "text-slate-900"}>
                        {report.title || `${report.category} report`}
                      </p>
                      <p className={`mt-1 text-xs ${muted}`}>
                        {report.reportedBy?.name || "Citizen report"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className="rounded-full px-2 py-1 text-xs text-white"
                        style={{
                          backgroundColor:
                            HAZARD_CATEGORY_COLORS[report.category] ||
                            "#6b7280",
                        }}
                      >
                        {report.category}
                      </span>
                    </td>
                    <td className={`max-w-0 truncate px-4 py-4 ${muted}`}>
                      {report.address || "Dagupan City"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${(isDark ? STATUS_BADGES : STATUS_BADGES_LIGHT)[report.status] || ""}`}>{report.status}</span>
                    </td>
                    <td className="px-4 py-4">{report.priority || "Medium"}</td>
                    <td className={`whitespace-nowrap px-4 py-4 ${muted}`}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/barangay/reports/${report._id}`}
                        state={{ from: resolvedOnly ? "resolved" : "reports", returnTo: `${location.pathname}${location.search}` }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#3b82f6] transition hover:bg-[#3b82f6]/10 hover:text-[#60a5fa]"
                        aria-label={`Open details for ${report.title || "report"}`}
                        title="Open details"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M10 14L21 3M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={setPage} isDark={isDark} />
    </div>
  );
};

export default BarangayReportsPage;
