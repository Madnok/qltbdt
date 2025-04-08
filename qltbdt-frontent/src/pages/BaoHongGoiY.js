// src/pages/BaoHongGoiY.js
import React, { useState, useRef, useEffect } from 'react';
import Footer from "../components/layout/Footer";
import BaoHong from "../components/BaoHongGopY/BaoHong";
import GopY from "../components/BaoHongGopY/GopY";
import Header from "../components/layout/Header";
import ScrollToTopButton from '../components/layout/ScrollToTopButton';

const slideshowImages = [
    '/iuh1.png', './img/iuh2.png', './img/iuh3.jpg', './img/iuh4.png'

];
if (slideshowImages.length === 1) {
    slideshowImages.push(slideshowImages[0]);
    slideshowImages.push(slideshowImages[0]);
}

const BaoHongGoiY = () => {
    const baoHongRef = useRef(null);
    const gopYRef = useRef(null);
    const gioiThieuRef = useRef(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const scrollToSection = (ref) => {
        if (ref === gioiThieuRef) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };


    useEffect(() => {
        if (slideshowImages.length > 1) {
            const intervalId = setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    (prevIndex + 1) % slideshowImages.length
                );
            }, 20000);
            return () => clearInterval(intervalId);
        }
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header
                scrollToBaoHong={() => scrollToSection(baoHongRef)}
                scrollToGopY={() => scrollToSection(gopYRef)}
                scrollToGioiThieu={() => scrollToSection(gioiThieuRef)}
            />

            {/* Section Giới thiệu */}
            <section
                ref={gioiThieuRef}
                id="gioi-thieu"
                className="relative flex items-center justify-center overflow-hidden text-center text-white bg-center bg-cover h-sceen md:h-screen"
            >
                <div className="absolute inset-0 w-full h-full">
                    {slideshowImages.map((imgSrc, index) => (
                        <img
                            key={imgSrc + index}
                            src={imgSrc}
                            alt={`Background ${index + 1}`}
                            className={`absolute inset-0 object-cover w-full h-full filter transition-all duration-1000 ease-in-out ${index === currentImageIndex
                                ? 'opacity-100 z-0 blur-sm'
                                : 'opacity-0 z-[-1] blur-sm'
                                }`}
                        />
                    ))}
                </div>


                {/* Lớp phủ Gradient (giữ nguyên) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent"></div>
                <div className="relative z-10 p-6 space-y-6 md:p-8">
                    <h2
                        className="px-6 py-3 mb-3 text-4xl font-extrabold leading-tight text-white rounded-md shadow-lg bg-blend-hard-light"
                    >
                        IUHelp Facility Management
                    </h2>


                    <div className="flex items-center justify-center">
                        <img
                            src="./img/logoiuh.png"
                            alt="Logo"
                            className="w-[512px] h-[288px] object-contain"
                        />
                    </div>
                    <div>
                        <h2 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight md:text-xl lg:text-2xl">
                            Trang Quản Lý Cơ Sở Vật Chất
                        </h2>
                        <h1 className="mb-3 text-5xl font-extrabold leading-tight tracking-tight md:text-2xl lg:text-4xl">
                            Trường Đại Học Công Nghiệp
                        </h1>
                    </div>
                    <p className="max-w-xl mx-auto mb-6 text-base font-light md:text-xl">
                        Giải pháp hiệu quả để báo cáo sự cố, đóng góp ý kiến và nâng cao chất lượng cơ sở vật chất
                    </p>
                    {/* Căn giữa và tạo kiểu lại nút */}
                    <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 sm:flex-row">
                        <button
                            onClick={() => scrollToSection(baoHongRef)}
                            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-center text-white bg-red-600 rounded-lg shadow-md focus:ring-4 focus:ring-red-300 hover:bg-red-700 transition duration-300 w-full sm:w-auto"
                        >
                            <i className="w-4 h-4 mr-2 fas fa-exclamation-triangle"></i> Báo Hỏng
                        </button>
                        <button
                            onClick={() => scrollToSection(gopYRef)}
                            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-800 rounded-lg shadow-md focus:ring-4 focus:ring-blue-300 hover:bg-blue-800 transition duration-300 w-[96px] sm:w-auto"
                        >
                            <i className="w-4 h-4 mr-2 fas fa-comment-dots"></i> Gửi Góp Ý
                        </button>
                    </div>

                </div>
            </section>

            {/* Section Báo Hỏng */}
            <section ref={baoHongRef} id="bao-hong" className="flex items-center justify-center h-screen bg-gray-100">
                <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">{/* Thêm padding ngang responsive */}
                    <BaoHong />
                </div>
            </section>

            {/* Section Góp Ý */}
            <section ref={gopYRef} id="gop-y" className="items-center justify-center h-screen py-2 bg-gray-100 md:py-6">
                <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
                    <GopY />
                </div>
            </section>

            <Footer />
            <ScrollToTopButton /> {/* Thêm nút Scroll-to-Top */}
        </div>
    );
};

export default BaoHongGoiY;