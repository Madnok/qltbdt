// import axios from "axios";
// import { useEffect, useState } from "react";
// import { maxTangTheoToa, toaTheoCoSo } from "../../utils/constants";
// import { BsTrash } from "react-icons/bs";

// const FormPhong = ({ onClose, refreshData }) => {
//     const [activeTab, setActiveTab] = useState("themPhong"); // Quản lý tab đang hiển thị
//     // eslint-disable-next-line
//     const [newId, setNewId] = useState(0); // ID phòng mới
//     const [formData, setFormData] = useState({
//         coSo: "",
//         toa: "",
//         tang: "",
//         soPhong: "",
//         chucNang: "",
//     });

//     const [phongList, setPhongList] = useState([]);
//     const [theLoaiList, setTheLoaiList] = useState([]);
//     const [selectedTheLoai, setSelectedTheLoai] = useState("");
//     const [selectedThietBi, setSelectedThietBi] = useState("");
//     const [selectedPhong, setSelectedPhong] = useState("");
//     const [dsThietBi, setDsThietBi] = useState([]);
//     const [thietBiTrongPhong, setThietBiTrongPhong] = useState([]);

//     useEffect(() => {
//         axios.get("http://localhost:5000/api/phong")
//             .then(response => setNewId(response.data.length + 1))
//             .catch(error => console.error("Lỗi tải danh sách phòng:", error));

//         axios.get("http://localhost:5000/api/tttb/phong-list")
//             .then(response => setPhongList(response.data))
//             .catch(error => console.error("Lỗi tải danh sách phòng:", error));

//         axios.get("http://localhost:5000/api/theloai")
//             .then(response => setTheLoaiList(response.data))
//             .catch(error => console.error("Lỗi tải thể loại:", error));
//     }, []);

//     // Khi chọn thể loại, lấy danh sách thiết bị
//     useEffect(() => {
//         if (selectedTheLoai) {
//             axios.get(`http://localhost:5000/api/theloai/${selectedTheLoai}`)
//                 .then(response => {
//                     console.log("Danh sách thiết bị:", response.data.dsThietBi);
//                     setDsThietBi(response.data.dsThietBi);
//                 })
//                 .catch(error => console.error("Lỗi tải thiết bị:", error));
//         }
//     }, [selectedTheLoai]); // Chạy khi selectedTheLoai thay đổi

//     // Xử lý thay đổi input Phòng
//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         let updatedFormData = { ...formData, [name]: value };

//         // Reset tầng nếu tòa thay đổi
//         if (name === "toa") {
//             updatedFormData.tang = ""; // Reset tầng
//         }

//         setFormData(updatedFormData);
//     };

//     // Xử lý thay đổi input Thiết Bị
//     const handleThietBiChange = (e) => {
//         const thietBi = dsThietBi.find(tb => tb.id === parseInt(e.target.value));
//         setSelectedThietBi(thietBi || "");
//     };

//     // Xử lý thêm thiết bị vào bảng dữ liệu chờ để lưu
//     const handleAddThietBi = () => {
//         // Tìm thông tin phòng và thiết bị
//         const selectedPhongDetails = phongList.find(p => p.id === parseInt(selectedPhong, 10));
//         const thietBiDetails = dsThietBi.find(tb => tb.tenThietBi === selectedThietBi.tenThietBi);

//         if (!selectedPhongDetails || !thietBiDetails) {
//             console.error("Phòng hoặc thiết bị chưa được chọn.");
//             return;
//         }

//         // Kiểm tra tồn kho
//         if (thietBiDetails.tonKho <= 0) {
//             alert(`Không thể thêm thiết bị vì tồn kho đã hết.`);
//             return;
//         }

//         // Cập nhật tồn kho sau khi thêm thiết bị
//         const updatedThietBiList = dsThietBi.map(tb =>
//             tb.tenThietBi === selectedThietBi.tenThietBi
//                 ? { ...tb, tonKho: tb.tonKho - 1 } // Giảm tồn kho
//                 : tb
//         );
//         setDsThietBi(updatedThietBiList);

//         // Kiểm tra nếu thiết bị với cùng phòng đã tồn tại
//         const existingIndex = thietBiTrongPhong.findIndex(
//             item => item.phong === selectedPhongDetails.phong && item.ten === selectedThietBi.tenThietBi
//         );

//         if (existingIndex !== -1) {
//             // Nếu trùng phòng và thiết bị, tăng số lượng
//             const updatedList = thietBiTrongPhong.map((item, index) =>
//                 index === existingIndex
//                     ? { ...item, soLuong: item.soLuong + 1 }
//                     : item
//             );
//             setThietBiTrongPhong(updatedList);
//         } else {
//             // Nếu không trùng, thêm dòng mới
//             const newEntry = {
//                 phong: selectedPhongDetails.phong, // Lấy tên phòng
//                 ten: selectedThietBi.tenThietBi,  // Tên thiết bị
//                 soLuong: 1                        // Mỗi lần thêm mặc định là 1
//             };
//             setThietBiTrongPhong([...thietBiTrongPhong, newEntry]);
//         }
//     };

//     // Xử lý lưu phòng
//     const handleSubmit = (e) => {
//         e.preventDefault();
//         axios.post("http://localhost:5000/api/phong", formData)
//             .then(() => {
//                 alert("Thêm phòng thành công!");
//                 refreshData();
//                 onClose();
//             })
//             .catch(error => console.error("Lỗi thêm phòng:", error));
//     };

//     // Xử lý nút Hủy
//     const handleReset = () => {
//         setFormData({
//             coSo: "",
//             toa: "",
//             tang: "",
//             soPhong: "",
//             chucNang: "",
//         });
//     };

//     // Xóa phần tử tại vị trí index
//     const handleDelete = (index) => {
//         // Lấy thông tin dòng bị xóa
//         const removedItem = thietBiTrongPhong[index];

//         // Cộng lại tồn kho của thiết bị
//         const updatedDsThietBi = dsThietBi.map(tb =>
//             tb.tenThietBi === removedItem.ten
//                 ? { ...tb, tonKho: tb.tonKho + removedItem.soLuong } // Cộng lại số lượng
//                 : tb
//         );
//         setDsThietBi(updatedDsThietBi);

//         // Xóa dòng khỏi bảng
//         const updatedList = thietBiTrongPhong.filter((_, i) => i !== index);
//         setThietBiTrongPhong(updatedList);
//     };

//     // Xử lý nhập liệu số lượng
//     const handleInputChange = (e, index) => {
//         const newSoLuong = parseInt(e.target.value) || 1; // Đảm bảo giá trị hợp lệ
//         const currentItem = thietBiTrongPhong[index]; // Lấy dòng hiện tại trong bảng
//         const thietBiDetails = dsThietBi.find(tb => tb.tenThietBi === currentItem.ten); // Lấy thông tin tồn kho thiết bị

//         if (!thietBiDetails) {
//             console.error("Không tìm thấy thông tin tồn kho của thiết bị.");
//             return;
//         }

//         // Tính sự khác biệt (delta) giữa số lượng mới và số lượng cũ
//         const delta = newSoLuong - currentItem.soLuong;

//         // Nếu số lượng mới vượt quá tồn kho hiện tại, dừng lại
//         if (delta > 0 && delta > thietBiDetails.tonKho) {
//             alert(`Số lượng vượt quá tồn kho! (Tồn kho hiện tại: ${thietBiDetails.tonKho})`);
//             return;
//         }

//         // Cập nhật tồn kho thiết bị
//         const updatedDsThietBi = dsThietBi.map(tb =>
//             tb.tenThietBi === currentItem.ten
//                 ? { ...tb, tonKho: tb.tonKho - delta } // Giảm hoặc tăng tồn kho dựa trên delta
//                 : tb
//         );
//         setDsThietBi(updatedDsThietBi);

//         // Cập nhật số lượng trong bảng
//         const updatedList = thietBiTrongPhong.map((item, i) =>
//             i === index ? { ...item, soLuong: newSoLuong } : item
//         );
//         setThietBiTrongPhong(updatedList);
//     };

//     // Lưu thiết bị vào phòng
//     const handleSaveThietBi = async () => {
//         if (!selectedPhong || !selectedThietBi) {
//             alert("Vui lòng chọn phòng và thiết bị!");
//             return;
//         }

//         const soLuong = thietBiTrongPhong.find(
//             (item) => item.ten === dsThietBi.find((tb) => tb.id === selectedThietBi.id)?.tenThietBi
//         )?.soLuong || 1;

//         try {
//             const response = await fetch("http://localhost:5000/api/tttb/themthietbivaophong", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                     phong_id: selectedPhong,
//                     thietbi_id: selectedThietBi.id, // Chỉ gửi id của thiết bị
//                     soLuong,
//                 }),
//             });

//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data = await response.json();
//             alert(data.message);
//         } catch (error) {
//             console.error("Lỗi khi lưu thiết bị:", error);
//             alert("Lưu thất bại!");
//         }
//     };


//     return (
//         <div className="flex flex-col h-full bg-white border-l shadow-md">
//             {/* Header */}
//             <div className="flex items-center justify-between p-4 bg-white border-b">
//                 <h2 className="text-lg font-semibold">Các Chức Năng Của Phòng</h2>
//                 <div className="flex space-x-4">
//                     <button className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300" onClick={onClose}>
//                         <i className="text-lg text-black fas fa-times"></i>
//                     </button>
//                 </div>
//             </div>
//             <div className="flex items-center bg-white">
//                 {/* Tabs */}
//                 <div className="flex flex-1 bg-white border-b">
//                     <button
//                         className={`flex-1 text-center py-4 font-semibold ${activeTab === "themPhong" ? "border-b-4 border-green-500 text-green-500" : "text-gray-400"}`}
//                         onClick={() => setActiveTab("themPhong")}
//                     >
//                         Thêm Phòng
//                     </button>
//                     <button
//                         className={`flex-1 text-center py-4 font-semibold ${activeTab === "themThietBi" ? "border-b-4 border-blue-500 text-blue-500" : "text-gray-400"}`}
//                         onClick={() => setActiveTab("themThietBi")}
//                     >
//                         Thêm Thiết Bị Vào Phòng
//                     </button>
//                 </div>
//             </div>
//             {/* Dữ Liệu Thêm Phòng Mới */}
//             {activeTab === "themPhong" && (
//                 <div className="grid grid-cols-2 gap-2 p-2 mb-2 space-2">
//                     {/* Cơ sở */}
//                     <div>
//                         <label className="block font-medium">Cơ Sở</label>
//                         <select name="coSo" value={formData.coSo} onChange={handleChange} className="w-full p-1 mt-1 border rounded">
//                             <option value="">Chọn cơ sở</option>
//                             <option value="Chính">Chính</option>
//                             <option value="Phụ">Phụ</option>
//                         </select>
//                     </div>

//                     {/* Tòa */}
//                     <div>
//                         <label className="block font-medium">Tòa</label>
//                         <select name="toa" value={formData.toa} onChange={handleChange} className="w-full p-1 mt-1 border rounded"
//                             disabled={!formData.coSo}>
//                             <option value="">Chọn tòa</option>
//                             {formData.coSo && toaTheoCoSo[formData.coSo].map(toa => (
//                                 <option key={toa} value={toa}>{toa}</option>
//                             ))}
//                         </select>
//                     </div>

//                     {/* Tầng */}
//                     <div>
//                         <label className="block font-medium">Tầng</label>
//                         <select name="tang" value={formData.tang} onChange={handleChange} className="w-full p-1 mt-1 border rounded"
//                             disabled={!formData.toa}>
//                             <option value="">Chọn tầng</option>
//                             {formData.toa && Array.from({ length: maxTangTheoToa[formData.toa] }, (_, i) => (
//                                 <option key={i + 1} value={i + 1}>{i + 1}</option>
//                             ))}
//                         </select>
//                     </div>

//                     {/* Số Phòng */}
//                     <div>
//                         <label className="block font-medium">Số Phòng</label>
//                         <select name="soPhong" value={formData.soPhong} onChange={handleChange} className="w-full p-1 mt-1 border rounded"
//                             disabled={!formData.tang}>
//                             <option value="">Chọn số phòng</option>
//                             {Array.from({ length: 20 }, (_, i) => (
//                                 <option key={i + 1} value={i + 1}>{i + 1}</option>
//                             ))}
//                         </select>
//                     </div>
//                     {/* Chức Năng */}
//                     <div className="col-span-2">
//                         <label className="block font-medium">Chức Năng</label>
//                         <input type="text" name="chucNang" value={formData.chucNang} onChange={handleChange} className="w-full p-1 mt-1 border rounded" />
//                     </div>
//                     <button
//                         type="submit"
//                         onClick={handleSubmit}
//                         className="w-full p-1 text-sm text-white bg-green-500 border rounded"
//                     >
//                         Lưu Phòng
//                     </button>
//                     <button
//                         type="button"
//                         className="w-full text-sm bg-gray-300 border rounded"
//                         onClick={handleReset}
//                     >
//                         Xóa Trắng
//                     </button>
//                 </div>
//             )}
//             {/* Thêm Thiết Bị Vào Phòng */}
//             {activeTab === "themThietBi" && (
//                 <div className="p-4 bg-white border-t-2">
//                     <div className="grid grid-cols-3 gap-2 pb-4">
//                         <select
//                             name="phong_id"
//                             value={selectedPhong}
//                             onChange={(e) => setSelectedPhong(e.target.value)}
//                             className="w-full p-1 border rounded-lg"
//                         >
//                             <option value="">Phòng</option>
//                             {phongList.map(p => (
//                                 <option key={p.id} value={p.id}>{p.phong}</option>
//                             ))}
//                         </select>
//                         <select value={selectedTheLoai}
//                             className="w-full p-1 border rounded-lg"
//                             disabled={!selectedPhong}
//                             onChange={(e) => setSelectedTheLoai(e.target.value)}
//                         >
//                             <option value="">Thể loại</option>
//                             {theLoaiList.map(tl => (
//                                 <option key={tl.id} value={tl.id}>{tl.theLoai}</option>
//                             ))}
//                         </select>
//                         <select
//                             name="thietbi"
//                             onChange={handleThietBiChange}
//                             className="w-full p-1 border rounded-lg"
//                             disabled={!selectedTheLoai}
//                         >
//                             <option value="">Thiết bị</option>
//                             {dsThietBi.map(tb => (
//                                 <option key={tb.id} value={tb.id}>
//                                     {tb.tenThietBi} (Còn: {tb.tonKho})
//                                 </option>
//                             ))}
//                         </select>
//                     </div>
//                     <div className="grid items-center grid-cols-2 gap-2 pb-4">
//                         <button
//                             onClick={handleSaveThietBi}
//                             className="w-full p-1 text-sm text-white transition-colors bg-green-500 border rounded hover:bg-green-600"
//                         >
//                             Lưu Thiết Bị
//                         </button>
//                         <button
//                             onClick={handleAddThietBi}
//                             className="w-full p-1 text-sm text-white transition-colors bg-blue-500 rounded hover:bg-blue-600"
//                         >
//                             Thêm Thiết Bị
//                         </button>
//                     </div>

//                     <table className="w-full border border-gray-300 table-auto">
//                         <thead className="bg-gray-100">
//                             <tr>
//                                 <th className="px-4 py-1 border">Phòng</th>
//                                 <th className="px-4 py-1 border">Tên Thiết Bị</th>
//                                 <th className="px-4 py-1 border">Số Lượng</th>
//                                 <th className="px-4 py-1 border">Tồn Kho</th>
//                                 <th className="px-4 py-1 border">Xóa</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {thietBiTrongPhong.map((item, index) => (
//                                 <tr key={index}>
//                                     <td className="px-4 py-1 text-center border">{item.phong}</td>
//                                     <td className="px-4 py-1 text-center border">{item.ten}</td>
//                                     <td className="px-4 py-1 text-center border">
//                                         <input
//                                             type="number"
//                                             value={item.soLuong}
//                                             onChange={(e) => handleInputChange(e, index)}
//                                             className="w-16 p-1 text-center border rounded"
//                                             min="1"
//                                         />
//                                     </td>
//                                     <td className="px-4 py-1 text-center border">
//                                         <medium className="ml-2 text-gray-500">{dsThietBi.find(tb => tb.tenThietBi === item.ten)?.tonKho || 0}</medium>
//                                     </td>

//                                     <td className="px-4 py-1 text-center border">
//                                         <button
//                                             onClick={() => handleDelete(index)}
//                                             className="px-2 py-1 text-white bg-red-500 rounded"
//                                         >
//                                             <BsTrash />
//                                         </button>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default FormPhong;

import axios from "axios";
import { useEffect, useState } from "react";
import { maxTangTheoToa, toaTheoCoSo } from "../../utils/constants";
import { BsTrash } from "react-icons/bs";

const FormPhong = ({ onClose, refreshData }) => {
    const [activeTab, setActiveTab] = useState("themPhong"); // Quản lý tab đang hiển thị
    // eslint-disable-next-line
    const [newId, setNewId] = useState(0); // ID phòng mới
    const [formData, setFormData] = useState({
        coSo: "",
        toa: "",
        tang: "",
        soPhong: "",
        chucNang: "",
    });

    const [phongList, setPhongList] = useState([]);
    const [theLoaiList, setTheLoaiList] = useState([]);
    const [selectedTheLoai, setSelectedTheLoai] = useState("");
    const [selectedThietBi, setSelectedThietBi] = useState("");
    const [selectedPhong, setSelectedPhong] = useState("");
    const [dsThietBi, setDsThietBi] = useState([]);
    const [thietBiTrongPhong, setThietBiTrongPhong] = useState([]);

    useEffect(() => {
        Promise.all([
            axios.get("http://localhost:5000/api/phong"),
            axios.get("http://localhost:5000/api/phong/phonglist"),
            axios.get("http://localhost:5000/api/theloai")
        ])
        .then(([phongRes, phongListRes, theLoaiRes]) => {
            setNewId(phongRes.data.length + 1);
            setPhongList(phongListRes.data);
            setTheLoaiList(theLoaiRes.data);
        })
        .catch(error => console.error("Lỗi tải dữ liệu:", error));
    }, []);

    // Khi chọn thể loại, lấy danh sách thiết bị
    useEffect(() => {
        if (selectedTheLoai) {
            axios.get(`http://localhost:5000/api/theloai/${selectedTheLoai}`)
                .then(response => {
                    console.log("Danh sách thiết bị:", response.data.dsThietBi);
                    setDsThietBi(response.data.dsThietBi);
                })
                .catch(error => console.error("Lỗi tải thiết bị:", error));
        }
    }, [selectedTheLoai]); // Chạy khi selectedTheLoai thay đổi

    // Xử lý thay đổi input Phòng
    const handleChange = (e) => {
        const { name, value } = e.target;
        let updatedFormData = { ...formData, [name]: value };

        // Reset tầng nếu tòa thay đổi
        if (name === "toa") {
            updatedFormData.tang = ""; // Reset tầng
        }

        setFormData(updatedFormData);
    };

    // Xử lý thay đổi input Thiết Bị
    const handleThietBiChange = (e) => {
        const thietBi = dsThietBi.find(tb => tb.id === parseInt(e.target.value));
        setSelectedThietBi(thietBi || "");
    };

    // Xử lý thêm thiết bị vào bảng dữ liệu chờ để lưu
    const handleAddThietBi = () => {
        // Tìm thông tin phòng và thiết bị
        const selectedPhongDetails = phongList.find(p => p.id === parseInt(selectedPhong, 10));
        const thietBiDetails = dsThietBi.find(tb => tb.tenThietBi === selectedThietBi.tenThietBi);

        if (!selectedPhongDetails || !thietBiDetails) {
            console.error("Phòng hoặc thiết bị chưa được chọn.");
            return;
        }

        // Kiểm tra tồn kho
        if (thietBiDetails.tonKho <= 0) {
            alert(`Không thể thêm thiết bị vì tồn kho đã hết.`);
            return;
        }

        // Cập nhật tồn kho sau khi thêm thiết bị
        const updatedThietBiList = dsThietBi.map(tb =>
            tb.tenThietBi === selectedThietBi.tenThietBi
                ? { ...tb, tonKho: tb.tonKho - 1 } // Giảm tồn kho
                : tb
        );
        setDsThietBi(updatedThietBiList);

        // Kiểm tra nếu thiết bị với cùng phòng đã tồn tại
        const existingIndex = thietBiTrongPhong.findIndex(
            item => item.phong === selectedPhongDetails.phong && item.ten === selectedThietBi.tenThietBi
        );

        if (existingIndex !== -1) {
            // Nếu trùng phòng và thiết bị, tăng số lượng
            const updatedList = thietBiTrongPhong.map((item, index) =>
                index === existingIndex
                    ? { ...item, soLuong: item.soLuong + 1 }
                    : item
            );
            setThietBiTrongPhong(updatedList);
        } else {
            // Nếu không trùng, thêm dòng mới
            const newEntry = {
                phong: selectedPhongDetails.phong, // Lấy tên phòng
                ten: selectedThietBi.tenThietBi,  // Tên thiết bị
                soLuong: 1                        // Mỗi lần thêm mặc định là 1
            };
            setThietBiTrongPhong([...thietBiTrongPhong, newEntry]);
        }
    };

    // Xử lý lưu phòng
    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post("http://localhost:5000/api/phong", formData)
            .then(() => {
                alert("Thêm phòng thành công!");
                refreshData();
                onClose();
            })
            .catch(error => console.error("Lỗi thêm phòng:", error));
    };

    // Xử lý nút Hủy
    const handleReset = () => {
        setFormData({
            coSo: "",
            toa: "",
            tang: "",
            soPhong: "",
            chucNang: "",
        });
    };

    // Xóa phần tử tại vị trí index
    const handleDelete = (index) => {
        // Lấy thông tin dòng bị xóa
        const removedItem = thietBiTrongPhong[index];

        // Cộng lại tồn kho của thiết bị
        const updatedDsThietBi = dsThietBi.map(tb =>
            tb.tenThietBi === removedItem.ten
                ? { ...tb, tonKho: tb.tonKho + removedItem.soLuong } // Cộng lại số lượng
                : tb
        );
        setDsThietBi(updatedDsThietBi);

        // Xóa dòng khỏi bảng
        const updatedList = thietBiTrongPhong.filter((_, i) => i !== index);
        setThietBiTrongPhong(updatedList);
    };


    // Xử lý nhập liệu số lượng
    const handleInputChange = (e, index) => {
        const newSoLuong = parseInt(e.target.value) || 1; // Đảm bảo giá trị hợp lệ
        const currentItem = thietBiTrongPhong[index]; // Lấy dòng hiện tại trong bảng
        const thietBiDetails = dsThietBi.find(tb => tb.tenThietBi === currentItem.ten); // Lấy thông tin tồn kho thiết bị

        if (!thietBiDetails) {
            console.error("Không tìm thấy thông tin tồn kho của thiết bị.");
            return;
        }

        // Tính sự khác biệt (delta) giữa số lượng mới và số lượng cũ
        const delta = newSoLuong - currentItem.soLuong;

        // Nếu số lượng mới vượt quá tồn kho hiện tại, dừng lại
        if (delta > 0 && delta > thietBiDetails.tonKho) {
            alert(`Số lượng vượt quá tồn kho! (Tồn kho hiện tại: ${thietBiDetails.tonKho})`);
            return;
        }

        // Cập nhật tồn kho thiết bị
        const updatedDsThietBi = dsThietBi.map(tb =>
            tb.tenThietBi === currentItem.ten
                ? { ...tb, tonKho: tb.tonKho - delta } // Giảm hoặc tăng tồn kho dựa trên delta
                : tb
        );
        setDsThietBi(updatedDsThietBi);

        // Cập nhật số lượng trong bảng
        const updatedList = thietBiTrongPhong.map((item, i) =>
            i === index ? { ...item, soLuong: newSoLuong } : item
        );
        setThietBiTrongPhong(updatedList);
    };

    // Lưu thiết bị vào phòng
    const handleSaveThietBi = async () => {
        if (!selectedPhong || thietBiTrongPhong.length === 0) {
            alert("Vui lòng chọn phòng và thêm ít nhất một thiết bị!");
            return;
        }

        try {
            const requestData = await Promise.all(
                thietBiTrongPhong.map(async (item) => {
                    const thietBi = dsThietBi.find(tb => tb.tenThietBi === item.ten);

                    if (!thietBi) {
                        console.error("Không tìm thấy thiết bị:", item.ten);
                        return null;
                    }

                    // Lấy thongtinthietbi_id từ API hoặc danh sách nếu có sẵn
                    const response = await axios.get(`http://localhost:5000/api/thietbi/thongtin/${thietBi.id}`);
                    const thongtinthietbi_id = response.data?.thongtinthietbi_id || null;

                    return {
                        phong_id: selectedPhong,
                        thietbi_id: thietBi.id,
                        thongtinthietbi_id,
                        soLuong: item.soLuong
                    };
                })
            );

            const validData = requestData.filter(item => item !== null);

            if (validData.length === 0) {
                alert("Không có thiết bị hợp lệ để lưu!");
                return;
            }

            const response = await axios.post("http://localhost:5000/api/phong/add-thietbi", validData);

            if (response.data.success) {
                alert("Lưu thành công!");
                setThietBiTrongPhong([]); // Reset danh sách sau khi lưu
                refreshData();
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            console.error("Lỗi khi lưu thiết bị:", error);
            alert("Lưu thất bại!");
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b">
                <h2 className="text-lg font-semibold">Các Chức Năng Của Phòng</h2>
                <div className="flex space-x-4">
                    <button className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300" onClick={onClose}>
                        <i className="text-lg text-black fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div className="flex items-center bg-white">
                {/* Tabs */}
                <div className="flex flex-1 bg-white border-b">
                    <button
                        className={`flex-1 text-center py-4 font-semibold ${activeTab === "themPhong" ? "border-b-4 border-green-500 text-green-500" : "text-gray-400"}`}
                        onClick={() => setActiveTab("themPhong")}
                    >
                        Thêm Phòng
                    </button>
                    <button
                        className={`flex-1 text-center py-4 font-semibold ${activeTab === "themThietBi" ? "border-b-4 border-blue-500 text-blue-500" : "text-gray-400"}`}
                        onClick={() => setActiveTab("themThietBi")}
                    >
                        Thêm Thiết Bị Vào Phòng
                    </button>
                </div>
            </div>
            {/* Dữ Liệu Thêm Phòng Mới */}
            {activeTab === "themPhong" && (
                <div className="grid grid-cols-2 gap-2 p-2 mb-2 space-2">
                    {/* Cơ sở */}
                    <div>
                        <label className="block font-medium">Cơ Sở</label>
                        <select name="coSo" value={formData.coSo} onChange={handleChange} className="w-full p-1 mt-1 border rounded">
                            <option value="">Chọn cơ sở</option>
                            <option value="Chính">Chính</option>
                            <option value="Phụ">Phụ</option>
                        </select>
                    </div>

                    {/* Tòa */}
                    <div>
                        <label className="block font-medium">Tòa</label>
                        <select name="toa" value={formData.toa} onChange={handleChange} className="w-full p-1 mt-1 border rounded"
                            disabled={!formData.coSo}>
                            <option value="">Chọn tòa</option>
                            {formData.coSo && toaTheoCoSo[formData.coSo].map(toa => (
                                <option key={toa} value={toa}>{toa}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tầng */}
                    <div>
                        <label className="block font-medium">Tầng</label>
                        <select name="tang" value={formData.tang} onChange={handleChange} className="w-full p-1 mt-1 border rounded"
                            disabled={!formData.toa}>
                            <option value="">Chọn tầng</option>
                            {formData.toa && Array.from({ length: maxTangTheoToa[formData.toa] }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    </div>

                    {/* Số Phòng */}
                    <div>
                        <label className="block font-medium">Số Phòng</label>
                        <select name="soPhong" value={formData.soPhong} onChange={handleChange} className="w-full p-1 mt-1 border rounded"
                            disabled={!formData.tang}>
                            <option value="">Chọn số phòng</option>
                            {Array.from({ length: 20 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                        </select>
                    </div>
                    {/* Chức Năng */}
                    <div className="col-span-2">
                        <label className="block font-medium">Chức Năng</label>
                        <input type="text" name="chucNang" value={formData.chucNang} onChange={handleChange} className="w-full p-1 mt-1 border rounded" />
                    </div>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="w-full p-1 text-sm text-white bg-green-500 border rounded"
                    >
                        Lưu Phòng
                    </button>
                    <button
                        type="button"
                        className="w-full text-sm bg-gray-300 border rounded"
                        onClick={handleReset}
                    >
                        Xóa Trắng
                    </button>
                </div>
            )}
            {/* Thêm Thiết Bị Vào Phòng */}
            {activeTab === "themThietBi" && (
                <div className="p-4 bg-white border-t-2">
                    <div className="grid grid-cols-3 gap-2 pb-4">
                        <select
                            name="phong_id"
                            value={selectedPhong}
                            onChange={(e) => setSelectedPhong(e.target.value)}
                            className="w-full p-1 border rounded-lg"
                        >
                            <option value="">Phòng</option>
                            {phongList.map(p => (
                                <option key={p.id} value={p.id}>{p.phong}</option>
                            ))}
                        </select>
                        <select value={selectedTheLoai}
                            className="w-full p-1 border rounded-lg"
                            disabled={!selectedPhong}
                            onChange={(e) => setSelectedTheLoai(e.target.value)}
                        >
                            <option value="">Thể loại</option>
                            {theLoaiList.map(tl => (
                                <option key={tl.id} value={tl.id}>{tl.theLoai}</option>
                            ))}
                        </select>
                        <select
                            name="thietbi"
                            onChange={handleThietBiChange}
                            className="w-full p-1 border rounded-lg"
                            disabled={!selectedTheLoai}
                        >
                            <option value="">Thiết bị</option>
                            {dsThietBi.map(tb => (
                                <option key={tb.id} value={tb.id}>
                                    {tb.tenThietBi} (Còn: {tb.tonKho})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid items-center grid-cols-2 gap-2 pb-4">
                        <button
                            onClick={handleSaveThietBi}
                            className="w-full p-1 text-sm text-white transition-colors bg-green-500 border rounded hover:bg-green-600"
                        >
                            Lưu Thiết Bị
                        </button>
                        <button
                            onClick={handleAddThietBi}
                            className="w-full p-1 text-sm text-white transition-colors bg-blue-500 rounded hover:bg-blue-600"
                        >
                            Thêm Thiết Bị
                        </button>
                    </div>

                    <table className="w-full border border-gray-300 table-auto">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-4 py-1 border">Phòng</th>
                                <th className="px-4 py-1 border">Tên Thiết Bị</th>
                                <th className="px-4 py-1 border">Số Lượng</th>
                                <th className="px-4 py-1 border">Tồn Kho</th>
                                <th className="px-4 py-1 border">Xóa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {thietBiTrongPhong.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-1 text-center border">{item.phong}</td>
                                    <td className="px-4 py-1 text-center border">{item.ten}</td>
                                    <td className="px-4 py-1 text-center border">
                                        <input
                                            type="number"
                                            value={item.soLuong}
                                            onChange={(e) => handleInputChange(e, index)}
                                            className="w-16 p-1 text-center border rounded"
                                            min="1"
                                        />
                                    </td>
                                    <td className="px-4 py-1 text-center border">
                                        <medium className="ml-2 text-gray-500">{dsThietBi.find(tb => tb.tenThietBi === item.ten)?.tonKho || 0}</medium>
                                    </td>

                                    <td className="px-4 py-1 text-center border">
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="px-2 py-1 text-white bg-red-500 rounded"
                                        >
                                            <BsTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FormPhong;

