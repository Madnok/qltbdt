const FormPhieuNhap = ({ onClose }) => {
    return (
        <div className="w-1/2 bg-white rounded-lg shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
                <h2 className="text-lg font-semibold">Chi Tiết Thiết Bị</h2>
                <button className="w-10 h-10 rounded-full hover:bg-gray-300"
                    onClick={onClose}>
                    <i className="text-lg text-black fas fa-times"></i>
                </button>
            </div>

            {/* Nội dung form */}
            <form className="p-4 space-y-4">
                <div>
                    <label className="block font-medium">ID</label>
                    <input type="text" value={"CTTB ID"} className="w-full p-2 mt-1 border rounded"/>
                </div>
                <div>
                    <label className="block font-medium">Thiết Bị Thể Loại </label>
                    <select className="w-full p-2 mt-1 border rounded">
                        <option>Chọn Thiết Bị</option>
                        <option>1</option>
                        <option>2</option>
                        <option>3</option>
                    </select>
                </div>
                <div>
                    <label className="block font-medium">Tên Thiết Bị</label>
                    <input type="text" className="w-full p-2 mt-1 border rounded" />
                </div>
                <div>
                    <label className="block font-medium">Phòng</label>
                    <select className="w-full p-2 mt-1 border rounded">
                        <option>Chọn Phòng</option>
                        <option>P101</option>
                        <option>P102</option>
                        <option>P103</option>
                    </select>
                </div>
                <div>
                    <label className="block font-medium">Người Được Cấp</label>
                    <input type="Text" className="w-full p-2 mt-1 border rounded" />
                </div>
                <div>
                    <label className="block font-medium">Tình Trạng</label>
                    <select className="w-full p-2 mt-1 border rounded">
                        <option>Sẵn Dùng</option>
                        <option>Hỏng</option>
                        <option>Đang Dùng</option>
                    </select>
                </div>
                
                {/* Nút Lưu */}
                <div className="flex justify-end space-x-2">
                    <button type="button" className="px-4 py-2 text-white bg-green-500 rounded"
                        onClick={() => alert("Lưu Phiếu Nhập thành công!")}>
                        Lưu
                    </button>
                    <button type="button" className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
                        Hủy
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FormPhieuNhap;
