// import axios from "axios";
// import { useState, useEffect } from "react";
// import eventBus from "../../utils/eventBus";
// import { FaChevronDown, FaChevronUp } from "react-icons/fa";
// import moment from "moment";

// const ThongTinBaoHong = () => {
//     const [baoHongList, setBaoHongList] = useState([]);
//     const [filteredBaoHongList, setFilteredBaoHongList] = useState([]);
//     const [expandedRows, setExpandedRows] = useState([]);
//     const [phongList, setPhongList] = useState([]);
//     const [filter, setFilter] = useState({
//         phong_id: "",
//         loaithiethai: "",
//         thiethai: "",
//         dateOrder: "newest", // Giá trị mặc định: mới nhất
//     });
//     const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
//     const rowsPerPage = 10; // Số hàng mỗi trang

//     const refreshData = () => {
//         // Gọi API lấy thông tin báo hỏng
//         const config = {withCredentials:true};
//         axios.get("http://localhost:5000/api/baohong", config)
//             .then((response) => {
//                 setBaoHongList(response.data); // Lưu dữ liệu vào state
//                 setFilteredBaoHongList(response.data); // Sao chép danh sách để lọc
//             })
//             .catch((error) => {
//                 console.error("Lỗi khi tải thông tin báo hỏng:", error);
//             });

//         // Gọi API lấy danh sách phòng
//         axios.get("http://localhost:5000/api/phong/phonglist", config)
//             .then((response) => {
//                 setPhongList(response.data); // Lưu danh sách phòng vào state
//             })
//             .catch((error) => {
//                 console.error("Lỗi khi tải danh sách phòng:", error);
//             });
//     };

//     useEffect(() => {
//         refreshData();

//         const handleBaoHongSubmitted = () => {
//             refreshData();
//         };

//         eventBus.on('baoHongSubmitted', handleBaoHongSubmitted);

//         return () => {
//             eventBus.off('baoHongSubmitted', handleBaoHongSubmitted);
//         };
//     }, []);

//     // Xử lý thay đổi bộ lọc
//     const [sortOrder, setSortOrder] = useState(null); // Trạng thái mặc định: chưa sắp xếp
//     const handleFilterChange = (e, sortOrder = null) => {
//         const updatedFilter = sortOrder
//             ? { ...filter, dateOrder: sortOrder }
//             : { ...filter, [e.target.name]: e.target.value };

//         setFilter(updatedFilter);

//         let filtered = baoHongList.filter((item) => {
//             const ngayBaoHong = moment(item.ngayBaoHong).format("YYYY-MM-DD"); // Dùng Moment.js để chuẩn hóa định dạng ngày
//             const specificDate = updatedFilter.specificDate;

//             return (
//                 (updatedFilter.phong_id === "" || item.phong_id === parseInt(updatedFilter.phong_id)) &&
//                 (updatedFilter.loaithiethai === "" || item.loaithiethai === updatedFilter.loaithiethai) &&
//                 (updatedFilter.thiethai === "" || item.thiethai === updatedFilter.thiethai) &&
//                 (specificDate === "" || ngayBaoHong === specificDate) // So sánh ngày
//             );
//         });

//         // Sắp xếp theo thứ tự ngày
//         filtered.sort((a, b) => {
//             const dateA = moment(a.ngayBaoHong);
//             const dateB = moment(b.ngayBaoHong);

//             return updatedFilter.dateOrder === "newest"
//                 ? dateB - dateA // Mới nhất trước
//                 : dateA - dateB; // Cũ nhất trước
//         });

//         setFilteredBaoHongList(filtered);
//         setCurrentPage(1); // Đặt lại trang về trang đầu
//     };


//     // Xử lý toggle hiển thị bảng con
//     const toggleRow = (id) => {
//         if (expandedRows.includes(id)) {
//             setExpandedRows(expandedRows.filter((row) => row !== id));
//         } else {
//             setExpandedRows([...expandedRows, id]);
//         }
//     };

//     // Xử lý check box 
//     const [selectAll, setSelectAll] = useState(false); // Trạng thái chọn tất cả
//     const [selectedRows, setSelectedRows] = useState([]); // Danh sách các dòng được chọn

//     // Hàm toggle trạng thái tất cả
//     const handleSelectAll = () => {
//         if (selectAll) {
//             // Xóa toàn bộ danh sách được chọn
//             setSelectedRows([]);
//         } else {
//             // Chọn tất cả các dòng hiện tại
//             const allRowIds = currentRows.map((item) => item.id); // Đảm bảo lấy tất cả ID từ currentRows
//             setSelectedRows(allRowIds);
//         }
//         setSelectAll(!selectAll); // Toggle trạng thái nút
//     };

//     // Hàm toggle từng dòng
//     const toggleRowSelection = (id) => {
//         if (selectedRows.includes(id)) {
//             // Nếu ID đã có trong danh sách, xóa nó
//             setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
//         } else {
//             // Nếu ID chưa có, thêm nó vào danh sách
//             setSelectedRows([...selectedRows, id]);
//         }
//     };


//     // Phân trang
//     const indexOfLastRow = currentPage * rowsPerPage;
//     const indexOfFirstRow = indexOfLastRow - rowsPerPage;
//     const currentRows = filteredBaoHongList.slice(indexOfFirstRow, indexOfLastRow);

//     const totalPages = Math.ceil(filteredBaoHongList.length / rowsPerPage);

//     return (
//         <div className="flex flex-col w-full h-screen min-h-screen overflow-auto bg-white border-r shadow-md">
//             <div className={`bg-white shadow-md flex flex-col`}>
//                 <div className="flex items-center justify-between p-4 bg-white border-b">
//                     <h2 className="text-xl font-semibold">
//                         Thông Tin Báo Hỏng
//                     </h2>
//                 </div>
//             </div>
//             <div className="p-6 bg-white">
//                 {/* Dropdown lọc */}
//                 <div className="flex flex-wrap mb-4 gap-x-4 gap-y-4">
//                     {/* Dropdown Phòng */}
//                     <div className="w-44">
//                         <label className="block mb-1 text-sm font-medium">Phòng</label>
//                         <select
//                             name="phong_id"
//                             value={filter.phong_id}
//                             onChange={handleFilterChange}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                         >
//                             <option value="">Tất cả</option>
//                             {phongList.map((phong) => (
//                                 <option key={phong.id} value={phong.id}>
//                                     {phong.phong}
//                                 </option>
//                             ))}
//                         </select>
//                     </div>

//                     {/* Dropdown Loại Thiệt Hại */}
//                     <div className="w-44">
//                         <label className="block mb-1 text-sm font-medium">Loại Thiệt Hại</label>
//                         <select
//                             name="loaithiethai"
//                             value={filter.loaithiethai}
//                             onChange={handleFilterChange}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                         >
//                             <option value="">Tất cả</option>
//                             <option value="Kết Cấu">Kết Cấu</option>
//                             <option value="Hệ Thống Điện">Hệ Thống Điện</option>
//                             <option value="Hệ Thống Nước">Hệ Thống Nước</option>
//                             <option value="Các Loại Thiết Bị">Các Loại Thiết Bị</option>
//                             <option value="Khác">Khác</option>
//                         </select>
//                     </div>

//                     {/* Dropdown Mức Độ */}
//                     <div className="w-44">
//                         <label className="block mb-1 text-sm font-medium">Mức Độ</label>
//                         <select
//                             name="thiethai"
//                             value={filter.thiethai}
//                             onChange={handleFilterChange}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                         >
//                             <option value="">Tất cả</option>
//                             <option value="Nhẹ">Nhẹ</option>
//                             <option value="Vừa">Vừa</option>
//                             <option value="Nặng">Nặng</option>
//                         </select>
//                     </div>

//                     {/* Dropdown Ngày */}
//                     <div className="w-44">
//                         <label className="block mb-1 text-sm font-medium">Chọn Ngày</label>
//                         <input
//                             type="date"
//                             name="specificDate"
//                             value={filter.specificDate}
//                             onChange={handleFilterChange}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-md"
//                         />
//                     </div>
//                 </div>

//                 {/* Bảng Dữ liệu */}
//                 <div className="overflow-y-auto" style={{ maxHeight: "1000px" }}>
//                     <table className="w-full border border-collapse border-gray-300">
//                         <thead>
//                             <tr className="bg-gray-100">
//                                 <th className="px-4 py-2 border">STT</th>
//                                 <th className="px-4 py-2 border">Phòng</th>
//                                 <th className="flex items-center justify-center px-2 py-2">
//                                     Ngày Báo Hỏng
//                                     {sortOrder === "oldest" ? (
//                                         <button
//                                             onClick={() => {
//                                                 setSortOrder("newest");
//                                                 handleFilterChange(null, "newest");
//                                             }}
//                                             className="ml-2 text-black hover:text-gray-600"
//                                             title="Mới nhất"
//                                         >

//                                             <FaChevronDown />
//                                         </button>
//                                     ) : (
//                                         <button
//                                             onClick={() => {
//                                                 setSortOrder("oldest");
//                                                 handleFilterChange(null, "oldest");
//                                             }}
//                                             className="ml-2 text-black hover:text-gray-600"
//                                             title="Cũ nhất"
//                                         >
//                                             <FaChevronUp />
//                                         </button>
//                                     )}
//                                 </th>
//                                 <th className="px-4 py-2 border">Loại Thiệt Hại</th>
//                                 <th className="px-4 py-2 border">Mức Độ</th>
//                                 <th className="px-4 py-2 border">Ưu Tiên</th>
//                                 <th className="px-4 py-2 border">
//                                     <div className="flex items-center justify-center">
//                                         <span>Chọn Tất Cả </span>
//                                         <input
//                                             type="checkbox"
//                                             checked={selectedRows.length === currentRows.length && currentRows.length > 0} // Đã chọn tất cả
//                                             onChange={handleSelectAll}
//                                             className="mx-2" // Thêm khoảng cách giữa checkbox và label
//                                         />
//                                     </div>
//                                 </th>
//                                 <th className="px-4 py-2 border">Người Xử Lý</th>
//                                 <th className="px-4 py-2 border">Hành Động</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {currentRows.map((item, index) => (
//                                 <>
//                                     {/* Bảng cha */}
//                                     <tr key={item.id} className="hover:bg-gray-50">
//                                         <td className="px-4 py-2 text-center border">{indexOfFirstRow + index + 1}</td>
//                                         <td className="px-4 py-2 border">{item.phong_name}</td>
//                                         <td className="px-4 py-2 border">
//                                             {moment(item.ngayBaoHong).format("DD/MM/YYYY HH:mm")}
//                                         </td>
//                                         <td className="px-4 py-2 border">{item.loaithiethai}</td>
//                                         <td className="px-4 py-2 border">{item.thiethai}</td>
//                                         <td className="px-4 py-2 text-center border">
//                                             <select value={item.mucDoUuTien} disabled>
//                                                 <option value="Trung Bình">Trung Bình</option>
//                                                 <option value="Cao">Cao</option>
//                                                 <option value="Thấp">Thấp</option>
//                                             </select>
//                                         </td>
//                                         <td className="px-4 py-2 text-center border">
//                                             {/* Checkbox cho mỗi dòng */}
//                                             <input
//                                                 type="checkbox"
//                                                 checked={selectedRows.includes(item.id)}
//                                                 onChange={() => toggleRowSelection(item.id)}
//                                             />
//                                         </td>
//                                         <td className="px-4 py-2 border">{item.nhanvien_id}</td>
//                                         <td className="grid grid-cols-3 px-4 py-2 text-center border">
//                                             {/* Nút Xem Chi Tiết */}
//                                             <div>
//                                                 <button
//                                                     onClick={() => toggleRow(item.id)}
//                                                     className="text-blue-500 hover:underline"
//                                                     title={expandedRows.includes(item.id) ? "Thu Gọn" : "Xem Chi Tiết"}
//                                                 >
//                                                     {expandedRows.includes(item.id) ? (
//                                                         <i className="fas fa-chevron-up"></i> // Icon Thu Gọn
//                                                     ) : (
//                                                         <i className="fas fa-chevron-down"></i> // Icon Xem Chi Tiết
//                                                     )}
//                                                 </button>
//                                             </div>

//                                             {/* Nút Xóa Đơn */}
//                                             <div>
//                                                 <button
//                                                     onClick={() => {
//                                                         // Hàm xử lý xóa đơn (tùy theo logic của bạn)
//                                                         console.log(`Xóa đơn với ID: ${item.id}`);
//                                                     }}
//                                                     className="text-red-500 hover:text-red-700"
//                                                     title="Xóa Đơn"
//                                                 >
//                                                     <i className="fas fa-trash-alt"></i> {/* Icon Xóa Đơn */}
//                                                 </button>
//                                             </div>

//                                             <div>
//                                                 {item.trangThai === "Chờ Duyệt" ? (
//                                                     <button className="px-2 py-2 text-sm text-white bg-green-500 rounded hover:bg-green-700">
//                                                         Duyệt
//                                                     </button>
//                                                 ) : (
//                                                     <span>{item.trangThai}</span>
//                                                 )}
//                                             </div>
//                                         </td>

//                                     </tr>

//                                     {/* Bảng con */}
//                                     {expandedRows.includes(item.id) && (
//                                         <tr>
//                                             <td colSpan={6} className="px-4 py-2 border">
//                                                 <div>
//                                                     <p><strong>Mô Tả:</strong> {item.moTa || "Không có mô tả"}</p>
//                                                     <p>
//                                                         <strong>Hình Ảnh:</strong>{" "}
//                                                         {item.hinhAnh ? (
//                                                             <img
//                                                                 src={item.hinhAnh}
//                                                                 alt="Thiệt Hại"
//                                                                 className="h-auto max-w-full mt-2 rounded-lg"
//                                                             />
//                                                         ) : (
//                                                             "Không có hình ảnh"
//                                                         )}
//                                                     </p>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     )}
//                                 </>
//                             ))}
//                         </tbody>
//                     </table>
//                     <div className="flex items-center justify-between mt-4">
//                         {/* Hiển thị trang hiện tại */}
//                         <div>
//                             Trang {currentPage}/{totalPages}
//                         </div>

//                         {/* Nút điều khiển phân trang */}
//                         <div className="flex space-x-2">
//                             <button
//                                 onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//                                 disabled={currentPage === 1}
//                                 className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
//                             >
//                                 Trước
//                             </button>
//                             <button
//                                 onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//                                 disabled={currentPage === totalPages}
//                                 className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
//                             >
//                                 Tiếp
//                             </button>
//                         </div>
//                     </div>

//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ThongTinBaoHong;


import React, { useState, useMemo, useEffect } from 'react';
import { FaChevronDown, FaChevronUp, FaEye, FaTrashAlt, FaUserCheck } from "react-icons/fa"; // Thêm icons
import moment from "moment";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Import các hàm API từ api.js
import {
    fetchBaoHongListAPI, // Đổi tên hàm fetchThongTinBaoHongAPI thành fetchBaoHongListAPI cho rõ nghĩa hơn (cần tạo/đổi tên trong api.js)
    fetchPhongList,
    fetchNhanVienList,
    deleteBaoHongAPI,
    updateBaoHongAPI
} from '../../api'; // Điều chỉnh đường dẫn

// Helper Components cho Badges (Ví dụ)
const StatusBadge = ({ status }) => {
    let colorClasses = 'bg-gray-100 text-gray-800'; // Chờ Duyệt
    if (status === 'Đang Xử Lý') {
        colorClasses = 'bg-blue-100 text-blue-800';
    } else if (status === 'Hoàn Thành') {
        colorClasses = 'bg-green-100 text-green-800';
    }
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
            {status}
        </span>
    );
};

const PriorityBadge = ({ priority }) => {
    let colorClasses = 'bg-yellow-100 text-yellow-800'; // Trung Bình
    if (priority === 'Cao') {
        colorClasses = 'bg-red-100 text-red-800';
    } else if (priority === 'Thấp') {
        colorClasses = 'bg-green-100 text-green-800';
    }
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
            {priority}
        </span>
    );
};


const ThongTinBaoHong = () => {
    // --- State ---
    const [expandedRows, setExpandedRows] = useState(new Set()); // Dùng Set hiệu quả hơn
    const [filter, setFilter] = useState({
        phong_id: "",
        loaithiethai: "",
        thiethai: "",
        trangThai: "", // Thêm filter trạng thái
        mucDoUuTien: "", // Thêm filter ưu tiên
        specificDate: "", // Thêm filter ngày cụ thể
        dateOrder: "newest",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [selectedRows, setSelectedRows] = useState(new Set()); // Dùng Set
    const [selectAll, setSelectAll] = useState(false);

    const queryClient = useQueryClient();

    // --- React Query Fetching ---
    const { data: baoHongList = [], isLoading: isLoadingBaoHong, isError: isErrorBaoHong } = useQuery({
        queryKey: ['baoHongList'],
        queryFn: fetchBaoHongListAPI // Sử dụng hàm API đã import
    });

    const { data: phongList = [], isLoading: isLoadingPhong } = useQuery({
        queryKey: ['phongListForFilter'], // Key khác để không trùng với query khác nếu có
        queryFn: fetchPhongList
    });

    const { data: nhanVienList = [], isLoading: isLoadingNhanVien } = useQuery({
        queryKey: ['nhanVienListForAssign'], // Key khác
        queryFn: fetchNhanVienList // API lấy danh sách nhân viên
    });

    // Tạo lookup maps bằng useMemo
    const phongMap = useMemo(() => {
        return new Map(phongList.map(p => [p.id, p.phong]));
    }, [phongList]);

    const nhanVienMap = useMemo(() => {
        return new Map(nhanVienList.map(nv => [nv.id, nv.hoTen]));
    }, [nhanVienList]);

    // --- Filtering and Sorting Logic ---
    const filteredAndSortedBaoHongList = useMemo(() => {
        let filtered = baoHongList;

        // Lọc theo các tiêu chí
        filtered = filtered.filter((item) => {
            const ngayBaoHong = moment(item.ngayBaoHong).format("YYYY-MM-DD");
            const specificDate = filter.specificDate;

            const phongMatch = filter.phong_id === "" || item.phong_id === parseInt(filter.phong_id);
            const loaiThietHaiMatch = filter.loaithiethai === "" || item.loaithiethai === filter.loaithiethai;
            const thietHaiMatch = filter.thiethai === "" || item.thiethai === filter.thiethai;
            const trangThaiMatch = filter.trangThai === "" || item.trangThai === filter.trangThai;
            const uuTienMatch = filter.mucDoUuTien === "" || item.mucDoUuTien === filter.mucDoUuTien;
            const dateMatch = !specificDate || ngayBaoHong === specificDate; // Nếu có specificDate thì mới lọc

            return phongMatch && loaiThietHaiMatch && thietHaiMatch && trangThaiMatch && uuTienMatch && dateMatch;
        });

        // Sắp xếp theo ngày
        filtered.sort((a, b) => {
            const dateA = moment(a.ngayBaoHong);
            const dateB = moment(b.ngayBaoHong);
            return filter.dateOrder === "newest" ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    }, [baoHongList, filter]);

    // --- Pagination Logic ---
    const totalPages = Math.ceil(filteredAndSortedBaoHongList.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = useMemo(() => {
        return filteredAndSortedBaoHongList.slice(indexOfFirstRow, indexOfLastRow);
    }, [filteredAndSortedBaoHongList, indexOfFirstRow, indexOfLastRow]);


    // --- Handlers ---
    const handleFilterChange = (e) => {
        setFilter(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1); // Reset về trang 1 khi filter
    };

    const handleDateSortChange = (sortOrder) => {
        setFilter(prev => ({ ...prev, dateOrder: sortOrder }));
        // Không cần setCurrentPage(1) vì chỉ đổi thứ tự
    };

    const toggleRow = (id) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Xử lý check box (Cần điều chỉnh để hoạt động đúng với Set và phân trang)
    useEffect(() => {
        // Kiểm tra xem tất cả các hàng *hiện tại* có được chọn không
        const allCurrentRowsSelected = currentRows.length > 0 && currentRows.every(item => selectedRows.has(item.id));
        setSelectAll(allCurrentRowsSelected);
    }, [selectedRows, currentRows]); // Chạy lại khi selectedRows hoặc currentRows thay đổi

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setSelectAll(isChecked);
        setSelectedRows(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (isChecked) {
                // Chọn tất cả các dòng đang hiển thị trên trang hiện tại
                currentRows.forEach(item => newSelected.add(item.id));
            } else {
                // Bỏ chọn tất cả các dòng đang hiển thị trên trang hiện tại
                currentRows.forEach(item => newSelected.delete(item.id));
            }
            return newSelected;
        });
    };

    const toggleRowSelection = (id) => {
        setSelectedRows(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    };

    // TODO: Implement Mutation Handlers for Assign, Update Status, Delete

    const deleteMutation = useMutation({
        mutationFn: deleteBaoHongAPI, // Hàm API sẽ được gọi với baoHongId
        onSuccess: () => {
            // Làm mới lại danh sách báo hỏng sau khi xóa thành công
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            alert('Xóa báo hỏng thành công!'); // Hoặc dùng thư viện toast/notification
        },
        onError: (error) => {
            console.error("Lỗi khi xóa báo hỏng:", error);
            alert('Lỗi khi xóa báo hỏng: ' + (error.response?.data?.error || error.message));
        }
    });

    const handleDelete = (baoHongId) => {
        if (window.confirm(`Bạn có chắc muốn xóa báo hỏng ID ${baoHongId}?`)) {
            // Gọi mutate của useMutation với ID cần xóa
            deleteMutation.mutate(baoHongId);
        }
    };

    const updateStatusMutation = useMutation({
        mutationFn: updateBaoHongAPI, // Gọi API update, nhận vào { id, updateData }
        onSuccess: (data, variables) => { // variables chứa { id, updateData } đã gửi đi
            // Làm mới lại danh sách báo hỏng
            queryClient.invalidateQueries({ queryKey: ['baoHongList'] });
            console.log(`Cập nhật trạng thái cho ID ${variables.id} thành công.`);
            // alert('Đã duyệt báo hỏng!'); // Có thể không cần alert
        },
        onError: (error, variables) => {
            console.error(`Lỗi khi cập nhật trạng thái cho ID ${variables.id}:`, error);
            alert('Lỗi khi duyệt báo hỏng: ' + (error.response?.data?.error || error.message));
        }
    });

    const handleApprove = (baoHongId) => {
        console.log("Approving Report ID:", baoHongId);
        // Chỉ cập nhật trạng thái thành 'Đang Xử Lý'
        // TODO: Sau này sẽ thêm logic chọn nhân viên và gán vào updateData
        const updateData = {
            trangThai: 'Đang Xử Lý'
            // nhanvien_id: selectedNhanVienId // Sẽ thêm sau
            // mucDoUuTien: selectedPriority // Sẽ thêm sau
        };
        updateStatusMutation.mutate({ id: baoHongId, updateData });
    };

    // --- Render ---
    const isLoading = isLoadingBaoHong || isLoadingPhong || isLoadingNhanVien;

    return (
        <div className="flex flex-col w-full h-screen min-h-screen overflow-auto bg-white border-r shadow-md">
            {/* Header */}
            <div className="flex flex-col bg-white shadow-md">
                <div className="flex items-center justify-between p-4 bg-white border-b">
                    <h2 className="text-xl font-semibold">Thông Tin Báo Hỏng</h2>
                    {/* TODO: Thêm nút cho Hành động hàng loạt */}
                    <div>
                        <button
                            className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 disabled:bg-gray-400"
                            disabled={selectedRows.size === 0}
                            onClick={() => console.log("TODO: Delete Selected Rows:", selectedRows)}
                        >
                            Xóa mục đã chọn ({selectedRows.size})
                        </button>
                        {/* Thêm nút gán hàng loạt nếu cần */}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 bg-white border-b">
                <div className="flex flex-wrap mb-4 gap-x-4 gap-y-4">
                    {/* Dropdown Phòng */}
                    <div className="w-44">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Phòng</label>
                        <select
                            name="phong_id"
                            value={filter.phong_id}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={isLoadingPhong}
                        >
                            <option value="">Tất cả</option>
                            {phongList.map((phong) => (
                                <option key={phong.id} value={phong.id}>{phong.phong}</option>
                            ))}
                        </select>
                    </div>
                    {/* Dropdown Loại Thiệt Hại */}
                    <div className="w-44">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Loại Thiệt Hại</label>
                        <select name="loaithiethai" value={filter.loaithiethai} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">Tất cả</option>
                            <option value="Kết Cấu">Kết Cấu</option>
                            <option value="Hệ Thống Điện">Hệ Thống Điện</option>
                            <option value="Hệ Thống Nước">Hệ Thống Nước</option>
                            <option value="Các Loại Thiết Bị">Các Loại Thiết Bị</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    {/* Dropdown Mức Độ Thiệt Hại */}
                    <div className="w-44">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Mức Độ</label>
                        <select name="thiethai" value={filter.thiethai} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">Tất cả</option>
                            <option value="Nhẹ">Nhẹ</option>
                            <option value="Vừa">Vừa</option>
                            <option value="Nặng">Nặng</option>
                        </select>
                    </div>
                    {/* Dropdown Trạng Thái */}
                    <div className="w-44">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Trạng Thái</label>
                        <select name="trangThai" value={filter.trangThai} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">Tất cả</option>
                            <option value="Chờ Duyệt">Chờ Duyệt</option>
                            <option value="Đang Xử Lý">Đang Xử Lý</option>
                            <option value="Hoàn Thành">Hoàn Thành</option>
                        </select>
                    </div>
                    {/* Dropdown Ưu Tiên */}
                    <div className="w-44">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Ưu Tiên</label>
                        <select name="mucDoUuTien" value={filter.mucDoUuTien} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="">Tất cả</option>
                            <option value="Cao">Cao</option>
                            <option value="Trung Bình">Trung Bình</option>
                            <option value="Thấp">Thấp</option>
                        </select>
                    </div>
                    {/* Lọc Ngày Cụ Thể */}
                    <div className="w-44">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Ngày Báo</label>
                        <input type="date" name="specificDate" value={filter.specificDate || ''} onChange={handleFilterChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-grow p-4 overflow-x-auto">
                {isLoading && <p className="text-center text-gray-500">Đang tải dữ liệu báo hỏng...</p>}
                {isErrorBaoHong && <p className="text-center text-red-500">Lỗi khi tải dữ liệu báo hỏng!</p>}
                {!isLoading && !isErrorBaoHong && (
                    <>
                        <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 300px)" }}> {/* Giới hạn chiều cao bảng */}
                            <table className="min-w-full border border-collapse border-gray-300 divide-y divide-gray-200">
                                <thead className="sticky top-0 bg-gray-100"> {/* Header cố định */}
                                    <tr>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">
                                            <input
                                                type="checkbox"
                                                title='Chọn tất cả trang này'
                                                checked={selectAll}
                                                onChange={handleSelectAll}
                                                disabled={currentRows.length === 0}
                                            />
                                        </th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">STT</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Phòng</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">
                                            <div className='flex items-center'>
                                                Ngày Báo
                                                {/* Nút Sắp xếp */}
                                                {filter.dateOrder === "oldest" ? (
                                                    <button onClick={() => handleDateSortChange("newest")} className="ml-1 text-gray-600 hover:text-gray-900" title="Sắp xếp mới nhất"> <FaChevronDown /> </button>
                                                ) : (
                                                    <button onClick={() => handleDateSortChange("oldest")} className="ml-1 text-gray-600 hover:text-gray-900" title="Sắp xếp cũ nhất"> <FaChevronUp /> </button>
                                                )}
                                            </div>
                                        </th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Loại Thiệt Hại</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Mức Độ</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Ưu Tiên</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Trạng Thái</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border">Người Xử Lý</th>
                                        <th className="px-3 py-2 text-xs font-medium tracking-wider text-center text-gray-500 uppercase border">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentRows.length === 0 && (
                                        <tr><td colSpan="10" className="px-4 py-4 text-center text-gray-500 border">Không có dữ liệu báo hỏng phù hợp.</td></tr>
                                    )}
                                    {currentRows.map((item, index) => (
                                        <React.Fragment key={item.id}>
                                            <tr className={`hover:bg-gray-50 ${expandedRows.has(item.id) ? 'bg-gray-50' : ''}`}>
                                                <td className="px-3 py-2 text-center border whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRows.has(item.id)}
                                                        onChange={() => toggleRowSelection(item.id)}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{indexOfFirstRow + index + 1}</td>
                                                {/* Hiển thị Tên Phòng */}
                                                <td className="px-3 py-2 text-sm font-medium text-gray-900 border whitespace-nowrap">{phongMap.get(item.phong_id) || `ID: ${item.phong_id}`}</td>
                                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{moment(item.ngayBaoHong).format("DD/MM/YYYY HH:mm")}</td>
                                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{item.loaithiethai}</td>
                                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{item.thiethai}</td>
                                                {/* Hiển thị Badge Ưu tiên */}
                                                <td className="px-3 py-2 text-center border whitespace-nowrap"><PriorityBadge priority={item.mucDoUuTien} /></td>
                                                {/* Hiển thị Badge Trạng thái */}
                                                <td className="px-3 py-2 text-center border whitespace-nowrap"><StatusBadge status={item.trangThai} /></td>
                                                {/* Hiển thị Tên Người xử lý */}
                                                <td className="px-3 py-2 text-sm text-gray-500 border whitespace-nowrap">{nhanVienMap.get(item.nhanvien_id) || (item.trangThai !== 'Chờ Duyệt' ? 'Chưa gán' : '')}</td>
                                                {/* Hành động */}
                                                <td className="px-3 py-2 text-sm font-medium text-center border whitespace-nowrap">
                                                    <div className='flex items-center justify-center space-x-2'>
                                                        {/* Nút Xem Chi Tiết */}
                                                        <button onClick={() => toggleRow(item.id)} className="text-gray-600 hover:text-indigo-900" title={expandedRows.has(item.id) ? "Thu gọn" : "Xem chi tiết"}>
                                                            <FaEye />
                                                        </button>
                                                        {/* Nút Gán/Duyệt */}
                                                        {item.trangThai === 'Chờ Duyệt' && (
                                                            <button
                                                                onClick={() => handleApprove(item.id)} // Đổi tên hàm xử lý
                                                                className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                                title="Duyệt (Chuyển sang Đang Xử Lý)"
                                                                disabled={updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id} // Disable khi đang cập nhật mục này
                                                            >
                                                                {updateStatusMutation.isPending && updateStatusMutation.variables?.id === item.id ? (
                                                                    <svg className="w-4 h-4 animate-spin" /* SVG spinner */ ></svg>
                                                                ) : (
                                                                    <FaUserCheck />
                                                                )}
                                                            </button>
                                                        )}
                                                        {/* Nút Sửa (Có thể thêm sau nếu cần sửa thông tin báo hỏng) */}
                                                        {/* <button onClick={() => console.log("TODO: Edit", item.id)} className="text-yellow-600 hover:text-yellow-900" title="Sửa">
                                                             <FaWrench />
                                                         </button> */}
                                                        {/* Nút Xóa */}
                                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900" title="Xóa">
                                                            <FaTrashAlt />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Bảng con hiển thị chi tiết */}
                                            {expandedRows.has(item.id) && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan="10" className="px-6 py-3 border">
                                                        <div className='text-sm text-gray-700'>
                                                            <p><strong>Mô Tả:</strong> {item.moTa || "Không có mô tả"}</p>
                                                            {/* TODO: Hiển thị tên thiết bị nếu có */}
                                                            {/* <p><strong>Thiết bị:</strong> {thietBiMap.get(item.thietbi_id) || 'Không xác định'}</p> */}
                                                            <p className="mt-2"><strong>Hình Ảnh:</strong></p>
                                                            {item.hinhAnh ? (
                                                                <img src={item.hinhAnh} alt="Hình ảnh báo hỏng" className="object-contain mt-1 border rounded max-h-60" />
                                                            ) : (
                                                                <span className='italic'>Không có hình ảnh</span>
                                                            )}
                                                            {/* TODO: Thêm phần hiển thị Log Bảo trì (từ bảng baotri) */}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4">
                            <div>Trang {currentPage}/{totalPages} (Tổng cộng {filteredAndSortedBaoHongList.length} mục)</div>
                            <div className="flex space-x-2">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-300">Trước</button>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-300">Tiếp</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ThongTinBaoHong;