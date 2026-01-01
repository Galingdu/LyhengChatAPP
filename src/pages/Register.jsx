import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import SelectLanguage from "../components/SelectLanguage";
import { useTranslation } from "react-i18next";
import { Camera } from "lucide-react";
import { useRef } from "react";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });
    const { t } = useTranslation();

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

  const fileInputRef = useRef(null);


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
      <SelectLanguage />

      {/* HEADER */}
      <div className="text-center space-y-2">
        <div className="relative mx-auto w-24 h-24">
          {/* Avatar */}
          <img
            src={avatarPreview || "/default.jpg"}
            alt="Avatar preview"
            className="w-full h-full rounded-full object-cover border border-blue-300"
          />

          {/* Camera button */}
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700
                       text-white p-2 rounded-full shadow-md transition"
          >
            <Camera size={16} />
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        <h2 className="text-2xl font-bold text-gray-800">
          {t("form.createAccount")}
        </h2>
        <p className="text-sm text-gray-500">
          {t("form.join")}{" "}
          <span className="font-semibold">Lyheng Community</span>
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* INPUT STYLE */}
      {(() => {
        const inputClass =
          "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm \
           focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 \
           hover:border-gray-300 transition outline-none";
        return (
          <>
            {/* USERNAME */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t("form.username")}
              </label>
              <input
                name="username"
                placeholder={t("form.PHUserName")}
                value={form.username}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t("form.Email")}
              </label>
              <input
                type="email"
                name="email"
                placeholder={t("form.PHEmail")}
                value={form.email}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t("form.Password")}
              </label>
              <input
                type="password"
                name="password"
                placeholder={t("form.PHPassword")}
                value={form.password}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t("form.ConfirmPassword")}
              </label>
              <input
                type="password"
                name="confirm"
                placeholder={t("form.PHConfirmPassword")}
                value={form.confirm}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>
          </>
        );
      })()}

      {/* SUBMIT */}
      <button
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2
          text-white font-medium py-2.5 rounded-xl shadow-md transition
          ${
            loading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
          }
        `}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {loading ? t("form.registering") : t("form.register")}
      </button>

      {/* FOOTER */}
      <p className="text-sm text-center text-gray-500">
        {t("form.AlreadyHave")}{" "}
        <Link
          to="/login"
          className="text-blue-600 font-medium hover:underline"
        >
          {t("form.Login")}
        </Link>
      </p>
    </form>
  </div>
);

}
