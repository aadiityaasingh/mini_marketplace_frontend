import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function ProductDetails() {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [contactingSeller, setContactingSeller] = useState(false);

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
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to start a conversation. Please try again.",
      );
    } finally {
      setContactingSeller(false);
    }
  };

  const isLoggedIn =
    Boolean(token) || Boolean(user) || Boolean(localStorage.getItem("token"));

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setSelectedImage(0);

        const response = await api.get(`/products/${id}`);
        setProduct(response.data.product);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load this listing. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Check whether this product is already in the user's wishlist.
  useEffect(() => {
    let cancelled = false;

    const checkWishlist = async () => {
      const savedToken = token || localStorage.getItem("token");

      if (!savedToken) {
        setIsWishlisted(false);
        return;
      }

      try {
        const response = await api.get("/wishlist", {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (cancelled) return;

        const wishlistItems = response.data.wishlist || [];

        const exists = wishlistItems.some((item) => {
          const wishlistProduct = item.product || item;
          const productId = wishlistProduct._id || wishlistProduct.product?._id;

          return String(productId) === String(id);
        });

        setIsWishlisted(exists);
      } catch (err) {
        if (!cancelled) {
          setIsWishlisted(false);
        }
      }
    };

    checkWishlist();

    return () => {
      cancelled = true;
    };
  }, [id, token, user]);

  const handleWishlistToggle = async () => {
    const savedToken = token || localStorage.getItem("token");

    if (!savedToken) {
      toast.info("Please log in to use your wishlist.");
      return;
    }

    if (wishlistLoading) return;

    try {
      setWishlistLoading(true);

      if (isWishlisted) {
        await api.delete(`/wishlist/${id}`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        setIsWishlisted(false);
        toast.success("Removed from your wishlist.");
      } else {
        await api.post(
          `/wishlist/${id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          },
        );

        setIsWishlisted(true);
        toast.success("Added to your wishlist.");
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to update your wishlist. Please try again.";

      if (
        err.response?.status === 409 ||
        message.toLowerCase().includes("already")
      ) {
        setIsWishlisted(true);
        toast.info("This item is already in your wishlist.");
      } else {
        toast.error(message);
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const getPriceLabel = () => {
    if (product.listingType === "sale") {
      return formatPrice(product.price);
    }

    if (product.listingType === "rent") {
      return `${formatPrice(product.price)} (rent)`;
    }

    if (product.listingType === "exchange") {
      return "Exchange";
    }

    return "Free";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-5">
        <h2 className="text-2xl font-bold text-slate-900">
          Listing unavailable
        </h2>

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
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-xl font-extrabold text-indigo-700">
            🎓 MIT Mini Market
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <Link
                to="/wishlist"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                ❤️ Wishlist
              </Link>
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
        <div className="mb-6 text-sm text-slate-500">
          <Link to="/" className="hover:text-indigo-600">
            Marketplace
          </Link>
          <span className="mx-2">/</span>
          <span className="capitalize">
            {product.category?.replaceAll("-", " ")}
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <section>
            <div className="flex h-80 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white sm:h-[460px]">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]}
                  alt={product.title}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-8xl">📦</span>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    aria-label={`View image ${index + 1}`}
                    aria-pressed={selectedImage === index}
                    className={`h-20 w-20 overflow-hidden rounded-xl border-2 bg-white ${
                      selectedImage === index
                        ? "border-indigo-600"
                        : "border-slate-200"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold capitalize text-indigo-700">
                {product.category?.replaceAll("-", " ")}
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold capitalize text-slate-700">
                {product.listingType}
              </span>

              <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold capitalize text-green-700">
                {product.condition?.replaceAll("-", " ")}
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              {product.title}
            </h1>

            <p className="mt-5 text-3xl font-extrabold text-indigo-700">
              {getPriceLabel()}
            </p>

            <div className="my-7 border-t border-slate-200" />

            <h2 className="text-lg font-bold text-slate-900">Description</h2>

            <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
              {product.description}
            </p>

            <div className="mt-7 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Condition</p>
                <p className="mt-1 font-semibold capitalize">
                  {product.condition?.replaceAll("-", " ")}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Location</p>
                <p className="mt-1 font-semibold">
                  {product.location || "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Listed by</p>
                <p className="mt-1 font-semibold">
                  {product.seller?.name || "Campus member"}
                </p>
              </div>

              {product.createdAt && (
                <div>
                  <p className="text-sm text-slate-500">Date listed</p>
                  <p className="mt-1 font-semibold">
                    {new Date(product.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
              className={`mt-8 w-full rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isWishlisted
                  ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  : "bg-rose-600 text-white hover:bg-rose-700"
              }`}
            >
              {wishlistLoading
                ? "Updating wishlist..."
                : isWishlisted
                  ? "♥ Remove from Wishlist"
                  : "♡ Add to Wishlist"}
            </button>

            <button
              type="button"
              onClick={handleContactSeller}
              disabled={contactingSeller || !product}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {contactingSeller ? "Opening chat..." : "Contact Seller"}
            </button>

            <div className="mt-5 rounded-2xl bg-indigo-50 p-4">
              <p className="font-semibold text-indigo-900">
                Interested in this item?
              </p>
              <p className="mt-1 text-sm leading-6 text-indigo-800">
                Seller messaging will be available when we implement the contact
                feature.
              </p>
            </div>

            <Link
              to="/"
              className="mt-6 block rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold transition hover:bg-slate-50"
            >
              Continue browsing
            </Link>
          </section>
        </div>
      </main>

      <footer className="mt-10 border-t border-slate-200 bg-white px-5 py-7 text-center text-sm text-slate-500">
        MIT Mini Market · A marketplace for your campus community
      </footer>
    </div>
  );
}

export default ProductDetails;
