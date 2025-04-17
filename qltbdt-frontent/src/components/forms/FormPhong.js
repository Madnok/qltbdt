import React, { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { maxTangTheoToa, toaTheoCoSo } from "../../utils/constants";
import Select from 'react-select';
import { FaSpinner } from "react-icons/fa";
import {
    fetchPhongList,
    addPhongAPI,
    getAllTaiSanAPI,
    assignTaiSanToPhongAPI
} from "../../api"; 

const FormPhong = ({ onClose, refreshData }) => {
    const [activeTab, setActiveTab] = useState("themPhong");
    const [formDataPhong, setFormDataPhong] = useState({
        coSo: "", toa: "", tang: "", soPhong: "", chucNang: "",
    });
    const [selectedPhong, setSelectedPhong] = useState("");
    const [isAssigning, setIsAssigning] = useState(false); // Trạng thái đang gán (cho nhiều tài sản)
    const [selectedAssetsOptions, setSelectedAssetsOptions] = useState([]);

    const queryClient = useQueryClient();

    // --- Queries ---
    // Lấy danh sách phòng để chọn
    const { data: phongListData = [], isLoading: isLoadingPhongList } = useQuery({
        queryKey: ['phongList'],
        queryFn: fetchPhongList,
        select: (res) => res.data || res || [] // Đảm bảo trả về mảng
    });

    // Lấy danh sách tài sản có sẵn ('trong_kho')
    const { data: availableAssetsData, isLoading: isLoadingAvailableAssets, error: errorAvailableAssets } = useQuery({
        queryKey: ['availableAssetsForAssignment', 'unassigned'],
        queryFn: () => getAllTaiSanAPI({ phongId: 'null', limit: 2000 }), 
        staleTime: 0, 
        enabled: activeTab === 'themThietBi', 
        select: (response) => response.data 
    });

    useEffect(() => {
        if(activeTab === 'themThietBi') {
        }
    }, [availableAssetsData, activeTab]);

    // Tính toán availableAssets từ dữ liệu đã được select bởi react-query
    const availableAssets = useMemo(() => {
        const assetArray = availableAssetsData?.data || availableAssetsData;
        const result = Array.isArray(assetArray) ? assetArray : [];
        return result;
    }, [availableAssetsData]);

    const assetOptions = useMemo(() => {
        const options = availableAssets.map(asset => ({
            value: asset.id,
            label: `ID: ${asset.id} - ${asset.tenLoaiThietBi}`
        }));
        return options;
    }, [availableAssets]);

    // Handler cho react-select
    const handleMultiSelectChange = (selectedOptions) => {
        setSelectedAssetsOptions(selectedOptions || []);
    };
    // -----------------

    // --- Mutations ---
    const addPhongMutation = useMutation({
        mutationFn: addPhongAPI,
        onSuccess: () => {
            toast.success("Thêm phòng thành công!");
            queryClient.invalidateQueries({ queryKey: ['phongTableData'] });
            queryClient.invalidateQueries({ queryKey: ['phongList'] });
            handleResetPhong();
            if (refreshData) refreshData();
        },
        onError: (error) => {
            console.error("Lỗi thêm phòng:", error);
            toast.error(`Thêm phòng thất bại: ${error.response?.data?.error || error.message}`);
        }
    });

    // === Mutation MỚI: Gán tài sản vào phòng ===
    const assignMutation = useMutation({
        mutationFn: assignTaiSanToPhongAPI,
    });
    // -----------------

    // --- Handlers ---
    // Tab Thêm Phòng
    const handleChangePhong = (e) => {
        const { name, value } = e.target;
        let updatedFormData = { ...formDataPhong, [name]: value };
        if (name === "coSo") { // Reset tòa và tầng khi đổi cơ sở
            updatedFormData.toa = "";
            updatedFormData.tang = "";
            updatedFormData.soPhong = "";
        } else if (name === "toa") { // Reset tầng khi đổi tòa
            updatedFormData.tang = "";
            updatedFormData.soPhong = "";
        } else if (name === "tang") { // Reset phòng khi đổi tầng
            updatedFormData.soPhong = "";
        }
        setFormDataPhong(updatedFormData);
    };

    const handleSubmitPhong = (e) => {
        e.preventDefault();
        if (!formDataPhong.coSo || !formDataPhong.toa || !formDataPhong.tang || !formDataPhong.soPhong || !formDataPhong.chucNang) {
            toast.warn("Vui lòng nhập đầy đủ thông tin phòng!");
            return;
        }
        addPhongMutation.mutate(formDataPhong);
    };

    const handleResetPhong = () => {
        setFormDataPhong({ coSo: "", toa: "", tang: "", soPhong: "", chucNang: "" });
    };

    // Hàm xử lý khi nhấn nút "Gán Các Tài Sản Đã Chọn"
    const handleAssignMultipleAssets = async () => {
        if (!selectedPhong) {
            toast.warn("Vui lòng chọn phòng đích!");
            return;
        }

        const idsToAssign = selectedAssetsOptions.map(option => option.value); 

        if (idsToAssign.length === 0) {
            toast.warn("Vui lòng chọn ít nhất một tài sản để gán!");
            return;
        }

        setIsAssigning(true);
        const phongIdInt = parseInt(selectedPhong, 10);
        let successCount = 0;
        let errorCount = 0;
        const totalToAssign = idsToAssign.length;

        toast.info(`Đang bắt đầu gán ${totalToAssign} tài sản vào phòng ID ${phongIdInt}...`);

        const assignPromises = idsToAssign.map(assetId =>
            assignMutation.mutateAsync({ thongtinthietbi_id: Number(assetId), phong_id: phongIdInt })
                .then(() => {
                    successCount++;
                })
                .catch((error) => {
                    errorCount++;
                    const assetInfo = availableAssets.find(a => a.id === assetId);
                    const assetDesc = assetInfo ? `ID ${assetId} (${assetInfo.tenLoaiThietBi})` : `ID ${assetId}`;
                    console.error(`Lỗi khi gán tài sản ${assetDesc}:`, error);
                    toast.error(`Lỗi gán TS ${assetDesc}: ${error.response?.data?.error || error.message}`);
                })
        );

    try {
        // Đợi tất cả các promise hoàn thành
        await Promise.all(assignPromises);

        setIsAssigning(false); 

        if (successCount > 0) {
            toast.success(`Hoàn tất: Đã gán thành công ${successCount}/${totalToAssign} tài sản.`);
            setSelectedAssetsOptions([]);
            queryClient.invalidateQueries({ queryKey: ['availableAssetsForAssignment'] }); 
            queryClient.invalidateQueries({ queryKey: ['taiSan'] }); 
            queryClient.invalidateQueries({ queryKey: ['phongTableData'] }); 
            queryClient.invalidateQueries({ queryKey: ['thietBiTrongPhong', phongIdInt] }); 
            queryClient.invalidateQueries({ queryKey: ['phong', phongIdInt] });
            queryClient.invalidateQueries({ queryKey: ['phongList'] });
            if (refreshData) refreshData();
        }
        if (errorCount > 0) {
            toast.error(`Hoàn tất: Có ${errorCount}/${totalToAssign} tài sản gán thất bại.`);
        }
         if (successCount === 0 && errorCount === 0) {
             toast.info("Không có tài sản nào được gán.");
         }
        } catch (err) {
            console.error("Lỗi không mong muốn trong handleAssignMultipleAssets:", err);
            toast.error("Đã xảy ra lỗi không mong muốn trong quá trình gán.");
        } finally {
            setIsAssigning(false); 
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-md">
            {/* Header và Tabs */}
            <div className="flex items-center justify-between p-4 bg-white border-b">
                <h2 className="text-lg font-semibold">Quản lý Phòng & Thiết bị</h2>
                <button className="flex items-center justify-center w-10 h-10 transition rounded-full hover:bg-gray-300" onClick={onClose}>
                    <i className="text-lg text-black fas fa-times"></i>
                </button>
            </div>
            <div className="flex items-center bg-white border-b">
                <button
                    className={`flex-1 text-center py-3 font-medium text-sm ${activeTab === "themPhong" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("themPhong")}
                >
                    Thêm Phòng Mới
                </button>
                <button
                    className={`flex-1 text-center py-3 font-medium text-sm ${activeTab === "themThietBi" ? "border-b-2 border-green-600 text-green-600" : "text-gray-500 hover:text-gray-700"}`}
                    onClick={() => setActiveTab("themThietBi")}
                >
                    Thêm Thiết Bị Vào Phòng
                </button>
            </div>

            {/* Nội dung các tab */}
            <div className="flex-grow p-4 overflow-y-auto">
                {/* Form Thêm Phòng */}
                {activeTab === "themPhong" && (
                    <form onSubmit={handleSubmitPhong} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cơ Sở <span className="text-red-500">*</span></label>
                                <select name="coSo" value={formDataPhong.coSo} onChange={handleChangePhong} required className="w-full px-2 py-1.5 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    <option value="">Chọn cơ sở</option>
                                    <option value="Chính">Chính</option>
                                    <option value="Phụ">Phụ</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tòa <span className="text-red-500">*</span></label>
                                <select name="toa" value={formDataPhong.toa} onChange={handleChangePhong} required className="w-full px-2 py-1.5 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={!formDataPhong.coSo}>
                                    <option value="">Chọn tòa</option>
                                    {formDataPhong.coSo && toaTheoCoSo[formDataPhong.coSo]?.map(toa => (
                                        <option key={toa} value={toa}>{toa}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tầng <span className="text-red-500">*</span></label>
                                <select name="tang" value={formDataPhong.tang} onChange={handleChangePhong} required className="w-full px-2 py-1.5 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={!formDataPhong.toa}>
                                    <option value="">Chọn tầng</option>
                                    {formDataPhong.toa && Array.from({ length: maxTangTheoToa[formDataPhong.toa] || 0 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Số Phòng <span className="text-red-500">*</span></label>
                                <select name="soPhong" value={formDataPhong.soPhong} onChange={handleChangePhong} required className="w-full px-2 py-1.5 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={!formDataPhong.tang}>
                                    <option value="">Chọn số phòng</option>
                                    {Array.from({ length: 20 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Chức Năng <span className="text-red-500">*</span></label>
                            <input type="text" name="chucNang" value={formDataPhong.chucNang} onChange={handleChangePhong} required className="w-full px-2 py-1.5 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        </div>
                        {/* Buttons */}
                        <div className="flex justify-end pt-4 space-x-3">
                            <button
                                type="button"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                                onClick={handleResetPhong}
                                disabled={addPhongMutation.isPending}
                            >
                                Xóa Trắng
                            </button>
                            <button
                                type="submit"
                                disabled={addPhongMutation.isPending}
                                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {addPhongMutation.isPending && <FaSpinner className="w-4 h-4 mr-2 animate-spin" />}
                                {addPhongMutation.isPending ? 'Đang lưu...' : 'Lưu Phòng'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Form Thêm Thiết Bị Vào Phòng */}
                {activeTab === "themThietBi" && (
                    <div className="space-y-4">
                        {/* Dropdown Chọn Phòng */}
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Chọn Phòng Đích <span className="text-red-500">*</span></label>
                             <select
                                 name="phong_id" value={selectedPhong}
                                 onChange={(e) => setSelectedPhong(e.target.value)}
                                 required
                                 className="w-full px-2 py-1.5 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                 disabled={isLoadingPhongList || isAssigning} // Disable khi đang gán
                             >
                                 <option value="">{isLoadingPhongList ? 'Đang tải phòng...' : '-- Chọn Phòng --'}</option>
                                 {/* Đảm bảo phongListData là mảng */}
                                 {Array.isArray(phongListData) && phongListData.map(p => (
                                     <option key={p.id} value={p.id}>{p.phong} ({p.chucNang})</option>
                                 ))}
                             </select>
                         </div>

                        {/* Dropdown Chọn Tài Sản Cụ Thể */}
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Chọn Tài Sản Cần Gán (Có thể chọn nhiều) <span className="text-red-500">*</span></label>
                             <Select
                                 isMulti
                                 name="assets"
                                 options={assetOptions}
                                 className="mt-1 basic-multi-select"
                                 classNamePrefix="select"
                                 value={selectedAssetsOptions}
                                 onChange={handleMultiSelectChange}
                                 isLoading={isLoadingAvailableAssets}
                                 isDisabled={!selectedPhong || isLoadingAvailableAssets || isAssigning} // Disable khi đang gán
                                 placeholder={isLoadingAvailableAssets ? "Đang tải..." : "Tìm kiếm và chọn tài sản (trong kho)..."}
                                 noOptionsMessage={() => "Không có tài sản nào trong kho"}
                                 styles={{ menu: base => ({ ...base, zIndex: 50 }) }}
                             />
                              {errorAvailableAssets && <div className="mt-1 text-xs text-red-600">Lỗi tải tài sản: {errorAvailableAssets.message}</div>}
                         </div>

                        {/* Nút Lưu */}
                        <div className="flex justify-end pt-4">
                             <button
                                 onClick={handleAssignMultipleAssets}
                                 type="button"
                                 disabled={!selectedPhong || selectedAssetsOptions.length === 0 || isAssigning || isLoadingAvailableAssets}
                                 className="inline-flex items-center justify-center min-w-[180px] px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                  {isAssigning && <FaSpinner className="w-4 h-4 mr-2 animate-spin" />}
                                  {isAssigning ? `Đang gán (${selectedAssetsOptions.length})...` : `Gán (${selectedAssetsOptions.length}) Tài Sản Đã Chọn`}
                             </button>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormPhong;