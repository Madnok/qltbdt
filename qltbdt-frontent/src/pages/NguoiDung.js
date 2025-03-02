import LeftPanel from "../components/layout/LeftPanel";
import RightPanel from "../components/layout/RightPanel";
import AdminRoute from "../components/NguoiDung/AdminRoute";
import UserRoute from "../components/NguoiDung/UserRoute";
import UserInfo from "../components/NguoiDung/UsersInfo";
import { useRightPanel } from "../utils/helpers";
import { useAuth } from "../context/AuthProvider"; // Lấy role từ context


const NguoiDung = () => {
    const { activeRightPanel, handleCloseRightPanel, handleOpenRightPanel } = useRightPanel();

    const { user } = useAuth(); // Lấy thông tin user từ context và làm mới user

    // Chọn component hiển thị trong LeftPanel theo vai trò
    const leftPanelComponent = user?.role === "admin" ? <AdminRoute /> : <UserRoute />;
    const rightPanelComponent = <UserInfo />;

    return (
        <div className="flex flex-1 bg-gray-100">
            {/* Left Panel */}
            <div className={`transition-all duration-300 ${activeRightPanel ? "w-3/5" : "w-full"}`}>
                <LeftPanel activeComponent={leftPanelComponent} />
                <button onClick={handleOpenRightPanel}>Open Right Panel</button>
            </div>
            {/* Right Panel */}
            {activeRightPanel && (
                <div className="w-2/5 transition-all duration-300">
                    <button onClick={handleCloseRightPanel}>Close</button>
                    <RightPanel activeComponent={rightPanelComponent} />
                </div>
            )}
        </div>

    );
};

export default NguoiDung;
