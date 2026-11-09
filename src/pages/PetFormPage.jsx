import { useEffect, useState } from 'react'
import { clinicApi } from '../api'
import { Action } from '../components/Action'
import { Field } from '../components/Field'
import { Notice } from '../components/Notice'
import { errorText, fullName, today } from '../utils'

export function PetFormPage({ ownerId, petId, go }) {
  const editing = Boolean(petId)
  const [owner, setOwner] = useState(null)
  const [types, setTypes] = useState([])
  const [form, setForm] = useState({ name: '', birthDate: '', typeId: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      clinicApi.getOwner(ownerId),
      clinicApi.listPetTypes(),
      editing ? clinicApi.getPet(ownerId, petId) : Promise.resolve(null),
    ])
      .then(([data, petTypes, pet]) => {
        setOwner(data)
        setTypes(petTypes)
        if (pet) setForm({ name: pet.name, birthDate: pet.birthDate || '', typeId: String(pet.type?.id || '') })
      })
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false))
  }, [ownerId, petId, editing])

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await clinicApi.savePet(ownerId, { ...form, typeId: Number(form.typeId) }, petId)
      go('owner', { ownerId })
    }
    catch (e) { setError(errorText(e)) }
    finally { setSaving(false) }
  }

  return (
    <section className="page narrow">
      <button className="back-link" onClick={() => go('owner', { ownerId })}>← 보호자 상세</button>
      <span className="eyebrow">PET</span>
      <h1>{editing ? '반려동물 정보 수정' : '반려동물 등록'}</h1>
      <p className="page-intro">
        보호자: {fullName(owner)}<br />같은 이름의 반려동물도 등록할 수 있습니다.
      </p>
      {error && <Notice tone="error">{error}</Notice>}
      {loading ? (
        <p className="empty">불러오는 중...</p>
      ) : (
        <form className="form-card" onSubmit={submit}>
          <Field label="이름" name="name" value={form.name} onChange={change} maxLength={255} />
          <div className="form-grid">
            <Field label="생일" name="birthDate" value={form.birthDate} onChange={change} type="date" max={today()} />
            <Field label="종류" name="typeId" value={form.typeId} onChange={change}>
              <select name="typeId" value={form.typeId} onChange={change} required>
                <option value="">종류 선택</option>
                {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="form-actions">
            <Action secondary onClick={() => go('owner', { ownerId })}>취소</Action>
            <Action type="submit" disabled={saving}>{saving ? '저장 중...' : editing ? '수정 저장' : '반려동물 등록'}</Action>
          </div>
        </form>
      )}
    </section>
  )
}
