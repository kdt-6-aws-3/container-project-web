import { useEffect, useState } from 'react'
import { clinicApi } from '../api'
import { Action } from '../components/Action'
import { Notice } from '../components/Notice'
import { errorText, today } from '../utils'

export function VisitFormPage({ ownerId, petId, visitId, go }) {
  const editing = Boolean(visitId)
  const [pet, setPet] = useState(null)
  const [form, setForm] = useState({ date: today(), description: '', prescription: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      clinicApi.getPet(ownerId, petId),
      editing ? clinicApi.listVisits(ownerId, petId) : Promise.resolve([]),
    ])
      .then(([data, visits]) => {
        setPet(data)
        if (editing) {
          const visit = visits.find((item) => String(item.id) === String(visitId))
          if (!visit) throw new Error('진료 기록을 찾을 수 없습니다.')
          setForm({ date: visit.date, description: visit.description, prescription: visit.prescription || '' })
        }
      })
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false))
  }, [ownerId, petId, visitId, editing])

  async function submit(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await clinicApi.saveVisit(ownerId, petId, form, visitId)
      go('owner', { ownerId })
    }
    catch (e) { setError(errorText(e)) }
    finally { setSaving(false) }
  }

  return (
    <section className="page narrow">
      <button className="back-link" onClick={() => go('owner', { ownerId })}>← 보호자 상세</button>
      <span className="eyebrow">VISIT</span>
      <h1>{editing ? '진료 기록 수정' : '진료 기록 추가'}</h1>
      <p className="page-intro">반려동물: {pet?.name}</p>
      {error && <Notice tone="error">{error}</Notice>}
      {loading ? (
        <p className="empty">불러오는 중...</p>
      ) : (
        <form className="form-card" onSubmit={submit}>
          <label className="field">
            <span>진료 날짜</span>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              max={today()}
            />
          </label>
          <label className="field">
            <span>진료 내용</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              maxLength={255}
              rows="5"
              placeholder="진료 내용을 입력하세요"
            />
          </label>
          <label className="field">
            <span>처방 내역 (선택)</span>
            <textarea
              value={form.prescription}
              onChange={(e) => setForm({ ...form, prescription: e.target.value })}
              maxLength={255}
              rows="3"
              placeholder="처방이 없으면 비워 두세요"
            />
          </label>
          <div className="form-actions">
            <Action secondary onClick={() => go('owner', { ownerId })}>취소</Action>
            <Action type="submit" disabled={saving}>{saving ? '저장 중...' : editing ? '수정 저장' : '진료 기록 저장'}</Action>
          </div>
        </form>
      )}
    </section>
  )
}
