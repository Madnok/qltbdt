import { useState } from "react";

const ChiTietNhap = ({ selectedRecord, onClose }) => {
    // eslint-disable-next-line
    const [isEditing, setIsEditing] = useState(false);

    const handleEdit = () => {
        setIsEditing(true);
        alert(`Sửa ${selectedRecord.id}!`);
    };

    const handleDelete = () => {
        if (window.confirm(`Bạn có chắc muốn xóa ${selectedRecord.id}?`)) {
            alert(`Xóa ${selectedRecord.id}!`);
            onClose();
        }
    };

    // Dữ liệu thiết bị nhập (Giả lập dữ liệu)
    const thietBiNhapData = [
        { id: "TB01", tenThietBi: "Máy Chiếu YG650", phong: "P101", nguoiNhan: "Nguyễn Văn A" },
        { id: "TB02", tenThietBi: "Laptop Dell XPS", phong: "P102", nguoiNhan: "Trần Thị B" },
    ];

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header Right Panel */}
            <div className="flex items-center justify-between p-2 overflow-auto bg-white border-b border-l">
                <h2 className="text-xl font-semibold">Chi tiết ghi nhập</h2>
                <div className="flex space-x-2">
                    <button className="w-10 h-10 rounded-full hover:bg-red-500 hover:text-white" onClick={handleDelete}>
                        <i className="text-lg text-black fas fa-trash"></i>
                    </button>
                    <button className="w-10 h-10 rounded-full hover:bg-yellow-500 hover:text-white" onClick={handleEdit}>
                        <i className="text-lg text-black fas fa-edit"></i>
                    </button>
                    <button className="w-10 h-10 rounded-full hover:bg-gray-300" onClick={onClose}>
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>

            {/* Nội dung chi tiết */}
            <div className="grid grid-cols-2 gap-2 p-4">
                <div>
                    <label className="font-semibold">ID:</label>
                    <input type="text" value={selectedRecord.id} className="w-full p-2 bg-gray-100 border" disabled />
                </div>
                <div>
                    <label className="font-semibold">Ngày tạo:</label>
                    <input type="text" value={selectedRecord.date} className="w-full p-2 bg-gray-100 border" disabled />
                </div>
                <div>
                    <label className="font-semibold">Trường hợp nhập:</label>
                    <input type="text" value={selectedRecord.type} className="w-full p-2 bg-gray-100 border" disabled />
                </div>
                <div>
                    <label className="font-semibold">Thiết bị nhập:</label>
                    <input type="text" value={selectedRecord.device} className="w-full p-2 bg-gray-100 border" disabled />
                </div>
            </div>

            {/* Thiết Bị Nhập */}
            <div className="p-4 overflow-auto">
                <h3 className="text-lg font-semibold">Thiết Bị Nhập</h3>
                <table className="w-full mt-2 border">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="px-4 py-2 border-b">ID</th>
                            <th className="px-4 py-2 border-b">Tên Thiết Bị</th>
                            <th className="px-4 py-2 border-b">Phòng</th>
                            <th className="px-4 py-2 border-b">Người Nhận</th>
                        </tr>
                    </thead>
                    <tbody>
                        {thietBiNhapData.map((tb) => (
                            <tr key={tb.id} className="text-center">
                                <td className="p-2 border">{tb.id}</td>
                                <td className="p-2 border">{tb.tenThietBi}</td>
                                <td className="p-2 border">{tb.phong}</td>
                                <td className="p-2 border">{tb.nguoiNhan}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ChiTietNhap;
