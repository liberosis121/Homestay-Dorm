/**
 * Utilities for viewing_schedules.note.
 *
 * The table has no status history table, so each action is stored as one JSON
 * line in note. New lines may include actor/awaiting metadata to tell which
 * side must confirm a pending schedule.
 */

export type ViewingEventType =
  | 'created'
  | 'confirmed'
  | 'rescheduled'
  | 'cancelled'
  | 'completed';

export type ViewingActor = 'staff' | 'customer';

export interface ViewingEvent {
  t: string;
  type: ViewingEventType;
  by: string;
  desc: string;
  actor?: ViewingActor;
  awaiting?: ViewingActor;
}

export const appendViewingLog = (
  existingNote: string | null | undefined,
  type: ViewingEventType,
  by: string,
  desc: string,
  meta?: { actor?: ViewingActor; awaiting?: ViewingActor },
): string => {
  const line = JSON.stringify({ t: new Date().toISOString(), type, by, desc, ...meta } as ViewingEvent);
  return existingNote && existingNote.trim() ? `${existingNote}\n${line}` : line;
};

export const parseViewingLog = (note: string | null | undefined): ViewingEvent[] => {
  return (note || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const event = JSON.parse(line);
        if (!event || typeof event !== 'object' || !event.type) return [];
        return [event as ViewingEvent];
      } catch {
        return [];
      }
    });
};

export const getPendingConfirmationActor = (note: string | null | undefined): ViewingActor => {
  const events = parseViewingLog(note);

  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event.awaiting === 'staff' || event.awaiting === 'customer') {
      return event.awaiting;
    }

    if (event.type === 'rescheduled') {
      if (event.actor === 'customer') return 'staff';
      if (event.actor === 'staff') return 'customer';

      const text = `${event.by || ''} ${event.desc || ''}`.toLowerCase();
      if (text.includes('khach') || text.includes('khÃ¡ch')) return 'staff';
      if (text.includes('sale') || text.includes('nhan vien') || text.includes('nhÃ¢n viÃªn')) return 'customer';
    }

    if (event.type === 'created') {
      return 'customer';
    }
  }

  return 'customer';
};
