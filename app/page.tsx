"use client"
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth');
      else setUser(user);
    });
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username, full_name), likes(user_id), comments(*, profiles(username))')
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    let mediaUrl = '';

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data } = await supabase.storage.from('media').upload(fileName, file);
      if (data) {
        mediaUrl = supabase.storage.from('media').getPublicUrl(fileName).data.publicUrl;
      }
    }

    await supabase.from('posts').insert({ user_id: user.id, content, media_url: mediaUrl });
    setContent('');
    setFile(null);
    fetchPosts();
  };

  const handleLike = async (postId: number) => {
    if (!user) return;
    const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
    if (error) {
      await supabase.from('likes').delete().match({ user_id: user.id, post_id: postId });
    }
    fetchPosts();
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user || user.id === targetUserId) return;
    const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
    if (error) {
      await supabase.from('follows').delete().match({ follower_id: user.id, following_id: targetUserId });
    }
    fetchPosts();
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-10" style={{ fontFamily: 'sans-serif' }}>
      <nav className="bg-white shadow sticky top-0 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-black text-blue-600">EditDeek</h1>
        <div className="flex gap-4 text-sm font-semibold">
          <button onClick={() => router.push('/chat')} className="text-blue-600">Messages 💬</button>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))} className="text-red-500">Logout 🚪</button>
        </div>
      </nav>

      <div className="max-w-xl mx-auto p-4 mt-4">
        <form onSubmit={handlePost} className="bg-white p-4 rounded-xl shadow mb-6 border">
          <textarea className="w-full p-2 border rounded-lg text-sm" placeholder="Berbagi sesuatu hari ini Deek?" value={content} onChange={(e) => setContent(e.target.value)} required />
          <div className="flex justify-between items-center mt-3 pt-2 border-t">
            <input type="file" accept="image/*,video/*" className="text-xs" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button type="submit" className="bg-blue-600 text-white px-5 py-1.5 rounded-lg font-bold text-sm">Post</button>
          </div>
        </form>

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-4 rounded-xl shadow border">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="font-bold">{post.profiles?.full_name || 'User'}</div>
                  <div className="text-xs text-gray-400">@{post.profiles?.username}</div>
                </div>
                {user && user.id !== post.user_id && (
                  <button onClick={() => handleFollow(post.user_id)} className="text-xs bg-gray-100 text-blue-600 font-bold px-3 py-1 rounded-full border">Follow/Unfollow</button>
                )}
              </div>
              <p className="text-sm mb-3">{post.content}</p>
              {post.media_url && (
                <div className="mb-3 rounded-lg overflow-hidden bg-black">
                  {post.media_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                    <video src={post.media_url} controls className="w-full max-h-80" />
                  ) : (
                    <img src={post.media_url} alt="Media" className="w-full max-h-80 object-cover" />
                  )}
                </div>
              )}
              <div className="flex gap-6 text-gray-500 text-xs font-semibold border-y py-2">
                <button onClick={() => handleLike(post.id)} className="hover:text-blue-600">👍 Like ({post.likes?.length || 0})</button>
                <span>💬 {post.comments?.length || 0} Komentar</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
                    }
