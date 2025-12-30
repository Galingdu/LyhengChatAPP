import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connectSocket } from "../services/socket";
import api from "../services/api";
import { t } from "i18next";

export default function Game() {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [me, setMe] = useState(null);
  const [players, setPlayers] = useState(null);
  const [playAgainRequested, setPlayAgainRequested] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState(null);
  const [mySymbol, setMySymbol] = useState(null);
  const [phase, setPhase] = useState("matching");
// matching | playing | ended


  const [result, setResult] = useState(null);
  const [winnerUserId, setWinnerUserId] = useState(null);
  const [showResultPopup, setShowResultPopup] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  // 🔐 LOAD ME
  useEffect(() => {
    api.get("/users/me").then(res => setMe(res.data));
  }, []);

  // 🔌 SOCKET
  useEffect(() => {
    if (!me) return;

    const token = localStorage.getItem("token");
    socketRef.current = connectSocket(token);

    socketRef.current.emit("playRandom");

    socketRef.current.on("waiting", () => {
      setPhase("matching");
    });

    socketRef.current.on("matchFound", ({ roomId, players, turn }) => {
      setRoomId(roomId);
      setPlayers(players);
      setTurn(turn);
      setPhase("playing");

      setMySymbol(players.X.id === me._id ? "X" : "O");
    });

    socketRef.current.on("gameUpdate", ({ board, turn }) => {
      setBoard(board);
      setTurn(turn);
    });

    socketRef.current.on("gameOver", ({ result, winnerUserId }) => {
      setResult(result);
      setWinnerUserId(winnerUserId || null);
      setPhase("ended");
      setShowResultPopup(true);
    });

    socketRef.current.on("gameChat", (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

socketRef.current.on("rematchStarted", ({ board, turn, players }) => {
  // 🔴 freeze UI
  setPhase("matching");

  // 🔄 reset result-related UI
  setResult(null);
  setWinnerUserId(null);
  setShowResultPopup(false);
  setPlayAgainRequested(false);

  // 🔄 update game data
  setBoard(board);
  setPlayers(players);
  setTurn(turn);

  // 🔁 recompute my symbol
  const newSymbol = players.X.id === me._id ? "X" : "O";
  setMySymbol(newSymbol);

  // ✅ now safely enter game
  setPhase("playing");
});


    return () => socketRef.current.disconnect();
  }, [me]);

  const handleMove = (index) => {
    if (phase !== "playing") return;
    if (board[index]) return;
    if (turn !== mySymbol) return;

    socketRef.current.emit("makeMove", { roomId, index });
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current.emit("gameChat", { roomId, message: chatInput });
    setChatInput("");
  };

  const handlePlayAgain = () => {
  socketRef.current.emit("playAgain", { roomId });
  setPlayAgainRequested(true);
};


  return (
    <div className="flex justify-center mt-10">
      <div className="bg-white max-w-3xl w-full rounded-xl shadow-lg p-6">

       {/* HEADER */}
<div className="flex justify-between items-center mb-4 p-4 bg-gradient-to-r from-red-400 to-orange-400 rounded-lg shadow-lg transform transition-transform duration-300 hover:scale-105">
  <h2 className="md:text-3xl text-2xl font-bold text-white animate-bounce">
    🎮 Tic Tac Toe
  </h2>
  <button
    onClick={() => navigate("/chat")}
    className="bg-white text-red-500 px-4 py-2 rounded-lg shadow transition-colors duration-300 hover:bg-red-500 hover:text-white transform hover:scale-105"
  >
    {t("game.leftGame")}
  </button>
</div>


       {/* PLAYER VS */}

{players && (
  <div className="flex justify-between items-center mb-4">
    <div className="player-card">
   <PlayerCard
  player={players.X}
  active={phase === "playing" && turn === "X"}
  symbol="X"
/>
    </div>
    
    <div className=" flex items-center justify-center gap-1 flex-col">
      <span className="result-icon">⚔️</span>
      {result === "draw" && <h2>🤝 Draw</h2>}
      {result === "opponent_left" && <h2>🚪 Opponent Left</h2>}
      {result !== "draw" && result !== null && result !== "opponent_left" && (
        winnerUserId === me._id
          ? <h2>🎉 You Win!</h2>
          : <h2>😞 You Lose</h2>
      )}
         {/* TURN */}
        <div className="text-center mb-4">
         

          {phase === "playing" && turn && mySymbol && (
            <span
              className={`px-4 py-1 rounded-full text-sm font-semibold
                ${turn === mySymbol
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"}`}
            >
              {turn === mySymbol ? "Your Turn" : "Opponent Turn"}
            </span>
          )}
      </div>
    </div>
    
    <div className="player-card">
      <PlayerCard
  player={players.O}
  active={phase === "playing" && turn === "O"}
  reverse
  symbol="O"
/>
    </div>
  </div>
)}

        <div className="flex items-center justify-center mb-5">
           {phase === "matching" && (
            <p className="text-gray-500 animate-pulse">
              Finding opponent…
            </p>
          )}
        </div>


       {/* BOARD */}
        
          <div className="grid grid-cols-3 gap-3 mx-auto w-fit">
            {board.map((cell, i) => (
              <button
                key={i}
                onClick={() => handleMove(i)}
                className="cell transition-transform duration-300 ease-in-out hover:scale-102"
              >
                {cell}
              </button>
            ))}
            
          </div>


           {phase === "ended" && result !== "opponent_left" && (
  <div className="text-center mt-5">
    <button
      onClick={handlePlayAgain}
      disabled={playAgainRequested}
      className={`border border-gray-300 rounded-lg shadow-lg bg-gradient-to-r from-yellow-200 to-red-200 px-4 py-3 transition duration-600 ease-in-out  hover:scale-102
        ${playAgainRequested
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
        }`}
    >
      🔁 Play Again
    </button>

    {playAgainRequested && result !== "opponent_left" && (
      <p className="text-sm text-gray-500 mt-2 animate-pulse">
        Waiting for opponent…
      </p>
    )}
  </div>
        )}
    


        {/* CHAT */}
        <div className="mt-6 border-t pt-4">
          <div className="h-32 overflow-y-auto text-sm">
            {chatMessages.map((m, i) => (
              <p key={i}><b>{m.sender}:</b> {m.message}</p>
            ))}
          </div>

         <div className="flex gap-2 mt-2">
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            className="flex-1 border border-gray-300 focus:outline-none focus:border-yellow-400 rounded-lg shadow-lg bg-gradient-to-r from-yellow-200 to-red-200 px-4 py-3 transition duration-300 ease-in-out transform hover:scale-101"
            onKeyDown={e => e.key === "Enter" && sendChat()}
            placeholder="Type your message..."
          />
          <button
            onClick={sendChat}
            className="bg-red-500 text-white px-4 rounded-lg shadow-lg transition duration-300 ease-in-out hover:bg-red-600 transform hover:scale-105"
          >
            Send
          </button>
      </div>

        </div>

        {/* RESULT POPUP */}
       {showResultPopup && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center animate-fade-in">
    <div className="bg-gradient-to-br from-yellow-400 to-orange-600 p-6 rounded-xl text-center flex flex-col items-center justify-center gap-4 animate-popup">
      {result === "draw" && <h2 className="text-2xl text-white">🤝 Draw</h2>}
      {result === "opponent_left" && <h2 className="text-2xl text-white">🚪 Opponent Left</h2>}
      {result !== "draw" && result !== "opponent_left" && (
        winnerUserId === me._id
          ? <h2 className="text-2xl text-white">🎉 You Win!</h2>
          : <h2 className="text-2xl text-white">😞 You Lose</h2>
      )}
     <div className="flex items-center justify-between gap-2">
      {result !== "opponent_left" &&( <button
        onClick={() => setShowResultPopup(false)}
        className="border border-gray-300 rounded-lg shadow-lg bg-gradient-to-r from-yellow-200 to-red-200 px-4 py-3 transition duration-600 ease-in-out  hover:scale-102"
      >
        Close
      </button>)}
      {result == "opponent_left" &&( <button
        onClick={() => navigate("/chat")}
        className="border border-gray-300 rounded-lg shadow-lg bg-gradient-to-r from-yellow-200 to-red-200 px-4 py-3 transition duration-600 ease-in-out  hover:scale-102"
      >
        Close
      </button>)}
     
        {phase === "ended" && result !== "opponent_left" && (
  <div className="text-center">
    <button
      onClick={handlePlayAgain}
      disabled={playAgainRequested}
      className={`border border-gray-300 rounded-lg shadow-lg bg-gradient-to-r from-yellow-200 to-red-200 px-4 py-3 transition duration-600 ease-in-out  hover:scale-102
        ${playAgainRequested
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
        }`}
    >
      🔁 Play Again
    </button>

   
  </div>
        )}
     </div>
      {playAgainRequested && result !== "opponent_left" && (
      <p className="text-sm text-gray-500 mt-2 animate-pulse">
        Waiting for opponent…
      </p>
    )}
    </div>
  </div>
)}

      </div>


    </div>
  );
}

function PlayerCard({ player, active, reverse, symbol }) {
  const avatar = player.avatar || "/default.jpg";

  return (
    <div
      className={`flex items-center gap-2 ${
        reverse ? "flex-row-reverse" : ""
      }`}
    >
      <img
        src={avatar}
        className={`w-12 h-12 rounded-full border-3 ${
          active ? "border-green-500" : "border-gray-300"
        }`}
      />

      <div className={`flex flex-col ${reverse ? "items-end" : "items-start"}`}>
        <span className="font-semibold">{player.username}</span>
        <span className="text-xs text-gray-500">
          Playing as <b>{symbol}</b>
        </span>
      </div>
    </div>
  );
}

