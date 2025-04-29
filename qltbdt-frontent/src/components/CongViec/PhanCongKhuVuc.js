import React, { useState, useEffect, useMemo } from 'react';
import {
    fetchNhanVienList,
    fetchAllRoomsList,
    fetchAssignedRoomsForEmployee,
    addAssignedRoomsForEmployee,
    removeAssignedRoomsForEmployee,
} from '../../api';

import { XMarkIcon } from '@heroicons/react/20/solid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Component con cho Tab phân khu
const AssignRoomsTab = ({
    allRoomsData,
    isLoadingAllRooms,
    isErrorAllRooms,
    roomSearchTerm,
    setRoomSearchTerm,
    pendingAssignedRoomIds,
    handleToggleRoom,
    isLoadingAssignedRooms, // Cần để disable input search
    saveAssignmentMutation, // Cần để disable checkbox khi đang lưu
    handleSaveChanges,
}) => {
    const filteredRooms = useMemo(() => {
        if (isLoadingAllRooms || isErrorAllRooms || !Array.isArray(allRoomsData)) {
            return [];
        }
        return allRoomsData.filter(room => {
            const phong = room?.phong ?? '';
            return phong.toLowerCase().includes(roomSearchTerm.toLowerCase());
        });
    }, [allRoomsData, isLoadingAllRooms, isErrorAllRooms, roomSearchTerm]);

    console.log("AssignRoomsTab rendering. pendingAssignedRoomIds:", pendingAssignedRoomIds);

    return (
        <>
            <input
                type="text"
                placeholder="Tìm phòng để phân công..."
                value={roomSearchTerm}
                onChange={(e) => setRoomSearchTerm(e.target.value)}
                className="w-full p-2 mb-2 border rounded shrink-0"
                disabled={isLoadingAllRooms || isLoadingAssignedRooms}
            />
            {/* Container cho danh sách phòng */}
            <div className="flex-grow overflow-y-auto border rounded p-2 mb-2 max-h-96 min-h-[200px]">
                {isLoadingAllRooms ? (
                    <p className="text-center text-gray-500">Đang tải danh sách phòng...</p>
                ) : (
                    <>
                        {isErrorAllRooms && <p className="text-red-500">Lỗi tải danh sách phòng!</p>}
                        {!isErrorAllRooms && filteredRooms.length === 0 && <p className="text-gray-500">Không có phòng nào.</p>}
                        {!isErrorAllRooms && filteredRooms.map(room => {
                            const isChecked = pendingAssignedRoomIds.has(room.id);
                            if ([1, 2, 3].includes(room.id)) {
                                console.log(`Room ${room.id} - Checkbox should be checked?: ${isChecked}`, pendingAssignedRoomIds);
                            }
                            return (
                                <div key={room.id} className="flex items-center p-1 mb-1 hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        id={`room-assign-${room.id}`}
                                        checked={isChecked}
                                        onChange={() => handleToggleRoom(room.id)}
                                        className="mr-2"
                                        disabled={saveAssignmentMutation.isPending}
                                    />
                                    <label htmlFor={`room-assign-${room.id}`}>{room.phong}</label>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
            {/* Nút Lưu */}
            <button
                onClick={handleSaveChanges}
                disabled={saveAssignmentMutation.isPending || isLoadingAssignedRooms || isLoadingAllRooms}
                className="px-4 py-2 mt-auto text-white bg-green-500 rounded shrink-0 hover:bg-green-600 disabled:bg-gray-400"
            >
                {saveAssignmentMutation.isPending ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
        </>
    );
};

// Component con cho Tab Xem phòng đã phân khu
const ViewAssignedRoomsTab = ({
    assignedRoomsData,
    isLoadingAssignedRooms,
    handleRemoveSingleRoom,
    selectedEmployee,
    isRemoving
}) => {
    // Kiểm tra trạng thái Loading
    if (isLoadingAssignedRooms) {
        return <p className="flex-grow text-center text-gray-500">Đang tải phòng đã phân công...</p>;
    }
    if (!Array.isArray(assignedRoomsData)) {
        return <p className="flex-grow text-center text-red-500">DATA không hợp lê!!</p>;
    }
    return (
        <div className="flex-grow p-2 overflow-y-auto">
            {assignedRoomsData.length === 0 ? (
                <p className="italic text-gray-600">Nhân viên <span className='font-medium'>{selectedEmployee?.hoTen}</span> chưa được phân công phòng nào.</p>
            ) : (
                <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-700">Các phòng <span className='font-semibold'>{selectedEmployee?.hoTen}</span> đang phụ trách:</h4>
                    {/* Sử dụng flex-wrap để tự động xuống dòng */}
                    <div className="flex flex-wrap gap-2">
                        {assignedRoomsData.map(room => (
                            <span
                                key={room.id}
                                className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full ring-1 ring-inset ring-blue-200"
                            >
                                {room.phong}
                                <button
                                    type="button"
                                    onClick={() => {
                                        console.log("Attempting to call handleRemoveSingleRoom for room:", room.id);
                                        // Kiểm tra lại kiểu ở đây nếu cần
                                        if (typeof handleRemoveSingleRoom === 'function') {
                                            handleRemoveSingleRoom(room.id);
                                        } else {
                                            console.error("handleRemoveSingleRoom is still not a function right before calling!");
                                        }
                                    }} // Gọi hàm xử lý xóa với ID phòng
                                    disabled={isRemoving}
                                    className="ml-1.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-blue-500 hover:bg-blue-200 hover:text-blue-700 focus:bg-blue-700 focus:text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={`Xóa phân công phòng ${room.phong}`}
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const PhanCongKhuVuc = () => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [pendingAssignedRoomIds, setPendingAssignedRoomIds] = useState(new Set());
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [roomSearchTerm, setRoomSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('assign');

    const queryClient = useQueryClient();


    // --- Fetch dữ liệu bằng useQuery ---
    const {
        data: employeesData,
        isLoading: isLoadingEmployees,
        isError: isErrorEmployees,
    } = useQuery({
        queryKey: ['nhanvienList'],
        queryFn: fetchNhanVienList
    });

    const {
        data: allRoomsData,
        isLoading: isLoadingAllRooms,
        isError: isErrorAllRooms
    } = useQuery({
        queryKey: ['allRoomsList'],
        queryFn: fetchAllRoomsList
    });

    // Fetch phòng đã gán cho nhân viên đang chọn
    const {
        data: assignedRoomsData = [],
        isLoading: isLoadingAssignedRooms,
    } = useQuery({
        queryKey: ['assignedRooms', selectedEmployeeId],
        queryFn: () => fetchAssignedRoomsForEmployee(selectedEmployeeId),
        enabled: !!selectedEmployeeId,
        onSuccess: (data) => {
            console.log(`onSuccess RAN for assignedRooms (Emp ID: ${selectedEmployeeId}). Data length: ${data?.length}`);
        }
    });

    // --- *** THÊM useEffect ĐỂ ĐỒNG BỘ STATE CHECKBOX *** ---
    // 1. useEffect để CẬP NHẬT pending IDs khi có employee được chọn VÀ data tương ứng thay đổi
    useEffect(() => {
        console.log(`useEffect [assignedRoomsData, selectedEmployeeId] running to SET IDs. EmpID: ${selectedEmployeeId}`);
        // Chỉ chạy logic cập nhật khi có ID VÀ có data (dù là mảng rỗng)
        if (selectedEmployeeId && Array.isArray(assignedRoomsData)) {
            const currentIds = new Set(assignedRoomsData.map(item => item.id));
            setPendingAssignedRoomIds(currentIds);
        }
        // Không làm gì nếu không có selectedEmployeeId trong effect này
    }, [assignedRoomsData, selectedEmployeeId]);
    
    // 2. useEffect để XÓA pending IDs khi không có employee nào được chọn
    useEffect(() => {
        console.log(`useEffect [selectedEmployeeId] running to CLEAR IDs. EmpID: ${selectedEmployeeId}`);
        if (!selectedEmployeeId) {
            setPendingAssignedRoomIds(currentSet => {
                if (currentSet.size > 0) {
                    console.log(`useEffect: Clearing non-empty pending IDs because no employee selected.`);
                    return new Set();
                }
                return currentSet; // Trả về Set cũ (đang rỗng)
            });
        }
        // Không làm gì nếu đang có selectedEmployeeId
    }, [selectedEmployeeId]); // Chỉ phụ thuộc vào selectedEmployeeId

    // --- *** KẾT THÚC useEffect *** ---

    // Tạo Set ID phòng đã gán thực tế (từ query) để so sánh khi lưu (cho Tab 1)
    const assignedRoomIds = useMemo(() => {
        return Array.isArray(assignedRoomsData)
            ? new Set(assignedRoomsData.map(item => item.id))
            : new Set();
    }, [assignedRoomsData]);

    // --- Mutation để lưu thay đổi ---
    const saveAssignmentMutation = useMutation({
        mutationFn: async () => {
            const addedRoomIds = [...pendingAssignedRoomIds].filter(id => !assignedRoomIds.has(id));
            const removedRoomIds = [...assignedRoomIds].filter(id => !pendingAssignedRoomIds.has(id));

            if (addedRoomIds.length === 0 && removedRoomIds.length === 0) {
                console.log("Không có thay đổi phân khu.");
                alert('Không có thay đổi nào để lưu.'); // Thông báo cho người dùng
                return; // Không thực hiện gọi API
            }

            const promises = [];
            if (addedRoomIds.length > 0) promises.push(addAssignedRoomsForEmployee(selectedEmployeeId, addedRoomIds));
            if (removedRoomIds.length > 0) promises.push(removeAssignedRoomsForEmployee(selectedEmployeeId, removedRoomIds));

            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assignedRooms', selectedEmployeeId] });
            queryClient.invalidateQueries({ queryKey: ['nhanvienList'] });
            alert('Cập nhật phân công thành công!');
        },
        onError: (error) => {
            console.error("Lỗi lưu phân công:", error.response?.data || error.message);
            alert('Lỗi khi lưu phân công. Vui lòng thử lại.');
            setPendingAssignedRoomIds(assignedRoomIds);
        }
    });

    const removeSingleAssignmentMutation = useMutation({
        mutationFn: ({ employeeId, roomId }) => removeAssignedRoomsForEmployee(employeeId, [roomId]),
        onSuccess: () => {
            // Invalidate query lấy phòng đã gán để UI cập nhật
            queryClient.invalidateQueries({ queryKey: ['assignedRooms', selectedEmployeeId] });
            console.log('Đã xóa phân công phòng thành công.');
        },
        onError: (error) => {
            console.error("Lỗi xóa phân công phòng:", error.response?.data || error.message);
            alert('Lỗi khi xóa phân công phòng. Vui lòng thử lại.');
        }
    });

    // --- Handlers ---
    // Lọc nhân viên
    const filteredEmployees = useMemo(() => {
        if (isLoadingEmployees || isErrorEmployees || !Array.isArray(employeesData)) {
            console.log("[filteredEmployees] Returning [] because loading/error/not array", { isLoadingEmployees, isErrorEmployees, isArray: Array.isArray(employeesData) });
            return [];
        }
        try {
            // Chỉ lọc theo search term, bỏ lọc theo role
            const result = employeesData.filter(emp => {
                const hoTen = emp?.hoTen ?? ''; // Dữ liệu API có hoTen
                const searchTerm = employeeSearchTerm.toLowerCase();
                const nameLower = hoTen.toLowerCase();
                return nameLower.includes(searchTerm);
            });
            return result;
        } catch (filterError) {
            console.error("Lỗi khi filter employees:", filterError, employeesData);
            return [];
        }
    }, [employeesData, isLoadingEmployees, isErrorEmployees, employeeSearchTerm])

    // Xử lý chọn nhân viên
    const handleSelectEmployee = (id) => {
        setSelectedEmployeeId(id);
        setActiveTab('assign'); // Luôn quay về tab 'assign' khi chọn nhân viên mới
        setRoomSearchTerm('');
    };

    // Xử lý check/uncheck phòng
    const handleToggleRoom = (roomId) => {
        setPendingAssignedRoomIds(prev => {
            const newPendingIds = new Set(prev);
            if (newPendingIds.has(roomId)) {
                newPendingIds.delete(roomId);
            } else {
                newPendingIds.add(roomId);
            }
            return newPendingIds;
        });
    };

    // Xử lý Lưu thay đổi
    const handleSaveChanges = () => {
        if (!selectedEmployeeId) return;
        saveAssignmentMutation.mutate();
    };

    // Lấy selectedEmployee từ employeesData đã fetch thành công
    const selectedEmployee = useMemo(() => {
        if (!selectedEmployeeId || !Array.isArray(employeesData)) return null;
        const found = employeesData.find(e => e.id === selectedEmployeeId);
        return found || null;
    }, [employeesData, selectedEmployeeId]);

    const handleRemoveSingleRoom = (roomId) => {
        if (!selectedEmployeeId) return;
        if (window.confirm(`Bạn có chắc muốn xóa phân công phòng này khỏi nhân viên ${selectedEmployee?.hoTen}?`)) {
            removeSingleAssignmentMutation.mutate({ employeeId: selectedEmployeeId, roomId });
        }
    };
    return (
        <div className="container grid h-full grid-cols-1 gap-4 p-4 mx-auto md:grid-cols-3">
            {/* Cột trái: Danh sách nhân viên */}
            <div className="flex flex-col h-full p-4 overflow-hidden border rounded">
                <h2 className="mb-2 text-lg font-semibold shrink-0">Chọn Nhân Viên</h2>
                <input
                    type="text"
                    placeholder="Tìm nhân viên..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="w-full p-2 mb-2 border rounded shrink-0"
                    disabled={isLoadingEmployees}
                />
                {isLoadingEmployees && <p className="flex-grow text-center text-gray-500">Đang tải nhân viên...</p>}
                {isErrorEmployees && <p className="flex-grow text-center text-red-500">Lỗi tải nhân viên!</p>}
                {!isLoadingEmployees && !isErrorEmployees && (
                    <ul className="flex-grow overflow-y-auto">
                        {filteredEmployees.length === 0 && <li className="p-2 text-gray-500">Không tìm thấy nhân viên.</li>}
                        {filteredEmployees.map(emp => (
                            <li key={emp.id}
                                className={`p-2 border-b border-gray-100 cursor-pointer rounded ${selectedEmployeeId === emp.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                                onClick={() => handleSelectEmployee(emp.id)}
                            >
                                <div className="font-medium">{emp?.hoTen || `Nhân viên ${emp?.id}`}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Cột phải: Tab Phân công / Xem phân công */}
            <div className="flex flex-col h-full p-4 overflow-hidden border rounded md:col-span-2">
                <h2 className="mb-2 text-lg font-semibold shrink-0">
                    Thông tin Phân Công {selectedEmployee ? `cho ${selectedEmployee.hoTen}` : ''}
                </h2>
                {selectedEmployeeId ? (
                    <>
                        {/* Tab Navigation */}
                        <div className="flex border-b shrink-0">
                            <button
                                onClick={() => setActiveTab('assign')}
                                className={`px-4 py-2 ${activeTab === 'assign' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                            >
                                Phân công phòng
                            </button>
                            <button
                                onClick={() => setActiveTab('view')}
                                className={`px-4 py-2 ${activeTab === 'view' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                            >
                                Xem phòng đã phân công
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex flex-col flex-grow mt-2 overflow-hidden">
                            {activeTab === 'assign' && (
                                <AssignRoomsTab
                                    key={selectedEmployeeId || 'assign-tab-none'}
                                    allRoomsData={allRoomsData}
                                    isLoadingAllRooms={isLoadingAllRooms}
                                    isErrorAllRooms={isErrorAllRooms}
                                    roomSearchTerm={roomSearchTerm}
                                    setRoomSearchTerm={setRoomSearchTerm}
                                    pendingAssignedRoomIds={pendingAssignedRoomIds}
                                    handleToggleRoom={handleToggleRoom}
                                    isLoadingAssignedRooms={isLoadingAssignedRooms}
                                    saveAssignmentMutation={saveAssignmentMutation}
                                    handleSaveChanges={handleSaveChanges}
                                />
                            )}
                            {activeTab === 'view' && (
                                <ViewAssignedRoomsTab
                                    key={selectedEmployeeId ? `view-${selectedEmployeeId}` : 'view-tab-none'}
                                    assignedRoomsData={assignedRoomsData}
                                    isLoadingAssignedRooms={isLoadingAssignedRooms}
                                    selectedEmployee={selectedEmployee}
                                    handleRemoveSingleRoom={handleRemoveSingleRoom}
                                    isRemoving={removeSingleAssignmentMutation.isPending}
                                />
                            )}
                        </div>
                    </>
                ) : (
                    <p className="flex items-center justify-center flex-grow text-center text-gray-500">
                        Vui lòng chọn một nhân viên để xem hoặc phân công.
                    </p>
                )}
            </div>
        </div>
    );
};

export default PhanCongKhuVuc;