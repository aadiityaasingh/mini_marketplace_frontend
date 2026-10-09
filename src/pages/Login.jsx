import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      await login({
        email: data.email.trim(),
        password: data.password,
      });

      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Login failed. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-lg sm:p-9">
        <Link
          to="/"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          ← Back to marketplace
        </Link>

        <div className="mt-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
            🎓
          </div>

          <h1 className="mt-5 text-3xl font-extrabold text-slate-900">
            Welcome back
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Log in to your MIT Mini Market account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Email address
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
              {...register("email", {
                required: "Email is required.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address.",
                },
              })}
            />

            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className={inputClass}
              {...register("password", {
                required: "Password is required.",
              })}
            />

            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-bold text-indigo-600 hover:text-indigo-800"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;