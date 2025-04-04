import Footer from "../components/layout/Footer";
import BaoHong from "../components/BaoHongGopY/BaoHong";
import GopY from "../components/BaoHongGopY/GopY";
import '@fortawesome/fontawesome-free/css/all.css';
import Header from "../components/layout/Header";

const BaoHongGoiY = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <div className="flex-grow p-6 font-inter">
                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="grid gap-8 md:grid-rows-2">
                        {/* Báo Hỏng */}
                        <BaoHong />
                        {/* Gợi Ý */}
                        <GopY />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default BaoHongGoiY