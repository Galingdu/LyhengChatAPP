import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { connectSocket } from "../services/socket";
import { Link, useNavigate } from "react-router-dom";
import { FaGamepad, FaSignOutAlt } from "react-icons/fa";
import { MdUploadFile } from "react-icons/md";
import notificationSound from "../assets/notification.mp3";
import joinSound from "../assets/join.mp3";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Chat() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BASE_URL;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUser, setTypingUser] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const messageAudio = useRef(new Audio(notificationSound));
  const joinAudio = useRef(new Audio(joinSound));

  // ✅ LOAD MY PROFILE (SOURCE OF TRUTH)
  useEffect(() => {
    api.get("/users/me").then(res => setMyProfile(res.data));
    console.log("meee",myProfile)
  }, []);

  // 📥 LOAD CHAT HISTORY
  useEffect(() => {
    api.get("/chat").then(res => setMessages(res.data));
  }, []);

  // 🔌 SOCKET CONNECT (ONLY AFTER PROFILE LOADED)
  useEffect(() => {
    if (!myProfile) return;

    socketRef.current = connectSocket(localStorage.getItem("token"));

    socketRef.current.on("newMessage", message => {
      setMessages(prev => [...prev, message]);

      if (message.sender?._id !== myProfile._id) {
        messageAudio.current.play().catch(() => {});
      }
    });

    socketRef.current.on("onlineCount", setOnlineCount);

    socketRef.current.on("userJoined", username => {
      if (username === myProfile.username) return;
      joinAudio.current.play().catch(() => {});
      setMessages(prev => [
        ...prev,
        { system: true, text: `${username} joined the chat` },
      ]);
    });

    socketRef.current.on("userLeft", username => {
      if (username === myProfile.username) return;
      setMessages(prev => [
        ...prev,
        { system: true, text: `${username} left the chat` },
      ]);
    });

    socketRef.current.on("typing", username => {
      if (username !== myProfile.username) setTypingUser(username);
    });

    socketRef.current.on("stopTyping", () => setTypingUser(""));

    return () => socketRef.current.disconnect();
  }, [myProfile?._id]);

  // 🔽 AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // 🧠 AVATAR HELPER
  const getAvatarUrl = sender =>
    sender?.avatar
      ? `${apiUrl}/uploads/avatars/${sender.avatar}`
      : "/default.jpg";

  // 📤 SEND MESSAGE
  const sendMessage = async () => {
    if (!text.trim() && !imageFile) return;

    if (imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile);
      const res = await api.post("/chat/image", formData);

      socketRef.current.emit("sendMessage", {
        text: text || null,
        image: res.data.image,
      });
    } else {
      socketRef.current.emit("sendMessage", {
        text,
        image: null,
      });
    }

    socketRef.current.emit("stopTyping");
    setText("");
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✍️ TYPING
  const handleTyping = value => {
    setText(value);

    if (!value.trim()) {
      socketRef.current.emit("stopTyping");
      return;
    }

    socketRef.current.emit("typing", myProfile.username);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(
      () => socketRef.current.emit("stopTyping"),
      800
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    socketRef.current?.disconnect();
    navigate("/login");
  };

  const formatTime = date =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  /* ======================= JSX ======================= */

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* HEADER */}
      <div className="bg-blue-700 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold text-lg">{t("header.Brand")}</p>
            <p className="text-xs flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {t("chat.online")}: {onlineCount}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/game">
              <button className="flex items-center gap-1 bg-green-600 px-3 py-1 rounded text-sm">
                <FaGamepad /> {t("header.playGame")}
              </button>
            </Link>

            <span className="flex items-center gap-2 text-sm">
              <img
                src={getAvatarUrl(myProfile)}
                className="w-6 h-6 rounded-full border"
              />
              {myProfile?.username}
            </span>

            <LanguageSwitcher />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 bg-red-500 px-3 py-1 rounded text-sm"
            >
              <FaSignOutAlt /> {t("header.logout")}
            </button>
          </div>

          <div className="md:hidden flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-2xl font-bold"
            >
              ☰
            </button>
          </div>
        </div>

        {showMenu && (
          <div className="md:hidden mt-4 bg-blue-600 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <img
                src={getAvatarUrl(myProfile)}
                className="w-7 h-7 rounded-full border"
              />
              <span>{myProfile?.username}</span>
            </div>

            <div className="flex gap-3">
              <Link to="/game" onClick={() => setShowMenu(false)}>
                <button className="flex items-center gap-2 bg-green-500 px-3 py-2 rounded">
                  <FaGamepad /> {t("header.playGame")}
                </button>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 px-3 py-2 rounded"
              >
                <FaSignOutAlt /> {t("header.logout")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) =>
          msg.system ? (
            <div key={i} className="text-center text-xs text-gray-400 italic">
              {msg.text}
            </div>
          ) : (
            <div
  key={msg._id || i}
  className={`flex gap-3 ${
    msg.sender?._id === myProfile?._id
      ? "justify-end"
      : "justify-start"
  }`}
>
  {/* AVATAR (OTHER USER ONLY) */}
  {msg.sender?._id !== myProfile?._id && (
    <img
      src={getAvatarUrl(msg.sender)}
      className="w-8 h-8 rounded-full mt-1"
    />
  )}

  <div className="max-w-xs">
    {/* USERNAME (OTHER USER ONLY) */}
    {msg.sender?._id !== myProfile?._id && (
      <p className="text-xs font-semibold text-gray-700 mb-1">
        {msg.sender?.username}
      </p>
    )}

    {/* MESSAGE BUBBLE */}
    <div
      className={`rounded-lg ${
        msg.image
          ? "bg-transparent"
          : msg.sender?._id === myProfile?._id
          ? "bg-blue-600 text-white px-3 py-2"
          : "bg-white px-3 py-2"
      }`}
    >
      {msg.text && <p>{msg.text}</p>}

      {msg.image && (
        <img
          src={`${apiUrl}/uploads/chats/${msg.image}`}
          className="rounded-lg max-w-full"
        />
      )}
    </div>

    {/* TIME */}
    <p className="text-xs text-gray-500 mt-1">
      {formatTime(msg.createdAt)}
    </p>
  </div>
</div>

          )
        )}

        {typingUser && (
          <p className="text-sm text-gray-500 italic">
            {typingUser} is typing...
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      {imagePreview && (
        <div className="p-3 bg-white border-t flex items-center gap-3">
          <img
            src={imagePreview}
            className="w-24 h-24 rounded-lg object-cover border"
          />
          <button
            className="text-red-500 text-sm"
            onClick={() => {
              setImagePreview(null);
              setImageFile(null);
            }}
          >
            ✕ Remove
          </button>
        </div>
      )}

      <div className="p-3 bg-white flex gap-2 items-center border-t">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            setImageFile(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0]));
          }}
        />

        <button
          onClick={() => fileInputRef.current.click()}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <MdUploadFile size={22} />
        </button>

        <input
          value={text}
          onChange={e => handleTyping(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder={t("chat.typeMessage")}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />

        <button
          disabled={!text.trim() && !imageFile}
          onClick={sendMessage}
          className="bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          {t("chat.send")}
        </button>
      </div>
    </div>
  );
}
