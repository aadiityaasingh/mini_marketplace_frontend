
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { socket } from "../api/socket";

function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  // Add a message only if its MongoDB ID isn't already present.
  const addMessageIfNew = (newMessage) => {
    setMessages((previousMessages) => {
      const alreadyExists = previousMessages.some(
        (message) => String(message._id) === String(newMessage._id)
      );

      if (alreadyExists) return previousMessages;

      return [...previousMessages, newMessage];
    });
  };

  // Connect to Socket.IO and join the authorized conversation room.
  useEffect(() => {
    if (!conversationId) return;

    const handleNewMessage = (message) => {
      if (
        String(message.conversation?._id || message.conversation) !==
        String(conversationId)
      ) {
        return;
      }

      addMessageIfNew(message);
    };

    const handleConnect = () => {
      socket.emit("join-conversation", conversationId, (response) => {
        if (!response?.success) {
          console.error(
            "Unable to join chat room:",
            response?.message
          );
        }
      });
    };

    socket.on("new-message", handleNewMessage);
    socket.on("connect", handleConnect);

    if (!socket.connected) {
      socket.connect();
    } else {
      handleConnect();
    }

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("connect", handleConnect);
      socket.disconnect();
    };
  }, [conversationId]);

  // Load conversation details and existing message history.
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

        // Merge history with any messages received while loading.
        setMessages((previousMessages) => {
          const merged = new Map();

          history.forEach((message) => {
            merged.set(String(message._id), message);
          });

          previousMessages.forEach((message) => {
            merged.set(String(message._id), message);
          });

          return Array.from(merged.values()).sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
          );
        });
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

      // The socket event and REST response may contain the same message.
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

  const buyerId =
    typeof conversation.buyer === "object"
      ? conversation.buyer?._id
      : conversation.buyer;

  const currentUserId = user?._id || user?.id;

  const otherPerson =
    String(buyerId) === String(currentUserId)
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
              const senderId =
                typeof message.sender === "object"
                  ? message.sender?._id
                  : message.sender;

              const isMine =
                String(senderId) === String(currentUserId);

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

                    <p
                      className={`mt-1 text-right text-xs ${
                        isMine ? "text-indigo-100" : "text-slate-500"
                      }`}
                    >
                      {message.createdAt
                        ? new Date(message.createdAt).toLocaleString(
                            "en-IN",
                            {
                              dateStyle: "short",
                              timeStyle: "short",
                            }
                          )
                        : ""}
                    </p>
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
