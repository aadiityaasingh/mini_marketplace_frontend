/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "stats";
  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  const isAdmin = user?.role === "admin";

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Please log in as an administrator.");
      navigate("/login");
    } else if (user && user.role !== "admin") {
      toast.error("Access denied. Administrator privileges required.");
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  // Tab 1: Platform Analytics States
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Tab 2: Users Management States
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [usersLoading, setUsersLoading] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);

  // Tab 3: Listings Moderation States
  const [listings, setListings] = useState([]);
  const [listingSearch, setListingSearch] = useState("");
  const [listingCategory, setListingCategory] = useState("all");
  const [listingStatus, setListingStatus] = useState("all");
  const [listingsLoading, setListingsLoading] = useState(false);
  const [actionListingId, setActionListingId] = useState(null);

  // Tab 4: Reported Products States
  const [reports, setReports] = useState([]);
  const [reportStatusFilter, setReportStatusFilter] = useState("pending");
  const [reportsLoading, setReportsLoading] = useState(false);
  const [actionReportId, setActionReportId] = useState(null);

  // Load Platform Stats
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api.get("/admin/stats");
      setStats(res.data.stats);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load platform stats.");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Load Users
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const params = {};
      if (userSearch.trim()) params.search = userSearch.trim();
      if (userRoleFilter !== "all") params.role = userRoleFilter;
      if (userStatusFilter !== "all") params.isBanned = userStatusFilter === "banned";

      const res = await api.get("/admin/users", { params });
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load users list.");
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch, userRoleFilter, userStatusFilter]);

  // Load Listings
  const loadListings = useCallback(async () => {
    try {
      setListingsLoading(true);
      const params = {};
      if (listingSearch.trim()) params.search = listingSearch.trim();
      if (listingCategory !== "all") params.category = listingCategory;
      if (listingStatus !== "all") params.status = listingStatus;

      const res = await api.get("/admin/listings", { params });
      setListings(res.data.products || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load listings.");
    } finally {
      setListingsLoading(false);
    }
  }, [listingSearch, listingCategory, listingStatus]);

  // Load Reports
  const loadReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      const params = {};
      if (reportStatusFilter !== "all") params.status = reportStatusFilter;

      const res = await api.get("/admin/reports", { params });
      setReports(res.data.reports || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load reports.");
    } finally {
      setReportsLoading(false);
    }
  }, [reportStatusFilter]);

  useEffect(() => {
    if (!isAdmin) return;

    if (currentTab === "stats") {
      loadStats();
    } else if (currentTab === "users") {
      loadUsers();
    } else if (currentTab === "listings") {
      loadListings();
    } else if (currentTab === "reports") {
      loadReports();
    }
  }, [currentTab, isAdmin, loadStats, loadUsers, loadListings, loadReports]);

  // User Actions
  const handleToggleRole = async (targetUser) => {
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    if (
      !window.confirm(
        `Are you sure you want to change ${targetUser.name}'s role to '${newRole}'?`
      )
    ) {
      return;
    }

    try {
      setActionUserId(targetUser.id);
      await api.patch(`/admin/users/${targetUser.id}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}.`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role.");
    } finally {
      setActionUserId(null);
    }
  };

  const handleToggleBan = async (targetUser) => {
    let reason = "";
    if (!targetUser.isBanned) {
      reason = window.prompt("Reason for account suspension (visible to user):");
      if (reason === null) return;
    } else {
      if (!window.confirm(`Unban and restore access for ${targetUser.name}?`)) return;
    }

    try {
      setActionUserId(targetUser.id);
      const res = await api.patch(`/admin/users/${targetUser.id}/ban`, {
        banReason: reason,
      });
      toast.info(res.data.message || "User status updated.");
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update ban status.");
    } finally {
      setActionUserId(null);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (
      !window.confirm(
        `WARNING: Permanently delete ${targetUser.name} and ALL their listings? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setActionUserId(targetUser.id);
      await api.delete(`/admin/users/${targetUser.id}`);
      toast.success("User and their listings deleted.");
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user.");
    } finally {
      setActionUserId(null);
    }
  };

  // Listing Moderation Actions
  const handleRemoveListing = async (productId) => {
    const reason = window.prompt(
      "Reason for removing this listing (sent to seller):",
      "Violates campus marketplace guidelines"
    );
    if (reason === null) return;

    try {
      setActionListingId(productId);
      const res = await api.patch(`/admin/listings/${productId}/remove`, { reason });
      toast.info(res.data.message || "Listing removed.");
      loadListings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove listing.");
    } finally {
      setActionListingId(null);
    }
  };

  const handleRestoreListing = async (productId) => {
    try {
      setActionListingId(productId);
      const res = await api.patch(`/admin/listings/${productId}/restore`);
      toast.success(res.data.message || "Listing restored to active.");
      loadListings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to restore listing.");
    } finally {
      setActionListingId(null);
    }
  };

  const handleToggleFeature = async (productId) => {
    try {
      setActionListingId(productId);
      const res = await api.patch(`/admin/listings/${productId}/feature`);
      toast.success(res.data.message || "Featured status updated.");
      setListings((prev) =>
        prev.map((item) =>
          item._id === productId ? { ...item, isFeatured: res.data.isFeatured } : item
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle featured status.");
    } finally {
      setActionListingId(null);
    }
  };

  // Report Resolution Actions
  const handleResolveReport = async (reportId, action) => {
    let notes = "";
    if (action === "remove_product") {
      notes = window.prompt(
        "Explanation for removing product and resolving report:",
        "Item violates campus safety and prohibited item policy."
      );
      if (notes === null) return;
    } else {
      if (!window.confirm("Dismiss this report as invalid or resolved?")) return;
    }

    try {
      setActionReportId(reportId);
      const res = await api.patch(`/admin/reports/${reportId}/resolve`, {
        action,
        resolutionNotes: notes,
      });
      toast.success(res.data.message || "Report processed.");
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve report.");
    } finally {
      setActionReportId(null);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="mt-4 text-2xl font-bold text-slate-800">
          Admin Access Required
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          You must be logged in as a campus administrator to view this page.
        </p>
        <Link
          to="/"
          className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-indigo-700">
              <img src="/logo.png" alt="MIT Mini Market Logo" className="h-8 w-8 object-contain" />
              <span>MIT Mini Market</span>
            </Link>
            <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-indigo-700">
              Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Marketplace
            </Link>
            <Link
              to="/notifications"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              🔔
            </Link>
            <Link
              to="/profile"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              My Account
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Admin Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: "stats", label: "📊 Platform Overview", desc: "KPIs & Analytics" },
            { id: "users", label: "👥 Users Management", desc: "Campus Members" },
            { id: "listings", label: "🏷️ Listings Moderation", desc: "All Marketplace Items" },
            { id: "reports", label: "🚩 Flagged Reports", desc: "User Complaints" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
                currentTab === tab.id
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: PLATFORM OVERVIEW & METRICS */}
        {currentTab === "stats" && (
          <div className="mt-8 space-y-8">
            {statsLoading || !stats ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                Loading analytics...
              </div>
            ) : (
              <>
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Total Students
                    </span>
                    <p className="mt-2 text-3xl font-black text-indigo-600">
                      {stats.users.total}
                    </p>
                    <span className="mt-1 block text-xs font-semibold text-emerald-600">
                      +{stats.users.newLast7Days} this week
                    </span>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Active Listings
                    </span>
                    <p className="mt-2 text-3xl font-black text-emerald-600">
                      {stats.listings.active}
                    </p>
                    <span className="mt-1 block text-xs text-slate-500">
                      of {stats.listings.total} total
                    </span>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Items Sold
                    </span>
                    <p className="mt-2 text-3xl font-black text-purple-600">
                      {stats.listings.sold}
                    </p>
                    <span className="mt-1 block text-xs text-slate-500">
                      deals completed
                    </span>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Traded Volume
                    </span>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {formatPrice(stats.sales.grossVolume)}
                    </p>
                    <span className="mt-1 block text-xs text-slate-500">
                      cumulative deals
                    </span>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Open Requests
                    </span>
                    <p className="mt-2 text-3xl font-black text-amber-500">
                      {stats.requests.pending}
                    </p>
                    <span className="mt-1 block text-xs text-slate-500">
                      {stats.requests.total} all-time
                    </span>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Pending Reports
                    </span>
                    <p className="mt-2 text-3xl font-black text-rose-500">
                      {stats.reports.pending}
                    </p>
                    <span className="mt-1 block text-xs text-slate-500">
                      need moderation
                    </span>
                  </div>
                </div>

                {/* Secondary Cards: Category Breakdown & Moderation Health */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Category Breakdown */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
                    <h3 className="text-lg font-bold text-slate-900">
                      Campus Marketplace Categories
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Distribution of listings across student categories.
                    </p>

                    <div className="mt-6 space-y-3">
                      {stats.categoryBreakdown.map((item) => {
                        const pct = stats.listings.total
                          ? Math.round((item.count / stats.listings.total) * 100)
                          : 0;
                        return (
                          <div key={item.category}>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="capitalize text-slate-700">
                                {item.category.replace("-", " ")}
                              </span>
                              <span className="text-slate-500">
                                {item.count} items ({pct}%)
                              </span>
                            </div>
                            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-indigo-600"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Campus Safety & Moderation Health */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
                    <h3 className="text-lg font-bold text-slate-900">
                      Campus Community & Moderation
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Administration overview of security and compliance.
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <span className="text-xs font-bold uppercase text-slate-400">
                          Active Admins
                        </span>
                        <p className="mt-1 text-2xl font-black text-slate-800">
                          {stats.users.admins}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <span className="text-xs font-bold uppercase text-slate-400">
                          Suspended Users
                        </span>
                        <p className="mt-1 text-2xl font-black text-rose-600">
                          {stats.users.banned}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <span className="text-xs font-bold uppercase text-slate-400">
                          Removed Listings
                        </span>
                        <p className="mt-1 text-2xl font-black text-slate-800">
                          {stats.listings.removed}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <span className="text-xs font-bold uppercase text-slate-400">
                          Resolved Reports
                        </span>
                        <p className="mt-1 text-2xl font-black text-emerald-600">
                          {stats.reports.resolved}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setTab("reports")}
                        className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
                      >
                        Review Pending Reports ({stats.reports.pending})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTab("users")}
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Manage Users
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {currentTab === "users" && (
          <div className="mt-8 space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search students by name, email, department..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Students</option>
                  <option value="admin">Admins</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="banned">Suspended Only</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
              {usersLoading ? (
                <div className="p-12 text-center text-slate-500">Loading students...</div>
              ) : users.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Department / Year</th>
                        <th className="px-6 py-4">Listings</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-indigo-100">
                                {u.avatar ? (
                                  <img
                                    src={u.avatar}
                                    alt={u.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-xs font-bold text-white">
                                    {getInitials(u.name)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <Link
                                  to={`/users/${u.id}`}
                                  className="font-bold text-slate-900 hover:text-indigo-600"
                                >
                                  {u.name}
                                </Link>
                                <p className="text-xs text-slate-400">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-xs">
                            <p className="font-semibold text-slate-800">
                              {u.department || "General"}
                            </p>
                            <p className="text-slate-400">{u.year || "Student"}</p>
                          </td>

                          <td className="px-6 py-4 font-bold text-slate-900">
                            {u.listingsCount}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                u.role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {u.role === "admin" ? "Admin" : "Student"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                u.isBanned
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {u.isBanned ? "Suspended" : "Active"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Toggle Admin Role */}
                              <button
                                type="button"
                                onClick={() => handleToggleRole(u)}
                                disabled={actionUserId === u.id || u.id === user.id}
                                title={u.role === "admin" ? "Demote to Student" : "Promote to Admin"}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40"
                              >
                                {u.role === "admin" ? "Demote" : "Make Admin"}
                              </button>

                              {/* Toggle Ban */}
                              <button
                                type="button"
                                onClick={() => handleToggleBan(u)}
                                disabled={actionUserId === u.id || u.id === user.id}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  u.isBanned
                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                } disabled:opacity-40`}
                              >
                                {u.isBanned ? "Unban" : "Suspend"}
                              </button>

                              {/* Delete */}
                              {u.id !== user.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  disabled={actionUserId === u.id}
                                  title="Delete user permanently"
                                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                >
                                  🗑️
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LISTINGS MODERATION */}
        {currentTab === "listings" && (
          <div className="mt-8 space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search listings by title or description..."
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={listingCategory}
                  onChange={(e) => setListingCategory(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="books">Books</option>
                  <option value="electronics">Electronics</option>
                  <option value="hostel-essentials">Hostel Essentials</option>
                  <option value="clothing">Clothing</option>
                  <option value="furniture">Furniture</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>

                <select
                  value={listingStatus}
                  onChange={(e) => setListingStatus(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                  <option value="removed">Removed (Admin)</option>
                </select>
              </div>
            </div>

            {/* Listings Grid */}
            {listingsLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                Loading listings...
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                No listings matched the criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs"
                  >
                    <div>
                      {/* Image Preview & Status Badge */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            No photo
                          </div>
                        )}
                        <span
                          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            item.status === "active"
                              ? "bg-emerald-500 text-white"
                              : item.status === "removed"
                              ? "bg-rose-600 text-white"
                              : item.status === "sold"
                              ? "bg-slate-700 text-white"
                              : "bg-amber-500 text-white"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                          {item.category}
                        </span>
                        <h4 className="mt-1 line-clamp-1 text-base font-bold text-slate-900">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-lg font-black text-slate-900">
                          {formatPrice(item.price)}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          Seller: <strong>{item.seller?.name || "Student"}</strong> ({item.seller?.email || ""})
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
                      <Link
                        to={`/products/${item._id}`}
                        className="text-xs font-semibold text-slate-700 hover:text-indigo-600"
                      >
                        View Details →
                      </Link>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleFeature(item._id)}
                          disabled={actionListingId === item._id}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-bold border transition ${
                            item.isFeatured
                              ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                              : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                          }`}
                          title="Toggle featured showcase on marketplace homepage"
                        >
                          {item.isFeatured ? "⭐ Featured" : "☆ Feature"}
                        </button>

                        {item.status === "removed" ? (
                        <button
                          type="button"
                          onClick={() => handleRestoreListing(item._id)}
                          disabled={actionListingId === item._id}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveListing(item._id)}
                          disabled={actionListingId === item._id}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REPORTED PRODUCTS */}
        {currentTab === "reports" && (
          <div className="mt-8 space-y-6">
            {/* Filter Pills */}
            <div className="flex gap-2">
              {[
                { id: "pending", label: "Pending Review" },
                { id: "resolved", label: "Resolved" },
                { id: "dismissed", label: "Dismissed" },
                { id: "all", label: "All Reports" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setReportStatusFilter(f.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    reportStatusFilter === f.id
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Reports List */}
            {reportsLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                Loading reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <span className="text-4xl">🛡️</span>
                <h3 className="mt-3 text-lg font-bold text-slate-800">
                  No reports in this category
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  The campus marketplace is running clean and safe.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((rep) => {
                  const product = rep.product;
                  const reporter = rep.reporter;

                  return (
                    <div
                      key={rep._id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xs"
                    >
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        {/* Report & Product Information */}
                        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start">
                          {/* Product Image */}
                          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200">
                            {product?.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                No photo
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-rose-100 px-3 py-0.5 text-xs font-bold text-rose-700 capitalize">
                                🚩 {rep.reason.replace("_", " ")}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                                  rep.status === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : rep.status === "resolved"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {rep.status}
                              </span>
                              <span className="text-xs text-slate-400">
                                {new Date(rep.createdAt).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>

                            <h4 className="mt-2 text-base font-bold text-slate-900">
                              {product?.title || "Deleted or Unavailable Product"}
                            </h4>

                            {rep.description && (
                              <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                                <span className="font-semibold text-slate-500">
                                  Student complaint:{" "}
                                </span>
                                "{rep.description}"
                              </div>
                            )}

                            {rep.resolutionNotes && (
                              <div className="mt-2 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800">
                                <span className="font-semibold">Admin Resolution: </span>
                                {rep.resolutionNotes}
                              </div>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                              <span>
                                Reported by:{" "}
                                <strong>{reporter?.name || "Student"}</strong> ({reporter?.email})
                              </span>
                              <span>
                                Seller:{" "}
                                <strong>{product?.seller?.name || "Student"}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        {rep.status === "pending" && (
                          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                            <button
                              type="button"
                              onClick={() => handleResolveReport(rep._id, "remove_product")}
                              disabled={actionReportId === rep._id}
                              className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                            >
                              Remove Item & Resolve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveReport(rep._id, "dismiss")}
                              disabled={actionReportId === rep._id}
                              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                            >
                              Dismiss Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
