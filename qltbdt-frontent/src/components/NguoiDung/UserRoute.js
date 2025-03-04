import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthProvider";
import { useRefresh } from "../../utils/helpers";

const UserRoute = () => {
  const { user, refreshUser, /*updateUser*/ } = useAuth();
  const [userData, setUserData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const { refresh, handleRefresh } = useRefresh();

  useEffect(() => {
    if (user) {
      axios
        .get(`http://localhost:5000/api/user/${user.id}`, { withCredentials: true })
        .then((response) => {
          const userData = response.data;
          // Chuyển đổi ngaySinh về dạng YYYY-MM-DD để hiển thị đúng
          if (userData.ngaySinh) {
            userData.ngaySinh = new Date(userData.ngaySinh).toISOString().split("T")[0];
          }
          setUserData(userData);
          setEditData(userData);
        })
        .catch((error) => console.error("Lỗi khi tải thông tin người dùng:", error));
    }
  }, [user, refresh]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };
  // Xử lý khi chọn ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra kích thước hình vuông
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      if (img.width !== img.height) {
        alert("Ảnh phải là hình vuông!");
      } else {
        setAvatar(file);
        setPreview(URL.createObjectURL(file));
      }
    };
  };
  // Upload avatar lên server
  const handleUploadAvatar = async () => {
    if (!avatar) return alert("Vui lòng chọn ảnh!");

    const formData = new FormData();
    formData.append("avatar", avatar);

    try {
      // eslint-disable-next-line
      const response = await axios.post(
        `http://localhost:5000/api/user/uploadAvatar/${user.id}`,
        formData,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      alert("Cập nhật avatar thành công!");
      handleRefresh();
      refreshUser();
      //updateUser(response.data);
    } catch (error) {
      console.error("Lỗi khi tải ảnh lên:", error);
      alert("Có lỗi xảy ra khi cập nhật avatar!");
    }
  };

  const handleUpdate = () => {
    const updatedData = { ...editData };

    // Chuyển đổi ngaySinh thành dạng YYYY-MM-DD
    if (updatedData.ngaySinh) {
      updatedData.ngaySinh = new Date(updatedData.ngaySinh).toISOString().split("T")[0];
    }

    axios
      .put(`http://localhost:5000/api/user/${user.id}`, updatedData, { withCredentials: true })
      .then((response) => {
        setUserData(response.data);
        setIsEditing(false);
        alert("Cập nhật thành công!");
        handleRefresh();
        refreshUser();
       // updateUser(response.data); // Cập nhật thông tin người dùng ngay lập tức
      })
      .catch((error) => console.error("Lỗi khi cập nhật thông tin:", error));
  };


  const handleCancelEdit = () => {
    setEditData(userData);
    setIsEditing(false);
    handleRefresh();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Vui Lòng Thêm Ngày Sinh";
    const [year, month, day] = dateStr.split("-");
    return `Ngày ${parseInt(day) + 1 } tháng ${parseInt(month)} năm ${year}`;
  };

  if (!userData) {
    return <p className="text-center text-gray-500">Đang tải thông tin...</p>;
  }

  return (
    <div className="flex flex-col max-h-full bg-gray-100">
      <div className="flex items-center justify-between p-4 bg-white border-b-2">
        <h2 className="text-xl font-semibold">Thông Tin Tài Khoản

        </h2>
      </div>
      <div className="p-4 bg-white">
        <div className="flex flex-col items-center my-4">
          <img
            src={preview || userData?.hinhAnh || "https://via.placeholder.com/150"}
            alt="Avatar"
            className="w-24 h-24 mb-2 rounded-full shadow-md"
          />
          {isEditing ? (
            <>
              <div className="flex flex-col items-center gap-3">
                <input type="file"  accept="image/*" onChange={handleFileChange} className="mt-2 text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" />
                <button onClick={handleUploadAvatar} className="px-4 py-2 mt-2 text-white bg-blue-500 rounded">
                  Cập nhật Avatar
                </button>
              </div>
            </>
          ) : (
            <span className="mt-2 font-semibold text-blue-600"> {userData?.username}</span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4">
          <label className="block">
            <span className="text-gray-700">Họ Tên:</span>
            <input
              type="text"
              name="hoTen"
              value={editData.hoTen}
              onChange={handleChange}
              disabled={!isEditing}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Ngày Sinh:</span>
            {isEditing ? (
              <input
                type="date"
                name="ngaySinh"
                value={editData.ngaySinh || ""}
                onChange={handleChange}
                className="block w-full p-2 mt-1 border border-gray-300 rounded-md"
              />
            ) : (
              <input
                type="text"
                value={formatDate(userData.ngaySinh)}
                readOnly={true}
                className="block w-full p-2 mt-1 bg-gray-100 border border-gray-300 rounded-md"
              />
            )}
          </label>
          <label className="block">
            <span className="text-gray-700">Giới Tính:</span>
            {isEditing ? (
              <select
                name="gioiTinh"
                value={editData.gioiTinh}
                onChange={handleChange}
                disabled={!isEditing}
                className="block w-full p-2 mt-1 border border-gray-300 rounded-md"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            ) : (
              <input
                type="text"
                value={userData.gioiTinh}
                readOnly={true}
                className="block w-full p-2 mt-1 bg-gray-100 border border-gray-300 rounded-md"
              />
            )}
          </label>
          <label className="block">
            <span className="text-gray-700">Email:</span>
            <input
              type="email"
              name="email"
              value={editData.email}
              onChange={handleChange}
              disabled={!isEditing}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md"
            />
          </label>
          <label className="block">
            <span className="text-gray-700">Số Điện Thoại:</span>
            <input
              type="text"
              name="sDT"
              value={editData.sDT}
              onChange={handleChange}
              disabled={!isEditing}
              className="block w-full p-2 mt-1 border border-gray-300 rounded-md"
            />
          </label>

          {/* Nút thao tác */}
          <div className="flex gap-4">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-2 mt-4 text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Thay Đổi Thông Tin
              </button>
            ) : (
              <>
                <button
                  onClick={handleUpdate}
                  className="w-full py-2 mt-4 text-white bg-gray-800 rounded-md hover:bg-gray-900"
                >
                  Cập Nhật
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="w-full py-2 mt-4 text-white bg-red-500 rounded-md hover:bg-red-600"
                >
                  Đóng
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRoute;

