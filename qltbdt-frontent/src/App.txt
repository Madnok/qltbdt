import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import NhapXuat from "./pages/NhapXuat";
import BaoHong from "./pages/BaoHong";
import DanhMuc from "./pages/DanhMuc";
import ThongKe from "./pages/ThongKe";
import NguoiDung from "./pages/NguoiDung";
import BaoTri from "./pages/BaoTri";
import MuonTra from "./pages/MuonTra";
import LichTruc from "./pages/LichTruc";
import PrivateRoute from "./utils/PrivateRoutes";
import { AuthProvider } from "./context/AuthProvider";
function Layout() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Route cho admin, nhân viên (ví dụ) */} 
      <Route element={<PrivateRoute allowedRoles={["admin", "nhanvien"]} />}> 
        <Route path="/nhapxuat" element={<NhapXuat />} />
        <Route path="/muontra" element={<MuonTra />} />
        <Route path="/baotri" element={<BaoTri />} />
        <Route path="/danhmuc" element={<DanhMuc />} />
        <Route path="/lichtruc" element={<LichTruc />} />
      </Route>
      
      <Route element={<PrivateRoute allowedRoles={["admin", "nhanvien", "nguoidung"]} />}> \n
        <Route path="/baohong" element={<BaoHong />} />
        <Route path="/nguoidung" element={<NguoiDung />} />
      </Route>
      
      <Route element={<PrivateRoute allowedRoles={["admin"]} />}> \n
        <Route path="/thongke" element={<ThongKe />} />
      </Route>
      
      <Route path="*" element={<h1>404 - Không tìm thấy trang</h1>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </Router>
  );
}

export default App;
