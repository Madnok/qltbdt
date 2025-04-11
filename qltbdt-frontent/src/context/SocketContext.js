import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthProvider';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user, logout } = useAuth();
    const queryClient = useQueryClient(); // Bỏ nếu không dùng

    useEffect(() => {
        let newSocket = null; // Khai báo biến tạm

        // Chỉ kết nối nếu user đã đăng nhập (có user.id)
        if (user?.id) {
            console.log("[SocketContext] Attempting socket connection for user:", user.id);
            // Lấy URL backend từ biến môi trường hoặc mặc định
            const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

            // Kết nối Socket.IO - quan trọng là withCredentials để gửi cookie token
            newSocket = io(SOCKET_URL, {
                withCredentials: true,
            });

            newSocket.on('connect', () => {
                console.log('✅ [SocketContext] Connected:', newSocket.id);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('❌ [SocketContext] Disconnected:', reason);
                // setSocket(null);
            });

            newSocket.on('connect_error', (error) => {
                toast.error("Lỗi kết nối máy chủ thông báo.");
                setSocket(null); // Reset socket state khi có lỗi kết nối
            });

            newSocket.on('status_changed', (data) => {
                if (data?.newStatus === 'off') {
                    toast.error(data?.message || 'Tài khoản của bạn đã bị khóa!', {
                        duration: 6000, // Hiển thị lâu hơn chút
                        icon: '🔒',
                    });
                    setTimeout(() => {
                        logout();
                    }, 1500);
                }
            });

            newSocket.on('new_task', (taskData) => {
                console.log('Có công việc mới:', taskData);
                toast.info(`🔔 Có công việc mới: ${taskData.moTa}`);
                queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
            });

            newSocket.on('task_cancelled', (data) => {
                console.log('Hủy công việc:', data);
                toast.warn(`⚠️ Công việc ID ${data.baoHongId} đã bị hủy.`);
                queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
            });

            setSocket(newSocket); // Lưu socket instance vào state

        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }

        // --- Hàm cleanup của useEffect ---
        return () => {
            if (newSocket) {
               console.log("[SocketContext] Cleaning up socket connection.");
               newSocket.off('connect');
               newSocket.off('disconnect');
               newSocket.off('connect_error');
               newSocket.off('status_changed');
               newSocket.off('new_task'); 
               newSocket.off('task_cancelled');
               newSocket.disconnect();
           }
       };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, logout]);

    // Memoize object chứa socket để tối ưu
    const contextValue = useMemo(() => ({ socket }), [socket]);

    return (
        // Cung cấp socket instance cho các component con
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};