"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_1 = require("./socket");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const rooms_1 = require("./rooms");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const server = http_1.default.createServer(app);
(0, socket_1.initSocket)(server);
// -----------------------------
// 📌 기본 경로 설정
// -----------------------------
const LOGS_DIR = path_1.default.join(process.cwd(), "logs");
// logs 폴더 없으면 생성
if (!fs_1.default.existsSync(LOGS_DIR)) {
    fs_1.default.mkdirSync(LOGS_DIR, { recursive: true });
}
// -----------------------------
// 📌 방 생성 API
// -----------------------------
app.post("/api/rooms", (req, res) => {
    const { title, participants } = req.body;
    const newRoom = (0, rooms_1.createRoom)(title, participants || 2);
    // ⭐️ 채팅 로그 파일 생성
    const logFilePath = path_1.default.join(LOGS_DIR, `${newRoom.id}.json`);
    fs_1.default.writeFileSync(logFilePath, JSON.stringify([], null, 2));
    // 📢 방 생성 이벤트 브로드캐스트
    (0, socket_1.getIO)().emit("room_created", newRoom);
    res.json({ message: "방 생성 완료", room: newRoom });
});
// -----------------------------
// 📌 방 목록 조회
// -----------------------------
app.get("/api/rooms", (req, res) => {
    const rooms = (0, rooms_1.getRooms)();
    res.json(rooms);
});
// -----------------------------
// 📌 메시지 저장 (POST)
//     /api/rooms/:id/messages
// -----------------------------
app.post("/api/rooms/:id/messages", (req, res) => {
    const roomId = req.params.id;
    const { user = "익명", text, userId } = req.body;
    if (!text) {
        return res.status(400).json({ message: "text는 필수입니다." });
    }
    const logFilePath = path_1.default.join(LOGS_DIR, `${roomId}.json`);
    if (!fs_1.default.existsSync(logFilePath)) {
        return res.status(404).json({ message: "해당 방이 존재하지 않습니다." });
    }
    let messages = [];
    try {
        const fileData = fs_1.default.readFileSync(logFilePath, "utf-8");
        messages = JSON.parse(fileData);
    }
    catch {
        messages = [];
    }
    const newMessage = {
        id: Date.now().toString(),
        user,
        userId, // 👈 userId 저장 추가
        text,
        createdAt: new Date().toISOString(),
    };
    messages.push(newMessage);
    fs_1.default.writeFileSync(logFilePath, JSON.stringify(messages, null, 2));
    res.json({ message: "메시지 저장 완료", data: newMessage });
});
// -----------------------------
// 📌 메시지 조회 (GET)
//     /api/rooms/:id/messages
// -----------------------------
app.get("/api/rooms/:id/messages", (req, res) => {
    const roomId = req.params.id;
    const logFilePath = path_1.default.join(LOGS_DIR, `${roomId}.json`);
    if (!fs_1.default.existsSync(logFilePath))
        return res.json([]);
    try {
        const fileData = fs_1.default.readFileSync(logFilePath, "utf-8");
        const messages = JSON.parse(fileData);
        res.json(messages);
    }
    catch {
        res.status(500).json({ message: "메시지 읽기 실패" });
    }
});
// -----------------------------
server.listen(4000, () => {
    console.log("🔥 Server running on http://localhost:4000");
});
