import { X, User, Settings, Shield, Bell, Moon, Globe, Database, CreditCard, ChevronRight } from 'lucide-react';
import { motion as Motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'src/providers/TranslationProvider';

interface SettingsPageProps {
  onClose: () => void;
  user: any;
}

export function SettingsPage({ onClose, user }: SettingsPageProps) {
  const { translate } = useTranslation();
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', label: translate('account', 'Account'), icon: User },
    { id: 'appearance', label: translate('appearance', 'Appearance'), icon: Moon },
    { id: 'notifications', label: translate('notifications', 'Notifications'), icon: Bell },
    { id: 'billing', label: translate('billing', 'Billing'), icon: CreditCard },
    { id: 'privacy', label: translate('sp_privacy_security', 'Privacy & Security'), icon: Shield },
    { id: 'data', label: translate('sp_data_controls', 'Data Controls'), icon: Database },
  ];

  return (
    <div className="fixed inset-0 bg-[#171717]/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <Motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#212121] w-full max-w-4xl rounded-3xl border border-[#2d2d2d] shadow-2xl overflow-hidden flex h-[600px]"
      >
        {/* Sidebar */}
        <div className="w-64 border-r border-[#2d2d2d] bg-[#1a1a1a] flex flex-col">
          <div className="p-6">
            <h2 className="text-xl font-serif font-medium text-[#ececec]">{translate('settings_title', 'Settings')}</h2>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#033C81] text-white font-medium' 
                    : 'text-[#8e8e8e] hover:bg-white/5 hover:text-[#ececec]'
                }`}
              >
                <tab.icon className="w-4.5 h-4.5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col bg-[#212121]">
          <div className="p-4 border-b border-[#2d2d2d] flex justify-end">
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-[#8e8e8e] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'account' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium text-[#ececec] mb-4">{translate('sp_account_info', 'Account Information')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1a1a1a] border border-[#2d2d2d]">
                      <div className="w-16 h-16 rounded-full bg-[#3d3d3d] flex items-center justify-center text-2xl font-bold text-white">
                        {user?.first_name?.[0] || 'I'}
                      </div>
                      <div className="flex-1">
                        <div className="text-[15px] font-medium text-[#ececec]">{user?.first_name || 'Irakli'} {user?.last_name || ''}</div>
                        <div className="text-[13px] text-[#8e8e8e]">{user?.email || 'knowhowaiassistant@gmail.com'}</div>
                      </div>
                      <button className="px-4 py-2 text-[13px] font-medium border border-[#2d2d2d] rounded-lg hover:bg-white/5 transition-colors">
                        {translate('sp_edit_profile', 'Edit Profile')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#ececec]">{translate('sp_security', 'Security')}</h3>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-[#2d2d2d] hover:bg-white/5 transition-all text-left">
                    <div>
                      <div className="text-[15px] font-medium text-[#ececec]">{translate('sp_change_password', 'Change Password')}</div>
                      <div className="text-[13px] text-[#8e8e8e]">{translate('sp_last_updated_3mo', 'Last updated 3 months ago')}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#8e8e8e]" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-[#2d2d2d] hover:bg-white/5 transition-all text-left">
                    <div>
                      <div className="text-[15px] font-medium text-[#ececec]">{translate('sp_two_factor', 'Two-Factor Authentication')}</div>
                      <div className="text-[13px] text-green-500 font-medium">{translate('sp_enabled', 'Enabled')}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#8e8e8e]" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-[#ececec]">{translate('sp_appearance_settings', 'Appearance Settings')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl border-2 border-[#033C81] bg-[#1a1a1a] cursor-pointer">
                    <div className="w-full aspect-video bg-[#212121] rounded-lg mb-3 border border-[#2d2d2d]" />
                    <div className="text-center text-[14px] font-medium text-[#ececec]">{translate('sp_dark_default', 'Dark (Default)')}</div>
                  </div>
                  <div className="p-4 rounded-2xl border border-[#2d2d2d] bg-[#f9f9f9] cursor-pointer opacity-50 grayscale hover:grayscale-0 transition-all">
                    <div className="w-full aspect-video bg-white rounded-lg mb-3 border border-[#e5e5e5]" />
                    <div className="text-center text-[14px] font-medium text-black">{translate('theme_light', 'Light')}</div>
                  </div>
                  <div className="p-4 rounded-2xl border border-[#2d2d2d] bg-[#1a1a1a] cursor-pointer">
                    <div className="w-full aspect-video bg-gradient-to-r from-[#212121] to-[#f9f9f9] rounded-lg mb-3 border border-[#2d2d2d]" />
                    <div className="text-center text-[14px] font-medium text-[#8e8e8e]">{translate('sp_system', 'System')}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'account' && activeTab !== 'appearance' && (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                <Settings className="w-12 h-12 mb-4" />
                <h3 className="text-lg font-medium">{translate('coming_soon', 'Coming Soon')}</h3>
                <p className="text-sm">{translate('sp_expanding_settings', 'We\'re working on expanding these settings.')}</p>
              </div>
            )}
          </div>
        </div>
      </Motion.div>
    </div>
  );
}
