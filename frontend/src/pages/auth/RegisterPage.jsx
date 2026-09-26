import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';

const RegisterPage = () => {
  const { register: regCtx } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      setError('');
      await regCtx({ email: data.email, password: data.password, first_name: data.first_name, last_name: data.last_name });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500 rounded-2xl mb-4">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-1 text-sm">Start managing your finances today</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input className={`input ${errors.first_name ? 'border-red-400' : ''}`}
                  placeholder="Abebe"
                  {...register('first_name', { required: 'Required' })} />
                {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className={`input ${errors.last_name ? 'border-red-400' : ''}`}
                  placeholder="Girma"
                  {...register('last_name', { required: 'Required' })} />
                {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name.message}</p>}
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <input type="email" className={`input ${errors.email ? 'border-red-400' : ''}`}
                placeholder="you@example.com"
                {...register('email', { required: 'Email required' })} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" className={`input ${errors.password ? 'border-red-400' : ''}`}
                placeholder="Min. 8 characters with uppercase & number"
                {...register('password', {
                  required: 'Password required',
                  minLength: { value: 8, message: 'Min 8 characters' },
                  pattern: { value: /(?=.*[A-Z])(?=.*\d)/, message: 'Must contain uppercase letter and number' },
                })} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input type="password" className={`input ${errors.confirm ? 'border-red-400' : ''}`}
                placeholder="••••••••"
                {...register('confirm', {
                  required: 'Please confirm password',
                  validate: (v) => v === watch('password') || 'Passwords do not match',
                })} />
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}
            </div>

            <Button type="submit" loading={isSubmitting} className="w-full justify-center py-2.5 mt-2">
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
