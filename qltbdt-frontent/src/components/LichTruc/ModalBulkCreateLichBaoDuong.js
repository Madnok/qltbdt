import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Select from 'react-select';
import * as api from '../../api'; // Đảm bảo import đúng đường dẫn
import { FaTrashAlt, FaTimesCircle, FaSpinner } from 'react-icons/fa';

const ModalBulkCreateLichBaoDuong = ({ isOpen, onClose }) => { // Giữ isOpen và onClose để điều khiển từ cha

    const queryClient = useQueryClient();

    // --- State quản lý form ---
    const [selectedRooms, setSelectedRooms] = useState([]); // Lưu các phòng đã chọn { value: id, label: name }
    const [roomTasks, setRoomTasks] = useState({});
    const [commonDate, setCommonDate] = useState(''); // Ngày chung cho tất cả task (có thể ghi đè)
    const [commonMoTa, setCommonMoTa] = useState('');   // Mô tả chung (có thể ghi đè)
    const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);

    // Lấy danh sách tất cả phòng cho multi-select
    const { data: allPhongOptions = [], isLoading: isLoadingPhong } = useQuery({
        queryKey: ['phong-co-taisan-list'],
        queryFn: async () => {
            const data = await api.fetchPhongCoTaiSanList(); // Gọi API lấy danh sách phòng
            return data.map(p => ({ value: p.id, label: p.phong })); // Chuyển đổi thành format cho react-select
        }
    });

    // --- Hàm fetch gợi ý NV cho 1 phòng ---
    const fetchSuggestionsForRoom = useCallback(async (roomId, ngayBaoTri) => {
        if (!roomId || !ngayBaoTri) return;

        setRoomTasks(prev => {
            if (!prev[roomId]) return prev;
            return { ...prev, [roomId]: { ...prev[roomId], _isLoadingSuggestions: true } };
        });

        try {
            const suggestions = await api.suggestNhanVienAPI({ phongId: roomId, ngayBaoTri });
            const suggestionOptions = suggestions.map(nv => ({
                value: nv.id,
                label: `${nv.hoTen} (Ưu Tiên: ${nv.priority})`,
                priority: nv.priority
            })).sort((a, b) => a.priority - b.priority);

            setRoomTasks(prev => {
                if (!prev[roomId]) return prev;
                return {
                    ...prev,
                    [roomId]: {
                        ...prev[roomId],
                        _isLoadingSuggestions: false,
                        _suggestionsFetchedAttempted: true,
                        _suggestionOptions: suggestionOptions
                    }
                };
            });
        } catch (error) {
            console.error(`Lỗi fetch gợi ý NV cho phòng ${roomId}:`, error);
            setRoomTasks(prev => {
                if (!prev[roomId]) return prev;
                return {
                    ...prev, [roomId]: {
                        ...prev[roomId],
                        _isLoadingSuggestions: false,
                        _suggestionsFetchedAttempted: true
                    }
                };
            });
        }
    }, []);

    // --- Mutation để tạo hàng loạt ---
    const bulkCreateMutation = useMutation({
        mutationFn: api.createBulkLichBaoDuongAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lichBaoDuongListAll'] });
            toast.success("Tạo lịch bảo dưỡng hàng loạt thành công!");
            onClose();
            setSelectedRooms([]);
            setRoomTasks({});
            setCommonDate('');
            setCommonMoTa('');
        },
        onError: (error) => {
            console.error("Lỗi mutation tạo lịch hàng loạt:", error);
        },
        onSettled: () => {
            setIsLoadingSubmit(false);
        }
    });

    // --- Hàm fetch thiết bị (dùng useCallback) ---
    const fetchDevicesForRoom = useCallback(async (roomId, tenPhong) => {
        if (!roomId) return;

        setRoomTasks(prev => {
            if (!prev[roomId]) return prev;
            return { ...prev, [roomId]: { ...prev[roomId], _isLoadingThietBi: true } };
        });
        // eslint-disable-next-line
        let success = false;
        try {
            const devices = await api.fetchThietBiTrongPhongToBaoDuong(roomId);
            const deviceOptions = devices.map(tb => ({
                value: tb.thongtinthietbi_id || tb.id,
                label: `${tb.tenLoaiThietBi || tb.tenThietBi || 'TB'} (MĐD: ${tb.thongtinthietbi_id || tb.id})`
            }));
            setRoomTasks(prev => {
                if (!prev[roomId]) return prev;
                return {
                    ...prev,
                    [roomId]: { ...prev[roomId], _thietBiOptionsCache: deviceOptions }
                };
            });
            // eslint-disable-next-line
            success = true;
        } catch (error) {
            console.error(`Lỗi fetch thiết bị cho phòng ${roomId}:`, error);
            toast.error(`Không thể tải thiết bị cho phòng ${tenPhong}`);
        } finally {
            setRoomTasks(prev => {
                if (!prev[roomId]) return prev;
                return {
                    ...prev,
                    [roomId]: {
                        ...prev[roomId],
                        _isLoadingThietBi: false,
                        _devicesFetchedAttempted: true
                    }
                };
            });
        }
    }, []);

    // --- Xử lý khi danh sách phòng chọn thay đổi ---
    useEffect(() => {
        const newRoomTasks = {};
        selectedRooms.forEach(roomOption => {
            const roomId = roomOption.value;
            newRoomTasks[roomId] = roomTasks[roomId] || {
                phong_id: roomId,
                tenPhong: roomOption.label,
                thongtinthietbi_ids: [],
                nhanvien_id: null,
                ngay_baotri: commonDate || '',
                mo_ta: commonMoTa || '',
                _thietBiOptionsCache: [],
                _isLoadingThietBi: false,
                _devicesFetchedAttempted: false,
                _isLoadingSuggestions: false,
                _suggestionOptions: [],
                _suggestionsFetchedAttempted: false
            };
            if (roomTasks[roomId]) {
                if (commonDate && !roomTasks[roomId].ngay_baotri) {
                    newRoomTasks[roomId].ngay_baotri = commonDate;
                }
                if (commonMoTa && !roomTasks[roomId].mo_ta) {
                    newRoomTasks[roomId].mo_ta = commonMoTa;
                }
                newRoomTasks[roomId].ngay_baotri = roomTasks[roomId].ngay_baotri || commonDate || '';
                newRoomTasks[roomId].mo_ta = roomTasks[roomId].mo_ta || commonMoTa || '';
            }
            const currentTaskData = newRoomTasks[roomId];
            if (currentTaskData.phong_id && currentTaskData.ngay_baotri && currentTaskData._suggestionOptions.length === 0 && !currentTaskData._isLoadingSuggestions) {
                fetchSuggestionsForRoom(currentTaskData.phong_id, currentTaskData.ngay_baotri);
            }
        });
        setRoomTasks(newRoomTasks);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRooms, commonDate, commonMoTa, fetchSuggestionsForRoom]);

    // --- useEffect mới để fetch thiết bị khi roomTasks thay đổi ---
    useEffect(() => {
        Object.values(roomTasks).forEach(task => {
            if (task && task.phong_id && !task._devicesFetchedAttempted && !task._isLoadingThietBi) {
                fetchDevicesForRoom(task.phong_id, task.tenPhong);
            }
            if (task && task.phong_id && task.ngay_baotri && !task._suggestionsFetchedAttempted && !task._isLoadingSuggestions) {
                fetchSuggestionsForRoom(task.phong_id, task.ngay_baotri, task.tenPhong);
            }
        });
    }, [roomTasks, fetchDevicesForRoom, fetchSuggestionsForRoom]);

    // --- Handlers cho việc thay đổi trong từng task phòng ---
    const handleRoomTaskChange = (roomId, field, value) => {
        setRoomTasks(prev => {
            const updatedTask = { ...prev[roomId], [field]: value };
            if (field === 'ngay_baotri') {
                updatedTask._isLoadingSuggestions = false;
                updatedTask._suggestionOptions = [];
                updatedTask.nhanvien_id = null;
                updatedTask._suggestionsFetchedAttempted = false;
            }
            return { ...prev, [roomId]: updatedTask };
        });
    };

    const handleDeviceSelectionChange = (roomId, selectedOptions) => {
        const deviceIds = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
        handleRoomTaskChange(roomId, 'thongtinthietbi_ids', deviceIds);
    };

    const handleNhanVienSelectionChange = (roomId, selectedOption) => {
        handleRoomTaskChange(roomId, 'nhanvien_id', selectedOption ? selectedOption.value : null);
    };

    // --- Handler Submit Form ---
    const handleBulkSubmit = (e) => {
        e.preventDefault();
        setIsLoadingSubmit(true);

        const tasksToSubmit = Object.values(roomTasks).filter(task => task.thongtinthietbi_ids.length > 0); // Chỉ gửi task có chọn thiết bị

        // --- Validation trước khi submit ---
        let valid = true;
        const errors = [];
        if (tasksToSubmit.length === 0) {
            toast.error("Vui lòng chọn ít nhất một phòng và thiết bị cần bảo dưỡng.");
            setIsLoadingSubmit(false);
            return;
        }
        tasksToSubmit.forEach(task => {
            if (!task.ngay_baotri) {
                valid = false;
                errors.push(`Phòng ${task.tenPhong}: Chưa chọn ngày bảo dưỡng.`);
            }
            if (!task.nhanvien_id) {
                valid = false;
                errors.push(`Phòng ${task.tenPhong}: Chưa chọn nhân viên thực hiện.`);
            }
        });

        if (!valid) {
            toast.error(<div>Dữ liệu chưa hợp lệ:<ul className="list-disc list-inside">{errors.map((err, i) => <li key={i}>{err}</li>)}</ul></div>);
            setIsLoadingSubmit(false);
            return;
        }
        // --- Kết thúc Validation ---

        // Chuẩn bị payload cuối cùng (chỉ gồm các trường cần thiết)
        const finalPayload = tasksToSubmit.map(task => ({
            phong_id: task.phong_id,
            thongtinthietbi_ids: task.thongtinthietbi_ids,
            nhanvien_id: task.nhanvien_id,
            ngay_baotri: task.ngay_baotri,
            mo_ta: task.mo_ta || commonMoTa || `Bảo dưỡng định kỳ phòng ${task.tenPhong}`, // Ưu tiên mô tả riêng -> chung -> mặc định
        }));

        bulkCreateMutation.mutate({ bulkTasks: finalPayload });
    };

    if (!isOpen) {
        return null;
    }

    // --- Render ---
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="w-full max-w-5xl bg-white rounded-lg shadow-xl h-full max-h-[90vh] flex flex-col">
                {/* Header Modal */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-semibold">Tạo Lịch Bảo Dưỡng Hàng Loạt</h2>
                    <button onClick={() => { console.log('Bulk Modal - Header Close clicked'); onClose(); }} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                        <FaTimesCircle size={20} />
                    </button>
                </div>

                {/* Body Modal */}
                <form onSubmit={handleBulkSubmit} className="flex flex-col flex-grow overflow-hidden">
                    <div className="p-4 space-y-4 h-full overflow-y-auto">
                        {/* Phần chọn phòng */}
                        <div className='mb-4'>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn các phòng cần tạo lịch:</label>
                            <Select
                                isMulti options={allPhongOptions} isLoading={isLoadingPhong}
                                onChange={(selectedOpts) => setSelectedRooms(selectedOpts || [])} // Đảm bảo là mảng
                                value={selectedRooms} placeholder="Nhập hoặc chọn tên phòng..."
                                closeMenuOnSelect={false} styles={{ menu: base => ({ ...base, zIndex: 9999 }) }} // Tăng z-index cho dropdown
                            />
                        </div>

                        {/* Phần nhập thông tin chung */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded bg-gray-50 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ngày Bảo Dưỡng Chung</label>
                                <input
                                    type="date"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={commonDate}
                                    onChange={(e) => setCommonDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                                <p className="text-xs text-gray-500 mt-1">Áp dụng cho tất cả phòng nếu không đặt ngày riêng.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mô Tả Chung</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={commonMoTa}
                                    onChange={(e) => setCommonMoTa(e.target.value)}
                                    placeholder="VD: Bảo dưỡng định kỳ quý 2"
                                />
                                <p className="text-xs text-gray-500 mt-1">Áp dụng cho tất cả phòng nếu không đặt mô tả riêng.</p>
                            </div>
                        </div>

                        {/* Phần chi tiết cho từng phòng đã chọn */}
                        <div className='space-y-4'>
                            {selectedRooms.length === 0 && <p className='text-center text-gray-500 italic'>Vui lòng chọn ít nhất một phòng.</p>}
                            {selectedRooms.map(roomOption => {
                                const roomId = roomOption.value;
                                const task = roomTasks[roomId];
                                if (!task) return null;
                                const deviceOptions = task._thietBiOptionsCache || [];
                                const suggestionOptions = task._suggestionOptions || [];

                                return (
                                    <div key={roomId} className="p-4 border rounded shadow-sm bg-white relative">
                                        {/* Nút xóa phòng khỏi danh sách bulk */}
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRooms(prev => prev.filter(r => r.value !== roomId))}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                                            title="Xóa phòng này khỏi danh sách tạo hàng loạt"
                                        >
                                            <FaTrashAlt size={14} />
                                        </button>

                                        <h4 className="text-lg font-semibold mb-3 text-blue-700">{task.tenPhong}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* Chọn Thiết Bị */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Chọn Thiết Bị <span className="text-red-500">*</span></label>
                                                <Select
                                                    isMulti
                                                    options={deviceOptions}
                                                    isLoading={task._isLoadingThietBi}
                                                    value={deviceOptions.filter(opt => task.thongtinthietbi_ids.includes(opt.value))}
                                                    onChange={(selectedOpts) => handleDeviceSelectionChange(roomId, selectedOpts)}
                                                    placeholder={task._isLoadingThietBi ? "Đang tải..." : (task._devicesFetchedAttempted || deviceOptions.length > 0 ? "Chọn thiết bị..." : "Đang tải...")}
                                                    closeMenuOnSelect={false}
                                                    isDisabled={task._isLoadingThietBi || (task._devicesFetchedAttempted && deviceOptions.length === 0)}
                                                    noOptionsMessage={() =>
                                                        task._isLoadingThietBi ? 'Đang tải...' :
                                                            (task._devicesFetchedAttempted ? 'Không có thiết bị hợp lệ' : 'Đang tải thiết bị...')
                                                    } />
                                            </div>
                                            {/* Ngày Riêng */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Ngày Riêng <span className="text-red-500">*</span></label>
                                                <input
                                                    type="date"
                                                    required
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    value={task.ngay_baotri || commonDate} // Ưu tiên ngày riêng -> ngày chung
                                                    onChange={(e) => handleRoomTaskChange(roomId, 'ngay_baotri', e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                            {/* Gán Nhân Viên */}
                                            {/* SỬA: Dropdown Nhân Viên */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Gán Nhân Viên <span className="text-red-500">*</span></label>
                                                <Select
                                                    options={suggestionOptions}
                                                    isLoading={task._isLoadingSuggestions}
                                                    value={suggestionOptions.find(opt => opt.value === task.nhanvien_id) || null}
                                                    onChange={(selectedOpt) => handleNhanVienSelectionChange(roomId, selectedOpt)}
                                                    placeholder={
                                                        !task.ngay_baotri ? "Chọn ngày trước..." :
                                                            task._isLoadingSuggestions ? "Đang tải gợi ý..." :
                                                                suggestionOptions.length === 0 ? "Không có NV phù hợp" :
                                                                    "Chọn nhân viên..."
                                                    }
                                                    isClearable={false}
                                                    isDisabled={!task.ngay_baotri || task._isLoadingSuggestions || suggestionOptions.length === 0}
                                                    required
                                                    styles={{ menu: base => ({ ...base, zIndex: 9997 }) }}
                                                />
                                            </div>
                                            {/* Mô Tả Riêng */}
                                            <div className="md:col-span-2 lg:col-span-3">
                                                <label className="block text-sm font-medium text-gray-700">Mô Tả Riêng</label>
                                                <input
                                                    type="text"
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    value={task.mo_ta}
                                                    onChange={(e) => handleRoomTaskChange(roomId, 'mo_ta', e.target.value)}
                                                    placeholder={`Mặc định: ${commonMoTa || `Bảo dưỡng định kỳ phòng ${task.tenPhong}`}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Modal */}
                    <div className="flex justify-end space-x-2 p-4 border-t sticky bottom-0 bg-white z-10">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" disabled={isLoadingSubmit}>
                            Hủy
                        </button>
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" disabled={isLoadingSubmit || selectedRooms.length === 0}>
                            {isLoadingSubmit ? (
                                <FaSpinner className="animate-spin inline mr-2" />
                            ) : null}
                            {isLoadingSubmit ? 'Đang tạo...' : 'Xác nhận Tạo Hàng Loạt'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalBulkCreateLichBaoDuong; 