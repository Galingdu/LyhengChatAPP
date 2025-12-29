import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
  <form
    onSubmit={handleSubmit}
    className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6"
  >
    {/* Header */}
    <div className="text-center space-y-2">
      <div className="mx-auto w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded-full text-xl">
        🔐
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
      <p className="text-sm text-gray-500">Login to your account</p>
    </div>

    {/* Error */}
    {error && (
      <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
        {error}
      </div>
    )}

    {/* Email */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        Email
      </label>
      <input
        type="email"
        placeholder="you@example.com"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   outline-none transition"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
    </div>

    {/* Password */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        Password
      </label>
      <input
        type="password"
        placeholder="••••••••"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   outline-none transition"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </div>

    {/* Button */}
    <button
      type="submit"
      className="w-full bg-blue-600 hover:bg-blue-700
                 text-white font-medium py-2.5 rounded-lg
                 transition duration-200 shadow-md"
    >
      Login
    </button>

    {/* Footer */}
    <p className="text-sm text-center text-gray-500">
      Don’t have an account?{" "}
      <Link
        to="/register"
        className="text-blue-600 font-medium hover:underline"
      >
        Register
      </Link>
    </p>
  </form>
</div>

  );
}
