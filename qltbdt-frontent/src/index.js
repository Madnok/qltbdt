import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { SocketProvider } from './context/SocketContext'; // Import SocketProvider
import { ToastContainer } from 'react-toastify'; // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Import CSS cho toast

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cấu hình mặc định cho các query (tùy chọn)
      // Dữ liệu được coi là cũ sau 5 phút
      // staleTime: 5 * 60 * 1000,
      // Giữ cache trong 10 phút
      // cacheTime: 10 * 60 * 1000,
      // Thử lại query 3 lần nếu lỗi
      // retry: 3,
      // Không tự động fetch lại khi cửa sổ được focus
      // refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider> {/* Bọc SocketProvider ở đây */}
            <App />
            {/* <ReactQueryDevtools initialIsOpen={false} /> */}
            <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
