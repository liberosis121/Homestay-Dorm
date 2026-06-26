/**
 * 📁 FILE: routes/room.routes.ts
 * 🎯 MỤC ĐÍCH: Cấu hình các endpoints (API routes) liên quan đến Phòng và Giường.
 * 🏗️ TẦNG: Route Layer (Nhận HTTP request từ Client, chuyển tiếp đến Room Service, phản hồi response chuẩn)
 * 📦 PHỤ THUỘC:
 *   - services/room.service.ts  → Logic nghiệp vụ của Phòng/Giường
 *   - utils/response.util.ts    → Hàm phản hồi sendSuccess / sendError
 *
 * 🔄 CÁC API ENDPOINTS PUBLIC (Không bắt buộc đăng nhập để tăng trải nghiệm xem phòng của khách hàng):
 *   - `GET /api/rooms`       : Lấy danh sách phòng, hỗ trợ bộ lọc (filters) qua Query params
 *   - `GET /api/rooms/:id`   : Lấy chi tiết phòng (bao gồm danh sách giường, số giường trống)
 *   - `GET /api/rooms/:id/beds`: Lấy trực tiếp danh sách giường của 1 phòng
 */

import { Router } from 'express';
import { roomService } from '../services/room.service';
import { sendSuccess, sendError } from '../utils/response.util';

const router = Router();

/**
 * 🔗 GET /api/rooms
 * 📝 Lấy danh sách toàn bộ phòng, cho phép lọc theo chi nhánh, loại phòng, trạng thái, khoảng giá.
 * 📥 Query params: ?branch_id=CN-001&room_type=dorm&status=available&min_price=1000000&max_price=2000000
 */
router.get('/rooms', async (req, res) => {
  try {
    const { branch_id, room_type, status, min_price, max_price } = req.query;

    // Chuyển đổi định dạng khoảng giá từ query string sang số nguyên
    const filters = {
      branch_id: branch_id as string,
      room_type: room_type as string,
      status: status as string,
      min_price: min_price ? parseInt(min_price as string, 10) : undefined,
      max_price: max_price ? parseInt(max_price as string, 10) : undefined,
    };

    const data = await roomService.listRooms(filters);
    return sendSuccess(res, data, 'Lấy danh sách phòng thành công!');
  } catch (error: any) {
    return sendError(res, error, error.message || 'Lỗi khi lấy danh sách phòng.');
  }
});

/**
 * 🔗 GET /api/rooms/:id
 * 📝 Lấy thông tin chi tiết một phòng cùng với danh sách giường trực thuộc và số giường trống.
 * 📥 Path param: :id là mã phòng (ví dụ: P-101)
 */
router.get('/rooms/:id', async (req, res) => {
  try {
    const roomId = req.params.id;
    const data = await roomService.getRoomDetail(roomId);
    return sendSuccess(res, data, 'Lấy chi tiết phòng thành công!');
  } catch (error: any) {
    // Trả về lỗi 404 nếu không tìm thấy phòng
    const statusCode = error.message?.includes('Không tìm thấy phòng') ? 404 : 500;
    return sendError(res, error, error.message || 'Lỗi khi lấy chi tiết phòng.', statusCode);
  }
});

/**
 * 🔗 GET /api/rooms/:id/beds
 * 📝 Lấy danh sách giường thuộc về một phòng cụ thể.
 * 📥 Path param: :id là mã phòng
 */
router.get('/rooms/:id/beds', async (req, res) => {
  try {
    const roomId = req.params.id;
    const data = await roomService.getRoomBeds(roomId);
    return sendSuccess(res, data, 'Lấy danh sách giường thành công!');
  } catch (error: any) {
    const statusCode = error.message?.includes('Không tìm thấy phòng') ? 404 : 500;
    return sendError(res, error, error.message || 'Lỗi khi lấy danh sách giường.', statusCode);
  }
});

export default router;
