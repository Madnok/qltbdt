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

        if (user?.id) {
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
                toast.info(`🔔 Có công việc mới: ${taskData.moTa}`);
                queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
            });
            newSocket.on('task_cancelled', (data) => {
                toast.warn(`⚠️ Công việc ID ${data.baoHongId} đã bị hủy.`);
                queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
            });
            newSocket.on('new_baohong_created', (data) => {
                toast.info(data.message || `Có báo hỏng mới!`);
                queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            });
            newSocket.on('asset_assigned_to_room', (data) => {
                toast.info(data.message || `Có cập nhật phân bổ tài sản.`);
                queryClient.invalidateQueries({ queryKey: ['taiSan'] });
                queryClient.invalidateQueries({ queryKey: ['availableAssetsForAssignment'] });
                queryClient.invalidateQueries({ queryKey: ['phongTableData'] });
                queryClient.invalidateQueries({ queryKey: ['thietBiTrongPhong', data.phongId] });
                queryClient.invalidateQueries({ queryKey: ['phong', data.phongId] });
                queryClient.invalidateQueries({ queryKey: ['phongList'] });
            });
            newSocket.on('new_assigned_task', (data) => {
                toast.info(data.message || 'Bạn có công việc mới!');
                if (data.type === 'baoduong') {
                    queryClient.invalidateQueries(['assignedBaoDuongTasks']);
                    queryClient.invalidateQueries(['baotriMyTasks']);
                } else if (data.type === 'baohong') {
                    queryClient.invalidateQueries(['assignedBaoHongTasks']);
                    queryClient.invalidateQueries(['baohongMyTasks']);
                }
            });

            const handleStatsUpdate = (data) => {
                console.log('[SocketContext] Received stats_updated event:', data);
                queryClient.invalidateQueries({ queryKey: ['thongKe'] });
            };
            newSocket.on('stats_updated', handleStatsUpdate);

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
                newSocket.off('new_baohong_created');
                newSocket.off('asset_assigned_to_room');
                newSocket.off('new_assigned_task');
                newSocket.off('stats_updated');
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