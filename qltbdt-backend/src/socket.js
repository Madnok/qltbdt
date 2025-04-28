const { verify } = require('jsonwebtoken');
const { Server } = require("socket.io");
const cookie = require('cookie');

let ioInstance = null;

// Middleware xác thực Socket.IO
const authenticateSocket = (socket, next) => {
    try {
        const cookies = cookie.parse(socket.handshake.headers?.cookie || '');
        const token = cookies.token;
        if (!token) return next(new Error('Lỗi xác thực: Không tìm thấy token cookie'));

        const decoded = verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        console.error('Socket Auth Error:', err.message);
        next(new Error(`Lỗi xác thực Socket: ${err.message}`));
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
            credentials: true
        }
    });

    ioInstance.use(authenticateSocket);

    ioInstance.on('connection', (socket) => {
        const userId = socket.user?.id;
        if (!userId) {
            console.warn('Socket connected without userId.');
            return;
        }
        const userRoom = String(userId);
        socket.join(userRoom);
        console.log(`User ${userId} connected and joined room ${userRoom}. Socket: ${socket.id}`);

        socket.on('disconnect', (reason) => {
            console.log(`User ${userId} disconnected. Reason: ${reason}`);
        });
    });

    console.log("Socket.IO initialized with cookie authentication.");
    return ioInstance;
}

// Hàm gửi sự kiện tới room của user cụ thể
function emitToUser(userId, eventName, data) {
    if (!ioInstance) {
        console.error("[emitToUser] Socket.IO instance not initialized.");
        return;
    }
    const targetRoom = userId?.toString();
    if (!targetRoom) {
        console.warn("[emitToUser] Invalid userId.");
        return;
    }

    const room = ioInstance.sockets.adapter.rooms.get(targetRoom);

    if (!room || room.size === 0) {
        console.warn(`[emitToUser] No active sockets found for user ${targetRoom}. Event '${eventName}' skipped.`);
        return;
    }

    ioInstance.to(targetRoom).emit(eventName, data);
    console.log(`[emitToUser] Emitted '${eventName}' to user ${targetRoom}.`);
}

module.exports = {
    initializeSocket,
    emitToUser,
    getIoInstance: () => ioInstance
};
