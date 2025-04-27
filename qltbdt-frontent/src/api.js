import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}`|| 'http://localhost:5000/api',
  withCredentials: true,
});

// Interceptor để xử lý lỗi tập trung 
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    toast.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    return Promise.reject(error);
  }
);

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

export const forgotPasswordAPI = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error("Lỗi gửi yêu cầu quên mật khẩu:", error);
    throw error;
  }
};

export const resetPasswordAPI = async (token, newPassword) => {
  try {
    // Backend route là /reset-password, gửi token và newPassword
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    throw error;
  }
};

// ============================================================================================ //

// ========= CÁC HÀM API CHO USERS ======================================================= //
export const getUserFromApi = async () => {
  try {
    const res = await api.get('/auth/me');
    return res.data.user;
  } catch (error) {
    console.error("Lỗi lấy thông tin user:", error.response?.data || error.message);
    return null;
  }
};

export const fetchAllUsersList = async () => {
  try {
    const response = await api.get("/user");
    if (!Array.isArray(response.data)) {
      console.error("API /api/users did not return an array!", response.data);
      return [];
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching all users list:", error.response?.data || error.message);
    throw error;
  }
};

export const getUsersPaginated = (page = 1, limit = 10, search = '') => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (search) {
    params.append('search', search);
  }
  return api.get(`/user?${params.toString()}`);
};


export const createUser = async (userData) => {
  try {
    const response = await api.post('/user', userData);
    return response.data;
  } catch (error) {
    console.error("Lỗi tạo người dùng:", error);
    throw error;
  }
};

// Hàm updateUser nhận cả sDT
export const updateUser = async (id, userData) => {
  try {
    const updateData = {
      hoTen: userData.hoTen,
      email: userData.email,
      ngaySinh: userData.ngaySinh || null,
      gioiTinh: userData.gioiTinh,
      sDT: userData.sDT || null
    };
    const response = await api.put(`/user/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi cập nhật người dùng ${id}:`, error);
    throw error;
  }
};

// Hàm đổi mật khẩu (placeholder - cần API backend)
export const updatePassword = async (passwordData) => {
  // passwordData = { currentPassword, newPassword, confirmPassword }
  try {
    // Thay bằng endpoint thực tế khi có, ví dụ: PATCH /user/update-password
    const response = await api.patch('/user/update-my-password', passwordData);
    return response.data;
  } catch (error) {
    console.error(`Lỗi đổi mật khẩu:`, error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/user/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi xóa người dùng ${id}:`, error);
    throw error;
  }
};

export const uploadAvatar = async (userId, formData) => {
  try {
    const response = await api.post(`/user/uploadAvatar/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error(`Lỗi upload avatar cho user ${userId}:`, error);
    throw error;
  }
};

export const updateUserStatus = (userId, newStatus) => {
  return api.patch(`/user/${userId}/status`, { status: newStatus });
};
// ============================================================================================ //

// lấy tất cả Loại Thiết Bị
export const getThietBi = async () => {
  try {
    console.log("API Request: /thietbi?limit=9999 (Fetching all)");
    const response = await api.get("/thietbi?limit=9999");
    return response;
  } catch (error) {
    console.error("Lỗi khi gọi API getThietBi (fetch all):", error);
    throw error;
  }
};

// Tạo Loại Thiết Bị mới
export const createThietBi = async (thietBiData) => {
  try {
    // Không cần gửi ID, backend sẽ tự tạo
    // Đảm bảo thietBiData chứa các trường cần thiết: theloai_id, tenThietBi, moTa, donGia
    const response = await api.post("/thietbi", thietBiData);
    return response.data; // Trả về dữ liệu thiết bị vừa tạo (nếu có)
  } catch (error) {
    console.error("Lỗi khi tạo Loại Thiết Bị:", error.response?.data || error.message);
    throw error; // Ném lỗi để component xử lý
  }
};

export const deleteThietBi = (id) => api.delete(`/thietbi/${id}`);

export const getTTTBByMaThietBi = (maThietBi) => api.get(`/tttb/thietbi/${maThietBi}`);

// Lấy chi tiết một TTTB theo ID của nó
export const getTTTBById = async (tttbId) => {
  try {
    console.log(`API Request: /tttb/${tttbId}`);
    const response = await api.get(`/tttb/${tttbId}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy chi tiết TTTB ID ${tttbId}:`, error.response?.data || error.message);
    throw error;
  }
};

// Lấy danh sách Thiết Bị theo thể loại ID //
export const fetchThietBiByTheLoai = async (theLoaiId) => {
  if (!theLoaiId) return [];
  console.log(`API Request: /thietbi/by-theloai?theloai_id=${theLoaiId}`);
  const response = await api.get(`/thietbi/by-theloai?theloai_id=${theLoaiId}`);
  return response.data || [];
};

// ============================================================================================ //

// ======== CÁC HÀM API CHO PHÒNG ============================================================= //
export const fetchPhongList = async () => {
  const config = { withCredentials: true };
  const phongList = await api.get("/phong/phonglist", config);
  return phongList.data;
}

// lấy phòng có tài sản
export const fetchPhongCoTaiSanList = async () => {
  const config = { withCredentials: true };
  try {
      const response = await api.get("/phong/phonglistassets", config);
      return response.data; 
  } catch (error) {
      console.error("Lỗi gọi API fetchPhongCoTaiSanList:", error);
      throw error;
  }
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
  try {
      const { data } = await api.post("/phong", phongData);
      return data;
  } catch (error) {
      throw error; 
  }
};

export const updatePhongAPI = async ({ id, ...phongData }) => {
  const { data } = await api.put(`/phong/${id}`, phongData);
  return data;
};

export const deletePhongAPI = async (phongId) => {
  const { data } = await api.delete(`/phong/${phongId}`);
  return data;
};

export const removeThietBiFromPhongAPI = async (payload) => {
  const { phong_id, thongtinthietbi_id } = payload;

  if (!phong_id || !thongtinthietbi_id) {
    return Promise.reject(new Error("Thiếu ID phòng hoặc ID tài sản khi gọi API xóa khỏi phòng."));
  }

  const { data } = await api.post("/phong/xoathietbi", payload);
  return data;
};

export const removeMultipleFromPhongAPI = async (deviceList) => {
  if (!Array.isArray(deviceList) || deviceList.length === 0) {
    return Promise.reject(new Error("Danh sách thiết bị không hợp lệ."));
  }

  const { data } = await api.post("/phong/xoa-nhieu-thietbi", { list: deviceList });
  return data;
};


// Hàm  cho bảng Phong.js, sử dụng useQuery
export const fetchPhongTableData = async () => {
  try {
      // Gọi API lấy danh sách phòng cơ bản
      const response = await api.get("/phong"); 
      if (!Array.isArray(response.data)) {
          console.error("API fetch phòng không trả về mảng:", response.data);
          return [];
      }
      // Bổ sung totalDevices cho từng phòng
      const roomsWithDevices = await Promise.all(
          response.data.map(async (room) => {
              const totalDevices = await fetchTotalDevicesForRoom(room.id); 
              return { ...room, totalDevices };
          })
      );
      return roomsWithDevices;
  } catch (error) {
      console.error("Lỗi fetch dữ liệu phòng:", error);
      throw error;
  }
};

//============================================================================================ //

// ========= CÁC HÀM API CHO Thể loại ======================================================== //
/** Lấy danh sách TẤT CẢ thể loại */
export const fetchTheLoaiList = async () => {
  const { data } = await api.get("/theloai");
  return data;
};

export const fetchTheLoaiListWithCount = async () => {
  const { data } = await api.get("/theloai/theloaicount");
  return data;
};

/** Tạo thể loại mới */
export const createTheLoai = async (theLoaiData) => {
  // theLoaiData dự kiến là { theLoai: "Tên thể loại mới" }
  console.log("API Request: POST /theloai", theLoaiData);
  const response = await api.post("/theloai", theLoaiData);
  return response.data; // Trả về thể loại vừa tạo (nếu có)
};

/** Cập nhật thể loại */
export const updateTheLoai = async ({ id, ...theLoaiData }) => {
  // theLoaiData dự kiến là { theLoai: "Tên đã cập nhật" }
  console.log(`API Request: PUT /theloai/${id}`, theLoaiData);
  const response = await api.put(`/theloai/${id}`, theLoaiData);
  return response.data; // Trả về thể loại đã cập nhật (nếu có)
};

/** Xóa thể loại */
export const deleteTheLoai = async (id) => {
  console.log(`API Request: DELETE /theloai/${id}`);
  const response = await api.delete(`/theloai/${id}`);
  return response.data; // Thường trả về confirmation hoặc status
};

// ======================== End API Thể loại ================================================================= //


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
// ========= kết thúc api Lịch Trực & Phân Công ============================================================================================================================


// ========= API lịch trực ==================================================================

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

// ========= Kết thúc api lịch trực ========================================================

// ========= API BÁO HỎNG ==================================================================

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
  const { data } = await api.delete(`/baohong/${baoHongId}`);
  return data;
};

// Xóa hàng loạt báo hỏng (Bulk Delete)
export const deleteBulkBaohongAPI = async (baoHongIdsArray) => {
  if (!Array.isArray(baoHongIdsArray) || baoHongIdsArray.length === 0) {
    // Có thể trả về Promise.resolve hoặc ném lỗi tùy logic mong muốn
    console.warn("No IDs provided for bulk delete.");
    return { message: "Không có ID nào được chọn để xóa." };
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

export const fetchAssignedBaoHongAPI = async (filters = {}) => {
  // filters = { statuses: ['Đang Tiến Hành', 'Yêu Cầu Làm Lại'] }
  // hoặc filters = { statuses: ['Chờ Xem Xét'] }
  let queryString = '';
  if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) {
      const encodedStatuses = filters.statuses.map(status => encodeURIComponent(status)).join(',');
      queryString = `?statuses=${encodedStatuses}`;
  }

  try {
      const response = await api.get(`/baohong/assigned/me${queryString}`);

      if (!Array.isArray(response.data)) {
          console.error("API /baohong/assigned/me did not return an array!", response.data);
          return [];
      }
      return response.data; 
  } catch (error) {
      console.error("Error fetching assigned BaoHong:", error.response?.data || error.message);
      if (error.response?.status === 404 || error.response?.status === 401 || error.response?.status === 403) {
          return [];
      }
      throw error;
  }
};

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
  try {
    const response = await api.post('/baotri', logData);
    return response.data;
  } catch (error) {
    console.error("Lỗi tạo log bảo trì:", error);
    throw error;
  }
};

// Lấy lịch sử log của một báo hỏng
// export const getBaoHongLogAPI = async (baoHongId) => {
//   if (!baoHongId) return [];
//   try {
//     const response = await api.get(`/baotri/log/${baoHongId}`);
//     return response.data;
//   } catch (error) {
//     console.error(`Lỗi lấy log cho báo hỏng ${baoHongId}:`, error);
//     if (error.response?.status === 404) {
//       return [];
//     }
//     throw error;
//   }
// };

// // Lấy log bảo trì theo ID lịch bảo dưỡng
// export const getBaoTriLogsByLichBaoDuongIdAPI = async (lichbaoduongId) => {
//   const { data } = await api.get(`/baotri/log/${lichbaoduongId}`);
//   return data;
// };

// Lấy lịch sử log của một thongtinthietbi_id
// export const fetchBaoTriByThietBiAPI = async (thongtinthietbiId) => {
//   if (!thongtinthietbiId) {
//       return [];
//   }
//   try {
//       const { data } = await api.get(`/baotri/thietbi/${thongtinthietbiId}`);
//       return data || [];
//   } catch (error) {
//       console.error("Lỗi khi lấy log bảo trì theo thiết bị:", error);
//       throw error;
//   }
// };

/**
 * Lấy lịch sử log bảo trì dựa trên các ID cung cấp.
 */
export const fetchLogsAPI = async (params = {}) => {
  // Chỉ giữ lại một key ID hợp lệ đầu tiên tìm thấy để tránh gửi nhiều ID
  let validParams = {};
  if (params.lichbaoduong_id) {
    validParams = { lichbaoduong_id: params.lichbaoduong_id };
  } else if (params.baohong_id) {
    validParams = { baohong_id: params.baohong_id };
  } else if (params.thongtinthietbi_id) {
    validParams = { thongtinthietbi_id: params.thongtinthietbi_id };
  }

  if (Object.keys(validParams).length === 0) {
      console.warn("fetchLogsAPI called without a valid ID parameter.");
      return []; // Trả về mảng rỗng nếu không có ID hợp lệ
  }

  try {
    // Gọi endpoint mới '/baotri/logs' với query parameters
    const { data } = await api.get(`/baotri/logs`, { params: validParams });
    return data || []; // Trả về data hoặc mảng rỗng
  } catch (error) {
    console.error("Lỗi khi lấy log bảo trì:", error.response?.data || error.message);
    // Trả về mảng rỗng nếu lỗi 404 hoặc lỗi khác để component không bị crash
     if (error.response?.status === 404) {
      return [];
    }
    throw error; // Ném lỗi khác để React Query xử lý nếu cần
  }
};

// Upload ảnh hóa đơn
export const uploadInvoiceImagesAPI = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('hinhAnhHoaDon', file));
  try {
    const { data } = await api.post('/baotri/upload-invoice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.imageUrls; // Backend trả về { imageUrls: [...] }
  } catch (error) {
    console.error("Lỗi upload ảnh bảo trì:", error);
    throw error;
  }
};

// ============================================================================

// API cho Quản lý Tài sản
export const getAllTaiSanAPI = (params = {}) => {
  return api.get('/tttb/taisan', { params });
};

// Lấy thiết bị có thể phân bổ vào phòng
export const getTaiSanPhanBoHopLeAPI = () => {
  return api.get('/tttb/taisan-phanbo');
};

export const updateTinhTrangTaiSanAPI = (id, data) => {
  // data là { tinhTrang: 'cho_thanh_ly' }
  return api.put(`/tttb/taisan/${id}/tinhtrang`, data);
};

export const assignTaiSanToPhongAPI = (payload) => {
  const { thongtinthietbi_id, phong_id } = payload;
  if (!thongtinthietbi_id || !phong_id) {
    return Promise.reject(new Error("Thiếu ID tài sản hoặc ID phòng khi gọi API gán."));
  }
  return api.post(`/tttb/taisan/${thongtinthietbi_id}/phanbo`, { phong_id });
};

// === API CHO NHẬP  ============================================================================================ //

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

// Lấy danh sách TẤT CẢ phiếu nhập
export const getAllPhieuNhapAPI = async (params = {}) => {
  try {
    const { data } = await api.get(`/nhap`, { params });
    return data;
  } catch (error) {
    console.error("Lỗi lấy danh sách phiếu nhập:", error.response?.data || error.message);
    throw error;
  }
};

export const fetchThietBiListForSelectAPI = async () => {
  // Lấy danh sách Thiết Bị tinh gọn cho dropdown (bao gồm đơn giá gợi ý)
  const response = await api.get('/thietbi/for-select');
  return response.data;
};

export const createPhieuNhapWithDetailsAPI = async (payload) => {
  const response = await api.post('/nhap/create-with-details', payload);
  return response.data; // Backend trả về { message, phieuNhapId }
};

// Upload chứng từ cho phiếu nhập
export const uploadChungTuNhapAPI = async (phieuNhapId, formData) => {
  if (!phieuNhapId) throw new Error("ID Phiếu nhập là bắt buộc để upload chứng từ.");
  try {
    const { data } = await api.post(`/nhap/${phieuNhapId}/chungtu`, formData);
    return data; // Trả về danh sách URL chứng từ đã upload
  } catch (error) {
    console.error(`Lỗi upload chứng từ cho phiếu nhập ${phieuNhapId}:`, error.response?.data || error.message);
    throw error;
  }
};

// === API CHO XUẤT ======================================================================================================== //

export const fetchEligibleDevicesForExportAPI = async () => {
  const response = await api.get('/xuat/eligible-devices');
  return response.data;
};

export const createPhieuXuatAPI = async (payload) => {
  const response = await api.post('/xuat', payload);
  return response.data;
};

export const fetchPhieuXuatListAPI = async () => { 
  const response = await api.get('/xuat');
  return response.data;
};

export const fetchPhieuXuatDetailsAPI = async (phieuXuatId) => { 
  const response = await api.get(`/xuat/${phieuXuatId}`);
  return response.data;
};

// Upload chứng từ cho Phiếu Xuất 
export const uploadChungTuXuatAPI = async (phieuXuatId, formData) => {
  // Đảm bảo backend có route POST /api/xuat/:id/chungtu
  if (!phieuXuatId) throw new Error("ID Phiếu xuất không hợp lệ khi gọi API upload");
  try {
    const { data } = await api.post(`/xuat/${phieuXuatId}/chungtu`, formData);
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
 
// ============ CÁC HÀM API CHO GÓP Ý (GOPY) =====================================

/**
 * Gửi góp ý mới
 */
export const createGopYAPI = async (gopYData) => {
  try {
    const response = await api.post('/gopy', gopYData);
    return response.data; // Trả về { message, gopyId }
  } catch (error) {
    console.error("Lỗi khi gửi góp ý:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Vote (like/dislike) cho góp ý
 */
export const handleVoteAPI = async (gopyId, voteType) => {
  if (!gopyId) throw new Error("Thiếu ID góp ý để vote.");
  try {
    const response = await api.post(`/gopy/${gopyId}/vote`, { vote_type: voteType });
    return response.data; // Trả về { message, likes, dislikes }
  } catch (error) {
    console.error(`Lỗi khi vote cho góp ý ${gopyId}:`, error.response?.data || error.message);
    // Nếu là lỗi 409 (Conflict/Duplicate), có thể không cần ném lỗi ra ngoài mà chỉ trả về data lỗi
    if (error.response?.status === 409) {
        return error.response.data; // Trả về { error: "Bạn đã vote..." }
    }
    throw error;
  }
};

/**
 * Lấy danh sách góp ý công khai (phân trang)
 */
export const getPublicGopYAPI = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/gopy/public?page=${page}&limit=${limit}`);
    return response.data; // Trả về { data: [gopyWithComments...], pagination: {...} }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách góp ý công khai:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Thêm bình luận vào góp ý (cho admin/nhanvien)
 */
export const addCommentAPI = async (gopyId, noiDungBinhLuan) => {
   if (!gopyId) throw new Error("Thiếu ID góp ý để bình luận.");
  try {
    const response = await api.post(`/gopy/${gopyId}/comment`, { noiDungBinhLuan });
    return response.data; // Trả về { message, comment: {...} }
  } catch (error) {
    console.error(`Lỗi khi thêm bình luận cho góp ý ${gopyId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Lấy tất cả góp ý cho Admin xem
 */
export const getAllGopYForAdminAPI = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/gopy/admin?${params}`);
    return response.data; // Trả về [gopy...]
  } catch (error) {
    console.error("Lỗi khi lấy danh sách góp ý cho Admin:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Cập nhật góp ý (Admin)
 */
export const updateGopYAPI = async (gopyId, updateData) => {
   if (!gopyId) throw new Error("Thiếu ID góp ý để cập nhật.");
  try {
    const response = await api.put(`/gopy/${gopyId}`, updateData); // Sửa :id thành gopyId
    return response.data; // Trả về { message, updatedGopY: {...} }
  } catch (error) {
    console.error(`Lỗi khi cập nhật góp ý ${gopyId}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Xóa góp ý (Admin)
 */
export const deleteGopYAPI = async (gopyId) => {
  if (!gopyId) throw new Error("Thiếu ID góp ý để xóa.");
  try {
    const response = await api.delete(`/gopy/${gopyId}`);
    return response.data; // Trả về { message, deletedId }
  } catch (error) {
    console.error(`Lỗi khi xóa góp ý ${gopyId}:`, error.response?.data || error.message);
    throw error;
  }
};


// ======================== End API Góp Ý ================================================================================= //


// ========= CÁC HÀM API CHO LỊCH BẢO DƯỠNG ĐỊNH KỲ ======================================= //

/**
 * Tạo lịch bảo dưỡng định kỳ mới (Admin)
 */
export const createLichBaoDuongAPI = async (data) => {
  try {
    const response = await api.post('/lichbaoduong', data);
    toast.success(response.data?.message || "Tạo lịch bảo dưỡng thành công!");
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tạo lịch bảo dưỡng:", error);
    // Toast lỗi đã được xử lý bởi interceptor
    throw error;
  }
};

/**
 * Gợi ý danh sách thiết bị để baỏ dưỡng ko trùng với báo hỏng
 */
export const fetchThietBiTrongPhongToBaoDuong = async (phongId) => {
  const { data } = await api.get(`/lichbaoduong/danhsach-thietbi/${phongId}`);
  return data; // Trả về danh sách thiết bị
};

/**
 * Gợi ý nhân viên phù hợp để bảo dưỡng theo phòng và ngày (Admin)
 */
export const suggestNhanVienAPI = async (params) => {
  try {
    const response = await api.get('/lichbaoduong/suggest-staff', { params });
    return response.data; // Trả về danh sách nhân viên gợi ý [{ id, hoTen, chucvu, priority }, ...]
  } catch (error) {
    console.error("Lỗi khi gợi ý nhân viên:", error);
    throw error;
  }
};

/**
 * Lấy danh sách lịch bảo dưỡng (có phân trang và lọc)
 */
export const getLichBaoDuongListAPI = async (params = {}) => {
  try {
    const response = await api.get('/lichbaoduong', { params });
    return response.data; // Trả về { data: [...], pagination: {...} }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lịch bảo dưỡng:", error);
    if (error.response?.status === 404 || error.response?.status === 403) {
        return { data: [], pagination: { currentPage: 1, limit: params.limit || 10, totalItems: 0, totalPages: 0 } };
    }
    throw error;
  }
};

/**
 * Lấy danh sách công việc bảo dưỡng được giao cho nhân viên đang đăng nhập
 */
export const getMyLichBaoDuongAPI = async (params = {}) => {
   try {
    const response = await api.get('/lichbaoduong/my-tasks', { params });
    return response.data; // Trả về { data: [...], pagination: {...} }
  } catch (error) {
    console.error("Lỗi khi lấy công việc bảo dưỡng của tôi:", error);
     if (error.response?.status === 404 || error.response?.status === 403) {
        return { data: [], pagination: { currentPage: 1, limit: params.limit || 10, totalItems: 0, totalPages: 0 } };
    }
    throw error;
  }
};

/**
 * Cập nhật trạng thái hoặc thông tin của một lịch bảo dưỡng
 */
export const updateLichBaoDuongStatusAPI = async (id, data) => {
  try {
    const response = await api.patch(`/lichbaoduong/${id}/status`, data);
     toast.success(response.data?.message || "Cập nhật trạng thái thành công!");
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi cập nhật trạng thái lịch bảo dưỡng ${id}:`, error);
    throw error;
  }
};

/**
 * TẠO HÀNG LOẠT lịch bảo dưỡng định kỳ 
 */
export const createBulkLichBaoDuongAPI = async (payload) => {
  try {
    // Gọi endpoint POST /api/lichbaoduong/bulk
    const response = await api.post('/lichbaoduong/bulk', payload);
    toast.success(response.data?.message || "Tạo lịch bảo dưỡng hàng loạt thành công!");
    return response.data; // Trả về { message, insertedIds }
  } catch (error) {
    console.error("Lỗi khi tạo lịch bảo dưỡng hàng loạt:", error);
    // Toast lỗi đã được xử lý bởi interceptor
    throw error;
  }
};

/**
 * XÓA một lịch bảo dưỡng cụ thể (chỉ khi 'Chờ xử lý')
 */
export const deleteLichBaoDuongAPI = async (id) => {
  try {
    const response = await api.delete(`/lichbaoduong/${id}`);
    toast.success(response.data?.message || `Xóa lịch bảo dưỡng ID ${id} thành công!`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi xóa lịch bảo dưỡng ID ${id}:`, error);
    throw error;
  }
};

// API upload hình ảnh chứng từ cho lịch bảo dưỡng
// export const uploadChungTuBaoDuongAPI = async (lichBaoDuongId, formData) => { ... }

// ========= KẾT THÚC API LỊCH BẢO DƯỠNG ================================================= //


// ============ API THỐNG KÊ ==========================================
export const getThongKeTaiChinhTongQuanAPI = () => api.get('/thongke/tai-chinh');

export const getThongKeThietBiTheoTrangThaiAPI = () => api.get('/thongke/thiet-bi/theo-trang-thai');

export const getThongKeThietBiTheoPhongAPI = () => api.get('/thongke/thiet-bi/theo-phong');

export const getThongKeBaoHongAPI = () => api.get('/thongke/bao-hong/theo-phong-loai');

export const getThongKeChiPhiBaoTriTheoThangAPI = () => api.get('/thongke/chi-phi-bao-tri/theo-thang');

export const getThongKePhieuTheoThangAPI = () => api.get('/thongke/phieu/theo-thang');

export const getThongKeThietBiChiTietTheoTrangThaiAPI = (tinhTrang) => {
    if (!tinhTrang) return Promise.reject(new Error("Thiếu trạng thái để lọc thiết bị")); 
    return api.get('/thongke/thiet-bi-chi-tiet', { params: { tinhTrang } });
}

export const getThongKeBaoHongTheoThangAPI = () => api.get('/thongke/bao-hong/theo-thang');

export const getThongKeTongThuTheoThoiGianAPI = (params) => api.get('/thongke/tong-thu/theo-thang', { params }); // params = { year, month? }

export const getThongKeTongChiTheoThoiGianAPI = (params) => api.get('/thongke/tong-chi/theo-thang', { params }); // params = { year, month? }
