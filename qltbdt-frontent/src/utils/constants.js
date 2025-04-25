
// labels của các nút trong danh mục và Nhập xuất
export const categoryLabels = {
    Phong: "Phòng",
    TheLoai: "Thể Loại",
    ThietBi: "Thiết Bị",
    ViPham: "Vi Phạm",
    Nhap: "Ghi Nhập",
    Xuat: "Ghi Xuất"
};

export const categories = [
    { name: "Phòng", icon: "fas fa-door-open", key: "Phong" },
    { name: "Thể Loại", icon: "fas fa-tags", key: "TheLoai" },
    { name: "Tra Cứu Thông Tin Thiết Bị", icon: "fas fa-laptop", key: "ThietBi" },
    { name: "Vi Phạm", icon: "fas fa-exclamation-triangle", key: "ViPham" },
];

// Mapping danh mục với Form tương ứng khi thêm mới
export const addForms = {
    TheLoai: "FormTheLoai",
    ThietBi: "FormThietBi",
    Phong: "FormPhong",
    Nhap: "FormNhap",
    Xuat: "FormXuat",
    ThongTinThietBi: "FormPhieuNhap",
};

// Số tầng tối đa của từng tòa
export const maxTangTheoToa = {
    A: 7, X: 14, E: 7, G: 12, I: 12, "Bãi giữ xe": 3,
    B: 6, C: 6, D: 6, F: 6, H: 6, T: 6, V: 6,
    J: 6, K: 6, L: 6
};

// Danh sách tòa theo cơ sở
export const toaTheoCoSo = {
    "Chính": ["A", "B", "C", "D", "E", "F", "H", "T", "V", "X", "I", "G", "Bãi giữ xe"],
    "Phụ": ["J", "K", "L"]
};

//Chuyển đổi tình trạng sang có dấu
export const getTinhTrangLabel = (tinhTrang) => {
    switch (tinhTrang) {
        case "het_bao_hanh":
            return "Hết Bảo Hành";
        case "con_bao_hanh":
            return "Còn Bảo Hành";
        case "dang_bao_hanh":
            return "Đang Bảo Hành";
        case "da_bao_hanh":
            return "Đã Bảo Hành";
        case "muaMoi":
            return "Mua Mới";
        case "taiTro":
            return "Tài Trợ";
        case "de_xuat_thanh_ly":
            return "Đề Xuất Thanh Lý";
        case "cho_thanh_ly":
            return "Chờ Thanh Lý";
        case "da_thanh_ly":
            return "Đã Thanh Lý";
        case "mat_mat":
            return "Mất Mát";
        case "xuat_tra":
            return "Xuất Trả";
        case "dieu_chuyen":
            return "Điều Chuyển";
        case "thanh_ly":
            return "Thanh Lý";
        case "nguoidung":
            return "Người Dùng"
        case "nhanvien":
            return "Nhân Viên";
        case "admin":
            return "Quản Trị Viên";
        case "on":
            return "Bật";
        case "off":
            return "Tắt";
        default:
            return tinhTrang;
    }
};

export const TINH_TRANG_OPTIONS = [
    { value: "con_bao_hanh", label: "Còn Bảo Hành" },
    { value: "het_bao_hanh", label: "Hết Bảo Hành" },
    { value: "dang_bao_hanh", label: "Đang Bảo Hành" },
    { value: "da_bao_hanh", label: "Đã Bảo Hành" },
    { value: "cho_thanh_ly", label: "Chờ Thanh Lý" },
    { value: "de_xuat_thanh_ly", label: "Đề Xuất Thanh Lý" },
    { value: "da_thanh_ly", label: "Đã Thanh Lý" },
    { value: "mat_mat", label: "Mất Mát" },
    { value: "xuat_tra", label: "Xuất Trả" },
    { value: "dieu_chuyen", label: "Điều Chuyển" }
  ];

export const getUuTienLabel = (priority) => {
    if (priority === 1) return 'Phụ trách phòng';
    if (priority === 2) return 'Đang trực';
    return 'Còn lại';
};