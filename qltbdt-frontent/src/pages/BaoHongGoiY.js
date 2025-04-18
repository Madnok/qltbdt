import React, { useState, useRef, useEffect } from 'react';
import Footer from "../components/layout/Footer";
import BaoHong from "../components/BaoHongGopY/BaoHong";
import GopY from "../components/BaoHongGopY/GopY";
import Header from "../components/layout/Header";
import ScrollToTopButton from '../components/layout/ScrollToTopButton';

const slideshowImages = [
    '/iuh1.png', // Giả sử các ảnh này nằm trong thư mục public
    '/img/iuh2.png',
    '/img/iuh3.jpg',
    '/img/iuh4.png'
];
// Đảm bảo luôn có ít nhất 3 ảnh để slideshow không bị lỗi logic lặp
if (slideshowImages.length > 0 && slideshowImages.length < 3) {
    slideshowImages.push(slideshowImages[0]);
    if (slideshowImages.length < 3) {
        slideshowImages.push(slideshowImages[1 % slideshowImages.length]);
    }
}


const BaoHongGoiY = () => {
    const baoHongRef = useRef(null);
    const gopYRef = useRef(null);
    const gioiThieuRef = useRef(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const scrollToSection = (ref) => {
        const headerElement = document.querySelector('header'); // Lấy header để tính chiều cao
        const headerHeight = headerElement ? headerElement.offsetHeight : 64;

        if (ref === gioiThieuRef) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (ref.current) {
            // Tính vị trí của section và trừ đi chiều cao header
            const elementPosition = ref.current.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    // Slideshow effect
    useEffect(() => {
        if (slideshowImages.length > 1) {
            const intervalId = setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    (prevIndex + 1) % slideshowImages.length
                );
            }, 5000);
            return () => clearInterval(intervalId);
        }
    }, []); // Chỉ chạy 1 lần khi component mount

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            {/* Truyền các hàm scroll vào Header */}
            <Header
                scrollToBaoHong={() => scrollToSection(baoHongRef)}
                scrollToGopY={() => scrollToSection(gopYRef)}
                scrollToGioiThieu={() => scrollToSection(gioiThieuRef)}
            />

            {/* Section Giới thiệu */}
            <section
                ref={gioiThieuRef}
                id="gioi-thieu-section"
                className="relative flex items-center justify-center h-screen overflow-hidden text-center text-white bg-center bg-cover scroll-mt-16"
            >
                {/* Background Slideshow */}
                <div className="absolute inset-0 w-full h-full">
                    {slideshowImages.map((imgSrc, index) => (
                        <img
                            key={imgSrc + index}
                            src={imgSrc}
                            alt={`Background ${index + 1}`}
                            className={`absolute inset-0 object-cover w-full h-full filter transition-opacity duration-1000 ease-in-out ${index === currentImageIndex
                                ? 'opacity-100 z-0 blur-sm' // Ảnh hiện tại mờ nhẹ
                                : 'opacity-0 z-[-1]' // Các ảnh khác ẩn đi
                                }`}
                        />
                    ))}
                </div>

                {/* Lớp phủ Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent"></div>

                {/* Nội dung Section Giới thiệu */}
                <div className="relative z-10 p-4 space-y-4 md:p-8 md:space-y-6 max-w-4xl mx-auto">
                    {/* Logo - Responsive */}
                    <div className="flex items-center justify-center mb-4">
                        <img
                            src="./img/logoiuh.png"
                            alt="Logo IUH"
                            className="w-48 h-auto object-contain sm:w-64 md:w-80 lg:w-96"
                        />
                    </div>

                    {/* Tiêu đề chính - Responsive */}
                    <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                        IUHelp Facility Management
                    </h1>
                    {/* Tiêu đề phụ - Responsive */}
                    <h2 className="text-xl font-semibold text-gray-200 sm:text-2xl md:text-3xl">
                        Trang Quản Lý Cơ Sở Vật Chất <br className="sm:hidden" /> Trường Đại Học Công Nghiệp
                    </h2>

                    {/* Mô tả - Responsive */}
                    <p className="max-w-xl mx-auto text-sm font-light text-gray-300 sm:text-base md:text-lg">
                        Giải pháp hiệu quả để báo cáo sự cố, đóng góp ý kiến và nâng cao chất lượng cơ sở vật chất.
                    </p>

                    {/* Các nút hành động - Responsive */}
                    {/* Sử dụng flex-wrap để tự xuống dòng trên mobile */}
                    <div className="flex flex-wrap justify-center gap-3 pt-4 sm:gap-4">
                        <button
                            onClick={() => scrollToSection(baoHongRef)}
                            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-center text-white bg-red-600 rounded-lg shadow-md focus:ring-4 focus:ring-red-300 hover:bg-red-700 transition duration-300 w-full sm:w-auto"
                        >
                            <i className="w-4 h-4 mr-2 fas fa-exclamation-triangle"></i> Báo Hỏng
                        </button>
                        <button
                            onClick={() => scrollToSection(gopYRef)}
                            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-600 rounded-lg shadow-md focus:ring-4 focus:ring-blue-300 hover:bg-blue-700 transition duration-300 w-full sm:w-auto" // Đổi màu xanh khác biệt hơn
                        >
                            <i className="w-4 h-4 mr-2 fas fa-comment-dots"></i> Gửi Góp Ý
                        </button>
                    </div>
                </div>
            </section>

            {/* Container cho Báo Hỏng và Góp Ý */}
            <div className="p-4 md:p-6 lg:p-8 pt-10 md:pt-12 lg:pt-16 bg-gray-100 flex-grow">
                {/* Grid layout: 1 cột trên mobile, 2 cột từ md trở lên */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-7xl mx-auto">

                    {/* Phần Báo Hỏng  */}
                    <div
                        ref={baoHongRef}
                        id="bao-hong-section"
                        className="col-span-1 md:col-span-2 bg-white  rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 scroll-mt-16"
                    >
                        <BaoHong />
                    </div>

                    {/* Phần Góp Ý - Chiếm full width, nằm dưới Báo Hỏng */}
                    <div
                        ref={gopYRef}
                        id="gop-y-section"
                        className="col-span-1 md:col-span-2 bg-white  rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 scroll-mt-16"
                    >
                        <GopY />
                    </div>
                </div>
            </div>

            <Footer />
            <ScrollToTopButton />
        </div>
    );
};

export default BaoHongGoiY;