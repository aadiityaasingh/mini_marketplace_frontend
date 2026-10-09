import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

function CreateListing() {
  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState("");
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      listingType: "sale",
      category: "books",
      condition: "good",
    },
  });

  const listingType = watch("listingType");

  const handleImageChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (images.length + selectedFiles.length > 5) {
      setImageError("You can upload a maximum of 5 images.");
      event.target.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const invalidFile = selectedFiles.find(
      (file) => !allowedTypes.includes(file.type),
    );

    if (invalidFile) {
      setImageError("Only JPG, PNG, and WebP images are allowed.");
      event.target.value = "";
      return;
    }

    const oversizedFile = selectedFiles.find(
      (file) => file.size > 5 * 1024 * 1024,
    );

    if (oversizedFile) {
      setImageError("Each image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setImages((previous) => [...previous, ...selectedFiles]);
    setImageError("");
    event.target.value = "";
  };

  const removeImage = (indexToRemove) => {
    setImages((previous) =>
      previous.filter((_, index) => index !== indexToRemove),
    );
    setImageError("");
  };

  const onSubmit = async (data) => {
    if (!isAuthenticated || !token) {
      toast.error("Please log in to create a listing.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("title", data.title.trim());
      formData.append("description", data.description.trim());
      formData.append("listingType", data.listingType);
      formData.append("category", data.category);
      formData.append("condition", data.condition);
      formData.append("location", data.location.trim());

      if (data.listingType === "sale" || data.listingType === "rent") {
        formData.append("price", String(data.price));
      }

      images.forEach((image) => {
        formData.append("images", image);
      });

      console.log("Selected images:", images);
      console.log("Image count:", images.length);
      console.log("FormData image count:", formData.getAll("images").length);

      await api.post("/products", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Your listing has been created!");
      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to create listing. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Login required</h1>
          <p className="mt-2 text-slate-600">
            Please log in before creating a listing.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back to marketplace
        </Link>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Create a listing
          </h1>
          <p className="mt-2 text-slate-500">
            Give useful items a new home in your campus community.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-semibold">Product title</label>
              <input
                placeholder="e.g. Engineering mathematics textbook"
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
                placeholder="Describe the item, its usage, and any important details..."
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
              <label className="text-sm font-semibold">
                What do you want to do?
              </label>
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
                <label className="text-sm font-semibold">
                  Price (₹) {listingType === "rent" && "for rental"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter amount in rupees"
                  className={inputClass}
                  {...register("price", {
                    required: "Price is required for sale or rental listings.",
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
                placeholder="e.g. Hostel A, Library, or Academic Block"
                className={inputClass}
                {...register("location", {
                  required: "Please enter a pickup or meeting location.",
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
                Product photos (up to 5)
              </label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
                className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 text-sm"
              />

              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG or WebP. Maximum 5 MB per image.
              </p>

              {imageError && (
                <p className="mt-2 text-sm text-red-600">{imageError}</p>
              )}

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <div key={`${image.name}-${index}`} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Selected product ${index + 1}`}
                        className="h-32 w-full rounded-xl border border-slate-200 object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-bold text-red-600 shadow"
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
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Publishing..." : "Publish listing"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateListing;
