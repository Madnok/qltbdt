// import RightPanel from "../components/layout/RightPanel";
// import { useState } from "react";
// import CongViec from "../components/LichTruc/CongViec";
// import PhanCa from "../components/LichTruc/PhanCa";

// const LichTruc = () => {
//     const [activeTab, setActiveTab] = useState("users");
//     return (
//         <div className="flex flex-col bg-white border-2">
//             <div className="flex items-center justify-between p-4 border-b ">
//                 <h2 className="text-xl font-semibold">Lịch Làm Việc</h2>
//             </div>
//             {/* Tabs */}
//             <div className="flex border-b">
//                 <button
//                     className={`p-2 w-1/2 text-center ${activeTab === "users" ? "border-b-2 border-blue-500 font-semibold" : ""}`}
//                     onClick={() => setActiveTab("users")}
//                 >
//                     Công Việc
//                 </button>
//                 <button
//                     className={`p-2 w-1/2 text-center ${activeTab === "schedule" ? "border-b-2 border-blue-500 font-semibold" : ""}`}
//                     onClick={() => setActiveTab("schedule")}
//                 >
//                     Phân Ca
//                 </button>
//             </div>
//             {activeTab === "users" && (
//                 <div className="h-screen">
//                     <CongViec />
//                 </div>
//             )}

//             {activeTab === "schedule" && (
//                 <div className="h-screen">
//                     <PhanCa />
//                 </div>
//             )}
//             <RightPanel />
//         </div>
//     );
// };

// export default LichTruc;




// import RightPanel from "../components/layout/RightPanel";
import { useState} from "react";
import CongViec from "../components/LichTruc/CongViec";
import PhanCa from "../components/LichTruc/PhanCa";
import MyScheduleView from "../components/LichTruc/LichNhanVien"; 
import { useAuth } from "../context/AuthProvider";

const LichTruc = () => {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState("users"); 

    if (loading) {
        return <div className="p-4 text-center">Đang tải thông tin người dùng...</div>;
    }

    if (!user) {
         return <div className="p-4 text-center text-red-500">Lỗi: Không tìm thấy thông tin người dùng.</div>;
    }


    // 1. Giao diện cho Admin
    if (user.role === 'admin') { 
        return (
            <div className="flex flex-col h-full bg-white border-2"> {/* Thêm h-full nếu cần */}
                <div className="flex items-center justify-between p-4 border-b ">
                    <h2 className="text-xl font-semibold">Quản lý Lịch Làm Việc</h2>
                </div>
                {/* Tabs Admin */}
                <div className="flex border-b shrink-0"> {/* shrink-0 để tab không bị co lại */}
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${activeTab === "users" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500 hover:bg-gray-100"}`} // Tăng padding, flex-1
                        onClick={() => setActiveTab("users")}
                    >
                        Công Việc
                    </button>
                    <button
                        className={`p-3 px-4 text-sm text-center flex-1 ${activeTab === "schedule" ? "border-b-2 border-blue-500 font-semibold text-blue-600" : "text-gray-500 hover:bg-gray-100"}`}
                        onClick={() => setActiveTab("schedule")}
                    >
                        Phân Ca
                    </button>
                </div>
                {/* Nội dung Tabs Admin */}
                <div className="flex-grow overflow-auto"> {/* Cho phép nội dung cuộn */}
                    {activeTab === "users" && (
                        // <div className="h-screen"> {/* Bỏ h-screen ở đây */}
                            <CongViec />
                        // </div>
                    )}
                    {activeTab === "schedule" && (
                        // <div className="h-screen"> {/* Bỏ h-screen ở đây */}
                            <PhanCa />
                        // </div>
                    )}
                </div>
                {/* RightPanel có thể giữ nguyên hoặc ẩn tùy layout của bạn */}
                 {/* <RightPanel /> */}
            </div>
        );
    }

    // 2. Giao diện cho Nhân viên
    if (user.role === 'nhanvien') { // <-- Kiểm tra role nhân viên
        return (
            <div className="flex flex-col h-full bg-white border-2">
                 <div className="flex items-center justify-between p-4 border-b ">
                    <h2 className="text-xl font-semibold">Lịch Làm Việc Của Bạn</h2>
                </div>
                    <MyScheduleView /> {/* Component mới cho nhân viên */}
                  {/* RightPanel có thể giữ nguyên hoặc ẩn tùy layout của bạn */}
                 {/* <RightPanel /> */}
            </div>
        );
    }

    // 3. Xử lý cho các role khác hoặc trường hợp không mong muốn
    return (
         <div className="p-4 text-center text-red-500">Vai trò người dùng không được hỗ trợ ('{user.role}').</div>
    );
};

export default LichTruc;