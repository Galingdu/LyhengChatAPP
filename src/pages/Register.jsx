import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState("");
  const [loading,setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true)

    if (form.password !== form.confirm) {
      return setError("Passwords do not match");
    }

    const data = new FormData();
    data.append("username", form.username);
    data.append("email", form.email);
    data.append("password", form.password);
    if (avatar) data.append("avatar", avatar);

    try {
      await api.post("/auth/register", data);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Register failed");
    }finally{
      setLoading(false);
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
      <div className="mx-auto w-15 h-15 bg-blue-600 text-white flex items-center justify-center rounded-full text-xl">
        <img className="mx-auto w-14 h-14 bg-blue-600 text-white flex items-center justify-center rounded-full text-xl" src="./myPf.jpg" alt="" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
      <p className="text-sm text-gray-500">
        Join us and start with Lyheng Community.
      </p>
    </div>

    {/* Error */}
    {error && (
      <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
        {error}
      </div>
    )}

    {/* Username */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        Username
      </label>
      <input
        name="username"
        placeholder="Your username"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   outline-none transition"
        onChange={handleChange}
        required
      />
    </div>

    {/* Email */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        Email
      </label>
      <input
        type="email"
        name="email"
        placeholder="you@example.com"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   outline-none transition"
        onChange={handleChange}
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
        name="password"
        placeholder="••••••••"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   outline-none transition"
        onChange={handleChange}
        required
      />
    </div>

    {/* Confirm Password */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        Confirm Password
      </label>
      <input
        type="password"
        name="confirm"
        placeholder="••••••••"
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5
                   focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                   outline-none transition"
        onChange={handleChange}
        required
      />
    </div>

    {/* Avatar Upload */}
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        Avatar (optional)
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setAvatar(e.target.files[0])}
        className="block w-full text-sm text-gray-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-lg file:border-0
                   file:bg-blue-50 file:text-blue-600
                   hover:file:bg-blue-100 cursor-pointer"
      />
    </div>

   {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2
                     text-white font-medium py-2.5 rounded-lg
                     transition duration-200 shadow-md
                     ${
                       loading
                         ? "bg-blue-400 cursor-not-allowed"
                         : "bg-blue-600 hover:bg-blue-700"
                     }`}
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? "Registering..." : "Register"}
        </button>

    {/* Footer */}
    <p className="text-sm text-center text-gray-500">
      Already have an account?{" "}
      <Link
        to="/login"
        className="text-blue-600 font-medium hover:underline"
      >
        Login
      </Link>
    </p>
  </form>
</div>

  );
}
