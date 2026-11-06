import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'

export default function Company() {
  const navigate = useNavigate()
  const [info, setInfo] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/api/company/me').then(setInfo).catch((e) => setError(e.message === 'not_company' ? 'هذا الحساب ليس حساب مؤسسة' : 'تعذّر التحميل'))
    api.get('/api/company/workers').then(setData).catch(() => {})
  }, [])

  if (error) {
    return (
      <div className="px-4 py-10 text-center text-sm text-red-500">
        {error}
      </div>
    )
  }

  if (!info) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">جارٍ التحميل…</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-sm md:max-w-3xl mx-auto pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">←</button>
        <h1 className="font-semibold text-gray-900">لوحة المؤسسة</h1>
      </div>

      <div className="px-4 py-5 space-y-4">
        <div className="card-lux p-4">
          <div className="gold-bar absolute inset-x-0 top-0" />
          <p className="font-extrabold text-[#11221A] pt-1">{info.name}</p>
          <p className="text-[11px] text-gray-500 mt-1">{info.phone || '—'} · {info.email || '—'}</p>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#FBF5E3] border border-[#EADFC8] px-3 py-2">
            <div>
              <p className="text-[10px] text-[#8a6d13] font-bold">كود الانضمام</p>
              <p className="text-2xl font-extrabold text-[#11221A] tracking-widest" dir="ltr">{info.code}</p>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(String(info.code))}
              className="text-[11px] font-bold text-[#006C35] bg-[#E9F5EE] border border-[#CDE9D8] px-3 py-1.5 rounded-lg"
            >
              نسخ
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
            أعطِ هذا الكود لفنيينك — يكتبونه وقت التسجيل، وينزلون تلقائيًا في قائمتك.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900 text-sm">عمال المؤسسة</h2>
            <span className="text-xs text-gray-500">{data?.count ?? 0}</span>
          </div>

          {data?.workers?.length ? (
            <div className="space-y-2">
              {data.workers.map((w) => (
                <div key={w.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                  <img
                    src={w.image || '/experts/ac.jpg'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#11221A] text-sm truncate">{w.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {w.job} · ★ {Number(w.rating || 0).toFixed(1)} ({w.reviews_count || 0})
                      {w.city ? ` · ${w.city}` : ''}
                    </p>
                    <p className="text-[10px] text-gray-400" dir="ltr">{w.phone || '—'}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      w.verify_status === 'approved'
                        ? 'bg-[#E9F5EE] text-[#006C35]'
                        : w.verify_status === 'rejected'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-[#FBF5E3] text-[#8a6d13]'
                    }`}
                  >
                    {w.verify_status === 'approved' ? 'موثّق' : w.verify_status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 text-center border border-gray-100">
              <p className="text-sm text-gray-500">ما فيه عمال بعد.</p>
              <p className="text-[11px] text-gray-400 mt-1">شارك كود الانضمام {info.code} مع فنيينك.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
