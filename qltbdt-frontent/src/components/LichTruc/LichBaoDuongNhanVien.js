import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../../api';
import Pagination from '../layout/Pagination';
import Modal from '../layout/Popup';
import moment from 'moment';
import { FaCheckCircle, FaHourglassStart, FaEye } from "react-icons/fa";

const StatusBadge = ({ status }) => {
    let colorClasses = 'bg-gray-100 text-gray-800';
    if (status === 'Hoàn thành') { colorClasses = 'bg-green-100 text-green-800'; }
    else if (status === 'Đang tiến hành') { colorClasses = 'bg-yellow-100 text-yellow-800'; }
    else if (status === 'Hủy') { colorClasses = 'bg-red-100 text-red-800 line-through'; }
    else if (status === 'Chờ xử lý') { colorClasses = 'bg-blue-100 text-blue-800'; }
    return (<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>{status}</span>);
};


const LichBaoDuongNhanVien = () => {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({ page: 1, limit: 10, trangThai: 'Chờ xử lý,Đang tiến hành' });
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [ketQua, setKetQua] = useState('');
    const [chiPhi, setChiPhi] = useState(''); // Thêm state chi phí
    const [hinhAnhChungTu, setHinhAnhChungTu] = useState([]); // Thêm state ảnh

    // --- Fetch Data ---
    const { data: myTasksData, isLoading } = useQuery({
        queryKey: ['myLichBaoDuong', filters],
        queryFn: () => api.getMyLichBaoDuongAPI(filters),
        keepPreviousData: true
    });

    // --- Mutations ---
     const updateStatusMutation = useMutation({
        mutationFn: ({ id, data }) => api.updateLichBaoDuongStatusAPI(id, data),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['myLichBaoDuong'] });
            if (variables.data.trang_thai === 'Hoàn thành') {
                setIsCompleteModalOpen(false);
                setSelectedTask(null);
                setKetQua('');
                setChiPhi('');
                setHinhAnhChungTu([]);
            }
        },
        onError: (error) => {
             console.error("Lỗi mutation cập nhật trạng thái:", error);
             setIsCompleteModalOpen(false);
             setSelectedTask(null);
             setKetQua('');
             setChiPhi('');
             setHinhAnhChungTu([]);
        }
    });

    // --- Handlers ---
     const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

     const handleStart = (id) => {
         updateStatusMutation.mutate({ id, data: { trang_thai: 'Đang tiến hành' } });
     };

     const openCompleteModal = (task) => {
         setSelectedTask(task);
         setKetQua(''); // Reset form
         setChiPhi('');
         setHinhAnhChungTu([]);
         setIsCompleteModalOpen(true);
     }

     const handleCompleteSubmit = (e) => {
         e.preventDefault();
         if (!selectedTask) return;
         const payload = {
             trang_thai: 'Hoàn thành',
             ket_qua: ketQua,
             chi_phi: chiPhi || null,
             // TODO: Xử lý upload ảnh và lấy URL để gửi đi
             // hinh_anh_chung_tu: uploadedImageUrls || null
         };
         updateStatusMutation.mutate({ id: selectedTask.id, data: payload });
     }

     // Handler cho việc chọn file ảnh 
    const handleFileChange = (event) => {
        setHinhAnhChungTu(Array.from(event.target.files));
         // TODO: Implement image upload

    };

    // Lấy dữ liệu cho bảng
    const tasksList = myTasksData?.data || [];
    const pagination = myTasksData?.pagination;

    return (
        <div className="p-4 flex flex-col h-full">
             <h3 className="text-xl font-semibold mb-4 shrink-0">Công Việc Bảo Dưỡng Được Giao</h3>
             <div className="mb-4 p-2 border rounded bg-gray-50 shrink-0">
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                     <div className="w-48">
                        <label className="block text-xs font-medium text-gray-700">Lọc Trạng Thái</label>
                        <select
                            name="trangThai"
                            value={filters.trangThai || ''}
                            onChange={(e) => setFilters(prev => ({ ...prev, trangThai: e.target.value, page: 1 }))}
                            className="w-full px-2 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="Chờ xử lý,Đang tiến hành">Chưa hoàn thành</option>
                            <option value="Chờ xử lý">Chờ xử lý</option>
                            <option value="Đang tiến hành">Đang tiến hành</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                            <option value="Hủy">Đã hủy</option>
                             <option value="">Tất cả</option>
                        </select>
                    </div>
                </div>
             </div>

            {/* Table - Render trực tiếp */}
            <div className="flex-grow overflow-auto border border-gray-300 rounded"> {/* Thêm flex-grow và overflow-auto */}
                <table className="min-w-full border-collapse divide-y divide-gray-200">
                    <thead className="sticky top-0 z-10 bg-gray-100">
                        <tr>
                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">ID</th>
                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Thiết bị</th>
                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Phòng</th>
                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Ngày B.Dưỡng</th>
                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Trạng thái</th>
                             <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Hành Động</th>
                        </tr>
                    </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                         {isLoading && (
                            <tr><td colSpan="6" className="px-4 py-4 text-center text-gray-500 border">Đang tải...</td></tr>
                         )}
                         {!isLoading && tasksList.length === 0 && (
                            <tr><td colSpan="6" className="px-4 py-4 text-center text-gray-500 border">Không có công việc nào.</td></tr>
                         )}
                         {!isLoading && tasksList.map((task) => (
                            <tr key={task.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{task.id}</td>
                                <td className="px-3 py-2 text-sm font-medium text-gray-900 border whitespace-nowrap">{task.tenThietBi} (Model: {task.model || 'N/A'})</td>
                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{task.tenPhong}</td>
                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">
                                    {task.ngay_baotri ? moment(task.ngay_baotri).format("DD/MM/YYYY") : ''}
                                </td>
                                <td className="px-3 py-2 text-center border whitespace-nowrap"><StatusBadge status={task.trang_thai} /></td>
                                <td className="px-3 py-2 text-sm font-medium text-center border whitespace-nowrap">
                                    <div className='flex items-center justify-center space-x-2'>
                                         {task.trang_thai === 'Chờ xử lý' && (
                                              <button
                                                 onClick={() => handleStart(task.id)}
                                                 className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 flex items-center"
                                                 title="Bắt đầu xử lý"
                                                 disabled={updateStatusMutation.isLoading}
                                             >
                                                 <FaHourglassStart className="mr-1"/> Bắt đầu
                                             </button>
                                         )}
                                          {task.trang_thai === 'Đang tiến hành' && (
                                              <button
                                                 onClick={() => openCompleteModal(task)}
                                                 className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 flex items-center"
                                                 title="Hoàn thành công việc"
                                                 disabled={updateStatusMutation.isLoading}
                                             >
                                                <FaCheckCircle className="mr-1"/> Hoàn thành
                                             </button>
                                         )}
                                          <button
                                            // onClick={() => /* Mở modal chi tiết */}
                                            className="text-gray-600 hover:text-indigo-900" title="Xem chi tiết">
                                            <FaEye />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                         ))}
                     </tbody>
                </table>
            </div>

            {/* Pagination */}
             <div className="mt-4 shrink-0">
                 {pagination && pagination.totalPages > 1 && (
                    <Pagination
                        currentPage={filters.page}
                        totalPages={pagination.totalPages}
                        onPageChange={handlePageChange}
                    />
                 )}
            </div>

             {/* Modal Hoàn thành công việc */}
            <Modal isOpen={isCompleteModalOpen} onClose={() => setIsCompleteModalOpen(false)} title={`Hoàn thành bảo dưỡng: ${selectedTask?.tenThietBi || ''}`}>
                 <form onSubmit={handleCompleteSubmit} className="space-y-4">
                     <div>
                         <label className="block text-sm font-medium text-gray-700">Kết quả thực hiện <span className="text-red-500">*</span></label>
                         <textarea
                             rows="4"
                             required
                             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                             value={ketQua}
                             onChange={(e) => setKetQua(e.target.value)}
                             placeholder="Mô tả kết quả, tình trạng thiết bị sau bảo dưỡng..."
                         ></textarea>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Chi phí (nếu có)</label>
                        <input
                            type="number"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            value={chiPhi}
                            onChange={(e) => setChiPhi(e.target.value)}
                            placeholder="Nhập chi phí (ví dụ: 50000)"
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700">Ảnh chứng từ (hóa đơn,... nếu có)</label>
                         <input
                             type="file"
                             multiple
                             accept="image/*" // Chỉ chấp nhận file ảnh
                             className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                             onChange={handleFileChange}
                         />
                         {/* Hiển thị tên file đã chọn (ví dụ) */}
                         {hinhAnhChungTu.length > 0 && (
                             <div className="mt-2 text-xs text-gray-600">
                                 Đã chọn: {hinhAnhChungTu.map(f => f.name).join(', ')}
                             </div>
                         )}
                     </div>

                    <div className="flex justify-end space-x-2 pt-4">
                         <button type="button" onClick={() => setIsCompleteModalOpen(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Hủy</button>
                         <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" disabled={updateStatusMutation.isLoading}>
                             {updateStatusMutation.isLoading ? 'Đang lưu...' : 'Xác nhận Hoàn thành'}
                         </button>
                    </div>
                </form>
            </Modal>
             {/* Modal xem chi tiết (TODO) */}
        </div>
    );
};

export default LichBaoDuongNhanVien;