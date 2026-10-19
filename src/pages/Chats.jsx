
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function getId(value) {
  if (!value) return "";
  return typeof value === "object" ? value._id || value.id || "" : value;
}

function formatTime(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleString([], {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function Chats() {
  const { user, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/chats");

      setConversations(response.data.conversations || []);
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load your conversations.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, loadConversations]);

  const currentUserId = getId(user);

  const getOtherPerson = (conversation) => {
    const buyerId = getId(conversation.buyer);

    return buyerId === currentUserId
      ? conversation.seller
      : conversation.buyer;
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Your Chats</h1>
        <p className="mt-3 text-gray-600">
          Please log in to view your conversations.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Chats</h1>
          <p className="mt-2 text-gray-600">
            Manage conversations with buyers and sellers.
          </p>
        </div>

        <button
          type="button"
          onClick={loadConversations}
          disabled={loading}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">
          Loading conversations...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            type="button"
            onClick={loadConversations}
            className="mt-4 rounded-lg bg-red-600 px-5 py-2 font-medium text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
            </svg>
          </div>

          <h2 className="mt-5 text-xl font-semibold text-gray-900">
            No conversations yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-gray-600">
            When you contact a seller or someone messages you about a listing,
            your conversations will appear here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Explore Listings
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {conversations.map((conversation) => {
            const otherPerson = getOtherPerson(conversation);
            const product = conversation.product;

            return (
              <Link
                key={conversation._id}
                to={`/chats/${conversation._id}`}
                className="flex items-center gap-4 border-b border-gray-100 p-4 transition last:border-b-0 hover:bg-gray-50 sm:p-5"
              >
                {product?.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.title || "Product"}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-2xl">
                    💬
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="truncate font-semibold text-gray-900">
                      {otherPerson?.name || "Marketplace user"}
                    </h2>

                    <span className="text-xs text-gray-500">
                      {formatTime(
                        conversation.lastMessageAt ||
                          conversation.updatedAt
                      )}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-sm text-indigo-700">
                    {product?.title || "Listing"}
                  </p>

                  <p className="mt-1 truncate text-sm text-gray-600">
                    {conversation.lastMessage || "Start your conversation"}
                  </p>
                </div>

                <span className="text-xl text-gray-400" aria-hidden="true">
                  ›
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
