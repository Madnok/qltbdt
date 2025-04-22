import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FaSearch } from 'react-icons/fa';
import {
    fetchPhongCoTaiSanList,
    fetchTheLoaiList,
    getThietBiByTheLoaiAPI
} from '../../api';

const BoLocTaiSan = ({ onFilterChange }) => {
    const [trangThai, setTrangThai] = useState('');
    const [phongId, setPhongId] = useState('');
    const [theLoaiId, setTheLoaiId] = useState('');
    const [thietBiId, setThietBiId] = useState('');
    const [searchText, setSearchText] = useState('');

    // Lấy danh sách phòng CÓ TÀI SẢN
    const { data: phongList } = useQuery({
        queryKey: ['listPhongCoTaiSan'],
        queryFn: fetchPhongCoTaiSanList
    });

    // Lấy danh sách thể loại
    const { data: theLoaiList } = useQuery({
        queryKey: ['allTheLoai'],
        // SỬA LẠI TÊN HÀM API:
        queryFn: () => fetchTheLoaiList().then(res => res.data || res)
    });

    // Lấy danh sách loại thiết bị (lọc theo thể loại)
    const { data: thietBiList } = useQuery({
        queryKey: ['listThietBi', theLoaiId],
        queryFn: () => getThietBiByTheLoaiAPI(theLoaiId).then(res => res.data || res),
        enabled: !!theLoaiId // Chỉ chạy khi đã chọn thể loại
    });

    // Phần useEffect
    useEffect(() => {
        const filters = {
            trangThai: trangThai || undefined, // Gửi undefined nếu rỗng
            phongId: phongId || undefined,
            theLoaiId: theLoaiId || undefined,
            thietBiId: thietBiId || undefined,
            keyword: searchText || undefined
        };
        onFilterChange(filters);
    }, [trangThai, phongId, theLoaiId, thietBiId, onFilterChange, searchText]);

    // Xử lý reset bộ lọc
    const handleReset = () => {
        setTrangThai('');
        setPhongId('');
        setTheLoaiId('');
        setThietBiId('');
        setSearchText('');
    }

    return (
        <div className="p-3 bg-white border border-gray-200 rounded-md shadow-sm">
            <div className="grid items-end grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {/* Select Trạng thái */}
                <div>
                    <label htmlFor="filterTrangThai" className="block mb-1 text-xs font-medium text-gray-600">Trạng thái</label>
                    <select id="filterTrangThai" value={trangThai} onChange={(e) => setTrangThai(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">-- Tất cả trạng thái --</option>
                        <option value="con_bao_hanh">Còn bảo hành</option>
                        <option value="het_bao_hanh">Hết bảo hành</option>
                        <option value="cho_bao_hanh">Chờ bảo hành</option>
                        <option value="dang_bao_hanh">Đang bảo hành</option>
                        <option value="da_bao_hanh">Đã bảo hành</option>
                        <option value="cho_thanh_ly">Chờ thanh lý</option>
                        <option value="da_thanh_ly">Đã thanh lý</option>
                        {/* <option value="mat_mat">Mất Mát</option> */}
                    </select>
                </div>

                {/* Select Phòng / Kho */}
                <div>
                    <label htmlFor="filterPhong" className="block mb-1 text-xs font-medium text-gray-600">Vị trí</label>
                    <select id="filterPhong" value={phongId} onChange={(e) => setPhongId(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">-- Tất cả phòng có thiết bị --</option>
                        <option value="kho">Chưa phân bổ (Kho)</option>
                        {phongList?.map(p => (
                            <option key={p.id} value={p.id}>{p.phong}</option> // Kiểm tra tên trường đúng
                        ))}
                    </select>
                </div>
                {/* Select Thể loại */}
                <div>
                    <label htmlFor="filterPhong" className="block mb-1 text-xs font-medium text-gray-600">Thể Loại</label>
                    <select value={theLoaiId} onChange={(e) => { setTheLoaiId(e.target.value); setThietBiId(''); }} className="w-full p-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">-- Tất cả thể loại --</option>
                        {theLoaiList?.map(tl => (
                            <option key={tl.id} value={tl.id}>{tl.theLoai}</option>
                        ))}
                    </select>
                </div>
                {/* Select Loại Thiết bị */}
                <div>
                    <label htmlFor="filterPhong" className="block mb-1 text-xs font-medium text-gray-600">Tất Cả Thiết Bị</label>
                    <select value={thietBiId} onChange={(e) => setThietBiId(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500" disabled={!theLoaiId}>
                        <option value="">-- Tất cả loại TB --</option>
                        {thietBiList?.map(tb => (
                            <option key={tb.id} value={tb.id}>{tb.tenThietBi}</option>
                        ))}
                    </select>
                </div>
                {/* Thanh Tìm kiếm */}
                <div className="relative">
                    <label htmlFor="filterPhong" className="block mb-1 text-xs font-medium text-gray-600">Thanh Tìm Kiếm</label>
                    <div className="absolute inset-y-0 top-5 left-3 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-400 w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm thiết bị, loại..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full pl-10 pr-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {/* Nút Reset */}
                <div className="self-end mb-0">
                    <label htmlFor="filterPhong" className="block mb-1 text-xs font-medium text-gray-600">Reset Filter</label>
                    <button
                        onClick={handleReset}
                        className="w-full sm:w-auto inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 text-sm font-medium rounded-md transition duration-200"
                    >
                        Đặt lại
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BoLocTaiSan;