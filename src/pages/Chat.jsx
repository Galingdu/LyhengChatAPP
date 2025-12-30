import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { connectSocket } from "../services/socket";
import { Link, useNavigate } from "react-router-dom";
import { FaGamepad, FaSignOutAlt,FaImage } from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import notificationSound from "../assets/notification.mp3";
import joinSound from "../assets/join.mp3";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import imageCompression from "browser-image-compression";


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
  const [sending, setSending] = useState(false); // 🔒 FIX DUPLICATE SEND
  const [uploadProgress, setUploadProgress] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const messageAudio = useRef(new Audio(notificationSound));
  const joinAudio = useRef(new Audio(joinSound));

  const compressImage = async (file) => {
  const options = {
    maxSizeMB: 0.5,          // ⬅️ max 500 KB
    maxWidthOrHeight: 1280,  // ⬅️ resize large images
    useWebWorker: true,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error("Compression failed", error);
    return file; // fallback
  }
};

useEffect(() => {
  api.get("/users/count").then(res => {
    setTotalUsers(res.data.totalUsers);
  });
}, []);



  /* ================= LOAD PROFILE ================= */
  useEffect(() => {
    api.get("/users/me").then(res => setMyProfile(res.data));
  }, []);

  /* ================= LOAD CHAT ================= */
  useEffect(() => {
    api.get("/chat").then(res => setMessages(res.data));
  }, []);

  /* ================= SOCKET ================= */
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
      setMessages(prev => [...prev, { system: true, text: `${username} joined the chat` }]);
    });

    socketRef.current.on("userLeft", username => {
      if (username === myProfile.username) return;
      setMessages(prev => [...prev, { system: true, text: `${username} left the chat` }]);
    });

    socketRef.current.on("typing", username => {
      if (username !== myProfile.username) setTypingUser(username);
    });

    socketRef.current.on("stopTyping", () => setTypingUser(""));

    return () => socketRef.current.disconnect();
  }, [myProfile]);

  /* ================= AUTOSCROLL ================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  /* ================= HELPERS ================= */
  const getAvatarUrl = sender => {
  if (!sender?.avatar) return "/default.jpg";
  return `${sender.avatar}`;
};

  const formatTime = date =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  /* ================= SEND MESSAGE (FIXED) ================= */
const sendMessage = async () => {
  if (sending) return;
  if (!text.trim() && !imageFile) return;

  try {
    setSending(true);

    if (imageFile) {
      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await api.post("/chat/image", formData, {
        onUploadProgress: progressEvent => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percent);
        },
      });

      socketRef.current.emit("sendMessage", {
        text: text.trim() || null,
        image: res.data.image,
      });
    } else {
      socketRef.current.emit("sendMessage", {
        text: text.trim(),
        image: null,
      });
    }

    socketRef.current.emit("stopTyping");

    setText("");
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  } catch (err) {
    console.error("Upload failed", err);
  } finally {
    setSending(false);
    setUploadProgress(0);
  }
};


  /* ================= TYPING ================= */
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

  /* ================= JSX ================= */
  return (
    <div className="h-screen flex flex-col bg-gray-100">

    {/* HEADER */}
      <div className="bg-blue-700 text-white p-4 fixed top-0 w-full">
        <div className="flex justify-between items-center ">
          <div>
            <p className="font-bold text-lg">{t("header.Brand")}</p>
            <p className="text-xs flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {t("chat.online")}: {onlineCount}
              <span>/ {t("chat.totalUsers")}: {totalUsers}</span>
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
                onError={e => {
                    e.currentTarget.src = "/default.jpg";
                  }}
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
                onError={e => {
                    e.currentTarget.src = "/default.jpg";
                  }}
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
      <div className="flex-1 overflow-y-auto p-4 pt-24 space-y-4 my-10">
        {messages.map((msg, i) =>
          msg.system ? (
            <p key={i} className="text-center text-xs text-gray-400 italic">
              {msg.text}
            </p>
          ) : (
            <div
              key={msg._id || i}
              className={`flex gap-3 ${msg.sender?._id === myProfile?._id ? "justify-end" : "justify-start"}`}
            >
             {msg.sender?._id !== myProfile?._id && (
                <img
                  src={getAvatarUrl(msg.sender)}
                  onError={e => {
                    e.currentTarget.src = "/default.jpg";
                  }}
                  className="w-8 h-8 rounded-full object-cover"
                  alt="avatar"
                />
                )}


              <div className="max-w-xs">
                {msg.sender?._id !== myProfile?._id && (
                  <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold">
                        {msg.sender?.username}
                      </p>

                      {msg.sender?.role === "admin" && (
                        <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">
                          ADMIN
                        </span>
                      )}
                  </div>
                )}

                <div className={`rounded-2xl px-3 py-2 ${
                  msg.image ? "" :
                  msg.sender?._id === myProfile?._id
                    ? "bg-blue-600 text-white"
                    : "bg-white"
                }`}>
                  {msg.text && <p>{msg.text}</p>}
                  {msg.image && (
                    <img
                      src={msg.image}
                      className="rounded-xl max-w-full"
                      alt="រលុបហើយអត់លុយបង់SERVER."
                    />
                  )}
                </div>

                <p className="text-xs text-gray-400 mt-1">{formatTime(msg.createdAt)}</p>
              </div>
            </div>
          )
        )}

        {typingUser && <p className="text-xs italic">{typingUser} is typing…</p>}
        <div ref={bottomRef} />
      </div>

  <div className="fixed bottom-0 w-full">
        {/* IMAGE PREVIEW */}
    {imagePreview && (
  <div className="p-3 space-y-2">
    <div className="flex items-center gap-3">
      <img
        src={imagePreview}
        className="w-20 h-20 rounded-lg object-cover border"
      />
      <button
        onClick={() => {
          setImagePreview(null);
          setImageFile(null);
          setUploadProgress(0);
        }}
        className="text-red-500 text-sm"
      >
        ✕ Remove
      </button>
    </div>

    {/* 🔵 Upload Progress */}
    {sending && uploadProgress > 0 && (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-200"
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
    )}
  </div>
)}


      {/* INPUT */}
      <div className="p-3 bg-white border-t border-gray-300 flex items-end gap-2">

        <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async e => {
              const file = e.target.files[0];
              if (!file) return;

              const compressedFile = await compressImage(file);

              setImageFile(compressedFile);
              setImagePreview(URL.createObjectURL(compressedFile));
            }}
          />


        <button
          disabled={sending}
          onClick={() => fileInputRef.current.click()}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          <FaImage className="text-gray-400" size={22} />
      </button>


        <textarea
          disabled={sending}
          value={text}
          rows={1}
          onChange={e => handleTyping(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={t("chat.typeMessage")}
          className="flex-1 resize-none rounded-2xl border border-blue-200 px-4 py-2 focus:border-0 focus:ring-2 focus:ring-blue-500"
        />


        <button
          disabled={sending || (!text.trim() && !imageFile)}
          onClick={sendMessage}
          className="bg-blue-600 text-white px-5 py-2 rounded-full disabled:bg-gray-300"
        >
          <FiSend size={20} />   {/* React icon instead of emoji */}
      </button>
      </div>
  </div>
    </div>
  );

}
