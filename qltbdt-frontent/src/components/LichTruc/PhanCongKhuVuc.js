// import React, { useState } from 'react';
// import { FaClock, FaUser, FaEdit, FaSave, FaSearch } from 'react-icons/fa';

// const PhanViTri = () => {
//     //    const [setSelectedDate] = useState(new Date());
//     const [searchTerm, setSearchTerm] = useState('');
//     const [filterCriteria, setFilterCriteria] = useState('all');

//     const shiftAssignments = [
//         {
//             id: 1,
//             date: new Date(),
//             startTime: '09:00',
//             endTime: '17:00',
//             employee: {
//                 name: 'John Doe',
//                 photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
//                 role: 'Nhân Viên',
//                 contact: 'john.doe@example.com'
//             },
//             status: 'Chờ Phân Ca',
//             notes: 'Có 3 Thiết Bị Cần Bảo Hành, 2 Thiết Bị Đã Được Sửa'
//         },
//         {
//             id: 2,
//             date: new Date(),
//             startTime: '10:00',
//             endTime: '18:00',
//             employee: {
//                 name: 'Jane Smith',
//                 photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
//                 role: 'Nhân Viên',
//                 contact: 'jane.smith@example.com'
//             },
//             status: 'Đang Làm Việc',
//             notes: 'Chưa Có'
//         },
//     ];

//     // const handleDateChange = (date) => {
//     //     setSelectedDate(date);
//     // };

//     const handleSearch = (e) => {
//         setSearchTerm(e.target.value);
//     };

//     const handleFilterChange = (criteria) => {
//         setFilterCriteria(criteria);
//     };

//     const filteredAssignments = shiftAssignments.filter((assignment) => {
//         const matchesSearch = assignment.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//             assignment.notes.toLowerCase().includes(searchTerm.toLowerCase());
//         const matchesFilter = filterCriteria === 'all' || assignment.status === filterCriteria;
//         return matchesSearch && matchesFilter;
//     });

//     return (
//         <div className="container p-4 mx-auto">
//             {/* Navigation and Filters */}
//             <div className="flex flex-wrap items-center justify-between mb-6">
//                 <div className="flex space-x-4">
//                     <div className="relative">
//                         <input
//                             type="text"
//                             placeholder="Tìm Kiếm..."
//                             className="py-2 pl-10 pr-4 border rounded-full"
//                             value={searchTerm}
//                             onChange={handleSearch}
//                         />
//                         <FaSearch className="absolute text-gray-400 left-3 top-3" />
//                     </div>
//                     <select
//                         className="px-4 py-2 border rounded-full"
//                         value={filterCriteria}
//                         onChange={(e) => handleFilterChange(e.target.value)}
//                     >
//                         <option value="all">Tất Cả Trạng Thái</option>
//                         <option value="Chờ Phân Ca">Chờ Phân Ca</option>
//                         <option value="Đang Làm Việc">Đang Làm Việc</option>
//                     </select>
//                 </div>
//             </div>


//             {/* Shift Assignments */}
//             <div className="space-y-6">
//                 {filteredAssignments.map((assignment) => (
//                     <div key={assignment.id} className="p-6 transition duration-300 ease-in-out transform bg-white rounded-lg shadow-lg hover:scale-105">
//                         <div className="flex flex-wrap items-center justify-between mb-4">
//                             <div className="flex items-center mb-4 space-x-4 sm:mb-0">
//                                 <img
//                                     src={assignment.employee.photo}
//                                     alt={assignment.employee.name}
//                                     className="w-12 h-12 rounded-full"
//                                 />
//                                 <div>
//                                     <h2 className="text-xl font-semibold">{assignment.employee.name}</h2>
//                                     <p className="text-gray-600">{assignment.employee.role}</p>
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="flex items-center mb-4 space-x-2">
//                             <FaClock className="text-gray-400" />
//                             <span>{assignment.startTime} - {assignment.endTime}</span>
//                         </div>
//                         <div className="flex items-center mb-4 space-x-2">
//                             <FaUser className="text-gray-400" />
//                             <span>{assignment.employee.contact}</span>

//                         </div>
//                         <div className="mb-4">
//                             <span className={`px-3 py-1 rounded-full text-sm font-semibold ${{
//                                 'Đang Làm Việc': 'bg-blue-200 text-blue-800',
//                                 'Chờ Phân Ca': 'bg-green-200 text-green-800'
//                             }[assignment.status]}`}>
//                                 {assignment.status}
//                             </span>
//                         </div>
//                         <div className="mb-4">
//                             <div className='w-1/2 grid-cols-1'>
//                                 <h3 className="mb-2 text-lg font-semibold">Báo cáo công việc</h3>
//                                 <div className="p-3 bg-gray-100 rounded">
//                                     <p>{assignment.notes}</p>
//                                 </div>
//                             </div>
//                         </div>
//                         <div className="flex justify-start space-x-2">
//                             <button className="px-4 py-2 text-white transition duration-300 bg-blue-500 rounded hover:bg-blue-600">
//                                 <FaEdit className="inline-block mr-2" />
//                                 Phân Ca
//                             </button>
//                             <button className="px-4 py-2 text-white transition duration-300 bg-green-500 rounded hover:bg-green-600">
//                                 <FaSave className="inline-block mr-2" />
//                                 Lưu Lịch
//                             </button>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default PhanViTri;


import React, { useState, useEffect, useMemo } from 'react';
import { fetchNhanVien, fetchAllRooms, fetchAssignedRooms, addAssignedRooms, removeAssignedRooms } from '../../api';

const PhanCongKhuVuc = () => {
    const [employees, setEmployees] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [assignedRoomIds, setAssignedRoomIds] = useState(new Set()); // Dùng Set để dễ kiểm tra và cập nhật
    const [pendingAssignedRoomIds, setPendingAssignedRoomIds] = useState(new Set()); // Lưu thay đổi tạm thời

    const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
    const [roomSearchTerm, setRoomSearchTerm] = useState('');
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch danh sách nhân viên khi mount
    useEffect(() => {
        // 2. Gọi hàm đã import
        fetchNhanVien()
            .then(res => {
                if (Array.isArray(res.data)) {
                    setEmployees(res.data);
                }
            })
            .catch(err => console.error("Lỗi tải nhân viên:", err.response?.data || err.message));

        // Fetch danh sách tất cả phòng khi mount
        fetchAllRooms()
            .then(res => {
                 if (Array.isArray(res.data)) {
                    setAllRooms(res.data);
                 }
            })
            .catch(err => console.error("Lỗi tải phòng:", err.response?.data || err.message));
    }, []);

 // Fetch phòng được gán khi chọn nhân viên khác
 useEffect(() => {
    if (!selectedEmployeeId) {
        setAssignedRoomIds(new Set());
        setPendingAssignedRoomIds(new Set());
        return;
    }

    setIsLoadingRooms(true);
    // 2. Gọi hàm đã import
    fetchAssignedRooms(selectedEmployeeId)
        .then(res => {
             // Giả sử API trả về mảng các object { phong_id: ... } hoặc chỉ mảng các ID
             // Cần kiểm tra cấu trúc res.data thực tế từ API của bạn
             if (Array.isArray(res.data)) {
                 const initialIds = new Set(res.data.map(item => item.phong_id || item)); // Lấy ID phòng
                 setAssignedRoomIds(initialIds);
                 setPendingAssignedRoomIds(initialIds);
             } else {
                 console.error("API phòng được gán không trả về mảng:", res.data);
                 setAssignedRoomIds(new Set());
                 setPendingAssignedRoomIds(new Set());
             }
        })
        .catch(err => {
            console.error("Lỗi tải phòng được gán:", err.response?.data || err.message);
            setAssignedRoomIds(new Set());
            setPendingAssignedRoomIds(new Set());
        })
        .finally(() => setIsLoadingRooms(false));

}, [selectedEmployeeId]);

    // Lọc nhân viên
    const filteredEmployees = useMemo(() => {
        return employees.filter(emp =>
            emp.hoTen.toLowerCase().includes(employeeSearchTerm.toLowerCase())
        );
    }, [employees, employeeSearchTerm]);

    // Lọc phòng
    const filteredRooms = useMemo(() => {
        return allRooms.filter(room =>
            room.phong.toLowerCase().includes(roomSearchTerm.toLowerCase())
            // Thêm điều kiện lọc theo tòa, tầng nếu cần
        );
    }, [allRooms, roomSearchTerm]);

    // Xử lý chọn nhân viên
    const handleSelectEmployee = (id) => {
        setSelectedEmployeeId(id);
    };

    // Xử lý check/uncheck phòng
    const handleToggleRoom = (roomId) => {
        const newPendingIds = new Set(pendingAssignedRoomIds);
        if (newPendingIds.has(roomId)) {
            newPendingIds.delete(roomId);
        } else {
            newPendingIds.add(roomId);
        }
        setPendingAssignedRoomIds(newPendingIds);
    };

 // Xử lý Lưu thay đổi
 const handleSaveChanges = async () => {
    if (!selectedEmployeeId || isSaving) return;

    setIsSaving(true);
    const addedRoomIds = [...pendingAssignedRoomIds].filter(id => !assignedRoomIds.has(id));
    const removedRoomIds = [...assignedRoomIds].filter(id => !pendingAssignedRoomIds.has(id));

    try {
        const promises = [];
        if (addedRoomIds.length > 0) {
            // 2. Gọi hàm đã import
            promises.push(addAssignedRooms(selectedEmployeeId, addedRoomIds));
        }
        if (removedRoomIds.length > 0) {
             // 2. Gọi hàm đã import
             promises.push(removeAssignedRooms(selectedEmployeeId, removedRoomIds));
        }

        await Promise.all(promises);

        setAssignedRoomIds(new Set(pendingAssignedRoomIds));
        alert('Cập nhật phân công thành công!');

    } catch (error) {
        console.error("Lỗi lưu phân công:", error.response?.data || error.message);
        alert('Lỗi khi lưu phân công. Vui lòng thử lại.');
    } finally {
        setIsSaving(false);
    }
};


    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

    return (
        <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-theme.header.height)]">
            {/* Cột trái: Danh sách nhân viên */}
            <div className="p-4 overflow-y-auto border rounded">
                <h2 className="mb-2 text-lg font-semibold">Chọn Nhân Viên</h2>
                <input
                    type="text"
                    placeholder="Tìm nhân viên..."
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    className="w-full p-2 mb-2 border rounded"
                />
                <ul>
                    {filteredEmployees.map(emp => (
                        <li key={emp.id}
                            className={`p-2 cursor-pointer rounded ${selectedEmployeeId === emp.id ? 'bg-blue-200' : 'hover:bg-gray-100'}`}
                            onClick={() => handleSelectEmployee(emp.id)}
                        >
                            {emp.hoTen}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Cột phải: Danh sách phòng */}
            <div className="flex flex-col p-4 overflow-y-auto border rounded md:col-span-2">
                 <h2 className="mb-2 text-lg font-semibold">
                     Phân Công Phòng {selectedEmployee ? `cho ${selectedEmployee.hoTen}` : ''}
                 </h2>
                {selectedEmployeeId ? (
                    <>
                        <input
                            type="text"
                            placeholder="Tìm phòng..."
                            value={roomSearchTerm}
                            onChange={(e) => setRoomSearchTerm(e.target.value)}
                            className="w-full p-2 mb-2 border rounded"
                        />
                        {isLoadingRooms ? (
                            <p>Đang tải danh sách phòng...</p>
                        ) : (
                             <div className="flex-grow pr-2 mb-2 overflow-y-auto"> {/* Cho phép list phòng cuộn */}
                                {filteredRooms.map(room => (
                                    <div key={room.id} className="flex items-center p-1 mb-1 hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            id={`room-${room.id}`}
                                            checked={pendingAssignedRoomIds.has(room.id)}
                                            onChange={() => handleToggleRoom(room.id)}
                                            className="mr-2"
                                        />
                                        <label htmlFor={`room-${room.id}`}>{room.phong}</label> {/* Hiển thị tên phòng */}
                                    </div>
                                ))}
                             </div>
                        )}
                         <button
                            onClick={handleSaveChanges}
                            disabled={isSaving || isLoadingRooms}
                            className="px-4 py-2 mt-auto text-white bg-green-500 rounded hover:bg-green-600 disabled:bg-gray-400"
                         >
                            {isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                         </button>
                    </>
                ) : (
                    <p className="text-gray-500">Vui lòng chọn một nhân viên để xem và chỉnh sửa phân công.</p>
                )}
            </div>
        </div>
    );
};

export default PhanCongKhuVuc; // Đổi tên component