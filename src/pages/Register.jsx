import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      await registerUser({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      });

      toast.success("Account created! Please log in.");
      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Registration failed. Please try again."
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
            Create your account
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Join MIT Mini Market to discover and share useful campus items.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Full name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              className={inputClass}
              {...register("name", {
                required: "Name is required.",
                minLength: {
                  value: 2,
                  message: "Name must contain at least 2 characters.",
                },
                maxLength: {
                  value: 50,
                  message: "Name cannot exceed 50 characters.",
                },
                validate: (value) =>
                  value.trim().length >= 2 || "Please enter a valid name.",
              })}
            />

            {errors.name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.name.message}
              </p>
            )}
          </div>

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
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={inputClass}
              {...register("password", {
                required: "Password is required.",
                minLength: {
                  value: 8,
                  message: "Password must contain at least 8 characters.",
                },
              })}
            />

            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Confirm password
            </label>

            <input
              type="password"
              placeholder="Enter your password again"
              autoComplete="new-password"
              className={inputClass}
              {...register("confirmPassword", {
                required: "Please confirm your password.",
                validate: (value) =>
                  value === password || "Passwords do not match.",
              })}
            />

            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-indigo-600 hover:text-indigo-800"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;