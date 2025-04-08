const userSockets = new Map(); // Lưu trữ socket của người dùng: Map<userId, socketId>

function initializeSocket(io) {
    io.on('connection', (socket) => {
        console.log('Người dùng đã kết nối:', socket.id);

        // Lắng nghe sự kiện khi user đăng ký ID của họ
        socket.on('register_user', (userId) => {
            if (userId) {
                console.log(`User ${userId} đăng ký với socket ${socket.id}`);
                userSockets.set(userId.toString(), socket.id);
                 socket.emit('user_registered', { userId, socketId: socket.id });
            }
        });

        socket.on('disconnect', () => {
            console.log('User ngắt kết nối:', socket.id);
            // Xóa user khỏi Map khi họ disconnect
            for (let [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    console.log(`User ${userId} chưa đăng ký socket.`);
                    break;
                }
            }
        });
    });
}

// Hàm để gửi sự kiện tới một user cụ thể
function emitToUser(io, userId, eventName, data) {
     const targetUserId = userId?.toString(); // Đảm bảo là string
     if (!targetUserId) {
         console.warn("Đã cố gắng phát ra tín hiệu tới userId nhưng giá trị là null hoặc undefined.");
         return;
     }
    const socketId = userSockets.get(targetUserId);
    if (socketId) {
        console.log(`Phát tín hiệu ${eventName} đến người dùng ${userId} (socket ${socketId})`);
        io.to(socketId).emit(eventName, data);
    } else {
        console.log(`User ${userId} không tìm thấy hoặc không kết nối.`);
    }
}


module.exports = { initializeSocket, emitToUser };