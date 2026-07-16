import { adminRoomsRepo, DbRoom, DbBed } from '../repositories/admin-rooms.repo';

export const adminRoomsService = {
  // ─── ROOMS ─────────────────────────────────────────────────────────────
  getAllRooms: async (): Promise<any[]> => {
    const rooms = await adminRoomsRepo.findAllRooms();
    const beds = await adminRoomsRepo.findAllBeds();
    
    return rooms.map(room => {
      const roomBeds = beds.filter(b => b.room_id === room.id);
      const availableCount = roomBeds.filter((b) => b.status === 'available').length;
      let derivedStatus = room.status;

      if (room.status !== 'maintenance') {
        if (roomBeds.length === 0 || availableCount === 0) {
          derivedStatus = 'occupied';
        } else if (availableCount === roomBeds.length) {
          derivedStatus = 'available';
        } else {
          derivedStatus = 'partial';
        }
      }

      return {
        ...room,
        status: derivedStatus
      };
    });
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
    gender_type?: string;
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
    gender_type?: string;
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
