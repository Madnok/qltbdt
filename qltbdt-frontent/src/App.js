import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import NhapXuat from "./pages/NhapXuat";
import DanhMuc from "./pages/DanhMuc";
import ThongKe from "./pages/ThongKe";
import NguoiDung from "./pages/NguoiDung";
import BaoTri from "./pages/BaoTri";
import LichTruc from "./pages/LichTruc";
import PrivateRoute from "./utils/PrivateRoutes";
import BaoHongGoiY from "./pages/BaoHongGoiY";
import { AuthProvider } from "../src/context/AuthProvider";
import AppLayout from "../src/components/layout/AppLayout";

function Layout() {
  return (
    <Routes>
      <Route path="/" element={<BaoHongGoiY />} />

      <Route path="/login" element={<Login />} />

      {/* AppLayout */}
      <Route element={<AppLayout />}>
        <Route element={<PrivateRoute allowedRoles={["admin", "nhanvien"]} />}>
          <Route path="/baotri" element={<BaoTri />} />
          <Route path="/danhmuc" element={<DanhMuc />} />
          <Route path="/lichtruc" element={<LichTruc />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["admin", "nhanvien", "nguoidung"]} />}>
          <Route path="/nguoidung" element={<NguoiDung />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
          <Route path="/nhapxuat" element={<NhapXuat />} />
          <Route path="/thongke" element={<ThongKe />} />
        </Route>
      </Route>

      {/* 404 */}
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
