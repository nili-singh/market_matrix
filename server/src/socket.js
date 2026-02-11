import { io } from "socket.io-client";

const socket = io("https://market-matrix-t2nc.onrender.com", {
  transports: ["websocket"],
  withCredentials: true
});

export default socket;
