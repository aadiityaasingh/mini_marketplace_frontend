
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function MyListings() {
  const { token, isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyListings = async () => {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/products/my-products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;
        const listings = Array.isArray(data)
          ? data
          : data.products ?? data.data ?? [];

        setProducts(listings);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Failed to load your listings."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          My Listings
        </h1>
        <p className="mt-3 text-slate-600">
          Please log in to manage your listings.
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
        Loading your listings...
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            My Listings
          </h1>
          <p className="mt-2 text-slate-600">
            Manage the products you have posted.
          </p>
        </div>

        <Link
          to="/create-listing"
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          + Create Listing
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-900">
            No listings yet
          </h2>
          <p className="mt-2 text-slate-600">
            Your published products will appear here.
          </p>
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

                {product.price != null && (
                  <p className="mt-3 text-lg font-bold text-slate-900">
                    ₹{product.price}
                    {product.listingType === "rent" ? " / rental" : ""}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-700">
                    {product.status || "active"}
                  </span>

                  <Link
                    to={`/products/${product._id}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View details →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default MyListings;
