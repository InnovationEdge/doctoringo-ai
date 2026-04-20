/**
 * Doctoringo AI — Booking Intent Parser
 *
 * Parses [[BOOK_APPOINTMENT]] blocks from AI responses.
 * When AI recommends a doctor visit, it includes a structured booking block.
 */

export interface BookingIntent {
  specialty: string;
  urgency: 'emergency' | 'same_day' | 'within_2_days' | 'within_week' | 'routine';
  reason: string;
}

// Specialty display names (Georgian)
export const SPECIALTY_NAMES: Record<string, string> = {
  general_practitioner: 'ოჯახის ექიმი',
  cardiologist: 'კარდიოლოგი',
  gastroenterologist: 'გასტროენტეროლოგი',
  neurologist: 'ნევროლოგი',
  dermatologist: 'დერმატოლოგი',
  endocrinologist: 'ენდოკრინოლოგი',
  gynecologist: 'გინეკოლოგი',
  urologist: 'უროლოგი',
  pediatrician: 'პედიატრი',
  pulmonologist: 'პულმონოლოგი',
  ophthalmologist: 'ოფთალმოლოგი',
  otolaryngologist: 'ყელ-ცხვირ-ყურის ექიმი',
  psychiatrist: 'ფსიქიატრი',
  orthopedist: 'ორთოპედი',
  rheumatologist: 'რევმატოლოგი',
  oncologist: 'ონკოლოგი',
};

// Urgency display names (Georgian)
export const URGENCY_NAMES: Record<string, { label: string; color: string }> = {
  emergency: { label: '🚨 გადაუდებელი — ახლავე!', color: '#DC2626' },
  same_day: { label: 'დღესვე', color: '#EA580C' },
  within_2_days: { label: '1-2 დღეში', color: '#D97706' },
  within_week: { label: 'ამ კვირაში', color: '#2563EB' },
  routine: { label: 'გეგმიური', color: '#059669' },
};

/**
 * Parse [[BOOK_APPOINTMENT]] block from AI output.
 * Returns the booking intent + cleaned text (block removed).
 */
export function parseBookingIntent(text: string): {
  intent: BookingIntent | null;
  cleanText: string;
} {
  const blockRegex = /\[\[BOOK_APPOINTMENT\]\]([\s\S]*?)\[\[\/BOOK_APPOINTMENT\]\]/;
  const match = text.match(blockRegex);

  if (!match) {
    return { intent: null, cleanText: text };
  }

  const block = match[1];
  const getField = (name: string): string => {
    const r = new RegExp(`${name}:\\s*(.+)`, 'i');
    return block.match(r)?.[1]?.trim() || '';
  };

  const specialty = getField('specialty');
  const urgency = getField('urgency') as BookingIntent['urgency'];
  const reason = getField('reason');

  if (!specialty || !urgency) {
    return { intent: null, cleanText: text.replace(blockRegex, '').trim() };
  }

  return {
    intent: { specialty, urgency, reason },
    cleanText: text.replace(blockRegex, '').trim(),
  };
}
