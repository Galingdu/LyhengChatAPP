import { useEffect, useState, useRef, use } from "react";
import api from "../services/api";
import { connectSocket } from "../services/socket";
import { Link, useNavigate } from "react-router-dom";
import { FaGamepad, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { MdUploadFile } from "react-icons/md";
import notificationSound from "../assets/notification.mp3";
import joinSound from "../assets/join.mp3"; // 🔔 add this sound
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUser, setTypingUser] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const { t } = useTranslation();
  const [myProfile, setMyProfile] = useState(null);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  const messageAudio = useRef(new Audio(notificationSound));
  const joinAudio = useRef(new Audio(joinSound));

  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_BASE_URL;

  // 🔐 decode JWT
  const getPayload = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]));
  };

  const payload = getPayload();
  const myUserId = payload?.id;
  const myUsername = payload?.username;
  const avatarUrl = payload?.avatar
  ? `${apiUrl}/uploads/avatars/${payload.avatar}`
  : "/default-avatar.png";


  // 📥 Load messages
  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(()=>{
    const fetchProfile =  async () => {
      try{
        const res = await api.get("/users/me");
        setMyProfile (res.data);

      }catch(err){
        console.error("Failed to fetch profile:", err);
      }
    }
    fetchProfile();
  },[]);

  useEffect(() => {

    console.log("JWT payload:", payload);

  }, []);

  // 🔌 Socket
  useEffect(() => {
    if (!payload) return;

    socketRef.current = connectSocket(localStorage.getItem("token"));

    socketRef.current.on("newMessage", (message) => {
      setMessages((prev) => [...prev, message]);

      if (message.sender?._id !== myUserId) {
        messageAudio.current.play().catch(() => {});
      }
    });

    socketRef.current.on("onlineCount", setOnlineCount);

    socketRef.current.on("userJoined", (username) => {
      if (username === myUsername) return;

      joinAudio.current.play().catch(() => {});
      setMessages((prev) => [
        ...prev,
        { system: true, text: `${username} joined the chat` },
      ]);
    });

    socketRef.current.on("userLeft", (username) => {
      if (username === myUsername) return;

      setMessages((prev) => [
        ...prev,
        { system: true, text: `${username} left the chat` },
      ]);
    });

    socketRef.current.on("typing", (username) => {
      if (username !== myUsername) setTypingUser(username);
    });

    socketRef.current.on("stopTyping", () => setTypingUser(""));

    return () => socketRef.current.disconnect();
  }, [payload?.id]);

  // 🔽 Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const loadMessages = async () => {
    const res = await api.get("/chat");
    setMessages(res.data);
  };

  // 📤 Send message
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

  // 🖼 Image select
  const handleImageSelect = (file) => {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ✍️ Typing
  const handleTyping = (value) => {
    setText(value);

    if (!value.trim()) {
      socketRef.current.emit("stopTyping");
      return;
    }

    socketRef.current.emit("typing", myUsername);
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

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
        <div>
          <p className="font-bold"> {t('header.Brand')}</p>
          <p className="text-xs flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {t('chat.online')}: {onlineCount}
          </p>
        </div>

        <div className="flex items-center gap-4">
         <Link to="/game">
           <button className="flex items-center gap-1 bg-green-600 px-3 py-1 rounded text-sm">
            <FaGamepad /> {t('header.playGame')}
          </button>
         </Link>

<span className="flex items-center gap-2 text-sm">
  <img
    src={
      myProfile?.avatar
        ? `${apiUrl}/uploads/avatars/${myProfile.avatar}`
        : "/default.jpg"
    }
    alt="avatar"
    className="w-6 h-6 rounded-full object-cover border"
    onError={(e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = "/default.jpg";
    }}
  />
  <span>{myProfile?.username}</span>
</span>

<LanguageSwitcher/>



          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-red-500 px-3 py-1 rounded text-sm"
          >
            <FaSignOutAlt /> {t('header.logout')}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) =>
          msg.system ? (
            <div
              key={index}
              className="text-center text-xs text-gray-400 italic"
            >
              {msg.text}
            </div>
          ) : (
            <div
              key={msg._id || index}
              className={`flex gap-3 ${
                msg.sender?._id === myUserId
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              {msg.sender?._id !== myUserId && (
                <img
                  src={`${apiUrl}/uploads/avatars/${msg.sender.avatar}`}
                  className="w-8 h-8 rounded-full"
                />
              )}

              <div className="max-w-xs">
                <div
                  className={`rounded-lg ${
                    msg.image
                      ? "bg-transparent"
                      : msg.sender?._id === myUserId
                      ? "bg-blue-600 text-white px-3 py-2"
                      : "bg-white px-3 py-2"
                  }`}
                >
                  {msg.text && <p>{msg.text}</p>}
                  {msg.image && (
                    <img
                      src={`${apiUrl}/uploads/chats/${msg.image}`}
                      className="rounded-lg"
                    />
                  )}
                </div>

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

      {/* Image Preview */}
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

      {/* Input Bar */}
      <div className="p-3 bg-white flex gap-2 items-center border-t">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageSelect(e.target.files[0])}
        />

        <button
          onClick={() => fileInputRef.current.click()}
          className="p-2 rounded-full hover:bg-gray-200"
        >
          <MdUploadFile size={22} />
        </button>

        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder={t('chat.typeMessage')}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          disabled={!text.trim() && !imageFile}
          onClick={sendMessage}
          className="bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          {t('chat.send')}
        </button>
      </div>
    </div>
  );
}
