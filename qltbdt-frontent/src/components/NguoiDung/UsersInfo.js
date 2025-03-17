import { useAuth } from "../../context/AuthProvider";
import { useState } from "react";

const UsersInfo = ({onClose}) => {
    const { user } = useAuth(); // Lấy thông tin user từ context
    const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
    const handleChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Đổi mật khẩu với dữ liệu:", passwordData);
        // TODO: Gọi API đổi mật khẩu
    };
    return (

        <div className="flex flex-col h-full bg-white border-l shadow-md">
            <div className="flex items-center justify-between p-2.5 bg-white border-b">
                <h2 className="text-xl font-semibold">Thay Đổi Mật Khẩu</h2>
                <div className="flex space-x-2">
                    <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-300" onClick={onClose}>
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="p-2 mt-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600">Mật khẩu cũ</label>
                    <input
                        type="password"
                        name="oldPassword"
                        value={passwordData.oldPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2 mt-1 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600">Mật khẩu mới</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2 mt-1 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-600">Xác nhận mật khẩu mới</label>
                    <input
                        type="password"
                        name="confirmNewPassword"
                        value={passwordData.confirmNewPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2 mt-1 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full px-4 py-2 text-white transition duration-300 bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                    Xác Nhận
                </button>
            </form>
        </div>
    );
};

export default UsersInfo;
