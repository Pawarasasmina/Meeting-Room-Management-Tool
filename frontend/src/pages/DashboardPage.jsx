import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/date';

const statusBadge = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-200 text-slate-700'
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    roomId: '',
    title: '',
    description: '',
    attendees: 2,
    startTime: '',
    endTime: ''
  });

  const fetchData = async () => {
    const [roomsRes, reservationRes, notificationRes] = await Promise.all([
      api.get('/rooms'),
      api.get('/reservations'),
      api.get('/notifications')
    ]);

    setRooms(roomsRes.data);
    setReservations(reservationRes.data);
    setNotifications(notificationRes.data);

    if (roomsRes.data.length && !form.roomId) {
      setForm((prev) => ({ ...prev, roomId: roomsRes.data[0]._id }));
    }
  };

  useEffect(() => {
    fetchData().catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'));
  }, []);

  const checkSlots = async () => {
    if (!form.roomId || !form.startTime) return;
    const date = form.startTime.slice(0, 10);
    const { data } = await api.get(`/reservations/availability?roomId=${form.roomId}&date=${date}`);
    setAvailability(data);
  };

  const createReservation = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/reservations', form);
      await fetchData();
      await checkSlots();
      setForm((prev) => ({ ...prev, title: '', description: '', attendees: 2, startTime: '', endTime: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Reservation failed');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed');
    }
  };

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.isRead).length, [notifications]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    await fetchData();
  };

  return (
    <main className="mx-auto grid max-w-6xl gap-4 p-4 md:grid-cols-3">
      <section className="rounded bg-white p-4 shadow md:col-span-2">
        <h2 className="text-xl font-semibold">Create Reservation</h2>
        <p className="text-sm text-slate-500">Book the single room for office 200M.</p>
        <form onSubmit={createReservation} className="mt-4 grid gap-3 md:grid-cols-2">
          <select className="rounded border p-2" value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })}>
            {rooms.map((room) => <option key={room._id} value={room._id}>{room.name} (capacity {room.capacity})</option>)}
          </select>
          <input className="rounded border p-2" placeholder="Meeting title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="rounded border p-2" type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} onBlur={checkSlots} />
          <input className="rounded border p-2" type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          <input className="rounded border p-2" type="number" min="1" placeholder="Attendees" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: Number(e.target.value) })} />
          <input className="rounded border p-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="rounded bg-blue-600 p-2 text-white hover:bg-blue-500 md:col-span-2">Submit Reservation</button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <h3 className="mt-6 font-semibold">Your {user.role === 'admin' ? 'Team' : ''} Reservations</h3>
        <div className="mt-3 space-y-2">
          {reservations.map((reservation) => (
            <article key={reservation._id} className="rounded border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{reservation.title}</p>
                  <p className="text-xs text-slate-500">{reservation.room?.name} • {formatDateTime(reservation.startTime)} - {formatDateTime(reservation.endTime)}</p>
                  {reservation.user?.name && <p className="text-xs text-slate-500">Requested by: {reservation.user.name}</p>}
                </div>
                <span className={`rounded px-2 py-1 text-xs ${statusBadge[reservation.status]}`}>{reservation.status}</span>
              </div>
              {user.role === 'admin' && reservation.status === 'pending' && (
                <div className="mt-2 flex gap-2 text-xs">
                  <button onClick={() => updateStatus(reservation._id, 'approved')} className="rounded bg-emerald-600 px-2 py-1 text-white">Approve</button>
                  <button onClick={() => updateStatus(reservation._id, 'rejected')} className="rounded bg-red-600 px-2 py-1 text-white">Reject</button>
                </div>
              )}
            </article>
          ))}
          {!reservations.length && <p className="text-sm text-slate-500">No reservations yet.</p>}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded bg-white p-4 shadow">
          <h3 className="font-semibold">Availability (30-min slots)</h3>
          <div className="mt-2 max-h-56 space-y-1 overflow-auto text-xs">
            {availability.map((slot) => (
              <p key={slot.startTime} className={slot.available ? 'text-emerald-700' : 'text-red-700'}>
                {formatDateTime(slot.startTime)} - {formatDateTime(slot.endTime)}: {slot.available ? 'Available' : 'Busy'}
              </p>
            ))}
            {!availability.length && <p className="text-slate-500">Select start date/time to load slots.</p>}
          </div>
        </section>

        <section className="rounded bg-white p-4 shadow">
          <h3 className="font-semibold">Notifications ({unreadCount} unread)</h3>
          <div className="mt-2 space-y-2 text-sm">
            {notifications.map((notification) => (
              <div key={notification._id} className="rounded border p-2">
                <p>{notification.message}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(notification.createdAt)}</p>
                {!notification.isRead && <button className="mt-1 text-xs text-blue-600" onClick={() => markRead(notification._id)}>Mark as read</button>}
              </div>
            ))}
            {!notifications.length && <p className="text-slate-500">No notifications.</p>}
          </div>
        </section>
      </aside>
    </main>
  );
};

export default DashboardPage;
