import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { socket } from "../api/socket";

const categories = [
  { label: "All items", value: "" },
  { label: "Books", value: "books" },
  { label: "Electronics", value: "electronics" },
  { label: "Hostel essentials", value: "hostel-essentials" },
  { label: "Clothing", value: "clothing" },
  { label: "Furniture", value: "furniture" },
  { label: "Sports", value: "sports" },
  { label: "Other", value: "other" },
];

function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  const navigate = useNavigate();

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [listingType, setListingType] = useState("");
  const [condition, setCondition] = useState("");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit: 8,
          sort,
        };

        if (search.trim()) params.search = search.trim();
        if (category) params.category = category;
        if (listingType) params.listingType = listingType;
        if (condition) params.condition = condition;

        const response = await api.get("/products", { params });

        if (!cancelled) {
          setProducts(response.data.products || []);
          setPagination(response.data.pagination || null);
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
  }, [search, category, listingType, condition, sort, page, retryCount]);

  // Fetch unread notification count and listen for real-time notifications
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationOpen(false);
      return;
    }

    let cancelled = false;

    const fetchUnreadCount = async () => {
      try {
        const response = await api.get("/notifications/unread-count");

        if (!cancelled) {
          setUnreadCount(response.data.unreadCount || 0);
        }
      } catch (error) {
        console.error("Unable to fetch unread notification count:", error);
      }
    };

    const handleNewNotification = (notification) => {
      setNotifications((previous) => {
        if (previous.some((item) => item._id === notification._id)) {
          return previous;
        }

        return [notification, ...previous].slice(0, 50);
      });

      setUnreadCount((count) => count + 1);

      toast.info(notification.title || "You have a new notification.");
    };

    fetchUnreadCount();

    socket.on("notification:new", handleNewNotification);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      cancelled = true;
      socket.off("notification:new", handleNewNotification);
    };
  }, [isAuthenticated]);

  // Fetch notifications when the dropdown is opened
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);

      const response = await api.get("/notifications");

      setNotifications(response.data.notifications || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load notifications.",
      );
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationToggle = () => {
    const nextOpen = !notificationOpen;

    setNotificationOpen(nextOpen);

    if (nextOpen) {
      fetchNotifications();
    }
  };

  // Mark one notification as read and open its destination
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.patch(`/notifications/${notification._id}/read`);

        setNotifications((previous) =>
          previous.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item,
          ),
        );

        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Unable to mark notification as read.",
        );
        return;
      }
    }

    setNotificationOpen(false);
    navigate(notification.link || "/notifications");
  };

  // Mark every notification as read
  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, isRead: true })),
      );

      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update notifications.",
      );
    }
  };

  const handleLogout = () => {
    socket.disconnect();
    logout();
    toast.success("You have been logged out.");
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="text-xl font-extrabold text-indigo-700">
            🎓 MIT Mini Market
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-slate-600 sm:inline">
                  Hi, {user?.name}
                </span>

                <Link
                  to="/my-listings"
                  className="rounded-xl border border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 sm:px-4"
                >
                  My Listings
                </Link>

                <Link
                  to="/create-listing"
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 sm:px-4"
                >
                  + Create Listing
                </Link>
                <Link
                  to="/wishlist"
                  className="font-semibold text-slate-700 hover:text-indigo-600"
                >
                  ❤️ Wishlist
                </Link>
                <Link
                  to="/chats"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Messages
                </Link>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleNotificationToggle}
                    aria-label={`Notifications, ${unreadCount} unread`}
                    aria-expanded={notificationOpen}
                    className="relative flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <span className="text-lg" aria-hidden="true">
                      🔔
                    </span>
                    <span className="hidden sm:inline">Notifications</span>

                    {unreadCount > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationOpen && (
                    <>
                      {/* Click outside the dropdown to close it */}
                      <button
                        type="button"
                        aria-label="Close notifications"
                        onClick={() => setNotificationOpen(false)}
                        className="fixed inset-0 z-30 cursor-default"
                      />

                      <div className="absolute right-0 z-40 mt-3 w-[min(90vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                          <div>
                            <h3 className="font-bold text-slate-900">
                              Notifications
                            </h3>
                            <p className="text-xs text-slate-500">
                              {unreadCount} unread
                            </p>
                          </div>

                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllRead}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                          {notificationsLoading ? (
                            <p className="p-6 text-center text-sm text-slate-500">
                              Loading notifications...
                            </p>
                          ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                              <div className="text-3xl">🔔</div>
                              <p className="mt-3 font-semibold text-slate-700">
                                You're all caught up
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                New messages and updates will appear here.
                              </p>
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <button
                                key={notification._id}
                                type="button"
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                                className={`flex w-full gap-3 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-indigo-50 ${
                                  notification.isRead
                                    ? "bg-white"
                                    : "bg-indigo-50/60"
                                }`}
                              >
                                <span className="mt-1 text-xl">
                                  {notification.type === "new_message"
                                    ? "💬"
                                    : notification.type === "listing_update"
                                      ? "🛍️"
                                      : "🔔"}
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="flex items-start justify-between gap-2">
                                    <span className="text-sm font-bold text-slate-800">
                                      {notification.title}
                                    </span>

                                    {!notification.isRead && (
                                      <span
                                        className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600"
                                        aria-label="Unread"
                                      />
                                    )}
                                  </span>

                                  <span className="mt-1 block break-words text-sm text-slate-600">
                                    {notification.message}
                                  </span>

                                  <span className="mt-2 block text-xs text-slate-400">
                                    {notification.createdAt
                                      ? new Date(
                                          notification.createdAt,
                                        ).toLocaleString("en-IN", {
                                          dateStyle: "medium",
                                          timeStyle: "short",
                                        })
                                      : ""}
                                  </span>
                                </span>
                              </button>
                            ))
                          )}
                        </div>

                        <div className="border-t border-slate-100 p-3">
                          <Link
                            to="/notifications"
                            onClick={() => setNotificationOpen(false)}
                            className="block rounded-lg px-3 py-2 text-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                          >
                            View all notifications
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 sm:px-4"
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
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-100">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
            <div>
              <p className="font-semibold text-indigo-700">
                YOUR CAMPUS. YOUR MARKETPLACE.
              </p>

              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 md:text-6xl">
                Buy, sell and share within your campus.
              </h1>

              <p className="mt-5 max-w-xl leading-7 text-slate-600">
                Find affordable books, electronics, hostel essentials and more
                from your campus community.
              </p>

              <a
                href="#marketplace"
                className="mt-8 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Explore marketplace
              </a>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl">
              <p className="text-sm font-semibold text-indigo-600">
                A smarter campus community
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4">
                {[
                  ["📚", "Books & notes"],
                  ["💻", "Electronics"],
                  ["🪑", "Hostel essentials"],
                  ["🤝", "Exchange & donate"],
                ].map(([emoji, label]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-5">
                    <div className="text-3xl">{emoji}</div>
                    <p className="mt-3 font-semibold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Marketplace */}
        <section id="marketplace" className="mx-auto max-w-7xl px-5 py-14">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              CAMPUS MARKETPLACE
            </p>

            <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
              Explore listings
            </h2>

            <p className="mt-2 text-slate-500">
              Discover what's available in your campus community.
            </p>
          </div>

          {/* Search */}
          <div className="mt-7">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books, electronics, furniture..."
              aria-label="Search marketplace listings"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          {/* Category filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item.value || "all"}
                onClick={() => setCategory(item.value)}
                aria-pressed={category === item.value}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === item.value
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Product results */}
          {loading ? (
            <p className="py-16 text-center text-slate-500">
              Loading marketplace listings...
            </p>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-red-600">{error}</p>

              <button
                onClick={() => setRetryCount((count) => count + 1)}
                className="mt-3 rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700"
              >
                Try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
              <div className="text-4xl">🛍️</div>

              <h3 className="mt-4 text-xl font-bold">No listings found</h3>

              <p className="mt-2 text-slate-500">
                Try another search or category, or check back when new listings
                are published.
              </p>

              {isAuthenticated && (
                <Link
                  to="/create-listing"
                  className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
                >
                  Create a Listing
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      loading="lazy"
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-100 text-5xl">
                      🛍️
                    </div>
                  )}

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                      {product.category?.replaceAll("-", " ")}
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-lg font-bold">
                      {product.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {product.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900">
                        {["sale", "rent"].includes(product.listingType)
                          ? formatPrice(product.price)
                          : product.listingType === "exchange"
                            ? "Exchange"
                            : "Free"}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-600">
                        {product.listingType}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      Seller: {product.seller?.name || "Campus member"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14">
            <h2 className="text-center text-3xl font-extrabold">
              How it works
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                ["01", "Find an item", "Search listings for things you need."],
                ["02", "Connect", "Find a seller from your campus community."],
                ["03", "Reuse and save", "Give useful items another life."],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="rounded-2xl border border-slate-200 p-6"
                >
                  <p className="font-extrabold text-indigo-600">{number}</p>

                  <h3 className="mt-3 text-xl font-bold">{title}</h3>

                  <p className="mt-2 leading-6 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 px-5 py-7 text-center text-sm text-slate-300">
        MIT Mini Market · A marketplace for your campus community
      </footer>
    </div>
  );
}

export default Home;
