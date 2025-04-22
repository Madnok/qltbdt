import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation/*, useQueryClient */ } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { fetchEligibleDevicesForExportAPI, createPhieuXuatAPI, uploadChungTuXuatAPI } from '../../api';
import { getTinhTrangLabel } from '../../utils/constants';
import { FaTimes, FaSpinner, FaPaperclip, FaTrash } from 'react-icons/fa';

// Định nghĩa các lựa chọn cho lý do xuất kho
const LY_DO_XUAT_OPTIONS = [
    { value: '', label: '-- Chọn lý do --', disabled: true },
    { value: 'thanh_ly', label: 'Thanh lý' },
    { value: 'mat_mat', label: 'Báo mất/hỏng không sửa được' },
    { value: 'xuat_tra', label: 'Xuất trả nhà cung cấp' },
    { value: 'dieu_chuyen', label: 'Điều chuyển đơn vị khác' },
];

const FormPhieuXuat = ({ isOpen, onClose, onSubmitSuccess }) => {
    // const queryClient = useQueryClient();

    // --- State ---
    const [selectedDeviceIds, setSelectedDeviceIds] = useState(new Set());
    const [filterStatus, setFilterStatus] = useState('cho_thanh_ly');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectAll, setSelectAll] = useState(false);
    const [lyDoXuat, setLyDoXuat] = useState('');
    const [ghiChu, setGhiChu] = useState('');
    const [giaTriThanhLy, setGiaTriThanhLy] = useState(''); // Giá trị thu về
    const [selectedFiles, setSelectedFiles] = useState([]); // Mảng chứa các đối tượng File
    const fileInputRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);


    const [formError, setFormError] = useState('');

    // --- React Query ---
    const { data: eligibleDevices = [], isLoading: isLoadingDevices, error: devicesError } = useQuery({
        queryKey: ['eligibleDevicesForExport'],
        queryFn: fetchEligibleDevicesForExportAPI,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: createPhieuXuatAPI,
    });

    // --- Filtering ---
    const filteredDevices = useMemo(() => {
        let devices = eligibleDevices;
        if (filterStatus) {
            devices = devices.filter(d => d.tinhTrang === filterStatus);
        }
        if (searchTerm) {
            const termLower = searchTerm.toLowerCase();
            devices = devices.filter(d =>
                String(d.id).toLowerCase().includes(termLower) ||
                d.tenThietBi?.toLowerCase().includes(termLower)
            );
        }
        return devices;
    }, [eligibleDevices, filterStatus, searchTerm]);

    useEffect(() => {
        const allCurrentVisibleSelected = filteredDevices.length > 0 && filteredDevices.every(d => selectedDeviceIds.has(d.id));
        setSelectAll(allCurrentVisibleSelected);
    }, [selectedDeviceIds, filteredDevices]);

    const handleSelectDevice = (deviceId) => {
        setSelectedDeviceIds(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(deviceId)) {
                newSelected.delete(deviceId);
            } else {
                newSelected.add(deviceId);
            }
            return newSelected;
        });
    };

    const handleSelectAll = (e) => {
        const isChecked = e.target.checked;
        setSelectAll(isChecked);
        setSelectedDeviceIds(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (isChecked) {
                filteredDevices.forEach(d => newSelected.add(d.id));
            } else {
                filteredDevices.forEach(d => newSelected.delete(d.id));
            }
            return newSelected;
        });
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        if (files.length > 5) {
            toast.warn("Chỉ được phép upload tối đa 5 file cùng lúc.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            setSelectedFiles([]);
            return;
        }
        setSelectedFiles(files);
    };

    const handleRemoveFile = (fileName) => {
        setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(''); // Xóa lỗi cũ

        // --- Validation cơ bản ---
        if (selectedDeviceIds.size === 0) return setFormError('Vui lòng chọn ít nhất một thiết bị.');
        if (!lyDoXuat) return setFormError('Vui lòng chọn lý do xuất kho.');
        const giaTriParsed = giaTriThanhLy ? parseFloat(giaTriThanhLy) : null;
        if (giaTriThanhLy && (isNaN(giaTriParsed) || giaTriParsed < 0)) return setFormError("Giá trị thanh lý phải là một số không âm.");
        // --- Yêu cầu phải có chứng từ ---
        if (selectedFiles.length === 0) {
            return setFormError("Vui lòng đính kèm ít nhất một file chứng từ.");
        }

        setIsSaving(true); // Bắt đầu quá trình lưu + upload
        toast.info("Đang xử lý tạo phiếu xuất và upload chứng từ...");

        // --- Chuẩn bị dữ liệu tạo phiếu ---
        const phieuXuatPayload = {
            lyDoXuat: lyDoXuat,
            ghiChu: ghiChu.trim() || null,
            giaTriThanhLy: giaTriParsed,
            selectedDeviceIds: Array.from(selectedDeviceIds),
            // danhSachChungTu sẽ được cập nhật ở backend sau khi upload thành công
        };

        let createdPhieuXuatId = null;

        try {
            // === BƯỚC 1: TẠO PHIẾU XUẤT ===
            console.log("Submitting payload to create voucher:", phieuXuatPayload);
            const createResponse = await createMutation.mutateAsync(phieuXuatPayload);
            createdPhieuXuatId = createResponse?.phieuXuatId; // Lấy ID từ response API

            if (!createdPhieuXuatId) {
                throw new Error("Không nhận được ID phiếu xuất sau khi tạo.");
            }
            console.log(`Phiếu xuất ID ${createdPhieuXuatId} đã được tạo.`);

            // === BƯỚC 2: UPLOAD CHỨNG TỪ ===
            console.log(`Đang upload ${selectedFiles.length} chứng từ cho phiếu xuất ID: ${createdPhieuXuatId}`);
            const formData = new FormData();
            selectedFiles.forEach(file => {
                formData.append('chungTuFiles', file);
            });

            try {
                // Gọi API upload trực tiếp 
                await uploadChungTuXuatAPI(createdPhieuXuatId, formData);
                console.log("Upload chứng từ phiếu xuất thành công!");
                toast.success(`Tạo phiếu xuất #${createdPhieuXuatId} và upload chứng từ thành công!`);

            } catch (uploadError) {
                console.error("Lỗi upload chứng từ phiếu xuất:", uploadError);
                // Vẫn thông báo thành công phiếu xuất, nhưng cảnh báo lỗi upload
                toast.warn(`Tạo phiếu xuất #${createdPhieuXuatId} thành công, nhưng gặp lỗi khi upload chứng từ: ${uploadError.response?.data?.error || uploadError.message}`);
            }

            // === BƯỚC 3: XỬ LÝ SAU KHI THÀNH CÔNG (DÙ UPLOAD LỖI HAY KHÔNG) ===
            // Reset form và state
            setSelectedDeviceIds(new Set());
            setLyDoXuat('');
            setGhiChu('');
            setGiaTriThanhLy('');
            setSelectedFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setFormError('');
            setFilterStatus('cho_thanh_ly');
            setSearchTerm('');
            setSelectAll(false);

            if (onSubmitSuccess) onSubmitSuccess();
            if (onClose) onClose(); // Đóng form/modal

        } catch (error) { // Bắt lỗi từ Bước 1 (tạo phiếu)
            console.error("Lỗi khi tạo phiếu xuất (Bước 1):", error);
            const errMsg = error.response?.data?.error || error.message || 'Lỗi khi tạo phiếu xuất.';
            toast.error(`Lỗi tạo phiếu xuất: ${errMsg}`);
            setFormError(errMsg); // Hiển thị lỗi trên form
        } finally {
            setIsSaving(false); // Kết thúc quá trình lưu
        }
    };

    // Reset state khi modal đóng/mở
    useEffect(() => {
        if (!isOpen) {
            setSelectedDeviceIds(new Set());
            setLyDoXuat('');
            setGhiChu('');
            setGiaTriThanhLy('');
            setSelectedFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setFormError('');
            setFilterStatus('cho_thanh_ly');
            setSearchTerm('');
            setSelectAll(false);
            setIsSaving(false);
        }
    }, [isOpen]);


    // --- Render ---
    if (!isOpen) return null;

    return (
        <>
            {/* Header của Form/Modal */}
            <div className="flex items-center justify-between p-4 border-b bg-purple-50">
                <h3 className="text-xl font-semibold text-purple-800">Tạo Phiếu Xuất Kho</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
                    disabled={isSaving}
                >
                    <FaTimes size={20} />
                </button>
            </div>

            {/* Phần còn lại của form và bảng */}
            <div className="flex-grow flex flex-col p-4 overflow-hidden">
                {/* Form Inputs */}
                <div className="space-y-4 mb-4 flex-shrink-0">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Lý do xuất */}
                        <div className="md:col-span-1">
                            <label htmlFor="lyDoXuatForm" className="block mb-1 text-sm font-medium text-gray-700">Lý do xuất <span className="text-red-500">*</span></label>
                            <select id="lyDoXuatForm" value={lyDoXuat} onChange={(e) => setLyDoXuat(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" required >
                                {LY_DO_XUAT_OPTIONS.map(opt => (<option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>))}
                            </select>
                        </div>
                        {/* Giá trị thanh lý */}
                        <div className="md:col-span-1">
                            <label htmlFor="giaTriThanhLyForm" className="block mb-1 text-sm font-medium text-gray-700">Giá trị thanh lý (VNĐ)</label>
                            <input type="number" id="giaTriThanhLyForm" value={giaTriThanhLy} onChange={(e) => setGiaTriThanhLy(e.target.value)} min="0" step="any" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Nhập số tiền nếu có..." />
                        </div>
                    </div>
                    {/* Ghi chú */}
                    <div>
                        <label htmlFor="ghiChuXuatForm" className="block mb-1 text-sm font-medium text-gray-700">Ghi chú</label>
                        <textarea id="ghiChuXuatForm" rows="2" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Thông tin bổ sung..." />
                    </div>

                    {/* UPLOAD CHỨNG TỪ */}
                    <div className="pt-2">
                        <label className="block mb-1 text-sm font-medium text-gray-700">Chứng Từ Kèm Theo <span className="text-red-500">*</span> (Tối đa 5 file):</label>
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-purple-700 hover:file:bg-purple-100 border border-gray-300 rounded-md cursor-pointer focus:outline-none disabled:opacity-50"
                            disabled={isSaving}
                        />
                        {/* Hiển thị file đã chọn */}
                        {selectedFiles.length > 0 && (
                            <div className="mt-2 space-y-1 text-xs max-h-20 overflow-y-auto custom-scrollbar border p-2 rounded-md bg-gray-50">
                                <p className="font-medium text-gray-600">File đã chọn:</p>
                                <ul className="list-none pl-0">
                                    {selectedFiles.map((file, index) => (
                                        <li key={index} className="flex items-center justify-between py-0.5">
                                            <span className="truncate text-gray-700"><FaPaperclip className="inline mr-1 text-gray-400" />{file.name}</span>
                                            <button type="button" onClick={() => handleRemoveFile(file.name)} className="ml-2 text-red-500 hover:text-red-700 disabled:opacity-50" title="Xóa file" disabled={isSaving}>
                                                <FaTrash size={12} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {formError && <p className="mt-1 text-sm text-red-600">{formError}</p>}
                </div>

                {/* Device Selection Section */}
                <div className="flex-grow flex flex-col min-h-0 border-t pt-4">
                    <h4 className="mb-3 text-md font-semibold text-gray-700 flex-shrink-0">Chọn Thiết Bị ({selectedDeviceIds.size} đã chọn)</h4>
                    {/* Filter và Search */}
                    <div className="flex flex-wrap items-center gap-4 mb-3 flex-shrink-0">
                        {/* ... (Filter, Search inputs giữ nguyên) ... */}
                        <div className="flex-shrink-0 w-48">
                            <label htmlFor="filterStatusXuatForm" className="block text-xs font-medium text-gray-700">Lọc theo tình trạng</label>
                            <select id="filterStatusXuatForm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-2 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" disabled={isLoadingDevices || isSaving} >
                                <option value="">Tất cả hợp lệ</option>
                                <option value="cho_thanh_ly">Chờ Thanh Lý</option>
                                <option value="het_bao_hanh">Hết Bảo Hành</option>
                                <option value="con_bao_hanh">Còn Bảo Hành</option>
                            </select>
                        </div>
                        <div className="flex-grow">
                            <label htmlFor="searchTermXuatForm" className="block text-xs font-medium text-gray-700">Tìm kiếm thiết bị</label>
                            <input type="text" id="searchTermXuatForm" placeholder="Nhập tên, mã định danh..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" disabled={isLoadingDevices || isSaving} />
                        </div>
                    </div>

                    {/* Device Table */}
                    <div className="flex-grow overflow-y-auto border rounded-md custom-scrollbar">
                        <table className="min-w-full divide-y divide-gray-200 ">
                            <thead className="sticky top-0 bg-gray-50 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-center w-10">
                                        <input type="checkbox" title='Chọn/Bỏ chọn tất cả hiển thị' checked={selectAll} onChange={handleSelectAll} disabled={filteredDevices.length === 0 || isLoadingDevices || isSaving} className="disabled:opacity-50" />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã ĐD</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Thiết Bị</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tình trạng</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị BĐ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingDevices && (<tr><td colSpan="5" className="p-4 text-center text-gray-500">Đang tải...</td></tr>)}
                                {devicesError && (<tr><td colSpan="5" className="p-4 text-center text-red-500">Lỗi tải dữ liệu!</td></tr>)}
                                {!isLoadingDevices && !devicesError && filteredDevices.length === 0 && (<tr><td colSpan="5" className="p-4 text-center text-gray-500">Không có thiết bị.</td></tr>)}
                                {!isLoadingDevices && !devicesError && filteredDevices.map((device) => (
                                    <tr key={device.id} className={`hover:bg-gray-50 ${selectedDeviceIds.has(device.id) ? 'bg-purple-50' : ''}`}>
                                        <td className="px-3 py-2 text-center w-10">
                                            <input type="checkbox" checked={selectedDeviceIds.has(device.id)} onChange={() => handleSelectDevice(device.id)} disabled={isSaving} className="disabled:opacity-50" />
                                        </td>
                                        <td className="px-3 py-2 text-sm text-purple-700 font-medium whitespace-nowrap">{device.id}</td>
                                        <td className="px-3 py-2 text-sm text-gray-900">{device.tenThietBi}</td>
                                        <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${device.tinhTrang === 'cho_thanh_ly' ? 'bg-orange-100 text-orange-800' : device.tinhTrang === 'het_bao_hanh' ? 'bg-red-100 text-red-800' : device.tinhTrang === 'con_bao_hanh' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {getTinhTrangLabel(device.tinhTrang)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap text-right">
                                            {device.giaTriBanDau ? parseFloat(device.giaTriBanDau).toLocaleString('vi-VN') + ' đ' : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* Kết thúc flex-grow của nội dung form */}

            {/* Footer của Form/Modal */}
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 flex-shrink-0">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                    Hủy bỏ
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={selectedDeviceIds.size === 0 || !lyDoXuat || selectedFiles.length === 0 || isLoadingDevices || isSaving} 
                    className="px-5 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    style={{ minWidth: '150px' }}
                >
                    {isSaving ? (
                        <>
                            <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" /> Đang xử lý...
                        </>
                    ) : (
                        `Tạo Phiếu Xuất (${selectedDeviceIds.size})`
                    )}
                </button>
            </div>
        </>
    );
};

export default FormPhieuXuat;