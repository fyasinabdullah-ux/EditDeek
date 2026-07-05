"use client"
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: username,
          full_name: fullName,
        });
        setMessage('Registrasi sukses! Silakan login.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        router.push('/');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4" style={{ fontFamily: 'sans-serif' }}>
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-blue-600 text-center mb-6">EditDeek</h1>
        {message && <div className="mb-4 text-sm p-3 bg-blue-50 text-blue-700 rounded-lg">{message}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <input type="text" placeholder="Nama Lengkap" className="w-full p-3 border rounded-lg" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              <input type="text" placeholder="Username" className="w-full p-3 border rounded-lg" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </>
          )}
          <input type="email" placeholder="Email" className="w-full p-3 border rounded-lg" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full p-3 border rounded-lg" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold">
            {loading ? 'Sabar Deek...' : isSignUp ? 'Daftar' : 'Masuk'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 font-bold">
            {isSignUp ? 'Sudah punya akun? Login' : 'Belum punya akun? Daftar baru'}
          </button>
        </div>
      </div>
    </div>
  );
}
