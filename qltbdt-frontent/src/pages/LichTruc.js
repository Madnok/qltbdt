import RightPanel from "../components/layout/RightPanel";
import { useState } from "react";
import PhanCa from "../components/LichTruc/PhanCa";
import ThongTinBaoHong from "../components/LichTruc/ThongTinBaoHong";

const LichTruc = () => {
    const [activeTab, setActiveTab] = useState("users");
    return (
        <div className="flex flex-col bg-white">
            <div className=" p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Lịch Làm Việc</h2>
            </div>
            {/* Tabs */}
            <div className="flex border-b">
                <button
                    className={`p-2 w-1/3 text-center ${activeTab === "users" ? "border-b-2 border-blue-500 font-semibold" : ""}`}
                    onClick={() => setActiveTab("users")}
                >
                    Danh Sách Nhân Viên
                </button>
                <button
                    className={`p-2 w-1/3 text-center ${activeTab === "schedule" ? "border-b-2 border-blue-500 font-semibold" : ""}`}
                    onClick={() => setActiveTab("schedule")}
                >
                    Phân Ca
                </button>
                <button
                    className={`p-2 w-1/3 text-center ${activeTab === "reports" ? "border-b-2 border-blue-500 font-semibold" : ""}`}
                    onClick={() => setActiveTab("reports")}
                >
                    Thông Tin Báo Hỏng
                </button>
            </div>
            {activeTab === "users" && (
                <div className="h-screen">
                    <PhanCa />
                </div>
            )}

            {activeTab === "schedule" && (
                <div className="h-screen">
                    <h3 className="text-lg font-semibold mb-2">Phân Ca Làm Việc</h3>
                    <p>Chức năng đang được phát triển...</p>
                </div>
            )}

            {activeTab === "reports" && (
                <div className="h-screen">
                    <ThongTinBaoHong/>
                </div>
            )}
            <RightPanel />
        </div>
    );
};

export default LichTruc;
