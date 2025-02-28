import { useState } from "react";
import FormPhieuNhap from "./FormPhieuNhap";

const FormNhap = ({ onClose }) => {
    const [showPhieuNhap, setShowPhieuNhap] = useState(false);

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between p-2 bg-white border-b">
                <h2 className="text-lg font-semibold">Thêm Ghi Nhập</h2>
                <button className="w-10 h-10 rounded-full hover:bg-gray-300"
                    onClick={onClose}>
                    <i className="text-lg text-black fas fa-times"></i>
                </button>
            </div>

            {/* Form nhập */}
            <form className="p-4 space-y-4">
                
                <div>
                    <label className="block font-medium">ID:</label>
                    <input type="text" value="GN1" disabled className="w-full p-2 mt-1 bg-gray-100 border rounded" />
                </div>
              
                <div>
                    <label className="block font-medium">Người Tạo:</label>
                    <input type="text" value="admin" disabled className="w-full p-2 mt-1 bg-gray-100 border rounded" />
                </div>

                <div>
                    <label className="block font-medium">Ngày Tạo:</label>
                    <input type="text" value="26/2/2025 4:26 CH" disabled className="w-full p-2 mt-1 bg-gray-100 border rounded" />
                </div>

                {/* Nút mở form phiếu nhập */}
                <div>
                    <label className="block font-medium">Thêm Thiết Bị Nhập</label>
                    <button type="button"
                        onClick={() => setShowPhieuNhap(true)}
                        className="px-4 py-2 mt-2 text-white bg-blue-500 rounded">
                        + Thêm Phiếu Nhập
                    </button>
                </div>
            </form>

            {/* Hiển thị Form Phiếu Nhập */}
            {showPhieuNhap && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <FormPhieuNhap onClose={() => setShowPhieuNhap(false)} />
                </div>
            )}
        </div>
    );
};

export default FormNhap;
