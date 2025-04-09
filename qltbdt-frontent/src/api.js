import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

/* Thêm interceptor nếu muốn xử lý lỗi tập trung
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API call error:', error.response?.data || error.message);
    // Ví dụ: Xử lý lỗi 401 thì tự động logout
    // if (error.response?.status === 401) {
    //   // Gọi hàm logout hoặc điều hướng về trang login
    // }
    return Promise.reject(error);
  }
);
*/

// ========= CÁC HÀM API CHO đăng nhập =========================================== //
export const register = (data) =>
  api.post('/auth/register', data);

export const login = async (data) => {
  try {
    const response = await api.post('/auth/login', data);
    return response.data;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error.response?.data || error.message);
    throw error;
  }
};

export const logout = () =>
  api.post('/auth/logout', {});

export const getUserFromApi = async () => {
  try {
    const res = await api.get('/auth/me');
    return res.data.user;
  } catch (error) {
    console.error("Lỗi lấy thông tin user:", error.response?.data || error.message);
    return null;
  }
};

export const getThietBi = () =>
  api.get('/thietbi');

// ============================================================================================ //

// ======== CÁC HÀM API CHO PHÒNG ============================================================= //
export const fetchPhongList = async () => {
  const config = { withCredentials: true };
  const phongList = await api.get("/phong/phonglist", config);
  return phongList.data;
}
export const fetchPhongListWithDetails = async () => {
  const config = { withCredentials: true };
  const [phongRes, phongListRes] = await Promise.all([
    api.get("/phong", config),
    api.get("/phong/phonglist", config)
  ]);
  const phongDetails = phongRes.data;
  const phongList = phongListRes.data;
  const merged = phongList.map((phong) => {
    const detail = phongDetails.find((d) => d.id === phong.id) || {};
    return { ...phong, ...detail };
  });
  // Lấy tổng số thiết bị (có thể tối ưu sau)
  const updatedRooms = await Promise.all(
    merged.map(async (room) => {
      const totalDevices = await fetchTotalDevicesForRoom(room.id);
      return { ...room, totalDevices };
    })
  );
  return updatedRooms;
};

export const fetchTotalDevicesForRoom = async (phongId) => {
  try {
    const response = await api.get(`/phong/danhsach-thietbi/${phongId}`);
    return Array.isArray(response.data) ? response.data.length : 0;
  } catch (error) {
    if (error.response && (error.response.status === 404 || error.response.data?.message === "Phòng chưa có thiết bị nào!")) {
      return 0;
    }
    console.error(`Lỗi lấy tổng số thiết bị cho phòng ${phongId}:`, error.response?.data || error.message || error);
    return 0;
  }
};

export const fetchPhongDetail = async (phongId) => {
  const { data } = await api.get(`/phong/${phongId}`);
  return data;
};

export const fetchThietBiTrongPhong = async (phongId) => {
  const { data } = await api.get(`/phong/danhsach-thietbi/${phongId}`);
  return data; // Trả về danh sách thiết bị
};

export const addPhongAPI = async (phongData) => {
  const { data } = await api.post("/phong", phongData);
  return data;
};

export const updatePhongAPI = async ({ id, ...phongData }) => {
  const { data } = await api.put(`/phong/${id}`, phongData);
  return data;
};

export const deletePhongAPI = async (phongId) => {
  const { data } = await api.delete(`/phong/${phongId}`);
  return data;
};

export const addThietBiToPhongAPI = async (thietBiListData) => {
  const { data } = await api.post("/phong/add-thietbi", thietBiListData);
  return data;
};

export const removeThietBiFromPhongAPI = async (payload) => {
  const { data } = await api.post("/phong/xoathietbi", payload);
  return data;
};
//============================================================================================ //

// ========= CÁC HÀM API CHO Thể loại và Thiết bị =========================================== //
export const fetchTheLoaiList = async () => {
  const { data } = await api.get("/theloai");
  return data;
};

export const fetchThietBiConLai = async () => {
  const { data } = await api.get("/thietbi/thietbiconlai");
  return data;
};

export const fetchThongTinThietBiChuaPhanBo = async (thietbi_id) => {
  const { data } = await api.get(`/tttb/unassigned`, { params: { thietbi_id } });
  return data;
};
// ========================================================================================= //


// ======== CÁC HÀM API CHO PHÂN CA ======================================================== //

// Lấy danh sách tất cả phòng (định dạng ID và tên)
export const fetchAllRooms = () =>
  api.get('/phong/phonglist');

// Lấy danh sách ID phòng được gán cho nhân viên cụ thể
export const fetchAssignedRooms = async (employeeId) => {
  // Trả về mảng rỗng nếu không có employeeId để tránh lỗi gọi API
  if (!employeeId) {
    return [];
  }
  try {
    // Gọi API và đợi kết quả
    const response = await api.get(`/user/${employeeId}/phong-phutrach`);

    // Thêm kiểm tra để đảm bảo cấu trúc đúng và phongList là mảng
    if (response?.data && Array.isArray(response.data.phongList)) {
      return response.data.phongList; // Chỉ trả về mảng phòng
    } else {
      return [];
    }
  } catch (error) {
    console.error(`Error fetching assigned rooms for employee ${employeeId}:`, error.response?.data || error.message);
    return [];
  }
};

// Cập nhật phân công cho nhân viên gồm addAssignedRooms và removeAssignedRooms
export const updateAssignments = (employeeId, phongIdsArray) =>
  // Ví dụ API là PUT nhận toàn bộ danh sách mới
  api.put(`/nhanvien/${employeeId}/phong-phutrach`, { phongIds: phongIdsArray });

// hàm riêng để thêm
export const addAssignedRooms = (employeeId, phongIdsArray) =>
  api.post(`/user/${employeeId}/phong-phutrach`, { phongIds: phongIdsArray });

// hàm riêng để xóa
export const removeAssignedRooms = (employeeId, phongIdsArray) =>
  api.delete(`/user/${employeeId}/phong-phutrach`, { data: { phongIds: phongIdsArray } });

//lấy lịch trình Nội bộ của nhân viên
export const fetchMyScheduleInternal = () => {
  return api.get('/lichtruc/');
};
// ======================================================================================= //


// ============ CÁC HÀMAPI cho Lịch Trực & Phân Công ===================================== //
// ** GÁN Nhân Viên VÀO Phòng**
export const fetchNhanVienList = async () => {
  try {
    const response = await api.get('/lichtruc/nhanvien');
    // Nếu response.data không phải là mảng, báo lỗi hoặc trả về mảng rỗng
    if (!Array.isArray(response.data)) {
      console.error("LỖI: API /api/lichtruc/nhanvien KHÔNG trả về một mảng!", response.data);
      throw new Error("API /api/lichtruc/nhanvien không trả về định dạng mảng như mong đợi.");
      //  Hoặc trả về mảng rỗng để tránh lỗi.
      // return [];
    }
    return response.data;

  } catch (error) {
    console.error("Lỗi trong hàm fetchNhanVienList:", error.response?.data || error.message || error);
    throw error;
  }
};
export const fetchAllRoomsList = async () => { // Thêm async/await
  try {
    const response = await api.get('/phong/phonglist');

    if (!Array.isArray(response.data)) {
      console.error("!!! LỖI NGHIÊM TRỌNG: API /api/phong/phonglist KHÔNG trả về một mảng!", response.data);
      throw new Error("API /api/phong/phonglist không trả về định dạng mảng như mong đợi.");
    }
    return response.data;
  } catch (error) {
    console.error("XXX Lỗi trong hàm fetchAllRoomsList:", error.response?.data || error.message || error);
    throw error;
  }
};

export const fetchAssignedRoomsForEmployee = async (employeeId) => {
  if (!employeeId) {
    console.log("fetchAssignedRoomsForEmployee called with no employeeId");
    return []; // Trả về mảng rỗng nếu không có ID
  }
  try {
    const response = await api.get(`/user/${employeeId}/phong-phutrach`);

    // KIỂM TRA và TRẢ VỀ CHỈ PHẦN phongList
    if (response && response.data && Array.isArray(response.data.phongList)) {
      // Trả về mảng phòng nếu cấu trúc đúng
      return response.data.phongList;
    } else {
      // Log lỗi nếu cấu trúc không đúng mong đợi
      console.error(`Invalid data structure from /user/${employeeId}/phong-phutrach. Expected {hoTen, phongList: [...]}, received:`, response?.data);
      return []; // Trả về mảng rỗng để tránh lỗi ở component
    }
  } catch (error) {
    console.error(`Error fetching assigned rooms for employee ${employeeId}:`, error.response?.data || error.message);
    return [];
  }
};
export const addAssignedRoomsForEmployee = (employeeId, phongIdsArray) => api.post(`/user/${employeeId}/phong-phutrach`, { phongIds: phongIdsArray });
export const removeAssignedRoomsForEmployee = (employeeId, phongIdsArray) => api.delete(`/user/${employeeId}/phong-phutrach`, { data: { phongIds: phongIdsArray } });

// **Lịch Trực**
export const fetchAllLichTruc = async ({ queryKey }) => {
  const params = queryKey[1]; // Lấy phần tử thứ 2 làm params
  const { data } = await api.get('/lichtruc', { params });
  return data;
};

export const fetchMySchedule = async () => { // Hàm fetch lịch cá nhân
  const { data } = await api.get('/lichtruc/'); // Endpoint này cần trả về lịch của user đã login
  return data;
};

export const addLichTrucAPI = async (lichTrucData) => {
  const { data } = await api.post('/lichtruc/themlichtruc', lichTrucData);
  return data;
};

export const updateLichTrucAPI = async ({ id, ...lichTrucData }) => {
  const { data } = await api.put(`/lichtruc/${id}`, lichTrucData);
  return data;
};

export const deleteLichTrucAPI = async (lichTrucId) => {
  const { data } = await api.delete(`/lichtruc/${lichTrucId}`);
  return data;
};

export const saveBulkLichTrucChangesAPI = async (bulkData) => {
  const { data } = await api.post('/lichtruc/bulk-save', bulkData);
  return data;
};

// ========= API BÁO HỎNG (Bổ sung/Sửa đổi) ================================

// Fetch danh sách báo hỏng (thay thế fetchThongTinBaoHongAPI cũ nếu có)
export const fetchBaoHongListAPI = async () => {
  try {
    const response = await api.get("/baohong"); // Endpoint lấy danh sách báo hỏng
    // Thêm kiểm tra kiểu dữ liệu trả về
    if (!Array.isArray(response.data)) {
      console.error("API /api/baohong did not return an array!", response.data);
      return []; // Trả về mảng rỗng nếu không đúng cấu trúc
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching BaoHong list:", error.response?.data || error.message);
    throw error; // Ném lỗi để React Query xử lý
  }
};

// Cập nhật thông tin báo hỏng (Dùng cho Gán người xử lý, Đổi trạng thái, Đổi ưu tiên...)
export const updateBaoHongAPI = async ({ id, updateData }) => {
  // updateData là object chứa các trường cần cập nhật, vd: { nhanvien_id: 5, trangThai: 'Đã Duyệt', mucDoUuTien: 'Cao' }
  if (!id || !updateData) {
    throw new Error("Missing ID or updateData for updating BaoHong");
  }
  try {
    const response = await api.put(`/baohong/${id}`, updateData);
    return response.data; // Trả về kết quả từ backend (vd: thông báo thành công hoặc object đã cập nhật)
  } catch (error) {
    console.error(`Error updating BaoHong ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

// Xóa một báo hỏng
export const deleteBaoHongAPI = async (baoHongId) => {
  if (!baoHongId) {
    throw new Error("Missing ID for deleting BaoHong");
  }
  const response = await api.delete(`/baohong/${baoHongId}`);
  return response.data;
};

// Xóa hàng loạt báo hỏng (Bulk Delete)
// Giả định backend có route DELETE /api/baohong/bulk nhận body { ids: [...] }
export const deleteBulkBaohongAPI = async (baoHongIdsArray) => {
  if (!Array.isArray(baoHongIdsArray) || baoHongIdsArray.length === 0) {
    // Có thể trả về Promise.resolve hoặc ném lỗi tùy logic mong muốn
    console.warn("No IDs provided for bulk delete.");
    return { message: "Không có ID nào được chọn để xóa." };
    // throw new Error("No IDs provided for bulk delete.");
  }
  try {
    // Axios yêu cầu data cho DELETE phải nằm trong config object
    const response = await api.delete(`/baohong/bulk`, { data: { ids: baoHongIdsArray } });
    return response.data; // Trả về thông báo thành công từ backend
  } catch (error) {
    console.error(`Error bulk deleting BaoHong:`, error.response?.data || error.message);
    throw error;
  }
};

// Gán hàng loạt báo hỏng cho một nhân viên (Bulk Assign)
// Giả định backend có route POST /api/baohong/bulk-assign nhận body { ids: [...], nhanvien_id: ... }
// Backend cũng nên tự động chuyển trạng thái các báo hỏng này thành 'Đã Duyệt'
export const assignBulkBaohongAPI = async ({ baoHongIdsArray, nhanVienId }) => {
  if (!Array.isArray(baoHongIdsArray) || baoHongIdsArray.length === 0 || !nhanVienId) {
    throw new Error("Thiếu IDs báo hỏng hoặc ID nhân viên để gán hàng loạt.");
  }
  try {
    const payload = { ids: baoHongIdsArray, nhanvien_id: nhanVienId };
    const response = await api.post(`/baohong/bulk-assign`, payload);
    return response.data; // Trả về thông báo thành công từ backend
  } catch (error) {
    console.error(`Error bulk assigning BaoHong:`, error.response?.data || error.message);
    throw error;
  }
};

export const fetchAssignedBaoHongAPI = async () => {
  // Giả sử backend có route /api/baohong/assigned/me để lấy việc của user đang login
  // Hoặc bạn có thể lấy user.id từ context và gọi /api/baohong/assigned/:userId
  try {
    const response = await api.get("/baohong/assigned/me"); // *** Cần tạo API này ở backend ***
    if (!Array.isArray(response.data)) {
      console.error("API /assigned/me did not return an array!", response.data);
      return [];
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching assigned BaoHong:", error.response?.data || error.message);
    // Trả về mảng rỗng nếu lỗi (ví dụ 404 Not Found nếu chưa có việc nào)
    if (error.response?.status === 404) {
      return [];
    }
    throw error; // Ném lỗi khác để React Query xử lý
  }
};

// === (TÙY CHỌN) API lấy tất cả Users (Nếu cần hiển thị tên người báo cáo) ===
// export const fetchAllUsersList = async () => {
//   try {
//     const response = await api.get("/users"); // Giả sử có API này
//     if (!Array.isArray(response.data)) {
//       console.error("API /api/users did not return an array!", response.data);
//       return [];
//     }
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching all users list:", error.response?.data || error.message);
//     throw error;
//   }
// };

// ==========================================================================

// ========= CÁC HÀM API CHO BẢO TRÌ ==========================================
// Lấy danh sách task đang tiến hành/yêu cầu làm lại của nhân viên
export const fetchMyTasksAPI = async () => {
  try {
    const { data } = await api.get("/baotri/my-tasks");
    // Thêm kiểm tra kiểu dữ liệu trả về nếu cần
    if (!Array.isArray(data)) {
      console.error("API /api/baotri/my-tasks did not return an array!", data);
      return []; // Trả về mảng rỗng nếu không đúng cấu trúc
    }
    return data;
  } catch (error) {
    console.error("Error fetching my tasks:", error.response?.data || error.message);
    // Trả về mảng rỗng nếu lỗi 404 (không có task) hoặc lỗi khác
    if (error.response?.status === 404) {
      return [];
    }
    throw error; // Ném lỗi khác để React Query xử lý
  }
};

// Tạo log bảo trì mới
export const createLogBaoTriAPI = async (logData) => {
  const { data } = await api.post('/baotri', logData);
  return data;
};

// Lấy lịch sử log của một báo hỏng
export const getBaoHongLogAPI = async (baoHongId) => {
  const { data } = await api.get(`/baotri/log/${baoHongId}`);
  return data;
};

// Upload ảnh hóa đơn
export const uploadInvoiceImagesAPI = async (files) => {
  const formData = new FormData();
  // Lưu ý tên field 'hinhAnhHoaDon' phải khớp với backend multer
  files.forEach(file => formData.append('hinhAnhHoaDon', file));
  const { data } = await api.post('/baotri/upload-invoice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.imageUrls; // Backend trả về { imageUrls: [...] }
};
// ============================================================================

// API cho Quản lý Tài sản
export const getAllTaiSanAPI = (params = {}) => {
  // params có thể là { trangThai: '...', phongId: '...' }
  return api.get('/tttb/taisan', { params });
};

export const updateTinhTrangTaiSanAPI = (id, data) => {
  // data là { tinhTrang: 'cho_thanh_ly' }
  return api.put(`/tttb/taisan/${id}/tinhtrang`, data);
};

export const assignTaiSanToPhongAPI = (thongtinthietbi_id, phong_id) => {
  return api.post(`/tttb/taisan/${thongtinthietbi_id}/phanbo`, { phong_id });
};

// === API CHO NHẬP  ===

// Lấy chi tiết một phiếu nhập bằng ID
export const getPhieuNhapByIdAPI = async (id) => {
  if (!id) throw new Error("ID Phiếu nhập không hợp lệ khi gọi API");
  try {
    const { data } = await api.get(`/nhap/${id}`);
    return data; // Trả về dữ liệu chi tiết từ API
  } catch (error) {
    console.error(`Lỗi lấy chi tiết phiếu nhập ${id}:`, error.response?.data || error.message);
    throw error; // Ném lỗi để useQuery xử lý
  }
};

// API lấy danh sách TẤT CẢ phiếu nhập
export const getAllPhieuNhapAPI = async (params = {}) => {
  try {
    const { data } = await api.get(`/nhap`, { params });
    return data;
  } catch (error) {
    console.error("Lỗi lấy danh sách phiếu nhập:", error.response?.data || error.message);
    throw error;
  }
};

// API để upload chứng từ cho phiếu nhập
export const uploadChungTuNhap = async (phieuNhapId, formData) => {
  if (!phieuNhapId) throw new Error("ID Phiếu nhập là bắt buộc để upload chứng từ.");
  try {
    const { data } = await api.post(`/nhap/${phieuNhapId}/chungtu`, formData);
    return data; // Trả về danh sách URL chứng từ đã upload
  } catch (error) {
    console.error(`Lỗi upload chứng từ cho phiếu nhập ${phieuNhapId}:`, error.response?.data || error.message);
    throw error;
  }
};

// === API CHO XUẤT === //

export const getAllPhieuXuatAPI = () => {
  return api.get('/phieuxuat');
};

export const getPhieuXuatByIdAPI = async (id) => {
  if (!id) throw new Error("ID Phiếu xuất không hợp lệ khi gọi API");
  try {
    const { data } = await api.get(`/phieuxuat/${id}`);
    return data; // Trả về dữ liệu chi tiết từ API
  } catch (error) {
    console.error(`Lỗi lấy chi tiết phiếu nhập ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const createPhieuXuatAPI = (data) => {
  // data là { lyDoXuat, ghiChu, giaTriThanhLy, danhSachThietBiIds }
  return api.post('/phieuxuat', data);
};

// Upload chứng từ cho Phiếu Xuất 
export const uploadChungTuXuatAPI = async (phieuXuatId, formData) => {
  // Đảm bảo backend có route POST /api/phieuxuat/:id/chungtu
  if (!phieuXuatId) throw new Error("ID Phiếu xuất không hợp lệ khi gọi API upload");
  try {
    const { data } = await api.post(`/phieuxuat/${phieuXuatId}/chungtu`, formData);
    return data;
  } catch (error) {
    console.error(`Lỗi upload chứng từ phiếu xuất ${phieuXuatId}:`, error.response?.data || error.message);
    throw error;
  }
};

// =========================== kết thúc nhập xuất =========================================================================== //


// API lấy danh sách LOẠI THIẾT BỊ theo thể loại (dùng cho dropdown)
export const getThietBiByTheLoaiAPI = async (theLoaiId) => {
  if (!theLoaiId) return []; // Trả về rỗng nếu không có thể loại ID
  try {
    // Đổi endpoint cho đúng với API của bạn
    const { data } = await api.get(`/theloai/${theLoaiId}`);

    // Trích xuất danh sách thiết bị từ cấu trúc trả về
    if (data && Array.isArray(data.dsThietBi)) {
      return data.dsThietBi; // Chỉ trả về mảng thiết bị
    } else {
      console.warn(`API /theloai/${theLoaiId} không chứa mảng danh sách thiết bị.`);
      return [];
    }
  } catch (error) {
    console.error(`Lỗi lấy danh sách thiết bị cho thể loại ${theLoaiId}:`, error.response?.data || error.message);
    // Trả về mảng rỗng nếu lỗi 404 hoặc lỗi khác
    return [];
  }
};



