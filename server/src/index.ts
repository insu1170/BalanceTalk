import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import webSocket from "./socket";
import fs from "fs";
import path from "path";

dotenv.config(); // .env 파일 로드

const app = express();
app.use(express.json()); // ⭐ JSON 데이터 받기 필수!
app.use(cors());

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.io 연결
webSocket(server); // socket.ts에 정의된 함수 실행

// 서버 시작
server.listen(4000, () => {
  console.log("✅ Server listening on port 4000");
});


app.post("/api/rooms", (req, res) => {
  const { title, participants } = req.body;

  // 1) 방 ID 생성
  const roomId = Date.now().toString(); 

  // 2) 저장될 객체 구성
  const newRoom = {
    id: roomId,
    title,
    participants,
  };

  // 3) room.json 파일 경로
  const filePath = path.join(process.cwd(), "rooms", "room.json");

  // 4) 기존 파일 읽기 (없으면 빈 배열)
  let rooms = [];
  if (fs.existsSync(filePath)) {
    const fileData = fs.readFileSync(filePath, "utf-8");
    try {
      rooms = JSON.parse(fileData);
    } catch (err) {
      rooms = [];
    }
  }

  // 5) 새 방 추가
  rooms.push(newRoom);

  // 6) 파일 저장
  fs.writeFileSync(filePath, JSON.stringify(rooms, null, 2));

  console.log("📌 새로운 방 저장됨:", newRoom);

  res.json({
    message: "방 생성 완료",
    room: newRoom,
  });
});



app.get("/api/rooms", (req, res) => {
  const filePath = path.join(process.cwd(), "rooms", "room.json");
  console.log('get rooms')
  if (!fs.existsSync(filePath)) {
    // 파일 없으면 빈 배열 반환
    return res.json([]);
  }

  try {
    const fileData = fs.readFileSync(filePath, "utf-8");
    const rooms = JSON.parse(fileData);
    return res.json(rooms);
  } catch (err) {
    console.error("room.json 읽기 오류:", err);
    return res.status(500).json({ message: "방 목록 읽기 실패" });
  }
});