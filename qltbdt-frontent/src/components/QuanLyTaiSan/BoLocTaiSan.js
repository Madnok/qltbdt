import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    fetchPhongList,
    fetchTheLoaiList,
    getThietBiByTheLoaiAPI
} from '../../api';

const BoLocTaiSan = ({ onFilterChange }) => {
    const [trangThai, setTrangThai] = useState('');
    const [phongId, setPhongId] = useState('');
    const [theLoaiId, setTheLoaiId] = useState('');
    const [thietBiId, setThietBiId] = useState('');

    // Lấy danh sách phòng
    const { data: phongList } = useQuery({
        queryKey: ['listPhong'],
        // SỬA LẠI TÊN HÀM API:
        queryFn: () => fetchPhongList().then(res => res.data || res)
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
        };
        // console.log("BoLocTaiSan useEffect triggering filter change:", filters);
        onFilterChange(filters);
    }, [trangThai, phongId, theLoaiId, thietBiId, onFilterChange]);

    // Xử lý reset bộ lọc
    const handleReset = () => {
        setTrangThai('');
        setPhongId('');
        setTheLoaiId('');
        setThietBiId('');
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
                        <option value="dang_bao_hanh">Đang bảo hành</option>
                        <option value="cho_thanh_ly">Chờ thanh lý</option>
                        <option value="da_thanh_ly">Đã thanh lý</option>
                    </select>
                </div>

                {/* Select Phòng / Kho */}
                <div>
                    <label htmlFor="filterPhong" className="block mb-1 text-xs font-medium text-gray-600">Vị trí</label>
                    <select id="filterPhong" value={phongId} onChange={(e) => setPhongId(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">-- Tất cả vị trí --</option>
                        <option value="kho">Chưa phân bổ (Kho)</option>
                        {/* Giả sử API fetchPhongList trả về mảng [{id, tenPhong}] hoặc [{id, toa, tang, soPhong}] */}
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
                        {/* Giả sử API fetchTheLoaiList trả về mảng [{id, theLoai}] */}
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
                        {/* Giả sử API getThietBiByTheLoaiAPI trả về mảng [{id, tenThietBi}] */}
                        {thietBiList?.map(tb => (
                            <option key={tb.id} value={tb.id}>{tb.tenThietBi}</option>
                        ))}
                    </select>
                </div>
                {/* Nút Reset */}
                <div className="self-end mb-0"> {/* Đẩy nút xuống dưới cùng hàng */}
                    <button onClick={handleReset} className="w-full sm:w-auto px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-md">
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BoLocTaiSan;