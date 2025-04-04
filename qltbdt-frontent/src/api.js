// import axios from "axios";

// const API_URL = "http://localhost:5000";

// export const register = (data) => 
//   axios.post(`${API_URL}/api/auth/register`, data, { withCredentials: true });

// export const login = async (data) => {
//   try {
//     const response = await axios.post(`${API_URL}/api/auth/login`, data, { withCredentials: true });
//     return response.data;
//   } catch (error) {
//     console.error("Lỗi đăng nhập:", error);
//     return null;
//   }
// };

// export const logout = async () =>
//   axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });

// export const getUserFromApi = async () => {
//   try {
//     const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
//     return res.data.user;
//   } catch (error) {
//     return null;
//   }
// };
// //test push git
// export const getThietBi = () => 
//   axios.get(`${API_URL}/api/thietbi`, { withCredentials: true });

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

// Lấy danh sách nhân viên (có thể dùng lại từ đâu đó hoặc tạo mới)
export const fetchNhanVien = () =>
    api.get('/lichtruc/nhanvien'); 

// Lấy danh sách tất cả phòng (định dạng ID và tên)
export const fetchAllRooms = () =>
    api.get('/phong/phonglist');

// Lấy danh sách ID phòng được gán cho nhân viên cụ thể
export const fetchAssignedRooms = (employeeId) =>
  api.get(`/user/${employeeId}/phong-phutrach`);

// Cập nhật phân công cho nhân viên (gộp cả thêm và xóa) addAssignedRooms và removeAssignedRooms
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