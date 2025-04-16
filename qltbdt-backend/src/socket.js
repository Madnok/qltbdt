const userSockets = new Map(); // Lưu trữ socket của người dùng: Map<userId, socketId>
const { verify } = require('jsonwebtoken');
const { Server } = require("socket.io");

let ioInstance = null;

// Middleware xác thực Socket.IO
const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth?.token; // Ưu tiên lấy từ đây

    console.log("Socket Auth - Received Auth Token:", token); // Log token nhận được

    if (!token) {
        console.error('Socket Auth Error: No token provided in auth handshake');
        return next(new Error('Lỗi xác thực: No token provided')); // Thông báo lỗi rõ hơn
    }
    try {
        const decoded = verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        console.log("Socket Auth Success for User ID:", decoded.id);
        next();
    } catch (err) {
        console.error('Socket Auth Error: Invalid token.', err.message);
        next(new Error('Lỗi xác thực: Invalid token'));
    }
};

// Hàm khởi tạo và cấu hình Socket.IO
function initializeSocket(server) { // server là httpServer
    if (ioInstance) {
        return ioInstance;
    }

    const allowedOrigins = [
        "http://localhost:3000",
        process.env.FRONTEND_URL
    ];

    ioInstance = new Server(server, {
        pingTimeout: 60000,
        cors: {
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS for Socket.IO"));
                }
            },
            methods: ["GET", "POST"],
            credentials: true
        }
    });
    ioInstance.use(authenticateSocket);
    ioInstance.on('connection', (socket) => {
        const userId = socket.user?.id;
        if (!userId) {
            socket.disconnect(true);
            return;
        }
        const userRoom = String(userId);
        socket.join(userRoom);
        socket.on('disconnect', (reason) => {
        });
    });

    console.log("Socket.IO đã được khởi tạo.");
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
