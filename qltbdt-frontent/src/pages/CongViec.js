import { useState } from "react";
import { useAuth } from "../context/AuthProvider";
import PhanCongKhuVuc from "../components/CongViec/PhanCongKhuVuc";
import PhanCa from "../components/CongViec/PhanCa";
import ThongTinBaoHong from "../components/CongViec/ThongTinBaoHong";
import AdminGopYManagement from "../components/CongViec/AdminGopYManagement";
import LichBaoDuongAdmin from "../components/CongViec/LichBaoDuongAdmin";
import CongViecNhanVien from "../components/CongViec/CongViecNhanVien";
import MyScheduleView from "../components/CongViec/LichNhanVien";

const CongViec = () => {
    const { user, loading } = useAuth();
    const [adminActiveTab, setAdminActiveTab] = useState("reports");
    const [nhanVienActiveTab, setNhanVienActiveTab] = useState("myTasks"); 

    if (loading) {
        return <div className="p-4 text-center">Đang tải thông tin người dùng...</div>;
    }
    if (!user) {
        return <div className="p-4 text-center text-red-500">Lỗi: Không tìm thấy thông tin người dùng.</div>;
    }

    // Giao diện Admin
    if (user.role === 'admin') {
        return (
            <div className="flex flex-col h-full bg-white border">
                {/* Header Admin */}
                <div className="flex items-center justify-between p-4 border-b ">
                    <h2 className="text-2xl font-bold text-gray-800">Quản Lý Công Việc</h2>
                </div>
                {/* Tabs Admin */}
                <div className="flex border-b shrink-0">
                    <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "reports" ? "border-b-2 border-red-500 font-semibold text-red-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("reports")}>Báo Hỏng</button>
                    <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "maintenance" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("maintenance")}>Bảo Dưỡng</button>
                    <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "gopy" ? "border-b-2 border-purple-500 font-semibold text-purple-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("gopy")}>Góp Ý</button>
                    <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "schedule" ? "border-b-2 border-green-500 font-semibold text-green-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("schedule")}>Phân Ca</button>
                    <button className={`p-3 px-4 text-sm text-center flex-1 ${adminActiveTab === "users" ? "border-b-2 border-yellow-500 font-semibold text-yellow-600" : "text-gray-500 hover:bg-gray-100"}`} onClick={() => setAdminActiveTab("users")}>Phân Công</button>
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

    // Giao diện Nhân viên
    if (user.role === 'nhanvien') {
        return (
            <div className="flex flex-col h-full bg-gray-100">
                <div className="flex items-center justify-between p-4 bg-white border-b shrink-0">
                    <h2 className="text-xl font-semibold text-gray-800">Công Việc & Lịch Trực</h2>
                </div>
                {/* Tabs NhanVien */}
                <div className="flex bg-white border-b shrink-0">
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${nhanVienActiveTab === "myTasks" ? "border-b-2 border-teal-500 font-semibold text-teal-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setNhanVienActiveTab("myTasks")}
                    >
                        Công Việc Được Giao
                    </button>
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${nhanVienActiveTab === "mySchedule" ? "border-b-2 border-cyan-500 font-semibold text-cyan-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setNhanVienActiveTab("mySchedule")}
                    >
                        Lịch Trực Cá Nhân
                    </button>
                </div>
                {/* Nội dung Tabs NhanVien */}
                <div className="flex-grow overflow-auto bg-white">
                    {nhanVienActiveTab === "myTasks" && <CongViecNhanVien />} {/* Component hiển thị công việc gộp */}
                    {nhanVienActiveTab === "mySchedule" && <MyScheduleView />} {/* Component chỉ hiển thị lịch trực */}
                </div>
            </div>
        );
    }

    // Trường hợp khác
    return (
        <div className="p-4 text-center text-red-500">
            Vai trò người dùng không được hỗ trợ ('{user.role}').
        </div>
    );
};

export default CongViec;
