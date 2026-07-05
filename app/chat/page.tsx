"use client"
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth');
      else setUser(user);
    });

    fetchMessages();

    const channel = supabase
      .channel('realtime-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: user.id, // Sementara kirim ke diri sendiri/publik global room sebelum setup friend list
      message: newMessage,
    });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white" style={{ fontFamily: 'sans-serif' }}>
      <div className="p-4 bg-blue-600 text-white font-bold text-lg flex justify-between">
        <span>💬 Room Chat EditDeek</span>
        <button onClick={() => router.push('/')} className="text-sm bg-blue-700 px-3 py-1 rounded">Kembali ke Feed</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-xl max-w-xs text-sm ${isMe ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'}`}>
                {msg.message}
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
        <input type="text" placeholder="Tulis pesan..." className="flex-1 p-2 border rounded-xl text-sm" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold">Kirim</button>
      </form>
    </div>
  );
}
