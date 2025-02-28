const UsersInfo = ({ user }) => {
    if (!user) return <p>Chưa chọn người dùng</p>;

    return (
        <div className="p-4 bg-white rounded-md shadow-md">
            <h3 className="text-xl font-semibold">{user.username}</h3>
            <p>Email: {user.email}</p>
            <p>Vai trò: {user.role}</p>
        </div>
    );
};

export default UsersInfo;
