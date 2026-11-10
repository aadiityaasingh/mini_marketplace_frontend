import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

const CAMPUS_LOCATIONS = [
  "Central Library Entrance",
  "Campus Canteen / Food Court",
  "Student Center",
  "Main Campus Gate",
  "Hostel 4 Ground Floor",
  "Hostel Block B",
  "Sports Complex / Ground",
  "Department Building Lobby",
  "Other",
];

export default function ProductDetails() {
  const { id } = useParams();
  const { user, token, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [contactingSeller, setContactingSeller] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Purchase Request States
  const [buyerRequest, setBuyerRequest] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    offerPrice: "",
    proposedLocation: "Central Library Entrance",
    message: "",
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Report Listing States
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // Check if current user is the seller
  const isSeller =
    user &&
    product &&
    (String(product.seller?._id || product.seller?.id || product.seller) ===
      String(user._id || user.id));

  const isAdmin = user?.role === "admin";

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setSelectedImage(0);

        const response = await api.get(`/products/${id}`);
        const prod = response.data.product;
        setProduct(prod);

        // Pre-fill offer price with listing price
        if (prod) {
          setRequestForm((prev) => ({
            ...prev,
            offerPrice: prod.price || "",
          }));
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load this listing. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Check buyer's active request for this product
  useEffect(() => {
    let cancelled = false;

    const checkRequest = async () => {
      if (!isAuthenticated || !id) return;
      try {
        const res = await api.get(`/requests/product/${id}/status`);
        if (!cancelled) {
          setBuyerRequest(res.data.request || null);
        }
      } catch {
        // ignore
      }
    };

    checkRequest();

    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  // Check wishlist
  useEffect(() => {
    let cancelled = false;

    const checkWishlist = async () => {
      if (!isAuthenticated) {
        setIsWishlisted(false);
        return;
      }

      try {
        const response = await api.get("/wishlist");
        if (cancelled) return;

        const wishlistItems = response.data.wishlist || [];
        const exists = wishlistItems.some((item) => {
          const wishlistProduct = item.product || item;
          const productId = wishlistProduct._id || wishlistProduct.product?._id;
          return String(productId) === String(id);
        });

        setIsWishlisted(exists);
      } catch {
        if (!cancelled) {
          setIsWishlisted(false);
        }
      }
    };

    checkWishlist();

    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  // Fetch related products
  useEffect(() => {
    let isMounted = true;
    const fetchRelated = async () => {
      try {
        setRelatedLoading(true);
        const res = await api.get(`/products/${id}/related`);
        if (isMounted) {
          setRelatedProducts(res.data.products || []);
        }
      } catch (err) {
        console.error("Failed to load related products:", err);
      } finally {
        if (isMounted) setRelatedLoading(false);
      }
    };

    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Wishlist toggle
  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.info("Please log in to use your wishlist.");
      navigate("/login");
      return;
    }

    if (wishlistLoading) return;

    try {
      setWishlistLoading(true);

      if (isWishlisted) {
        await api.delete(`/wishlist/${id}`);
        setIsWishlisted(false);
        toast.info("Removed from your wishlist.");
      } else {
        await api.post(`/wishlist/${id}`);
        setIsWishlisted(true);
        toast.success("Saved to your wishlist!");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Unable to update your wishlist."
      );
    } finally {
      setWishlistLoading(false);
    }
  };

  // Contact seller via chat
  const handleContactSeller = async () => {
    if (!isAuthenticated) {
      toast.info("Please log in to contact the seller.");
      navigate("/login");
      return;
    }

    if (!product?._id) return;

    try {
      setContactingSeller(true);
      const response = await api.post(`/chats/product/${product._id}`);
      const conversationId = response.data.conversation?._id;

      if (!conversationId) {
        throw new Error("Conversation ID was not returned.");
      }

      navigate(`/chats/${conversationId}`);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to start a conversation. Please try again."
      );
    } finally {
      setContactingSeller(false);
    }
  };

  // Submit Purchase Request
  const handlePurchaseRequestSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please log in to send a purchase request.");
      navigate("/login");
      return;
    }

    try {
      setSubmittingRequest(true);
      const res = await api.post("/requests", {
        productId: product._id,
        offerPrice: requestForm.offerPrice,
        proposedLocation: requestForm.proposedLocation,
        message: requestForm.message,
      });

      toast.success("Purchase request sent to seller!");
      setBuyerRequest(res.data.request);
      setRequestModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Submit Report
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please log in to report a listing.");
      navigate("/login");
      return;
    }

    try {
      setSubmittingReport(true);
      await api.post("/reports", {
        productId: product._id,
        reason: reportReason,
        description: reportDescription,
      });
      toast.success("Report submitted to campus administrators for review.");
      setReportModalOpen(false);
      setReportDescription("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setSubmittingReport(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const getPriceDisplay = () => {
    if (!product) return "";
    if (product.listingType === "sale") return formatPrice(product.price);
    if (product.listingType === "rent") return `${formatPrice(product.price)} (rent)`;
    if (product.listingType === "exchange") return "Exchange";
    return "Free / Donation";
  };

  const isLoggedIn = Boolean(token) || Boolean(user);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <div className="h-16 border-b border-slate-200 bg-white" />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="h-96 w-full rounded-3xl bg-slate-200 animate-pulse" />
              <div className="mt-8 h-40 w-full rounded-3xl bg-slate-200 animate-pulse" />
            </div>
            <div className="flex flex-col gap-6 lg:col-span-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 animate-pulse">
                <div className="h-4 w-24 rounded-md bg-slate-200" />
                <div className="mt-4 h-8 w-3/4 rounded-md bg-slate-200" />
                <div className="mt-4 h-10 w-1/2 rounded-md bg-slate-200" />
                <div className="mt-8 h-32 rounded-2xl bg-slate-100" />
                <div className="mt-8 h-12 rounded-2xl bg-slate-200" />
              </div>
            </div>
          </div>
  
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-5">
        <h2 className="text-2xl font-bold text-slate-900">Listing unavailable</h2>
        <p className="text-center text-slate-600">
          {error || "This product could not be found."}
        </p>
        <Link
          to="/"
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Back to marketplace
        </Link>
      </div>
    );
  }

  const images = product.images || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-xl font-extrabold text-indigo-700">
            🎓 MIT Mini Market
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="rounded-xl bg-purple-50 border border-purple-200 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100"
                  >
                    ⚡ Admin Panel
                  </Link>
                )}
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
                  to="/requests"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                >
                  Requests
                </Link>
                <Link
                  to="/wishlist"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                >
                  ❤️ Wishlist
                </Link>
                <Link
                  to="/profile"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
                >
                  👤 Profile
                </Link>
              </>
            )}

            <Link
              to="/"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              ← Marketplace
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
        {/* Breadcrumb */}
        <div className="mb-6 text-sm text-slate-500">
          <Link to="/" className="hover:text-indigo-600">
            Marketplace
          </Link>{" "}
          / <span className="capitalize">{product.category}</span> /{" "}
          <span className="text-slate-800">{product.title}</span>
        </div>

        {/* Product Status Alert Banners */}
        {product.status === "sold" && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900 flex items-center gap-3">
            <span className="text-2xl">🛑</span>
            <div>
              <h3 className="font-bold">Item Sold</h3>
              <p className="text-sm text-red-700">
                This item has been purchased and is no longer available.
              </p>
            </div>
          </div>
        )}

        {product.status === "reserved" && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <h3 className="font-bold">Currently Reserved</h3>
              <p className="text-sm text-amber-700">
                The seller has accepted a purchase request for this listing. It is temporarily on hold.
              </p>
            </div>
          </div>
        )}

        {/* Buyer Existing Request Notification Banner */}
        {buyerRequest && (
          <div
            className={`mb-6 rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              buyerRequest.status === "accepted"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {buyerRequest.status === "accepted" ? "🎉" : "🕒"}
              </span>
              <div>
                <h3 className="font-bold">
                  {buyerRequest.status === "accepted"
                    ? "Purchase Request Accepted!"
                    : "Your Purchase Request is Pending"}
                </h3>
                <p className="text-sm opacity-90">
                  {buyerRequest.status === "accepted"
                    ? "The seller has reserved this item for you. Reach out to arrange the meetup!"
                    : `Offered: ${formatPrice(buyerRequest.offerPrice)} | Meetup: ${buyerRequest.proposedLocation || "On Campus"}`}
                </p>
              </div>
            </div>

            <Link
              to="/requests?tab=sent"
              className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-sm border border-slate-200 hover:bg-slate-50 w-fit"
            >
              Track in Requests →
            </Link>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Left Column: Image Gallery */}
          <section className="lg:col-span-7">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:aspect-4/3">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.title}
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  No images provided
                </div>
              )}

              {/* Status Tag on Image */}
              <span
                className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  product.status === "active"
                    ? "bg-emerald-600 text-white"
                    : product.status === "sold"
                    ? "bg-slate-800 text-white"
                    : product.status === "reserved"
                    ? "bg-amber-500 text-white"
                    : "bg-indigo-600 text-white"
                }`}
              >
                {product.status}
              </span>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image + index}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition ${
                      selectedImage === index
                        ? "border-indigo-600 ring-2 ring-indigo-200"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Description Card */}
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">Description</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-7 text-slate-600">
                {product.description}
              </p>
            </div>
          </section>

          {/* Right Column: Pricing & Purchase Workflow */}
          <section className="flex flex-col gap-6 lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                  {product.category}
                </span>

                {product.isFeatured && (
                  <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                    ⭐ Featured Pick
                  </span>
                )}

                <span className="ml-auto text-xs text-slate-400">
                  👀 {product.viewsCount || 1} views
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                {product.title}
              </h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                  {getPriceDisplay()}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
                  {product.condition} condition
                </span>
              </div>

              {/* Attributes Grid */}
              <div className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-6">
                <div>
                  <p className="text-xs uppercase font-semibold text-slate-400">Listing Type</p>
                  <p className="mt-1 font-semibold capitalize text-slate-800">
                    {product.listingType}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase font-semibold text-slate-400">Campus Location</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {product.location || "MIT Campus"}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase font-semibold text-slate-400">Listed By</p>
                  <Link
                    to={`/users/${product.seller?._id || product.seller}`}
                    className="mt-1 inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    <span>{product.seller?.name || "Campus student"}</span>
                    <span className="text-xs">→</span>
                  </Link>
                </div>

                <div>
                  <p className="text-xs uppercase font-semibold text-slate-400">Posted On</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {new Date(product.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-6 space-y-3">
                {/* 1. Send Purchase Request / Manage Request Button */}
                {!isSeller && (
                  <>
                    {buyerRequest ? (
                      <Link
                        to="/requests?tab=sent"
                        className="block w-full rounded-2xl bg-indigo-600 px-5 py-3.5 text-center font-bold text-white shadow-sm transition hover:bg-indigo-700"
                      >
                        {buyerRequest.status === "accepted"
                          ? "🎉 View Accepted Request"
                          : "🕒 View Pending Request"}
                      </Link>
                    ) : product.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast.info("Please log in to send a request.");
                            navigate("/login");
                            return;
                          }
                          setRequestModalOpen(true);
                        }}
                        className="w-full rounded-2xl bg-indigo-600 px-5 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-98"
                      >
                        🛒 Send Purchase Request
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="w-full rounded-2xl bg-slate-200 px-5 py-3.5 text-base font-bold text-slate-400 cursor-not-allowed"
                      >
                        {product.status === "sold"
                          ? "Listing Sold Out"
                          : "Item Currently Reserved"}
                      </button>
                    )}
                  </>
                )}

                {/* Seller Controls */}
                {isSeller && (
                  <div className="rounded-2xl bg-indigo-50/70 p-4 text-center">
                    <p className="text-sm font-bold text-indigo-900">
                      You are the seller of this listing
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Link
                        to="/requests?tab=received"
                        className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        View Incoming Requests
                      </Link>
                      <Link
                        to={`/products/${product._id}/edit`}
                        className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                )}

                {/* 2. Contact Seller via Chat Button */}
                {!isSeller && (
                  <button
                    type="button"
                    onClick={handleContactSeller}
                    disabled={contactingSeller}
                    className="w-full rounded-2xl border border-indigo-600 bg-white px-5 py-3 font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                  >
                    {contactingSeller ? "Opening Chat..." : "💬 Message Seller"}
                  </button>
                )}

                {/* 3. Wishlist Button */}
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className={`w-full rounded-2xl px-5 py-3 font-semibold transition ${
                    isWishlisted
                      ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {wishlistLoading
                    ? "Updating..."
                    : isWishlisted
                    ? "❤️ Saved in Wishlist"
                    : "🤍 Add to Wishlist"}
                </button>
              </div>

              {/* Safety notice */}
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  🛡️ Campus Deal Safety
                </p>
                <p className="mt-1">
                  Meet in busy campus spots (Library, Student Center). Inspect the item in person before completing the transaction.
                </p>
              </div>

              {/* Report Listing Button */}
              {!isSeller && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.info("Please log in to report a listing.");
                        navigate("/login");
                        return;
                      }
                      setReportModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 transition"
                  >
                    🚩 Report this listing to campus admin
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
  {/* RELATED CAMPUS LISTINGS */}
        {relatedLoading ? (
          <div className="mt-16 border-t border-slate-200 pt-10">
            <div className="h-6 w-48 rounded-md bg-slate-200 animate-pulse mb-6" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        ) : relatedProducts.length > 0 ? (
          <div className="mt-16 border-t border-slate-200 pt-10">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Similar Campus Listings
                </h2>
                <p className="text-sm text-slate-500">
                  Other items you might need from {product.category?.replaceAll("-", " ")}
                </p>
              </div>
              <Link
                to="/"
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Browse all listings →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <Link
                  key={item._id}
                  to={`/products/${item._id}`}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md"
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
                    <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-white capitalize">
                      {item.condition}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      {item.category?.replaceAll("-", " ")}
                    </p>
                    <h3 className="mt-1 line-clamp-1 font-bold text-slate-900 group-hover:text-indigo-600">
                      {item.title}
                    </h3>
                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100">
                      <span className="text-base font-extrabold text-slate-900">
                        {item.listingType === "sale" || item.listingType === "rent"
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
        ) : null}
      </main>

      {/* PURCHASE REQUEST MODAL */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Send Purchase Request
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Request to purchase "{product.title}" from {product.seller?.name || "seller"}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePurchaseRequestSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Offer Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={requestForm.offerPrice}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, offerPrice: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
                <span className="text-xs text-slate-400">
                  Listed price: {formatPrice(product.price)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Proposed Campus Meetup Spot
                </label>
                <select
                  value={requestForm.proposedLocation}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      proposedLocation: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Message / Note to Seller
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={requestForm.message}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, message: e.target.value })
                  }
                  placeholder="E.g. I am free to meet after classes at 4 PM near the Library. Let me know if that works!"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingRequest ? "Sending..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT LISTING MODAL */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Report this Listing
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Flag "{product.title}" for campus administrator review.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Reason for Report
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="inappropriate">Inappropriate / Offensive Content</option>
                  <option value="prohibited_item">Prohibited Item on Campus</option>
                  <option value="scam_fake">Suspected Scam or Fake Item</option>
                  <option value="duplicate_spam">Duplicate Listing or Spam</option>
                  <option value="other">Other Campus Guideline Violation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe why you believe this listing violates campus guidelines..."
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                >
                  {submittingReport ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
