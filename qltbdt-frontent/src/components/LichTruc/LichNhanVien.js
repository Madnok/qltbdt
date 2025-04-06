import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthProvider';
import LichTheoTuan from './LichTheoTuan';
import { parseISO } from 'date-fns';
import {
    fetchAssignedRooms,
    fetchMyScheduleInternal,
    fetchAssignedBaoHongAPI,
    updateBaoHongAPI
} from '../../api';
import moment from 'moment';
import { FaEye, FaCheckCircle, FaTimesCircle, FaWrench, FaMapMarkerAlt, FaTools, FaCalendarAlt, FaFilter, FaSearch, FaChevronLeft, FaChevronRight, FaUserClock } from 'react-icons/fa';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// --- Components & Definitions (Giữ nguyên) ---
const shiftTypesDefinitionForView = {
    morning: { title: "Sáng", legendColor: 'bg-blue-200', textClass: 'text-blue-600', startHour: 8, endHour: 15 },
    evening: { title: "Chiều", legendColor: 'bg-orange-200', textClass: 'text-orange-600', startHour: 15, endHour: 22 },
};
const mapDbValueToShiftTypeKey = (dbValue) => {
    if (dbValue === 'Ca Sáng') return 'morning';
    if (dbValue === 'Ca Chiều') return 'evening';
    return null;
};
// --- Component Modal xem ảnh (Giữ nguyên từ ThongTinBaoHong) ---
const ImageModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;
    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-75" // Tăng z-index
            onClick={onClose}
        >
            <div className="relative max-w-3xl max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <img src={imageUrl} alt="Hình ảnh báo hỏng" className="block object-contain max-w-full max-h-full rounded" />
                <button
                    onClick={onClose}
                    className="absolute p-1 text-white bg-black bg-opacity-50 rounded-full top-2 right-2 hover:bg-opacity-75"
                    aria-label="Đóng ảnh"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};
// --- Hết Components & Definitions ---


// --- *** Component Danh sách Báo Hỏng dạng Card *** ---
const DanhSachBaoHongNhanVien = ({ baoHongItems = [] }) => { // Thêm default value
    const [expandedCardId, setExpandedCardId] = useState(null);
    const [modalImage, setModalImage] = useState(null);
    const [filterTerm, setFilterTerm] = useState('');       // Từ khóa tìm kiếm (mô tả, phòng, thiết bị)
    const [filterSeverity, setFilterSeverity] = useState(''); // Lọc theo mức độ
    const [currentPage, setCurrentPage] = useState(1);
    const TASKS_PER_PAGE = 3;

    const queryClient = useQueryClient();

    const toggleDetails = (id) => setExpandedCardId(expandedCardId === id ? null : id);

    const handleStartWork = (id) => {
        if (window.confirm("Xác nhận bắt đầu xử lý báo hỏng này?")) {
            const updateData = { trangThai: 'Đang Tiến Hành' }; // Trạng thái mới
            updateTaskMutation.mutate({ id, updateData });
        }
    };

    const handleComplete = (id) => {
        if (window.confirm("Xác nhận đã hoàn thành xử lý báo hỏng này?")) {
            const updateData = { trangThai: 'Hoàn Thành' }; // Trạng thái mới
            updateTaskMutation.mutate({ id, updateData });
        }
    };

    const handleCannotComplete = (id) => {
        const reason = prompt("Nhập lý do không thể hoàn thành (nếu có):");
        // Nếu người dùng không hủy prompt
        if (reason !== null && window.confirm(`Xác nhận không thể hoàn thành báo hỏng ID ${id}? ${reason ? `\nLý do: ${reason}` : ''}`)) {
            const updateData = {
                trangThai: 'Không Thể Hoàn Thành',
                ghiChuXuLy: reason || null // Gửi lý do nếu có
            };
            updateTaskMutation.mutate({ id, updateData });
        }
    };

    // --- Mutation để cập nhật trạng thái ---
    const updateTaskMutation = useMutation({
        mutationFn: updateBaoHongAPI, // Dùng hàm API đã tạo
        onSuccess: () => {
            // Làm mới lại danh sách báo hỏng sau khi cập nhật thành công
            queryClient.invalidateQueries({ queryKey: ['assignedBaoHong'] });
            alert('Cập nhật trạng thái công việc thành công!');
        },
        onError: (error) => {
            console.error("Lỗi cập nhật trạng thái:", error);
            alert('Lỗi cập nhật: ' + (error.response?.data?.error || error.message));
        }
    });

    // Component nhỏ cho mức độ
    const SeverityBadge = ({ severity }) => {
        let colorClasses = 'bg-gray-100 text-gray-800';
        if (severity === 'Nặng') colorClasses = 'bg-red-100 text-red-800';
        else if (severity === 'Vừa') colorClasses = 'bg-yellow-100 text-yellow-800';
        else if (severity === 'Nhẹ') colorClasses = 'bg-green-100 text-green-800';
        return <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>{severity}</span>;
    };

    // --- Lọc và Sắp xếp dữ liệu phía Client ---
    const filteredItems = useMemo(() => {
        let items = baoHongItems;
        if (filterSeverity) items = items.filter(item => item.thiethai === filterSeverity);
        if (filterTerm) {
            const termLower = filterTerm.toLowerCase();
            items = items.filter(item =>
                item.phong_name?.toLowerCase().includes(termLower) ||
                item.moTa?.toLowerCase().includes(termLower) ||
                item.tenThietBi?.toLowerCase().includes(termLower) ||
                item.loaithiethai?.toLowerCase().includes(termLower)
            );
        }
        items.sort((a, b) => moment(b.ngayBaoHong).valueOf() - moment(a.ngayBaoHong).valueOf());
        return items;
    }, [baoHongItems, filterTerm, filterSeverity]);
    // ------------------------------------------

    // --- Tính toán Phân trang ---
    const totalPages = Math.ceil(filteredItems.length / TASKS_PER_PAGE);
    const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
    const endIndex = startIndex + TASKS_PER_PAGE;
    const paginatedItems = useMemo(() => filteredItems.slice(startIndex, endIndex), [filteredItems, startIndex, endIndex]);
    // --------------------------

    // --- Hàm xử lý chuyển trang ---
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            setExpandedCardId(null); // Đóng card đang mở khi chuyển trang
        }
    };
    // -----------------------------

    // Reset trang về 1 khi filter thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [filterTerm, filterSeverity]);

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-700">
                <FaTools className="mr-2 text-red-500" />
                Công Việc Báo Hỏng Được Giao
            </h3>
            {/* --- Khu vực Filter --- */}
            <div className="flex flex-col gap-3 p-3 border rounded-md sm:flex-row bg-gray-50">
                <div className="relative flex-grow">
                    <label htmlFor="bh-search" className="sr-only">Tìm kiếm</label>
                    <input
                        id="bh-search"
                        type="text"
                        placeholder="Tìm phòng, mô tả, loại..."
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <FaSearch className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                </div>
                <div className="relative min-w-[120px]">
                    <label htmlFor="bh-severity" className="sr-only">Mức độ</label>
                    <select
                        id="bh-severity"
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    >
                        <option value="">Tất cả mức độ</option>
                        <option value="Nhẹ">Nhẹ</option>
                        <option value="Vừa">Vừa</option>
                        <option value="Nặng">Nặng</option>
                    </select>
                    <FaFilter className="absolute text-gray-400 transform -translate-y-1/2 pointer-events-none right-3 top-1/2" />
                </div>
            </div>
            {/* --- Hết khu vực Filter --- */}

            {/* --- Danh sách Card (Đã phân trang) --- */}
            {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                    <div key={item.id} className="overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-lg shadow-sm">
                        {/* Card Header */}
                        <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                            <span className="text-sm font-semibold text-gray-800">
                                <FaMapMarkerAlt className="inline-block mr-1 text-gray-400" />
                                Phòng: {item.phong_name || 'N/A'}
                            </span>
                            <SeverityBadge severity={item.thiethai} />
                        </div>
                        {/* Card Body */}
                        <div className="p-3 space-y-2">
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Loại:</span> {item.loaithiethai}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Ngày báo:</span> {moment(item.ngayBaoHong).format('DD/MM/YYYY HH:mm')}
                            </p>
                            {/* Hiển thị chi tiết khi mở rộng */}
                            {expandedCardId === item.id && (
                                <div className="pt-2 mt-2 border-t border-gray-200">
                                    {item.tenThietBi && <p className="mb-1 text-sm text-gray-700"><strong>Thiết bị cụ thể:</strong> {item.tenThietBi}</p>}
                                    <p className="mb-2 text-sm text-gray-700"><strong>Mô tả:</strong> {item.moTa || 'Không có'}</p>
                                    {item.hinhAnh && (
                                        <div className="mt-1">
                                            <p className="mb-1 text-sm font-medium text-gray-700">Hình ảnh:</p>
                                            <button onClick={() => setModalImage(item.hinhAnh)} className="border rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500">
                                                <img src={item.hinhAnh} alt="Báo hỏng" className="object-contain max-h-40" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Card Footer - Actions */}
                        <div className="flex items-center justify-end p-3 space-x-3 border-t bg-gray-50">
                            <button onClick={() => toggleDetails(item.id)} className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500" title={expandedCardId === item.id ? "Ẩn chi tiết" : "Xem chi tiết"}>
                                <FaEye className="mr-1 -ml-0.5" />
                                {expandedCardId === item.id ? "Ẩn" : "Xem"}
                            </button>
                            {item.trangThai === 'Đã Duyệt' && (
                                <button
                                    onClick={() => handleStartWork(item.id)}
                                    className="p-1 text-yellow-600 rounded hover:text-yellow-800 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
                                    title="Bắt đầu xử lý"
                                    disabled={updateTaskMutation.isPending && updateTaskMutation.variables?.id === item.id}
                                >
                                    <FaWrench className="w-4 h-4" />
                                </button>
                            )}
                            {/* Nút Hoàn thành */}
                            {(item.trangThai === 'Đang Tiến Hành') && (
                                <button
                                    onClick={() => handleComplete(item.id)}
                                    // Logic disable mới
                                    disabled={
                                        !item.coLogBaoTri ||
                                        // Giả sử cần kiểm tra log cuối cùng hoặc trạng thái TTTB
                                        // (Cần fetch thêm dữ liệu log cuối hoặc trạng thái tttb nếu cần kiểm tra chặt chẽ ở đây)
                                        // Ví dụ đơn giản: chỉ cho hoàn thành nếu coLogBaoTri là true
                                        (!item.coLogBaoTri || (updateTaskMutation.isPending && updateTaskMutation.variables?.id === item.id))
                                    }
                                    className={`p-1 text-green-600 rounded hover:text-green-900 focus:outline-none focus:ring-1 focus:ring-green-500 ${(!item.coLogBaoTri) ? 'opacity-50 cursor-not-allowed' : 'disabled:opacity-50'
                                        }`}
                                    title={!item.coLogBaoTri ? "Cần ghi nhận hoạt động trước khi hoàn thành" : "Đánh dấu hoàn thành"}
                                >
                                    <FaCheckCircle className="w-4 h-4" />
                                </button>
                            )}
                            {/* Nút Không thể HT (hiển thị khi Đang xử lý hoặc Đã duyệt) */}
                            {/* {(item.trangThai === 'Đã Duyệt' || item.trangThai === 'Đang Tiến Hành') && ( // Giữ nguyên điều kiện hiển thị */}
                            <button
                                onClick={() => handleCannotComplete(item.id)}
                                className="p-1 text-red-600 rounded hover:text-red-900 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                                title="Báo cáo không thể hoàn thành"
                                disabled={updateTaskMutation.isPending && updateTaskMutation.variables?.id === item.id}>
                                <FaTimesCircle className="w-4 h-4" />
                            </button>
                            {/* )} */}
                        </div>
                        {/* Modal xem ảnh cho card này */}
                        <ImageModal imageUrl={modalImage} onClose={() => setModalImage(null)} />
                    </div>
                ))
            ) : (
                <p className="p-4 mt-4 italic text-center text-gray-500 rounded-lg bg-gray-50">Không tìm thấy công việc nào phù hợp.</p>
            )}
            {/* --- Hết danh sách Card --- */}

            {/* --- Điều khiển Phân trang --- */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 mt-4 bg-white border-t rounded-b-lg">
                    <span className="text-sm text-gray-700">
                        Trang <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span> (Tổng: {filteredItems.length})
                    </span>
                    <div className="inline-flex -space-x-px rounded-md shadow-sm">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50"
                        >
                            <FaChevronLeft className="w-4 h-4" />
                            <span className="sr-only">Trước</span>
                        </button>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50"
                        >
                            <span className="sr-only">Sau</span>
                            <FaChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
// --- Hết Component Danh sách Báo Hỏng Card ---

const LichNhanVien = () => {
    const { user } = useAuth();
    const [myEvents, setMyEvents] = useState([]);
    const [assignedRooms, setAssignedRooms] = useState([]);
    const [loadingSchedule, setLoadingSchedule] = useState(true);
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [error, setError] = useState(null);
    const [currentViewDate, setCurrentViewDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('schedule'); // State cho tab

    // --- React Query để fetch báo hỏng được giao ---
    const { data: assignedBaoHong = [], isLoading: loadingBaoHong, isError: errorBaoHong } = useQuery({
        queryKey: ['assignedBaoHong'],
        queryFn: fetchAssignedBaoHongAPI,
        enabled: !!user?.id,
        staleTime: 1 * 60 * 1000, // Dữ liệu cũ sau 1 phút
        refetchInterval: 5 * 60 * 1000, // Tự động fetch lại sau 5 phút
    });
    // ----------------------------------------------

    const currentUserEmployeeData = useMemo(() => {
        if (!user) return [];
        return [{ id: user.id, hoTen: user.hoTen || `Nhân viên ${user.id}` }];
    }, [user]);

    const fetchMySchedule = useCallback(async () => {
        // ... (giữ nguyên logic fetch lịch) ...
        if (!user?.id) return;
        setLoadingSchedule(true);
        setError(null);
        try {
            const response = await fetchMyScheduleInternal();
            const userEventsData = response.data;
            if (!Array.isArray(userEventsData)) throw new Error("Dữ liệu lịch nhận được không hợp lệ.");

            const formattedEvents = userEventsData.reduce((acc, row) => {
                const shiftTypeKey = mapDbValueToShiftTypeKey(row.caLamViec);
                if (!shiftTypeKey || !shiftTypesDefinitionForView[shiftTypeKey]) return acc;
                const start = parseISO(row.start_time);
                const end = parseISO(row.end_time);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) return acc;
                acc.push({
                    id: row.id, title: `${row.tenNhanVien || user.hoTen} - ${shiftTypesDefinitionForView[shiftTypeKey].title}`,
                    start, end, shiftType: shiftTypeKey, nhanvien_id: row.nhanvien_id,
                    employeeName: row.tenNhanVien || user.hoTen, notes: row.notes
                });
                return acc;
            }, []);
            setMyEvents(formattedEvents);
        } catch (err) {
            console.error("Lỗi tải lịch:", err.response?.data || err.message || err);
            setError("Không tải được lịch.");
            setMyEvents([]);
        } finally {
            setLoadingSchedule(false);
        }
    }, [user]);

    const fetchAssignedArea = useCallback(async () => {
        // ... (giữ nguyên logic fetch phòng) ...
        if (!user?.id) return;
        setLoadingRooms(true);
        try {
            const phongListData = await fetchAssignedRooms(user.id);
            setAssignedRooms(phongListData);
        } catch (err) {
            console.error("Lỗi tải khu vực:", err);
            setAssignedRooms([]);
        } finally {
            setLoadingRooms(false);
        }
    }, [user]);

    // --- useEffect ---
    useEffect(() => {
        if (user?.id) {
            fetchMySchedule();
            fetchAssignedArea();
        } else {
            setMyEvents([]); setAssignedRooms([]);
            setLoadingSchedule(false); setLoadingRooms(false);
            setError("Vui lòng đăng nhập.");
        }
    }, [user, fetchMySchedule, fetchAssignedArea]);

    const handleWeekChange = useCallback((newWeekStartDate) => {
        setCurrentViewDate(newWeekStartDate);
        // Có thể fetch lại lịch và báo hỏng nếu API hỗ trợ lọc theo tuần
        // fetchMySchedule(newWeekStartDate);
    }, []);

    // --- Tính toán Thống kê nhanh (Ví dụ) ---
    const scheduledHoursThisWeek = useMemo(() => {
        return myEvents.reduce((total, event) => {
            const durationHours = moment(event.end).diff(moment(event.start), 'hours');
            return total + durationHours;
        }, 0);
    }, [myEvents]);

    const pendingTasksCount = useMemo(() => {
        return assignedBaoHong.length;
    }, [assignedBaoHong]);
    // ---------------------------------------

    const isLoading = loadingSchedule || loadingRooms;

    // --- Loading / Error States ---
    if (isLoading) return <div className="p-4 text-center">Đang tải lịch và khu vực...</div>;
    if (error) return <div className="p-3 text-red-600 bg-red-100 border border-red-300 rounded">{error}</div>;


    return (
        <div className="min-h-screen md: bg-gray-50">
            {/* === Tab Buttons === */}
            <div className="overflow-hidden bg-white border-b border-gray-200">
                <nav className="flex pl-4 -mb-px space-x-4" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'schedule'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Lịch Trực & Phân Khu
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'tasks'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Công Việc Được Giao ({loadingBaoHong ? '...' : pendingTasksCount}) {/* Hiển thị số lượng task */}
                    </button>
                </nav>
            </div>
            {/* === Hết Tab Buttons === */}

            {/* === Nội dung Tab 1: Lịch Trực & Thông Tin === */}
            <div className={`${activeTab === 'schedule' ? 'block' : 'hidden'} p-4 space-y-4`}>

                {/* Grid phụ cho Khu vực và Tiện ích */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Khu vực phụ trách */}
                    <div className="p-4 bg-white rounded-lg shadow">
                        <h3 className="flex items-center mb-3 text-base font-semibold text-gray-700"> {/* Giảm size chữ */}
                            <FaMapMarkerAlt className="mr-2 text-blue-500" />
                            Khu Vực Phụ Trách
                        </h3>
                        {/* ... nội dung khu vực ... */}
                        {Array.isArray(assignedRooms) && assignedRooms.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {assignedRooms.map(room => (
                                    <span key={room.id} className="px-3 py-1 text-xs text-indigo-800 bg-indigo-100 rounded-full">{room.phong}</span>
                                ))}
                            </div>
                        ) : (<p className="text-sm italic text-gray-500">{loadingRooms ? 'Đang tải...' : 'Chưa phân công.'}</p>)}
                    </div>

                    {/* Tiện ích Nhanh & Thống kê */}
                    <div className="p-4 bg-white rounded-lg shadow">
                        <h3 className="flex items-center mb-3 text-base font-semibold text-gray-700"> {/* Giảm size chữ */}
                            <FaUserClock className="mr-2 text-purple-500" />
                            Tiện Ích & Thống Kê
                        </h3>
                        <div className="space-y-3">
                            {/* Nút Chấm công (Giao diện mẫu) */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Chấm công ca hiện tại:</span>
                                <button className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:bg-gray-400" disabled>Check-in</button>
                                {/* <button className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500">Check-out</button> */}
                            </div>
                            {/* Thống kê giờ làm */}
                            <div className="flex items-center justify-between pt-2 text-sm text-gray-600 border-t">
                                <span>Tổng giờ trực tháng này (dự kiến):</span>
                                <span className="font-semibold">{scheduledHoursThisWeek} giờ</span>
                            </div>
                            {/* Thống kê giờ công */}
                            <div className="flex items-center justify-between pt-2 text-sm text-gray-600 border-t">
                                <span>Tổng giờ công đã chấm:</span>
                                <span className="font-semibold">{scheduledHoursThisWeek} giờ</span>
                            </div>
                            {/* Số task đang chờ */}
                            <div className="flex items-center justify-between pt-2 text-sm text-gray-600 border-t">
                                <span>Số công việc đang chờ xử lý:</span>
                                <span className="font-semibold">{pendingTasksCount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header & Legend */}
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="mb-3 text-lg font-semibold text-gray-700">Thông tin ca trực</h3>
                    <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2">
                        <span className="text-sm font-medium text-gray-700">Chú giải:</span>
                        {Object.entries(shiftTypesDefinitionForView).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-1.5">
                                <div className={`w-3 h-3 rounded-sm ${value.legendColor}`}></div>
                                <span className="text-xs text-gray-600">{value.title} ({value.startHour}:00-{value.endHour}:00)</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lịch theo tuần */}
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="flex items-center mb-4 text-lg font-semibold text-gray-700">
                        <FaCalendarAlt className="mr-2 text-green-500" />
                        Lịch Trực
                    </h3>
                    <LichTheoTuan
                        employees={currentUserEmployeeData}
                        events={myEvents}
                        initialDate={currentViewDate}
                        onWeekChange={handleWeekChange}
                        shiftTypeDefinitions={shiftTypesDefinitionForView}
                        isEditMode={false}
                    />
                </div>

            </div>
            {/* === Hết Nội dung Tab 1 === */}

            {/* === Nội dung Tab 2: Công Việc Báo Hỏng === */}
            <div className={`${activeTab === 'tasks' ? 'block' : 'hidden'} p-4`}>
                <DanhSachBaoHongNhanVien
                    baoHongItems={assignedBaoHong}
                    isLoading={loadingBaoHong}
                    isError={errorBaoHong}
                />
            </div>
            {/* === Hết Nội dung Tab 2 === */}


        </div>
    );
};

export default LichNhanVien;