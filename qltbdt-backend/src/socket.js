const userSockets = new Map(); // Lưu trữ socket của người dùng: Map<userId, socketId>
const { verify } = require('jsonwebtoken');
const { Server } = require("socket.io");
const cookie = require('cookie');

let ioInstance = null;

// Middleware xác thực Socket.IO
const authenticateSocket = (socket, next) => {
    let token = null;
    try {
        // Parse cookie header một cách an toàn
        const cookies = cookie.parse(socket.handshake.headers?.cookie || '');
        token = cookies.token; // Lấy giá trị của cookie tên 'token'

        if (!token) {
            return next(new Error('Lỗi xác thực: Không tìm thấy token cookie'));
        }

        // Xác thực token lấy từ cookie
        const decoded = verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // Gắn user vào socket
        next(); 
    } catch (err) {
        console.error('Socket Auth Error:', err.message);
        next(new Error(`Lỗi xác thực Socket: ${err.message}`)); // Trả lỗi về client
    }
};

// Hàm khởi tạo và cấu hình Socket.IO
function initializeSocket(server) {
    if (ioInstance) return ioInstance;

    const allowedOrigins = [
        "http://localhost:3000",
        process.env.FRONTEND_URL
    ];

    ioInstance = new Server(server, {
        cors: {
            origin: function (origin, callback) {
                 if (!origin || allowedOrigins.includes(origin)) {
                     callback(null, true);
                 } else {
                     console.error(`CORS Error: Origin ${origin} not allowed for Socket.IO.`);
                     callback(new Error("Not allowed by CORS for Socket.IO"));
                 }
            },
            methods: ["GET", "POST"],
            credentials: true // Rất quan trọng để trình duyệt gửi cookie
        }
    });

    ioInstance.use(authenticateSocket); // Dùng middleware auth đã sửa

    ioInstance.on('connection', (socket) => {
         const userId = socket.user?.id;
         if (!userId) { /* ... xử lý lỗi user không có ID ... */ return; }
         const userRoom = String(userId);
         socket.join(userRoom);
         console.log(`User ${userId} connected and joined room ${userRoom}. Socket: ${socket.id}`);
         socket.on('disconnect', (reason) => { /* ... */ });
    });

    console.log("Socket.IO initialized with cookie authentication.");
    return ioInstance;
}

// Hàm gửi sự kiện tới room của user cụ thể
function emitToUser(userId, eventName, data) {
    if (!ioInstance) {
        console.error("không thể phát: Socket.IO instance not initialized.");
        return;
    }
    const targetUserId = userId?.toString();
    if (!targetUserId) {
        console.warn("Đã cố gắng gửi tới người dùng nhưng userId không hợp lệ.");
        return;
    }
    console.log(`Emit event [${eventName}] đến room: ${targetUserId}`);
    // Gửi tới room có tên là userId
    ioInstance.to(targetUserId).emit(eventName, data);
}

// Export hàm khởi tạo và hàm emit
module.exports = {
    initializeSocket,
    emitToUser,
    getIoInstance: () => ioInstance 
};
