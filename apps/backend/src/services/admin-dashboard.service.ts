import { adminDashboardRepo, RoomStatRow } from '../repositories/admin-dashboard.repo';

const aggregateStatus = (
  rows: RoomStatRow[],
  knownKeys: string[]
): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const key of knownKeys) result[key] = 0;
  for (const row of rows) {
    const status = row.status ?? 'unknown';
    result[status] = (result[status] ?? 0) + 1;
  }
  return result;
};

export const adminDashboardService = {
  getDashboard: async () => {
    const [
      rooms,
      branches,
      staff,
      customers,
      bedsTotal,
      bedsOccupied,
      bedsAvailable,
      servicesTotal,
      servicesAvailable
    ] = await Promise.all([
      adminDashboardRepo.findRooms(),
      adminDashboardRepo.countBranches(),
      adminDashboardRepo.countStaff(),
      adminDashboardRepo.countCustomers(),
      adminDashboardRepo.countBeds(),
      adminDashboardRepo.countBedsByStatus('occupied'),
      adminDashboardRepo.countBedsByStatus('available'),
      adminDashboardRepo.countServices(),
      adminDashboardRepo.countServicesByStatus('available')
    ]);

    const roomByStatus = aggregateStatus(rooms, [
      'available', 'occupied', 'deposited', 'maintenance', 'partial'
    ]);
    const maxOccupants = rooms.reduce((sum, r) => sum + (r.max_occupants ?? 0), 0);

    const occupancyRate = bedsTotal > 0 ? Math.round((bedsOccupied / bedsTotal) * 100) : 0;

    return {
      branches,
      rooms: {
        total: rooms.length,
        byStatus: roomByStatus
      },
      beds: {
        total: bedsTotal,
        occupied: bedsOccupied,
        available: bedsAvailable
      },
      capacity: {
        maxOccupants,
        occupancyRate
      },
      accounts: {
        staff,
        customers,
        total: staff + customers
      },
      services: {
        total: servicesTotal,
        available: servicesAvailable
      }
    };
  }
};
