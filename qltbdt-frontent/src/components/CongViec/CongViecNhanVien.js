import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { FaHammer, FaInfoCircle, FaHistory, FaPlusCircle, FaHourglassStart, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { ArrowPathIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import FormLogBaoTri from '../forms/FormLogBaoTri';
import FormNhanBaoHanhVe from '../forms/FormNhanBaoHanhVe';
import ModalXemLogBaoTri from './ModalXemLogBaoTri';
import { getTinhTrangLabel } from '../../utils/constants';
import * as api from '../../api';
import { toast } from 'react-toastify';

// --- Component Nhóm Công việc theo Phòng ---
const RoomTaskGroup = ({ roomName, tasks, taskType, handlers }) => {
    const [isOpen, setIsOpen] = useState(true);

    const {
        handleOpenLogForm,
        handleOpenViewLogModal,
        handleStartBaoHong,
        handleOpenNhanHangModal,
        handleStartBaoDuong,
        updateBaoHongStatusMutation,
        updateBaoDuongStatusMutation,
    } = handlers;

    // Xác định tiêu đề cột dựa trên loại công việc
    const headers = useMemo(() => {
        if (taskType === 'baohong') {
            return [
                { label: 'Thiết bị / Mô tả', className: 'text-left' },
                { label: 'Ngày báo', className: 'text-left whitespace-nowrap' },
                { label: 'Trạng thái CV', className: 'text-center' },
                { label: 'TT Thiết bị', className: 'text-center' },
                { label: 'Hành động', className: 'text-center' }
            ];
        } else {
            return [
                { label: 'Thiết bị / Mô tả', className: 'text-left' },
                { label: 'Ngày tạo', className: 'text-left whitespace-nowrap' },
                { label: 'Trạng thái', className: 'text-center' },
                { label: 'TT Thiết bị', className: 'text-center' },
                { label: 'Hành động', className: 'text-center' }
            ];
        }
    }, [taskType]);

    if (!tasks || tasks.length === 0) return null;

    const isLoadingBaoHongAction = updateBaoHongStatusMutation.isPending;
    const loadingBaoHongTaskId = updateBaoHongStatusMutation.variables?.id;
    const isLoadingBaoDuongAction = updateBaoDuongStatusMutation.isPending;
    const loadingBaoDuongTaskId = updateBaoDuongStatusMutation.variables?.id;

    return (
        <div className="mb-4 overflow-hidden bg-white border rounded-md shadow-sm">
            {/* Header Phòng */}
            <button
                className="flex items-center justify-between w-full p-3 text-left bg-gray-100 hover:bg-gray-200 focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center">
                    {isOpen ? <FaChevronDown className="w-3 h-3 mr-2 text-gray-600" /> : <FaChevronRight className="w-3 h-3 mr-2 text-gray-600" />}
                    <BuildingOfficeIcon className="w-4 h-4 mr-1 text-gray-500" />
                    <span className="font-semibold text-gray-800">{roomName}</span>
                    <span className="ml-2 text-xs text-gray-500">({tasks.length} công việc)</span>
                </div>
            </button>

            {/* Danh sách công việc */}
            {isOpen && (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-t divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {headers.map((header, index) => (
                                    <th
                                        key={index}
                                        scope="col"
                                        className={`px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider ${header.className}`}
                                    >
                                        {header.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tasks.map((task) => {
                                const isBaoHong = taskType === 'baohong';
                                const currentStatus = isBaoHong ? task.trangThai : task.trang_thai;
                                const ngayCongViec = isBaoHong ? task.ngayBaoHong : task.ngay_baotri;
                                const moTaCongViec = isBaoHong ? task.moTa : task.mo_ta;
                                const tenThietBi = task.tenThietBi;
                                const thietBiId = task.thongtinthietbi_id;
                                const coLog = task.coLogBaoTri;
                                const tinhTrangTB = isBaoHong ? task.tinhTrangThietBi : task.tinhTrang;
                                const ghiChuAdmin = task.ghiChuAdmin;

                                const isLoadingAction = isBaoHong
                                    ? (isLoadingBaoHongAction && loadingBaoHongTaskId === task.id)
                                    : (isLoadingBaoDuongAction && loadingBaoDuongTaskId === task.id);

                                return (
                                    <tr key={`${taskType}-${task.id}`} className={`${isBaoHong && currentStatus === 'Yêu Cầu Làm Lại' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                                        {/* Thiết bị / Mô tả */}
                                        <td className="max-w-xs px-4 py-2 text-sm text-gray-700 break-words">
                                            {tenThietBi ? `${tenThietBi} ${thietBiId ? `(MĐD: ${thietBiId})` : ''}` : (isBaoHong ? 'Hạ tầng/Khác' : '')}
                                            <span className="block mt-1 text-xs text-gray-500">{moTaCongViec}</span>
                                        </td>
                                        {/* Ngày */}
                                        <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
                                            {moment(ngayCongViec).format(isBaoHong ? 'DD/MM/YY HH:mm' : 'DD/MM/YYYY')}
                                        </td>
                                        {/* Trạng thái CV */}
                                        <td className="px-4 py-2 text-sm text-center whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isBaoHong ?
                                                (currentStatus === 'Đang Tiến Hành' ? 'bg-yellow-100 text-yellow-800' :
                                                    currentStatus === 'Yêu Cầu Làm Lại' ? 'bg-red-100 text-red-800' :
                                                        currentStatus === 'Đã Duyệt' ? 'bg-blue-100 text-blue-800' :
                                                            currentStatus === 'Chờ Hoàn Tất Bảo Hành' ? 'bg-orange-100 text-orange-800' :
                                                                currentStatus === 'Chờ Xem Xét' ? 'bg-purple-100 text-purple-800' :
                                                                    'bg-gray-100 text-gray-800')
                                                : // Bảo dưỡng
                                                (currentStatus === 'Đang tiến hành' ? 'bg-yellow-100 text-yellow-800' :
                                                    currentStatus === 'Chờ xử lý' ? 'bg-blue-100 text-blue-800' :
                                                        currentStatus === 'Chờ Hoàn Tất Bảo Hành' ? 'bg-orange-100 text-orange-800' :
                                                            currentStatus === 'Chờ Xem Xét' ? 'bg-purple-100 text-purple-800' :
                                                                currentStatus === 'Hủy' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800')
                                                }`}>
                                                {currentStatus}
                                            </span>
                                            {isBaoHong && currentStatus === 'Yêu Cầu Làm Lại' && ghiChuAdmin && (
                                                <FaInfoCircle title={ghiChuAdmin} className="inline-block ml-1 text-red-500 cursor-help" />
                                            )}
                                        </td>
                                        {/* TT Thiết bị */}
                                        <td className="px-4 py-2 text-sm font-medium text-center whitespace-nowrap">
                                            {tinhTrangTB ? getTinhTrangLabel(tinhTrangTB) : <span className="italic text-gray-400">N/A</span>}
                                        </td>
                                        {/* Hành động */}
                                        <td className="px-4 py-2 text-sm font-medium text-center whitespace-nowrap">
                                            <div className='flex flex-wrap items-center justify-center gap-2'>
                                                {isBaoHong && (
                                                    <>
                                                        {currentStatus === 'Đã Duyệt' && (<button onClick={() => handleStartBaoHong(task.id)} className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed" title="Bắt đầu xử lý" disabled={isLoadingAction}><FaHourglassStart /></button>)}
                                                        {['Đang Tiến Hành', 'Yêu Cầu Làm Lại'].includes(currentStatus) && (<button onClick={() => handleOpenLogForm(task, 'baohong')} className="text-indigo-600 hover:text-indigo-900" title="Ghi nhận hoạt động"><FaHammer /></button>)}
                                                        <button onClick={() => handleOpenViewLogModal(task, isBaoHong ? 'baohong' : 'lichbaoduong', task.thongtinthietbi_id)} className={`${coLog ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}`} disabled={!coLog} title={coLog ? "Xem lịch sử" : "Chưa có log"} ><FaHistory /></button>
                                                        {currentStatus === 'Chờ Hoàn Tất Bảo Hành' && (<button onClick={() => handleOpenNhanHangModal(task, 'baohong')} className="text-green-500 rounded hover:text-green-600" title="Xác nhận nhận thiết bị về (Báo Hỏng)" ><FaPlusCircle className="inline mr-1" /></button>)}
                                                    </>
                                                )}
                                                {!isBaoHong && (
                                                    <>
                                                        {currentStatus === 'Chờ xử lý' && (<button onClick={() => handleStartBaoDuong(task.id)} className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed" title="Bắt đầu xử lý" disabled={isLoadingAction}><FaHourglassStart /></button>)}
                                                        {currentStatus === 'Đang tiến hành' && (<button onClick={() => handleOpenLogForm(task, 'lichbaoduong')} className="text-indigo-600 hover:text-indigo-900" title="Ghi nhận hoạt động" ><FaHammer /></button>)}
                                                        <button onClick={() => handleOpenViewLogModal(task, 'lichbaoduong')} className={`${coLog ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}`} disabled={!coLog} title={coLog ? "Xem lịch sử" : "Chưa có log"} ><FaHistory /></button>
                                                        {currentStatus === 'Chờ Hoàn Tất Bảo Hành' && (
                                                            <button
                                                                onClick={() => handleOpenNhanHangModal(task, 'lichbaoduong')}
                                                                className="px-2 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600"
                                                                title="Xác nhận nhận thiết bị về (Bảo Dưỡng)"
                                                            >
                                                                <FaPlusCircle className="inline mr-1" /> Nhận về
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// --- Component Chính CongViecNhanVien ---
const CongViecNhanVien = () => {
    const queryClient = useQueryClient();
    const [activeTaskTypeTab, setActiveTaskTypeTab] = useState('baohong'); // Mặc định là tab Báo Hỏng

    // State cho các modal
    const [selectedTaskInfoForLog, setSelectedTaskInfoForLog] = useState(null);
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);
    const [viewingLogFor, setViewingLogFor] = useState({ id: null, type: null });
    const [phongNameForModal, setPhongNameForModal] = useState("");
    const [isNhanHangModalOpen, setIsNhanHangModalOpen] = useState(false);
    const [selectedTaskForNhanHang, setSelectedTaskForNhanHang] = useState(null);

    // --- Fetch Data ---
    const baoHongStatuses = useMemo(() => ['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại', 'Chờ Hoàn Tất Bảo Hành', 'Chờ Xem Xét'], []);
    const { data: baoHongTasks = [], isLoading: isLoadingBaoHong } = useQuery({
        queryKey: ['assignedBaoHong', baoHongStatuses],
        queryFn: () => api.fetchAssignedBaoHongAPI({ statuses: baoHongStatuses }),
        staleTime: 0,
    });

    const baoDuongStatuses = useMemo(() => ['Chờ xử lý', 'Đang tiến hành', 'Chờ Hoàn Tất Bảo Hành', 'Chờ Xem Xét', 'Hủy'], []);
    const { data: baoDuongTasksData, isLoading: isLoadingBaoDuong } = useQuery({
        queryKey: ['assignedBaoDuongTasks', baoDuongStatuses],
        queryFn: () => api.getMyLichBaoDuongAPI({ trangThai: baoDuongStatuses.join(','), limit: 1000 }),
        staleTime: 1 * 60 * 1000,
    });
    const baoDuongTasks = useMemo(() => baoDuongTasksData?.data || [], [baoDuongTasksData]);

    // --- Mutations ---
    const updateBaoHongStatusMutation = useMutation({
        mutationFn: api.updateBaoHongAPI,
        onSuccess: (data, variables) => {
            toast.success(data.message || `Cập nhật Báo hỏng ID ${variables.id} thành công.`);
            queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
            // Invalidate cả query công việc bảo dưỡng nếu trạng thái liên quan
            if (variables.updateData?.trangThai === 'Chờ Hoàn Tất Bảo Hành') {
                queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
            }
        },
        onError: (error, variables) => {
            console.error("Lỗi cập nhật Báo hỏng:", error);
            toast.error(`Lỗi cập nhật Báo hỏng ID ${variables.id}: ${error.response?.data?.error || error.message}`);
        }
    });

    const updateBaoDuongStatusMutation = useMutation({
        mutationFn: ({ id, data }) => api.updateLichBaoDuongStatusAPI(id, data),
        onSuccess: (data, variables) => {
            toast.success(data.message || `Cập nhật Lịch bảo dưỡng ID ${variables.id} thành công.`);
            queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
            queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
            // Invalidate cả query công việc báo hỏng nếu trạng thái liên quan
            if (variables.data?.trang_thai === 'Chờ Hoàn Tất Bảo Hành') {
                queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
            }
        },
        onError: (error, variables) => {
            console.error("Lỗi cập nhật Lịch bảo dưỡng:", error);
            toast.error(`Lỗi cập nhật Lịch bảo dưỡng ID ${variables.id}: ${error.response?.data?.error || error.message}`);
        }
    });

    // --- Group Data ---
    const groupTasksByRoom = (tasks) => {
        if (!tasks || tasks.length === 0) return {};
        return tasks.reduce((acc, task) => {
            const roomKey = task.tenPhong || task.phong_name || `Phòng ID ${task.phong_id}`;
            if (!acc[roomKey]) acc[roomKey] = [];
            acc[roomKey].push(task);
            return acc;
        }, {});
    };
    const groupedBaoHongTasks = useMemo(() => groupTasksByRoom(baoHongTasks), [baoHongTasks]);
    const groupedBaoDuongTasks = useMemo(() => groupTasksByRoom(baoDuongTasks), [baoDuongTasks]);

    // --- Handlers ---
    const handleOpenLogForm = useCallback((task, type, suggestedResult = null) => {
        if (!task || !task.id || !task.phong_id) {
            toast.error("Dữ liệu công việc không đầy đủ để tạo log."); return;
        }
        const isMaintenanceTask = type === 'lichbaoduong';
        const logInfo = {
            id: isMaintenanceTask ? null : task.id, // ID báo hỏng (nếu là BH)
            lichbaoduong_id: isMaintenanceTask ? task.id : null, // ID lịch BD (nếu là LBD)
            phong_id: task.phong_id,
            phong_name: task.tenPhong || task.phong_name,
            thongtinthietbi_id: task.thongtinthietbi_id || null,
            tenThietBi: task.tenThietBi || null,
            trangThaiHienTai: isMaintenanceTask ? task.trang_thai : task.trangThai,
            moTaCongViec: isMaintenanceTask ? task.mo_ta : task.moTa,
            coLogTruocDo: task.coLogBaoTri, // Cần đảm bảo API trả về trường này
            tinhTrangThietBi: task.tinhTrangThietBi, // Tình trạng thiết bị gốc
            ghiChuAdmin: task.ghiChuAdmin, // Ghi chú từ Admin (nếu có)
            suggestedKetQuaXuLy: suggestedResult // Kết quả gợi ý (nếu có)
        };
        setSelectedTaskInfoForLog(logInfo);
        setIsLogFormOpen(true);
    }, []);

    const handleCloseLogForm = useCallback(() => { setSelectedTaskInfoForLog(null); setIsLogFormOpen(false); }, []);

    const handleOpenViewLogModal = useCallback((task, type, thongtinthietbiId = null) => {
        if (!task || !task.id) { toast.error("Thiếu thông tin để xem log."); return; }
        setViewingLogFor({ id: task.id, type: type, thongtinthietbiId: thongtinthietbiId, tenThietBi: task.tenThietBi });
        setPhongNameForModal(task.tenPhong || task.phong_name);
    }, []);

    const handleCloseViewLogModal = useCallback(() => { setViewingLogFor({ id: null, type: null }); setPhongNameForModal(""); }, []);

    const handleStartBaoDuong = useCallback((id) => {
        updateBaoDuongStatusMutation.mutate({ id, data: { trang_thai: 'Đang tiến hành' } });
    }, [updateBaoDuongStatusMutation]);

    const handleStartBaoHong = useCallback((taskId) => {
        updateBaoHongStatusMutation.mutate({ id: taskId, updateData: { trangThai: 'Đang Tiến Hành' } });
    }, [updateBaoHongStatusMutation]);

    const handleOpenNhanHangModal = useCallback((task, type = 'baohong') => {
        if (!task || !task.thongtinthietbi_id || !task.id) { toast.error("Thiếu thông tin Task hoặc Thiết bị liên kết."); return; }
        const deviceInfoForModal = {
            id: task.thongtinthietbi_id,
            tenThietBi: task.tenThietBi, // API cần trả về tên thiết bị ở đây
            phong_id: task.phong_id,
            phong_name: task.phong_name || task.tenPhong,
            relatedBaoHongId: type === 'baohong' ? task.id : null,
            relatedLichBaoDuongId: type === 'lichbaoduong' ? task.id : null
        };
        console.log(`Opening NhanHangModal for ${type} task ID: ${task.id} with deviceInfo:`, deviceInfoForModal);
        setSelectedTaskForNhanHang(deviceInfoForModal);
        setIsNhanHangModalOpen(true);
    }, []);

    const handleCloseNhanHangModal = useCallback(() => { setSelectedTaskForNhanHang(null); setIsNhanHangModalOpen(false); }, []);

    const handleNhanHangSuccess = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
        queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
        queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
    }, [queryClient]);

    // --- Gộp handlers vào object để truyền xuống RoomTaskGroup ---
    const handlers = useMemo(() => ({
        handleOpenLogForm, handleOpenViewLogModal, handleStartBaoHong,
        handleOpenNhanHangModal, handleStartBaoDuong, updateBaoHongStatusMutation, updateBaoDuongStatusMutation,
    }), [
        handleOpenLogForm, handleOpenViewLogModal, handleStartBaoHong,
        handleOpenNhanHangModal, handleStartBaoDuong, updateBaoHongStatusMutation, updateBaoDuongStatusMutation
    ]);

    // --- Render Logic ---
    const isLoading = isLoadingBaoHong || isLoadingBaoDuong;
    const sortedBaoHongRooms = Object.keys(groupedBaoHongTasks).sort();
    const sortedBaoDuongRooms = Object.keys(groupedBaoDuongTasks).sort();

    return (
        <div className="p-2 ">
            {/* Tabs con Sửa chữa / Bảo dưỡng */}
            <div className="flex mb-4 border-b border-gray-300">
                <button
                    className={`flex items-center px-4 py-2 text-sm font-medium focus:outline-none ${activeTaskTypeTab === 'baohong' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTaskTypeTab('baohong')}
                >
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    Sửa chữa ({baoHongTasks.length})
                </button>
                <button
                    className={`flex items-center px-4 py-2 text-sm font-medium focus:outline-none ${activeTaskTypeTab === 'baoduong' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTaskTypeTab('baoduong')}
                >
                    <WrenchScrewdriverIcon className="w-4 h-4 mr-1" />
                    Bảo dưỡng ({baoDuongTasks.length})
                </button>
            </div>

            {isLoading && <div className="text-center"><ArrowPathIcon className="inline-block w-5 h-5 mr-2 animate-spin" /> Đang tải công việc...</div>}

            {/* Nội dung Tab con */}
            <div className="mt-4">
                {/* Hiển thị công việc Báo hỏng */}
                {activeTaskTypeTab === 'baohong' && !isLoadingBaoHong && (
                    <div>
                        {sortedBaoHongRooms.length === 0 ? (
                            <p className="text-center text-gray-500">Không có công việc sửa chữa nào.</p>
                        ) : (
                            <div className="space-y-4">
                                {sortedBaoHongRooms.map(roomName => (
                                    <RoomTaskGroup
                                        key={`bh-room-${roomName}`}
                                        roomName={roomName}
                                        tasks={groupedBaoHongTasks[roomName]}
                                        taskType="baohong"
                                        handlers={handlers}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Hiển thị công việc Bảo dưỡng */}
                {activeTaskTypeTab === 'baoduong' && !isLoadingBaoDuong && (
                    <div>
                        {sortedBaoDuongRooms.length === 0 ? (
                            <p className="text-center text-gray-500">Không có công việc bảo dưỡng nào.</p>
                        ) : (
                            <div className="space-y-4">
                                {sortedBaoDuongRooms.map(roomName => (
                                    <RoomTaskGroup
                                        key={`bd-room-${roomName}`}
                                        roomName={roomName}
                                        tasks={groupedBaoDuongTasks[roomName]}
                                        taskType="baoduong"
                                        handlers={handlers}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isLogFormOpen && selectedTaskInfoForLog && (
                <FormLogBaoTri
                    taskInfo={selectedTaskInfoForLog}
                    onClose={handleCloseLogForm}
                    onSuccess={() => { // Cập nhật onSuccess để invalidate đúng keys
                        if (selectedTaskInfoForLog?.lichbaoduong_id) {
                            queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
                            queryClient.invalidateQueries({ queryKey: ['lichBaoDuongLog', selectedTaskInfoForLog.lichbaoduong_id] });
                            queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
                        } else if (selectedTaskInfoForLog?.id) { // ID ở đây là của báo hỏng
                            queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
                            queryClient.invalidateQueries({ queryKey: ['baohongLog', selectedTaskInfoForLog.id] });
                            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
                        }
                        // Invalidate các query liên quan khác
                        if (selectedTaskInfoForLog?.thongtinthietbi_id) {
                            queryClient.invalidateQueries({ queryKey: ['thongTinThietBi', selectedTaskInfoForLog.thongtinthietbi_id] });
                            queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
                            queryClient.invalidateQueries({ queryKey: ['baoTriLogsByThietBi', selectedTaskInfoForLog.thongtinthietbi_id] });
                            // Thêm query mới cho modal log
                            queryClient.invalidateQueries({ queryKey: ['baotriLogDetailUnified'] });
                        }
                    }}
                />
            )}

            {viewingLogFor.id && (
                <ModalXemLogBaoTri
                    thongtinthietbiId={viewingLogFor.thongtinthietbiId || null} 
                    baoHongId={!viewingLogFor.thongtinthietbiId && viewingLogFor.type === 'baohong' ? viewingLogFor.id : null}
                    lichbaoduongId={!viewingLogFor.thongtinthietbiId && viewingLogFor.type === 'lichbaoduong' ? viewingLogFor.id : null}
                    tenThietBi={viewingLogFor.tenThietBi}
                    phongName={phongNameForModal}
                    onClose={handleCloseViewLogModal}
                />
            )}

            {isNhanHangModalOpen && selectedTaskForNhanHang && (
                <FormNhanBaoHanhVe
                    deviceInfo={selectedTaskForNhanHang} // Truyền deviceInfo đã chuẩn bị
                    onClose={handleCloseNhanHangModal}
                    onSuccess={handleNhanHangSuccess}
                />
            )}
        </div>
    );
};

export default CongViecNhanVien; 