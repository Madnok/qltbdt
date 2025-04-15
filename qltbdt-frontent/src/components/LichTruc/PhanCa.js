import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    setHours, setMinutes,
    isAfter, addDays, isBefore, startOfDay, parseISO,
    format, // Thêm format
    startOfWeek, // Thêm startOfWeek
    isSameDay,
    isEqual
} from "date-fns";
import { vi } from 'date-fns/locale'; // Thêm vi locale
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import LichTheoTuan from "./LichTheoTuan"; // Đổi tên component nếu cần
import { FiTrash2, FiEdit, FiSave, FiXCircle } from 'react-icons/fi';

// --- Định nghĩa loại ca ---
const shiftTypesDefinition = {
    morning: { title: "Sáng", dbValue: "Ca Sáng", startHour: 8, endHour: 15, legendColor: 'bg-blue-200' },
    evening: { title: "Chiều", dbValue: "Ca Chiều", startHour: 15, endHour: 22, legendColor: 'bg-orange-200' },
    fullDayCombined: { title: "Cả Ngày" }
};

// Mapping ngược từ giá trị DB sang key của frontend
const mapDbValueToShiftTypeKey = (dbValue) => {
    if (dbValue === 'Ca Sáng') return 'morning';
    if (dbValue === 'Ca Chiều') return 'evening';
    return null;
};


const PhanCa = () => {
    const [originalEvents, setOriginalEvents] = useState([]);
    const [events, setEvents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    // eslint-disable-next-line
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [shiftForm, setShiftForm] = useState({
        employeeName: "", nhanvien_id: null, shiftType: "morning",
        startTime: "", endTime: "", notes: "", existingEventId: null
    });
    const [error, setError] = useState("");
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true); // State quản lý trạng thái loading
    const [apiError, setApiError] = useState(null); // State quản lý lỗi API
    const [selectedShiftIds, setSelectedShiftIds] = useState(new Set()); // Dùng Set để quản lý ID hiệu quả
    const [currentViewDate, setCurrentViewDate] = useState(new Date()); // Ngày đại diện cho tuần đang xem
    const [selectedDatesInModal, setSelectedDatesInModal] = useState([]); // Mảng các Date được chọn trong modal
    const [isEditMode, setIsEditMode] = useState(false); // Mặc định là View Mode

    // --- useEffect để fetch dữ liệu lịch trực ---
    const fetchLichTruc = useCallback(async () => { // Thêm useCallback
        setLoading(true);
        setApiError(null);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/lichtruc`, {
                credentials: 'include'
            }); // Thay đổi URL nếu cần
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            const formattedEvents = data.reduce((acc, row) => {
                const shiftTypeKey = mapDbValueToShiftTypeKey(row.caLamViec); // Chỉ map Sáng/Chiều
                if (!shiftTypeKey) return acc;

                const start = parseISO(row.start_time);
                const end = parseISO(row.end_time);
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    console.error("Invalid date format:", row); return acc;
                }

                acc.push({
                    id: row.id, // Dùng ID từ DB làm ID chính
                    title: `${row.tenNhanVien} - ${shiftTypesDefinition[shiftTypeKey].title}`,
                    start, end, shiftType: shiftTypeKey,
                    nhanvien_id: row.nhanvien_id,
                    employeeName: row.tenNhanVien,
                    notes: row.notes
                });
                return acc;
            }, []);

            setEvents(formattedEvents);
            setOriginalEvents(formattedEvents); // <-- Lưu trạng thái gốc
            setIsEditMode(false); // Luôn quay về View Mode sau khi fetch
            setSelectedShiftIds(new Set()); // Reset selection

        } catch (error) {
            console.error("Lỗi khi fetch lịch trực:", error);
            setApiError("Không thể tải dữ liệu lịch trực.");
        } finally {
            setLoading(false);
        }
    }, []); // Có thể thêm dependency currentViewDate nếu API hỗ trợ fetch theo tuần

    // useEffect fetch employees (không đổi)
    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/api/lichtruc/nhanvien`, { credentials: 'include' })
            .then((response) => response.json())
            .then((data) => {
                setEmployees(data);
            })
            .catch((error) => console.error("Lỗi khi gọi API nhân viên:", error));
        fetchLichTruc(); // Gọi hàm fetch lịch
    }, [fetchLichTruc]);

    // --- TÍNH TOÁN TUẦN HIỆN TẠI CHO VIEW VÀ MODAL ---
    const currentWeekStartForView = useMemo(() =>
        startOfWeek(currentViewDate, { locale: vi, weekStartsOn: 1 }),
        [currentViewDate]);

    const weekDatesForView = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStartForView, i));
    }, [currentWeekStartForView]);

    // === CÁC HÀM CALLBACK CHO TABLE VIEW (Cập nhật handleAdd) ===
    const handleAddShiftFromTable = useCallback((employeeId, date) => {
        if (!isEditMode) return; // Chỉ hoạt động ở Edit Mode
        const employee = employees.find(emp => emp.id === employeeId);
        if (!employee) return;

        const today = startOfDay(new Date());
        if (isBefore(startOfDay(date), today)) {
            alert("Không thể thêm lịch vào ngày đã qua.");
            return;
        }

        setSelectedSlot({ start: date, end: addDays(date, 1) });
        setShiftForm({
            employeeName: employee.hoTen,
            nhanvien_id: employee.id,
            shiftType: "morning",
            startTime: date,
            endTime: addDays(date, 1),
            notes: "",
            existingEventId: null // Đảm bảo là thêm mới
        });
        setSelectedDatesInModal([date]); // <-- KHỞI TẠO NGÀY ĐƯỢC CHỌN
        setError("");
        setShowModal(true);
    }, [isEditMode, employees]); // Thêm dependencies

    const handleEditShiftFromTable = useCallback((shiftEvent) => {
        if (!isEditMode) return;
        const today = startOfDay(new Date());
        const eventStartDate = typeof shiftEvent.start === 'string' ? parseISO(shiftEvent.start) : shiftEvent.start;
        if (isBefore(startOfDay(eventStartDate), today)) {
            alert("Không thể sửa lịch của ngày đã qua.");
            return;
        }
        setSelectedSlot({ start: typeof shiftEvent.start === 'string' ? parseISO(shiftEvent.start) : shiftEvent.start, end: typeof shiftEvent.end === 'string' ? parseISO(shiftEvent.end) : shiftEvent.end });
        // setSelectedSlot({ start: eventStartDate, end: typeof shiftEvent.end === 'string' ? parseISO(shiftEvent.end) : shiftEvent.end });
        setShiftForm({
            employeeName: shiftEvent.employeeName,
            nhanvien_id: shiftEvent.nhanvien_id,
            shiftType: shiftEvent.shiftType, // Giữ shift type gốc (morning/evening)
            startTime: shiftEvent.start,
            endTime: shiftEvent.end,
            notes: shiftEvent.notes || "",
            existingEventId: shiftEvent.id
        });
        setSelectedDatesInModal([typeof shiftEvent.start === 'string' ? parseISO(shiftEvent.start) : shiftEvent.start]);
        setError("");
        setShowModal(true);
    }, [isEditMode]);

    const handleDeleteShift = useCallback((shiftEvent) => {
        if (!isEditMode) return;
        const today = startOfDay(new Date());
        // ... kiểm tra ngày quá khứ ...
        if (isBefore(startOfDay(shiftEvent.start), today)) {
            alert("Không thể xóa lịch của ngày đã qua.");
            return;
        }

        // ID cần xóa (ưu tiên ID gốc từ DB nếu có)
        const idToDelete = shiftEvent.dbId || shiftEvent.id;
        if (!idToDelete || String(idToDelete).startsWith('db-')) { // Nếu là ID composite từ 'Cả Ngày' thì xử lý đặc biệt hoặc dùng dbId
            console.error("Không xác định được ID database để xóa:", shiftEvent);
            alert("Lỗi: Không thể xác định ca cần xóa trong cơ sở dữ liệu.");
            return;
        }


        if (window.confirm(`Bạn có chắc muốn xóa ca này (thay đổi tạm thời)?`)) {
            setEvents(prev => prev.filter(e => e.id !== shiftEvent.id));
            // Xóa khỏi danh sách chọn nếu đang được chọn
            setSelectedShiftIds(prevSelected => {
                const newSelected = new Set(prevSelected);
                newSelected.delete(shiftEvent.id);
                return newSelected;
            });
        }
    }, [isEditMode]);

    // --- HÀM MỚI: Xử lý chọn/bỏ chọn ca để xóa ---
    const handleShiftSelectToggle = useCallback((shiftId) => {
        if (!isEditMode) return;
        // Không cho phép chọn ca trong quá khứ để xóa
        const event = events.find(e => e.id === shiftId);
        if (event && isBefore(startOfDay(event.start), startOfDay(new Date()))) {
            // Có thể alert hoặc không làm gì cả
            console.warn("Không thể xóa ca đã chọn này!.");
            return;
        }

        setSelectedShiftIds(prevSelectedIds => {
            const newSelectedIds = new Set(prevSelectedIds);
            if (newSelectedIds.has(shiftId)) {
                newSelectedIds.delete(shiftId);
            } else {
                newSelectedIds.add(shiftId);
            }
            return newSelectedIds;
        });
    }, [isEditMode, events]); // Thêm dependency events

    // --- HÀM MỚI: Xử lý xóa các ca đã chọn ---
    const handleDeleteSelectedShifts = async () => {
        if (!isEditMode || selectedShiftIds.size === 0) return;

        // Kiểm tra ngày quá khứ một cách an toàn
        let pastShiftsSelected = false;
        try {
            pastShiftsSelected = Array.from(selectedShiftIds).some(id => {
                const event = events.find(e => e.id === id);

                // *** SỬA LỖI: KIỂM TRA event và event.start ***
                if (!event || !event.start) {
                    console.warn(`Event với ID ${id} được chọn xóa không tìm thấy hoặc thiếu ngày bắt đầu.`);
                    return false; // Bỏ qua ID này, coi như không phải quá khứ
                }

                // Đảm bảo event.start là đối tượng Date hợp lệ trước khi dùng
                const eventStartDate = typeof event.start === 'string' ? parseISO(event.start) : event.start;
                if (!(eventStartDate instanceof Date) || isNaN(eventStartDate.getTime())) {
                    console.warn(`Ngày bắt đầu không hợp lệ cho event ID ${id}.`);
                    return false; // Bỏ qua ID này
                }

                // Nếu event và ngày hợp lệ, mới tiến hành kiểm tra isBefore
                return isBefore(startOfDay(eventStartDate), startOfDay(new Date()));
            });
        } catch (error) {
             // Xử lý lỗi tiềm ẩn từ parseISO hoặc các hàm date-fns khác nếu cần
             console.error("Lỗi khi kiểm tra ngày quá khứ trong handleDeleteSelectedShifts:", error);
             setError("Đã xảy ra lỗi khi kiểm tra ngày của ca cần xóa.");
             return; // Ngăn chặn việc xóa nếu có lỗi kiểm tra
        }


        if (pastShiftsSelected) {
            alert("Danh sách chọn chứa ca trong quá khứ. Vui lòng bỏ chọn các ca đã qua trước khi xóa.");
            return;
        }

        // Phần xác nhận và xóa state local giữ nguyên
        if (window.confirm(`Bạn có chắc muốn xóa ${selectedShiftIds.size} ca đã chọn (thay đổi tạm thời)?`)) {
            setEvents(prevEvents => prevEvents.filter(event => !selectedShiftIds.has(event.id)));
            setSelectedShiftIds(new Set());
            console.log("Locally deleted shifts:", Array.from(selectedShiftIds));
        }
    };

    // === HÀM XỬ LÝ CHỌN NGÀY TRONG MODAL ===
    const handleDateSelectionChange = (date, isChecked) => {
        setSelectedDatesInModal(prev => {
            const dateString = format(date, 'yyyy-MM-dd');
            const currentDates = prev.map(d => format(d, 'yyyy-MM-dd'));
            if (isChecked) {
                if (!currentDates.includes(dateString)) {
                    return [...prev, date].sort((a, b) => a - b);
                }
            } else {
                return prev.filter(d => format(d, 'yyyy-MM-dd') !== dateString);
            }
            return prev;
        });
        setError(""); // Xóa lỗi khi người dùng thay đổi lựa chọn
    };

    // Hàm để cập nhật ngày xem khi LichTheoTuan thay đổi tuần
    const handleWeekChangeFromTable = useCallback((newWeekStartDate) => {
        setCurrentViewDate(newWeekStartDate);
        setSelectedShiftIds(new Set()); // <-- Xóa lựa chọn khi chuyển tuần
    }, []);

    // === CẬP NHẬT handleFormSubmit ĐỂ XỬ LÝ "CẢ NGÀY" ===
    // Trong PhanCa.jsx

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setError(""); // Xóa lỗi cũ trong modal

        // --- 1. VALIDATION CƠ BẢN ---
        if (shiftForm.existingEventId && selectedDatesInModal.length > 1) {
            setError("Chức năng sửa chỉ áp dụng cho một ngày tại một thời điểm.");
            return;
        }
        if (!shiftForm.nhanvien_id) {
            setError("Vui lòng chọn nhân viên.");
            return;
        }
        // Khi sửa, selectedDatesInModal chắc chắn có 1 ngày (ngày của event gốc)
        // Khi thêm mới, cần chọn ít nhất 1 ngày
        if (!shiftForm.existingEventId && selectedDatesInModal.length === 0) {
            setError("Vui lòng chọn ít nhất một ngày để áp dụng.");
            return;
        }
        const selectedShiftTypeKey = shiftForm.shiftType;
        if (!shiftTypesDefinition[selectedShiftTypeKey]) {
            setError("Lỗi: Loại ca không hợp lệ.");
            return;
        }

        // --- 2. CHUẨN BỊ DỮ LIỆU & KIỂM TRA TRÙNG LẶP ---
        const employeeId = shiftForm.nhanvien_id;
        const employeeName = shiftForm.employeeName; // Lấy tên từ form state
        const existingEventIdToEdit = shiftForm.existingEventId;
        const notes = shiftForm.notes || "";
        const datesToProcess = selectedDatesInModal; // Luôn dùng cái này, vì khi sửa nó cũng chỉ chứa 1 ngày

        let validationErrors = [];
        let eventsToAddLocally = []; // Các ca mới sẽ được thêm vào state local
        let eventToUpdateLocally = null; // Ca cần cập nhật trong state local

        for (const selectedDate of datesToProcess) {
            const dayStart = startOfDay(selectedDate);
            let potentialShiftsForKey = []; // Mảng chứa các key ca cần xử lý cho ngày này ('morning', 'evening')

            if (selectedShiftTypeKey === 'fullDayCombined') {
                potentialShiftsForKey.push('morning');
                potentialShiftsForKey.push('evening');
            } else {
                potentialShiftsForKey.push(selectedShiftTypeKey);
            }

            // Biến cờ để biết ngày này có hợp lệ không (sau khi check tất cả ca trong ngày)
            let isCurrentDayValid = true;

            for (const currentShiftKey of potentialShiftsForKey) {
                const shiftInfo = shiftTypesDefinition[currentShiftKey];
                if (!shiftInfo || !shiftInfo.startHour || !shiftInfo.endHour) continue; // Bỏ qua nếu thông tin ca không đầy đủ

                // Tính toán thời gian bắt đầu/kết thúc chính xác cho ca này
                let start = setHours(setMinutes(dayStart, 0), shiftInfo.startHour);
                let end = setHours(setMinutes(new Date(start), 0), shiftInfo.endHour);

                // Kiểm tra trùng lặp với các ca *hiện có* trong state `events`
                // Loại trừ chính event đang sửa (nếu có)
                const conflictingEvent = events.find(existingEvent =>
                    existingEvent.id !== existingEventIdToEdit &&
                    existingEvent.nhanvien_id === employeeId &&
                    isSameDay(existingEvent.start, dayStart) && // Chỉ cần check cùng ngày
                    // Kiểm tra sự chồng chéo thời gian thực tế
                    isBefore(start, existingEvent.end) && isAfter(end, existingEvent.start)
                );

                if (conflictingEvent) {
                    validationErrors.push(`Ngày ${format(selectedDate, 'dd/MM')}, Ca ${shiftInfo.title}: Trùng với ca (${format(conflictingEvent.start, 'HH:mm')})`);
                    isCurrentDayValid = false; // Đánh dấu ngày này không hợp lệ
                    // Nếu đang xử lý 'fullDayCombined' hoặc sửa, chỉ cần 1 lỗi là dừng kiểm tra ngày này
                    if (selectedShiftTypeKey === 'fullDayCombined' || existingEventIdToEdit) {
                        break; // Thoát vòng lặp kiểm tra các ca trong ngày (morning/evening)
                    }
                } else {
                    // Nếu không trùng lặp, chuẩn bị dữ liệu để thêm/sửa LOCAL
                    // Dùng ID tạm thời cho các event mới
                    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                    const eventData = {
                        id: (existingEventIdToEdit && currentShiftKey === selectedShiftTypeKey) ? existingEventIdToEdit : tempId,
                        title: `${employeeName} - ${shiftInfo.title}`,
                        start: start,
                        end: end,
                        shiftType: currentShiftKey, // Luôn là 'morning' hoặc 'evening'
                        nhanvien_id: employeeId,
                        employeeName: employeeName,
                        notes: notes,
                        // Có thể thêm flag để biết đây là thay đổi tạm thời
                        // isTemporary: !existingEventIdToEdit
                    };

                    if (existingEventIdToEdit && currentShiftKey === selectedShiftTypeKey) {
                        eventToUpdateLocally = eventData; // Chỉ có 1 event được cập nhật
                    } else if (!existingEventIdToEdit) {
                        // Chỉ thêm vào danh sách nếu là thao tác thêm mới
                        eventsToAddLocally.push(eventData);
                    }
                }
            } // Kết thúc for (currentShiftKey of potentialShiftsForKey)

            // Nếu ngày không hợp lệ (do lỗi trùng lặp), thì không thêm/sửa gì cho ngày này cả
            // và reset lại eventsToAddLocally/eventToUpdateLocally nếu đang xử lý nhiều ngày
            if (!isCurrentDayValid && !existingEventIdToEdit) {
                // Lọc bỏ các event đã chuẩn bị cho ngày lỗi này khỏi eventsToAddLocally
                eventsToAddLocally = eventsToAddLocally.filter(event => !isSameDay(event.start, dayStart));
            }
            // Nếu đang sửa và ngày không hợp lệ, cũng không làm gì cả (eventToUpdateLocally sẽ là null)
            if (!isCurrentDayValid && existingEventIdToEdit) {
                eventToUpdateLocally = null;
            }


        } // Kết thúc for (const selectedDate of datesToProcess)

        // --- 3. XỬ LÝ KẾT QUẢ VALIDATION VÀ CẬP NHẬT STATE LOCAL ---
        if (validationErrors.length > 0) {
            // Hiển thị tất cả lỗi validation
            setError(`Lỗi trùng lịch:\n- ${validationErrors.join('\n- ')}`);
        } else {
            // Nếu không có lỗi validation nào
            let updatedEvents = [...events]; // Tạo bản sao state hiện tại

            // Thực hiện cập nhật (nếu có)
            if (eventToUpdateLocally) {
                updatedEvents = updatedEvents.map(ev =>
                    ev.id === eventToUpdateLocally.id ? eventToUpdateLocally : ev
                );
                console.log("Local state updated for shift:", eventToUpdateLocally.id);
            }

            // Thực hiện thêm mới (nếu có)
            if (eventsToAddLocally.length > 0) {
                // Kiểm tra lần cuối để tránh thêm trùng ca Sáng/Chiều trong cùng 1 lần submit 'Cả Ngày'
                // (Trường hợp này không nên xảy ra nếu logic potentialShifts đúng)
                // Hoặc kiểm tra trùng với các event đã có trong updatedEvents nếu cần cẩn thận hơn

                updatedEvents = [...updatedEvents, ...eventsToAddLocally];
                console.log("Local state added new shifts:", eventsToAddLocally.map(e => e.id));
            }

            // Chỉ cập nhật state nếu thực sự có thay đổi
            if (eventToUpdateLocally || eventsToAddLocally.length > 0) {
                setEvents(updatedEvents);
            }

            // Đóng modal và reset form
            setShowModal(false);
            setShiftForm({ employeeName: "", nhanvien_id: null, shiftType: "morning", startTime: "", endTime: "", notes: "", existingEventId: null });
            setSelectedDatesInModal([]);
            // Giữ lại selectedSlot nếu cần tham chiếu cho việc khác, nếu không thì reset:
            // setSelectedSlot(null);
        }
    };

    // === HÀM MỚI: Xử lý Lưu thay đổi vào DB ===
    const handleSaveChangesToDb = useCallback(async () => {
        setLoading(true);
        setApiError(null);
        setError("");

        // 1. So sánh events và originalEvents để tìm ra thay đổi
        const originalEventMap = new Map(originalEvents.map(event => [event.id, event]));
        const currentEventMap = new Map(events.map(event => [event.id, event]));

        const added = [];
        const updated = [];
        const deleted = [];

        // Tìm mục đã thêm và sửa
        events.forEach(currentEvent => {
            const originalEvent = originalEventMap.get(currentEvent.id);
            if (!originalEvent) {
                // Mới: Chỉ thêm nếu ID không phải là ID tạm thời (hoặc xử lý ID tạm thời)
                // API cần trả về ID thực sau khi insert
                if (!String(currentEvent.id).startsWith('temp-')) {
                    console.warn("Trying to save event without DB ID?", currentEvent); // Cần xử lý ID
                }
                // Chuẩn bị payload cho API add
                added.push({
                    nhanvien_id: currentEvent.nhanvien_id,
                    caLamViec: shiftTypesDefinition[currentEvent.shiftType]?.dbValue,
                    start_time: currentEvent.start.toISOString(), // Gửi ISO string (backend cần parse)
                    end_time: currentEvent.end.toISOString(),   // Gửi ISO string
                    notes: currentEvent.notes,
                    // Thêm các trường khác nếu API yêu cầu
                });
            } else if (!isEqual(currentEvent.start, originalEvent.start) || // Dùng isEqual của date-fns
                !isEqual(currentEvent.end, originalEvent.end) ||
                currentEvent.shiftType !== originalEvent.shiftType ||
                currentEvent.notes !== originalEvent.notes /* || các trường khác */) {
                // Đã sửa
                updated.push({
                    id: currentEvent.id, // ID gốc từ DB
                    nhanvien_id: currentEvent.nhanvien_id,
                    caLamViec: shiftTypesDefinition[currentEvent.shiftType]?.dbValue,
                    start_time: currentEvent.start.toISOString(),
                    end_time: currentEvent.end.toISOString(),
                    notes: currentEvent.notes,
                    // Thêm các trường khác nếu API yêu cầu
                });
            }
        });

        // Tìm mục đã xóa
        originalEvents.forEach(originalEvent => {
            if (!currentEventMap.has(originalEvent.id)) {
                deleted.push(originalEvent.id); // Mảng các ID cần xóa
            }
        });

        console.log("Changes:", { added, updated, deleted });

        if (added.length === 0 && updated.length === 0 && deleted.length === 0) {
            alert("Không có thay đổi nào để lưu.");
            setLoading(false);
            setIsEditMode(false); // Thoát chế độ edit
            return;
        }

        // 2. Gọi API bulk-save (khuyến nghị) hoặc các API riêng lẻ
        try {
            // --- Ưu tiên dùng API bulk-save ---
            const bulkPayload = { added, updated, deleted };
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/lichtruc/bulk-save`, { // API cần tạo
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bulkPayload)
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`Lỗi khi lưu hàng loạt: ${errorData.message || response.statusText}`);
            }
            alert("Lưu lịch làm việc thành công!");

            // --- Hoặc gọi API riêng lẻ (phức tạp hơn) ---
            // await Promise.all([
            //     ...added.map(item => fetch('/api/lichtruc/themlichtruc', { method: 'POST', ... })),
            //     ...updated.map(item => fetch(`/api/lichtruc/${item.id}`, { method: 'PUT', ... })),
            //     ...deleted.map(id => fetch(`/api/lichtruc/${id}`, { method: 'DELETE' }))
            // ]);

            // 3. Fetch lại dữ liệu mới nhất sau khi lưu thành công
            await fetchLichTruc();
            // setIsEditMode(false); // fetchLichTruc đã set về false

        } catch (apiErr) {
            console.error("Lỗi khi lưu thay đổi:", apiErr);
            setError(`Không thể lưu thay đổi: ${apiErr.message}`);
            // Không thoát edit mode khi có lỗi
        } finally {
            setLoading(false);
        }
    }, [originalEvents, events, fetchLichTruc]);;

    // === HÀM MỚI: Hủy Chỉnh Sửa ===
    const handleCancelEdit = () => {
        if (window.confirm("Bạn có chắc muốn hủy bỏ mọi thay đổi?")) {
            setEvents(originalEvents); // Quay lại trạng thái gốc
            setSelectedShiftIds(new Set()); // Xóa lựa chọn
            setError("");
            setApiError(null);
            setIsEditMode(false); // Thoát chế độ chỉnh sửa
        }
    };

    // === HÀM MỚI: Bật/Tắt Chế độ Chỉnh sửa ===
    const toggleEditMode = () => {
        if (isEditMode) {
            // Nếu đang ở Edit Mode mà muốn thoát (ví dụ có nút "Thoát sửa")
            handleCancelEdit(); // Hỏi xác nhận hủy
        } else {
            // Bật Edit Mode
            setIsEditMode(true);
        }
    };


    return (
        <div className="h-screen bg-white">
            <div className="max-w-full mx-auto">

                {/* Hiển thị trạng thái Loading hoặc Lỗi */}
                {loading && <div className="text-center text-blue-500">Đang tải dữ liệu...</div>}
                {apiError && <div className="p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded">{apiError}</div>}

                {/* === KHU VỰC CHÚ GIẢI VÀ NÚT XÓA NHIỀU === */}
                <div className="flex items-center justify-between p-2 bg-gray-100"> {/* Container chính: flex, căn giữa dọc, cách đều ngang */}

                    {/* Phần bên trái: Chú giải */}
                    <div className="flex items-center space-x-2"> {/* Container cho các mục chú giải */}
                        <span className="text-sm font-medium text-gray-700">Chú giải:</span>
                        {Object.entries(shiftTypesDefinition)
                            .filter(([key]) => key !== 'fullDayCombined') // Lọc bỏ key ảo
                            .map(([key, value]) => (
                                <div key={key} className="flex items-center space-x-1.5">
                                    <div className={`w-3.5 h-3.5 rounded-sm ${value.legendColor}`}></div> {/* Ô màu */}
                                    <span className="text-sm text-gray-600">
                                        {value.title}: {value.startHour}:00 - {value.endHour}:00
                                    </span>
                                </div>
                            ))
                        }
                    </div>

                    {/* Phần bên phải: Nút xóa nhiều */}
                    <div className="flex flex-wrap items-center h-7"> {/* Container cho nút xóa */}
                        {/* Nút Xóa nhiều (chỉ hiện ở Edit Mode) */}
                        {isEditMode && selectedShiftIds.size > 0 && (
                            <button
                                onClick={handleDeleteSelectedShifts}
                                className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500" // Giảm padding/size chữ
                            >
                                <FiTrash2 className="w-3.5 h-3.5" /> {/* Giảm size icon */}
                                Xóa ({selectedShiftIds.size})
                            </button>
                        )}
                        {/* Nút Chỉnh sửa / Lưu / Hủy */}
                        {isEditMode ? (
                            <>
                                <button
                                    onClick={handleSaveChangesToDb}
                                    disabled={loading} // Disable khi đang lưu
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:opacity-50"
                                >
                                    <FiSave /> Lưu lịch làm việc
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    <FiXCircle /> Hủy chỉnh sửa
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={toggleEditMode} // Bật Edit Mode
                                disabled={loading} // Disable khi đang load
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                <FiEdit /> Chỉnh sửa lịch
                            </button>
                        )}
                    </div>
                </div>
                {/* === KẾT THÚC KHU VỰC CHÚ GIẢI VÀ NÚT XÓA NHIỀU === */}

                {/* Component Bảng Lịch */}
                <LichTheoTuan
                    employees={employees}
                    events={events}
                    initialDate={currentViewDate}
                    onAddShift={handleAddShiftFromTable}
                    onEditShift={handleEditShiftFromTable}
                    onDeleteShift={handleDeleteShift}
                    onWeekChange={handleWeekChangeFromTable}
                    selectedShiftIds={selectedShiftIds}
                    onShiftSelectToggle={handleShiftSelectToggle}
                    shiftTypeDefinitions={shiftTypesDefinition}
                    isEditMode={isEditMode}
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-lg"> {/* Tăng max-w */}
                        <h2 className="mb-4 text-xl font-semibold text-gray-900">
                            {shiftForm.existingEventId ? 'Sửa Ca Làm Việc' : 'Thêm Ca Mới'}
                        </h2>
                        {error && (
                            <div className="p-3 mb-4 text-sm text-red-700 whitespace-pre-wrap bg-red-100 border border-red-300 rounded">
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {/* Row 1: Nhân viên & Loại Ca */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Input Nhân Viên */}
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Nhân Viên</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        value={shiftForm.nhanvien_id || ""}
                                        onChange={(e) => {
                                            const selectedId = parseInt(e.target.value, 10);
                                            const selectedEmployee = employees.find(emp => emp.id === selectedId);
                                            setShiftForm(prev => ({
                                                ...prev,
                                                employeeName: selectedEmployee ? selectedEmployee.hoTen : "",
                                                nhanvien_id: selectedEmployee ? selectedEmployee.id : null,
                                            }));
                                            setError("");
                                        }}
                                        required
                                        disabled={!!shiftForm.existingEventId}
                                    >
                                        <option value="">Chọn Nhân Viên</option>
                                        {employees.map((emp) => (<option key={emp.id} value={emp.id}>{emp.hoTen}</option>))}
                                    </select>
                                </div>
                                {/* Input Loại Ca */}
                                <div>
                                    <label className="block mb-1 text-sm font-medium text-gray-700">Loại Ca</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        value={shiftForm.shiftType}
                                        // Disable khi sửa ca? Hoặc chỉ cho chọn Sáng/Chiều khi sửa
                                        disabled={!!shiftForm.existingEventId}
                                        onChange={(e) => setShiftForm(prev => ({ ...prev, shiftType: e.target.value }))}
                                        required
                                    >
                                        {/* Thêm option Cả Ngày chỉ khi thêm mới */}
                                        {/* {!shiftForm.existingEventId && (
                                            <option value="fullDayCombined">
                                                {shiftTypesDefinition.fullDayCombined.title}
                                            </option>
                                        )} */}
                                        {/* Map qua các ca thực tế (Sáng, Chiều) */}
                                        {Object.entries(shiftTypesDefinition)
                                            .filter(([key]) => key !== 'fullDayCombined') // Lọc bỏ key ảo
                                            .map(([key, value]) => (
                                                <option key={key} value={key}>{value.title}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Chọn Ngày Áp Dụng (Chỉ hiển thị khi thêm mới) */}
                            {!shiftForm.existingEventId && (
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">Áp dụng cho các ngày trong tuần:</label>
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
                                        {weekDatesForView.map(date => { // Sử dụng weekDatesForView
                                            const dateString = format(date, 'yyyy-MM-dd');
                                            const isChecked = selectedDatesInModal.some(d => format(d, 'yyyy-MM-dd') === dateString);
                                            const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
                                            return (
                                                <label
                                                    key={dateString}
                                                    className={`flex items-center p-2 border rounded-md cursor-pointer transition-colors ${isChecked ? 'bg-indigo-100 border-indigo-300' : 'border-gray-300 hover:bg-gray-50'
                                                        } ${isPast ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:opacity-50"
                                                        checked={isChecked}
                                                        onChange={(e) => !isPast && handleDateSelectionChange(date, e.target.checked)}
                                                        disabled={isPast}
                                                    />
                                                    <span className={`ml-2 text-sm ${isPast ? 'text-gray-500' : 'text-gray-800'}`}>
                                                        {format(date, 'dd/MM')} ({format(date, 'E', { locale: vi })})
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Input Ghi Chú */}
                            <div>
                                <label className="block mb-1 text-sm font-medium text-gray-700">Ghi Chú (Tùy chọn)</label>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    rows="3"
                                    value={shiftForm.notes || ""}
                                    onChange={(e) => setShiftForm(prev => ({ ...prev, notes: e.target.value }))}
                                ></textarea>
                            </div>

                            {/* Nút Lưu/Hủy */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setError("");
                                        setShiftForm({ employeeName: "", nhanvien_id: null, shiftType: "morning", startTime: "", endTime: "", notes: "", existingEventId: null }); // Reset form khi hủy
                                        setSelectedDatesInModal([]); // Reset ngày đã chọn
                                        setSelectedSlot(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                                >
                                    {shiftForm.existingEventId ? 'Cập Nhật Ca' : 'Lưu Ca Mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhanCa;