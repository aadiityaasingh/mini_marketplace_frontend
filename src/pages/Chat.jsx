
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { socket } from "../api/socket";

function getId(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
}

function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const currentUserId = getId(user?._id || user?.id);

  // Insert a message only once, or merge newer readBy information.
  const addMessageIfNew = (newMessage) => {
    if (!newMessage?._id) return;

    setMessages((previousMessages) => {
      const id = String(newMessage._id);
      const index = previousMessages.findIndex(
        (message) => String(message._id) === id
      );

      if (index === -1) {
        return [...previousMessages, newMessage].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        );
      }

      const updated = [...previousMessages];
      const existing = updated[index];

      // Preserve receipt IDs when the REST response and socket
      // event contain different versions of the same message.
      const readBy = new Set([
        ...(existing.readBy || []).map(getId),
        ...(newMessage.readBy || []).map(getId),
      ]);

      updated[index] = {
        ...existing,
        ...newMessage,
        readBy: Array.from(readBy),
      };

      return updated;
    });
  };

  // Mark incoming messages as read.
  const markAsRead = async () => {
    try {
      await api.patch(`/chats/${conversationId}/read`);
    } catch (error) {
      console.error(
        "Unable to mark messages as read:",
        error.response?.data || error.message
      );
    }
  };

  // Socket connection, room membership, live messages, and receipts.
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const handleNewMessage = (message) => {
      const messageConversationId = getId(message.conversation);

      if (messageConversationId !== String(conversationId)) return;

      addMessageIfNew(message);

      const senderId = getId(message.sender);

      // Mark messages from the other participant as read while
      // this conversation is open.
      if (senderId && senderId !== currentUserId) {
        markAsRead();
      }
    };

    const handleMessagesRead = ({ conversationId: readConversationId, readerId }) => {
      if (String(readConversationId) !== String(conversationId)) return;

      const reader = getId(readerId);
      if (!reader) return;

      // The other participant read our messages.
      setMessages((previousMessages) =>
        previousMessages.map((message) => {
          const senderId = getId(message.sender);

          if (senderId !== currentUserId) return message;

          const readBy = (message.readBy || []).map(getId);

          if (readBy.includes(reader)) return message;

          return {
            ...message,
            readBy: [...(message.readBy || []), reader],
          };
        })
      );
    };

    const handleConnect = () => {
      socket.emit("join-conversation", conversationId, (response) => {
        if (!response?.success) {
          console.error(
            "Unable to join chat room:",
            response?.message
          );
          return;
        }

        // Mark earlier incoming messages as read after joining.
        markAsRead();
      });
    };

    socket.on("new-message", handleNewMessage);
    socket.on("messages-read", handleMessagesRead);
    socket.on("connect", handleConnect);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("messages-read", handleMessagesRead);
      socket.off("connect", handleConnect);
    };
  }, [conversationId, currentUserId]);

  // Load conversation details and message history.
  useEffect(() => {
    let cancelled = false;

    const loadChat = async () => {
      try {
        setLoading(true);

        const [conversationsResponse, messagesResponse] =
          await Promise.all([
            api.get("/chats"),
            api.get(`/chats/${conversationId}/messages`),
          ]);

        if (cancelled) return;

        const conversations =
          conversationsResponse.data.conversations || [];

        const currentConversation = conversations.find(
          (item) => String(item._id) === String(conversationId)
        );

        if (!currentConversation) {
          toast.error("Conversation not found.");
          setConversation(null);
          return;
        }

        setConversation(currentConversation);

        const history = messagesResponse.data.messages || [];

        setMessages((previousMessages) => {
          const merged = new Map();

          history.forEach((message) => {
            merged.set(String(message._id), message);
          });

          previousMessages.forEach((message) => {
            const id = String(message._id);
            const existing = merged.get(id);

            if (existing) {
              merged.set(id, {
                ...existing,
                ...message,
                readBy: Array.from(
                  new Set([
                    ...(existing.readBy || []).map(getId),
                    ...(message.readBy || []).map(getId),
                  ])
                ),
              });
            } else {
              merged.set(id, message);
            }
          });

          return Array.from(merged.values()).sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
          );
        });

        // Mark messages already received as read.
        await api.patch(`/chats/${conversationId}/read`);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error.response?.data?.message ||
              "Unable to load this conversation."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadChat();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (event) => {
    event.preventDefault();

    const messageText = text.trim();

    if (!messageText || sending) return;

    try {
      setSending(true);

      const response = await api.post(
        `/chats/${conversationId}/messages`,
        { text: messageText }
      );

      const savedMessage = response.data.data;

      addMessageIfNew(savedMessage);
      setText("");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to send your message."
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading conversation...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-600">Conversation unavailable.</p>
        <Link
          to="/chats"
          className="mt-4 inline-block text-indigo-600 hover:underline"
        >
          Back to chats
        </Link>
      </div>
    );
  }

  const buyerId = getId(conversation.buyer);

  const otherPerson =
    buyerId === currentUserId
      ? conversation.seller
      : conversation.buyer;

  const otherPersonName =
    typeof otherPerson === "object"
      ? otherPerson?.name
      : "Campus member";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b bg-white px-5 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {otherPersonName || "Campus member"}
            </h1>

            <p className="text-sm text-slate-500">
              {conversation.product?.title || "Marketplace conversation"}
            </p>
          </div>

          <Link
            to="/chats"
            className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            All chats
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border bg-white p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-semibold text-slate-700">
                Start the conversation
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Ask the seller about the item.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const senderId = getId(message.sender);
              const isMine = senderId === currentUserId;

              const readBy = (message.readBy || []).map(getId);
              const isRead =
                isMine &&
                readBy.some(
                  (readerId) =>
                    readerId && readerId !== currentUserId
                );

              return (
                <div
                  key={message._id}
                  className={`flex ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                      isMine
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.text}
                    </p>

                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-xs ${
                        isMine ? "text-indigo-100" : "text-slate-500"
                      }`}
                    >
                      <span>
                        {message.createdAt
                          ? new Date(message.createdAt).toLocaleString(
                              "en-IN",
                              {
                                dateStyle: "short",
                                timeStyle: "short",
                              }
                            )
                          : ""}
                      </span>

                      {isMine && (
                        <span
                          title={isRead ? "Read" : "Sent"}
                          aria-label={isRead ? "Read" : "Sent"}
                          className={`ml-1 font-bold ${
                            isRead ? "text-cyan-200" : "text-indigo-100"
                          }`}
                        >
                          {isRead ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={handleSend}
          className="mt-4 flex items-end gap-3 rounded-2xl border bg-white p-3"
        >
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a message..."
            maxLength={2000}
            rows={2}
            className="min-w-0 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-indigo-500"
          />

          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Chat;
