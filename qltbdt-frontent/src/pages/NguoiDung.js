import LeftPanel from "../components/layout/LeftPanel";
import RightPanel from "../components/layout/RightPanel";
import AdminRoute from "../components/NguoiDung/AdminRoute";
import UserRoute from "../components/NguoiDung/UserRoute";
import UserInfo from "../components/NguoiDung/UsersInfo";
import { useRightPanel } from "../utils/helpers";
import { useAuth } from "../context/AuthProvider";

const NguoiDung = () => {
    const { activeRightPanel, handleCloseRightPanel, handleOpenRightPanel } = useRightPanel();
    const { user } = useAuth();

    const leftPanelComponent = user?.role === "admin" 
    ? <AdminRoute /> 
    : <UserRoute onOpenRightPanel={handleOpenRightPanel}/>;

    return (
        <div className="flex flex-1 bg-gray-100">
            {/* Left Panel */}
            <div className={`transition-all duration-300 ${activeRightPanel ? "w-3/5" : "w-full"}`}>
                <LeftPanel activeComponent={leftPanelComponent} />
            </div>

            {/* Right Panel */}
            {activeRightPanel && (
                <div className="w-2/5 transition-all duration-300">
                    <RightPanel 
                        activeComponent={<UserInfo onClose={handleCloseRightPanel} />} 
                    />
                </div>
            )}
        </div>
    );
};

export default NguoiDung;
