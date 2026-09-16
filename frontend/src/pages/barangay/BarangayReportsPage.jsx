import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const PAGE_SIZE = 10;
const STATUSES = ["Pending", "In Progress", "Closed"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const BarangayReportsPage = ({ resolvedOnly = false }) => {
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 1,
  });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(resolvedOnly ? "Resolved" : "all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      search: search || undefined,
    };
    setLoading(true);
    api
      .get("/reports", {
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
    page,
    priority,
    resolvedOnly,
    search,
    status,
    token,
    user?.barangay,
  ]);

  const isVisible = (report) =>
    resolvedOnly ? report.status === "Resolved" : report.status !== "Resolved";
  const updateFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };
  const resetFilters = () => {
    setSearch("");
    setStatus(resolvedOnly ? "Resolved" : "all");
    setPriority("all");
    setCategory("all");
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
      link.download = "barangay-reports.csv";
      link.click();
      URL.revokeObjectURL(url);
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
  const first = pagination.total
    ? (pagination.page - 1) * pagination.limit + 1
    : 0;
  const last = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      <section className={`rounded-2xl border p-4 shadow-xl ${panel}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.25em] ${muted}`}>
              {user.barangay} operational queue
            </p>
            <h1
              className={`mt-2 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Reports management
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
              <button
                type="button"
                onClick={() => updateFilter(setStatus, "all")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${status === "all" ? "bg-[#3b82f6] text-white" : isDark ? "bg-[#0a0b0f] text-gray-300" : "bg-slate-100 text-slate-700"}`}
              >
                All
              </button>
            )}
            {(resolvedOnly ? ["Resolved"] : ["Pending", "In Progress"]).map((item) => (
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
          <button
            type="button"
            onClick={resetFilters}
            title="Reset filters"
            aria-label="Reset filters"
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm xl:ml-auto"
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
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className={`rounded-xl border px-3 py-2.5 text-sm ${panel}`}>
            {reports.filter(isVisible).length} results
          </div>
          {[
            [search, `Search: ${search}`, () => updateFilter(setSearch, "")],
            [
              priority !== "all" && priority,
              priority,
              () => updateFilter(setPriority, "all"),
            ],
            [
              category !== "all" && category,
              category,
              () => updateFilter(setCategory, "all"),
            ],
          ]
            .filter(([value]) => value)
            .map(([value, label, remove]) => (
              <button
                type="button"
                key={label}
                onClick={remove}
                className="rounded-full bg-[#3b82f6]/10 px-2.5 py-1 text-xs text-[#60a5fa]"
              >
                {label} ×
              </button>
            ))}
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
                <tr>
                  <td colSpan="7" className={`p-10 text-center ${muted}`}>
                    Loading reports...
                  </td>
                </tr>
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
      <div className="flex items-center justify-between">
        <p className={`text-sm ${muted}`}>
          Showing {first}–{last} of {pagination.total} entries
        </p>
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="text-gray-400 disabled:opacity-40"
          >
            Previous
          </button>
          <span className={muted}>
            Page {page} of {Math.max(1, pagination.pages)}
          </span>
          <button
            type="button"
            disabled={page >= pagination.pages}
            onClick={() =>
              setPage((current) => Math.min(pagination.pages, current + 1))
            }
            className="text-gray-400 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarangayReportsPage;
