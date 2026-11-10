import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { clinicApi } from '@/config/ApiService'
import { Action } from '@/shared/components/Action'
import { Notice } from '@/shared/components/Notice'
import { errorText, fullName } from '@/shared/utils/format'

function PetVisits({ ownerId, petId, busy, onDelete }) {
  const navigate = useNavigate()
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true
    clinicApi.listVisits(ownerId, petId)
      .then((data) => {
        if (active) setVisits([...data].sort((a, b) => b.date.localeCompare(a.date)))
      })
      .catch((e) => { if (active) setError(errorText(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [ownerId, petId, retryKey])

  return (
    <div className="visits">
      <h4>진료 기록 {!loading && !error && <small>{visits.length}건</small>}</h4>
      {loading ? (
        <p>진료 기록을 불러오는 중...</p>
      ) : error ? (
        <div className="notice notice-error" role="alert">
          {error}{' '}
          <button className="text-link" onClick={() => { setError(''); setLoading(true); setRetryKey((v) => v + 1) }}>
            다시 불러오기
          </button>
        </div>
      ) : visits.length ? (
        visits.map((visit) => (
          <article className="visit-entry" key={visit.id}>
            <div className="visit-entry-head">
              <time dateTime={visit.date}>{visit.date}</time>
              <div className="row-actions">
                <button className="text-link" onClick={() => navigate('/owners/' + ownerId + '/pets/' + petId + '/visits/' + visit.id + '/edit')}>수정</button>
                <button className="text-link danger" disabled={busy} onClick={() => onDelete(visit.id)}>삭제</button>
              </div>
            </div>
            <div className="visit-entry-body">
              <div><small>진료 내용</small><p>{visit.description}</p></div>
              <div><small>처방 약품</small><p>{visit.prescription || '처방 없음'}</p></div>
            </div>
          </article>
        ))
      ) : (
        <p>아직 진료 기록이 없습니다.</p>
      )}
    </div>
  )
}

export function OwnerDetailPage() {
  const { ownerId } = useParams()
  const navigate = useNavigate()
  const [owner, setOwner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [visitsRefreshKey, setVisitsRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    clinicApi.getOwner(ownerId)
      .then((data) => { if (active) setOwner(data) })
      .catch((e) => { if (active) setError(errorText(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [ownerId])

  const removeOwner = useCallback(async () => {
    if (!window.confirm('보호자를 삭제하면 반려동물, 방문 기록, 진료 예약도 함께 삭제됩니다. 계속할까요?')) return
    setBusy(true); setError('')
    try { await clinicApi.deleteOwner(ownerId); navigate('/owners') }
    catch (e) { setError(errorText(e)); setBusy(false) }
  }, [ownerId, navigate])

  const removeRelated = useCallback(async (message, action) => {
    if (!window.confirm(message)) return
    setBusy(true); setError('')
    try {
      await action()
      setOwner(await clinicApi.getOwner(ownerId))
      setVisitsRefreshKey((v) => v + 1)
    }
    catch (e) { setError(errorText(e)) }
    finally { setBusy(false) }
  }, [ownerId])

  if (loading) return <p className="empty">불러오는 중...</p>
  if (error && !owner) return <section className="page"><Notice tone="error">{error}</Notice></section>

  return (
    <section className="page">
      <button className="back-link" onClick={() => navigate('/owners')}>← 보호자 목록</button>
      <div className="page-heading">
        <div>
          <span className="eyebrow">OWNER PROFILE</span>
          <h1>{fullName(owner)}</h1>
          <p>보호자 정보와 반려동물의 진료 기록</p>
        </div>
        <div className="inline-actions">
          <Action secondary onClick={() => navigate('/owners/' + ownerId + '/edit')}>정보 수정</Action>
          <Action secondary disabled={busy} onClick={removeOwner}>보호자 삭제</Action>
        </div>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="info-card">
        <div><small>이름</small><strong>{owner.name}</strong></div>
        <div><small>주소</small><strong>{owner.address}</strong></div>
        <div><small>전화번호</small><strong>{owner.phone}</strong></div>
      </div>
      <div className="section-heading inline">
        <div><span className="eyebrow">PETS & VISITS</span><h2>반려동물과 진료 기록</h2></div>
        <Action onClick={() => navigate('/owners/' + ownerId + '/pets/new')}>+ 반려동물 등록</Action>
      </div>
      {owner.pets?.length ? (
        <div className="pet-grid">
          {owner.pets.map((pet) => (
            <article className="pet-card" key={pet.id}>
              <div className="pet-heading">
                <span className="pet-icon">🐶</span>
                <div>
                  <h3>{pet.name}</h3>
                  <p>{pet.type?.name || '종류 미등록'} · {pet.birthDate || '생일 미등록'}</p>
                </div>
              </div>
              <div className="pet-actions">
                <button className="text-link" onClick={() => navigate('/owners/' + ownerId + '/pets/' + pet.id + '/edit')}>정보 수정</button>
                <button className="text-link" onClick={() => navigate('/owners/' + ownerId + '/pets/' + pet.id + '/visits/new')}>+ 진료 기록</button>
                <button className="text-link" onClick={() => navigate('/appointments/new?ownerId=' + ownerId + '&petId=' + pet.id)}>+ 진료 예약</button>
                <button className="text-link" onClick={() => navigate('/appointments?petId=' + pet.id)}>접수 내역</button>
                <button className="text-link danger" disabled={busy}
                  onClick={() => removeRelated(
                    '반려동물을 삭제하면 진료 기록과 진료 예약도 함께 삭제됩니다. 계속할까요?',
                    () => clinicApi.deletePet(ownerId, pet.id)
                  )}>
                  반려동물 삭제
                </button>
              </div>
              <PetVisits
                key={`${pet.id}-${visitsRefreshKey}`}
                ownerId={ownerId}
                petId={pet.id}
                busy={busy}
                onDelete={(visitId) => removeRelated(
                  '이 진료 기록을 삭제할까요?',
                  () => clinicApi.deleteVisit(ownerId, pet.id, visitId)
                )}
              />
            </article>
          ))}
        </div>
      ) : (
        <p className="empty">등록된 반려동물이 없습니다.</p>
      )}
    </section>
  )
}
