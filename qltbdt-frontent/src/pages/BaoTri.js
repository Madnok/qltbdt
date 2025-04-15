// import React, { useState, useEffect, useMemo } from 'react';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { FaHammer, FaInfoCircle, FaHistory, FaCheckCircle, FaPlusCircle } from 'react-icons/fa';
// import moment from 'moment';
// import { toast } from 'react-toastify';
// import { fetchMyTasksAPI, updateBaoHongAPI, getAllTaiSanAPI } from '../api';
// import FormLogBaoTri from '../components/forms/FormLogBaoTri';
// import FormNhanBaoHanhVe from '../components/forms/FormNhanBaoHanhVe';
// import ModalXemLogBaoTri from '../components/LichTruc/ModalXemLogBaoTri';
// import { getTinhTrangLabel } from '../utils/constants';
// import { ArrowPathIcon } from '@heroicons/react/24/outline';

// const BaoTri = () => {
//     // const [isWarrantyReturnLog, setIsWarrantyReturnLog] = useState(false);

//     // State cho modal log bảo trì thông thường
//     const [selectedTaskForLog, setSelectedTaskForLog] = useState(null);
//     const [isLogFormOpen, setIsLogFormOpen] = useState(false);

//     // State cho modal xem log
//     const [viewingLogFor, setViewingLogFor] = useState(null);
//     const [phongNameForModal, setPhongNameForModal] = useState("");

//     // State cho modal nhận hàng bảo hành mới
//     const [isNhanHangModalOpen, setIsNhanHangModalOpen] = useState(false);
//     const [selectedDeviceForNhanHang, setSelectedDeviceForNhanHang] = useState(null);



//     const queryClient = useQueryClient();

//     // Query lấy danh sách công việc
//     const { data: myTasks = [], isLoading: isLoadingTasks, isError: isErrorTasks, error: errorTasks, refetch: refetchMyTasks } = useQuery({ // Thêm refetch
//         queryKey: ['baotriMyTasks'],
//         queryFn: fetchMyTasksAPI,
//         staleTime: 1 * 60 * 1000,
//     });

//     // Lấy danh sách thiết bị đang bảo hành
//     const { data: warrantyDevices = [], isLoading: isLoadingWarranty, isError: isErrorWarranty, error: errorWarranty } = useQuery({
//         queryKey: ['warrantyDevices'],
//         queryFn: () => getAllTaiSanAPI({ trangThai: 'dang_bao_hanh', limit: 100 }),
//         staleTime: 5 * 60 * 1000,
//         select: (res) => res.data?.data || [],
//     });

//     // Tạo một Map để tra cứu task theo thongtinthietbi_id nhanh hơn
//     const taskMapByDeviceId = React.useMemo(() => {
//         const map = new Map();
//         myTasks.forEach(task => {
//             if (task.thongtinthietbi_id) {
//                 map.set(task.thongtinthietbi_id, task);
//             }
//         });
//         return map;
//     }, [myTasks]);

//     // Mutation để cập nhật trạng thái báo hỏng (Hoàn thành)
//     const updateStatusMutation = useMutation({
//         mutationFn: updateBaoHongAPI,
//         onSuccess: (data, variables) => {
//             toast.success(data.message || `Đã cập nhật trạng thái báo hỏng ID ${variables.id}.`);
//             queryClient.invalidateQueries({ queryKey: ['baotriMyTasks'] });
//             queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
//             queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
//             // Invalidate cả query thiết bị bảo hành vì có thể nó đã hết bảo hành sau khi xử lý xong
//             queryClient.invalidateQueries({ queryKey: ['warrantyDevices'] });
//             queryClient.invalidateQueries({ queryKey: ['taiSanList'] }); // Danh sách tài sản chung
//         },
//         onError: (error, variables) => {
//             console.error("Lỗi khi cập nhật trạng thái báo hỏng (ID:", variables?.id, "):", error);
//             toast.error(`Lỗi: ${error.response?.data?.error || error.message}`);
//         },
//     });

//     // --- Hàm mở/đóng form log bảo trì thông thường ---
//     const handleOpenLogForm = (task) => {
//         if (!task || task.id === undefined || task.phong_id === undefined) {
//             toast.error("Dữ liệu báo hỏng không đầy đủ để tạo log.");
//             return;
//         }
//         console.log("Opening log form for task:", task);
//         setSelectedTaskForLog(task);
//         setIsLogFormOpen(true);
//     };

//     const handleCloseLogForm = () => {
//         setSelectedTaskForLog(null);
//         setIsLogFormOpen(false);
//     };

//     // Hàm mở modal nhận hàng
//     const handleOpenNhanHangModal = (device) => {
//         if (!device || !device.id) {
//             toast.error("Thiếu thông tin thiết bị để mở form nhận hàng.");
//             return;
//         }
//         // Tìm task gốc từ Map đã tạo
//         const relatedTask = taskMapByDeviceId.get(device.id);
//         const relatedBaoHongId = relatedTask?.id || null;

//         if (!relatedBaoHongId) {
//             toast.error(`Không tìm thấy Báo hỏng gốc đang xử lý cho thiết bị ID ${device.id}. Không thể ghi nhận nhận hàng.`);
//             refetchMyTasks();
//             return;
//         }

//         const deviceInfo = {
//             ...device,
//             relatedBaoHongId: relatedBaoHongId
//         };
//         setSelectedDeviceForNhanHang(deviceInfo);
//         setIsNhanHangModalOpen(true);
//     };

//     const handleCloseNhanHangModal = () => {
//         setSelectedDeviceForNhanHang(null);
//         setIsNhanHangModalOpen(false);
//     };

//     // Callback khi nhận hàng thành công (để làm mới danh sách)
//     const handleNhanHangSuccess = () => {
//         queryClient.invalidateQueries({ queryKey: ['warrantyDevices'] });
//         queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
//     };

//     // Hàm mở modal xem log
//     const handleOpenViewLogModal = (task) => {
//         setViewingLogFor(task.id);
//         setPhongNameForModal(task.phong_name);
//     };

//     // Hàm đóng form ghi log
//     const handleCloseViewLogModal = () => {
//         setViewingLogFor(null);
//         setPhongNameForModal("");
//     };

//     // Hàm xử lý Hoàn thành công việc
//     const handleCompleteTask = (taskId, coLog) => {
//         if (taskId === undefined || taskId === null) {
//             toast.error("Không thể hoàn thành: Thiếu ID công việc.");
//             return;
//         }

//         if (!coLog) {
//             toast.error("Bạn cần ghi nhận hoạt động bảo trì trước khi hoàn thành!");
//             return;
//         }

//         if (window.confirm(`Bạn có chắc muốn đánh dấu hoàn thành công việc ID ${taskId}?`)) {
//             console.log("Calling mutate with:", { id: taskId, updateData: { trangThai: 'Hoàn Thành' } });
//             updateStatusMutation.mutate({
//                 id: taskId,
//                 updateData: { trangThai: 'Hoàn Thành' }
//             });
//         }
//     };


//     if (isLoadingTasks || isLoadingWarranty) return <div className="p-4 text-center"><ArrowPathIcon className="inline-block w-5 h-5 mr-2 animate-spin" /> Đang tải dữ liệu...</div>; // Gộp loading
//     if (isErrorTasks) return <div className="p-4 text-center text-red-500">Lỗi khi tải công việc: {errorTasks?.message}</div>;
//     if (isErrorWarranty) return <div className="p-4 text-center text-red-500">Lỗi khi tải thiết bị bảo hành: {errorWarranty?.message}</div>;

//     return (
//         <div className="flex flex-col h-full min-h-screen bg-gray-100">
//             {/* Header */}
//             <div className="flex-shrink-0 p-4 bg-white border-b shadow-sm">
//                 <h2 className="text-xl font-semibold">Bảo Trì & Sửa Chữa</h2>
//             </div>

//             {/* Phần Nội dung chính */}
//             <div className="flex-grow p-4 overflow-y-auto">
//                 {/* === Bảng Công việc đang xử lý (Task của tôi) === */}
//                 <div className="mb-8 bg-white rounded-lg shadow">
//                     <h3 className="p-4 text-lg font-semibold border-b">Công việc đang xử lý của bạn</h3>
//                     {myTasks.length === 0 ? (
//                         <p className="p-4 text-center text-gray-500">Bạn hiện không có công việc nào được giao.</p>
//                     ) : (
//                         <div className="overflow-x-auto">
//                             <table className="min-w-full divide-y divide-gray-200">
//                                 <thead className="bg-gray-50">
//                                     <tr>
//                                         <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Phòng</th>
//                                         <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Thiết bị</th>
//                                         <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Mô tả hỏng</th>
//                                         <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Tình trạng thiết bị</th>
//                                         <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Ngày báo</th>
//                                         <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Trạng thái Task</th>
//                                         <th className="w-40 px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Hành động</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="bg-white divide-y divide-gray-200">
//                                     {myTasks.map((task) => (
//                                         <tr key={task.id} className={task.trangThai === 'Yêu Cầu Làm Lại' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{task.phong_name}</td>
//                                             <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{task.tenThietBi || 'N/A'} {task.thongtinthietbi_id ? `(MDD: ${task.thongtinthietbi_id})` : ''}</td>
//                                             <td className="max-w-xs px-6 py-4 text-sm text-gray-500 break-words">{task.moTa}</td>
//                                             <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{getTinhTrangLabel(task.tinhTrangThietBi)}</td>
//                                             <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{moment(task.ngayBaoHong).format('DD/MM/YYYY HH:mm')}</td>
//                                             <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
//                                                 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.trangThai === 'Đang Tiến Hành' ? 'bg-yellow-100 text-yellow-800' :
//                                                     task.trangThai === 'Yêu Cầu Làm Lại' ? 'bg-red-100 text-red-800' :
//                                                         'bg-gray-100 text-gray-800'
//                                                     }`}>
//                                                     {task.trangThai}
//                                                 </span>
//                                                 {task.trangThai === 'Yêu Cầu Làm Lại' && task.ghiChuAdmin && (
//                                                     <FaInfoCircle title={task.ghiChuAdmin} className="inline-block ml-1 text-red-500 cursor-help" />
//                                                 )}
//                                             </td>
//                                             <td className="px-6 py-4 text-sm font-medium text-center whitespace-nowrap">
//                                                 <div className='flex items-center justify-center space-x-3'>
//                                                     {/* Nút Ghi Log (Hammer) - Chỉ dùng FormLogBaoTri gốc */}
//                                                     {(task.trangThai === 'Đang Tiến Hành' || task.trangThai === 'Yêu Cầu Làm Lại') && (
//                                                         <button
//                                                             onClick={() => handleOpenLogForm(task)} // Mở form log thông thường
//                                                             className="text-indigo-600 hover:text-indigo-900"
//                                                             title="Ghi nhận hoạt động bảo trì"
//                                                         >
//                                                             <FaHammer />
//                                                         </button>
//                                                     )}
//                                                     {/* Nút Xem Log Đã Ghi (History) */}
//                                                     <button
//                                                         onClick={() => handleOpenViewLogModal(task)}
//                                                         className={`
//                                                             ${!!task.coLogBaoTri ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}
//                                                         `}
//                                                         disabled={!task.coLogBaoTri}
//                                                         title={task.coLogBaoTri ? "Xem lịch sử bảo trì" : "Chưa có lịch sử"}
//                                                     >
//                                                         <FaHistory />
//                                                     </button>
//                                                     {/* Nút Hoàn thành công việc (Check) */}
//                                                     <button
//                                                         onClick={() => handleCompleteTask(task.id, task.coLogBaoTri)}
//                                                         className={`
//                                                             ${(task.trangThai === 'Đang Tiến Hành' && !!task.coLogBaoTri) ? 'text-green-600 hover:text-green-900' : 'text-gray-400 cursor-not-allowed'}
//                                                             ${updateStatusMutation.isPending && updateStatusMutation.variables?.id === task.id ? 'opacity-50' : ''}
//                                                         `}
//                                                         disabled={!(task.trangThai === 'Đang Tiến Hành' && !!task.coLogBaoTri)}
//                                                         title={(task.trangThai === 'Đang Tiến Hành' && !!task.coLogBaoTri) ? "Đánh dấu hoàn thành" : (!task.coLogBaoTri ? "Cần ghi log trước" : "Chỉ hoàn thành khi đang tiến hành")}
//                                                     >
//                                                         <FaCheckCircle />
//                                                     </button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     )}
//                 </div>
//                 {/* === Kết thúc Bảng Công việc === */}

//                 {/* === PHẦN HIỂN THỊ THIẾT BỊ ĐANG BẢO HÀNH === */}
//                 <div className="mt-8 bg-white rounded-lg shadow">
//                     <h3 className="p-4 text-lg font-semibold border-b">Thiết bị đang chờ bảo hành về</h3>
//                     {!isLoadingWarranty && !isErrorWarranty && warrantyDevices.length > 0 && (
//                         <div className="overflow-x-auto">
//                             <table className="min-w-full divide-y divide-gray-200">
//                                 <thead className="bg-gray-50">
//                                     <tr>
//                                         <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Phòng Gốc</th>
//                                         <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Thiết Bị</th>
//                                         {/* <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Tình Trạng TB</th> */}
//                                         <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Ngày dự kiến trả</th>
//                                         <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Ngày hết hạn BH</th>
//                                         <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Tình Trạng Thiết Bị</th>
//                                         <th className="w-40 px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Hành động</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="bg-white divide-y divide-gray-200">
//                                     {warrantyDevices.map((device) => {
//                                         // Tìm task liên quan để lấy ID báo hỏng gốc nếu có
//                                         return (
//                                             <tr key={device.id} className="hover:bg-gray-50">
//                                                 <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{device.phong_name || (device.phong_id ? `Phòng ID:${device.phong_id}` : 'N/A')}</td>
//                                                 <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{device.tenLoaiThietBi || 'N/A'}  {device.id ? `(MDD: ${device.id})` : ''}</td>
//                                                 {/* <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{getTinhTrangLabel(device.tinhTrangThietBi || device.tinhTrang)}</td> */}
//                                                 <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{device.ngayDuKienTra ? moment(device.ngayDuKienTra).format('DD/MM/YYYY') : 'Chưa có'}</td>
//                                                 <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{device.ngayBaoHanhKetThuc ? moment(device.ngayBaoHanhKetThuc).format('DD/MM/YYYY') : 'N/A'}</td>
//                                                 <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
//                                                     <span className="inline-flex px-2 text-xs font-semibold leading-5 text-blue-800 bg-blue-100 rounded-full">
//                                                         {getTinhTrangLabel(device.tinhTrang)}
//                                                     </span>
//                                                 </td>
//                                                 <td className="px-4 py-3 text-sm font-medium text-center whitespace-nowrap">
//                                                     <button
//                                                         onClick={() => handleOpenNhanHangModal(device)}
//                                                         className="px-2 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600"
//                                                         // title="Xác nhận nhận thiết bị bảo hành về"
//                                                         disabled={!taskMapByDeviceId.has(device.id)}
//                                                         title={taskMapByDeviceId.has(device.id) ? "Xác nhận nhận thiết bị bảo hành về" : "Không tìm thấy báo hỏng gốc đang xử lý"}
//                                                     >
//                                                         <FaPlusCircle className="inline mr-1" /> Nhận về
//                                                     </button>
//                                                 </td>
//                                             </tr>
//                                         );
//                                     })}
//                                 </tbody>
//                             </table>
//                         </div>
//                     )}
//                     {!isLoadingWarranty && !isErrorWarranty && warrantyDevices.length === 0 && (
//                         <p className="p-4 text-center text-gray-500">Hiện không có thiết bị nào đang trong trạng thái bảo hành.</p>
//                     )}
//                 </div>
//                 {/* === Kết thúc Phần Thiết bị đang bảo hành === */}
//             </div>

//             {/* Modal Log Bảo trì thông thường */}
//              {isLogFormOpen && selectedTaskForLog && (
//                  <FormLogBaoTri
//                      baoHongInfo={selectedTaskForLog}
//                      onClose={handleCloseLogForm}
//                  />
//              )}

//             {/* Modal Xem Log */}
//             {viewingLogFor && (
//                 <ModalXemLogBaoTri
//                     baoHongId={viewingLogFor}
//                     phongName={phongNameForModal}
//                     onClose={handleCloseViewLogModal}
//                 />
//             )}

//             {/* Modal Nhận Hàng Bảo Hành MỚI */}
//              {isNhanHangModalOpen && selectedDeviceForNhanHang && (
//                   <FormNhanBaoHanhVe
//                       deviceInfo={selectedDeviceForNhanHang}
//                       onClose={handleCloseNhanHangModal}
//                       onSuccess={handleNhanHangSuccess}
//                   />
//               )}
//         </div>
//     );
// };

// export default BaoTri;

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaHammer, FaInfoCircle, FaHistory, FaCheckCircle, FaPlusCircle } from 'react-icons/fa';
import moment from 'moment';
import { toast } from 'react-toastify';
import {
    fetchAssignedBaoHongAPI,
    updateBaoHongAPI
} from '../api';
import FormLogBaoTri from '../components/forms/FormLogBaoTri';
import FormNhanBaoHanhVe from '../components/forms/FormNhanBaoHanhVe';
import ModalXemLogBaoTri from '../components/LichTruc/ModalXemLogBaoTri';
import { getTinhTrangLabel } from '../utils/constants';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

// Khai báo các trạng thái hợp lệ để hoàn thành ở ngoài component
const validCompleteStatuses = ['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại'];

const BaoTri = () => {
    // State cho modal log bảo trì thông thường
    const [selectedTaskForLog, setSelectedTaskForLog] = useState(null);
    const [isLogFormOpen, setIsLogFormOpen] = useState(false);

    // State cho modal xem log
    const [viewingLogFor, setViewingLogFor] = useState(null);
    const [phongNameForModal, setPhongNameForModal] = useState("");

    // State cho modal nhận hàng bảo hành 
    const [isNhanHangModalOpen, setIsNhanHangModalOpen] = useState(false);
    const [selectedTaskForNhanHang, setSelectedTaskForNhanHang] = useState(null);

    const queryClient = useQueryClient();

    // === Query Bảng 1: Công việc đang xử lý ===
    const activeTaskStatuses = useMemo(() => ['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại'], []);
    const { data: activeTasks = [], isLoading: isLoadingActiveTasks, isError: isErrorActiveTasks, error: errorActiveTasks } = useQuery({
        queryKey: ['baotriActiveTasks', activeTaskStatuses],
        queryFn: () => fetchAssignedBaoHongAPI({ statuses: activeTaskStatuses }),
        staleTime: 1 * 60 * 1000,
    });

    // === Query Bảng 2: Chờ Hoàn Tất Bảo Hành ===
    const waitingWarrantyStatuses = useMemo(() => ['Chờ Hoàn Tất Bảo Hành'], []);
    const { data: waitingWarrantyTasks = [], isLoading: isLoadingWaitingWarranty, isError: isErrorWaitingWarranty, error: errorWaitingWarranty } = useQuery({
        queryKey: ['baotriWaitingWarrantyTasks', waitingWarrantyStatuses], // Key mới
        queryFn: () => fetchAssignedBaoHongAPI({ statuses: waitingWarrantyStatuses }), // Gọi API với status mới
        staleTime: 5 * 60 * 1000,
    });

    // === Query Bảng 3: Chờ Xem Xét ===
    const pendingFinalStatuses = useMemo(() => ['Chờ Xem Xét'], []);
    const { data: pendingFinalTasks = [], isLoading: isLoadingPendingFinal, isError: isErrorPendingFinal, error: errorPendingFinal } = useQuery({
        queryKey: ['baotriPendingFinalTasks', pendingFinalStatuses],
        queryFn: () => fetchAssignedBaoHongAPI({ statuses: pendingFinalStatuses }),
        staleTime: 5 * 60 * 1000,
    });

    // Mutation cập nhật trạng thái báo hỏng
    const updateStatusMutation = useMutation({
        mutationFn: updateBaoHongAPI,
        onSuccess: (data, variables) => {
            toast.success(data.message || `Đã cập nhật trạng thái báo hỏng ID ${variables.id}.`);

            queryClient.invalidateQueries({ queryKey: ['baotriActiveTasks', activeTaskStatuses] });
            queryClient.invalidateQueries({ queryKey: ['baotriWaitingWarrantyTasks', waitingWarrantyStatuses] });
            queryClient.invalidateQueries({ queryKey: ['baotriPendingFinalTasks', pendingFinalStatuses] });

            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
            queryClient.invalidateQueries({ queryKey: ['baoHongDetail', variables.id] });
        },
        onError: (error, variables) => {
            console.error("Lỗi khi cập nhật trạng thái báo hỏng (ID:", variables?.id, "):", error);
            toast.error(`Lỗi: ${error.response?.data?.error || error.message}`);
        },
    });

    // --- Hàm mở/đóng form log bảo trì thông thường --- 
    const handleOpenLogForm = (task) => {
        if (!task || task.id === undefined || task.phong_id === undefined) {
            toast.error("Dữ liệu báo hỏng không đầy đủ để tạo log.");
            return;
        }
        setSelectedTaskForLog(task);
        setIsLogFormOpen(true);
    };

    const handleCloseLogForm = () => {
        setSelectedTaskForLog(null);
        setIsLogFormOpen(false);
    };

    // --- Hàm xử lý Nhận hàng bảo hành (GIỮ LẠI) ---
    const handleOpenNhanHangModal = (task) => { // Nhận task từ Bảng 2
        if (!task || !task.thongtinthietbi_id || !task.id) {
            toast.error("Thiếu thông tin Task hoặc Thiết bị liên kết.");
            return;
        }

        // Tạo object deviceInfo cần thiết cho FormNhanBaoHanhVe từ task
        const deviceInfoForModal = {
            id: task.thongtinthietbi_id,         // ID của ThongTinThietBi
            tenLoaiThietBi: task.tenThietBi,     // Tên thiết bị từ task
            phong_id: task.phong_id,             // ID phòng từ task
            phong_name: task.phong_name,         // Tên phòng từ task
            relatedBaoHongId: task.id            // ID của báo hỏng này
        };

        console.log("Opening NhanHangModal for Task:", task.id, "with deviceInfo:", deviceInfoForModal);
        setSelectedTaskForNhanHang(deviceInfoForModal); // Lưu deviceInfo vào state
        setIsNhanHangModalOpen(true);
    };

    const handleCloseNhanHangModal = () => {
        setSelectedTaskForNhanHang(null); // Clear state
        setIsNhanHangModalOpen(false);
    };

    // Callback khi nhận hàng thành công (để làm mới danh sách)
    const handleNhanHangSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['baotriActiveTasks', activeTaskStatuses] });
        queryClient.invalidateQueries({ queryKey: ['baotriWaitingWarrantyTasks', waitingWarrantyStatuses] });
        queryClient.invalidateQueries({ queryKey: ['baotriPendingFinalTasks', pendingFinalStatuses] });
        queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
    };


    // --- Hàm mở/đóng modal xem log --- (Giữ nguyên)
    const handleOpenViewLogModal = (task) => {
        if (!task || !task.id) {
            toast.error("Thiếu thông tin để xem log.");
            return;
        }
        setViewingLogFor(task.id);
        setPhongNameForModal(task.phong_name);
    };

    const handleCloseViewLogModal = () => {
        setViewingLogFor(null);
        setPhongNameForModal("");
    };

    // --- Hàm xử lý Hoàn thành công việc (chỉ cho Bảng 1) --- (Giữ nguyên)
    const handleCompleteTask = (taskId, coLog) => {
        if (!taskId) { toast.error("Thiếu ID công việc."); return; }
        const taskToComplete = activeTasks.find(t => t.id === taskId);
        if (!taskToComplete) { toast.error("Không tìm thấy công việc."); return; }
        if (!validCompleteStatuses.includes(taskToComplete.trangThai)) {
            toast.error(`Không thể hoàn thành công việc ở trạng thái "${taskToComplete.trangThai}".`);
            return;
        }
        if (window.confirm(`Bạn có chắc muốn đánh dấu hoàn thành công việc ID ${taskId}?`)) {
            updateStatusMutation.mutate({ id: taskId, updateData: { trangThai: 'Hoàn Thành' } });
        }
    };

    // Gộp loading/error handling cho cả 3 query
    const isLoading = isLoadingActiveTasks || isLoadingWaitingWarranty || isLoadingPendingFinal;
    const isError = isErrorActiveTasks || isErrorWaitingWarranty || isErrorPendingFinal;
    let displayError = null;
    if (isErrorActiveTasks) displayError = errorActiveTasks;
    else if (isErrorWaitingWarranty) displayError = errorWaitingWarranty;
    else if (isErrorPendingFinal) displayError = errorPendingFinal;

    if (isLoading) return <div className="p-4 text-center"><ArrowPathIcon className="inline-block w-5 h-5 mr-2 animate-spin" /> Đang tải dữ liệu...</div>;
    if (isError && displayError) return <div className="p-4 text-center text-red-500">Lỗi khi tải dữ liệu: {displayError?.response?.data?.error || displayError?.message || 'Lỗi không xác định'}</div>;

    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-100">
            {/* Header */}
            <div className="flex-shrink-0 p-4 bg-white border-b shadow-sm">
                <h2 className="text-xl font-semibold">Bảo Trì & Sửa Chữa</h2>
            </div>

            <div className="flex-grow p-4 space-y-8 overflow-y-auto">
                {/* === Bảng 1: Công việc đang xử lý === */}
                <div className="bg-white rounded-lg shadow">
                    <h3 className="p-4 text-lg font-semibold border-b">Công việc đang xử lý</h3>
                    {activeTasks.length === 0 ? (<p className="p-4 text-center text-gray-500">Không có công việc đang xử lý.</p>) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                {/* Thead Bảng 1 */}
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Phòng</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Thiết bị</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Mô tả hỏng</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Tình trạng TB</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Ngày báo</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Trạng thái Task</th>
                                        <th className="w-40 px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                {/* Tbody Bảng 1 */}
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {activeTasks.map((task) => (
                                        <tr key={task.id} className={`${task.trangThai === 'Yêu Cầu Làm Lại' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{task.phong_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {task.tenThietBi || 'N/A'} {task.thongtinthietbi_id ? `(ID: ${task.thongtinthietbi_id})` : ''}
                                            </td>
                                            <td className="max-w-xs px-6 py-4 text-sm text-gray-500 break-words">{task.moTa}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                                {task.tinhTrangThietBi ? getTinhTrangLabel(task.tinhTrangThietBi) : 'Không rõ'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{moment(task.ngayBaoHong).format('DD/MM/YYYY HH:mm')}</td>
                                            <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.trangThai === 'Đang Tiến Hành' ? 'bg-yellow-100 text-yellow-800' :
                                                        task.trangThai === 'Yêu Cầu Làm Lại' ? 'bg-red-100 text-red-800' :
                                                            task.trangThai === 'Đã Duyệt' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}> {task.trangThai} </span>
                                                {task.trangThai === 'Yêu Cầu Làm Lại' && task.ghiChuAdmin && (<FaInfoCircle title={task.ghiChuAdmin} className="inline-block ml-1 text-red-500 cursor-help" />)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-center whitespace-nowrap">
                                                <div className='flex items-center justify-center space-x-3'>
                                                    {(task.trangThai === 'Đang Tiến Hành' || task.trangThai === 'Yêu Cầu Làm Lại' || task.trangThai === 'Đã Duyệt') && (<button onClick={() => handleOpenLogForm(task)} className="text-indigo-600 hover:text-indigo-900" title="Ghi nhận hoạt động bảo trì"><FaHammer /></button>)}
                                                    <button onClick={() => handleOpenViewLogModal(task)} className={`${task.coLogBaoTri ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}`} disabled={!task.coLogBaoTri} title={task.coLogBaoTri ? "Xem lịch sử bảo trì" : "Chưa có lịch sử"}><FaHistory /></button>
                                                    <button onClick={() => handleCompleteTask(task.id, task.coLogBaoTri)} className={`${(validCompleteStatuses.includes(task.trangThai)) ? 'text-green-600 hover:text-green-900' : 'text-gray-400 cursor-not-allowed'} ${updateStatusMutation.isPending && updateStatusMutation.variables?.id === task.id ? 'opacity-50' : ''}`} disabled={!(validCompleteStatuses.includes(task.trangThai)) || (updateStatusMutation.isPending && updateStatusMutation.variables?.id === task.id)} title={(validCompleteStatuses.includes(task.trangThai)) ? "Đánh dấu hoàn thành" : "Không thể hoàn thành ở trạng thái này"}><FaCheckCircle /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* === Bảng 2: Chờ Hoàn Tất Bảo Hành === */}
                <div className="bg-white rounded-lg shadow">
                    <h3 className="p-4 text-lg font-semibold border-b">Công việc chờ hoàn tất bảo hành</h3>
                    {/* Sử dụng waitingWarrantyTasks */}
                    {waitingWarrantyTasks.length === 0 ? (
                        <p className="p-4 text-center text-gray-500">Không có công việc nào đang chờ hoàn tất bảo hành.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                {/* Thead Bảng 2 */}
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Phòng</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Thiết bị</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Mô tả hỏng</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Tình trạng TB</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Ngày báo</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Trạng thái Task</th>
                                        <th className="w-40 px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                {/* Tbody Bảng 2 */}
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {/* Map qua waitingWarrantyTasks */}
                                    {waitingWarrantyTasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{task.phong_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {task.tenThietBi || 'N/A'} {task.thongtinthietbi_id ? `(ID: ${task.thongtinthietbi_id})` : ''}
                                            </td>
                                            <td className="max-w-xs px-6 py-4 text-sm text-gray-500 break-words">{task.moTa}</td>
                                            {/* Tình trạng thiết bị phải là 'dang_bao_hanh' */}
                                            <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                                {task.tinhTrangThietBi ? getTinhTrangLabel(task.tinhTrangThietBi) : 'Không rõ'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{moment(task.ngayBaoHong).format('DD/MM/YYYY HH:mm')}</td>
                                            <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                                                {/* Trạng thái Task là 'Chờ Hoàn Tất Bảo Hành' */}
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800`}>
                                                    {task.trangThai}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-center whitespace-nowrap">
                                                <div className='flex items-center justify-center space-x-3'>
                                                    {/* Nút Xem Log */}
                                                    <button onClick={() => handleOpenViewLogModal(task)} className={`${task.coLogBaoTri ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}`} disabled={!task.coLogBaoTri} title={task.coLogBaoTri ? "Xem lịch sử bảo trì" : "Chưa có lịch sử"}><FaHistory /></button>
                                                    {/* Nút Nhận về */}
                                                    <button
                                                        onClick={() => handleOpenNhanHangModal(task)} // Truyền task vào
                                                        className="px-2 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600"
                                                        title="Xác nhận nhận thiết bị bảo hành về"
                                                    >
                                                        <FaPlusCircle className="inline mr-1" /> Nhận về
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* === Bảng 3: Công việc chờ xem xét === */}
                <div className="bg-white rounded-lg shadow">
                    <h3 className="p-4 text-lg font-semibold border-b">Công việc chờ xem xét</h3>
                    {/* Sử dụng pendingFinalTasks */}
                    {pendingFinalTasks.length === 0 ? (
                        <p className="p-4 text-center text-gray-500">Không có công việc nào đang chờ xem xét.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                {/* Thead Bảng 3 */}
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Phòng</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Thiết bị</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Mô tả hỏng</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Tình trạng TB</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Ngày báo</th>
                                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Trạng thái Task</th>
                                        <th className="w-40 px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                {/* Tbody Bảng 3 */}
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pendingFinalTasks.map((task) => (
                                        <tr key={task.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{task.phong_name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                {task.tenThietBi || 'N/A'} {task.thongtinthietbi_id ? `(ID: ${task.thongtinthietbi_id})` : ''}
                                            </td>
                                            <td className="max-w-xs px-6 py-4 text-sm text-gray-500 break-words">{task.moTa}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-700 whitespace-nowrap">
                                                {task.tinhTrangThietBi ? getTinhTrangLabel(task.tinhTrangThietBi) : 'Không rõ'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{moment(task.ngayBaoHong).format('DD/MM/YYYY HH:mm')}</td>
                                            <td className="px-6 py-4 text-sm text-center whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800`}>
                                                    {task.trangThai}
                                                </span>
                                                {task.ghiChuAdmin && (<FaInfoCircle title={task.ghiChuAdmin} className="inline-block ml-1 text-red-500 cursor-help" />)}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-center whitespace-nowrap">
                                                <div className='flex items-center justify-center space-x-3'>
                                                    <button onClick={() => handleOpenViewLogModal(task)} className={`${task.coLogBaoTri ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}`} disabled={!task.coLogBaoTri} title={task.coLogBaoTri ? "Xem lịch sử bảo trì" : "Chưa có lịch sử"}><FaHistory /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modals */}
                {isLogFormOpen && selectedTaskForLog && (<FormLogBaoTri baoHongInfo={selectedTaskForLog} onClose={handleCloseLogForm} onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['baotriActiveTasks', activeTaskStatuses] });
                    queryClient.invalidateQueries({ queryKey: ['baotriWaitingWarrantyTasks', waitingWarrantyStatuses] }); // Invalidate bảng chờ BH
                    queryClient.invalidateQueries({ queryKey: ['baotriPendingFinalTasks', pendingFinalStatuses] });
                    queryClient.invalidateQueries({ queryKey: ['baohongLog', selectedTaskForLog.id] });
                    if (selectedTaskForLog.thongtinthietbi_id) {
                        queryClient.invalidateQueries({ queryKey: ['thongTinThietBi', selectedTaskForLog.thongtinthietbi_id] });
                        queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
                    }
                }} />
                )}
                {viewingLogFor && (<ModalXemLogBaoTri baoHongId={viewingLogFor} phongName={phongNameForModal} onClose={handleCloseViewLogModal} />)}
                {isNhanHangModalOpen && selectedTaskForNhanHang && (<FormNhanBaoHanhVe deviceInfo={selectedTaskForNhanHang} onClose={handleCloseNhanHangModal} onSuccess={handleNhanHangSuccess} />)}
            </div>
        </div>
    );
};

export default BaoTri;
