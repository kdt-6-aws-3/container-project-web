import { useEffect, useState } from 'react'
import { clinicApi } from '../api'
import { Action } from '../components/Action'
import { Field } from '../components/Field'
import { Notice } from '../components/Notice'
import { errorText } from '../utils'

export function OwnerFormPage({ ownerId, go }) {
  const editing = Boolean(ownerId)
  const [form, setForm] = useState({ name: '', address: '', phone: '' })
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editing) return
    clinicApi.getOwner(ownerId)
      .then((data) => setForm({ name: data.name, address: data.address, phone: data.phone }))
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false))
  }, [editing, ownerId])

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    if (!/^\d{2,3}-\d{3,4}-\d{4}$/.test(form.phone)) {
      setError('전화번호는 010-1234-5678 형식으로 입력하세요.')
      return
    }
    setSaving(true); setError('')
    try {
      const saved = await clinicApi.saveOwner(form, ownerId)
      go('owner', { ownerId: saved.id })
    }
    catch (e) { setError(errorText(e)) }
    finally { setSaving(false) }
  }

  const back = () => go(editing ? 'owner' : 'owners', editing ? { ownerId } : {})

  return (
    <section className="page narrow">
      <button className="back-link" onClick={back}>← 돌아가기</button>
      <span className="eyebrow">OWNER</span>
      <h1>{editing ? '보호자 정보 수정' : '새 보호자 등록'}</h1>
      <p className="page-intro">보호자의 기본 정보를 입력해 주세요.</p>
      {error && <Notice tone="error">{error}</Notice>}
      {loading ? (
        <p className="empty">불러오는 중...</p>
      ) : (
        <form className="form-card" onSubmit={submit}>
          <Field label="이름" name="name" value={form.name} onChange={change} maxLength={255} />
          <Field label="주소" name="address" value={form.address} onChange={change} maxLength={255} />
          <Field label="전화번호 (예: 010-1234-5678)" name="phone" value={form.phone} onChange={change} type="tel" maxLength={13} />
          <div className="form-actions">
            <Action secondary onClick={back}>취소</Action>
            <Action type="submit" disabled={saving}>{saving ? '저장 중...' : editing ? '수정 저장' : '보호자 등록'}</Action>
          </div>
        </form>
      )}
    </section>
  )
}
