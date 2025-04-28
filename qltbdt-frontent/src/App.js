import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import NhapXuat from "./pages/NhapXuat";
import DanhMuc from "./pages/DanhMuc";
import ThongKe from "./pages/ThongKe";
import NguoiDung from "./pages/NguoiDung";
import LichTruc from "./pages/LichTruc";
import PrivateRoute from "./utils/PrivateRoutes";
import BaoHongGoiY from "./pages/BaoHongGoiY";
import NotFound from "./pages/NotFound";
import AppLayout from "../src/components/layout/AppLayout";
import ThongTinBaoHong from "../src/components/LichTruc/ThongTinBaoHong";
import QuanLyTaiSan from './pages/QuanLyTaiSan';
import ResetPasswordPage from './pages/ResetMatKhau';
import ForgotPasswordPage from './pages/QuenMatKhau';

function Layout() {
  return (
    <Routes>
      <Route path="/" element={<BaoHongGoiY />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* AppLayout */}
      <Route element={<AppLayout />}>
      
        <Route element={<PrivateRoute allowedRoles={["admin", "nhanvien"]} />}>
          <Route path="/danhmuc" element={<DanhMuc />} />
          <Route path="/lichtruc" element={<LichTruc />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["admin", "nhanvien", "nguoidung"]} />}>
          <Route path="/nguoidung" element={<NguoiDung />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
          <Route path="/nhapxuat" element={<NhapXuat />} />
          <Route path="/thongke" element={<ThongKe />} />
          <Route path="/thongtinbaohong" element={<ThongTinBaoHong />} />
          <Route path="/quanlytaisan" element={<QuanLyTaiSan />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}


function App() {
  return (
    <Layout />
  );
}

export default App;
