const UsersInfo = ({ user }) => {

    return (
        <div className="p-4 bg-white rounded-md shadow-md">
            <h3 className="text-xl font-semibold">user.username</h3>
            <p>Email: </p>
            <p>Vai trò: </p>
        </div>
    );
};

export default UsersInfo;
