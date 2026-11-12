import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import {
  CATEGORIES,
  CAMPUS_LOCATIONS,
  CONDITIONS,
  LISTING_TYPES,
  SORT_OPTIONS,
  PRICE_PRESETS,
} from "../constants/marketplace";

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Notification dropdown state
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Featured & Recent listings states
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  // Category statistics from backend
  const [categoriesData, setCategoriesData] = useState([]);

  // Main Marketplace Listings states
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Search & Filter states
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedListingType, setSelectedListingType] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Count active filters (for badge)
  const activeFiltersCount = [
    Boolean(search.trim()),
    Boolean(selectedCategory),
    Boolean(selectedListingType),
    Boolean(selectedCondition),
    Boolean(selectedLocation),
    Boolean(minPrice !== ""),
    Boolean(maxPrice !== ""),
  ].filter(Boolean).length;

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedListingType("");
    setSelectedCondition("");
    setSelectedLocation("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
  };

  // Fetch Category statistics
  useEffect(() => {
    let isMounted = true;
    const fetchCategories = async () => {
      try {
        const res = await api.get("/products/categories");
        if (isMounted && res.data.categories) {
          setCategoriesData(res.data.categories);
        }
      } catch (err) {
        console.error("Failed to load category counts:", err);
      }
    };
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Featured Listings
  useEffect(() => {
    let isMounted = true;
    const fetchFeatured = async () => {
      try {
        setFeaturedLoading(true);
        const res = await api.get("/products/featured");
        if (isMounted) {
          setFeaturedProducts(res.data.products || []);
        }
      } catch (err) {
        console.error("Failed to load featured products:", err);
      } finally {
        if (isMounted) setFeaturedLoading(false);
      }
    };
    fetchFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Recent Listings
  useEffect(() => {
    let isMounted = true;
    const fetchRecent = async () => {
      try {
        setRecentLoading(true);
        const res = await api.get("/products/recent");
        if (isMounted) {
          setRecentProducts(res.data.products || []);
        }
      } catch (err) {
        console.error("Failed to load recent products:", err);
      } finally {
        if (isMounted) setRecentLoading(false);
      }
    };
    fetchRecent();
    return () => {
      isMounted = false;
    };
  }, []);

  // Main Marketplace Listings Fetch
  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit: 12,
          sort,
        };

        if (search.trim()) params.search = search.trim();
        if (selectedCategory) params.category = selectedCategory;
        if (selectedListingType) params.listingType = selectedListingType;
        if (selectedCondition) params.condition = selectedCondition;
        if (selectedLocation) params.location = selectedLocation;
        if (minPrice !== "") params.minPrice = minPrice;
        if (maxPrice !== "") params.maxPrice = maxPrice;

        const response = await api.get("/products", { params });

        if (!cancelled) {
          setProducts(response.data.products || []);
          setTotalProducts(response.data.pagination?.totalProducts || 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load products. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [
    search,
    selectedCategory,
    selectedListingType,
    selectedCondition,
    selectedLocation,
    minPrice,
    maxPrice,
    sort,
    page,
    retryCount,
  ]);
  const handleNotificationToggle = () => {
    setNotificationOpen(!notificationOpen);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setNotificationOpen(false);
    navigate(notification.link || "/notifications");
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleLogout = () => {
    logout();
    setNotificationOpen(false);
    toast.success("You have been logged out.");
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Find category icon
  const getCategoryMeta = (catKey) => {
    return (
      CATEGORIES.find((c) => c.value === catKey) || {
        icon: "📦",
        label: catKey,
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-indigo-700">
            <img src="/logo.png" alt="MIT Mini Market Logo" className="h-10 w-10 object-contain" />
            <span>MIT Mini Market</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-purple-700"
                  >
                    <span>⚡</span>
                    <span className="hidden sm:inline">Admin Panel</span>
                  </Link>
                )}

                <Link
                  to="/create-listing"
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 sm:px-4 shadow-xs"
                >
                  + Sell / Share
                </Link>

                <Link
                  to="/requests"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  🤝 Requests
                </Link>

                <Link
                  to="/chats"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  💬 Messages
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleNotificationToggle}
                    aria-label={`Notifications, ${unreadCount} unread`}
                    className="relative flex items-center rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                  >
                    <span className="text-lg">🔔</span>
                    {unreadCount > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white shadow-xs">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationOpen && (
                    <>
                      <button
                        type="button"
                        aria-label="Close notifications"
                        onClick={() => setNotificationOpen(false)}
                        className="fixed inset-0 z-30 cursor-default"
                      />

                      <div className="absolute right-0 z-40 mt-3 w-[min(90vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                          <div>
                            <h3 className="font-bold text-slate-900">Notifications</h3>
                            <p className="text-xs text-slate-500">{unreadCount} unread</p>
                          </div>

                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllRead}
                              className="text-xs font-semibold text-indigo-600 hover:underline"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                          {notificationsLoading ? (
                            <div className="p-8 text-center text-sm text-slate-400">Loading notifications...</div>
                          ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-400">No notifications yet.</div>
                          ) : (
                            notifications.slice(0, 10).map((n) => (
                              <button
                                key={n._id}
                                type="button"
                                onClick={() => handleNotificationClick(n)}
                                className={`flex w-full text-left gap-3 p-3.5 transition hover:bg-slate-50 ${
                                  !n.isRead ? "bg-indigo-50/40" : ""
                                }`}
                              >
                                <span className="text-lg mt-0.5">
                                  {n.type === "new_message" ? "💬" : n.type === "purchase_request" ? "🛒" : "🔔"}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                                  <p className="text-xs text-slate-600 truncate">{n.message}</p>
                                  <span className="text-[11px] text-slate-400 mt-1 block">
                                    {getRelativeTime(n.createdAt)}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>

                        <div className="border-t border-slate-100 p-2.5 text-center bg-slate-50">
                          <Link
                            to="/notifications"
                            onClick={() => setNotificationOpen(false)}
                            className="text-xs font-bold text-indigo-600 hover:underline"
                          >
                            View all notifications →
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-xs"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-12 md:py-24">
            <div className="md:col-span-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-200 border border-indigo-400/30">
                <span>🎓</span> Campus Peer-to-Peer Marketplace
              </span>

              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-white">
                Buy, sell & borrow <br />
                <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-indigo-200 bg-clip-text text-transparent">
                  across campus.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-indigo-100/90 sm:text-lg">
                Exchange study notes, lab coats, electronics, cycles, and hostel essentials directly with fellow students. Zero commissions, safe campus pickups.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#marketplace"
                  className="rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-950 shadow-lg hover:bg-slate-100 transition"
                >
                  Browse Campus Listings ↓
                </a>

                <Link
                  to="/create-listing"
                  className="rounded-2xl bg-indigo-600/90 px-6 py-3.5 text-sm font-bold text-white border border-indigo-400/40 hover:bg-indigo-500 transition shadow-lg"
                >
                  + Post an Item Free
                </Link>
              </div>
            </div>

            {/* Quick Campus Category Highlights */}
            <div className="md:col-span-5">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-md shadow-2xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-200">
                  Popular On Campus
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { label: "Engineering Books", icon: "📚", cat: "books" },
                    { label: "Calculators & Gadgets", icon: "💻", cat: "electronics" },
                    { label: "Hostel Essentials", icon: "🛏️", cat: "hostel-essentials" },
                    { label: "Campus Cycles", icon: "🚲", cat: "cycles" },
                  ].map((item) => (
                    <button
                      key={item.cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(item.cat);
                        document.getElementById("marketplace")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="flex flex-col text-left rounded-2xl bg-white/10 p-4 border border-white/10 transition hover:bg-white/20"
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="mt-2 text-sm font-bold text-white">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED CAMPUS LISTINGS SPOTLIGHT */}
        {featuredLoading ? (
          <section className="mx-auto max-w-7xl px-5 py-8">
            <div className="h-6 w-48 bg-slate-200 animate-pulse rounded-md mb-4" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          </section>
        ) : featuredProducts.length > 0 ? (
          <section className="border-b border-slate-200 bg-amber-50/40 py-10">
            <div className="mx-auto max-w-7xl px-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    <h2 className="text-2xl font-extrabold text-slate-900">Featured Campus Picks</h2>
                  </div>
                  <p className="text-sm text-slate-500">Handpicked student offers and high-demand campus items.</p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {featuredProducts.slice(0, 4).map((item) => (
                  <Link
                    key={item._id}
                    to={`/products/${item._id}`}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-xs transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl">🛍️</div>
                      )}
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                        ⭐ Featured
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                        {item.category?.replaceAll("-", " ")}
                      </p>
                      <h3 className="mt-1 line-clamp-1 font-bold text-slate-900 group-hover:text-indigo-600">
                        {item.title}
                      </h3>
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <span className="text-base font-extrabold text-slate-900">
                          {["sale", "rent"].includes(item.listingType)
                            ? formatPrice(item.price)
                            : item.listingType === "exchange"
                            ? "Exchange"
                            : "Free"}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">
                          {item.location || "Campus"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* RECENTLY ADDED TICKER */}
        {recentLoading ? (
          <div className="border-b border-slate-200 bg-white py-4">
            <div className="mx-auto max-w-7xl px-5">
              <div className="h-12 w-full rounded-2xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        ) : recentProducts.length > 0 ? (
          <section className="border-b border-slate-200 bg-white py-6">
            <div className="mx-auto max-w-7xl px-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  ✨ Fresh In Marketplace
                </h3>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {recentProducts.map((p) => (
                  <Link
                    key={p._id}
                    to={`/products/${p._id}`}
                    className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5 pr-4 hover:bg-indigo-50/50 hover:border-indigo-200 transition"
                  >
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm">📦</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-xs font-bold text-slate-800">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-extrabold text-indigo-600">
                          {p.price > 0 ? formatPrice(p.price) : "Free"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {getRelativeTime(p.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* MAIN MARKETPLACE EXPLORER */}
        <section id="marketplace" className="mx-auto max-w-7xl px-5 py-12">
          {/* Header & Search Bar */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                CAMPUS INVENTORY
              </p>
              <h2 className="mt-1 text-3xl font-extrabold text-slate-900">
                Explore Listings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {totalProducts} active listings across campus.
              </p>
            </div>

            {/* Quick Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs font-bold text-slate-500 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input Bar with Filter Toggle */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by keywords, title, textbooks, room items..."
                className="w-full rounded-2xl border border-slate-300 bg-white py-3.5 pl-11 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-xs text-slate-400 hover:bg-slate-100"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold border transition ${
                showAdvancedFilters || activeFiltersCount > 0
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>⚙️ Filters</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-extrabold text-indigo-700">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 hover:underline px-2 py-1"
              >
                Reset all
              </button>
            )}
          </div>

          {/* ADVANCED FILTER DRAWER / PANEL */}
          {showAdvancedFilters && (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition animate-in fade-in zoom-in-98">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-900">Advanced Filter Controls</h3>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* 1. Listing Type */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Listing Type
                  </label>
                  <select
                    value={selectedListingType}
                    onChange={(e) => {
                      setSelectedListingType(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
                  >
                    <option value="">All Types (Buy, Rent, Donate)</option>
                    {LISTING_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Condition */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Item Condition
                  </label>
                  <select
                    value={selectedCondition}
                    onChange={(e) => {
                      setSelectedCondition(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
                  >
                    <option value="">All Conditions</option>
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Campus Location */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Campus Location / Hostel
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500"
                  >
                    <option value="">All Campus Spots</option>
                    {CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Price Range Inputs */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Price Range (₹)
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min ₹"
                      value={minPrice}
                      onChange={(e) => {
                        setMinPrice(e.target.value);
                        setPage(1);
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Max ₹"
                      value={maxPrice}
                      onChange={(e) => {
                        setMaxPrice(e.target.value);
                        setPage(1);
                      }}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Price Preset Chips */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-400 mr-2">Quick price filters:</span>
                {PRICE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setMinPrice(preset.min);
                      setMaxPrice(preset.max);
                      setPage(1);
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      minPrice === preset.min && maxPrice === preset.max
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY EXPLORER PILLS / BAR */}
          <div className="mt-6 flex flex-wrap items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("");
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                selectedCategory === ""
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
              }`}
            >
              <span>🌐</span>
              <span>All Items</span>
              <span className="ml-1 rounded-full bg-slate-200/50 px-1.5 py-0.2 text-[10px]">
                {totalProducts}
              </span>
            </button>

            {CATEGORIES.map((cat) => {
              const countItem = categoriesData.find((c) => c.key === cat.value);
              const count = countItem ? countItem.count : 0;
              const isSelected = selectedCategory === cat.value;

              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(isSelected ? "" : cat.value);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* PRODUCT RESULTS GRID */}
          <div className="mt-8">
            {loading ? (
              /* MODERN SHIMMER SKELETON LOADERS */
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-pulse"
                  >
                    <div className="h-44 w-full rounded-xl bg-slate-200" />
                    <div className="mt-4 h-4 w-1/3 rounded-md bg-slate-200" />
                    <div className="mt-2 h-5 w-3/4 rounded-md bg-slate-200" />
                    <div className="mt-2 h-4 w-full rounded-md bg-slate-100" />
                    <div className="mt-4 flex items-center justify-between">
                      <div className="h-6 w-1/4 rounded-md bg-slate-200" />
                      <div className="h-5 w-1/5 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              /* ERROR STATE */
              <div className="rounded-3xl border border-red-200 bg-red-50/50 p-12 text-center">
                <p className="text-lg font-bold text-red-700">{error}</p>
                <p className="mt-1 text-sm text-slate-500">
                  There was a problem retrieving campus listings from the server.
                </p>
                <button
                  type="button"
                  onClick={() => setRetryCount((c) => c + 1)}
                  className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
                >
                  Try Again
                </button>
              </div>
            ) : products.length === 0 ? (
              /* RICH EMPTY STATE */
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-4xl">
                  🔍
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  No listings found matching your search
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                  We couldn't find any items matching your selected criteria. Try removing some filters or search for something else.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Clear All Filters
                    </button>
                  )}

                  <Link
                    to="/create-listing"
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-xs"
                  >
                    + Be the First to List It
                  </Link>
                </div>
              </div>
            ) : (
              /* PRODUCTS CARDS GRID */
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => {
                  const meta = getCategoryMeta(product.category);

                  return (
                    <Link
                      key={product._id}
                      to={`/products/${product._id}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg focus:outline-none"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-5xl">
                            {meta.icon}
                          </div>
                        )}

                        {/* Badges on Thumbnail */}
                        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
                          {product.isFeatured && (
                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                              ⭐ Featured
                            </span>
                          )}
                          <span className="rounded-full bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-white capitalize">
                            {product.condition} condition
                          </span>
                        </div>

                        {/* Location Tag */}
                        {product.location && (
                          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-slate-700 shadow-xs">
                            📍 {product.location}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                          <span>{meta.icon}</span>
                          <span className="uppercase tracking-wider">
                            {product.category?.replaceAll("-", " ")}
                          </span>
                        </div>

                        <h3 className="mt-1 line-clamp-2 text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {product.title}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {product.description}
                        </p>

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                          <div>
                            <span className="text-lg font-extrabold text-slate-900">
                              {["sale", "rent"].includes(product.listingType)
                                ? formatPrice(product.price)
                                : product.listingType === "exchange"
                                ? "Exchange"
                                : "Free"}
                            </span>
                            {product.listingType === "rent" && (
                              <span className="text-[11px] text-slate-400 ml-1">/rent</span>
                            )}
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${
                              product.listingType === "donation"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : product.listingType === "exchange"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {product.listingType}
                          </span>
                        </div>

                        {/* Seller Snippet */}
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>By {product.seller?.name || "Campus student"}</span>
                          <span>{getRelativeTime(product.createdAt)}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* How It Works Campus Safety */}
        <section className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-5">
            <h2 className="text-center text-3xl font-extrabold text-slate-900">
              Campus Trading Made Safe & Simple
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
              Designed specifically for college campus life with verified peers.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Find or Post Items",
                  desc: "Browse verified listings from classmates or list textbooks and gear in 60 seconds.",
                  icon: "🔍",
                },
                {
                  step: "02",
                  title: "Request & Chat",
                  desc: "Send an in-app purchase request with an offer price and chat directly with the seller.",
                  icon: "💬",
                },
                {
                  step: "03",
                  title: "Meet on Campus",
                  desc: "Meet at the library or student center to inspect the item, complete payment, and hand over.",
                  icon: "🤝",
                },
              ].map((item) => (
                <div key={item.step} className="rounded-3xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-sm font-extrabold text-indigo-600">STEP {item.step}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 px-5 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-2 font-semibold text-slate-300">
          <img src="/logo.png" alt="MIT Mini Market Logo" className="h-6 w-6 object-contain" />
          <span>MIT Mini Market · College Campus Marketplace</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Built for students to buy, sell, rent, and share responsibly.</p>
      </footer>
    </div>
  );
}
