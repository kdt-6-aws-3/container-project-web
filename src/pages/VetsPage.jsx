import { useEffect, useState } from 'react'
import { clinicApi } from '../api'
import { Action } from '../components/Action'
import { Notice } from '../components/Notice'
import { errorText, fullName } from '../utils'

export function VetsPage() {
  const [result, setResult] = useState({ content: [], page: 1, totalElements: 0, totalPages: 0 })
  const [hospitals, setHospitals] = useState([])
  const [hospitalId, setHospitalId] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    clinicApi.listHospitals()
      .then(setHospitals)
      .catch((e) => setError(errorText(e)))
  }, [])

  useEffect(() => {
    let active = true
    const load = hospitalId ? clinicApi.listHospitalVets(hospitalId) : clinicApi.listVets(page)
    load
      .then((data) => {
        if (active) setResult(hospitalId
          ? { content: data, page: 1, totalElements: data.length, totalPages: 1 }
          : data)
      })
      .catch((e) => { if (active) setError(errorText(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [hospitalId, page])

  const vets = result.content ?? []
  return (
    <section className="page">
      <span className="eyebrow">VETERINARIANS</span>
      <h1>수의사 안내</h1>
      <p className="page-intro">PetClinic 수의사와 전문 분야를 확인하세요.</p>
      <label className="field">
        <span>병원</span>
        <select
          value={hospitalId}
          onChange={(e) => { setHospitalId(e.target.value); setPage(1); setError(''); setLoading(true) }}
        >
          <option value="">전체 병원</option>
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
          ))}
        </select>
      </label>
      {error && <Notice tone="error">{error}</Notice>}
      {loading ? (
        <p className="empty">불러오는 중...</p>
      ) : error ? null : vets.length === 0 ? (
        <p className="empty">등록된 수의사가 없습니다.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>수의사</th><th>병원</th><th>전문 분야</th></tr></thead>
            <tbody>
              {vets.map((vet) => (
                <tr key={vet.id}>
                  <td><strong>{fullName(vet)}</strong></td>
                  <td>{vet.hospital?.name || '미지정'}</td>
                  <td>{vet.specialties?.length ? vet.specialties.map((s) => s.name).join(', ') : '일반 진료'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!hospitalId && !loading && !error && result.totalPages > 1 && (
        <div className="pagination">
          <Action secondary disabled={page <= 1} onClick={() => { setPage(page - 1); setLoading(true) }}>이전</Action>
          <span>{result.page} / {result.totalPages} 페이지 · 총 {result.totalElements}명</span>
          <Action secondary disabled={page >= result.totalPages} onClick={() => { setPage(page + 1); setLoading(true) }}>다음</Action>
        </div>
      )}
    </section>
  )
}
