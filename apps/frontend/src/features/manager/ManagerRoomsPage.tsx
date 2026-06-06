import { useEffect, useState } from 'react';
import { getMockDB, saveMockDB, Room } from '../../lib/supabaseClient';

const T = {
  bg: '#FAF9F6', surface: '#FFFFFF', sidebar: '#FAF2EC',
  border: '#E7DED2', primary: '#5C4632', primaryLight: '#FAF2E8',
  sage: '#5F7D4E', sageBg: '#EAF0E6', amber: '#B9792B', amberBg: '#FAF2E8',
  red: '#A94F4F', redBg: '#FCECEB', text: '#2C2520', textMuted: '#6E6259', textFaint: '#8A7563'
};

type RoomStatus = Room['status'];

const STATUS_META: Record<RoomStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
  available:   { label: 'Phòng trống',    dot: '#5F7D4E',  bg: '#EAF0E6',     text: '#5F7D4E',  border: '#D2DFCE' },
  occupied:    { label: 'Đang ở',         dot: '#5C4632',  bg: '#FAF2E8',     text: '#5C4632',  border: '#E3D3C4' },
  deposited:   { label: 'Đã cọc',         dot: '#B9792B',  bg: '#FAF2E8',     text: '#B9792B',  border: '#EBD8C1' },
  maintenance: { label: 'Bảo trì',        dot: '#A94F4F',  bg: '#FCECEB',     text: '#A94F4F',  border: '#F6CDCC' },
  partial:     { label: 'Còn chỗ',        dot: '#5F7D4E',  bg: '#F3FAF2',     text: '#5F7D4E',  border: '#D2DFCE' },
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
          <h1 style={{ fontFamily: "'Lexend', sans-serif", color: T.primary, fontSize: 24, fontWeight: 700 }}>Sơ đồ phòng trực quan</h1>
        </div>
        <div className="flex flex-wrap gap-3.5">
          {Object.entries(STATUS_META).slice(0, 4).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-[#E7DED2] shadow-sm">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
              <span style={{ fontSize: 11.5, color: T.textMuted, fontWeight: 600 }}>{meta.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS_META).slice(0, 4).concat([['partial', STATUS_META.partial] as any]).map(([key, meta]: any) => (
          <div key={key} style={{ 
            background: meta.bg, 
            border: `1.5px solid ${meta.border}`, 
            borderRadius: 16, 
            padding: '12px 16px', 
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(111,88,60,0.02)',
            transition: 'all 0.15s'
          }}
          className="hover:-translate-y-0.5 hover:shadow-sm">
            <div style={{ fontFamily: "'Lexend', sans-serif", fontSize: 24, fontWeight: 800, color: meta.text }}>{summary[key]}</div>
            <div style={{ fontSize: 11, color: meta.text, fontWeight: 700, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{meta.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-5 items-start">
        {/* Floor selector */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: 12, flexShrink: 0, width: 72 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: T.textFaint, textAlign: 'center', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Tầng</p>
          <div className="space-y-2">
            {FLOORS.map(floor => (
              <button key={floor} onClick={() => setSelectedFloor(floor)}
                style={{
                  width: '100%', 
                  padding: '10px 0', 
                  borderRadius: 12, 
                  fontSize: 14, 
                  fontWeight: 800, 
                  cursor: 'pointer', 
                  border: 'none', 
                  transition: 'all 0.15s ease-in-out',
                  background: selectedFloor === floor ? T.primary : T.bg, 
                  color: selectedFloor === floor ? '#fff' : T.text
                }}
                className="hover:bg-primary hover:text-white active:scale-[0.95]">
                {floor}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms grid */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: 22, flex: 1 }}>
          <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 16 }}>
            Chi nhánh Quận 1 — Tầng {selectedFloor} ({floorRooms.length} phòng)
          </h3>
          {floorRooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: T.textFaint }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>apartment</span>
              <p style={{ fontSize: 13 }}>Không có phòng nào ở tầng này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {floorRooms.map(room => {
                const meta = STATUS_META[room.status] || STATUS_META.available;
                const isSelected = selectedRoom?.id === room.id;
                
                const gender = room.gender_type === 'male' 
                  ? { label: 'Nam', bg: '#EEF2FF', text: '#3730A3', icon: '♂' }
                  : room.gender_type === 'female' 
                  ? { label: 'Nữ', bg: '#FDF2F8', text: '#9D174D', icon: '♀' }
                  : { label: 'Hỗn hợp', bg: '#F3F4F6', text: '#374151', icon: '⚥' };

                const nameParts = room.name.split(' (');
                const roomMainName = nameParts[0];
                const roomGenderSuffix = nameParts[1] ? `(${nameParts[1]}` : '';

                return (
                  <button key={room.id} onClick={() => { setSelectedRoom(room); setDrawerOpen(true); }}
                    style={{
                      background: meta.bg, 
                      border: `2px solid ${isSelected ? T.primary : meta.border}`, 
                      borderRadius: 16, 
                      padding: 16,
                      cursor: 'pointer', 
                      textAlign: 'left', 
                      transition: 'all 0.18s ease-in-out', 
                      boxShadow: isSelected ? `0 0 0 3px ${T.primaryLight}` : 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: 154,
                      boxSizing: 'border-box'
                    }}
                    className="hover:-translate-y-1 hover:shadow-md active:scale-[0.98] active:translate-y-0 active:shadow-sm">
                    
                    {/* Top Section */}
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: T.textFaint }}>Phòng {room.floor}xx</span>
                        <span style={{
                          display: 'inline-block',
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: meta.bg,
                          color: meta.text,
                          border: `1px solid ${meta.border}`
                        }}>
                          {meta.label}
                        </span>
                      </div>
                      <span style={{ 
                        display: 'block', 
                        fontFamily: "'Lexend', sans-serif", 
                        fontSize: 20, 
                        fontWeight: 800, 
                        color: T.text,
                        lineHeight: 1.15
                      }}>
                        {roomMainName}
                      </span>
                      {roomGenderSuffix && (
                        <span style={{ 
                          display: 'block', 
                          fontSize: 12.5, 
                          fontWeight: 700, 
                          color: T.textMuted,
                          marginTop: 3
                        }}>
                          {roomGenderSuffix}
                        </span>
                      )}
                    </div>
                    
                    {/* Bottom Section */}
                    <div className="flex flex-wrap gap-1.5 w-full">
                      <span style={{
                        background: T.primaryLight,
                        color: T.primary,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3.5px 8px',
                        borderRadius: 20,
                        border: `1px solid ${T.border}`,
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}>
                        {room.capacity} giường
                      </span>
                      <span style={{
                        background: gender.bg,
                        color: gender.text,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3.5px 8px',
                        borderRadius: 20,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <span>{gender.icon}</span> <span>{gender.label}</span>
                      </span>
                    </div>
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
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,27,23,0.45)', backdropFilter: 'blur(6px)' }} />
          <div
            style={{ 
              position: 'absolute', right: 0, top: 0, bottom: 0, width: 440, maxWidth: '90vw', 
              background: T.surface, boxShadow: '-8px 0 40px rgba(111,88,60,0.18)', 
              display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${T.border}`,
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
            onClick={e => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${T.border}`, background: T.sidebar }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 style={{ fontFamily: "'Lexend', sans-serif", fontSize: 22, fontWeight: 800, color: T.text }}>{selectedRoom.name}</h3>
                  <p style={{ color: T.textMuted, fontSize: 13, marginTop: 3 }}>Mã phòng: {selectedRoom.id} • Tầng {selectedRoom.floor}</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 8, cursor: 'pointer' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: T.textMuted }}>close</span>
                </button>
              </div>
              {/* Status badge */}
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: STATUS_META[selectedRoom.status].bg, border: `1px solid ${STATUS_META[selectedRoom.status].border}`, borderRadius: 20, padding: '5px 12px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_META[selectedRoom.status].dot, display: 'inline-block' }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: STATUS_META[selectedRoom.status].text }}>{STATUS_META[selectedRoom.status].label}</span>
              </div>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="space-y-6">
              {/* Room info */}
              <div style={{ background: T.bg, borderRadius: 16, padding: 18, border: `1px solid ${T.border}` }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Thông tin phòng</h4>
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
                <h4 style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Cập nhật trạng thái nhanh</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(['available', 'occupied', 'deposited', 'maintenance'] as RoomStatus[]).map(status => {
                    const meta = STATUS_META[status];
                    const isActive = selectedRoom.status === status;
                    return (
                      <button key={status} onClick={() => changeRoomStatus(selectedRoom.id, status)}
                        style={{
                          padding: '10px 12px', 
                          borderRadius: 12, 
                          border: `2px solid ${isActive ? meta.dot : T.border}`,
                          background: isActive ? meta.bg : T.surface, 
                          cursor: 'pointer', 
                          fontSize: 12, 
                          fontWeight: 700,
                          color: isActive ? meta.text : T.textMuted, 
                          transition: 'all 0.18s ease-in-out'
                        }}
                        className="hover:border-primary/30 hover:bg-primary/5 active:scale-[0.96]">
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick actions */}
              <div>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Hành động nhanh</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Xem hóa đơn phòng', icon: 'receipt_long' },
                    { label: 'Báo dọn dẹp phòng', icon: 'cleaning_services' },
                    { label: 'Lập biên bản bàn giao', icon: 'assignment' },
                  ].map((action, i) => (
                    <button key={i} style={{ 
                      width: '100%', 
                      padding: '12px 14px', 
                      borderRadius: 12, 
                      border: `1px solid ${T.border}`, 
                      background: T.surface, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10, 
                      fontSize: 13, 
                      color: T.text, 
                      fontWeight: 600, 
                      transition: 'all 0.15s ease-in-out' 
                    }} className="hover:bg-[#FAF9F7] hover:border-primary/25 hover:text-primary active:scale-[0.98]">
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
