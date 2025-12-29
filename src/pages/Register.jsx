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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-96 space-y-4"
      >
        <h2 className="text-xl font-bold text-center">Register</h2>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          name="username"
          placeholder="Username"
          className="w-full border rounded px-3 py-2"
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="w-full border rounded px-3 py-2"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="w-full border rounded px-3 py-2"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="confirm"
          placeholder="Confirm Password"
          className="w-full border rounded px-3 py-2"
          onChange={handleChange}
          required
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatar(e.target.files[0])}
        />

        <button className="w-full bg-blue-600 text-white py-2 rounded">
          Register
        </button>

        <p className="text-sm text-center">
          Already have account?{" "}
          <Link to="/login" className="text-blue-600">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
