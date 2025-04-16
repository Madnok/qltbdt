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
    const queryClient = useQueryClient();

    useEffect(() => {
        let newSocket = null;

        if (user?.id ) { 
            console.log("[SocketContext] Attempting socket connection for user:", user.id);
            const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

            newSocket = io(SOCKET_URL, {
                withCredentials: true 
            });

            newSocket.on('connect', () => {
                console.log('✅ [SocketContext] Connected:', newSocket.id);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('❌ [SocketContext] Disconnected:', reason);
            });

            newSocket.on('connect_error', (error) => {
                console.error('❌ [SocketContext] Connection Error:', error.message, error.data || '');
                toast.error("Lỗi kết nối máy chủ thông báo.");
                if (newSocket) newSocket.disconnect();
                setSocket(null);
            });

             newSocket.on('status_changed', (data) => {
                if (data?.newStatus === 'off') {
                    toast.error(data?.message || 'Tài khoản của bạn đã bị khóa!', { duration: 6000, icon: '🔒' });
                    setTimeout(() => logout(), 1500);
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


            setSocket(newSocket);

        } else {
            console.log("Không có user");
            setSocket(null);
        }

        // --- Hàm cleanup ---
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
    }, [user, logout, queryClient]); 

    const contextValue = useMemo(() => ({ socket }), [socket]);

    return (
        <SocketContext.Provider value={contextValue}>
            {children}
        </SocketContext.Provider>
    );
};