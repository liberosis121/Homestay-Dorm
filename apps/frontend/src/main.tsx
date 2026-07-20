import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import './lib/customAlert'

/**
 * Bộ nhớ đệm dữ liệu dùng chung cho toàn app.
 *
 * Trước đây `@tanstack/react-query` có trong package.json nhưng KHÔNG hề được dùng
 * (0 useQuery, không có Provider) — mọi trang tự `useEffect` + `fetch`, nên rời trang
 * rồi quay lại là tải lại từ đầu dù dữ liệu vừa lấy xong vài giây trước.
 *
 * Các mặc định dưới đây cố ý chọn "an toàn": giữ đúng hành vi cũ, chỉ thêm phần đệm.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Trong 60 giây, quay lại trang cũ sẽ dùng lại dữ liệu đã có thay vì gọi lại API.
      // Cũng giúp gộp các lần gọi trùng nhau — kể cả cú gọi đôi mà React.StrictMode
      // gây ra ở môi trường dev.
      staleTime: 60_000,
      // Giữ nguyên hành vi hiện tại: KHÔNG tự tải lại khi người dùng quay lại tab.
      refetchOnWindowFocus: false,
      // Thử lại đúng 1 lần khi lỗi mạng (mặc định của thư viện là 3 — quá nhiều,
      // sẽ bắt người dùng chờ lâu khi backend thực sự sập).
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
