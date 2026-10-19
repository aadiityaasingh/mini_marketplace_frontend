
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function Wishlist() {
  const { token, isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated || !token) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await api.get("/wishlist", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;

        const items = Array.isArray(data?.wishlist)
          ? data.wishlist
          : [];

        setProducts(
          items
            .filter((item) => item.product)
            .map((item) => ({
              ...item.product,
              wishlistId: item.wishlistId,
            }))
        );
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Failed to load your wishlist."
        );
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, token]);

  const handleRemove = async (productId) => {
    if (!token) {
      toast.error("Please log in to manage your wishlist.");
      return;
    }

    setRemovingId(productId);

    try {
      await api.delete(`/wishlist/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => product._id !== productId
        )
      );

      toast.success("Removed from wishlist.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to remove product."
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          My Wishlist
        </h1>

        <p className="mt-3 text-slate-600">
          Log in to view your saved products.
        </p>

        <Link
          to="/login"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Log In
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="px-6 py-20 text-center text-slate-600">
        Loading your wishlist...
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          My Wishlist ❤️
        </h1>

        <p className="mt-2 text-slate-600">
          Keep track of products you're interested in.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            Your wishlist is empty
          </h2>

          <p className="mt-2 text-slate-600">
            Browse the marketplace and save products you like.
          </p>

          <Link
            to="/"
            className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product._id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="flex h-52 items-center justify-center bg-slate-100 text-slate-400">
                  No image available
                </div>
              )}

              <div className="p-5">
                <p className="text-sm capitalize text-indigo-600">
                  {product.category} · {product.listingType}
                </p>

                <h2 className="mt-2 text-lg font-bold text-slate-900">
                  {product.title}
                </h2>

                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                  {product.description}
                </p>

                {(product.listingType === "sale" ||
                  product.listingType === "rent") && (
                  <p className="mt-3 text-lg font-bold text-slate-900">
                    ₹{product.price}
                    {product.listingType === "rent"
                      ? " / rental"
                      : ""}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    to={`/products/${product._id}`}
                    className="rounded-xl bg-indigo-600 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    View Product
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleRemove(product._id)}
                    disabled={removingId === product._id}
                    className="rounded-xl border border-red-300 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {removingId === product._id
                      ? "Removing..."
                      : "Remove ❤️"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default Wishlist;
