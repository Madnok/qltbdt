const cron = require('node-cron');
const db = require('../config/db');

// Định nghĩa các hằng số cho trạng thái bảo hành để tránh lỗi gõ nhầm
const STATUS_CON_BAO_HANH = 'con_bao_hanh';
const STATUS_HET_BAO_HANH = 'het_bao_hanh';

//format giờ việt nam
function formatVietnamTime(date) {
    const vietnamDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    
    const day = vietnamDate.getDate().toString().padStart(2, '0');
    const month = (vietnamDate.getMonth() + 1).toString().padStart(2, '0');
    const year = vietnamDate.getFullYear();
    
    const hours = vietnamDate.getHours().toString().padStart(2, '0');
    const minutes = vietnamDate.getMinutes().toString().padStart(2, '0');
    const seconds = vietnamDate.getSeconds().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Hàm này sẽ truy vấn cơ sở dữ liệu để tìm các thiết bị
 * sau đó cập nhật tinhTrang của chúng thành "Hết bảo hành".
 */
const updateExpiredWarrantyStatuses = async () => {
    const nowInVietnam = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const currentDate = nowInVietnam.toISOString().slice(0, 10);

    console.log(`[${formatVietnamTime(new Date())}] Đang chạy tác vụ định kỳ cập nhật trạng thái bảo hành. Ngày kiểm tra: ${currentDate}`);

    try {
        const [result] = await db.query(
            `UPDATE thongtinthietbi
             SET tinhTrang = ? 
             WHERE ngayBaoHanhKetThuc < ? AND tinhTrang = ?`,
            [STATUS_HET_BAO_HANH, currentDate, STATUS_CON_BAO_HANH]
        );

        if (result.affectedRows > 0) {
            console.log(`[${formatVietnamTime(new Date())}] Đã cập nhật ${result.affectedRows} thiết bị sang trạng thái "${STATUS_HET_BAO_HANH}".`);
        } else {
            console.log(`[${formatVietnamTime(new Date())}] Không có thiết bị nào cần cập nhật.`);
        }
    } catch (error) {
        console.error(`[${formatVietnamTime(new Date())}] Lỗi khi cập nhật trạng thái bảo hành hết hạn:`, error);
    }
};


/**
 * Hàm này sẽ lên lịch cho tác vụ updateExpiredWarrantyStatuses chạy định kỳ.
 */
const startWarrantyUpdateSchedule = () => {
    // Lên lịch chạy tác vụ vào lúc 01:00 AM mỗi ngày theo múi giờ Việt Nam.
    // Cú pháp cron: 'phút giờ ngày tháng ngày_trong_tuần'
    // '0 1 * * *' -> 0 phút, 1 giờ, bất kỳ ngày nào trong tháng, bất kỳ tháng nào, bất kỳ ngày nào trong tuần.
    cron.schedule('0 1 * * *', updateExpiredWarrantyStatuses, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh" 
    });

    console.log(`[${formatVietnamTime(new Date())}] Đã khởi động tác vụ định kỳ cập nhật trạng thái bảo hành. Tác vụ sẽ chạy vào 01:00 đêm hàng ngày.`);
    
    // Tùy chọn: Chạy một lần khi khởi động ứng dụng.
    // Điều này hữu ích để đảm bảo dữ liệu được cập nhật ngay lập tức khi server vừa khởi động lại,
    // đặc biệt nếu server đã tắt một thời gian.
    console.log(`[${formatVietnamTime(new Date())}] Chạy cập nhật trạng thái bảo hành một lần khi khởi động...`);
    updateExpiredWarrantyStatuses(); 
};

module.exports = {
    startWarrantyUpdateSchedule,
    updateExpiredWarrantyStatuses 
};