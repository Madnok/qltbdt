import axios from "axios";

const API_URL = "http://localhost:5000";

export const register = (data) => 
  axios.post(`${API_URL}/api/auth/register`, data, { withCredentials: true });

export const login = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, data, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return null;
  }
};

export const logout = async () =>
  axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });

export const getUserFromApi = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
    return res.data.user;
  } catch (error) {
    return null;
  }
};

export const getThietBi = () => 
  axios.get(`${API_URL}/api/thietbi`, { withCredentials: true });
