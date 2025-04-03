
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthProvider'; // Điều chỉnh đường dẫn nếu cần
import LichTheoTuan from './LichTheoTuan';
import { parseISO} from 'date-fns';

// Định nghĩa màu sắc (có thể import từ file dùng chung)
const shiftTypesDefinitionForView = {
    morning: { title: "Sáng", legendColor: 'bg-blue-200', bgClass: 'bg-blue-100', textClass: 'text-blue-600', startHour: 8, endHour:15 },
    evening: { title: "Chiều", legendColor: 'bg-orange-200', bgClass: 'bg-orange-100', textClass: 'text-orange-600', startHour: 15, endHour:22 },
};
const mapDbValueToShiftTypeKey = (dbValue) => {
    if (dbValue === 'Ca Sáng') return 'morning';
    if (dbValue === 'Ca Chiều') return 'evening';
    return null;
};

const LichNhanVien = () => {
    const { user } = useAuth();
    const [myEvents, setMyEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentViewDate, setCurrentViewDate] = useState(new Date()); // State cho tuần đang xem

    // Dữ liệu nhân viên chỉ là người dùng hiện tại
    const currentUserEmployeeData = useMemo(() => {
        if (!user) return [];
        return [{ id: user.id, hoTen: user.hoTen || `Nhân viên ${user.id}` }]; // Lấy hoTen từ user context
    }, [user]);

    // Hàm fetch lịch của cá nhân
    const fetchMySchedule = useCallback(async () => {
        if (!user?.id) {
            setError("Không tìm thấy thông tin nhân viên để tải lịch.");
            setLoading(false);
            return; // Không fetch nếu không có user id
        }
        setLoading(true);
        setError(null);
        try {
            // === CÁCH 1: Gọi API Lấy Lịch Của Tôi (Khuyến nghị) ===
            // Backend cần tạo API này, ví dụ: GET /api/lichtruc/my-schedule
            // API này sẽ tự lấy user ID từ session/token và trả về lịch của họ
            // const response = await fetch(`http://localhost:5000/api/lichtruc/my-schedule`);

            // === CÁCH 2: Gọi API Lấy Tất Cả và Lọc ở Frontend (Tạm thời) ===
            console.log("Fetching all schedules and filtering for user:", user.id);
            const response = await fetch(`http://localhost:5000/api/lichtruc`); // Lấy tất cả

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allEventsData = await response.json();

            // Lọc những lịch thuộc về user hiện tại
            const userEventsData = allEventsData.filter(event => event.nhanvien_id === user.id);
            console.log("Filtered events:", userEventsData);


            // Chuyển đổi dữ liệu (tương tự PhanCa)
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
            console.error("Lỗi khi tải lịch cá nhân:", err);
            setError("Không thể tải được lịch làm việc của bạn.");
            setMyEvents([]); // Xóa lịch cũ nếu lỗi
        } finally {
            setLoading(false);
        }
        // Thêm dependency nếu bạn muốn fetch lại khi tuần thay đổi (currentViewDate)
        // Hoặc nếu dùng API lọc theo tuần thì thêm dependency tương ứng
    }, [user]); // Fetch lại khi user thay đổi

    useEffect(() => {
        fetchMySchedule();
    }, [fetchMySchedule]);

    // Hàm xử lý khi bảng con đổi tuần (nếu cần fetch lại)
    const handleWeekChange = useCallback((newWeekStartDate) => {
        setCurrentViewDate(newWeekStartDate);
        // Nếu API backend hỗ trợ lọc theo tuần, gọi fetchMySchedule() ở đây
        // fetchMySchedule();
    }, []);


    if (loading) return <div className="text-center">Đang tải lịch làm việc...</div>;
    if (error) return <div className="p-3 text-red-600 bg-red-100 border border-red-300 rounded">{error}</div>;

    return (
        <>
            <div className="flex items-center justify-center p-2 space-x-2 bg-gray-100"> {/* Container cho các mục chú giải */}
                <span className="text-sm font-medium text-gray-700">Chú giải:</span>
                {Object.entries(shiftTypesDefinitionForView)
                    .filter(([key]) => key !== 'fullDayCombined') // Lọc bỏ key ảo
                    .map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-1.5">
                            <div className={`w-3.5 h-3.5 rounded-sm ${value.legendColor}`}></div> {/* Ô màu */}
                            <span className="text-sm text-gray-800">
                                {value.title}: {value.startHour}:00 - {value.endHour}:00
                            </span>
                        </div>
                    ))
                }
            </div>
            <LichTheoTuan
                employees={currentUserEmployeeData} // Chỉ truyền thông tin user hiện tại
                events={myEvents} // Truyền lịch đã lọc
                initialDate={currentViewDate}
                onWeekChange={handleWeekChange} // Cho phép bảng đổi tuần
                shiftTypeDefinitions={shiftTypesDefinitionForView} // Truyền định nghĩa màu sắc/ca
                // Vô hiệu hóa các chức năng chỉnh sửa cho nhân viên
                isEditMode={false} // Luôn là View Mode
                onAddShift={null}
                onEditShift={null}
                onDeleteShift={null}
                selectedShiftIds={null}
                onShiftSelectToggle={null}
            />
        </>
    );
};

export default LichNhanVien;