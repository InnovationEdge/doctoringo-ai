/**
 * BookingModal — Patient details form for doctor appointment booking.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Check } from 'lucide-react';
import { BookingIntent, SPECIALTY_NAMES, URGENCY_NAMES } from '../lib/booking';
import { supabase } from '../lib/supabase';

interface BookingModalProps {
  intent: BookingIntent;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ intent, isOpen, onClose }: BookingModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const specialtyName = SPECIALTY_NAMES[intent.specialty] || intent.specialty;
  const urgencyInfo = URGENCY_NAMES[intent.urgency] || { label: intent.urgency, color: '#6B7280' };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('appointments').insert({
        user_id: user?.id || null,
        specialty: intent.specialty,
        urgency: intent.urgency,
        reason: intent.reason,
        patient_name: name.trim(),
        patient_phone: phone.trim(),
        patient_email: email.trim() || null,
        notes: notes.trim() || null,
        status: 'pending',
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setName('');
        setPhone('');
        setEmail('');
        setNotes('');
      }, 2000);
    } catch (err) {
      console.error('Booking error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e5e5e5] dark:border-[#333]">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#033C81]" />
                <h2 className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white">
                  ვიზიტის ჩაწერა
                </h2>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg cursor-pointer">
                <X className="w-5 h-5 text-[#676767]" />
              </button>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 flex flex-col items-center gap-3"
              >
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#1a1a1a] dark:text-white">
                  ვიზიტი დაფიქსირდა!
                </h3>
                <p className="text-[14px] text-[#676767] text-center">
                  კლინიკა მალე დაგიკავშირდებათ
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Specialty + Urgency info */}
                <div className="p-3 rounded-xl bg-[#f3f3f3] dark:bg-[#2a2a2a]">
                  <div className="text-[14px] font-medium text-[#1a1a1a] dark:text-white">
                    {specialtyName}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: urgencyInfo.color }} />
                    <span className="text-[12px]" style={{ color: urgencyInfo.color }}>
                      {urgencyInfo.label}
                    </span>
                  </div>
                  {intent.reason && (
                    <p className="text-[12px] text-[#676767] mt-1">{intent.reason}</p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[13px] font-medium text-[#676767] mb-1">
                    სახელი და გვარი *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="მაგ: გიორგი მაისურაძე"
                    required
                    className="w-full px-3 py-2.5 text-[14px] bg-[#f9f9f9] dark:bg-[#2a2a2a] border border-[#e5e5e5] dark:border-[#404040] rounded-xl text-[#1a1a1a] dark:text-white placeholder:text-[#8e8e8e] outline-none focus:border-[#033C81] transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[13px] font-medium text-[#676767] mb-1">
                    ტელეფონის ნომერი *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="მაგ: 599 12 34 56"
                    required
                    className="w-full px-3 py-2.5 text-[14px] bg-[#f9f9f9] dark:bg-[#2a2a2a] border border-[#e5e5e5] dark:border-[#404040] rounded-xl text-[#1a1a1a] dark:text-white placeholder:text-[#8e8e8e] outline-none focus:border-[#033C81] transition-colors"
                  />
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="block text-[13px] font-medium text-[#676767] mb-1">
                    ელ. ფოსტა (არასავალდებულო)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="მაგ: giorgi@example.com"
                    className="w-full px-3 py-2.5 text-[14px] bg-[#f9f9f9] dark:bg-[#2a2a2a] border border-[#e5e5e5] dark:border-[#404040] rounded-xl text-[#1a1a1a] dark:text-white placeholder:text-[#8e8e8e] outline-none focus:border-[#033C81] transition-colors"
                  />
                </div>

                {/* Notes (optional) */}
                <div>
                  <label className="block text-[13px] font-medium text-[#676767] mb-1">
                    დამატებითი ინფორმაცია
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="მაგ: სასურველი დღე/დრო, სპეციფიკური მოთხოვნები..."
                    rows={2}
                    className="w-full px-3 py-2.5 text-[14px] bg-[#f9f9f9] dark:bg-[#2a2a2a] border border-[#e5e5e5] dark:border-[#404040] rounded-xl text-[#1a1a1a] dark:text-white placeholder:text-[#8e8e8e] outline-none focus:border-[#033C81] transition-colors resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || !phone.trim()}
                  className="w-full py-3 bg-[#033C81] hover:bg-[#022b5e] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-[15px] font-medium transition-colors cursor-pointer"
                >
                  {submitting ? 'იგზავნება...' : 'ჩაწერის მოთხოვნა'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
