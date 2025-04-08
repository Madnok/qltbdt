import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthProvider';
import { toast } from 'react-toastify'; // Import toast
import { useQueryClient } from '@tanstack/react-query'; // Import queryClient

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth(); // Lấy thông tin user từ AuthProvider
    const queryClient = useQueryClient(); // Lấy queryClient

    const connectSocket = useCallback(() => {
        // Chỉ kết nối nếu có user và chưa có socket
         if (user?.id && !socket) {
            console.log("Đang kết nối đến socket cho user:", user.id);
            const newSocket = io('http://localhost:5000', { // Địa chỉ backend
                withCredentials: true,
                 // query: { userId: user.id }
            });

            newSocket.on('connect', () => {
                console.log('Đã kết nối socket:', newSocket.id);
                 // Đăng ký userId với server sau khi kết nối thành công
                 newSocket.emit('register_user', user.id);
            });

            newSocket.on('user_registered', (data) => {
                 console.log('User đã được kiểm tra:', data);
             });

            // Lắng nghe sự kiện task mới hoặc được gán lại
            newSocket.on('new_task', (taskData) => {
                console.log('Có công việc mới:', taskData);
                toast.info(`🔔 Có công việc mới/cập nhật: ${taskData.moTa} ở phòng ${taskData.phong_name}`);
                // Invalidate các query liên quan để cập nhật UI
                queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
                // Có thể thêm invalidate cho query lấy thông báo nếu có
            });

             // Lắng nghe sự kiện task bị hủy
             newSocket.on('task_cancelled', (data) => {
                console.log('Hủy công việc:', data);
                toast.warn(`⚠️ Công việc ID ${data.baoHongId} đã bị quản trị viên hủy/thu hồi.`);
                queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] }); // Trang LichNhanVien
                queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });   // Trang BaoTri
                // Có thể cần invalidate thêm nếu task bị hủy có ảnh hưởng đến các query khác
            });

            newSocket.on('disconnect', () => {
                console.log('Ngắt kết nối socket');
                // Có thể thử kết nối lại ở đây nếu muốn
                setSocket(null); // Reset socket state
            });

            newSocket.on('connect_error', (err) => {
                console.error('Lỗi kết nối socket:', err.message);
                 // Có thể hiển thị thông báo lỗi cho người dùng
                 setSocket(null);
            });

            setSocket(newSocket);
         } else if (!user?.id && socket) {
             // Nếu user đăng xuất, ngắt kết nối socket
              console.log("Ngắt kết nối đến socket vì user logout.");
              socket.disconnect();
              setSocket(null);
         }
    }, [user, socket, queryClient]); // Thêm queryClient vào dependency

    useEffect(() => {
         connectSocket(); // Kết nối khi user thay đổi

         // Cleanup khi component unmount hoặc user thay đổi
        return () => {
            if (socket) {
                console.log("Ngắt kết nối và cleanup.");
                socket.disconnect();
                setSocket(null);
            }
        };
    }, [connectSocket, socket]); // Chỉ phụ thuộc vào connectSocket và socket


    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};