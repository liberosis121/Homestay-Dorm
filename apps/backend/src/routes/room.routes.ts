/**
 * Route layer cho cac API rooms va beds.
 * Phu thuoc: services/room.service.ts, utils/response.util.ts
 */

import { Router } from 'express';
import { roomService } from '../services/room.service';
import { sendSuccess, sendError } from '../utils/response.util';

const router = Router();

// GET /api/rooms - Lay danh sach phong, ho tro bo loc
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

// GET /api/rooms/:id - Lay chi tiet phong va so giuong trong
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

// GET /api/rooms/:id/beds - Lay danh sach giuong trong phong
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
