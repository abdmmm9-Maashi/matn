import VerifiedBadge from '../components/VerifiedBadge.jsx'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import ReviewBox from '../components/ReviewBox.jsx'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useLang } from '../i18n/LanguageContext.jsx'

const socket = io({ autoConnect: false })

function ExtraPay({ requestId, extra, onPaid }) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState('cash')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const total = Math.round(extra.amount * 1.075 * 100) / 100

  const pay = async () => {
    setBusy(true)
    try {
      const r = await api.payExtra(requestId, extra.id, { method, phone })
      onPaid(r.request)
      setOpen(false)
    } catch {
      alert('تعذّر السداد')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[11px] bg-[#006C35] text-white px-2.5 py-1 rounded-lg font-bold">
        سدّد {total} ر.س
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-2xl p-4 w-full max-w-sm space-y-2" onClick={(e) => e.stopPropagation()}>
        <p className="font-extrabold text-sm text-[#11221A]">سداد العمل الإضافي</p>
        <p className="text-xs text-gray-500">{extra.title} — {extra.amount} + رسوم 7.5% = <b>{total} ر.س</b></p>
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2 border border-[#E3D9BF] rounded-lg text-sm bg-white">
          <option value="cash">كاش</option>
          <option value="card">بطاقة</option>
          <option value="urpay">urpay</option>
          <option value="stcpay">STC Pay</option>
        </select>
        {['urpay', 'stcpay'].includes(method) && (
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="رقم الجوال"
            className="w-full px-3 py-2 border border-[#E3D9BF] rounded-lg text-sm" />
        )}
        <button onClick={pay} disabled={busy} className="btn-primary">{busy ? 'جارٍ…' : 'تأكيد السداد'}</button>
      </div>
    </div>
  )
}

function FinishWork({ requestId, onDone }) {
  const [days, setDays] = useState(3)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const finish = async () => {
    setBusy(true)
    try {
      const updated = await api.complete(requestId, { warranty_days: days })
      onDone(updated)
      setDone(true)
    } catch {
      alert('تعذّر إنهاء العمل')
    } finally {
      setBusy(false)
    }
  }

  if (done) return <p className="mt-3 text-center text-sm font-bold text-[#006C35]">✅ تم إنهاء العمل وإصدار الفواتير</p>

  return (
    <div className="card-lux p-4 mt-3 space-y-2">
      <div className="gold-bar absolute inset-x-0 top-0" />
      <p className="font-extrabold text-sm text-[#11221A] pt-1">🛡️ إنهاء العمل + ضمان</p>
      <label className="text-[11px] text-gray-600">مدة ضمانك على العمل</label>
      <select value={days} onChange={(e) => setDays(Number(e.target.value))}
        className="w-full px-3 py-2 border border-[#E3D9BF] rounded-lg text-sm bg-white">
        <option value={1}>يوم واحد</option>
        <option value={3}>٣ أيام</option>
        <option value={7}>أسبوع</option>
        <option value={30}>شهر</option>
      </select>
      <button onClick={finish} disabled={busy} className="btn-primary">
        {busy ? 'جارٍ…' : 'إنهاء العمل وإصدار الفاتورة'}
      </button>
    </div>
  )
}

function ExtraForm({ requestId, onAdded }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '' })
  const [err, setErr] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      const r = await api.addExtra(requestId, { title: form.title, amount: Number(form.amount) })
      onAdded(r.request)
      setForm({ title: '', amount: '' })
      setOpen(false)
    } catch {
      setErr('تعذّر إضافة العمل')
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-full mt-3 border border-dashed border-[#C9A227] text-[#8a6d13] py-2.5 rounded-xl text-sm font-bold">
        ➕ إضافة عمل إضافي
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="card-lux p-4 mt-3 space-y-2">
      <p className="font-extrabold text-sm text-[#11221A]">عمل إضافي غير متفق عليه</p>
      <input required placeholder="اسم العمل (مثال: تغيير فلتر)" value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full px-3 py-2 border border-[#E3D9BF] rounded-lg text-sm" />
      <input required type="number" min="1" placeholder="السعر (ريال)" value={form.amount}
        onChange={(e) => setForm({ ...form, amount: e.target.value })}
        className="w-full px-3 py-2 border border-[#E3D9BF] rounded-lg text-sm" />
      <p className="text-[10px] text-gray-500">تُحسب عمولة المنصة عليه وتُضاف لفاتورتك القادمة.</p>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        <button className="flex-1 bg-[#006C35] text-white py-2 rounded-lg text-sm font-bold">إضافة</button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-sm border border-gray-200">إلغاء</button>
      </div>
    </form>
  )
}


function DisputeBox({ requestId, isOwner, isExpert }) {
  const [open, setOpen] = useState(false)
  const [existing, setExisting] = useState(null)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isOwner && !isExpert) return
    api.get(`/api/requests/${requestId}/dispute`).then(setExisting).catch(() => {})
  }, [requestId, isOwner, isExpert])

  if (!isOwner && !isExpert) return null

  if (existing?.status === 'open') {
    return (
      <div className="card-lux p-3 mt-3 text-[11px] text-[#8a6d13] bg-[#FBF5E3]">
        📩 عندك شكوى مفتوحة على هذا الطلب — بانتظار قرار الإدارة.
      </div>
    )
  }
  if (existing?.status === 'resolved') {
    return (
      <div className="card-lux p-3 mt-3 text-[11px] text-[#006C35]">
        ✅ تم البت في الشكوى ({existing.outcome === 'refund' ? 'استرجاع' : 'إغلاق'}).
      </div>
    )
  }

  return (
    <div className="card-lux p-3 mt-3">
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-[12px] font-bold text-red-500">⚠️ فتح شكوى / نزاع</button>
      ) : (
        <div className="space-y-2">
          <p className="font-extrabold text-sm text-[#11221A]">⚠️ شكوى على الطلب</p>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الشكوى (مثال: لم يكمل العمل)"
            className="w-full px-3 py-2 border border-[#E3D9BF] rounded-xl text-sm" />
          <textarea rows={2} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="تفاصيل إضافية"
            className="w-full px-3 py-2 border border-[#E3D9BF] rounded-xl text-sm" />
          {msg && <p className="text-[11px] text-red-500">{msg}</p>}
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true); setMsg('')
                try {
                  await api.post(`/api/requests/${requestId}/dispute`, { reason, details })
                  setExisting({ status: 'open' }); setOpen(false)
                } catch (e) { setMsg(e.message === 'reason_required' ? 'اكتب سبب واضح' : 'تعذّر الإرسال') }
                finally { setBusy(false) }
              }}
              className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-bold"
            >
              {busy ? 'جارٍ الإرسال…' : 'إرسال الشكوى'}
            </button>
            <button onClick={() => setOpen(false)} className="px-3 border border-[#E3D9BF] rounded-xl text-xs font-bold">إلغاء</button>
          </div>
        </div>
      )}
    </div>
  )
}

function VisitTracker({ requestId, isExpert, data }) {
  const [msg, setMsg] = useState('')
  const set = async (state) => {
    let lat = null, lng = null
    if (state === 'on_way') {
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }))
        lat = pos.coords.latitude; lng = pos.coords.longitude
      } catch {}
    }
    try {
      await api.post(`/api/requests/${requestId}/visit`, { state, lat, lng })
      setMsg('تم التحديث ✅'); setTimeout(() => setMsg(''), 2000)
    } catch { setMsg('تعذّر التحديث') }
  }
  const stateLabel = {
    on_way: '🚗 الفني في الطريق',
    arrived: '📍 الفني وصل',
    started: '🛠️ بدأ العمل',
  }[data.visit_state]

  if (!isExpert && !stateLabel) return null

  return (
    <div className="card-lux p-3 mt-3">
      {isExpert ? (
        <>
          <p className="text-[12px] font-extrabold text-[#11221A] mb-2">🚗 حالة الوصول</p>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => set('on_way')} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-[#FBF5E3] text-[#8a6d13]">في الطريق</button>
            <button onClick={() => set('arrived')} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-[#EAF4EE] text-[#006C35]">وصلت</button>
            <button onClick={() => set('started')} className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-[#006C35] text-white">بدأت العمل</button>
          </div>
          {msg && <p className="text-[10px] text-[#006C35] mt-1">{msg}</p>}
        </>
      ) : (
        <p className="text-[12px] font-extrabold text-[#006C35]">{stateLabel}</p>
      )}
    </div>
  )
}


function RequestImages({ requestId, images = [], canEdit, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const list = Array.isArray(images) ? images : []
  return (
    <div className="mt-2">
      {list.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {list.map((src) => (
            <a key={src} href={src} target="_blank" rel="noreferrer">
              <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover border border-[#EADFC8]" />
            </a>
          ))}
        </div>
      )}
      {canEdit && list.length < 6 && (
        <label className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#006C35] bg-[#EAF4EE] border border-[#CFE6D8] rounded-lg px-2.5 py-1.5 cursor-pointer">
          {busy ? 'جارٍ الرفع…' : '＋ إضافة صور للمشكلة'}
          <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
            const files = Array.from(e.target.files || []).slice(0, 6 - list.length)
            e.target.value = ''
            if (!files.length) return
            setBusy(true); setErr('')
            try {
              const fd = new FormData()
              files.forEach((f) => fd.append('images', f))
              const res = await fetch(`/api/requests/${requestId}/images`, {
                method: 'POST', headers: { authorization: `Bearer ${localStorage.getItem('authToken')}` }, body: fd,
              })
              const d = await res.json()
              if (!res.ok) throw new Error(d.error)
              onChange && onChange(d.images)
            } catch { setErr('تعذّر رفع الصور') } finally { setBusy(false) }
          }} />
        </label>
      )}
      {err && <p className="text-[10px] text-red-500">{err}</p>}
    </div>
  )
}

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { t, lang } = useLang()

  const [data, setData] = useState(null)
  const [experts, setExperts] = useState([])
  const [error, setError] = useState('')
  const [bid, setBid] = useState({ expertId: '', amount: '', note: '' })
  const [now, setNow] = useState(Date.now())
  const [pay, setPay] = useState({ method: 'cash', phone: '', busy: false, done: false })
  const [fees, setFees] = useState({ customer: 7.5, expert: 7.5 })
  const [myExpert, setMyExpert] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [invoices, setInvoices] = useState(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => setFees({ customer: Number(d.commission_customer) || 0, expert: Number(d.commission_expert) || 0 }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isAuthenticated) api.get('/api/me/expert').then(setMyExpert).catch(() => {})
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && data?.accepted_bid_id) {
      api.get(`/api/requests/${id}/messages`).then(setMessages).catch(() => {})
    }
  }, [isAuthenticated, data?.accepted_bid_id, id])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const [live, setLive] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.request(id)
      setData(res)
    } catch (e) {
