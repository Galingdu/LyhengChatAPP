import { io } from "socket.io-client";
const apiUrl = import.meta.env.VITE_BASE_URL;

let socket;

export const connectSocket = (token) => {
  socket = io(apiUrl, {
    auth: { token },
  });
  return socket;
};

export const getSocket = () => socket;
