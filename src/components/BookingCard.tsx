/**
 * BookingCard — Inline booking UI that appears in chat when AI recommends a doctor visit.
 * Shows specialty, urgency, reason + "Book Appointment" button.
 */
import { motion } from 'motion/react';
import { Calendar, Phone, MapPin } from 'lucide-react';
import { BookingIntent, SPECIALTY_NAMES, URGENCY_NAMES } from '../lib/booking';

interface BookingCardProps {
  intent: BookingIntent;
  onBook: (intent: BookingIntent) => void;
}

export function BookingCard({ intent, onBook }: BookingCardProps) {
  const specialtyName = SPECIALTY_NAMES[intent.specialty] || intent.specialty;
  const urgencyInfo = URGENCY_NAMES[intent.urgency] || { label: intent.urgency, color: '#6B7280' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mt-4 rounded-2xl border border-[#033C81]/20 dark:border-[#033C81]/30 bg-[#033C81]/5 dark:bg-[#033C81]/10 p-4 max-w-md"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-[#033C81]" />
        <span className="text-[14px] font-semibold text-[#033C81] dark:text-[#5B9BD5]">
          ექიმთან ვიზიტის რეკომენდაცია
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#676767]" />
          <span className="text-[14px] text-[#1a1a1a] dark:text-[#ececec]">
            <span className="font-medium">{specialtyName}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: urgencyInfo.color }}
          />
          <span className="text-[13px]" style={{ color: urgencyInfo.color }}>
            {urgencyInfo.label}
          </span>
        </div>

        {intent.reason && (
          <p className="text-[13px] text-[#676767] dark:text-[#8e8e8e] ml-6">
            {intent.reason}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onBook(intent)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#033C81] hover:bg-[#022b5e] text-white rounded-xl text-[14px] font-medium transition-colors cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          ჩაწერა
        </button>

        <a
          href="tel:112"
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[14px] font-medium transition-colors cursor-pointer ${
            intent.urgency === 'emergency'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-[#f3f3f3] dark:bg-[#2a2a2a] text-[#1a1a1a] dark:text-[#ececec] hover:bg-[#e8e8e8] dark:hover:bg-[#333]'
          }`}
          style={intent.urgency === 'emergency' ? {} : { display: 'none' }}
        >
          <Phone className="w-4 h-4" />
          112
        </a>
      </div>
    </motion.div>
  );
}
