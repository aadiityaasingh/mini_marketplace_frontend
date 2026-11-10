import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

export default function Notifications() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'messages', 'requests'
  const [deletingId, setDeletingId] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Please log in to view your notifications.");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Mark single notification as read & navigate
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all your notifications?")) return;
    await clearAll();
  };

  // Delete single notification
  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    try {
      setDeletingId(notificationId);
      await deleteNotification(notificationId);
    } finally {
      setDeletingId(null);
    }
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return "";
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getIcon = (type) => {
    switch (type) {
      case "new_message":
        return "💬";
      case "purchase_request":
        return "🛒";
      case "request_accepted":
        return "🎉";
      case "request_rejected":
        return "🛑";
      case "request_completed":
        return "✅";
      case "listing_update":
        return "🏷️";
      default:
        return "🔔";
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread") return !notif.isRead;
    if (filter === "messages") return notif.type === "new_message";
    if (filter === "requests")
      return [
        "purchase_request",
        "request_accepted",
        "request_rejected",
        "request_completed",
      ].includes(notif.type);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-xl font-extrabold text-indigo-700">
            🎓 MIT Mini Market
          </Link>

          <div className="flex items-center gap-3">
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-purple-700"
              >
                ⚡ Admin Panel
              </Link>
            )}
            <Link
              to="/"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Marketplace
            </Link>
            <Link
              to="/requests"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Requests
            </Link>
            <Link
              to="/chats"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Messages
            </Link>
            <Link
              to="/profile"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Profile
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Stay up to date with new messages, purchase requests, and listing status updates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: "all", label: `All (${notifications.length})` },
            { id: "unread", label: `Unread (${unreadCount})` },
            { id: "requests", label: "Purchase Requests" },
            { id: "messages", label: "Messages" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                filter === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List of Notifications */}
        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <span className="text-4xl">🔔</span>
              <h3 className="mt-3 text-lg font-bold text-slate-800">
                No notifications found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {filter === "unread"
                  ? "You're all caught up! No unread notifications."
                  : "New alerts and updates will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group relative flex cursor-pointer items-start justify-between gap-4 rounded-2xl border p-4 transition hover:shadow-md ${
                    notif.isRead
                      ? "border-slate-200 bg-white"
                      : "border-indigo-200 bg-indigo-50/50 ring-1 ring-indigo-500/10"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Icon or Sender Avatar */}
                    <div className="relative shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-slate-200 text-xl shadow-xs">
                        {getIcon(notif.type)}
                      </div>
                      {!notif.isRead && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-indigo-600 ring-2 ring-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4
                          className={`text-sm ${
                            notif.isRead
                              ? "font-semibold text-slate-800"
                              : "font-bold text-slate-900"
                          }`}
                        >
                          {notif.title}
                        </h4>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {getRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {notif.message}
                      </p>

                      {notif.link && (
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:underline">
                          View details →
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, notif._id)}
                    disabled={deletingId === notif._id}
                    title="Delete notification"
                    className="shrink-0 rounded-lg p-2 text-slate-400 opacity-60 transition hover:bg-slate-100 hover:text-red-600 hover:opacity-100"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
