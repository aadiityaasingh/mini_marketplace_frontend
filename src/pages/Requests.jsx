import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { socket } from "../api/socket";

export default function Requests() {
  const { isAuthenticated, user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab: 'received' (seller mode) or 'sent' (buyer mode)
  const currentTab = searchParams.get("tab") || "received";
  const statusFilter = searchParams.get("status") || "all";

  const setTab = (tab) => {
    setSearchParams({ tab, status: "all" });
  };

  const setStatus = (status) => {
    setSearchParams({ tab: currentTab, status });
  };

  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Please log in to view your purchase requests.");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch requests based on active tab and status filter
  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) return;

    const loadRequests = async () => {
      try {
        setLoading(true);
        const params = statusFilter !== "all" ? { status: statusFilter } : {};

        if (currentTab === "received") {
          const res = await api.get("/requests/received", { params });
          if (!isMounted) return;
          setReceivedRequests(res.data.requests || []);
          setPendingCount(res.data.pendingCount || 0);
        } else {
          const res = await api.get("/requests/sent", { params });
          if (!isMounted) return;
          setSentRequests(res.data.requests || []);
        }
      } catch (err) {
        if (isMounted) {
          toast.error(err.response?.data?.message || "Failed to load requests.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRequests();

    return () => {
      isMounted = false;
    };
  }, [currentTab, statusFilter, isAuthenticated, reloadTrigger]);

  // Listen to real-time socket updates for requests
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleUpdate = () => {
      setReloadTrigger((prev) => prev + 1);
    };

    socket.on("request:new", handleUpdate);
    socket.on("request:updated", handleUpdate);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("request:new", handleUpdate);
      socket.off("request:updated", handleUpdate);
    };
  }, [isAuthenticated]);

  // Accept a received request
  const handleAccept = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/requests/${requestId}/accept`);
      toast.success(res.data.message || "Request accepted! Product reserved.");
      setReloadTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject a received request
  const handleReject = async (requestId) => {
    const reason = window.prompt("Optional decline reason for the buyer:");
    if (reason === null) return; // user cancelled prompt

    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/requests/${requestId}/reject`, {
        rejectionReason: reason,
      });
      toast.info(res.data.message || "Request declined.");
      setReloadTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to decline request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Complete a deal (Mark as Sold)
  const handleComplete = async (requestId) => {
    if (
      !window.confirm(
        "Confirm that this purchase/deal has been completed in person? This will mark the listing as SOLD."
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/requests/${requestId}/complete`);
      toast.success(res.data.message || "Deal completed! Product marked as sold.");
      setReloadTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete transaction.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cancel a sent request (Buyer)
  const handleCancel = async (requestId) => {
    if (!window.confirm("Are you sure you want to withdraw this purchase request?")) {
      return;
    }

    try {
      setActionLoadingId(requestId);
      const res = await api.patch(`/requests/${requestId}/cancel`);
      toast.info(res.data.message || "Purchase request cancelled.");
      setReloadTrigger((prev) => prev + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open chat with participant regarding this product
  const handleChat = async (productId) => {
    try {
      const res = await api.post(`/chats/product/${productId}`);
      const conversationId = res.data.conversation?._id;
      if (conversationId) {
        navigate(`/chats/${conversationId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to open conversation.");
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Pending Response
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Accepted / Reserved
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
            ✅ Deal Completed (Sold)
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
            Declined
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const activeList = currentTab === "received" ? receivedRequests : sentRequests;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navigation */}
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
              to="/notifications"
              className="relative rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
              title="Notifications"
            >
              <span>🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Purchase & Sale Requests
            </h1>
            <p className="text-sm text-slate-500">
              Manage buyers wanting to purchase your items and track orders you have sent.
            </p>
          </div>

          <Link
            to="/create-listing"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Post New Item
          </Link>
        </div>

        {/* Tab Switcher (Received vs Sent) */}
        <div className="mt-8 flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:w-fit">
          <button
            type="button"
            onClick={() => setTab("received")}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              currentTab === "received"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📥 Received Requests</span>
            {pendingCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  currentTab === "received"
                    ? "bg-white text-indigo-700"
                    : "bg-red-500 text-white"
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("sent")}
            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              currentTab === "sent"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📤 My Sent Requests</span>
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Pending" },
            { id: "accepted", label: "Accepted / Reserved" },
            { id: "completed", label: "Completed" },
            { id: "rejected", label: "Declined" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatus(pill.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                statusFilter === pill.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="mt-6">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              Loading requests...
            </div>
          ) : activeList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <span className="text-4xl">
                {currentTab === "received" ? "📥" : "📤"}
              </span>
              <h3 className="mt-3 text-lg font-bold text-slate-800">
                {currentTab === "received"
                  ? "No received requests"
                  : "No sent requests"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {currentTab === "received"
                  ? "When students want to purchase your listed items, their requests will appear here."
                  : "Explore the campus marketplace and tap 'Send Purchase Request' on any item you need."}
              </p>
              <Link
                to="/"
                className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeList.map((req) => {
                const otherParty = currentTab === "received" ? req.buyer : req.seller;
                const product = req.product;

                return (
                  <div
                    key={req._id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left: Product & Party Info */}
                      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start">
                        {/* Product Thumbnail */}
                        <Link
                          to={`/products/${product?._id}`}
                          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 sm:h-28 sm:w-28"
                        >
                          {product?.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </Link>

                        {/* Text Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusBadge(req.status)}
                            <span className="text-xs text-slate-400">
                              {new Date(req.createdAt).toLocaleString([], {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          </div>

                          <Link
                            to={`/products/${product?._id}`}
                            className="mt-1 block font-bold text-slate-900 hover:text-indigo-600 text-lg"
                          >
                            {product?.title || "Marketplace Product"}
                          </Link>

                          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                            <span>
                              Agreed Price:{" "}
                              <strong className="text-slate-900 text-base">
                                {formatPrice(req.offerPrice)}
                              </strong>
                            </span>
                            {req.proposedLocation && (
                              <span className="flex items-center gap-1 text-slate-600">
                                📍 Meetup: <strong>{req.proposedLocation}</strong>
                              </span>
                            )}
                          </div>

                          {/* Note / Message */}
                          {req.message && (
                            <div className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700">
                              <span className="font-semibold text-slate-500">
                                Note:{" "}
                              </span>
                              "{req.message}"
                            </div>
                          )}

                          {/* Rejection Reason if any */}
                          {req.rejectionReason && (
                            <div className="mt-2 rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700">
                              <span className="font-semibold">Decline reason: </span>
                              {req.rejectionReason}
                            </div>
                          )}

                          {/* Other Party Info (Buyer or Seller) */}
                          <div className="mt-3 flex items-center gap-2.5 border-t border-slate-100 pt-3">
                            <Link
                              to={`/users/${otherParty?._id || otherParty?.id}`}
                              className="flex items-center gap-2 hover:opacity-80"
                            >
                              <div className="h-7 w-7 overflow-hidden rounded-full bg-indigo-100">
                                {otherParty?.avatar ? (
                                  <img
                                    src={otherParty.avatar}
                                    alt={otherParty.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-xs font-bold text-white">
                                    {getInitials(otherParty?.name)}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-semibold text-slate-800">
                                {currentTab === "received" ? "Buyer:" : "Seller:"}{" "}
                                {otherParty?.name || "Campus Member"}
                              </span>
                            </Link>

                            {otherParty?.department && (
                              <span className="text-xs text-slate-400">
                                • {otherParty.department}
                              </span>
                            )}
                            {otherParty?.phone && (
                              <a
                                href={`tel:${otherParty.phone}`}
                                className="text-xs text-indigo-600 hover:underline"
                              >
                                📞 {otherParty.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0 lg:flex-col lg:items-end">
                        {/* SELLER ACTIONS */}
                        {currentTab === "received" && (
                          <>
                            {req.status === "pending" && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAccept(req._id)}
                                  disabled={actionLoadingId === req._id}
                                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {actionLoadingId === req._id
                                    ? "Processing..."
                                    : "✓ Accept & Reserve"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(req._id)}
                                  disabled={actionLoadingId === req._id}
                                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </div>
                            )}

                            {req.status === "accepted" && (
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleComplete(req._id)}
                                  disabled={actionLoadingId === req._id}
                                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  {actionLoadingId === req._id
                                    ? "Updating..."
                                    : "Mark as Sold (Complete Deal)"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(req._id)}
                                  disabled={actionLoadingId === req._id}
                                  className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                >
                                  Release Reservation
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {/* BUYER ACTIONS */}
                        {currentTab === "sent" && (
                          <>
                            {req.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleCancel(req._id)}
                                disabled={actionLoadingId === req._id}
                                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                {actionLoadingId === req._id
                                  ? "Cancelling..."
                                  : "Withdraw Request"}
                              </button>
                            )}

                            {req.status === "accepted" && (
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="text-xs font-semibold text-emerald-700">
                                  Meet seller to inspect & pay!
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCancel(req._id)}
                                  disabled={actionLoadingId === req._id}
                                  className="text-xs text-rose-600 hover:underline"
                                >
                                  Cancel this order
                                </button>
                              </div>
                            )}
                          </>
                        )}

                        {/* Common action: Chat with other party */}
                        {product?._id && (
                          <button
                            type="button"
                            onClick={() => handleChat(product._id)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                          >
                            💬 Chat about Item
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
