// import { useMemo, useState } from "react";
// import Sidebar from "../components/layout/Sidebar";
// import Header from "../components/layout/Header";
// import Footer from "../components/layout/Footer";
// import RightPanel from "../components/layout/RightPanel";
// import BangNhap from "../components/NhapXuat/BangNhap";
// import BangXuat from "../components/NhapXuat/BangXuat";
// import ChiTietNhap from "../components/NhapXuat/ChiTietNhap";
// import ChiTietXuat from "../components/NhapXuat/ChiTietXuat";
// import FormNhap from "../components/forms/FormNhap";
// import FormXuat from "../components/forms/FormXuat";
// import { useRightPanel } from "../utils/helpers";
// import { addForms } from "../utils/constants";

// const NhapXuat = () => {
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [activeTab, setActiveTab] = useState("nhap"); // "nhap" hoặc "xuat"
//   const { selectedRecord, activeRightPanel, handleOpenRightPanel, handleCloseRightPanel } = useRightPanel();

//   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

//   // Xác định component hiển thị trong RightPanel
//   const rightPanelComponent = useMemo(() => {
//     switch (activeRightPanel) {
//         case "ChiTietNhap":
//             return <ChiTietNhap selectedRecord={selectedRecord} onClose={handleCloseRightPanel} />;
//         case "ChiTietXuat":
//             return <ChiTietXuat selectedRecord={selectedRecord} onClose={handleCloseRightPanel} />;
//         case addForms.Nhap:
//             return <FormNhap onClose={handleCloseRightPanel} />;
//         case addForms.Xuat:
//             return <FormXuat onClose={handleCloseRightPanel} />;
//         default:
//             return null;
//     }
//   }, [activeRightPanel, selectedRecord, handleCloseRightPanel]);

//   return (
//     <div className="flex flex-col h-screen">
//       <Header toggleSidebar={toggleSidebar} />

//       <div className="flex flex-1">
//         <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

//         <div className="flex flex-1 p-2 overflow-auto bg-gray-100">
//           {/* Left Panel */}
//           <div className={`bg-white shadow-md flex flex-col transition-all duration-300 ${selectedRecord || activeRightPanel ? "w-3/5" : "w-full"}`}>

//             {/* Tabs */}
//             <div className="flex border-b">
//               <button className={`py-3.5 px-6 font-semibold flex-1 text-center ${activeTab === "nhap" ? "border-b-4 border-gray-800 text-orange-400" : "text-black"}`}
//                 onClick={() => setActiveTab("nhap")}
//               >
//                 Ghi Nhập
//               </button>
//               <button className={`py-3.5 px-6 font-semibold flex-1 text-center ${activeTab === "xuat" ? "border-b-4 border-gray-800 text-orange-400" : "text-black"}`}
//                 onClick={() => setActiveTab("xuat")}
//               >
//                 Ghi Xuất
//               </button>
//             </div>

//             {/* Header */}
//             <div className="flex items-center justify-between p-2 bg-white shadow-md">
//               <h2 className="text-xl font-semibold">{activeTab === "nhap" ? "Danh sách Ghi Nhập" : "Danh sách Ghi Xuất"}</h2>

//               {/* Nút Thêm */}
//               <button
//                 className="flex items-center px-4 py-2 text-white bg-blue-500 rounded"
//                 onClick={() => handleOpenRightPanel(activeTab === "nhap" ? addForms.Nhap : addForms.Xuat)}
//               >
//                 <i className="mr-2 fas fa-plus"></i> Thêm
//               </button>
//             </div>

//             {/* Hiển thị bảng dữ liệu */}
//             {activeTab === "nhap" ? (
//               <BangNhap setSelectedRecord={(record) => handleOpenRightPanel("ChiTietNhap", record)} />
//             ) : (
//               <BangXuat setSelectedRecord={(record) => handleOpenRightPanel("ChiTietXuat", record)} />
//             )}
//           </div>

//           {/* RightPanel */}
//           <RightPanel
//             activeComponent={rightPanelComponent} onClose={handleCloseRightPanel}

//           />
//         </div>
//       </div>
//       <Footer />
//     </div>
//   );
// };

// export default NhapXuat;


import { useMemo, useState } from "react";
import RightPanel from "../components/layout/RightPanel";
import BangNhap from "../components/NhapXuat/BangNhap";
import BangXuat from "../components/NhapXuat/BangXuat";
import ChiTietNhap from "../components/NhapXuat/ChiTietNhap";
import ChiTietXuat from "../components/NhapXuat/ChiTietXuat";
import FormNhap from "../components/forms/FormNhap";
import FormXuat from "../components/forms/FormXuat";
import { useRightPanel } from "../utils/helpers";
import { addForms } from "../utils/constants";
import LeftPanel from "../components/layout/LeftPanel";

const NhapXuat = () => {
  const [activeTab, setActiveTab] = useState("nhap"); // "nhap" hoặc "xuat"
  const { selectedRecord, activeRightPanel, handleOpenRightPanel, handleCloseRightPanel } = useRightPanel();

  // Xác định component hiển thị trong RightPanel
  const rightPanelComponent = useMemo(() => {
    switch (activeRightPanel) {
      case "ChiTietNhap":
        return <ChiTietNhap selectedRecord={selectedRecord} onClose={handleCloseRightPanel} />;
      case "ChiTietXuat":
        return <ChiTietXuat selectedRecord={selectedRecord} onClose={handleCloseRightPanel} />;
      case addForms.Nhap:
        return <FormNhap onClose={handleCloseRightPanel} />;
      case addForms.Xuat:
        return <FormXuat onClose={handleCloseRightPanel} />;
      default:
        return null;
    }
  }, [activeRightPanel, selectedRecord, handleCloseRightPanel]);

  // Xác định component nào hiển thị trên Left Panel
  const leftPanelComponent = activeTab === "nhap" ? (
    <BangNhap setSelectedRecord={(record) => handleOpenRightPanel("ChiTietNhap", record)} />
  ) : (
    <BangXuat setSelectedRecord={(record) => handleOpenRightPanel("ChiTietXuat", record)} />
  );

  return (
        <div className="flex flex-1 overflow-auto bg-gray-100">
          {/* Left Panel */}
          <div className={`transition-all duration-300 ${selectedRecord || activeRightPanel ? "w-3/5" : "w-full"}`}>
            {/* Tabs */}
            <div className="flex border-b bg-white">
              <button className={`py-3.5 px-6 font-semibold flex-1 text-center ${activeTab === "nhap" ? "border-b-4 border-gray-800 text-orange-400" : "text-black"}`}
                onClick={() => setActiveTab("nhap")}
              >
                Ghi Nhập
              </button>
              <button className={`py-3.5 px-6 font-semibold flex-1 text-center ${activeTab === "xuat" ? "border-b-4 border-gray-800 text-orange-400" : "text-black"}`}
                onClick={() => setActiveTab("xuat")}
              >
                Ghi Xuất
              </button>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-2 bg-white shadow-md">
              <h2 className="text-xl font-semibold">{activeTab === "nhap" ? "Danh sách Ghi Nhập" : "Danh sách Ghi Xuất"}</h2>

              {/* Nút Thêm */}
              <button
                className="flex items-center px-4 py-2 text-white bg-blue-500 rounded"
                onClick={() => handleOpenRightPanel(activeTab === "nhap" ? addForms.Nhap : addForms.Xuat)}
              >
                <i className="mr-2 fas fa-plus"></i> Thêm
              </button>
            </div>
            <LeftPanel activeComponent={leftPanelComponent} />
          </div>

          {/* RightPanel */}
          {activeRightPanel && (
            <div className="w-2/5 transition-all duration-300">
              <RightPanel activeComponent={rightPanelComponent} onClose={handleCloseRightPanel} />
            </div>
          )}
        </div>
  );
};

export default NhapXuat;
