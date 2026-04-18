import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const Motion = motion;

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fcfcf9] dark:bg-[#171717] text-[#1a1a1a] dark:text-[#e5e5e0]">
      <div className="max-w-[800px] mx-auto px-6 py-12 md:py-20">
        <Motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors mb-8"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-[32px] md:text-[40px] font-serif font-bold leading-tight mb-3">
            {title}
          </h1>
          <p className="text-[14px] text-[#8e8e8e] mb-12">
            {lastUpdated}
          </p>

          <div className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:font-serif prose-headings:text-[#1a1a1a] dark:prose-headings:text-[#e5e5e0]
            prose-h2:text-[22px] prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-[18px] prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-[#4a4a4a] dark:prose-p:text-[#a0a0a0]
            prose-li:text-[15px] prose-li:text-[#4a4a4a] dark:prose-li:text-[#a0a0a0]
            prose-a:text-[#033C81] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[#1a1a1a] dark:prose-strong:text-[#e5e5e0]
          ">
            {children}
          </div>

          <div className="mt-16 pt-8 border-t border-[#e5e5e0] dark:border-[#2d2d2d] text-center">
            <p className="text-[13px] text-[#8e8e8e]">
              Doctoringo AI · <a href="mailto:knowhowaiassistant@gmail.com" className="text-[#033C81] hover:underline">knowhowaiassistant@gmail.com</a>
            </p>
          </div>
        </Motion.div>
      </div>
    </div>
  );
}
