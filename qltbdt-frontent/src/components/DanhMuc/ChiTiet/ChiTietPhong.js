import { useState, useEffect } from "react";
import { maxTangTheoToa, getTinhTrangLabel } from "../../../utils/constants";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BsTrash, BsSearch } from "react-icons/bs";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import {
    fetchPhongDetail,
    fetchThietBiTrongPhong,
    updatePhongAPI,
    deletePhongAPI,
    removeThietBiFromPhongAPI
} from "../../../api";

const ChiTietPhong = ({ record, onClose }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [editData, setEditData] = useState(record);
    const [isEditing, setIsEditing] = useState(false);
    const [expandedRows, setExpandedRows] = useState([]);

    const queryClient = useQueryClient();
    // --- Fetch dữ liệu chi tiết phòng bằng useQuery ---
    // Sử dụng record.id làm phần phụ thuộc của queryKey
    const { data: phongDetailData, isLoading: isLoadingPhong, isError: isErrorPhong, error: errorPhong } = useQuery({
        queryKey: ['phong', record?.id],
        queryFn: () => fetchPhongDetail(record.id),
        enabled: !!record?.id,
        onSuccess: (data) => {
            if (!isEditing) {
                setEditData(data);
            }
        }
    });

    // --- Fetch danh sách thiết bị trong phòng bằng useQuery ---
    const { data: thietBiListData = [], isLoading: isLoadingThietBi, isError: isErrorThietBi, error: errorThietBi } = useQuery({
        queryKey: ['phong', record?.id, 'thietbi'], // Key riêng cho thiết bị của phòng này
        queryFn: () => fetchThietBiTrongPhong(record.id),
        enabled: !!record?.id // Chỉ fetch khi có record.id
    });
    // -----------------------------------------------------

    // --- Mutations ---
    const updatePhongMutation = useMutation({
        mutationFn: updatePhongAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['phong', record.id] }); // Invalidate chi tiết
            queryClient.invalidateQueries({ queryKey: ['phong'] }); // Invalidate danh sách
            alert("Cập nhật phòng thành công!");
            setIsEditing(false);
            // onClose(); // Có thể giữ lại hoặc để người dùng tự đóng
        },
        onError: (error) => {
            console.error("Lỗi cập nhật phòng:", error);
            alert("Cập nhật phòng thất bại!");
        }
    });

    const deletePhongMutation = useMutation({
        mutationFn: deletePhongAPI,
        onSuccess: (data) => { // `data` là response từ API (chứa message)
            queryClient.invalidateQueries({ queryKey: ['phong'] }); // Invalidate danh sách
            queryClient.removeQueries({ queryKey: ['phong', record.id] }); // Xóa cache chi tiết
            queryClient.removeQueries({ queryKey: ['phong', record.id, 'thietbi'] }); // Xóa cache thiết bị phòng đó
            alert(data.message || "Xóa phòng thành công!");
            onClose(); // Đóng panel sau khi xóa
        },
        onError: (error) => {
            console.error("Lỗi xóa phòng:", error);
            alert(`Xóa phòng thất bại: ${error.response?.data?.error || error.message}`);
        }
    });

    const removeThietBiMutation = useMutation({
        mutationFn: removeThietBiFromPhongAPI,
        onSuccess: (data, variables) => { // variables chứa payload đã gửi đi ({ phong_id, thongtinthietbi_id })
            queryClient.invalidateQueries({ queryKey: ['phong', record.id, 'thietbi'] }); // Làm mới danh sách TB phòng này
            queryClient.invalidateQueries({ queryKey: ['phong'] }); // Làm mới danh sách phòng (cập nhật count)
            queryClient.invalidateQueries({ queryKey: ['thietBiConLai'] }); // Làm mới tồn kho
            alert(data.message || "Gỡ thiết bị khỏi phòng thành công!");
            // Không cần cập nhật state local nữa
        },
        onError: (error) => {
            console.error("Lỗi khi gỡ thiết bị:", error);
            alert(`Gỡ thiết bị thất bại: ${error.response?.data?.error || error.message}`);
        }
    });
    // -----------------

    // Cập nhật editData khi record prop thay đổi (khi người dùng chọn phòng khác)
    useEffect(() => {
        if (record && !isEditing) {
            setEditData(record);
        }
    }, [record, isEditing]);

    // Cập nhật dữ liệu khi người dùng thay đổi giá trị input
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData({ ...editData, [name]: value });
    };

    // Bật/Tắt chế độ chỉnh sửa
    const toggleEdit = () => {
        setIsEditing((prev) => !prev);
        if (!isEditing && phongDetailData) { // Nếu bật edit, lấy data mới nhất từ query
            setEditData(phongDetailData);
        } else if (isEditing && phongDetailData) { // Nếu tắt edit, quay lại data từ query
            setEditData(phongDetailData);
        }
    };

    const handleCancel = () => {
        if (phongDetailData) {
            setEditData(phongDetailData);
        }
        setIsEditing(false);
    };

    // --- Cập nhật handlers ---
    const handleSave = () => {
        // Truyền object chứa id và dữ liệu cần update
        updatePhongMutation.mutate({ id: record.id, ...editData });
    };

    const handleDelete = () => {
        if (!window.confirm("Bạn có chắc muốn xóa phòng này không? Lưu ý: Phòng chứa thiết bị sẽ không thể xóa!")) return;
        deletePhongMutation.mutate(record.id);
    };

    const handleDeleteThietBi = (thongtinthietbi_id) => {
        if (!window.confirm("Bạn có chắc chắn muốn gỡ thiết bị này khỏi phòng không?")) return;
        // Tạo payload gồm cả phong_id và thongtinthietbi_id
        const payload = { phong_id: record.id, thongtinthietbi_id };
        removeThietBiMutation.mutate(payload);
    };
    // --------------------------

    // Lọc và nhóm thiết bị từ query data
    const filteredThietBiList = (Array.isArray(thietBiListData) ? thietBiListData : []).filter((tb) => {
        const tenThietBi = tb.tenThietBi?.toLowerCase?.() || "";
        const theLoai = tb.theLoai?.toLowerCase?.() || "";
        return tenThietBi.includes(searchTerm.toLowerCase()) || theLoai.includes(searchTerm.toLowerCase());
    });

    const groupedThietBiList = filteredThietBiList.reduce((acc, curr) => {
        const existingGroup = acc.find(group => group.theLoai === curr.theLoai);
        if (existingGroup) {
            existingGroup.devices.push(curr);
            existingGroup.total += 1;
        } else {
            acc.push({ theLoai: curr.theLoai, devices: [curr], total: 1 });
        }
        return acc;
    }, []);

    // Tìm kiếm  
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Xử lý toggle hiển thị chi tiết
    const toggleRow = (theLoai) => {
        if (expandedRows.includes(theLoai)) {
            setExpandedRows(expandedRows.filter((row) => row !== theLoai));
        } else {
            setExpandedRows([...expandedRows, theLoai]);
        }
    }

    // --- Xử lý trạng thái loading/error cho cả 2 query ---
    if (isLoadingPhong || isLoadingThietBi) {
        return <div className="p-4 text-center">Đang tải chi tiết phòng...</div>;
    }
    if (isErrorPhong || isErrorThietBi) {
        const errorMsg = errorPhong?.message || errorThietBi?.message || "Lỗi không xác định";
        return <div className="p-4 text-center text-red-500">Lỗi tải dữ liệu: {errorMsg}</div>;
    }
    // --------------------------------------------------

    return (
<div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header */}
             <div className="flex items-center justify-between p-4 bg-white shadow-md">
                <h2 className="text-xl font-semibold">Chi Tiết Phòng</h2>
                <div className="flex space-x-2">
                    <button
                        className="w-10 h-10 rounded-full hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleDelete}
                        disabled={deletePhongMutation.isPending || updatePhongMutation.isPending}
                        title="Xóa phòng"
                    >
                        <i className="text-lg text-black fas fa-trash"></i>
                    </button>
                    <button
                        className="w-10 h-10 rounded-full hover:bg-yellow-500 hover:text-white disabled:opacity-50"
                        onClick={toggleEdit}
                        disabled={deletePhongMutation.isPending || updatePhongMutation.isPending}
                        title={isEditing ? "Hủy sửa" : "Sửa phòng"}
                    >
                        <i className={`text-lg text-black fas ${isEditing ? 'fa-times-circle' : 'fa-edit'}`}></i>
                    </button>
                     {/* Nút Lưu chỉ hiện khi đang sửa */}
                     {isEditing && (
                         <button
                            className="w-10 h-10 text-white bg-green-500 rounded-full hover:bg-green-600 disabled:opacity-50"
                            onClick={handleSave}
                            disabled={updatePhongMutation.isPending || deletePhongMutation.isPending}
                            title="Lưu thay đổi"
                         >
                            <i className="text-lg fas fa-save"></i>
                         </button>
                     )}
                    <button
                        className="w-10 h-10 rounded-full hover:bg-gray-300 disabled:opacity-50"
                        onClick={!isEditing ? onClose : handleCancel} // Nếu đang sửa thì nút này là cancel
                        disabled={deletePhongMutation.isPending || updatePhongMutation.isPending}
                        title={isEditing ? "Hủy bỏ thay đổi" : "Đóng"}
                    >
                         <i className={`text-lg text-black fas ${isEditing ? 'fa-undo' : 'fa-times'}`}></i>
                    </button>
                </div>
            </div>

            {/* Body - Sử dụng editData cho input */}
            <div className="grid grid-cols-2 gap-2 px-4 py-2">
                 {/* ID */}
                <div>
                    <label className="font-semibold">ID Phòng:</label>
                    {/* Dùng record.id vì ID không đổi */}
                    <input type="text" value={`P${record?.id || ''}`} className="w-full p-2 bg-gray-100 border" disabled />
                </div>
                 {/* Cơ Sở */}
                <div>
                    <label className="font-semibold">Cơ Sở:</label>
                    <input type="text" value={editData?.coSo || ''} className="w-full p-2 bg-gray-100 border" disabled />
                </div>
                {/* Tòa */}
                <div>
                    <label className="font-semibold">Tòa:</label>
                    <input type="text" value={editData?.toa || ''} className="w-full p-2 bg-gray-100 border" disabled />
                </div>
                 {/* Tầng */}
                <div>
                    <label className="font-semibold">Tầng:</label>
                    {isEditing && editData?.toa ? ( // Chỉ cho sửa khi isEditing và có toa
                        <select name="tang" value={editData.tang || ''} onChange={handleChange}
                            className="w-full p-2 border">
                            {Array.from({ length: maxTangTheoToa[editData.toa] || 0 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    ) : (
                        <input type="number" value={editData?.tang || ''} className="w-full p-2 bg-gray-100 border" disabled />
                    )}
                </div>
                 {/* Số Phòng */}
                <div>
                    <label className="font-semibold">Số Phòng:</label>
                    {isEditing ? (
                        <select name="soPhong" value={editData.soPhong || ''} onChange={handleChange}
                            className="w-full p-2 border">
                            {Array.from({ length: 20 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    ) : (
                        <input type="number" value={editData?.soPhong || ''} className="w-full p-2 bg-gray-100 border" disabled />
                    )}
                </div>
                {/* Chức Năng */}
                 <div>
                    <label className="font-semibold">Chức Năng:</label>
                    <input type="text" name="chucNang" value={editData?.chucNang || ''}
                        onChange={handleChange} className={`w-full p-2 border ${isEditing ? 'bg-white' : 'bg-gray-100'}`} // Đổi bg khi sửa
                        disabled={!isEditing} />
                </div>
            </div>
            {/* Nút Lưu/Hủy không cần ở đây nữa vì đã tích hợp vào header */}

            {/* Danh sách thiết bị */}
            <div className="p-4 mt-4 bg-white border-t rounded-lg">
                 <div className="grid items-center grid-cols-2 gap-2 overflow-x-auto ">
                    <h3 className="mb-4 text-xl font-semibold">Các Thiết Bị Có Trong Phòng</h3>
                    <div className="relative flex flex-col justify-between gap-4 pb-4 md:flex-row">
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc thể loại..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="py-1 pl-10 pr-4 border rounded-lg md:w-full focus:inline-none"
                        />
                        <BsSearch className="absolute text-gray-400 left-3 top-2" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {/* Table */}
                    <table className="w-full border border-gray-300 table-auto">
                         <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-center border">STT</th>
                                <th className="px-4 py-2 border">Thể Loại</th>
                                <th className="px-4 py-2 text-center border">Tổng TB</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedThietBiList.map((group, index) => (
                                <>
                                    <tr key={group.theLoai + index} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-center border">{index + 1}</td>
                                        <td className="px-4 py-2 border">
                                            <div className="flex items-center justify-between">
                                                {group.theLoai}
                                                <button onClick={() => toggleRow(group.theLoai)} className="ml-2">
                                                    {expandedRows.includes(group.theLoai) ? <FaChevronUp /> : <FaChevronDown />}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-center border">{group.total}</td>
                                    </tr>
                                    {expandedRows.includes(group.theLoai) && (
                                        <tr>
                                            <td colSpan={1}></td>
                                            <td colSpan={3} className="border">
                                                <table className="w-full border border-gray-300 table-auto">
                                                     <thead className="bg-gray-100">
                                                        <tr>
                                                            <th className="text-sm text-center border">STT</th>
                                                            <th className="text-sm border">Mã Định Danh</th>
                                                            <th className="text-sm border">Tên Thiết Bị</th>
                                                            <th className="text-sm text-center border">Tình Trạng</th>
                                                            <th className="text-sm text-center border">Hành Động</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {group.devices.map((tb, subIndex) => (
                                                            <tr key={tb.thongtinthietbi_id} className="hover:bg-gray-50">
                                                                <td className="text-sm text-center border">{subIndex + 1}</td>
                                                                <td className="text-sm border">{tb.thongtinthietbi_id}</td>
                                                                <td className="text-sm border">{tb.tenThietBi}</td>
                                                                <td className="text-sm text-center border">
                                                                    {getTinhTrangLabel(tb.tinhTrang)}
                                                                </td>
                                                                <td className="text-center border">
                                                                    <button
                                                                        onClick={() => handleDeleteThietBi(tb.thongtinthietbi_id)}
                                                                        disabled={removeThietBiMutation.isPending} // Disable khi đang xóa
                                                                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                                                        title="Gỡ thiết bị khỏi phòng"
                                                                    >
                                                                        <BsTrash />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ChiTietPhong;
