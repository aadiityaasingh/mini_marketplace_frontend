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
import Profile from "./pages/Profile.jsx";
import PublicProfile from "./pages/PublicProfile.jsx";
import Requests from "./pages/Requests.jsx";
import Notifications from "./pages/Notifications.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/create-listing" element={<CreateListing />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/products/:id/edit" element={<EditListing />} />
      <Route path="/my-listings" element={<MyListings />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/chats/:conversationId" element={<Chat />} />
      <Route path="/chats" element={<Chats />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/users/:id" element={<PublicProfile />} />
      <Route path="/requests" element={<Requests />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
