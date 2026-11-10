/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "./AuthContext";
import { socket } from "../api/socket";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initial fetch of unread count and latest notifications
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to refresh unread notification count:", err);
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [notifsRes, countRes] = await Promise.all([
        api.get("/notifications"),
        api.get("/notifications/unread-count"),
      ]);
      setNotifications(notifsRes.data.notifications || []);
      setUnreadCount(countRes.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update notifications.");
    }
  }, []);

  // Delete a single notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => {
        const found = prev.find((n) => n._id === notificationId);
        if (found && !found.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n._id !== notificationId);
      });
      toast.info("Notification removed.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete notification.");
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      await api.delete("/notifications");
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications cleared.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to clear notifications.");
    }
  }, []);

  // Global Socket management and real-time notification listener
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket.connected) {
        socket.disconnect();
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    // Refresh socket token
    socket.auth = { token };

    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    // Load initial data
    const load = async () => {
      try {
        const [countRes, notifsRes] = await Promise.all([
          api.get("/notifications/unread-count"),
          api.get("/notifications"),
        ]);
        if (isMounted) {
          setUnreadCount(countRes.data.unreadCount || 0);
          setNotifications(notifsRes.data.notifications || []);
        }
      } catch (err) {
        console.error("Notification initialization error:", err);
      }
    };

    load();

    // Listen for new real-time notifications
    const handleNewNotification = (notification) => {
      if (!isMounted) return;

      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) {
          return prev;
        }
        return [notification, ...prev];
      });

      setUnreadCount((count) => count + 1);

      // Show toast notification anywhere in the application
      const isMsg = notification.type === "new_message";

      toast.info(
        <div
          onClick={() => {
            if (notification.link) {
              navigate(notification.link);
            }
          }}
          className="cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">
              {notification.title || (isMsg ? "New message" : "New notification")}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <span className="text-[10px] text-indigo-600 font-semibold mt-1 inline-block">
            Click to view →
          </span>
        </div>,
        {
          icon: isMsg ? "💬" : "🔔",
          autoClose: 6000,
        }
      );
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      isMounted = false;
      socket.off("notification:new", handleNewNotification);
    };
  }, [isAuthenticated, token, navigate]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
