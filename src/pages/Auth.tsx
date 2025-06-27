import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type AuthFormData = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema)
  });

  const onSubmit = async (data: AuthFormData) => {
    console.log('on submit')
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email: data.email, password: data.password });
      if (error) alert(error.message);
      else alert('Signup successful! Check your email.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (error) alert(error.message);
      else alert('Login successful!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Task Dashboard</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full border p-2 rounded"
              {...register('email')}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full border p-2 rounded"
              {...register('password')}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              onClick={() => setMode('signup')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
            >
              Sign Up
            </button>
            <button
              type="submit"
              onClick={() => setMode('login')}
              className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
