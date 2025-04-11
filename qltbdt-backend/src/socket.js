const userSockets = new Map(); // Lưu trữ socket của người dùng: Map<userId, socketId>
const { verify } = require('jsonwebtoken');
const { Server } = require("socket.io");

let ioInstance = null;

// Middleware xác thực Socket.IO
const authenticateSocket = (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.split('token=')[1]?.split(';')[0];
    if (!token) {
        console.error('Lỗi xác thực: No token');
        return next(new Error('Lỗi xác thực: No token'));
    }
    try {
        const decoded = verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // Gắn { id, role } vào socket
        next();
    } catch (err) {
        console.error('Socket lỗi xác thực: Invalid token.', err.message);
        next(new Error('Lỗi xác thực: Invalid token'));
    }
};

// Hàm khởi tạo và cấu hình Socket.IO
function initializeSocket(server) { // Nhận httpServer
    if (ioInstance) {
        console.warn("Socket.IO already initialized.");
        return ioInstance;
    }

    ioInstance = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000", // Lấy từ env hoặc mặc định
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Áp dụng middleware xác thực
    ioInstance.use(authenticateSocket);

    // Xử lý kết nối - chỉ cần một io.on('connection')
    ioInstance.on('connection', (socket) => {
        const userId = socket.user?.id;
        if (!userId) {
            console.error('Từ chối kết nối socket: No user ID found after auth.', socket.id);
            socket.disconnect(true);
            return;
        }

        // Tự động cho user tham gia room riêng của họ
        const userRoom = String(userId);
        socket.join(userRoom);

        // Xử lý khi ngắt kết nối
        socket.on('disconnect', (reason) => {
            console.log(`User ${userId} ngắt kết nối khỏi ${userRoom}. Socket: ${socket.id}. Lý do: ${reason}`);
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
    getIoInstance: () => ioInstance // Cách an toàn để lấy io instance từ module khác
};
