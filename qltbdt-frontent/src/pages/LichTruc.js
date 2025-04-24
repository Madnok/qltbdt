// import RightPanel from "../components/layout/RightPanel";
import { useState } from "react";
import PhanCongKhuVuc from "../components/LichTruc/PhanCongKhuVuc";
import PhanCa from "../components/LichTruc/PhanCa";
import MyScheduleView from "../components/LichTruc/LichNhanVien";
import { useAuth } from "../context/AuthProvider";
import ThongTinBaoHong from "../components/LichTruc/ThongTinBaoHong";
import AdminGopYManagement from "../components/LichTruc/AdminGopYManagement";
import LichBaoDuongAdmin from "../components/LichTruc/LichBaoDuongAdmin";
import LichBaoDuongNhanVien from "../components/LichTruc/LichBaoDuongNhanVien";

const LichTruc = () => {
    const { user, loading } = useAuth();
    const [adminActiveTab, setAdminActiveTab] = useState("reports"); // Mặc định cho admin
    const [nhanVienActiveTab, setNhanVienActiveTab] = useState("mySchedule"); // Mặc định cho nhân viên

    if (loading) {
        return <div className="p-4 text-center">Đang tải thông tin người dùng...</div>;
    }

    if (!user) {
        return <div className="p-4 text-center text-red-500">Lỗi: Không tìm thấy thông tin người dùng.</div>;
    }

    // 1. Giao diện cho Admin
    if (user.role === 'admin') {
        return (
            <div className="flex flex-col h-full bg-white border">
                <div className="flex items-center justify-between p-4 border-b ">
                    <h2 className="text-2xl font-bold text-gray-800">Quản Lý Công Việc</h2>
                </div>
                {/* Tabs Admin */}
                <div className="flex border-b shrink-0">
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "reports" ? "border-b-2 border-red-500 font-semibold text-red-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setAdminActiveTab("reports")}
                    >
                        Thông Tin Báo Hỏng
                    </button>
                    {/* Tab Bảo Dưỡng Định Kỳ MỚI */}
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "maintenance" ? "border-b-2 border-yellow-500 font-semibold text-yellow-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setAdminActiveTab("maintenance")}
                    >
                        Lịch Bảo Dưỡng
                    </button>
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "gopy" ? "border-b-2 border-purple-500 font-semibold text-purple-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setAdminActiveTab("gopy")}
                    >
                        Góp Ý Cải Thiện
                    </button>
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "schedule" ? "border-b-2 border-green-500 font-semibold text-green-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setAdminActiveTab("schedule")}
                    >
                        Phân Ca Làm Việc
                    </button>
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "users" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setAdminActiveTab("users")}
                    >
                        Phân Công Khu Vực
                    </button>
                </div>

                {/* Nội dung Tabs Admin */}
                <div className="flex-grow overflow-auto">
                    {adminActiveTab === "reports" && <ThongTinBaoHong />}
                    {adminActiveTab === "maintenance" && <LichBaoDuongAdmin />} 
                    {adminActiveTab === "schedule" && <PhanCa />}
                    {adminActiveTab === "users" && <PhanCongKhuVuc />}
                    {adminActiveTab === "gopy" && <AdminGopYManagement />}
                </div>
            </div>
        );
    }

    // 2. Giao diện cho Nhân viên
    if (user.role === 'nhanvien') {
        return (
            <div className="flex flex-col h-full bg-white border">
                 <div className="flex items-center justify-between p-4 border-b ">
                    <h2 className="text-xl font-semibold">Công Việc Của Tôi</h2>
                </div>
                 {/* Tabs NhanVien */}
                 <div className="flex border-b shrink-0">
                     <button
                         className={`p-3 px-4 text-sm text-center flex-1 ${nhanVienActiveTab === "mySchedule" ? "border-b-2 border-cyan-500 font-semibold text-cyan-600" : "text-gray-500 hover:bg-gray-100"}`}
                         onClick={() => setNhanVienActiveTab("mySchedule")}
                     >
                         Lịch Trực Cá Nhân
                     </button>
                     <button
                         className={`p-3 px-4 text-sm text-center flex-1 ${nhanVienActiveTab === "myMaintenance" ? "border-b-2 border-orange-500 font-semibold text-orange-600" : "text-gray-500 hover:bg-gray-100"}`}
                         onClick={() => setNhanVienActiveTab("myMaintenance")}
                     >
                         Việc Bảo Dưỡng
                     </button>
                 </div>
                 {/* Nội dung Tabs NhanVien */}
                 <div className="flex-grow overflow-auto">
                     {nhanVienActiveTab === "mySchedule" && <MyScheduleView />}
                     {nhanVienActiveTab === "myMaintenance" && <LichBaoDuongNhanVien />}
                 </div>
            </div>
        );
    }

    return (
        <div className="p-4 text-center text-red-500">
            Vai trò người dùng không được hỗ trợ ('{user.role}').
        </div>
    );
};

export default LichTruc;
