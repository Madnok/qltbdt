import React, { useState, useMemo, useEffect } from 'react';
import {
    format, startOfWeek, addDays, isSameDay, startOfDay,
    addWeeks, subWeeks, parseISO, isBefore
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight, FiPlusCircle, FiTrash2, FiEdit } from 'react-icons/fi';


function LichTheoTuan({
    employees = [],
    events = [],
    initialDate = new Date(),
    onAddShift,
    onEditShift,
    onDeleteShift,
    onWeekChange,
    selectedShiftIds,
    shiftTypeDefinitions,
    onShiftSelectToggle,
    isEditMode
}) {
    const [currentWeekStart, setCurrentWeekStart] = useState(
        startOfWeek(initialDate, { locale: vi, weekStartsOn: 1 })
    );

    // Đồng bộ với initialDate từ component cha nếu nó thay đổi
    useEffect(() => {
        const newWeekStart = startOfWeek(initialDate, { locale: vi, weekStartsOn: 1 });
        if (format(newWeekStart, 'yyyy-MM-dd') !== format(currentWeekStart, 'yyyy-MM-dd')) {
            setCurrentWeekStart(newWeekStart);
        }
    }, [initialDate, currentWeekStart]);

    const weekDates = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
    }, [currentWeekStart]);

    // Hàm lọc ca: Kiểm tra kiểu dữ liệu và tính hợp lệ của Date
    const getShiftsForEmployeeOnDay = (employeeId, date) => {
        const dayStart = startOfDay(date);
        return events.filter(event => {
            const eventStart = event?.start;
            const eventStartDate = typeof eventStart === 'string' ? parseISO(eventStart) : eventStart;
            // Thêm kiểm tra eventStartDate là Date hợp lệ
            return event.nhanvien_id === employeeId && eventStartDate instanceof Date && !isNaN(eventStartDate.getTime()) && isSameDay(eventStartDate, dayStart);
        });
    };

    // Hàm render ô: Tích hợp isEditMode, xử lý Date an toàn
    const renderShiftCell = (employeeId, date) => {
        const shifts = getShiftsForEmployeeOnDay(employeeId, date);
        const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
        const canInteract = isEditMode && !isPast;

        if (shifts.length === 0) {
            return (
                <button
                    onClick={() => canInteract && onAddShift?.(employeeId, date)}
                    className={`flex items-center justify-center w-full h-full text-gray-400 transition-colors rounded ${!canInteract ? 'cursor-not-allowed opacity-50' : 'hover:text-blue-500 hover:bg-blue-50'}`}
                    title={!canInteract ? (isPast ? "Ngày đã qua" : "Bật chế độ Chỉnh sửa") : `Thêm ca ngày ${format(date, 'dd/MM')}`}
                    disabled={!canInteract}
                >
                    <FiPlusCircle className="w-4 h-4" />
                </button>
            );
        }

        // 2. Có ca
        return (
            <div className="flex flex-col items-stretch justify-center h-full p-1 space-y-1"> {/* items-stretch để thẻ ca chiếm hết chiều rộng */}
                {shifts.map(shift => {
                    const shiftDetail = shiftTypeDefinitions?.[shift.shiftType];
                    const isSelected = selectedShiftIds?.has(shift.id);

                    // Lấy class màu nền và màu chữ
                    const bgColor = shiftDetail?.legendColor;
                    const textColor = shiftDetail?.textClass || 'text-gray-800';
                    const titleText = shiftDetail?.title || shift.shiftType || 'N/A';

                    // Format title cho nút sửa/xóa (vẫn cần thời gian)
                    const start = shift?.start ? (typeof shift.start === 'string' ? parseISO(shift.start) : shift.start) : null;
                    const end = shift?.end ? (typeof shift.end === 'string' ? parseISO(shift.end) : shift.end) : null;
                    const startTimeFormatted = start instanceof Date && !isNaN(start) ? format(start, 'HH:mm') : '--:--';
                    const endTimeFormatted = end instanceof Date && !isNaN(end) ? format(end, 'HH:mm') : '--:--';
                    const editDeleteTitle = `Ca ${titleText} (${startTimeFormatted} - ${endTimeFormatted})`;

                    return (
                        <div
                            key={shift.id}
                            className={`
                                relative group flex items-center justify-between w-full px-2 py-1.5 rounded text-xs font-semibold
                                ${isPast ? 'opacity-70' : ''}
                                ${bgColor} ${textColor} /* Áp dụng màu nền và chữ */
                                ${isSelected && canInteract ? 'ring-2 ring-offset-1 ring-red-500' : ''}
                                ${canInteract ? 'cursor-pointer' : 'cursor-default'}
                            `}
                            title={!canInteract ? titleText : `Click nút để sửa/xóa. Check để chọn xóa nhiều.`} // Cập nhật title
                        >
                            {/* Phần trái: Checkbox */}
                            {canInteract && onShiftSelectToggle && (
                                <input
                                    type="checkbox"
                                    className="w-3.5 h-3.5 mr-2 text-red-600 border-gray-400 rounded focus:ring-red-500 cursor-pointer flex-shrink-0" // Tăng mr
                                    checked={!!isSelected}
                                    onChange={() => onShiftSelectToggle(shift.id)}
                                    title="Chọn/Bỏ chọn"
                                />
                            )}

                            {/* Phần giữa: Tên ca (căn giữa) */}
                            <span
                                className="flex-grow text-center truncate" // text-center, truncate nếu quá dài
                                title={titleText} // Thêm title cho span nếu bị truncate
                            >
                                {titleText}
                            </span>

                            {/* Phần phải: Nút chức năng */}
                            {canInteract && (
                                <div className="flex items-center flex-shrink-0 pl-1 space-x-1 opacity-0 group-hover:opacity-100"> {/* Thêm pl-1, giữ space-x-1 */}
                                    {onEditShift && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditShift(shift); }}
                                            // Đổi màu nút cho phù hợp nền
                                            className={`p-0.5 rounded hover:bg-black hover:bg-opacity-10 ${textColor}`}
                                            title={`Sửa ${editDeleteTitle}`}
                                        >
                                            <FiEdit className="w-3.5 h-3.5" /> {/* Tăng nhẹ size icon */}
                                        </button>
                                    )}
                                    {onDeleteShift && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); if (window.confirm(`Xóa ${editDeleteTitle}?`)) { onDeleteShift(shift); } }}
                                            // Đổi màu nút cho phù hợp nền
                                            className={`p-0.5 rounded hover:bg-black hover:bg-opacity-10 ${textColor}`} // Giống nút sửa
                                            title={`Xóa ${editDeleteTitle}`}
                                        >
                                            <FiTrash2 className="w-3.5 h-3.5" /> {/* Tăng nhẹ size icon */}
                                        </button>
                                    )}
                                </div>
                            )}
                            {/* Nếu không tương tác, tạo khoảng trống ảo để giữ layout */}
                            {!canInteract && <div className="flex-shrink-0 w-8"></div>}

                        </div>
                    );
                })}
                {/* Nút thêm ca thứ 2 */}
                {shifts.length === 1 && canInteract && (
                    <button onClick={(e) => { e.stopPropagation(); onAddShift?.(employeeId, date); }} className="mt-1 text-blue-500 hover:text-blue-700" title={`Thêm ca thứ hai ngày ${format(date, 'dd/MM')}`}>
                        <FiPlusCircle className="w-3 h-3" />
                    </button>
                )}
            </div>
        );
    };

    const handlePrevWeek = () => {
        const newWeekStart = subWeeks(currentWeekStart, 1);
        setCurrentWeekStart(newWeekStart);
        onWeekChange && onWeekChange(newWeekStart);
    };

    const handleNextWeek = () => {
        const newWeekStart = addWeeks(currentWeekStart, 1);
        setCurrentWeekStart(newWeekStart);
        onWeekChange && onWeekChange(newWeekStart);
    };

    const handleGoToCurrentWeek = () => {
        const todayWeekStart = startOfWeek(new Date(), { locale: vi, weekStartsOn: 1 });
        // Chỉ gọi khi tuần hiện tại khác tuần đang xem
        if (format(todayWeekStart, 'yyyy-MM-dd') !== format(currentWeekStart, 'yyyy-MM-dd')) {
            setCurrentWeekStart(todayWeekStart);
            onWeekChange && onWeekChange(todayWeekStart);
        }
    };

    return (
        <div className="p-4 bg-white rounded">
            {/* Navigation Tuần */}
            <div className="flex flex-col items-center justify-between gap-2 mb-4 sm:flex-row">
                <h2 className="text-xl font-semibold text-gray-800">
                    Tuần ({format(currentWeekStart, 'dd/MM')} - {format(addDays(currentWeekStart, 6), 'dd/MM/yyyy')})
                </h2>
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevWeek} className="p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500">
                        <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleGoToCurrentWeek}
                        className="px-3 py-1 text-sm text-indigo-700 bg-indigo-100 rounded hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                    >
                        Tuần Hiện Tại
                    </button>
                    <button onClick={handleNextWeek} className="p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500">
                        <FiChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Bảng Lịch Trình */}
            <div className="max-h-[calc(100vh-Xpx)] overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full border-collapse divide-y divide-gray-200">
                    <thead className="sticky top-0 z-30 bg-gray-100"> {/* Tăng z-index */}
                        <tr>
                            <th className="sticky left-0 z-40 px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase bg-gray-100 min-w-[180px] border-r border-gray-200">
                                Nhân Viên
                            </th>
                            {weekDates.map((date, index) => (
                                <th key={date.toISOString()} className={`px-3 py-3 text-xs font-semibold tracking-wider text-center text-gray-600 uppercase min-w-[110px] ${index < 6 ? 'border-r border-gray-200' : ''}`}>
                                    {format(date, 'EEEE', { locale: vi })}
                                    <span className="block text-sm font-normal text-gray-500">{format(date, 'dd/MM')}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="overflow-y-auto bg-white divide-y divide-gray-200" style={{ maxHeight: 'calc(100vh - Ypx)' }}>
                        {employees.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                                    Không có dữ liệu nhân viên hoặc lịch trình để hiển thị.
                                </td>
                            </tr>
                        ) : (
                            employees.map(employee => (
                                <tr key={employee.id} className="group hover:bg-gray-50">
                                    <td className="sticky left-0 z-10 px-4 py-2 text-sm font-medium text-gray-800 bg-white whitespace-nowrap min-w-[180px] border-r border-gray-200 group-hover:bg-gray-50">
                                        {employee.hoTen}
                                    </td>
                                    {weekDates.map((date, index) => (
                                        <td
                                            key={date.toISOString()}
                                            className={`h-16 px-1 py-1 text-sm text-center align-middle border-gray-200 min-w-[110px] ${index < 6 ? 'border-r' : ''}`} // align-middle
                                        >
                                            {renderShiftCell(employee.id, date)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default LichTheoTuan;