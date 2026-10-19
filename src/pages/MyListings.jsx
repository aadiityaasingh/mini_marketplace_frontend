
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function MyListings() {
  const { token, isAuthenticated } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  useEffect(() => {
    const fetchMyListings = async () => {
      if (!isAuthenticated || !token) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await api.get("/products/my-products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;

        const listings = Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data)
            ? data
            : [];

        setProducts(listings);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Failed to load your listings."
        );
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyListings();
  }, [isAuthenticated, token]);

  // Delete a listing after user confirmation.
  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this listing?"
    );

    if (!confirmed) return;

    if (!token) {
      toast.error("Please log in again to manage your listings.");
      return;
    }

    setDeletingId(productId);

    try {
      await api.delete(`/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => product._id !== productId
        )
      );

      toast.success("Listing removed successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to remove listing."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Update a listing's status.
  const handleStatusChange = async (product) => {
    if (!token) {
      toast.error("Please log in again to manage your listings.");
      return;
    }

    if (product.status === "removed") {
      toast.error("Removed listings cannot be updated.");
      return;
    }

    const options = [
      { label: "Available", value: "active" },
      { label: "Reserved", value: "reserved" },
      { label: "Sold", value: "sold" },
      { label: "Rented", value: "rented" },
    ];

    const selectedStatus = window.prompt(
      `Update status for "${product.title}":\n\n` +
        options
          .map((option, index) => `${index + 1}. ${option.label}`)
          .join("\n") +
        "\n\nEnter a number from 1 to 4:"
    );

    if (selectedStatus === null) return;

    const selectedOption = options[Number(selectedStatus) - 1];

    if (!selectedOption) {
      toast.error("Please enter a number from 1 to 4.");
      return;
    }

    const currentStatus = product.status || "active";

    if (selectedOption.value === currentStatus) {
      toast.info("The listing already has this status.");
      return;
    }

    // Validate the selected status against the listing type.
    if (
      selectedOption.value === "sold" &&
      product.listingType !== "sale"
    ) {
      toast.error("Only sale listings can be marked as sold.");
      return;
    }

    if (
      selectedOption.value === "rented" &&
      product.listingType !== "rent"
    ) {
      toast.error("Only rental listings can be marked as rented.");
      return;
    }

    setUpdatingStatusId(product._id);

    try {
      await api.patch(
        `/products/${product._id}/status`,
        { status: selectedOption.value },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProducts((currentProducts) =>
        currentProducts.map((item) =>
          item._id === product._id
            ? { ...item, status: selectedOption.value }
            : item
        )
      );

      toast.success("Listing status updated successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update listing status."
      );
    } finally {
      setUpdatingStatusId(null);
    }
  };

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

          <Link
            to="/create-listing"
            className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Create Your First Listing
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

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs capitalize ${
                      product.status === "active" ||
                      !product.status
                        ? "bg-green-100 text-green-700"
                        : product.status === "removed"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {(product.status || "active") === "active"
                      ? "Available"
                      : product.status}
                  </span>

                  <Link
                    to={`/products/${product._id}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View details →
                  </Link>
                </div>

                {/* Update status */}
                {product.status !== "removed" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(product)}
                    disabled={updatingStatusId === product._id}
                    className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingStatusId === product._id
                      ? "Updating status..."
                      : "Update Status"}
                  </button>
                )}

                {/* Edit and Delete actions */}
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  {product.status === "active" ||
                  !product.status ? (
                    <Link
                      to={`/products/${product._id}/edit`}
                      className="rounded-xl border border-indigo-600 px-3 py-2.5 text-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                    >
                      Edit Listing
                    </Link>
                  ) : (
                    <span className="flex items-center justify-center text-center text-sm text-slate-400">
                      Not editable
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(product._id)}
                    disabled={
                      deletingId === product._id ||
                      product.status === "removed"
                    }
                    className="rounded-xl border border-red-300 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === product._id
                      ? "Removing..."
                      : product.status === "removed"
                        ? "Removed"
                        : "Delete"}
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

export default MyListings;
