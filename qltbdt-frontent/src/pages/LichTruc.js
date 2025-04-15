// import RightPanel from "../components/layout/RightPanel";
import { useState } from "react";
import PhanCongKhuVuc from "../components/LichTruc/PhanCongKhuVuc";
import PhanCa from "../components/LichTruc/PhanCa";
import MyScheduleView from "../components/LichTruc/LichNhanVien";
import { useAuth } from "../context/AuthProvider";
import ThongTinBaoHong from "../components/LichTruc/ThongTinBaoHong";

const LichTruc = () => {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState("reports");

    if (loading) {
        return <div className="p-4 text-center">Đang tải thông tin người dùng...</div>;
    }

    if (!user) {
        return <div className="p-4 text-center text-red-500">Lỗi: Không tìm thấy thông tin người dùng.</div>;
    }


    // 1. Giao diện cho Admin
    if (user.role === 'admin') {
        return (
            <div className="flex flex-col h-full bg-white border-2">
                <div className="flex items-center justify-between p-4 border-b ">
                    <h2 className="text-2xl font-bold text-gray-800">Quản Lý Công Việc</h2>
                </div>
                {/* Tabs Admin */}
                <div className="flex border-b shrink-0">
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${activeTab === "reports" ? "border-b-2 border-red-500 font-semibold text-red-600" : "text-gray-500 hover:bg-gray-100"}`} // Đổi màu active border
                        onClick={() => setActiveTab("reports")}
                    >
                        Thông Tin Báo Hỏng
                    </button>
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${activeTab === "schedule" ? "border-b-2 border-green-500 font-semibold text-green-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setActiveTab("schedule")}
                    >
                        Phân Ca Làm Việc
                    </button>
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${activeTab === "users" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setActiveTab("users")}
                    >
                        Phân Công Khu Vực
                    </button>
                </div>
                {/* Nội dung Tabs Admin */}
                <div className="flex-grow overflow-auto">
                    {activeTab === "reports" && (
                        <ThongTinBaoHong />
                    )}
                    {activeTab === "schedule" && (
                        <PhanCa />
                    )}
                    {activeTab === "users" && (
                        <PhanCongKhuVuc />
                    )}
                </div>
            </div>
        );
    }

    // 2. Giao diện cho Nhân viên
    if (user.role === 'nhanvien') {
        return (
            <div className="flex flex-col h-full bg-white border-2">
                <div className="flex items-center justify-between p-4 border-b ">
                    <h2 className="text-xl font-semibold">Quản Lý Công Việc</h2>
                </div>
                <MyScheduleView />
                {/* <RightPanel /> */}
            </div>
        );
    }

    return (
        <div className="p-4 text-center text-red-500">Vai trò người dùng không được hỗ trợ ('{user.role}').</div>
    );
};

export default LichTruc;

