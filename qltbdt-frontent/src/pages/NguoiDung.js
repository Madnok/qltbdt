import React, { useState } from 'react';
import LeftPanel from "../components/layout/LeftPanel";
import AdminRoute from "../components/NguoiDung/AdminRoute";
import UserRoute from "../components/NguoiDung/UserRoute";
import { useRightPanel } from "../utils/helpers";
import { useAuth } from "../context/AuthProvider";
import Popup from '../components/layout/Popup';
import FormTaoTaiKhoan from '../components/forms/FormTaoTaiKhoan';

const NguoiDung = () => {
    const { activeRightPanel, handleOpenRightPanel } = useRightPanel();
    const { user } = useAuth();
    const [isCreateUserPopupOpen, setIsCreateUserPopupOpen] = useState(false);

    const handleCloseCreateUserPopup = () => { 
        setIsCreateUserPopupOpen(false);
    };

    const leftPanelComponent = user?.role === "admin"
        ? <AdminRoute onOpenCreateUserPopup={setIsCreateUserPopupOpen}/>
        : <UserRoute onOpenRightPanel={handleOpenRightPanel} />;

    return (
        <div className="flex flex-1 bg-gray-100 border">
            {/* Left Panel */}
            <div className={`transition-all duration-300 ${activeRightPanel ? "w-3/5" : "w-full"}`}>
                <LeftPanel activeComponent={leftPanelComponent} />
            </div>

            {/* Popup Tạo Tài Khoản */}
            {isCreateUserPopupOpen && (
                 <Popup
                 title="Tạo Tài Khoản Người Dùng"
                 onClose={handleCloseCreateUserPopup} // Truyền đúng hàm
                 children={<FormTaoTaiKhoan onClose={handleCloseCreateUserPopup} />}
             />
            )}
        </div>
    );
};

export default NguoiDung;
