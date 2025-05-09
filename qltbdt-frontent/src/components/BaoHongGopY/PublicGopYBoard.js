import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPublicGopYAPI, handleVoteAPI, addCommentAPI } from '../../api';
import { useAuth } from '../../context/AuthProvider';
import { toast } from 'react-toastify';
import { format } from 'date-fns'; 
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'; 
import Pagination from '../layout/Pagination';

const GopYComment = ({ comment }) => (
    <div className="mt-3 p-3 bg-gray-100 rounded-md border border-gray-200">
        <p className="text-sm text-gray-800">{comment.noiDung}</p>
        <p className="mt-1 text-xs text-gray-500">
            Bởi: {comment.nguoiBinhLuan.hoTen} ({comment.nguoiBinhLuan.role}) -{' '}
            {format(new Date(comment.thoiGian), 'dd/MM/yyyy HH:mm')}
        </p>
    </div>
);

const GopYCard = ({ gopy }) => {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const canComment = currentUser && ['admin', 'nhanvien'].includes(currentUser.role);

    const voteMutation = useMutation({
        mutationFn: ({ voteType }) => handleVoteAPI(gopy.id, voteType),
        onSuccess: (data) => {
            toast.info(data.message || "Cập nhật vote thành công!");
            queryClient.invalidateQueries(['publicGopY']);
        },
        onError: (error) => {
            console.error("Vote error on component:", error);
        }
    });

    const commentMutation = useMutation({
        mutationFn: (commentText) => addCommentAPI(gopy.id, commentText),
        onSuccess: () => {
            toast.success("Bình luận đã được gửi!");
            setNewComment('');
            queryClient.invalidateQueries(['publicGopY']); // Cập nhật lại danh sách góp ý (bao gồm comment mới)
        },
        onError: (error) => {
             console.error("Comment error on component:", error);
        },
         onSettled: () => {
             setIsSubmittingComment(false);
         }
    });


    const handleVoteClick = (voteType) => {
        voteMutation.mutate({ voteType });
    };

    const handleAddComment = (e) => {
         e.preventDefault();
         if (!newComment.trim() || !canComment) return;
         setIsSubmittingComment(true);
         commentMutation.mutate(newComment.trim());
     };


    return (
        <div className="p-4 mb-4 bg-white rounded-lg shadow-md border border-gray-200">
            {/* Thông tin chính */}
            <div className="flex justify-between items-start mb-2">
                 <div>
                     <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                         gopy.loaiGopY === 'Tính năng' ? 'bg-blue-100 text-blue-800' :
                         gopy.loaiGopY === 'Trải nghiệm người dùng' ? 'bg-green-100 text-green-800' :
                         gopy.loaiGopY === 'Hiệu năng / tốc độ' ? 'bg-yellow-100 text-yellow-800' :
                         gopy.loaiGopY === 'Quy trình sử dụng' ? 'bg-purple-100 text-purple-800' :
                         'bg-gray-100 text-gray-800'
                     }`}>{gopy.loaiGopY}</span>
                     <p className="text-sm text-gray-500 mt-1">
                        Gửi bởi: <span className="font-medium">{gopy.hoTenNguoiGui}</span> - {format(new Date(gopy.ngayGopY), 'dd/MM/yyyy HH:mm')}
                     </p>
                 </div>
                 <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    gopy.trangThai === 'Mới' ? 'bg-gray-200 text-gray-800' :
                    gopy.trangThai === 'Đang xử lý' ? 'bg-orange-200 text-orange-800' :
                    gopy.trangThai === 'Đã phản hồi' ? 'bg-green-200 text-green-800' :
                    'bg-red-200 text-red-800'
                 }`}>{gopy.trangThai}</span>
            </div>
            <p className="text-gray-800 mb-3">{gopy.noiDung}</p>

            {/* Vote và Comment */}
            <div className="flex items-center justify-between border-t pt-3 mt-3">
                {/* Nút Vote */}
                <div className="flex items-center space-x-4">
                     <button
                        onClick={() => handleVoteClick('like')}
                        disabled={voteMutation.isLoading}
                        className={`flex items-center text-sm text-gray-600 hover:text-green-600 disabled:opacity-50 transition-colors p-1 rounded ${voteMutation.isLoading && voteMutation.variables?.voteType === 'like' ? 'animate-pulse' : ''}`}
                        aria-label="Đồng ý"
                     >
                        <ThumbsUp size={16} className="mr-1" /> {gopy.likes}
                    </button>
                    <button
                        onClick={() => handleVoteClick('dislike')}
                        disabled={voteMutation.isLoading}
                        className={`flex items-center text-sm text-gray-600 hover:text-red-600 disabled:opacity-50 transition-colors p-1 rounded ${voteMutation.isLoading && voteMutation.variables?.voteType === 'dislike' ? 'animate-pulse' : ''}`}
                        aria-label="Không đồng ý"
                    >
                        <ThumbsDown size={16} className="mr-1" /> {gopy.dislikes}
                    </button>
                </div>

                {/* Nút xem/ẩn Comment */}
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                    <MessageSquare size={16} className="mr-1" />
                    {gopy.comments?.length || 0} Bình luận {showComments ? '(Ẩn)' : '(Xem)'}
                </button>
            </div>

            {/* Phần bình luận */}
            {showComments && (
                <div className="mt-4 border-t pt-4">
                     <h4 className="text-sm font-semibold mb-2">Bình luận:</h4>
                     {gopy.comments && gopy.comments.length > 0 ? (
                        gopy.comments.map(comment => <GopYComment key={comment.id} comment={comment} />)
                    ) : (
                        <p className="text-sm text-gray-500 italic">Chưa có bình luận nào.</p>
                    )}

                     {/* Form thêm bình luận (chỉ cho admin/nhanvien) */}
                    {canComment && (
                         <form onSubmit={handleAddComment} className="mt-4">
                             <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Nhập phản hồi của bạn..."
                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                rows="2"
                                required
                                disabled={isSubmittingComment}
                            />
                             <button
                                type="submit"
                                disabled={isSubmittingComment || !newComment.trim()}
                                className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                 {isSubmittingComment ? 'Đang gửi...' : 'Gửi Bình Luận'}
                            </button>
                         </form>
                     )}
                </div>
            )}
        </div>
    );
};


const PublicGopYBoard = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // Số lượng góp ý mỗi trang

    const { data, isLoading, error, isFetching } = useQuery({
        queryKey: ['publicGopY', currentPage, itemsPerPage], // Thêm key phân trang
        queryFn: () => getPublicGopYAPI(currentPage, itemsPerPage),
        keepPreviousData: true, // Giữ dữ liệu cũ khi chuyển trang để mượt hơn
    });

    if (isLoading) return <div className="text-center p-4">Đang tải danh sách góp ý...</div>;
    if (error) return <div className="text-center p-4 text-red-600">Lỗi khi tải dữ liệu góp ý.</div>;

    const gopyList = data?.data || [];
    const pagination = data?.pagination;

    return (
        <div className="p-4 bg-white rounded-lg shadow-inner"> {/* Nền nhẹ cho khu vực board */}
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                Bảng Góp Ý Công Khai
            </h2>
            {(isFetching && !isLoading) && <p className="text-sm text-blue-600 mb-2">Đang cập nhật...</p>}

            {gopyList.length === 0 ? (
                <p className="text-gray-600 italic">Chưa có góp ý nào được hiển thị.</p>
            ) : (
                 <>
                     {gopyList.map(gopy => <GopYCard key={gopy.id} gopy={gopy} />)}

                    {/* Phân trang */}
                    {pagination && pagination.totalPages > 1 && (
                         <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={(page) => setCurrentPage(page)}
                         />
                     )}
                 </>
            )}
        </div>
    );
};

export default PublicGopYBoard;