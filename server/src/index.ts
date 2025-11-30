import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import webSocket from "./socket";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
webSocket(server);

// -----------------------------
// 📌 기본 경로 설정
// -----------------------------
const ROOMS_FILE = path.join(process.cwd(), "rooms", "room.json");
const LOGS_DIR = path.join(process.cwd(), "logs");

// logs 폴더 없으면 생성
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// -----------------------------
// 📌 방 생성 API
// -----------------------------
app.post("/api/rooms", (req, res) => {
  const { title, participants } = req.body;
  const roomId = Date.now().toString();

  const newRoom = { id: roomId, title, participants };

  let rooms = [];
  if (fs.existsSync(ROOMS_FILE)) {
    const fileData = fs.readFileSync(ROOMS_FILE, "utf-8");
    try {
      rooms = JSON.parse(fileData);
    } catch {
      rooms = [];
    }
  }

  rooms.push(newRoom);
  fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));

  // ⭐️ 채팅 로그 파일 생성
  const logFilePath = path.join(LOGS_DIR, `${roomId}.json`);
  fs.writeFileSync(logFilePath, JSON.stringify([], null, 2));

  res.json({ message: "방 생성 완료", room: newRoom });
});

// -----------------------------
// 📌 방 목록 조회
// -----------------------------
app.get("/api/rooms", (req, res) => {
  if (!fs.existsSync(ROOMS_FILE)) return res.json([]);

  try {
    const fileData = fs.readFileSync(ROOMS_FILE, "utf-8");
    const rooms = JSON.parse(fileData);
    res.json(rooms);
  } catch {
    res.status(500).json({ message: "방 목록 읽기 실패" });
  }
});

// -----------------------------
// 📌 메시지 저장 (POST)
//     /api/rooms/:id/messages
// -----------------------------
app.post("/api/rooms/:id/messages", (req, res) => {
  const roomId = req.params.id;
  const { user = "익명", text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "text는 필수입니다." });
  }

  const logFilePath = path.join(LOGS_DIR, `${roomId}.json`);

  if (!fs.existsSync(logFilePath)) {
    return res.status(404).json({ message: "해당 방이 존재하지 않습니다." });
  }

  let messages = [];
  try {
    const fileData = fs.readFileSync(logFilePath, "utf-8");
    messages = JSON.parse(fileData);
  } catch {
    messages = [];
  }

  const newMessage = {
    id: Date.now().toString(),
    user,
    text,
    createdAt: new Date().toISOString(),
  };

  messages.push(newMessage);
  fs.writeFileSync(logFilePath, JSON.stringify(messages, null, 2));

  res.json({ message: "메시지 저장 완료", data: newMessage });
});

// -----------------------------
// 📌 메시지 조회 (GET)
//     /api/rooms/:id/messages
// -----------------------------
app.get("/api/rooms/:id/messages", (req, res) => {
  const roomId = req.params.id;
  const logFilePath = path.join(LOGS_DIR, `${roomId}.json`);

  if (!fs.existsSync(logFilePath)) return res.json([]);

  try {
    const fileData = fs.readFileSync(logFilePath, "utf-8");
    const messages = JSON.parse(fileData);
    res.json(messages);
  } catch {
    res.status(500).json({ message: "메시지 읽기 실패" });
  }
});

// -----------------------------
server.listen(4000, () => {
  console.log("🔥 Server running on http://localhost:4000");
});
