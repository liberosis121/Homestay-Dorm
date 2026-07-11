import { adminRoomsRepo, DbRoom, DbBed } from '../repositories/admin-rooms.repo';

export const adminRoomsService = {
  // ─── ROOMS ─────────────────────────────────────────────────────────────
  getAllRooms: async (): Promise<DbRoom[]> => {
    return await adminRoomsRepo.findAllRooms();
  },

  createRoom: async (room: {
    branch_id: string;
    name: string;
    max_occupants: number;
    floor: number;
    room_type: string;
    amenities?: string[];
    price: number;
    status?: string;
  }): Promise<DbRoom> => {
    if (!room.branch_id || !room.name) {
      throw new Error('Chi nhánh và tên phòng là bắt buộc');
    }
    if (room.floor === undefined || room.floor === null) {
      throw new Error('Tầng là bắt buộc để sinh mã phòng');
    }
    return await adminRoomsRepo.createRoom(room);
  },

  updateRoom: async (id: string, room: {
    branch_id?: string;
    name?: string;
    max_occupants?: number;
    floor?: number;
    room_type?: string;
    amenities?: string[];
    price?: number;
    status?: string;
  }): Promise<DbRoom> => {
    if (!id) {
      throw new Error('ID phòng là bắt buộc');
    }
    return await adminRoomsRepo.updateRoom(id, room);
  },

  // ─── BEDS ──────────────────────────────────────────────────────────────
  getBedsByRoom: async (roomId: string): Promise<DbBed[]> => {
    if (!roomId) {
      throw new Error('ID phòng là bắt buộc');
    }
    return await adminRoomsRepo.findBedsByRoom(roomId);
  },

  createBed: async (bed: {
    room_id: string;
    name: string;
    price: number;
    status?: string;
  }): Promise<DbBed> => {
    if (!bed.room_id || !bed.name) {
      throw new Error('Phòng và tên giường là bắt buộc');
    }
    return await adminRoomsRepo.createBed(bed);
  },

  updateBed: async (id: string, bed: {
    name?: string;
    price?: number;
    status?: string;
  }): Promise<DbBed> => {
    if (!id) {
      throw new Error('ID giường là bắt buộc');
    }
    return await adminRoomsRepo.updateBed(id, bed);
  }
};
