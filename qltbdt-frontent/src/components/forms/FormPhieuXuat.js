import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation/*, useQueryClient */} from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { fetchEligibleDevicesForExportAPI, createPhieuXuatAPI } from '../../api';
import { getTinhTrangLabel } from '../../utils/constants';

// Định nghĩa các lựa chọn cho lý do xuất kho
const LY_DO_XUAT_OPTIONS = [
    { value: '', label: '-- Chọn lý do --', disabled: true },
    { value: 'thanh_ly', label: 'Thanh lý' },
    { value: 'mat_mat', label: 'Báo mất/hỏng không sửa được' },
    { value: 'xuat_tra', label: 'Xuất trả nhà cung cấp' },
    { value: 'dieu_chuyen', label: 'Điều chuyển đơn vị khác' },
    // Thêm các lý do khác nếu cần
];

const FormPhieuXuat = ({ isOpen, onClose, onSubmitSuccess }) => {
    // const queryClient = useQueryClient();

    // --- State ---
    const [selectedDeviceIds, setSelectedDeviceIds] = useState(new Set());
    const [filterStatus, setFilterStatus] = useState('cho_thanh_ly');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectAll, setSelectAll] = useState(false);

    // Form fields (khớp với bảng phieuxuat)
    const [lyDoXuat, setLyDoXuat] = useState(''); // Enum: thanh_ly, mat_mat, xuat_tra, dieu_chuyen
    const [ghiChu, setGhiChu] = useState('');
    const [giaTriThanhLy, setGiaTriThanhLy] = useState(''); // Giá trị thu về (nếu có)
    // const [danhSachChungTu, setDanhSachChungTu] = useState([]); // Tạm thời chưa xử lý upload file

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
        onSuccess: (data) => {
            toast.success(data?.message || 'Tạo phiếu xuất thành công!');
            // Reset form và state
            setSelectedDeviceIds(new Set());
            setLyDoXuat('');
            setGhiChu('');
            setGiaTriThanhLy('');
            // setDanhSachChungTu([]);
            setFormError('');
            setFilterStatus('cho_thanh_ly');
            setSearchTerm('');
            setSelectAll(false);
            onSubmitSuccess();
            onClose();
        },
        onError: (error) => {
            console.error("Lỗi tạo phiếu xuất:", error);
            const errMsg = error.response?.data?.error || error.message || 'Lỗi khi tạo phiếu xuất.';
            toast.error(errMsg);
            setFormError(errMsg);
        }
    });

    // --- Filtering and Selection Logic ---
    const filteredDevices = useMemo(() => {
        let devices = eligibleDevices;
        if (filterStatus) {
            devices = devices.filter(d => d.tinhTrang === filterStatus);
        }
        if (searchTerm) {
            const termLower = searchTerm.toLowerCase();
            devices = devices.filter(d =>
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

    // --- Submit Handler ---
    const handleSubmit = (e) => {
        e.preventDefault(); // Ngăn form submit mặc định
        setFormError('');
        if (selectedDeviceIds.size === 0) {
            setFormError('Vui lòng chọn ít nhất một thiết bị.');
            return;
        }
        if (!lyDoXuat) {
            setFormError('Vui lòng chọn lý do xuất kho.');
            return;
        }
        // Validate giá trị thanh lý (nếu có nhập)
        const giaTriParsed = giaTriThanhLy ? parseFloat(giaTriThanhLy) : null;
        if (giaTriThanhLy && (isNaN(giaTriParsed) || giaTriParsed < 0)) {
            setFormError("Giá trị thanh lý phải là một số không âm.");
            return;
        }


        const payload = {
            lyDoXuat: lyDoXuat,
            ghiChu: ghiChu.trim() || null,
            giaTriThanhLy: giaTriParsed, // Gửi giá trị đã parse
            selectedDeviceIds: Array.from(selectedDeviceIds)
            // danhSachChungTu: danhSachChungTu, // Sẽ xử lý sau nếu cần upload file
        };
        console.log("Submitting payload:", payload);
        createMutation.mutate(payload);
    };

    // Reset state khi modal đóng/mở
    useEffect(() => {
        if (!isOpen) {
            setSelectedDeviceIds(new Set());
            setLyDoXuat('');
            setGhiChu('');
            setGiaTriThanhLy('');
            setFormError('');
            setFilterStatus('cho_thanh_ly');
            setSearchTerm('');
            setSelectAll(false);
        }
    }, [isOpen]);


    // --- Render ---
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm animate-modal-scale-in">
            {/* Điều chỉnh max-w-5xl nếu cần rộng hơn */}
            <div className="w-full max-w-5xl p-6 bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">Tạo Phiếu Xuất Kho / Thanh Lý</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl disabled:opacity-50" disabled={createMutation.isLoading}>&times;</button>
                </div>

                {/* Form Inputs */}
                <form onSubmit={handleSubmit} className="py-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="md:col-span-1">
                            <label htmlFor="lyDoXuat" className="block mb-1 text-sm font-medium text-gray-700">Lý do xuất <span className="text-red-500">*</span></label>
                            <select
                                id="lyDoXuat"
                                value={lyDoXuat}
                                onChange={(e) => setLyDoXuat(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                required
                            >
                                {LY_DO_XUAT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label htmlFor="giaTriThanhLy" className="block mb-1 text-sm font-medium text-gray-700">Giá trị thanh lý (VNĐ)</label>
                            <input
                                type="number"
                                id="giaTriThanhLy"
                                value={giaTriThanhLy}
                                onChange={(e) => setGiaTriThanhLy(e.target.value)}
                                min="0"
                                step="any"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Nhập số tiền nếu có..."
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="ghiChuXuat" className="block mb-1 text-sm font-medium text-gray-700">Ghi chú</label>
                        <textarea
                            id="ghiChuXuat"
                            rows="2"
                            value={ghiChu}
                            onChange={(e) => setGhiChu(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Thông tin bổ sung (VD: người nhận, biên bản thanh lý số...)"
                        />
                    </div>
                    {formError && <p className="mt-1 text-sm text-red-600">{formError}</p>}
                    {/* Phần upload chứng từ có thể thêm ở đây nếu cần */}
                </form>

                {/* Device Selection Section */}
                <div className="pt-4 mt-4 border-t flex-grow flex flex-col overflow-hidden">
                    <h4 className="mb-3 text-md font-semibold text-gray-700">Chọn Thiết Bị ({selectedDeviceIds.size} đã chọn)</h4>
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                        <div className="flex-shrink-0 w-48">
                            <label htmlFor="filterStatusXuat" className="block text-xs font-medium text-gray-700">Lọc theo tình trạng</label>
                            <select
                                id="filterStatusXuat"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-2 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isLoadingDevices || createMutation.isLoading}
                            >
                                <option value="">Tất cả hợp lệ</option>
                                <option value="cho_thanh_ly">Chờ Thanh Lý</option>
                                <option value="het_bao_hanh">Hết Bảo Hành</option>
                                <option value="con_bao_hanh">Còn Bảo Hành</option>
                            </select>
                        </div>
                        <div className="flex-grow">
                            <label htmlFor="searchTermXuat" className="block text-xs font-medium text-gray-700">Tìm kiếm thiết bị</label>
                            <input
                                type="text"
                                id="searchTermXuat"
                                placeholder="Nhập tên, mã định danh..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-1 mt-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isLoadingDevices || createMutation.isLoading}
                            />
                        </div>
                    </div>

                    {/* Device Table */}
                    <div className="flex-grow overflow-y-auto border rounded-md">
                        <table className="min-w-full divide-y divide-gray-200 ">
                            <thead className="sticky top-0 bg-gray-50 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            title='Chọn/Bỏ chọn tất cả hiển thị'
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                            disabled={filteredDevices.length === 0 || isLoadingDevices || createMutation.isLoading}
                                            className="disabled:opacity-50"
                                        />
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã ĐD</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Thiết Bị</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tình trạng</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị ban đầu</th>                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoadingDevices && (
                                    <tr><td colSpan="6" className="p-4 text-center text-gray-500">Đang tải danh sách thiết bị...</td></tr>
                                )}
                                {devicesError && (
                                    <tr><td colSpan="6" className="p-4 text-center text-red-500">Lỗi tải dữ liệu thiết bị!</td></tr>
                                )}
                                {!isLoadingDevices && !devicesError && filteredDevices.length === 0 && (
                                    <tr><td colSpan="6" className="p-4 text-center text-gray-500">Không tìm thấy thiết bị nào phù hợp.</td></tr>
                                )}
                                {!isLoadingDevices && !devicesError && filteredDevices.map((device) => (
                                    <tr key={device.id} className={`hover:bg-gray-50 ${selectedDeviceIds.has(device.id) ? 'bg-blue-50' : ''}`}>
                                        <td className="px-3 py-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedDeviceIds.has(device.id)}
                                                onChange={() => handleSelectDevice(device.id)}
                                                disabled={createMutation.isLoading}
                                                className="disabled:opacity-50"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-sm text-gray-900">{device.id}</td>
                                        <td className="px-3 py-2 text-sm text-gray-900">{device.tenThietBi}</td>
                                        <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${device.tinhTrang === 'cho_thanh_ly' ? 'bg-orange-100 text-orange-800' :
                                                    device.tinhTrang === 'het_bao_hanh' ? 'bg-red-100 text-red-800' :
                                                        device.tinhTrang === 'con_bao_hanh' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
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

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 mt-auto border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={createMutation.isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={selectedDeviceIds.size === 0 || !lyDoXuat || createMutation.isLoading || isLoadingDevices}
                        className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {createMutation.isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang xử lý...
                            </>
                        ) : (
                            `Tạo Phiếu Xuất (${selectedDeviceIds.size})`
                        )}
                    </button>
                </div>
                {/* Animation style */}
                <style>{`
                @keyframes modal-scale-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-modal-scale-in { animation: modal-scale-in 0.2s ease-out forwards; }
             `}</style>
            </div>
        </div>
    );
};

export default FormPhieuXuat;