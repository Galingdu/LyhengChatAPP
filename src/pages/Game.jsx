import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket } from "../services/socket";
import api from "../services/api";
import { t } from "i18next";

export default function Game() {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [status, setStatus] = useState("matching");
  const [roomId, setRoomId] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState(null);
  const [mySymbol, setMySymbol] = useState(null);
  const [result, setResult] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [playAgainRequested, setPlayAgainRequested] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const apiUrl = import.meta.env.VITE_BASE_URL;

  // 🔐 Load profile
  useEffect(() => {
    api.get("/users/me");
  }, []);

  // 🔌 Socket
  useEffect(() => {
    const token = localStorage.getItem("token");
    socketRef.current = connectSocket(token);

    socketRef.current.emit("playRandom");

    socketRef.current.on("waiting", () => {
      setStatus("matching");
    });

    socketRef.current.on("matchFound", ({ roomId, players, turn }) => {
      setRoomId(roomId);
      setTurn(turn);
      setStatus("playing");

      const myId = socketRef.current.id;
      setMySymbol(players.X === myId ? "X" : "O");
    });

    socketRef.current.on("gameUpdate", ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
    });

    socketRef.current.on("gameOver", ({ result, winningLine }) => {
      setResult(result);
      setWinningLine(winningLine || []);
      setStatus("ended");
    });

    socketRef.current.on("rematchStarted", ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
      setResult(null);
      setWinningLine([]);
      setStatus("playing");
      setPlayAgainRequested(false);
    });

    socketRef.current.on("gameChat", (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => socketRef.current.disconnect();
  }, []);

  // 🎮 Move
  const handleMove = (index) => {
    if (status !== "playing") return;
    if (board[index]) return;
    if (turn !== mySymbol) return;

    socketRef.current.emit("makeMove", { roomId, index });
  };

  // 💬 Chat
  const sendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current.emit("gameChat", { roomId, message: chatInput });
    setChatInput("");
  };

  // 🔁 Play again
  const handlePlayAgain = () => {
    socketRef.current.emit("playAgain", { roomId });
    setPlayAgainRequested(true);
  };

  const handleLeave = () => {
    if (confirm(t("game.leftGameAlert"))) {
      navigate("/chat");
    }
  };

  return (
  <div>
      <div className="m-5 ms-10 max-w-xl rounded-xl border border-yellow-300 bg-yellow-50 p-5 text-yellow-900 shadow-sm">
  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
    🎮 Game Rules
  </h3>

  <ul className="list-disc list-inside space-y-1 text-sm">
    <li>Two players are matched randomly.</li>
    <li>Players take turns placing <strong>X</strong> or <strong>O</strong>.</li>
    <li>The first player to align 3 symbols wins.</li>
    <li>If all cells are filled with no winner, the game is a draw.</li>
    <li>
      <strong>Leaving, refreshing, or closing the page counts as a loss.</strong>
    </li>
    <li>Private chat is available only during the game.</li>
    <li>You can play again if both players agree.</li>
  </ul>

  <p className="mt-3 text-xs text-yellow-700">
    ⚠️ This is a casual game. Chat and game data are not saved.
  </p>
</div>

    <div className="flex justify-center mt-10 px-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">🎮 Tic Tac Toe</h2>
          <button
            onClick={handleLeave}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            {t("game.leftGame")}
          </button>
        </div>

        {/* STATUS */}
        <div className="text-center mb-4">
          {status === "matching" && (
            <p className="text-gray-500 animate-pulse">Finding opponent…</p>
          )}

          {status === "playing" && (
            <span className={`px-4 py-1 rounded-full text-sm font-semibold
              ${turn === mySymbol ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
              {turn === mySymbol ? "Your Turn" : "Opponent Turn"}
            </span>
          )}

          {status === "ended" && (
            <p className="text-xl font-bold mt-2">
              {result === mySymbol && "🎉 You Win!"}
              {result === "draw" && "🤝 Draw"}
              {result !== mySymbol && result !== "draw" && "😞 You Lose"}
            </p>
          )}
        </div>

        {/* BOARD */}
        <div className="grid grid-cols-3 gap-3 mx-auto w-fit">
          {board.map((cell, i) => {
            const isWin = winningLine.includes(i);

            return (
              <button
                key={i}
                onClick={() => handleMove(i)}
                className={`
                  w-24 h-24 sm:w-28 sm:h-28
                  text-4xl font-bold rounded-lg
                  border flex items-center justify-center
                  transition-all
                  ${isWin ? "bg-green-100 text-green-700 scale-105" : "bg-white"}
                  ${status === "playing" && !cell ? "hover:bg-gray-100" : ""}
                `}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {/* PLAY AGAIN */}
        {status === "ended" && (
          <div className="text-center mt-6">
            <button
              onClick={handlePlayAgain}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg"
            >
              🔁 Play Again
            </button>

            {playAgainRequested && (
              <p className="text-sm text-gray-500 mt-2 animate-pulse">
                Waiting for opponent…
              </p>
            )}
          </div>
        )}

        {/* CHAT */}
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold mb-2">💬 Private Chat</h3>

          <div className="h-40 overflow-y-auto text-sm space-y-2 mb-2">
            {chatMessages.map((m, i) => (
              <p key={i}>
                <strong>{m.sender}:</strong> {m.message}
              </p>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 border rounded px-2 py-1"
              placeholder="Message…"
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
            />
            <button
              onClick={sendChat}
              className="bg-blue-600 text-white px-3 rounded"
            >
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
  );
}
