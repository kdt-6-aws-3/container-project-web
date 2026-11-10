import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { clinicApi } from '@/config/ApiService'

const statusText = {
  REQUESTED: '접수 대기',
  CONFIRMED: '예약 확정',
  CANCELLED: '취소',
  COMPLETED: '진료 완료',
}
const statusOptions = [['', '전체 내역'], ['REQUESTED', '접수 대기'], ['CONFIRMED', '예약 확정'], ['COMPLETED', '진료 완료'], ['CANCELLED', '취소']]
const errorText = (error) => error instanceof Error ? error.message : '요청을 처리하지 못했습니다.'
const displayDateTime = (value) => value ? value.replace('T', ' ').slice(0, 16) : '-'

export function AppointmentsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initPetId = searchParams.get('petId') ?? ''

  const [filters, setFilters] = useState({ hospitalId: '', vetId: '', petId: initPetId, status: '' })
  const [applied, setApplied] = useState({ petId: initPetId })
  const [hospitals, setHospitals] = useState([])
  const [vets, setVets] = useState([])
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ content: [], page: 1, totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([clinicApi.listHospitals(), clinicApi.listAllVets()])
      .then(([hospitalList, vetList]) => { setHospitals(hospitalList); setVets(vetList) })
      .catch((e) => setError(errorText(e)))
  }, [])

  useEffect(() => {
    let active = true
    clinicApi.listAppointments(applied, page, 5)
      .then((data) => { if (active) setResult(data) })
      .catch((e) => { if (active) setError(errorText(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [applied, page])

  function search(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    setPage(1)
    setApplied({ ...filters })
  }

  function showStatus(status) {
    setFilters((current) => ({ ...current, status }))
    setError('')
    setLoading(true)
    setPage(1)
    setApplied({ ...filters, status })
  }

  function changePage(nextPage) {
    setError('')
    setLoading(true)
    setPage(nextPage)
  }

  const change = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  const appointments = result.content ?? []

  return <section className="page">
    <div className="page-heading"><div><span className="eyebrow">APPOINTMENTS</span><h1>진료 접수 내역</h1><p>접수 상태와 예약 내역을 조회하고 관리하세요.</p></div><button className="button" onClick={() => navigate('/appointments/new')}>+ 새 예약</button></div>
    <div className="status-quick" aria-label="접수 상태 바로 보기">
      {statusOptions.map(([value, label]) => <button key={value} type="button" className={'status-chip' + (applied.status === value || (!applied.status && !value) ? ' status-chip-active' : '')} aria-pressed={applied.status === value || (!applied.status && !value)} onClick={() => showStatus(value)}>{label}</button>)}
    </div>
    <form className="filter-card" onSubmit={search}>
      <label>병원<select name="hospitalId" value={filters.hospitalId} onChange={change}><option value="">전체</option>{hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}</select></label>
      <label>수의사<select name="vetId" value={filters.vetId} onChange={change}><option value="">전체</option>{vets.map((vet) => <option key={vet.id} value={vet.id}>{vet.name}</option>)}</select></label>
      <label>반려동물 ID<input name="petId" type="number" min="1" value={filters.petId} onChange={change} placeholder="전체" /></label>
      <label>상태<select name="status" value={filters.status} onChange={change}><option value="">전체</option>{Object.entries(statusText).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="button" type="submit">조회</button>
    </form>
    {error && <div className="notice notice-error" role="alert">{error}</div>}
    {!loading && !error && <p className="result-count">조회된 접수 내역 총 {result.totalElements}건</p>}
    {loading ? <p className="empty">불러오는 중...</p> : error ? null : appointments.length === 0 ? <p className="empty">조건에 맞는 접수 내역이 없습니다.</p> :
      <div className="table-wrap"><table><thead><tr><th>접수 번호</th><th>예약 일시</th><th>반려동물</th><th>병원</th><th>수의사</th><th>상태</th><th></th></tr></thead><tbody>
        {appointments.map((appointment) => <tr key={appointment.id}><td>#{appointment.id}</td><td>{displayDateTime(appointment.appointmentAt)}</td><td>{appointment.petName}</td><td>{appointment.hospitalName}</td><td>{appointment.vetName}</td><td>{statusText[appointment.status] || appointment.status}</td><td><button className="text-link" onClick={() => navigate('/appointments/' + appointment.id)}>상세 보기 →</button></td></tr>)}
      </tbody></table></div>}
    {!loading && !error && result.totalPages > 1 && <div className="pagination">
      <button className="button button-secondary" disabled={page <= 1} onClick={() => changePage(page - 1)}>이전</button>
      <span>{result.page} / {result.totalPages} 페이지</span>
      <button className="button button-secondary" disabled={page >= result.totalPages} onClick={() => changePage(page + 1)}>다음</button>
    </div>}
  </section>
}
