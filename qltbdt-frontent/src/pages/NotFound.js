import React from 'react';

const NotFound = () => {
  return (
    <div className="bg-white min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-8xl font-serif text-gray-800 rounded">404</h1>
      <div
        className="bg-center bg-no-repeat h-[400px] w-full max-w-xl flex items-center justify-center"
        style={{
          backgroundImage: "url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')"
        }}
      >
      </div>
      <div className="text-center font-sans">
        <h3 className="text-4xl">Có vẻ như bạn đã đi lạc, Trang bạn đang tìm kiếm không tồn tại!</h3>
        <a
          href="/"
          className="inline-block mt-5 px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Quay về trang chủ
        </a>
      </div>
    </div>
  );
};

export default NotFound;
