import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaHammer, FaInfoCircle, FaHistory, FaCheckCircle } from 'react-icons/fa';
import moment from 'moment';
import { toast } from 'react-toastify';
import { fetchMyTasksAPI, updateBaoHongAPI, getAllTaiSanAPI } from '../api';
import FormLogBaoTri from '../components/forms/FormLogBaoTri';
import ModalXemLogBaoTri from '../components/LichTruc/ModalXemLogBaoTri';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const BaoTri = () => {
    const [selectedTaskForLog, setSelectedTaskForLog] = useState(null);
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);
    const [viewingLogFor, setViewingLogFor] = useState(null);
    const [phongNameForModal, setPhongNameForModal] = useState("");

    const queryClient = useQueryClient();

    // Query lấy danh sách công việc
    const { data: myTasks = [], isLoading: isLoadingTasks, isError: isErrorTasks, error: errorTasks } = useQuery({
        queryKey: ['baotriMyTasks'],
        queryFn: fetchMyTasksAPI,
        staleTime: 1 * 60 * 1000,
    });

    // Lấy danh sách thiết bị đang bảo hành
    const { data: warrantyData, isLoading: isLoadingWarranty, isError: isErrorWarranty, error: errorWarranty } = useQuery({
        queryKey: ['warrantyDevices'],
        // Gọi API lấy tài sản với filter trạng thái
        queryFn: () => getAllTaiSanAPI({ trangThai: 'dang_bao_hanh', limit: 100 }),
        staleTime: 5 * 60 * 1000,
    });
    // Trích xuất danh sách thiết bị từ warrantyData
    const warrantyDevices = useMemo(() => warrantyData?.data || [], [warrantyData]);


    // Mutation để cập nhật trạng thái (Hoàn thành)
    const updateStatusMutation = useMutation({
        mutationFn: updateBaoHongAPI,
        onSuccess: (data, variables) => {
            toast.success(data.message || `Đã cập nhật trạng thái báo hỏng ID ${variables.id}.`);
            queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
            queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            // Invalidate cả query thiết bị bảo hành vì có thể nó đã hết bảo hành sau khi xử lý xong
            queryClient.invalidateQueries({ queryKey: ['warrantyDevices'] });
            queryClient.invalidateQueries({ queryKey: ['taiSanList'] }); // Danh sách tài sản chung
        },
        onError: (error, variables) => {
            console.error("Lỗi khi cập nhật trạng thái báo hỏng (ID:", variables?.id, "):", error);
            toast.error(`Lỗi: ${error.response?.data?.error || error.message}`);
        },
    });


    // Hàm mở form ghi log
    const handleOpenLogForm = (task) => {
        setSelectedTaskForLog(task);
        setIsLogFormOpen(true);
    };

    // Hàm đóng form ghi log
    const handleCloseLogForm = () => {
        setSelectedTaskForLog(null);
        setIsLogFormOpen(false);
    };

    // Hàm mở modal xem log
    const handleOpenViewLogModal = (task) => {
        setViewingLogFor(task.id);
        setPhongNameForModal(task.phong_name);
    };

    // Hàm đóng form ghi log
    const handleCloseViewLogModal = () => {
        setViewingLogFor(null);
        setPhongNameForModal("");
    };

    // Hàm xử lý Hoàn thành công việc
    const handleCompleteTask = (taskId, coLog) => {
        // Thêm kiểm tra taskId rõ ràng hơn
        if (taskId === undefined || taskId === null) {
            console.error("Lỗi nghiêm trọng: taskId bị thiếu khi gọi handleCompleteTask!");
            toast.error("Không thể hoàn thành: Thiếu ID công việc.");
            return;
        }

        if (!coLog) {
            toast.error("Bạn cần ghi nhận hoạt động bảo trì trước khi hoàn thành!");
            return;
        }

        if (window.confirm(`Bạn có chắc muốn đánh dấu hoàn thành công việc ID ${taskId}?`)) {
            console.log("Calling mutate with:", { id: taskId, updateData: { trangThai: 'Hoàn Thành' } });
            updateStatusMutation.mutate({
                id: taskId,
                updateData: { trangThai: 'Hoàn Thành' }
            });
        }
    };


    if (isLoadingTasks) return <div className="p-4 text-center">Đang tải công việc...</div>;
    if (isErrorTasks) return <div className="p-4 text-center text-red-500">Lỗi khi tải công việc: {errorTasks.message}</div>;

    return (
        <div className="flex flex-col h-full bg-white border-2">
            <div className="flex items-center justify-between p-4 border-b ">
                <h2 className="text-xl font-semibold">Bảo Trì & Sửa Chữa</h2> {/* Cập nhật tiêu đề nếu muốn */}
            </div>

            {myTasks.length === 0 ? (
                <p className="text-center text-gray-500">Bạn hiện không có công việc nào cần xử lý.</p>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Phòng</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Thiết bị</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Mô tả hỏng</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Ngày báo</th>
                                <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Trạng thái</th>
                                <th className="w-40 px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {myTasks.map((task) => (
                                <tr key={task.id} className={task.trangThai === 'Yêu Cầu Làm Lại' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{task.phong_name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{task.tenThietBi || 'N/A'} {task.thongtinthietbi_id ? `(MDD: ${task.thongtinthietbi_id})` : ''}</td>
                                    <td className="max-w-xs px-6 py-4 text-sm text-gray-500 break-words">{task.moTa}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{moment(task.ngayBaoHong).format('DD/MM/YYYY HH:mm')}</td>
                                    <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.trangThai === 'Đang Tiến Hành' ? 'bg-yellow-100 text-yellow-800' :
                                            task.trangThai === 'Yêu Cầu Làm Lại' ? 'bg-red-100 text-red-800' :
                                                task.trangThai === 'Đã Duyệt' ? 'bg-blue-100 text-blue-800' : // Thêm màu cho Đã Duyệt
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {task.trangThai}
                                        </span>
                                        {task.trangThai === 'Yêu Cầu Làm Lại' && task.ghiChuAdmin && (
                                            <FaInfoCircle title={task.ghiChuAdmin} className="inline-block ml-1 text-red-500 cursor-help" />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-center whitespace-nowrap">
                                        <div className='flex items-center justify-center space-x-3'>
                                            {/* Nút Ghi nhận Hoạt động */}
                                            {/* Chỉ hiển thị nếu Đang tiến hành hoặc Yêu cầu làm lại */}
                                            {(task.trangThai === 'Đang Tiến Hành' || task.trangThai === 'Yêu Cầu Làm Lại') && (
                                                <button
                                                    onClick={() => handleOpenLogForm(task)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Ghi nhận hoạt động"
                                                >
                                                    <FaHammer />
                                                </button>
                                            )}

                                            {/* Nút Xem Log Đã Ghi */}
                                            <button
                                                onClick={() => handleOpenViewLogModal(task)}
                                                className={`
                                                     ${!!task.coLogBaoTri ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}
                                                 `}
                                                disabled={!task.coLogBaoTri || task.coLogBaoTri === 0}
                                                title={task.coLogBaoTri === 1 ? "Xem lịch sử bảo trì" : "Chưa có lịch sử"}
                                            >
                                                <FaHistory />
                                            </button>

                                            {/* Nút Hoàn thành công việc */}
                                            <button
                                                onClick={() => handleCompleteTask(task.id, task.coLogBaoTri)}
                                                className={`
                                                     ${(task.trangThai === 'Đang Tiến Hành' && !!task.coLogBaoTri) ? 'text-green-600 hover:text-green-900' : 'text-gray-400 cursor-not-allowed'}
                                                     ${updateStatusMutation.isPending && updateStatusMutation.variables?.id === task.id ? 'opacity-50' : ''}
                                                 `}
                                                disabled={!(task.trangThai === 'Đang Tiến Hành' && (task.coLogBaoTri === 1))} // So sánh lỏng lẻo với 1
                                                title={(task.trangThai === 'Đang Tiến Hành' && task.coLogBaoTri === 1) ? "Đánh dấu hoàn thành" : (task.coLogBaoTri !== 1 ? "Cần ghi log trước" : "Chỉ hoàn thành khi đang tiến hành")}
                                            >
                                                <FaCheckCircle />
                                            </button>
                                            {/* Có thể thêm nút "Báo cáo vấn đề" ở đây nếu cần */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* === PHẦN MỚI: Danh sách thiết bị đang bảo hành === */}
            <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b">
                    <h2 className="text-xl font-semibold">Thiết bị đang bảo hành</h2>
                </div>
                {isLoadingWarranty && <div className="text-center"><ArrowPathIcon className="inline-block w-5 h-5 mr-2 animate-spin" /> Đang tải...</div>}
                {isErrorWarranty && <div className="text-center text-red-500">Lỗi tải danh sách thiết bị bảo hành: {errorWarranty.message}</div>}
                {!isLoadingWarranty && !isErrorWarranty && (
                    warrantyDevices.length === 0 ? (
                        <p className="text-center text-gray-500">Hiện không có thiết bị nào đang trong trạng thái bảo hành.</p>
                    ) : (
                        <div className="overflow-x-auto bg-white rounded-lg shadow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Mã Định Danh</th>
                                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Tên Loại Thiết Bị</th>
                                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Vị trí</th>
                                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Ngày hết hạn BH</th>
                                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Người được cấp</th>
                                        {/* Thêm các cột khác nếu cần */}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {warrantyDevices.map((device) => (
                                        <tr key={device.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-sm text-gray-700 whitespace-nowrap">{device.id}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{device.tenLoaiThietBi || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{device.phong_name || 'Trong kho'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                                                {device.ngayBaoHanhKetThuc ? moment(device.ngayBaoHanhKetThuc).format('DD/MM/YYYY') : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{device.tenNguoiCap || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
            {/* === Kết thúc Phần mới === */}

            {/* Modal Form Ghi Log */}
            {isLogFormOpen && selectedTaskForLog && (
                <FormLogBaoTri
                    baoHongInfo={selectedTaskForLog}
                    onClose={handleCloseLogForm}
                />
            )}

            {/* Modal Xem Log Bảo trì */}
            {viewingLogFor && (
                <ModalXemLogBaoTri
                    baoHongId={viewingLogFor}
                    phongName={phongNameForModal}
                    onClose={handleCloseViewLogModal}
                />
            )}
        </div>
    );
};

export default BaoTri;