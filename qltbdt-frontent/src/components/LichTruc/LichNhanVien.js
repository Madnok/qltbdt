import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthProvider'; // Điều chỉnh đường dẫn nếu cần
import LichTheoTuan from './LichTheoTuan'; // Component hiển thị lịch
import { parseISO } from 'date-fns';
// Import hàm API từ file service của bạn
import { fetchAssignedRooms, fetchMyScheduleInternal } from '../../api'; // Giả sử hàm lấy lịch cũng ở đây

// --- Định nghĩa màu sắc và map ca làm việc (giữ nguyên) ---
const shiftTypesDefinitionForView = {
    morning: { title: "Sáng", legendColor: 'bg-blue-200', bgClass: 'bg-blue-100', textClass: 'text-blue-600', startHour: 8, endHour:15 },
    evening: { title: "Chiều", legendColor: 'bg-orange-200', bgClass: 'bg-orange-100', textClass: 'text-orange-600', startHour: 15, endHour:22 },
};
const mapDbValueToShiftTypeKey = (dbValue) => {
    if (dbValue === 'Ca Sáng') return 'morning';
    if (dbValue === 'Ca Chiều') return 'evening';
    return null;
};
// --- Hết phần định nghĩa ---

const LichNhanVien = () => {
    const { user } = useAuth();
    const [myEvents, setMyEvents] = useState([]);
    const [assignedRooms, setAssignedRooms] = useState([]); // <-- State mới cho phòng phụ trách
    const [loadingSchedule, setLoadingSchedule] = useState(true);
    const [loadingRooms, setLoadingRooms] = useState(true); // <-- State loading cho phòng
    const [error, setError] = useState(null);
    const [currentViewDate, setCurrentViewDate] = useState(new Date());

    // Dữ liệu nhân viên (giữ nguyên)
    const currentUserEmployeeData = useMemo(() => {
        if (!user) return [];
        return [{ id: user.id, hoTen: user.hoTen || `Nhân viên ${user.id}` }];
    }, [user]);

    // Hàm fetch lịch của cá nhân (Nên dùng API riêng /my-schedule)
    const fetchMySchedule = useCallback(async () => {
        if (!user?.id) return; // Chỉ chạy khi có user.id
        setLoadingSchedule(true);
        setError(null);
        try {
            // Gọi API mới từ file api.js (thay thế fetch cũ)
            const response = await fetchMyScheduleInternal(); // Giả sử hàm này gọi GET /api/lichtruc/my-schedule
            const userEventsData = response.data;

            if (!Array.isArray(userEventsData)) {
                 console.error("API my-schedule không trả về mảng:", userEventsData);
                 throw new Error("Dữ liệu lịch nhận được không hợp lệ.");
            }

            // Chuyển đổi dữ liệu (giữ nguyên logic này)
             const formattedEvents = userEventsData.reduce((acc, row) => {
                const shiftTypeKey = mapDbValueToShiftTypeKey(row.caLamViec);
                if (!shiftTypeKey || !shiftTypesDefinitionForView[shiftTypeKey]) return acc;

                const start = parseISO(row.start_time);
                const end = parseISO(row.end_time);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                     console.error("Invalid date format for my schedule:", row); return acc;
                }
                acc.push({
                     id: row.id,
                     title: `${row.tenNhanVien || user.hoTen} - ${shiftTypesDefinitionForView[shiftTypeKey].title}`,
                     start, end, shiftType: shiftTypeKey,
                     nhanvien_id: row.nhanvien_id,
                     employeeName: row.tenNhanVien || user.hoTen,
                     notes: row.notes
                 });
                return acc;
            }, []);
            setMyEvents(formattedEvents);

        } catch (err) {
            console.error("Lỗi khi tải lịch cá nhân:", err.response?.data || err.message || err);
            setError("Không thể tải được lịch làm việc của bạn.");
            setMyEvents([]);
        } finally {
            setLoadingSchedule(false);
        }
    }, [user]);

     // Hàm fetch khu vực được phân công
     const fetchAssignedArea = useCallback(async () => {
        if (!user?.id) return; // Chỉ chạy khi có user.id
        setLoadingRooms(true);
        // Không cần setError ở đây nếu lỗi không quá nghiêm trọng
        try {
            // Gọi API mới từ file api.js
            const response = await fetchAssignedRooms(user.id);
            if (Array.isArray(response.data)) {
                setAssignedRooms(response.data); // Lưu danh sách phòng {id, phong}
            } else {
                 console.error("API phòng được gán không trả về mảng:", response.data);
                 setAssignedRooms([]);
            }
        } catch (err) {
             console.error("Lỗi khi tải khu vực được phân công:", err.response?.data || err.message || err);
             setAssignedRooms([]); // Đặt về rỗng nếu lỗi
        } finally {
             setLoadingRooms(false);
        }
     }, [user]); // Fetch lại khi user thay đổi

    // Gọi cả hai hàm fetch khi user thay đổi
    useEffect(() => {
        if (user?.id) {
            fetchMySchedule();
            fetchAssignedArea();
        } else {
            // Reset state nếu không có user
            setMyEvents([]);
            setAssignedRooms([]);
            setLoadingSchedule(false);
            setLoadingRooms(false);
            setError("Vui lòng đăng nhập để xem lịch và khu vực phụ trách.");
        }
    }, [user, fetchMySchedule, fetchAssignedArea]); // Thêm fetchAssignedArea vào dependency

    // Hàm xử lý khi bảng con đổi tuần (giữ nguyên)
    const handleWeekChange = useCallback((newWeekStartDate) => {
        setCurrentViewDate(newWeekStartDate);
        // fetchMySchedule(); // Chỉ gọi lại nếu API /my-schedule hỗ trợ lọc theo tuần
    }, []);

    // Tổng hợp trạng thái loading
    const isLoading = loadingSchedule || loadingRooms;

    if (isLoading) return <div className="p-4 text-center">Đang tải dữ liệu...</div>;
    // Hiển thị lỗi nếu có lỗi nghiêm trọng khi tải lịch
    if (error && myEvents.length === 0) return <div className="p-3 text-red-600 bg-red-100 border border-red-300 rounded">{error}</div>;

    return (
        // Sử dụng Fragment <>...</> để bọc các phần tử
        <>
             {/* === KHU VỰC HIỂN THỊ PHÒNG PHỤ TRÁCH === */}
             <div className="p-4 mb-4 bg-gray-100 border rounded-md shadow-sm">
                 <h3 className="mb-2 text-lg font-semibold text-gray-800">Khu Vực Phụ Trách Cố Định</h3>
                 {/* Kiểm tra xem state assignedRooms có phải là mảng và có phần tử không */}
                 {Array.isArray(assignedRooms) && assignedRooms.length > 0 ? (
                     <ul className="flex flex-wrap gap-2">
                         {/* Lặp qua mảng assignedRooms */}
                         {assignedRooms.map(room => (
                             // Mỗi phòng là một thẻ li với key là room.id
                             <li key={room.id} className="px-3 py-1 text-sm text-indigo-800 bg-indigo-100 rounded-full">
                                 {/* Hiển thị tên phòng từ thuộc tính room.phong */}
                                 {room.phong}
                             </li>
                         ))}
                     </ul>
                 ) : (
                      // Hiển thị khi mảng rỗng hoặc đang tải
                     <p className="text-sm text-gray-600">
                         {loadingRooms ? 'Đang tải...' : 'Bạn chưa được phân công phòng phụ trách cố định.'}
                     </p>
                 )}
             </div>
            {/* === Hết phần hiển thị phòng phụ trách === */}


             {/* Chú giải ca làm việc (giữ nguyên) */}
            <div className="flex items-center justify-center p-2 space-x-2 bg-gray-100">
                <span className="text-sm font-medium text-gray-700">Chú giải:</span>
                {Object.entries(shiftTypesDefinitionForView)
                    /* ... (mapping chú giải giữ nguyên) ... */
                     .map(([key, value]) => (
                         <div key={key} className="flex items-center space-x-1.5">
                             <div className={`w-3.5 h-3.5 rounded-sm ${value.legendColor}`}></div>
                             <span className="text-sm text-gray-800">
                                 {value.title}: {value.startHour}:00 - {value.endHour}:00
                             </span>
                         </div>
                     ))
                }
            </div>

             {/* Lịch theo tuần (giữ nguyên) */}
            <LichTheoTuan
                employees={currentUserEmployeeData}
                events={myEvents}
                initialDate={currentViewDate}
                onWeekChange={handleWeekChange}
                shiftTypeDefinitions={shiftTypesDefinitionForView}
                isEditMode={false} // Luôn là View Mode
                // Các props khác = null hoặc không truyền
            />
        </>
    );
};

export default LichNhanVien;