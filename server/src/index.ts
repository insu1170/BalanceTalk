import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import webSocket from "./socket";

dotenv.config(); // .env 파일 로드

const app = express();
app.use(cors());

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.io 연결
webSocket(server); // socket.ts에 정의된 함수 실행

// 서버 시작
server.listen(4000, () => {
  console.log("✅ Server listening on port 4000");
});
