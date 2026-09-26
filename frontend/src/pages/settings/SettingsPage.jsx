import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Lock, Bell, Palette, Database } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'preferences', label: 'Preferences', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

const ProfileTab = () => {
  const { user, reload } = useAuth();
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { first_name: user?.first_name, last_name: user?.last_name, currency: user?.currency || 'ETB' }
  });

  const onSubmit = async (data) => {
    try { setErr(''); await authAPI.updateProfile(data); setMsg('Profile updated'); reload(); }
    catch (e) { setErr(e.response?.data?.message || 'Failed'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {msg && <Alert type="success" message={msg} dismissible />}
      {err && <Alert type="error" message={err} />}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {user?.first_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{user?.first_name} {user?.last_name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">First Name</label><input className="input" {...register('first_name')} /></div>
        <div><label className="label">Last Name</label><input className="input" {...register('last_name')} /></div>
      </div>
      <div>
        <label className="label">Default Currency</label>
        <select className="input" {...register('currency')}>
          {['ETB', 'USD', 'EUR', 'GBP', 'KES', 'UGX'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Timezone</label>
        <select className="input" {...register('timezone')}>
          {['Africa/Addis_Ababa', 'Africa/Nairobi', 'UTC', 'Europe/London', 'America/New_York'].map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>
      <Button type="submit" loading={isSubmitting}>Save Profile</Button>
    </form>
  );
};

const PasswordTab = () => {
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      setErr('');
      await authAPI.changePassword({ current_password: data.current_password, new_password: data.new_password });
      setMsg('Password changed successfully');
      reset();
    } catch (e) { setErr(e.response?.data?.message || 'Failed'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
      {msg && <Alert type="success" message={msg} dismissible />}
      {err && <Alert type="error" message={err} />}
      <div>
        <label className="label">Current Password</label>
        <input type="password" className="input" {...register('current_password', { required: 'Required' })} />
      </div>
      <div>
        <label className="label">New Password</label>
        <input type="password" className="input" {...register('new_password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
        {errors.new_password && <p className="text-xs text-red-500 mt-1">{errors.new_password.message}</p>}
      </div>
      <Button type="submit" loading={isSubmitting}>Change Password</Button>
    </form>
  );
};

const AppearanceTab = () => {
  const { theme, toggle } = useTheme();
  return (
    <div className="space-y-4">
      <div>
        <p className="label mb-3">Color Theme</p>
        <div className="flex gap-3">
          {['light', 'dark'].map(t => (
            <button key={t} onClick={() => t !== theme && toggle()}
              className={`flex-1 max-w-32 py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === t ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className={`w-8 h-8 rounded-full ${t === 'light' ? 'bg-yellow-400' : 'bg-gray-700'}`} />
              <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">{t}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabContent = {
    profile: <ProfileTab />,
    password: <PasswordTab />,
    preferences: <div className="text-sm text-gray-500">Notification preferences coming soon.</div>,
    appearance: <AppearanceTab />,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab nav */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === t.id ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <Card className="flex-1">
          <CardHeader>
            <h2 className="section-title">{TABS.find(t => t.id === activeTab)?.label}</h2>
          </CardHeader>
          <CardBody>{tabContent[activeTab]}</CardBody>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
