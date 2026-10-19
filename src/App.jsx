import { useEffect, useState } from "react";
import api from "./api/axios";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CreateListing from "./pages/CreateListing";
import ProductDetails from "./pages/ProductDetails";
import MyListings from "./pages/MyListings";
import EditListing from "./pages/EditListing";
import Wishlist from "./pages/Wishlist";
import Chat from "./pages/Chat.jsx";
import Chats from "./pages/Chats.jsx";

const categories = [
  { name: "Books", icon: "📚", value: "books", color: "bg-blue-50" },
  {
    name: "Electronics",
    icon: "🎧",
    value: "electronics",
    color: "bg-purple-50",
  },
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
            "Unable to load products. Please check whether your backend is running.",
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
      selectedCategory === "All" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/create-listing" element={<CreateListing />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/my-listings" element={<MyListings />} />
      <Route path="/products/:id/edit" element={<EditListing />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/chats/:conversationId" element={<Chat />} />
      <Route path="/chats" element={<Chats />} />
    </Routes>
  );
}

export default App;
