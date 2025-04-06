// import RightPanel from "../components/layout/RightPanel";
// import { useRightPanel } from "../utils/helpers";

// const BaoTri = () => {
//     const { selectedRecord, activeRightPanel, /* handleOpenRightPanel,*/ handleCloseRightPanel } = useRightPanel();
//     return (
//                 <div className="flex flex-1 bg-gray-100">
//                     {/* Left Panel - Trang Bảo Trì */}
//                     <div className={`bg-white shadow-md flex flex-col transition-all duration-300 ${selectedRecord || activeRightPanel ? "w-3/5" : "w-full"}`}>
//                         {/* Header Danh Mục */}
//                         <div className="flex items-center justify-between p-2 bg-white shadow-md">
//                             <h2 className="text-xl font-semibold">
//                                 Bảo Trì
//                             </h2>
//                             <div className="flex items-center space-x-2">
//                                 {/* Nút Sort */}
//                                 <button className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300">
//                                     <i className="text-lg text-gray-500 fas fa-filter"></i>
//                                 </button>
//                                 {/* Nút Thêm */}
//                                 <button className="flex items-center px-4 py-2 text-white bg-blue-500 rounded">
//                                     <i className="mr-2 fas fa-plus"></i> Thêm
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                     <RightPanel activeComponent={
//                         <div>Right Panel Bảo Trì

//                         </div>
//                     } onClose={handleCloseRightPanel} />
//                 </div>
//     );
// };

// export default BaoTri;


import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaHammer, FaInfoCircle } from 'react-icons/fa';
import moment from 'moment';
import { fetchMyTasksAPI } from '../api'; // Đảm bảo bạn đã tạo hàm này trong api.js
import FormLogBaoTri from '../components/forms/FormLogBaoTri'; // Import form mới

const BaoTri = () => {
    const [selectedTask, setSelectedTask] = useState(null); // Task đang được chọn để ghi log
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);

    const { data: myTasks = [], isLoading, isError, error } = useQuery({
        queryKey: ['baotriMyTasks'],
        queryFn: fetchMyTasksAPI, // API lấy task 'Đang Tiến Hành' & 'Yêu Cầu Làm Lại'
        staleTime: 5 * 60 * 1000, // 5 phút
    });

    const handleOpenLogForm = (task) => {
        setSelectedTask(task);
        setIsLogFormOpen(true);
    };

    const handleCloseLogForm = () => {
        setSelectedTask(null);
        setIsLogFormOpen(false);
    };

    if (isLoading) return <div className="p-4 text-center">Đang tải công việc...</div>;
    if (isError) return <div className="p-4 text-center text-red-500">Lỗi: {error.message}</div>;

    return (
        <div className="flex flex-col h-full bg-white border-2">
                <div className="flex items-center justify-between p-4 border-b ">
                    <h2 className="text-xl font-semibold">Bảo Trì & Sửa Chữa</h2> {/* Cập nhật tiêu đề nếu muốn */}
                </div>

                {myTasks.length === 0 ? (
                    <p className="text-center text-gray-500">Bạn hiện không có công việc nào đang tiến hành hoặc yêu cầu làm lại.</p>
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
                                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {myTasks.map((task) => (
                                    <tr key={task.id} className={task.trangThai === 'Yêu Cầu Làm Lại' ? 'bg-red-50' : ''}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{task.phong_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{task.tenThietBi || 'N/A'} {task.thongtinthietbi_id ? `(MDD: ${task.thongtinthietbi_id})` : ''}</td>
                                        <td className="max-w-xs px-6 py-4 text-sm text-gray-500 break-words">{task.moTa}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{moment(task.ngayBaoHong).format('DD/MM/YYYY HH:mm')}</td>
                                        <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.trangThai === 'Đang Tiến Hành' ? 'bg-yellow-100 text-yellow-800' :
                                                task.trangThai === 'Yêu Cầu Làm Lại' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800' // Default
                                                }`}>
                                                {task.trangThai}
                                            </span>
                                            {task.trangThai === 'Yêu Cầu Làm Lại' && task.ghiChuAdmin && (
                                                <FaInfoCircle title={task.ghiChuAdmin} className="inline-block ml-1 text-red-500 cursor-help" />
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-center whitespace-nowrap">
                                            <button
                                                onClick={() => handleOpenLogForm(task)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                                title="Ghi nhận hoạt động"
                                            >
                                                <FaHammer className="inline-block mr-1" /> Ghi nhận
                                            </button>
                                            {/* Có thể thêm nút xem lịch sử log ở đây */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Modal Form Ghi Log */}
                {isLogFormOpen && selectedTask && (
                    <FormLogBaoTri
                        baoHongInfo={selectedTask}
                        onClose={handleCloseLogForm}
                    />
                )}
        </div>
    );
};

export default BaoTri;