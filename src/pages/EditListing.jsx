
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const categories = [
  { value: "books", label: "Books" },
  { value: "electronics", label: "Electronics" },
  { value: "hostel-essentials", label: "Hostel essentials" },
  { value: "clothing", label: "Clothing" },
  { value: "furniture", label: "Furniture" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

const conditions = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

const listingTypes = [
  { value: "sale", label: "Sell" },
  { value: "rent", label: "Rent" },
  { value: "exchange", label: "Exchange" },
  { value: "donation", label: "Donate" },
];

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const listingType = watch("listingType");

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const item = response.data.product;

        if (!item) {
          throw new Error("Product data was not returned.");
        }

        setProduct(item);
        setExistingImages(item.images || []);

        reset({
          title: item.title || "",
          description: item.description || "",
          listingType: item.listingType || "sale",
          price: item.price ?? 0,
          category: item.category || "books",
          condition: item.condition || "good",
          location: item.location || "",
        });
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Unable to load this listing."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isAuthenticated, token, reset]);

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (existingImages.length + images.length + selectedFiles.length > 5) {
      setImageError("You can have a maximum of 5 images.");
      event.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (selectedFiles.some((file) => !allowedTypes.includes(file.type))) {
      setImageError("Only JPG, PNG, and WebP images are allowed.");
      event.target.value = "";
      return;
    }

    if (selectedFiles.some((file) => file.size > 5 * 1024 * 1024)) {
      setImageError("Each image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setImages((previous) => [...previous, ...selectedFiles]);
    setImageError("");
    event.target.value = "";
  };

  const removeNewImage = (indexToRemove) => {
    setImages((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
    setImageError("");
  };

  const removeExistingImage = (indexToRemove) => {
    setExistingImages((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
    setImageError("");
  };

  const onSubmit = async (data) => {
    if (!token || !isAuthenticated) {
      toast.error("Please log in to edit a listing.");
      navigate("/login");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("title", data.title.trim());
      formData.append("description", data.description.trim());
      formData.append("listingType", data.listingType);
      formData.append("category", data.category);
      formData.append("condition", data.condition);
      formData.append("location", data.location.trim());
      formData.append(
        "price",
        String(
          data.listingType === "sale" || data.listingType === "rent"
            ? data.price
            : 0
        )
      );

      // Keep existing images that the seller has not removed.
      // New images are uploaded to Cloudinary by the backend.
      formData.append("existingImages", JSON.stringify(existingImages));

      images.forEach((image) => {
        formData.append("images", image);
      });

      await api.patch(`/products/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Listing updated successfully!");
      navigate("/my-listings");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to update listing. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Login required</h1>
        <p className="mt-2 text-slate-600">
          Please log in before editing a listing.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-3 text-white"
        >
          Go to login
        </Link>
      </main>
    );
  }

  if (loading) {
    return <p className="py-20 text-center">Loading listing...</p>;
  }

  if (!product) {
    return (
      <main className="px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Listing unavailable</h1>
        <Link
          to="/my-listings"
          className="mt-4 inline-block text-indigo-600"
        >
          Back to My Listings
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/my-listings"
          className="text-sm font-semibold text-indigo-600"
        >
          ← Back to My Listings
        </Link>

        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Edit Listing
          </h1>
          <p className="mt-2 text-slate-500">
            Update your product information and photos.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="text-sm font-semibold">Product title</label>
              <input
                className={inputClass}
                {...register("title", {
                  required: "Product title is required.",
                  minLength: {
                    value: 3,
                    message: "Title must contain at least 3 characters.",
                  },
                  maxLength: {
                    value: 100,
                    message: "Title cannot exceed 100 characters.",
                  },
                })}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold">Description</label>
              <textarea
                rows={4}
                className={inputClass}
                {...register("description", {
                  required: "Description is required.",
                  minLength: {
                    value: 10,
                    message: "Description must contain at least 10 characters.",
                  },
                  maxLength: {
                    value: 2000,
                    message: "Description cannot exceed 2000 characters.",
                  },
                })}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold">Listing type</label>
              <select className={inputClass} {...register("listingType")}>
                {listingTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {(listingType === "sale" || listingType === "rent") && (
              <div>
                <label className="text-sm font-semibold">Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  {...register("price", {
                    required: "Price is required.",
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: "Price cannot be negative.",
                    },
                    validate: (value) =>
                      Number.isFinite(value) || "Enter a valid price.",
                  })}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.price.message}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">Category</label>
                <select className={inputClass} {...register("category")}>
                  {categories.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold">Condition</label>
                <select className={inputClass} {...register("condition")}>
                  {conditions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold">Campus location</label>
              <input
                className={inputClass}
                {...register("location", {
                  required: "Location is required.",
                  maxLength: {
                    value: 100,
                    message: "Location cannot exceed 100 characters.",
                  },
                })}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.location.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold">
                Current photos
              </label>

              {existingImages.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  No existing photos.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {existingImages.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative">
                      <img
                        src={url}
                        alt={`Existing product ${index + 1}`}
                        className="h-32 w-full rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute right-2 top-2 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-red-600 shadow"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold">
                Add new photos
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
                className="mt-2 block w-full rounded-xl border border-slate-300 p-3 text-sm"
              />
              <p className="mt-2 text-xs text-slate-500">
                Up to 5 photos total. JPG, PNG or WebP, max 5 MB each.
                Removing an existing photo removes it from this listing.
              </p>

              {imageError && (
                <p className="mt-2 text-sm text-red-600">{imageError}</p>
              )}

              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <div
                      key={`${image.name}-${index}`}
                      className="relative"
                    >
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`New product ${index + 1}`}
                        className="h-32 w-full rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute right-2 top-2 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-red-600 shadow"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving changes..." : "Save Changes"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default EditListing;
