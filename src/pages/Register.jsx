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
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("username", form.username);
      data.append("email", form.email);
      data.append("password", form.password);
      if (avatar) data.append("avatar", avatar);

      const res = await api.post("/auth/register", data);

      // ✅ AUTO LOGIN AFTER REGISTER
      localStorage.setItem("token", res.data.token);

      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6"
      >
        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full overflow-hidden border border-blue-300">
            <img
              src={avatarPreview || "/default.jpg"}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <p className="text-sm text-gray-500">
            Join <span className="font-semibold">Lyheng Community</span>
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* USERNAME */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Username
          </label>
          <input
            name="username"
            placeholder="Your username"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* EMAIL */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* CONFIRM PASSWORD */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirm"
            placeholder="••••••••"
            value={form.confirm}
            onChange={handleChange}
            required
            className="w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* AVATAR */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Avatar (optional)
          </label>
         <div className="flex items-center justify-center gap-3">
           <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="block text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-lg file:border-0
                       file:bg-blue-50 file:text-blue-600
                       hover:file:bg-blue-100 cursor-pointer"
          />
          <div className="w-16 h-16 rounded-full overflow-hidden border border-blue-300">
            <img
              src={avatarPreview || "/default.jpg"}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          </div>
         </div>
        </div>
          

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2
            text-white font-medium py-2.5 rounded-lg shadow-md
            ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
          `}
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? "Registering..." : "Register"}
        </button>

        {/* FOOTER */}
        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
