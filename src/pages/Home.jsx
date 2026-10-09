import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const categories = [
  { label: "All items", value: "" },
  { label: "Books", value: "books" },
  { label: "Electronics", value: "electronics" },
  { label: "Hostel essentials", value: "hostel-essentials" },
  { label: "Clothing", value: "clothing" },
  { label: "Furniture", value: "furniture" },
  { label: "Sports", value: "sports" },
  { label: "Other", value: "other" },
];

function Home() {
  const { user, isAuthenticated, logout } = useAuth();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const params = {};
        if (search.trim()) params.search = search.trim();
        if (category) params.category = category;

        const response = await api.get("/products", { params });
        setProducts(response.data.products || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load products. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [search, category]);

  const handleLogout = () => {
    logout();
    toast.success("You have been logged out.");
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price || 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navigation */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link to="/" className="text-xl font-extrabold text-indigo-700">
            🎓 MIT Mini Market
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden text-sm text-slate-600 sm:inline">
                  Hi, {user?.name}
                </span>
                <Link
                  to="/create-listing"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  + Create Listing
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-50 via-white to-violet-100">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
            <div>
              <p className="font-semibold text-indigo-700">
                YOUR CAMPUS. YOUR MARKETPLACE.
              </p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 md:text-6xl">
                Buy, sell and share within your campus.
              </h1>
              <p className="mt-5 max-w-xl leading-7 text-slate-600">
                Find affordable books, electronics, hostel essentials and more
                from your campus community.
              </p>
              <a
                href="#marketplace"
                className="mt-8 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Explore marketplace
              </a>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl">
              <p className="text-sm font-semibold text-indigo-600">
                A smarter campus community
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {[
                  ["📚", "Books & notes"],
                  ["💻", "Electronics"],
                  ["🪑", "Hostel essentials"],
                  ["🤝", "Exchange & donate"],
                ].map(([emoji, label]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-5">
                    <div className="text-3xl">{emoji}</div>
                    <p className="mt-3 font-semibold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Marketplace */}
        <section id="marketplace" className="mx-auto max-w-7xl px-5 py-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                CAMPUS MARKETPLACE
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                Explore listings
              </h2>
              <p className="mt-2 text-slate-500">
                Discover what's available in your campus community.
              </p>
            </div>
          </div>

          <div className="mt-7">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search books, electronics, furniture..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item.value || "all"}
                onClick={() => setCategory(item.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  category === item.value
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="py-16 text-center text-slate-500">
              Loading marketplace listings...
            </p>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => {
                  setSearch((current) => current);
                  setCategory((current) => current);
                }}
                className="mt-3 font-semibold text-indigo-600"
              >
                Check your backend and try again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
              <div className="text-4xl">🛍️</div>
              <h3 className="mt-4 text-xl font-bold">No listings found yet</h3>
              <p className="mt-2 text-slate-500">
                Try another search or category. New listings will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <article
                  key={product._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-100 text-5xl">
                      🛍️
                    </div>
                  )}

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                      {product.category?.replaceAll("-", " ")}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-bold">
                      {product.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {product.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900">
                        {["sale", "rent"].includes(product.listingType)
                          ? formatPrice(product.price)
                          : product.listingType === "exchange"
                            ? "Exchange"
                            : "Free"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-600">
                        {product.listingType}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      Seller: {product.seller?.name || "Campus member"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14">
            <h2 className="text-center text-3xl font-extrabold">
              How it works
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                ["01", "Find an item", "Search listings for things you need."],
                ["02", "Connect", "Find a seller from your campus community."],
                ["03", "Reuse and save", "Give useful items another life."],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="rounded-2xl border border-slate-200 p-6"
                >
                  <p className="font-extrabold text-indigo-600">{number}</p>
                  <h3 className="mt-3 text-xl font-bold">{title}</h3>
                  <p className="mt-2 leading-6 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-900 px-5 py-7 text-center text-sm text-slate-300">
        MIT Mini Market · A marketplace for your campus community
      </footer>
    </div>
  );
}

export default Home;
