import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("mit_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("mit_token") || null
  );

  const register = async ({ name, email, password }) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    // Registration creates the account. Login is a separate step.
    return response.data;
  };

  const login = async ({ email, password }) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const { token: newToken, user: loggedInUser } = response.data;

    localStorage.setItem("mit_token", newToken);
    localStorage.setItem("mit_user", JSON.stringify(loggedInUser));

    setToken(newToken);
    setUser(loggedInUser);

    return loggedInUser;
  };

  const logout = () => {
    localStorage.removeItem("mit_token");
    localStorage.removeItem("mit_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, register, login, logout, isAuthenticated: Boolean(token) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}