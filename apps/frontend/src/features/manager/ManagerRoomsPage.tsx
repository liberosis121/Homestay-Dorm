import { useEffect, useState } from 'react';
import { getMockDB, saveMockDB, Room } from '../../lib/supabaseClient';

const T = {
  bg: '#FFF8F3', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#D6CEC8', primary: '#8C7355', primaryLight: '#F5EFE6',
  sage: '#5F745D', sageBg: '#E1E9DF', amber: '#A67B5B', amberBg: '#FFF0E5',
  red: '#BA1A1A', redBg: '#FFDAD6', text: '#1E1B17', textMuted: '#4E453C', textFaint: '#7F756B'
};

type RoomStatus = Room['status'];

const STATUS_META: Record<RoomStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
  available:   { label: 'Phòng trống',    dot: T.sage,  bg: T.sageBg,     text: T.sage,  border: '#A8C3A5' },
  occupied:    { label: 'Đang ở',         dot: T.primary, bg: T.primaryLight, text: T.primary, border: '#C4AA8B' },
  deposited:   { label: 'Đã cọc',         dot: T.amber, bg: T.amberBg,    text: T.amber, border: '#C9A07A' },
  maintenance: { label: 'Bảo trì',        dot: T.red,   bg: T.redBg,      text: T.red,   border: '#E8A9A4' },
  partial:     { label: 'Còn chỗ',        dot: T.sage,  bg: '#F0F7EF',    text: T.sage,  border: '#A8C3A5' },
};

const FLOORS = [1, 2, 3, 4, 5];

export default function ManagerRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const db = getMockDB();
    setRooms(db.rooms || []);
  }, []);

  const floorRooms = rooms.filter(r => r.floor === selectedFloor);
  const summary: Record<string, number> = { available: 0, occupied: 0, deposited: 0, maintenance: 0, partial: 0 };
  rooms.forEach(r => { if (summary[r.status] !== undefined) summary[r.status]++; });

  const changeRoomStatus = (roomId: string, newStatus: RoomStatus) => {
    const db = getMockDB();
    const updated = db.rooms.map((r: Room) => {
      if (r.id === roomId) {
        const u = { ...r, status: newStatus };
        if (selectedRoom?.id === roomId) setSelectedRoom(u);
        return u;
      }
      return r;
    });
    db.rooms = updated;
    saveMockDB(db);
    setRooms(updated);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.text, fontSize: 24, fontWeight: 700 }}>Sơ đồ phòng trực quan</h1>
          <p style={{ color: T.textMuted, fontSize: 13, marginTop: 4 }}>UC24 — Theo dõi và cập nhật trạng thái phòng theo thời gian thực</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_META).slice(0, 4).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-2">
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: T.textMuted }}>{meta.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS_META).slice(0, 4).concat([['partial', STATUS_META.partial] as any]).map(([key, meta]: any) => (
          <div key={key} style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 14, padding: '12px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 26, fontWeight: 700, color: meta.text }}>{summary[key]}</div>
            <div style={{ fontSize: 11, color: meta.text, fontWeight: 600, marginTop: 2 }}>{meta.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-5 items-start">
        {/* Floor selector */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 12, flexShrink: 0, width: 72 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: T.textFaint, textAlign: 'center', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Tầng</p>
          <div className="space-y-2">
            {FLOORS.map(floor => (
              <button key={floor} onClick={() => setSelectedFloor(floor)}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                  background: selectedFloor === floor ? T.primary : T.bg, color: selectedFloor === floor ? '#fff' : T.text
                }}>
                {floor}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms grid */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 20, flex: 1 }}>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 16 }}>
            Chi nhánh Quận 1 — Tầng {selectedFloor} ({floorRooms.length} phòng)
          </h3>
          {floorRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: T.textFaint }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>apartment</span>
              <p style={{ fontSize: 13 }}>Không có phòng nào ở tầng này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {floorRooms.map(room => {
                const meta = STATUS_META[room.status] || STATUS_META.available;
                const isSelected = selectedRoom?.id === room.id;
                return (
                  <button key={room.id} onClick={() => { setSelectedRoom(room); setDrawerOpen(true); }}
                    style={{
                      background: meta.bg, border: `2px solid ${isSelected ? T.primary : meta.border}`, borderRadius: 14, padding: 14,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', boxShadow: isSelected ? `0 0 0 3px ${T.primaryLight}` : 'none'
                    }}
                    className="hover:scale-[1.02] hover:shadow-md">
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.textFaint, marginBottom: 4 }}>Tầng {room.floor}</span>
                    <span style={{ display: 'block', fontFamily: "'Lexend', sans-serif", fontSize: 18, fontWeight: 800, color: T.text }}>{room.name}</span>
                    <span style={{ display: 'block', fontSize: 10, fontWeight: 700, color: meta.text, textTransform: 'uppercase', marginTop: 6 }}>{meta.label}</span>
                    <span style={{ display: 'block', fontSize: 11, color: T.textMuted, marginTop: 3 }}>{room.capacity} giường • {room.gender_type === 'male' ? '♂ Nam' : room.gender_type === 'female' ? '♀ Nữ' : '⚥ Hỗn hợp'}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Room Detail Drawer */}
      {drawerOpen && selectedRoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setDrawerOpen(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.4)', backdropFilter: 'blur(4px)' }} />
          <div
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 420, maxWidth: '90vw', background: T.surface, boxShadow: '-8px 0 40px rgba(111,88,60,0.15)', display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${T.border}` }}
            onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 22, fontWeight: 700, color: T.text }}>{selectedRoom.name}</h3>
                  <p style={{ color: T.textMuted, fontSize: 13, marginTop: 3 }}>Mã phòng: {selectedRoom.id} • Tầng {selectedRoom.floor}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.textMuted }}>close</span>
                </button>
              </div>
              {/* Status badge */}
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: STATUS_META[selectedRoom.status].bg, border: `1px solid ${STATUS_META[selectedRoom.status].border}`, borderRadius: 20, padding: '5px 12px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_META[selectedRoom.status].dot, display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_META[selectedRoom.status].text }}>{STATUS_META[selectedRoom.status].label}</span>
              </div>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="space-y-5">
              {/* Room info */}
              <div style={{ background: T.bg, borderRadius: 16, padding: 16, border: `1px solid ${T.border}` }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Thông tin phòng</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Sức chứa', val: `${selectedRoom.capacity} giường` },
                    { label: 'Giới tính', val: selectedRoom.gender_type === 'male' ? 'Nam' : selectedRoom.gender_type === 'female' ? 'Nữ' : 'Hỗn hợp' },
                    { label: 'Loại phòng', val: selectedRoom.room_type },
                    { label: 'Đơn giá', val: `${selectedRoom.price.toLocaleString('vi-VN')}đ/tháng` },
                    { label: 'Điều hoà', val: selectedRoom.has_ac ? 'Có' : 'Không' },
                    { label: 'WC riêng', val: selectedRoom.has_private_wc ? 'Có' : 'Không' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span style={{ fontSize: 13, color: T.textMuted }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status update */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Cập nhật trạng thái nhanh</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['available', 'occupied', 'deposited', 'maintenance'] as RoomStatus[]).map(status => {
                    const meta = STATUS_META[status];
                    const isActive = selectedRoom.status === status;
                    return (
                      <button key={status} onClick={() => changeRoomStatus(selectedRoom.id, status)}
                        style={{
                          padding: '10px 12px', borderRadius: 12, border: `2px solid ${isActive ? meta.dot : T.border}`,
                          background: isActive ? meta.bg : T.surface, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                          color: isActive ? meta.text : T.textMuted, transition: 'all 0.2s'
                        }}>
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick actions */}
              <div>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Hành động nhanh</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Xem hóa đơn phòng', icon: 'receipt_long' },
                    { label: 'Báo dọn dẹp phòng', icon: 'cleaning_services' },
                    { label: 'Lập biên bản bàn giao', icon: 'assignment' },
                  ].map((action, i) => (
                    <button key={i} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: T.text, fontWeight: 500, transition: 'background 0.15s' }} className="hover:bg-[#FAF2EC]">
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.primary }}>{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
