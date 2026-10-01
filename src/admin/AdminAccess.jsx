import React, { useEffect, useState } from 'react';
import { AlertTriangle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { getAdminSession, signInAdmin } from '../services/adminApi';

export default function AdminAccess({ onAuthenticated, onExit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    getAdminSession().then((session) => {
      if (!active) return;
      setChecking(false);
      if (session.isAdmin) onAuthenticated(session);
    });
    return () => { active = false; };
  }, [onAuthenticated]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const session = await signInAdmin(email.trim(), password);
      onAuthenticated(session);
    } catch (signInError) {
      setError(signInError?.message || 'Đăng nhập admin thất bại.');
    } finally {
      setBusy(false);
    }
  };

  if (checking) return <div className="admin-access"><div className="admin-access__card"><span className="admin-access__eyebrow">CONTROL ROOM / SECURE CHECK</span><h1>Đang kiểm tra quyền truy cập…</h1></div></div>;

  return <div className="admin-access"><div className="admin-access__card"><div className="admin-access__brand"><span><LockKeyhole size={18} /></span><div><strong>LIDS HD CONTROL ROOM</strong><small>Admin access only</small></div></div><span className="admin-access__eyebrow">Protected by Supabase Auth + RLS</span><h1>Đăng nhập khu vực quản trị</h1><p>Quản lý catalog mũ, menu, collection, đơn hàng và cấu hình cửa hàng từ một workspace thống nhất.</p>{error && <div className="admin-access__error"><AlertTriangle size={15} />{error}</div>}<form onSubmit={handleSubmit}><label><span>Email quản trị</span><div><Mail size={15} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="admin@example.com" /></div></label><label><span>Mật khẩu</span><div><LockKeyhole size={15} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="••••••••" /></div></label><button disabled={busy} type="submit"><ShieldCheck size={15} />{busy ? 'Đang xác thực…' : 'Đăng nhập admin'}</button></form><button type="button" className="admin-access__back" onClick={onExit}>← Quay lại storefront</button></div></div>;
}
