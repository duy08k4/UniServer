# Xây dựng trang web hỗ trợ Khoa Môi trường và Tài nguyên quản lý đồ án tốt nghiệp - Máy chủ (Backend)

Tài liệu này hướng dẫn chi tiết các bước thiết lập môi trường và khởi chạy dự án máy chủ (UniServer) trên máy cục bộ để phục vụ mục đích trình diễn (Demo).

## 1. Yêu cầu hệ thống

- **Node.js:** Phiên bản 18.x hoặc cao hơn.
- **Trình quản lý gói:** npm (đi kèm khi cài đặt Node.js).
- **Cơ sở dữ liệu:** PostgreSQL (Khuyến nghị sử dụng dịch vụ Supabase để có đầy đủ tính năng lưu trữ tệp tin).

## 2. Cấu hình môi trường (.env)

Trước khi khởi chạy, bạn cần tạo tệp `.env` tại thư mục gốc của dự án `UniServer` với các thông số sau:

```env
# Kết nối cơ sở dữ liệu (PostgreSQL)
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>

# Cấu hình Supabase (Dùng để lưu trữ tệp tin đề cương/báo cáo)
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cấu hình gửi thông báo qua Email (Gmail App Password)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Cấu hình quyền truy cập (CORS)
CLIENT_DOMAIN=http://localhost:5173
```

## 3. Các bước cài đặt và khởi chạy

1. **Cài đặt thư viện**:Mở terminal tại thư mục dự án và chạy:

   ```bash
   npm install
   ```

2. **Khởi chạy máy chủ ở chế độ phát triển**:Hệ thống sẽ tự động theo dõi thay đổi mã nguồn và tải lại:

   ```bash
   npm run start:dev
   ```

   *Mặc định máy chủ sẽ chạy tại địa chỉ: http://localhost:3000*

3. **Kiểm tra cổng giao tiếp (API Documentation)**:Sau khi máy chủ khởi chạy thành công, bạn có thể truy cập tài liệu Swagger tại: `http://localhost:3000/api`

## 4. Danh sách công nghệ chính

- **Framework:** NestJS.
- **ORM:** TypeORM (PostgreSQL).
- **Lưu trữ:** Supabase Storage.
- **Real-time:** Socket.io.