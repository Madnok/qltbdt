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
                console.log('[SocketContext] Connected:', newSocket.id);
                queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
                queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
                queryClient.invalidateQueries({ queryKey: ['taiSan'] });
                queryClient.invalidateQueries({ queryKey: ['phongList'] });
                queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
                queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
                queryClient.invalidateQueries({ queryKey: ['myLichBaoDuong'] });
                queryClient.invalidateQueries({ queryKey: ['thongKe'] });
            });
            newSocket.on('disconnect', (reason) => {
                console.log('[SocketContext] Disconnected:', reason);
            });
            newSocket.on('connect_error', (error) => {
                console.error('[SocketContext] Connection Error:', error.message, error.data || '');
                if (newSocket) newSocket.disconnect();
                setSocket(null);
            });
            newSocket.on('status_changed', (data) => {
                if (data?.newStatus === 'off') {
                    toast.error(data?.message || 'Tài khoản của bạn đã bị khóa!', { duration: 6000, icon: '🔒' });
                    setTimeout(() => logout(), 1000);
                }
            });
            newSocket.on('user_deleted', (data) => {
                toast.error(data.message || 'Tài khoản của bạn đã bị xóa.', {
                    autoClose: false, // Không tự động đóng toast
                    closeOnClick: false,
                    draggable: false,
                    onClose: () => logout()
                });
                logout();
            });
            newSocket.on('task_cancelled', (data) => {
                const taskId = data.baoHongId || data.lichBaoDuongId;
                const taskType = data.baoHongId ? 'Báo hỏng' : 'Bảo dưỡng';
                // Hiển thị toast chung
                toast.warn(`Công việc ${taskType} ID ${taskId} đã bị cancel. ${data.reason || ''}`);

                // Invalidate dựa trên loại task
                setTimeout(() => {
                    if (data.baoHongId) {
                        queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                        queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
                        queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
                    } else if (data.lichBaoDuongId) {
                        queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
                        queryClient.invalidateQueries({ queryKey: ['myLichBaoDuong'] });
                        queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
                    }
                }, 300);
            });
            newSocket.on('new_baohong_created', (data) => {
                toast.info(data.message || `Có báo hỏng mới!`);
                queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
                queryClient.invalidateQueries({ queryKey: ['thongKe'] });
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
                queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
                queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
                queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
                queryClient.invalidateQueries({ queryKey: ['myLichBaoDuong'] });
                queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
            });
            newSocket.on('task_rework_request', (data) => {
                const taskId = data.baoHongId || data.lichBaoDuongId;
                const taskType = data.baoHongId ? 'Báo hỏng' : 'Bảo dưỡng';

                toast.warn(` Yêu cầu làm lại công việc ${taskType.toLowerCase()} ID ${taskId}. ${data.reason || ''}`);

                setTimeout(() => {
                    if (data.baoHongId) {
                        queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                        queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
                        queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
                    } else if (data.lichBaoDuongId) {
                        queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
                        queryClient.invalidateQueries({ queryKey: ['myLichBaoDuong'] });
                        queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
                    }
                }, 300);
            });
            const handleStatsUpdate = (data) => {
                queryClient.invalidateQueries({ queryKey: ['thongKe'] });

                if (data?.type === 'baohong') {
                    queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
                    queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                    queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
                } else if (data?.type === 'baoduong') {
                    queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
                    queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
                    queryClient.invalidateQueries({ queryKey: ['myLichBaoDuong'] });
                }
            };
            newSocket.on('stats_updated', handleStatsUpdate);

            newSocket.on('task_started', (data) => {
                const taskId = data.baoHongId || data.lichBaoDuongId;
                const taskType = data.baoHongId ? 'Báo hỏng' : 'Bảo dưỡng';
                const technicianName = data.technicianName || `NV ${data.technicianId}`;

                if (user?.role === 'admin') {
                    toast.info(`${technicianName} đã bắt đầu công việc ${taskType.toLowerCase()} ID ${taskId}.`);
                }

                setTimeout(() => {
                    if (data.baoHongId) {
                        queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
                        queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'assignedBaoHong' });
                        queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
                    } else if (data.lichBaoDuongId) {
                        queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
                        queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
                        queryClient.invalidateQueries({ queryKey: ['myLichBaoDuong'] });
                    }
                }, 300);
            });
            newSocket.on('task_needs_review', (data) => {
                const taskId = data.taskId || data.lichBaoDuongId;
                if (user?.role === 'admin') {
                    toast.info(`Công việc bảo dưỡng ID ${taskId} cần được xem xét.`);
                }
                setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
                    queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
                    queryClient.invalidateQueries({ queryKey: ['myLichBaoDuong'] });
                }, 300); // Delay nhỏ
            });
            newSocket.on('task_completed', (data) => {
                const taskId = data.taskId || data.lichBaoDuongId;
                toast.success(`Công việc bảo dưỡng ID ${taskId} đã được duyệt hoàn thành.`);

                setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
                    queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
                    queryClient.invalidateQueries({ queryKey: ['myLichBaoDuong'] });
                }, 300);
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
                newSocket.off('user_deleted')
                newSocket.off('task_started');
                newSocket.off('task_cancelled');
                newSocket.off('new_baohong_created');
                newSocket.off('asset_assigned_to_room');
                newSocket.off('new_assigned_task');
                newSocket.off('task_rework_request');
                newSocket.off('stats_updated');
                newSocket.off('task_needs_review');
                newSocket.off('task_completed');
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