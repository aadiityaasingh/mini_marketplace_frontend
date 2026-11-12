/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical & Electronics",
  "Chemical Engineering",
  "Biotechnology",
  "Design / Architecture",
  "Business & Management",
  "Arts & Science",
  "Other",
];

const YEARS = [
  "1st Year (Freshman)",
  "2nd Year (Sophomore)",
  "3rd Year (Junior)",
  "4th Year (Senior)",
  "Postgraduate / Masters",
  "PhD / Doctoral",
  "Faculty / Staff",
  "Alumni",
];

export default function Profile() {
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab state from URL or default to 'overview'
  const currentTab = searchParams.get("tab") || "overview";
  const setTab = (tab) => {
    setSearchParams({ tab });
  };

  const fileInputRef = useRef(null);

  // Profile data & statistics
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    wishlistCount: 0,
  });

  // Edit personal & contact info form
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    department: "",
    year: "",
    hostel: "",
    roomNo: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    preferredContactMethod: "chat",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  // User Listings tab
  const [myListings, setMyListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingListingId, setDeletingListingId] = useState(null);

  // User Wishlist tab
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [removingWishlistId, setRemovingWishlistId] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Please log in to view your profile.");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Load user profile and stats
  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/me");
      const userData = res.data.user;
      setStats(res.data.stats || {});
      updateUser(userData);

      setFormData({
        name: userData.name || "",
        bio: userData.bio || "",
        department: userData.department || "",
        year: userData.year || "",
        hostel: userData.hostel || "",
        roomNo: userData.roomNo || "",
        phone: userData.phone || "",
        whatsapp: userData.whatsapp || "",
        instagram: userData.instagram || "",
        preferredContactMethod: userData.preferredContactMethod || "chat",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, fetchProfileData]);

  // Load Listings when tab is clicked
  useEffect(() => {
    if (currentTab === "listings" && isAuthenticated) {
      const fetchListings = async () => {
        try {
          setListingsLoading(true);
          const res = await api.get("/products/my-products");
          const data = res.data;
          setMyListings(Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : []);
        } catch {
          toast.error("Failed to load your listings.");
        } finally {
          setListingsLoading(false);
        }
      };
      fetchListings();
    }
  }, [currentTab, isAuthenticated]);

  // Load Wishlist when tab is clicked
  useEffect(() => {
    if (currentTab === "wishlist" && isAuthenticated) {
      const fetchWishlist = async () => {
        try {
          setWishlistLoading(true);
          const res = await api.get("/wishlist");
          const items = Array.isArray(res.data?.wishlist) ? res.data.wishlist : [];
          setWishlistItems(
            items
              .filter((item) => item.product)
              .map((item) => ({
                ...item.product,
                wishlistId: item.wishlistId || item._id,
              }))
          );
        } catch {
          toast.error("Failed to load wishlist.");
        } finally {
          setWishlistLoading(false);
        }
      };
      fetchWishlist();
    }
  }, [currentTab, isAuthenticated]);

  // Update Personal & Contact Info Handler
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await api.patch("/users/me", formData);
      updateUser(res.data.user);
      toast.success("Profile updated successfully!");
      setTab("overview");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Avatar Upload Handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture size cannot exceed 5MB.");
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append("avatar", file);

    try {
      setAvatarUploading(true);
      const res = await api.patch("/users/me/avatar", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser(res.data.user);
      toast.success("Profile photo updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload avatar.");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Remove Avatar Handler
  const handleRemoveAvatar = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;
    try {
      setAvatarUploading(true);
      const res = await api.delete("/users/me/avatar");
      updateUser(res.data.user);
      toast.success("Profile photo removed.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove avatar.");
    } finally {
      setAvatarUploading(false);
    }
  };

  // Change Password Handler
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword) {
      toast.error("Please provide both current and new passwords.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setSavingPassword(true);
      await api.patch("/users/me/password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Password updated successfully! Please keep it secure.");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  // Status Change for Listing in Profile
  const handleListingStatusChange = async (productId, currentStatus, listingType) => {
    const statuses = [
      { label: "Available", value: "active" },
      { label: "Reserved", value: "reserved" },
      { label: "Sold", value: "sold" },
      { label: "Rented", value: "rented" },
    ];

    const promptText =
      "Select status for this listing:\n" +
      statuses.map((s, i) => `${i + 1}. ${s.label}`).join("\n") +
      "\n\nEnter number (1-4):";

    const choice = window.prompt(promptText);
    if (!choice) return;

    const chosen = statuses[Number(choice) - 1];
    if (!chosen) {
      toast.error("Invalid selection.");
      return;
    }

    if (chosen.value === currentStatus) {
      toast.info("Listing is already set to this status.");
      return;
    }

    if (chosen.value === "sold" && listingType !== "sale") {
      toast.error("Only sale listings can be marked as sold.");
      return;
    }

    if (chosen.value === "rented" && listingType !== "rent") {
      toast.error("Only rent listings can be marked as rented.");
      return;
    }

    try {
      setUpdatingStatusId(productId);
      const res = await api.patch(`/products/${productId}/status`, { status: chosen.value });
      setMyListings((prev) =>
        prev.map((item) => (item._id === productId ? { ...item, status: chosen.value } : item))
      );
      toast.success(res.data.message || "Status updated.");
      fetchProfileData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update listing status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Delete Listing Handler
  const handleDeleteListing = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this listing permanently?")) return;
    try {
      setDeletingListingId(productId);
      await api.delete(`/products/${productId}`);
      setMyListings((prev) => prev.filter((item) => item._id !== productId));
      toast.success("Listing deleted.");
      fetchProfileData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete listing.");
    } finally {
      setDeletingListingId(null);
    }
  };

  // Remove item from Wishlist
  const handleRemoveFromWishlist = async (productId) => {
    try {
      setRemovingWishlistId(productId);
      await api.delete(`/wishlist/${productId}`);
      setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
      toast.success("Item removed from wishlist.");
      fetchProfileData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove item.");
    } finally {
      setRemovingWishlistId(null);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-indigo-700">
            <img src="/logo.png" alt="MIT Mini Market Logo" className="h-8 w-8 object-contain" />
            <span>MIT Mini Market</span>
          </Link>

          <div className="flex items-center gap-3">
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="rounded-xl bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-purple-700"
              >
                ⚡ Admin Panel
              </Link>
            )}
            <Link
              to="/"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Marketplace
            </Link>
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
              to="/chats"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              Messages
            </Link>
            <Link
              to="/create-listing"
              className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              + Create Listing
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Banner & Header Card */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Decorative College Header Banner */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 sm:h-44">
            <div className="flex h-full items-center justify-end p-4 text-white/20">
              <span className="text-7xl font-black select-none">MIT</span>
            </div>
          </div>

          <div className="relative px-6 pb-6 pt-0 sm:px-8 sm:pb-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              {/* Avatar & Basic Info */}
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
                {/* Avatar with Upload Control */}
                <div className="relative -mt-16 sm:-mt-20">
                  <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-4 border-white bg-indigo-100 shadow-md sm:h-36 sm:w-36">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-3xl font-extrabold text-white sm:text-4xl">
                        {getInitials(user?.name)}
                      </div>
                    )}

                    {avatarUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                        <span className="animate-spin text-2xl">🔄</span>
                      </div>
                    )}
                  </div>

                  {/* Camera Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    aria-label="Upload profile photo"
                    title="Change profile picture"
                    className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700 active:scale-95"
                  >
                    📷
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                </div>

                {/* User Details */}
                <div className="text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                      {user?.name || "Student"}
                    </h1>
                    <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
                      {user?.role === "admin" ? "Campus Admin" : "Verified Student"}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {user?.email}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 sm:justify-start">
                    {user?.department && (
                      <span className="flex items-center gap-1 font-medium">
                        🏫 {user.department}
                      </span>
                    )}
                    {user?.year && (
                      <span className="flex items-center gap-1 font-medium">
                        🎓 {user.year}
                      </span>
                    )}
                    {user?.hostel && (
                      <span className="flex items-center gap-1 font-medium">
                        🏢 {user.hostel} {user.roomNo ? `(Room ${user.roomNo})` : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {user?.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading}
                    className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove Photo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTab(currentTab === "edit" ? "overview" : "edit")}
                  className="rounded-xl border border-indigo-600 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                >
                  {currentTab === "edit" ? "View Overview" : "✏️ Edit Profile"}
                </button>
                <Link
                  to={`/users/${user?.id || user?._id}`}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View Public Profile
                </Link>
              </div>
            </div>

            {/* Marketplace Stats Row */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <span className="text-2xl font-black text-indigo-600">
                  {stats.activeListings}
                </span>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Active Listings
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <span className="text-2xl font-black text-emerald-600">
                  {stats.soldListings}
                </span>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Items Sold
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <span className="text-2xl font-black text-purple-600">
                  {stats.totalListings}
                </span>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Posted
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <span className="text-2xl font-black text-rose-500">
                  {stats.wishlistCount}
                </span>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Wishlist Saved
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation Navigation */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {[
            { id: "overview", label: "Overview", icon: "👤" },
            { id: "edit", label: "Edit Details", icon: "✏️" },
            { id: "listings", label: `My Listings (${stats.totalListings})`, icon: "🛍️" },
            { id: "wishlist", label: `Wishlist (${stats.wishlistCount})`, icon: "❤️" },
            { id: "settings", label: "Account & Security", icon: "⚙️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                currentTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {currentTab === "overview" && (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Bio & Personal Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-bold text-slate-900">
                Personal Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Details shared with fellow students across the campus marketplace.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    About / Bio
                  </span>
                  <p className="mt-1 text-slate-700">
                    {user?.bio || "No bio added yet. Add a short note about yourself to build trust with buyers and sellers!"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Department / Branch
                    </span>
                    <p className="mt-1 font-medium text-slate-800">
                      {user?.department || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Year of Study
                    </span>
                    <p className="mt-1 font-medium text-slate-800">
                      {user?.year || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Hostel / Hall of Residence
                    </span>
                    <p className="mt-1 font-medium text-slate-800">
                      {user?.hostel || "Not specified"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Room Number
                    </span>
                    <p className="mt-1 font-medium text-slate-800">
                      {user?.roomNo || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setTab("edit")}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Edit personal details →
                </button>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Contact Preferences
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                How other campus members can reach you for deals.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Preferred Contact Mode
                  </span>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                    {user?.preferredContactMethod === "whatsapp"
                      ? "💬 WhatsApp"
                      : user?.preferredContactMethod === "phone"
                      ? "📞 Phone Call"
                      : "⚡ In-App Chat"}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Phone Number
                  </span>
                  <p className="mt-1 font-medium text-slate-800">
                    {user?.phone || "Not provided"}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    WhatsApp Number
                  </span>
                  <p className="mt-1 font-medium text-slate-800">
                    {user?.whatsapp || "Not provided"}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Instagram Handle
                  </span>
                  <p className="mt-1 font-medium text-slate-800">
                    {user?.instagram ? `@${user.instagram}` : "Not provided"}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setTab("edit")}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Update contact info →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Edit Details */}
        {currentTab === "edit" && (
          <form onSubmit={handleProfileSubmit} className="mt-6 space-y-6">
            {/* Section 1: Personal Details */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">
                Edit Personal Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Update your name, department, hostel, and bio.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="Aditya Sharma"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    About / Bio
                  </label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="E.g. 3rd year CSE student living in Hostel 4. Selling previous semester engineering books and tech accessories."
                  />
                  <span className="text-xs text-slate-400">
                    {300 - (formData.bio?.length || 0)} characters remaining
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Department / Major
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Year of Study
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">Select Year</option>
                    {YEARS.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Hostel / Residence Block
                  </label>
                  <input
                    type="text"
                    value={formData.hostel}
                    onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="E.g. Hostel 4, Block B, Day Scholar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={formData.roomNo}
                    onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="E.g. B-312"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contact Information */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">
                Update Contact Information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose how students can reach you when interested in your listings.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Preferred Contact Method
                  </label>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { id: "chat", title: "⚡ In-App Chat", desc: "Best for campus privacy" },
                      { id: "whatsapp", title: "💬 WhatsApp", desc: "Direct messaging" },
                      { id: "phone", title: "📞 Phone Call", desc: "Direct voice call" },
                    ].map((method) => (
                      <label
                        key={method.id}
                        className={`flex cursor-pointer flex-col rounded-2xl border p-4 transition ${
                          formData.preferredContactMethod === method.id
                            ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="preferredContactMethod"
                            value={method.id}
                            checked={formData.preferredContactMethod === method.id}
                            onChange={(e) =>
                              setFormData({ ...formData, preferredContactMethod: e.target.value })
                            }
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-bold text-slate-800">
                            {method.title}
                          </span>
                        </div>
                        <span className="mt-1 text-xs text-slate-500">{method.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Instagram Handle
                  </label>
                  <div className="relative mt-1 flex rounded-xl border border-slate-300 bg-white">
                    <span className="flex items-center pl-4 text-slate-400">@</span>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                      className="w-full rounded-xl px-2 py-3 outline-none"
                      placeholder="your_insta_handle"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTab("overview")}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingProfile ? "Saving Changes..." : "Save Profile"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 3: Display User's Listings */}
        {currentTab === "listings" && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Your Marketplace Listings
                </h2>
                <p className="text-sm text-slate-500">
                  Manage availability, edit, or mark your items as sold.
                </p>
              </div>

              <Link
                to="/create-listing"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                + Post New Item
              </Link>
            </div>

            {listingsLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                Loading your listings...
              </div>
            ) : myListings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <span className="text-4xl">📦</span>
                <h3 className="mt-3 text-lg font-bold text-slate-800">
                  No listings yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  You haven't posted any products for sale or rent yet.
                </p>
                <Link
                  to="/create-listing"
                  className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myListings.map((product) => (
                  <div
                    key={product._id}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <div>
                      {/* Image Preview */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            No Image
                          </div>
                        )}
                        <span
                          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            product.status === "active"
                              ? "bg-emerald-500 text-white"
                              : product.status === "sold"
                              ? "bg-slate-700 text-white"
                              : product.status === "reserved"
                              ? "bg-amber-500 text-white"
                              : "bg-indigo-600 text-white"
                          }`}
                        >
                          {product.status}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                          {product.category}
                        </span>
                        <h3 className="mt-1 line-clamp-1 font-bold text-slate-900">
                          {product.title}
                        </h3>
                        <p className="mt-2 text-lg font-black text-slate-900">
                          {product.listingType === "exchange"
                            ? "Exchange"
                            : product.listingType === "donation"
                            ? "Free / Donate"
                            : formatPrice(product.price)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleListingStatusChange(
                            product._id,
                            product.status,
                            product.listingType
                          )
                        }
                        disabled={updatingStatusId === product._id}
                        className="text-xs font-semibold text-slate-700 hover:text-indigo-600"
                      >
                        Change Status
                      </button>

                      <div className="flex items-center gap-3">
                        <Link
                          to={`/products/${product._id}/edit`}
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(product._id)}
                          disabled={deletingListingId === product._id}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Display User's Wishlist */}
        {currentTab === "wishlist" && (
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Your Saved Wishlist
              </h2>
              <p className="text-sm text-slate-500">
                Products you have bookmarked for later.
              </p>
            </div>

            {wishlistLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                Loading saved items...
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <span className="text-4xl">❤️</span>
                <h3 className="mt-3 text-lg font-bold text-slate-800">
                  Wishlist is empty
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Explore items on the marketplace and tap the heart icon to save them here.
                </p>
                <Link
                  to="/"
                  className="mt-5 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Browse Campus Marketplace
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wishlistItems.map((product) => (
                  <div
                    key={product._id}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                  >
                    <Link to={`/products/${product._id}`} className="block">
                      <div className="aspect-video w-full overflow-hidden bg-slate-100">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover transition hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                          {product.category}
                        </span>
                        <h3 className="mt-1 line-clamp-1 font-bold text-slate-900">
                          {product.title}
                        </h3>
                        <p className="mt-2 text-lg font-black text-slate-900">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
                      <Link
                        to={`/products/${product._id}`}
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        View Details →
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleRemoveFromWishlist(product._id)}
                        disabled={removingWishlistId === product._id}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Remove from Wishlist
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Account Settings & Change Password */}
        {currentTab === "settings" && (
          <div className="mt-6 space-y-6">
            {/* Change Password Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">
                Change Password
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Ensure your account is using a long, random password to stay secure.
              </p>

              <form onSubmit={handlePasswordSubmit} className="mt-6 max-w-xl space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Current Password
                  </label>
                  <input
                    type={showPasswords ? "text" : "password"}
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    New Password (at least 8 characters)
                  </label>
                  <input
                    type={showPasswords ? "text" : "password"}
                    required
                    minLength={8}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Confirm New Password
                  </label>
                  <input
                    type={showPasswords ? "text" : "password"}
                    required
                    minLength={8}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="showPass"
                    checked={showPasswords}
                    onChange={(e) => setShowPasswords(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="showPass" className="text-xs text-slate-600 select-none">
                    Show passwords
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingPassword ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>

            {/* Account Information Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-slate-900">
                Account Details & Safety
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Information about your college marketplace account.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-xs font-semibold uppercase text-slate-400">
                    Email Address
                  </span>
                  <p className="mt-1 font-semibold text-slate-800">{user?.email}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-xs font-semibold uppercase text-slate-400">
                    Account Status
                  </span>
                  <p className="mt-1 font-semibold text-emerald-600">Active & Verified Student</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-xs font-semibold uppercase text-slate-400">
                    User Role
                  </span>
                  <p className="mt-1 font-semibold uppercase text-slate-800">{user?.role || "user"}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <span className="text-xs font-semibold uppercase text-slate-400">
                    Campus ID
                  </span>
                  <p className="mt-1 font-mono text-xs text-slate-600">{user?.id || user?._id}</p>
                </div>
              </div>

              {/* Campus Marketplace Safety Advice */}
              <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-900">
                <h4 className="font-bold flex items-center gap-2">
                  🛡️ Campus Marketplace Safety Tips
                </h4>
                <ul className="mt-2 list-disc pl-5 text-xs space-y-1 text-amber-800">
                  <li>Meet in public campus areas (e.g. Student Center, Library, Canteen) during daylight.</li>
                  <li>Inspect items (especially electronics) thoroughly before finalizing transactions.</li>
                  <li>Never share your account password with anyone.</li>
                </ul>
              </div>

              {/* Danger Zone */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">
                  Session
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Sign out of your account on this device.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate("/login");
                    toast.success("Logged out successfully.");
                  }}
                  className="mt-4 rounded-xl border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
