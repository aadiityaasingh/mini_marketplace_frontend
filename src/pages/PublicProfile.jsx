import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function PublicProfile() {
  const { id } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ activeCount: 0, soldCount: 0 });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/users/${id}`);
        setProfile(res.data.user);
        setStats(res.data.stats || {});
        setProducts(res.data.products || []);
      } catch (err) {
        setError(err.response?.data?.message || "User profile not found.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPublicProfile();
    }
  }, [id]);

  const handleStartChatWithProduct = async (productId) => {
    if (!isAuthenticated) {
      toast.info("Please log in to chat with this seller.");
      navigate("/login");
      return;
    }

    try {
      setContacting(true);
      const res = await api.post(`/chats/product/${productId}`);
      const conversationId = res.data.conversation?._id;
      if (conversationId) {
        navigate(`/chats/${conversationId}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate chat.");
    } finally {
      setContacting(false);
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
        <p className="text-slate-500">Loading student profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Profile Not Found</h2>
        <p className="text-slate-500">{error || "This user could not be located."}</p>
        <Link
          to="/"
          className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700"
        >
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isOwnProfile =
    currentUser && (currentUser.id === profile.id || currentUser._id === profile.id);

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
            <Link
              to="/"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              ← Marketplace
            </Link>
            {isOwnProfile && (
              <Link
                to="/profile"
                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                My Account
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Profile Card */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 sm:h-40" />

          <div className="px-6 pb-6 pt-0 sm:px-8 sm:pb-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end">
                <div className="-mt-16 sm:-mt-20 h-28 w-28 overflow-hidden rounded-2xl border-4 border-white bg-indigo-100 shadow-md sm:h-36 sm:w-36">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-3xl font-extrabold text-white sm:text-4xl">
                      {getInitials(profile.name)}
                    </div>
                  )}
                </div>

                <div className="text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                      {profile.name}
                    </h1>
                    <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-700">
                      Campus Student
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 sm:justify-start">
                    {profile.department && <span>🏫 {profile.department}</span>}
                    {profile.year && <span>🎓 {profile.year}</span>}
                    {profile.hostel && <span>🏢 {profile.hostel}</span>}
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <Link
                  to="/profile?tab=edit"
                  className="rounded-xl border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                >
                  Edit My Profile
                </Link>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  About
                </h3>
                <p className="mt-1 text-slate-700">{profile.bio}</p>
              </div>
            )}

            {/* Contact Options */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contact:
              </span>

              {profile.preferredContactMethod === "chat" && (
                <span className="rounded-xl bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  ⚡ Preferred: In-App Chat
                </span>
              )}

              {profile.whatsapp && (
                <a
                  href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  💬 WhatsApp: {profile.whatsapp}
                </a>
              )}

              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  📞 Call: {profile.phone}
                </a>
              )}

              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-pink-300 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-800 hover:bg-pink-100"
                >
                  📸 @{profile.instagram}
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <span className="text-2xl font-black text-indigo-600">
                  {stats.activeCount}
                </span>
                <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                  Active Listings
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-center">
                <span className="text-2xl font-black text-emerald-600">
                  {stats.soldCount}
                </span>
                <p className="mt-1 text-xs font-medium uppercase text-slate-500">
                  Items Sold
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seller's Active Listings */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">
            Listings by {profile.name} ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <span className="text-4xl">🏷️</span>
              <p className="mt-2 font-semibold text-slate-700">
                No active listings currently available from this student.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  <Link to={`/products/${product._id}`}>
                    <div className="aspect-video w-full overflow-hidden bg-slate-100">
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
                    </div>

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
                  </Link>

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
                    <Link
                      to={`/products/${product._id}`}
                      className="text-xs font-semibold text-slate-700 hover:text-indigo-600"
                    >
                      View Details
                    </Link>

                    {!isOwnProfile && (
                      <button
                        type="button"
                        onClick={() => handleStartChatWithProduct(product._id)}
                        disabled={contacting}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Chat with Seller
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
