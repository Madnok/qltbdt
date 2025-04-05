import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cấu hình mặc định cho các query (tùy chọn)
      // Ví dụ: Dữ liệu được coi là cũ sau 5 phút
      // staleTime: 5 * 60 * 1000,
      // Ví dụ: Giữ cache trong 10 phút
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
    {/* Bọc App bằng QueryClientProvider */}
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
