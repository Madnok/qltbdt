// import { useState, useMemo, useCallback } from "react";
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import moment from 'moment';
// import { FaHammer, FaInfoCircle, FaHistory, FaPlusCircle, FaHourglassStart, FaChevronDown, FaChevronRight } from 'react-icons/fa'; // Thêm icons
// import { ArrowPathIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
// import PhanCongKhuVuc from "../components/LichTruc/PhanCongKhuVuc";
// import PhanCa from "../components/LichTruc/PhanCa";
// import MyScheduleView from "../components/LichTruc/LichNhanVien";
// import { useAuth } from "../context/AuthProvider";
// import ThongTinBaoHong from "../components/LichTruc/ThongTinBaoHong";
// import AdminGopYManagement from "../components/LichTruc/AdminGopYManagement";
// import LichBaoDuongAdmin from "../components/LichTruc/LichBaoDuongAdmin";
// import FormLogBaoTri from '../components/forms/FormLogBaoTri';
// import FormNhanBaoHanhVe from '../components/forms/FormNhanBaoHanhVe';
// import ModalXemLogBaoTri from '../components/LichTruc/ModalXemLogBaoTri';
// import { getTinhTrangLabel } from '../utils/constants';
// import * as api from '../api';
// import { toast } from 'react-toastify';


// // --- Component Nhóm Công việc theo Phòng (Mới) ---
// const RoomTaskGroup = ({ roomName, tasks, taskType, handlers }) => {
//     const [isOpen, setIsOpen] = useState(true); // Mặc định mở

//     const {
//         handleOpenLogForm,
//         handleOpenViewLogModal,
//         handleStartBaoHong,
//         handleOpenNhanHangModal,
//         handleStartBaoDuong,
//         updateBaoHongStatusMutation,
//         updateBaoDuongStatusMutation,
//     } = handlers;

//     if (!tasks || tasks.length === 0) return null;

//     // Lấy trạng thái loading từ mutation tương ứng
//     const isLoadingBaoHongAction = updateBaoHongStatusMutation.isPending;
//     const loadingBaoHongTaskId = updateBaoHongStatusMutation.variables?.id;
//     const isLoadingBaoDuongAction = updateBaoDuongStatusMutation.isPending;
//     const loadingBaoDuongTaskId = updateBaoDuongStatusMutation.variables?.id;

//     return (
//         <div className="mb-4 border rounded-md shadow-sm bg-white overflow-hidden">
//             {/* Header Phòng - Có thể thu gọn */}
//             <button
//                 className="flex items-center justify-between w-full p-3 text-left bg-gray-100 hover:bg-gray-200 focus:outline-none"
//                 onClick={() => setIsOpen(!isOpen)}
//             >
//                 <div className="flex items-center">
//                     {isOpen ? <FaChevronDown className="w-3 h-3 mr-2 text-gray-600" /> : <FaChevronRight className="w-3 h-3 mr-2 text-gray-600" />}
//                     <BuildingOfficeIcon className="w-4 h-4 mr-1 text-gray-500" />
//                     <span className="font-semibold text-gray-800">{roomName}</span>
//                     <span className="ml-2 text-xs text-gray-500">({tasks.length} công việc)</span>
//                 </div>
//             </button>

//             {/* Danh sách công việc trong phòng (hiển thị nếu mở) */}
//             {isOpen && (
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full divide-y divide-gray-200">
//                         <tbody className="bg-white divide-y divide-gray-200">
//                             {tasks.map((task) => {
//                                 const isBaoHong = taskType === 'baohong';
//                                 const currentStatus = isBaoHong ? task.trangThai : task.trang_thai;
//                                 const ngayCongViec = isBaoHong ? task.ngayBaoHong : task.ngay_baotri;
//                                 const moTaCongViec = isBaoHong ? task.moTa : task.mo_ta;
//                                 const tenThietBi = task.tenThietBi;
//                                 const thietBiId = task.thongtinthietbi_id;
//                                 const coLog = task.coLogBaoTri;
//                                 const tinhTrangTB = task.tinhTrangThietBi;
//                                 const ghiChuAdmin = task.ghiChuAdmin;

//                                 // Xác định trạng thái loading cho task cụ thể
//                                 const isLoadingAction = isBaoHong
//                                     ? (isLoadingBaoHongAction && loadingBaoHongTaskId === task.id)
//                                     : (isLoadingBaoDuongAction && loadingBaoDuongTaskId === task.id);

//                                 return (
//                                     <tr key={`${taskType}-${task.id}`} className={`${isBaoHong && currentStatus === 'Yêu Cầu Làm Lại' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
//                                         {/* Các cột dữ liệu */}
//                                         <td className="px-4 py-2 text-sm text-gray-700 max-w-xs break-words">
//                                             {tenThietBi ? `${tenThietBi} ${thietBiId ? `(ID: ${thietBiId})` : ''}` : (isBaoHong ? 'Hạ tầng/Khác' : '')}
//                                             <span className="block mt-1 text-xs text-gray-500">{moTaCongViec}</span>
//                                         </td>
//                                         <td className="px-4 py-2 text-sm text-gray-500 whitespace-nowrap">
//                                             {moment(ngayCongViec).format(isBaoHong ? 'DD/MM/YY HH:mm' : 'DD/MM/YYYY')}
//                                         </td>
//                                         <td className="px-4 py-2 text-sm text-center whitespace-nowrap">
//                                             {/* Badge trạng thái */}
//                                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isBaoHong ?
//                                                 (currentStatus === 'Đang Tiến Hành' ? 'bg-yellow-100 text-yellow-800' :
//                                                     currentStatus === 'Yêu Cầu Làm Lại' ? 'bg-red-100 text-red-800' :
//                                                         currentStatus === 'Đã Duyệt' ? 'bg-blue-100 text-blue-800' :
//                                                             currentStatus === 'Chờ Hoàn Tất Bảo Hành' ? 'bg-orange-100 text-orange-800' :
//                                                                 currentStatus === 'Chờ Xem Xét' ? 'bg-purple-100 text-purple-800' :
//                                                                     'bg-gray-100 text-gray-800')
//                                                 : // Bảo dưỡng
//                                                 (currentStatus === 'Đang tiến hành' ? 'bg-yellow-100 text-yellow-800' :
//                                                     currentStatus === 'Chờ xử lý' ? 'bg-blue-100 text-blue-800' :
//                                                         currentStatus === 'Chờ Hoàn Tất Bảo Hành' ? 'bg-orange-100 text-orange-800' :
//                                                             'bg-gray-100 text-gray-800')
//                                                 }`}>
//                                                 {currentStatus}
//                                             </span>
//                                             {isBaoHong && currentStatus === 'Yêu Cầu Làm Lại' && ghiChuAdmin && (
//                                                 <FaInfoCircle title={ghiChuAdmin} className="inline-block ml-1 text-red-500 cursor-help" />
//                                             )}
//                                         </td>
//                                         {/* Cột tình trạng thiết bị (chỉ hiển thị cho Sửa chữa) */}
//                                         <td className="px-4 py-2 text-sm font-medium text-center whitespace-nowrap">
//                                             {isBaoHong ? (tinhTrangTB ? getTinhTrangLabel(tinhTrangTB) : <span className="italic text-gray-400">N/A</span>) : '-'}
//                                         </td>
//                                         {/* Cột Hành động */}
//                                         <td className="px-4 py-2 text-sm font-medium text-center whitespace-nowrap">
//                                              <div className='flex flex-wrap items-center justify-center gap-2'>
//                                                  {isBaoHong && (
//                                                      <>
//                                                          {currentStatus === 'Đã Duyệt' && ( <button onClick={() => handleStartBaoHong(task.id)}className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed" title="Bắt đầu xử lý" disabled={isLoadingAction}><FaHourglassStart /></button> )}
//                                                          {['Đang Tiến Hành', 'Yêu Cầu Làm Lại'].includes(currentStatus) && ( <button onClick={() => handleOpenLogForm(task, 'baohong')} className="text-indigo-600 hover:text-indigo-900" title="Ghi nhận hoạt động"><FaHammer /></button> )}
//                                                          <button onClick={() => handleOpenViewLogModal(task, 'baohong')}className={`${coLog ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}`} disabled={!coLog} ><FaHistory /></button>
//                                                          {currentStatus === 'Chờ Hoàn Tất Bảo Hành' && ( <button onClick={() => handleOpenNhanHangModal(task)} className="px-2 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600" title="Xác nhận nhận thiết bị về (Báo Hỏng)" ><FaPlusCircle /></button> )}
//                                                      </>
//                                                  )}
//                                                  {!isBaoHong && (
//                                                      <>
//                                                          {currentStatus === 'Chờ xử lý' && ( <button onClick={() => handleStartBaoDuong(task.id)} className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed" title="Bắt đầu xử lý" disabled={isLoadingAction}><FaHourglassStart /></button> )}
//                                                          {currentStatus === 'Đang tiến hành' && ( <button onClick={() => handleOpenLogForm(task, 'lichbaoduong')} className="text-indigo-600 hover:text-indigo-900" title="Ghi nhận hoạt động" ><FaHammer /></button> )}
//                                                          <button onClick={() => handleOpenViewLogModal(task, 'lichbaoduong')} className={`${coLog ? 'text-purple-600 hover:text-purple-900' : 'text-gray-400 cursor-not-allowed'}`} disabled={!coLog} ><FaHistory /></button>
//                                                          {currentStatus === 'Chờ Hoàn Tất Bảo Hành' && (
//                                                             <button
//                                                                 onClick={() => handleOpenNhanHangModal(task, 'lichbaoduong')}
//                                                                 className="px-2 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600" // Giữ màu xanh như Báo hỏng
//                                                                 title="Xác nhận nhận thiết bị về (Bảo Dưỡng)"
//                                                             >
//                                                                 <FaPlusCircle className="inline mr-1" /> Nhận về
//                                                             </button>
//                                                         )}
//                                                      </>
//                                                  )}
//                                              </div>
//                                         </td>
//                                     </tr>
//                                 );
//                             })}
//                         </tbody>
//                     </table>
//                 </div>
//             )}
//         </div>
//     );
// };

// // --- Component Hiển thị Công việc Gộp (Mới) ---
// const AssignedTasksView = () => {
//     const queryClient = useQueryClient();
//     const [activeTaskTypeTab, setActiveTaskTypeTab] = useState('baohong');

//     // State cho modal log bảo trì
//     const [selectedTaskInfoForLog, setSelectedTaskInfoForLog] = useState(null);
//     const [isLogFormOpen, setIsLogFormOpen] = useState(false);

//     // State cho modal xem log
//     const [viewingLogFor, setViewingLogFor] = useState({ id: null, type: null }); // { id: taskId, type: 'baohong' | 'lichbaoduong' }
//     const [phongNameForModal, setPhongNameForModal] = useState("");

//     // State cho modal nhận hàng bảo hành (từ Báo Hỏng)
//     const [isNhanHangModalOpen, setIsNhanHangModalOpen] = useState(false);
//     const [selectedTaskForNhanHang, setSelectedTaskForNhanHang] = useState(null);

//     // State cho modal xem chi tiết (có thể dùng chung hoặc riêng)
//     // const [viewingDetailsFor, setViewingDetailsFor] = useState(null);

//     // --- Fetch Data ---
//     // Fetch Báo Hỏng được giao
//     const baoHongStatuses = useMemo(() => ['Đã Duyệt', 'Đang Tiến Hành', 'Yêu Cầu Làm Lại', 'Chờ Hoàn Tất Bảo Hành', 'Chờ Xem Xét'], []);
//     const { data: baoHongTasks = [], isLoading: isLoadingBaoHong } = useQuery({
//         queryKey: ['assignedBaoHongTasks', baoHongStatuses],
//         queryFn: () => api.fetchAssignedBaoHongAPI({ statuses: baoHongStatuses }),
//         staleTime: 1 * 60 * 1000,
//     });

//     // Fetch Lịch Bảo Dưỡng được giao
//     const baoDuongStatuses = useMemo(() => ['Chờ xử lý', 'Đang tiến hành', 'Chờ Hoàn Tất Bảo Hành'], []); // Thêm Chờ BH
//     const { data: baoDuongTasksData, isLoading: isLoadingBaoDuong } = useQuery({
//         queryKey: ['assignedBaoDuongTasks', baoDuongStatuses],
//         queryFn: () => api.getMyLichBaoDuongAPI({ trangThai: baoDuongStatuses.join(','), limit: 1000 }), // Lấy nhiều hơn
//         staleTime: 1 * 60 * 1000,
//     });
//     const baoDuongTasks = useMemo(() => baoDuongTasksData?.data || [], [baoDuongTasksData]);

//     // --- Mutations ---
//     // Mutation cập nhật trạng thái Báo Hỏng
//     const updateBaoHongStatusMutation = useMutation({
//         mutationFn: api.updateBaoHongAPI,
//         onSuccess: (data, variables) => {
//             toast.success(data.message || `Cập nhật Báo hỏng ID ${variables.id} thành công.`);
//             queryClient.invalidateQueries({ queryKey: ['assignedBaoHongTasks'] });
//             queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
//             queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
//         },
//         onError: (error, variables) => {
//             console.error("Lỗi cập nhật Báo hỏng:", error);
//             toast.error(`Lỗi cập nhật Báo hỏng ID ${variables.id}: ${error.response?.data?.error || error.message}`);
//         }
//     });

//     // Mutation cập nhật trạng thái Lịch Bảo Dưỡng
//     const updateBaoDuongStatusMutation = useMutation({
//         mutationFn: ({ id, data }) => api.updateLichBaoDuongStatusAPI(id, data),
//         onSuccess: (data, variables) => {
//             toast.success(data.message || `Cập nhật Lịch bảo dưỡng ID ${variables.id} thành công.`);
//             queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
//             queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
//         },
//         onError: (error, variables) => {
//             console.error("Lỗi cập nhật Lịch bảo dưỡng:", error);
//             toast.error(`Lỗi cập nhật Lịch bảo dưỡng ID ${variables.id}: ${error.response?.data?.error || error.message}`);
//         }
//     });

//     // --- Group Data by Room ---
//     const groupTasksByRoom = (tasks) => {
//         if (!tasks || tasks.length === 0) return {};
//         return tasks.reduce((acc, task) => {
//             // Sử dụng tenPhong hoặc phong_name, fallback về ID nếu không có tên
//             const roomKey = task.tenPhong || task.phong_name || `Phòng ID ${task.phong_id}`;
//             if (!acc[roomKey]) {
//                 acc[roomKey] = [];
//             }
//             acc[roomKey].push(task);
//             return acc;
//         }, {});
//     };

//     const groupedBaoHongTasks = useMemo(() => groupTasksByRoom(baoHongTasks), [baoHongTasks]);
//     const groupedBaoDuongTasks = useMemo(() => groupTasksByRoom(baoDuongTasks), [baoDuongTasks]);

//     // --- Handlers ---

//     const handleOpenLogForm = useCallback((task, type, suggestedResult = null) => { // Nhận task, type và optional suggestedResult
//         if (!task || !task.id || !task.phong_id) {
//             toast.error("Dữ liệu công việc không đầy đủ để tạo log.");
//             return;
//         }
//         // Tạo logInfo chính xác ở đây
//         const isMaintenanceTask = type === 'lichbaoduong';
//         const logInfo = {
//             id: isMaintenanceTask ? null : task.id,
//             lichbaoduong_id: isMaintenanceTask ? task.id : null, 
//             phong_id: task.phong_id,
//             phong_name: task.tenPhong || task.phong_name, 
//             thongtinthietbi_id: task.thongtinthietbi_id || null,
//             tenThietBi: task.tenThietBi || null,
//             trangThaiHienTai: isMaintenanceTask ? task.trang_thai : task.trangThai,
//             moTaCongViec: isMaintenanceTask ? task.mo_ta : task.moTa,
//             coLogTruocDo: task.coLogBaoTri,
//             tinhTrangThietBi: task.tinhTrangThietBi, 
//             ghiChuAdmin: task.ghiChuAdmin, 
//             suggestedKetQuaXuLy: suggestedResult
//         };

//         console.log(`[LichTruc - handleOpenLogForm] Constructed logInfo for type '${type}':`, logInfo);
//         setSelectedTaskInfoForLog(logInfo); // Set state với object đã tạo đúng
//         setIsLogFormOpen(true);
//     }, []);

//     const handleCloseLogForm = () => { setSelectedTaskInfoForLog(null); setIsLogFormOpen(false); };


//     // Mở modal xem log
//     const handleOpenViewLogModal = useCallback((task, type) => {
//         if (!task || !task.id) {
//             toast.error("Thiếu thông tin để xem log.");
//             return;
//         }
//         setViewingLogFor({ id: task.id, type: type });
//         setPhongNameForModal(task.tenPhong || task.phong_name);
//     }, []);

//     const handleCloseViewLogModal = () => {
//         setViewingLogFor({ id: null, type: null });
//         setPhongNameForModal("");
//     };

//     const handleCloseNhanHangModal = () => { setSelectedTaskForNhanHang(null); setIsNhanHangModalOpen(false); };

//     // Xử lý Bắt đầu công việc Bảo Dưỡng
//     const handleStartBaoDuong = useCallback((id) => {
//         updateBaoDuongStatusMutation.mutate({ id, data: { trang_thai: 'Đang tiến hành' } });
//     }, [updateBaoDuongStatusMutation]);

//     // Xử lý Bắt đầu công việc Báo Hỏng
//     const handleStartBaoHong = useCallback((taskId) => {
//         updateBaoHongStatusMutation.mutate({ id: taskId, updateData: { trangThai: 'Đang Tiến Hành' } });
//     }, [updateBaoHongStatusMutation]);

//     // Mở modal nhận hàng bảo hành về (cho task báo hỏng)
//     const handleOpenNhanHangModal = useCallback((task, type = 'baohong') => { 
//         if (!task || !task.thongtinthietbi_id || !task.id) {
//             toast.error("Thiếu thông tin Task hoặc Thiết bị liên kết.");
//             return;
//         }

//         const deviceInfoForModal = {
//             id: task.thongtinthietbi_id,         
//             tenThietBi: task.tenThietBi,       
//             phong_id: task.phong_id,            
//             phong_name: task.phong_name || task.tenPhong,
//             relatedBaoHongId: type === 'baohong' ? task.id : null,
//             relatedLichBaoDuongId: type === 'lichbaoduong' ? task.id : null
//         };

//         console.log(`Opening NhanHangModal for ${type} task ID: ${task.id} with deviceInfo:`, deviceInfoForModal);
//         setSelectedTaskForNhanHang(deviceInfoForModal);
//         setIsNhanHangModalOpen(true);
//     }, []);

//     const handleNhanHangSuccess = () => {
//         queryClient.invalidateQueries({ queryKey: ['assignedBaoHongTasks'] });
//         queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
//         // Có thể cần invalidate thêm query khác nếu cần
//     };

//     // --- useMemo for Handlers Object ---
//     const handlers = useMemo(() => ({
//         handleOpenLogForm, handleOpenViewLogModal, handleStartBaoHong,
//         handleOpenNhanHangModal, handleStartBaoDuong, updateBaoHongStatusMutation, updateBaoDuongStatusMutation,
//     }), [
//         handleOpenLogForm, handleOpenViewLogModal, handleStartBaoHong,
//         handleOpenNhanHangModal, handleStartBaoDuong, updateBaoHongStatusMutation, updateBaoDuongStatusMutation
//     ]);

//     // --- Render Logic ---
//     const isLoading = isLoadingBaoHong || isLoadingBaoDuong;
//     const sortedBaoHongRooms = Object.keys(groupedBaoHongTasks).sort();
//     const sortedBaoDuongRooms = Object.keys(groupedBaoDuongTasks).sort();

//     return (
//         <div className="p-2 ">
//             {/* Tabs con Sửa chữa / Bảo dưỡng */}
//             <div className="flex mb-4 border-b border-gray-300">
//                 <button
//                     className={`flex items-center px-4 py-2 text-sm font-medium focus:outline-none ${activeTaskTypeTab === 'baohong' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
//                     onClick={() => setActiveTaskTypeTab('baohong')}
//                 >
//                     <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
//                     Sửa chữa ({baoHongTasks.length})
//                 </button>
//                 <button
//                     className={`flex items-center px-4 py-2 text-sm font-medium focus:outline-none ${activeTaskTypeTab === 'baoduong' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
//                     onClick={() => setActiveTaskTypeTab('baoduong')}
//                 >
//                     <WrenchScrewdriverIcon className="w-4 h-4 mr-1" />
//                     Bảo dưỡng ({baoDuongTasks.length})
//                 </button>
//             </div>

//             {isLoading && <div className="text-center"><ArrowPathIcon className="inline-block w-5 h-5 mr-2 animate-spin" /> Đang tải công việc...</div>}

//             {/* Nội dung Tab con */}
//             <div className="mt-4">
//                 {/* Hiển thị công việc Báo hỏng */}
//                 {activeTaskTypeTab === 'baohong' && !isLoadingBaoHong && (
//                     <div>
//                         {sortedBaoHongRooms.length === 0 ? (
//                             <p className="text-center text-gray-500">Không có công việc sửa chữa nào.</p>
//                         ) : (
//                             <div className="space-y-4">
//                                 <div className="hidden md:grid grid-cols-[1fr_120px_100px_120px_120px] gap-4 px-4 py-2 bg-gray-50 rounded-t-md text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                     {/* Điều chỉnh các cột tiêu đề */}
//                                     <div className="col-span-1">Thiết bị / Mô tả</div>
//                                     <div className="col-span-1 text-left">Ngày báo</div>
//                                     <div className="col-span-1 text-center">Trạng thái CV</div>
//                                     <div className="col-span-1 text-center">TT Thiết bị</div>
//                                     <div className="col-span-1 text-center">Hành động</div>
//                                 </div>
//                                 {sortedBaoHongRooms.map(roomName => (
//                                     <RoomTaskGroup
//                                         key={`bh-room-${roomName}`}
//                                         roomName={roomName}
//                                         tasks={groupedBaoHongTasks[roomName]}
//                                         taskType="baohong"
//                                         handlers={handlers}
//                                     />
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                 )}

//                 {/* Hiển thị công việc Bảo dưỡng */}
//                 {activeTaskTypeTab === 'baoduong' && !isLoadingBaoDuong && (
//                     <div>
//                         {sortedBaoDuongRooms.length === 0 ? (
//                             <p className="text-center text-gray-500">Không có công việc bảo dưỡng nào.</p>
//                         ) : (
//                             <div className="space-y-4">
//                                 {/* Tiêu đề bảng cho Bảo Dưỡng */}
//                                 <div className="hidden md:grid grid-cols-[1fr_120px_100px_120px_120px] gap-4 px-4 py-2 bg-gray-50 rounded-t-md text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                     <div className="col-span-1">Thiết bị / Mô tả</div>
//                                     <div className="col-span-1 text-left">Ngày BD</div>
//                                     <div className="col-span-1 text-center">Trạng thái</div>
//                                     <div className="col-span-1 text-center">TT Thiết bị</div> {/* Giữ cột trống cho căn chỉnh */}
//                                     <div className="col-span-1 text-center">Hành động</div>
//                                 </div>
//                                 {sortedBaoDuongRooms.map(roomName => (
//                                     <RoomTaskGroup
//                                         key={`bd-room-${roomName}`}
//                                         roomName={roomName}
//                                         tasks={groupedBaoDuongTasks[roomName]}
//                                         taskType="baoduong"
//                                         handlers={handlers}
//                                     />
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>

//             {/* Modals */}
//             {isLogFormOpen && selectedTaskInfoForLog && (
//                 <FormLogBaoTri
//                     taskInfo={selectedTaskInfoForLog}
//                     onClose={handleCloseLogForm}
//                     onSuccess={() => {
//                         if (selectedTaskInfoForLog?.lichbaoduong_id) { 
//                              queryClient.invalidateQueries({ queryKey: ['assignedBaoDuongTasks'] });
//                              queryClient.invalidateQueries({ queryKey: ['lichBaoDuongLog', selectedTaskInfoForLog.lichbaoduong_id] });
//                              queryClient.invalidateQueries({ queryKey: ['lichBaoDuongList'] });
//                          } else if (selectedTaskInfoForLog?.id) {
//                              queryClient.invalidateQueries({ queryKey: ['assignedBaoHongTasks'] });
//                              queryClient.invalidateQueries({ queryKey: ['baohongLog', selectedTaskInfoForLog.id] });
//                              queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
//                          }
//                          if (selectedTaskInfoForLog?.thongtinthietbi_id) {
//                             queryClient.invalidateQueries({ queryKey: ['thongTinThietBi', selectedTaskInfoForLog.thongtinthietbi_id] });
//                             queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
//                             queryClient.invalidateQueries({ queryKey: ['baoTriLogsByThietBi', selectedTaskInfoForLog.thongtinthietbi_id] });
//                          }
//                     }}
//                 />
//             )}

//             {viewingLogFor.id && (
//                 <ModalXemLogBaoTri
//                     // Truyền ID và loại task để Modal biết gọi API nào
//                     baoHongId={viewingLogFor.type === 'baohong' ? viewingLogFor.id : null}
//                     lichBaoDuongId={viewingLogFor.type === 'lichbaoduong' ? viewingLogFor.id : null}
//                     thongtinthietbiId={viewingLogFor.type === 'thongtinthietbi' ? viewingLogFor.id : null} // Nếu xem theo thiết bị
//                     phongName={phongNameForModal}
//                     onClose={handleCloseViewLogModal}
//                 />
//             )}

//             {isNhanHangModalOpen && selectedTaskForNhanHang && (
//                 <FormNhanBaoHanhVe
//                     deviceInfo={selectedTaskForNhanHang}
//                     onClose={handleCloseNhanHangModal}
//                     onSuccess={handleNhanHangSuccess}
//                 />
//             )}

//             {/* Modal xem chi tiết (Implement if needed) */}
//         </div>
//     );
// };

// // --- Component LichTruc Chính ---
// const LichTruc = () => {
//     const { user, loading } = useAuth();
//     const [adminActiveTab, setAdminActiveTab] = useState("reports"); // Mặc định cho admin
//     const [nhanVienActiveTab, setNhanVienActiveTab] = useState("myTasks"); // Đổi mặc định cho nhân viên

//     if (loading) {
//         return <div className="p-4 text-center">Đang tải thông tin người dùng...</div>;
//     }
//     if (!user) {
//         return <div className="p-4 text-center text-red-500">Lỗi: Không tìm thấy thông tin người dùng.</div>;
//     }

//     // Giao diện Admin (Giữ nguyên)
//     if (user.role === 'admin') {
//         return (
//             <div className="flex flex-col h-full bg-white border">
//                 {/* Header Admin */}
//                 <div className="flex items-center justify-between p-4 border-b ">
//                     <h2 className="text-2xl font-bold text-gray-800">Quản Lý Công Việc</h2>
//                 </div>
//                 {/* Tabs Admin */}
//                 <div className="flex border-b shrink-0">
//                     <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "reports" ? "border-b-2 border-red-500 font-semibold text-red-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("reports")}>Báo Hỏng</button>
//                     <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "maintenance" ? "border-b-2 border-yellow-500 font-semibold text-yellow-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("maintenance")}>Bảo Dưỡng</button>
//                     <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "gopy" ? "border-b-2 border-purple-500 font-semibold text-purple-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("gopy")}>Góp Ý</button>
//                     <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "schedule" ? "border-b-2 border-green-500 font-semibold text-green-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("schedule")}>Phân Ca</button>
//                     <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "users" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("users")}>Phân Công</button>
//                 </div>
//                 {/* Nội dung Tabs Admin */}
//                 <div className="flex-grow overflow-auto">
//                     {adminActiveTab === "reports" && <ThongTinBaoHong />}
//                     {adminActiveTab === "maintenance" && <LichBaoDuongAdmin />}
//                     {adminActiveTab === "schedule" && <PhanCa />}
//                     {adminActiveTab === "users" && <PhanCongKhuVuc />}
//                     {adminActiveTab === "gopy" && <AdminGopYManagement />}
//                 </div>
//             </div>
//         );
//     }

//     // Giao diện Nhân viên (Đã chỉnh sửa)
//     if (user.role === 'nhanvien') {
//         return (
//             <div className="flex flex-col h-full bg-gray-100"> {/* Đổi màu nền */}
//                 <div className="flex items-center justify-between p-4 bg-white border-b shrink-0"> {/* Header cố định */}
//                     <h2 className="text-xl font-semibold text-gray-800">Công Việc & Lịch Trực</h2>
//                 </div>
//                 {/* Tabs NhanVien */}
//                 <div className="flex bg-white border-b shrink-0"> {/* Tabs cố định */}
//                     <button
//                         className={`p-3 px-4 text-sm text-center flex-1 ${nhanVienActiveTab === "myTasks" ? "border-b-2 border-teal-500 font-semibold text-teal-600" : "text-gray-500 hover:bg-gray-100"}`}
//                         onClick={() => setNhanVienActiveTab("myTasks")}
//                     >
//                         Công Việc Được Giao {/* Đổi tên Tab */}
//                     </button>
//                     <button
//                         className={`p-3 px-4 text-sm text-center flex-1 ${nhanVienActiveTab === "mySchedule" ? "border-b-2 border-cyan-500 font-semibold text-cyan-600" : "text-gray-500 hover:bg-gray-100"}`}
//                         onClick={() => setNhanVienActiveTab("mySchedule")}
//                     >
//                         Lịch Trực Cá Nhân
//                     </button>
//                 </div>
//                 {/* Nội dung Tabs NhanVien */}
//                 <div className="flex-grow overflow-auto bg-white"> {/* Cho phép nội dung scroll */}
//                     {nhanVienActiveTab === "myTasks" && <AssignedTasksView />} {/* Component mới */}
//                     {nhanVienActiveTab === "mySchedule" && <MyScheduleView />}
//                 </div>
//             </div>
//         );
//     }

//     // Trường hợp khác
//     return (
//         <div className="p-4 text-center text-red-500">
//             Vai trò người dùng không được hỗ trợ ('{user.role}').
//         </div>
//     );
// };

// export default LichTruc;

// src/pages/LichTruc.js
import { useState } from "react";
import { useAuth } from "../context/AuthProvider";
import PhanCongKhuVuc from "../components/LichTruc/PhanCongKhuVuc";
import PhanCa from "../components/LichTruc/PhanCa";
import ThongTinBaoHong from "../components/LichTruc/ThongTinBaoHong";
import AdminGopYManagement from "../components/LichTruc/AdminGopYManagement";
import LichBaoDuongAdmin from "../components/LichTruc/LichBaoDuongAdmin";
import AssignedTasksView from "../components/LichTruc/AssignedTasksView";
import MyScheduleView from "../components/LichTruc/LichNhanVien";

const LichTruc = () => {
    const { user, loading } = useAuth();
    const [adminActiveTab, setAdminActiveTab] = useState("reports");
    const [nhanVienActiveTab, setNhanVienActiveTab] = useState("myTasks"); 

    if (loading) {
        return <div className="p-4 text-center">Đang tải thông tin người dùng...</div>;
    }
    if (!user) {
        return <div className="p-4 text-center text-red-500">Lỗi: Không tìm thấy thông tin người dùng.</div>;
    }

    // Giao diện Admin
    if (user.role === 'admin') {
        return (
            <div className="flex flex-col h-full bg-white border">
                {/* Header Admin */}
                <div className="flex items-center justify-between p-4 border-b ">
                    <h2 className="text-2xl font-bold text-gray-800">Quản Lý Công Việc</h2>
                </div>
                {/* Tabs Admin */}
                <div className="flex border-b shrink-0">
                    <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "reports" ? "border-b-2 border-red-500 font-semibold text-red-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("reports")}>Báo Hỏng</button>
                    <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "maintenance" ? "border-b-2 border-yellow-500 font-semibold text-yellow-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("maintenance")}>Bảo Dưỡng</button>
                    <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "gopy" ? "border-b-2 border-purple-500 font-semibold text-purple-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("gopy")}>Góp Ý</button>
                    <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "schedule" ? "border-b-2 border-green-500 font-semibold text-green-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("schedule")}>Phân Ca</button>
                    <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "users" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("users")}>Phân Công</button>
                </div>
                {/* Nội dung Tabs Admin */}
                <div className="flex-grow overflow-auto">
                    {adminActiveTab === "reports" && <ThongTinBaoHong />}
                    {adminActiveTab === "maintenance" && <LichBaoDuongAdmin />}
                    {adminActiveTab === "schedule" && <PhanCa />}
                    {adminActiveTab === "users" && <PhanCongKhuVuc />}
                    {adminActiveTab === "gopy" && <AdminGopYManagement />}
                </div>
            </div>
        );
    }

    // Giao diện Nhân viên
    if (user.role === 'nhanvien') {
        return (
            <div className="flex flex-col h-full bg-gray-100">
                <div className="flex items-center justify-between p-4 bg-white border-b shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">Công Việc & Lịch Trực</h2>
                </div>
                {/* Tabs NhanVien */}
                <div className="flex bg-white border-b shrink-0">
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${nhanVienActiveTab === "myTasks" ? "border-b-2 border-teal-500 font-semibold text-teal-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setNhanVienActiveTab("myTasks")}
                    >
                        Công Việc Được Giao
                    </button>
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${nhanVienActiveTab === "mySchedule" ? "border-b-2 border-cyan-500 font-semibold text-cyan-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setNhanVienActiveTab("mySchedule")}
                    >
                        Lịch Trực Cá Nhân
                    </button>
                </div>
                {/* Nội dung Tabs NhanVien */}
                <div className="flex-grow overflow-auto bg-white">
                    {nhanVienActiveTab === "myTasks" && <AssignedTasksView />} {/* Component hiển thị công việc gộp */}
                    {nhanVienActiveTab === "mySchedule" && <MyScheduleView />} {/* Component chỉ hiển thị lịch trực */}
                </div>
            </div>
        );
    }

    // Trường hợp khác
    return (
        <div className="p-4 text-center text-red-500">
            Vai trò người dùng không được hỗ trợ ('{user.role}').
        </div>
    );
};

export default LichTruc;
