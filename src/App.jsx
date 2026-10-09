import { useEffect, useState } from "react";
import api from "./api/axios";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CreateListing from "./pages/CreateListing";

const categories = [
  { name: "Books", icon: "📚", value: "books", color: "bg-blue-50" },
  { name: "Electronics", icon: "🎧", value: "electronics", color: "bg-purple-50" },
  {
    name: "Hostel Essentials",
    icon: "🛏️",
    value: "hostel-essentials",
    color: "bg-orange-50",
  },
  { name: "Furniture", icon: "🪑", value: "furniture", color: "bg-green-50" },
  { name: "Clothing", icon: "👕", value: "clothing", color: "bg-pink-50" },
  { name: "Sports", icon: "🏸", value: "sports", color: "bg-yellow-50" },
  { name: "Other", icon: "📦", value: "other", color: "bg-slate-100" },
];

function App() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch real products from the backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/products");

        setProducts(response.data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load products. Please check whether your backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title?.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    // <div className="min-h-screen bg-slate-50 text-slate-900">
    //   {/* Navigation */}
    //   <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
    //     <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
    //       <a
    //         href="/"
    //         className="text-xl font-extrabold tracking-tight text-indigo-700"
    //       >
    //         MIT <span className="text-slate-900">Mini Market</span>
    //       </a>

    //       <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
    //         <a href="#marketplace" className="hover:text-indigo-700">
    //           Explore
    //         </a>
    //         <a href="#categories" className="hover:text-indigo-700">
    //           Categories
    //         </a>
    //         <a href="#how-it-works" className="hover:text-indigo-700">
    //           How it works
    //         </a>
    //       </div>

    //       <div className="flex items-center gap-3">
    //         <button
    //           onClick={() => alert("Login page will be built next!")}
    //           className="hidden rounded-xl px-4 py-2 text-sm font-semibold hover:bg-slate-100 sm:block"
    //         >
    //           Log in
    //         </button>

    //         <button
    //           onClick={() =>
    //             alert("The create-listing page will be built after authentication.")
    //           }
    //           className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
    //         >
    //           + Sell an item
    //         </button>
    //       </div>
    //     </nav>
    //   </header>

    //   <main>
    //     {/* Hero Section */}
    //     <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
    //       <div>
    //         <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
    //           🎓 Made for the MIT campus community
    //         </span>

    //         <h1 className="mt-6 max-w-xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
    //           Your campus.
    //           <br />
    //           Your marketplace.
    //           <br />
    //           <span className="text-indigo-600">Better deals.</span>
    //         </h1>

    //         <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
    //           Buy, sell, rent, exchange, or donate items within your campus
    //           community. Give useful things a second life and find what you
    //           need for less.
    //         </p>

    //         <div className="mt-8 flex flex-wrap gap-3">
    //           <a
    //             href="#marketplace"
    //             className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-indigo-700"
    //           >
    //             Explore marketplace →
    //           </a>

    //           <a
    //             href="#how-it-works"
    //             className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold transition hover:bg-slate-100"
    //           >
    //             How it works
    //           </a>
    //         </div>

    //         <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
    //           <span>✓ Student-focused</span>
    //           <span>✓ Affordable finds</span>
    //           <span>✓ Campus connections</span>
    //         </div>
    //       </div>

    //       <div className="relative">
    //         <div className="absolute -inset-4 rounded-[2rem] bg-indigo-100/70 blur-2xl" />

    //         <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
    //           <div>
    //             <p className="text-sm text-slate-500">Your campus finds</p>
    //             <h2 className="mt-1 text-xl font-bold">
    //               Discover something useful
    //             </h2>
    //           </div>

    //           <div className="mt-6 grid grid-cols-2 gap-4">
    //             <div className="rounded-2xl bg-blue-50 p-5">
    //               <span className="text-4xl">📚</span>
    //               <p className="mt-4 font-bold">Study materials</p>
    //               <p className="mt-1 text-sm text-slate-500">
    //                 Learn for less
    //               </p>
    //             </div>

    //             <div className="rounded-2xl bg-purple-50 p-5">
    //               <span className="text-4xl">🎧</span>
    //               <p className="mt-4 font-bold">Gadgets</p>
    //               <p className="mt-1 text-sm text-slate-500">
    //                 Find great deals
    //               </p>
    //             </div>

    //             <div className="rounded-2xl bg-orange-50 p-5">
    //               <span className="text-4xl">🛏️</span>
    //               <p className="mt-4 font-bold">Hostel essentials</p>
    //               <p className="mt-1 text-sm text-slate-500">
    //                 Settle in easily
    //               </p>
    //             </div>

    //             <div className="rounded-2xl bg-green-50 p-5">
    //               <span className="text-4xl">♻️</span>
    //               <p className="mt-4 font-bold">Reuse and recycle</p>
    //               <p className="mt-1 text-sm text-slate-500">
    //                 Exchange or donate
    //               </p>
    //             </div>
    //           </div>
    //         </div>
    //       </div>
    //     </section>

    //     {/* Categories */}
    //     <section
    //       id="categories"
    //       className="border-y border-slate-200 bg-white py-14"
    //     >
    //       <div className="mx-auto max-w-7xl px-5">
    //         <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
    //           Browse by interest
    //         </p>

    //         <h2 className="mt-2 text-3xl font-extrabold">
    //           Explore categories
    //         </h2>

    //         <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
    //           {categories.map((category) => (
    //             <button
    //               key={category.value}
    //               onClick={() => {
    //                 setSelectedCategory(category.value);
    //                 document
    //                   .getElementById("marketplace")
    //                   ?.scrollIntoView({ behavior: "smooth" });
    //               }}
    //               className={`rounded-2xl border border-slate-100 p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${category.color}`}
    //             >
    //               <span className="text-3xl">{category.icon}</span>
    //               <p className="mt-4 text-sm font-bold">{category.name}</p>
    //             </button>
    //           ))}
    //         </div>
    //       </div>
    //     </section>

    //     {/* Marketplace */}
    //     <section id="marketplace" className="mx-auto max-w-7xl px-5 py-16">
    //       <div className="flex flex-wrap items-end justify-between gap-4">
    //         <div>
    //           <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
    //             The marketplace
    //           </p>

    //           <h2 className="mt-2 text-3xl font-extrabold">
    //             Discover campus listings
    //           </h2>

    //           <p className="mt-2 text-slate-500">
    //             Browse items listed by your campus community.
    //           </p>
    //         </div>

    //         <button
    //           onClick={() => {
    //             setSelectedCategory("All");
    //             setSearch("");
    //           }}
    //           className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
    //         >
    //           Clear filters
    //         </button>
    //       </div>

    //       {/* Search and category filter */}
    //       <div className="mt-7 flex flex-col gap-3 sm:flex-row">
    //         <input
    //           type="text"
    //           value={search}
    //           onChange={(event) => setSearch(event.target.value)}
    //           placeholder="Search books, electronics, furniture..."
    //           className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
    //         />

    //         <select
    //           value={selectedCategory}
    //           onChange={(event) => setSelectedCategory(event.target.value)}
    //           className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
    //         >
    //           <option value="All">All categories</option>

    //           {categories.map((category) => (
    //             <option key={category.value} value={category.value}>
    //               {category.name}
    //             </option>
    //           ))}
    //         </select>
    //       </div>

    //       <div className="mt-4 text-sm text-slate-500">
    //         {loading
    //           ? "Loading listings..."
    //           : `Showing ${filteredProducts.length} listings`}
    //       </div>

    //       {/* Loading state */}
    //       {loading && (
    //         <div className="py-16 text-center text-slate-500">
    //           Loading marketplace listings...
    //         </div>
    //       )}

    //       {/* Error state */}
    //       {!loading && error && (
    //         <div className="mt-6 rounded-2xl bg-red-50 p-6 text-center text-red-700">
    //           <p className="font-semibold">{error}</p>

    //           <button
    //             onClick={() => window.location.reload()}
    //             className="mt-3 font-bold underline"
    //           >
    //             Try again
    //           </button>
    //         </div>
    //       )}

    //       {/* Product cards */}
    //       {!loading && !error && filteredProducts.length > 0 && (
    //         <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    //           {filteredProducts.map((product) => (
    //             <article
    //               key={product._id}
    //               className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
    //             >
    //               <div className="flex h-44 items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
    //                 {product.images?.[0] ? (
    //                   <img
    //                     src={product.images[0]}
    //                     alt={product.title}
    //                     className="h-full w-full object-cover"
    //                   />
    //                 ) : (
    //                   <span className="text-6xl">📦</span>
    //                 )}
    //               </div>

    //               <div className="p-5">
    //                 <div className="flex items-center justify-between gap-2">
    //                   <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold capitalize text-indigo-700">
    //                     {product.category.replaceAll("-", " ")}
    //                   </span>

    //                   <span className="text-xs font-medium capitalize text-slate-500">
    //                     {product.listingType}
    //                   </span>
    //                 </div>

    //                 <h3 className="mt-4 text-lg font-bold">
    //                   {product.title}
    //                 </h3>

    //                 <p className="mt-1 text-sm capitalize text-slate-500">
    //                   Condition: {product.condition.replaceAll("-", " ")}
    //                 </p>

    //                 <p className="mt-2 line-clamp-2 text-sm text-slate-600">
    //                   {product.description}
    //                 </p>

    //                 <div className="mt-5 flex items-center justify-between gap-3">
    //                   <p className="text-2xl font-extrabold">
    //                     {product.listingType === "sale"
    //                       ? `₹${product.price}`
    //                       : product.listingType === "rent"
    //                         ? `₹${product.price} rent`
    //                         : product.listingType === "exchange"
    //                           ? "Exchange"
    //                           : "Free"}
    //                   </p>

    //                   <button
    //                     onClick={() =>
    //                       alert("Product details page will be built next!")
    //                     }
    //                     className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
    //                   >
    //                     View item
    //                   </button>
    //                 </div>
    //               </div>
    //             </article>
    //           ))}
    //         </div>
    //       )}

    //       {/* Empty state */}
    //       {!loading && !error && filteredProducts.length === 0 && (
    //         <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
    //           <span className="text-5xl">🔎</span>

    //           <p className="mt-4 text-lg font-bold">No listings found</p>

    //           <p className="mt-2 text-slate-500">
    //             {products.length === 0
    //               ? "No products have been listed yet. Be the first to add one!"
    //               : "Try a different search or category."}
    //           </p>

    //           {selectedCategory !== "All" && (
    //             <button
    //               onClick={() => setSelectedCategory("All")}
    //               className="mt-4 font-semibold text-indigo-600 hover:text-indigo-800"
    //             >
    //               Show all categories
    //             </button>
    //           )}
    //         </div>
    //       )}
    //     </section>

    //     {/* How it works */}
    //     <section id="how-it-works" className="bg-slate-900 py-16 text-white">
    //       <div className="mx-auto max-w-7xl px-5">
    //         <p className="text-sm font-bold uppercase tracking-widest text-indigo-300">
    //           Simple by design
    //         </p>

    //         <h2 className="mt-2 text-3xl font-extrabold">
    //           How MIT Mini Market works
    //         </h2>

    //         <div className="mt-8 grid gap-5 md:grid-cols-3">
    //           <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
    //             <span className="text-3xl">🔎</span>
    //             <h3 className="mt-4 text-lg font-bold">1. Find an item</h3>
    //             <p className="mt-2 leading-6 text-slate-300">
    //               Search listings and browse categories to find something useful.
    //             </p>
    //           </div>

    //           <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
    //             <span className="text-3xl">🤝</span>
    //             <h3 className="mt-4 text-lg font-bold">2. Connect locally</h3>
    //             <p className="mt-2 leading-6 text-slate-300">
    //               Coordinate with the seller and agree on a convenient campus meetup.
    //             </p>
    //           </div>

    //           <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
    //             <span className="text-3xl">♻️</span>
    //             <h3 className="mt-4 text-lg font-bold">3. Reuse and save</h3>
    //             <p className="mt-2 leading-6 text-slate-300">
    //               Buy, rent, exchange, or donate items within your campus community.
    //             </p>
    //           </div>
    //         </div>
    //       </div>
    //     </section>
    //   </main>

    //   {/* Footer */}
    //   <footer className="border-t border-slate-200 bg-white">
    //     <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
    //       <p className="font-bold text-slate-800">MIT Mini Market</p>
    //       <p>Built for the campus community · A student marketplace project</p>
    //     </div>
    //   </footer>
    // </div>

    <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/register" element={<Register />} />
    <Route path="/login" element={<Login />} />
    <Route path="/create-listing" element={<CreateListing />} />
  </Routes>
  );
}

export default App;