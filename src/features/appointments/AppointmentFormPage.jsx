import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { clinicApi } from '@/config/ApiService'

const isClosed = (status) => status === 'CANCELLED' || status === 'COMPLETED'
const errorText = (error) => error instanceof Error ? error.message : '요청을 처리하지 못했습니다.'
const localDateTime = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-') + 'T' + [String(date.getHours()).padStart(2, '0'), String(date.getMinutes()).padStart(2, '0')].join(':')
const appointmentFields = (value) => {
  const date = value.slice(0, 10)
  const hour = Number(value.slice(11, 13))
  const minute = value.slice(14, 16)
  if (hour !== 0) return { appointmentDate: date, appointmentHour: String(hour), appointmentMinute: minute }
  const previousDay = new Date(date + 'T12:00:00')
  previousDay.setDate(previousDay.getDate() - 1)
  return { appointmentDate: localDateTime(previousDay).slice(0, 10), appointmentHour: '24', appointmentMinute: minute }
}
const nextCalendarDate = (value) => {
  const nextDay = new Date(value + 'T12:00:00')
  nextDay.setDate(nextDay.getDate() + 1)
  return localDateTime(nextDay).slice(0, 10)
}

export function AppointmentFormPage() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initOwnerId = searchParams.get('ownerId') ?? ''
  const initPetId = searchParams.get('petId') ?? ''

  const editing = Boolean(appointmentId)
  const [minimumDate] = useState(() => localDateTime(new Date()).slice(0, 10))
  const [form, setForm] = useState({ hospitalId: '', petId: initPetId, vetId: '', appointmentDate: '', appointmentHour: '', appointmentMinute: '', reason: '' })
  const [appointment, setAppointment] = useState(null)
  const [hospitals, setHospitals] = useState([])
  const [vets, setVets] = useState([])
  const [pets, setPets] = useState([])
  const [owners, setOwners] = useState([])
  const [ownerQuery, setOwnerQuery] = useState('')
  const [selectedOwnerId, setSelectedOwnerId] = useState(initOwnerId)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [vetSchedule, setVetSchedule] = useState([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [scheduleRetryKey, setScheduleRetryKey] = useState(0)
  const scheduleDate = form.appointmentDate ? (form.appointmentHour === '24' ? nextCalendarDate(form.appointmentDate) : form.appointmentDate) : ''
  const bookedTimes = vetSchedule
    .filter((item) => item.status !== 'CANCELLED' && String(item.id) !== String(appointmentId))
    .map((item) => item.appointmentAt.slice(11, 16))
  const selectedTime = form.appointmentHour && form.appointmentMinute
    ? String(form.appointmentHour === '24' ? 0 : Number(form.appointmentHour)).padStart(2, '0') + ':' + form.appointmentMinute
    : ''

  useEffect(() => {
    Promise.all([clinicApi.listHospitals(), editing ? clinicApi.getAppointment(appointmentId) : Promise.resolve(null)])
      .then(([hospitalList, current]) => {
        setHospitals(hospitalList)
        if (current) {
          setAppointment(current)
          setScheduleLoading(true)
          setForm({
            hospitalId: String(current.hospitalId),
            petId: String(current.petId),
            vetId: String(current.vetId),
            ...appointmentFields(current.appointmentAt),
            reason: current.reason || '',
          })
        }
      })
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false))
  }, [appointmentId, editing])

  useEffect(() => {
    if (!selectedOwnerId) return
    let active = true
    clinicApi.getOwner(selectedOwnerId)
      .then((owner) => {
        if (!active) return
        setOwners((current) => current.some((item) => String(item.id) === String(owner.id)) ? current : [owner, ...current])
        setPets(owner.pets || [])
      })
      .catch((e) => { if (active) setError(errorText(e)) })
    return () => { active = false }
  }, [selectedOwnerId])

  useEffect(() => {
    if (!form.hospitalId) return
    let active = true
    clinicApi.listHospitalVets(form.hospitalId)
      .then((data) => { if (active) setVets(data) })
      .catch((e) => { if (active) setError(errorText(e)) })
    return () => { active = false }
  }, [form.hospitalId])

  useEffect(() => {
    if (!form.vetId || !scheduleDate) return
    let active = true
    clinicApi.listVetAppointments(form.vetId, scheduleDate)
      .then((data) => { if (active) setVetSchedule(data) })
      .catch((e) => { if (active) setScheduleError(errorText(e)) })
      .finally(() => { if (active) setScheduleLoading(false) })
    return () => { active = false }
  }, [form.vetId, scheduleDate, scheduleRetryKey])

  async function searchOwners(event) {
    event.preventDefault()
    setSearching(true); setError('')
    try {
      const result = await clinicApi.listOwners(ownerQuery.trim(), 1, 100)
      setOwners(result.content || [])
      setSelectedOwnerId('')
      setPets([])
      setForm((current) => ({ ...current, petId: '' }))
    } catch (e) { setError(errorText(e)) }
    finally { setSearching(false) }
  }

  function selectOwner(event) {
    const nextOwnerId = event.target.value
    setSelectedOwnerId(nextOwnerId)
    setPets([])
    setForm((current) => ({ ...current, petId: '' }))
  }

  function change(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value, ...(name === 'hospitalId' ? { vetId: '' } : {}) }))
    if (name === 'hospitalId') { setVets([]); setError('') }
    if (['hospitalId', 'vetId', 'appointmentDate'].includes(name) || (name === 'appointmentHour' && (value === '24') !== (form.appointmentHour === '24'))) {
      setVetSchedule([])
      setScheduleError('')
      setScheduleLoading(true)
    }
  }

  async function submit(event) {
    event.preventDefault()
    const hour = Number(form.appointmentHour)
    const minute = Number(form.appointmentMinute)
    if (!form.appointmentDate || !form.appointmentHour || !form.appointmentMinute || hour < 1 || hour > 24 || ![0, 30].includes(minute)) {
      setError('예약 시간은 정각 또는 30분으로 선택하세요.')
      return
    }
    const selectedTime = new Date(form.appointmentDate + 'T00:00:00')
    selectedTime.setDate(selectedTime.getDate() + (hour === 24 ? 1 : 0))
    selectedTime.setHours(hour === 24 ? 0 : hour, minute, 0, 0)
    if (!Number.isFinite(selectedTime.getTime())) { setError('예약 날짜를 다시 선택하세요.'); return }
    if (selectedTime.getTime() + 30 * 60_000 <= Date.now()) {
      setError('현재 진행 중이거나 이후인 30분 예약 시간을 선택하세요.')
      return
    }
    setSaving(true); setError('')
    try {
      const saved = await clinicApi.saveAppointment({
        hospitalId: Number(form.hospitalId),
        petId: Number(form.petId),
        vetId: Number(form.vetId),
        appointmentAt: localDateTime(selectedTime) + ':00',
        reason: form.reason,
      }, appointmentId)
      navigate('/appointments/' + saved.id)
    } catch (e) { setError(e.status === 409 ? '같은 시간대에 다른 예약이 먼저 잡혔습니다. 접수 내역을 확인하고 다른 시간을 선택하세요.' : errorText(e)) }
    finally { setSaving(false) }
  }

  const back = () => navigate(editing ? '/appointments/' + appointmentId : '/appointments')
  if (loading) return <section className="page narrow"><p className="empty">불러오는 중...</p></section>

  return <section className="page narrow">
    <button className="back-link" onClick={back}>← 돌아가기</button>
    <span className="eyebrow">APPOINTMENT</span><h1>{editing ? '예약 변경' : '새 진료 예약'}</h1>
    <p className="page-intro">병원과 해당 병원 소속 수의사, 반려동물, 예약 일시를 선택하세요.</p>
    {error && <div className="notice notice-error" role="alert">{error}</div>}
    {appointment && isClosed(appointment.status) ? <p className="empty">취소되거나 완료된 예약은 변경할 수 없습니다.</p> : <>
      <form className="owner-search-card" onSubmit={searchOwners}>
        <label htmlFor="appointment-owner-search">보호자 이름으로 반려동물 찾기</label>
        <div className="search-row"><input id="appointment-owner-search" value={ownerQuery} onChange={(event) => setOwnerQuery(event.target.value)} placeholder="이름을 입력하거나 비워 두고 조회" /><button className="button button-secondary" type="submit" disabled={searching}>보호자 조회</button></div>
        <label className="field">보호자<select value={selectedOwnerId} onChange={selectOwner}><option value="">선택하세요</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name} (ID {owner.id})</option>)}</select></label>
      </form>
      <form className="form-card" onSubmit={submit}>
        <label className="field">병원<select name="hospitalId" value={form.hospitalId} onChange={change} required><option value="">병원 선택</option>{hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}</select></label>
        <div className="form-grid">
          <label className="field">반려동물<select name="petId" value={form.petId} onChange={change} required><option value="">반려동물 선택</option>{form.petId && !pets.some((pet) => String(pet.id) === form.petId) && <option value={form.petId}>{appointment?.petName || '선택된 반려동물'} (ID {form.petId})</option>}{pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name} (ID {pet.id})</option>)}</select></label>
          <label className="field">수의사<select name="vetId" value={form.vetId} onChange={change} required disabled={!form.hospitalId}><option value="">수의사 선택</option>{vets.map((vet) => <option key={vet.id} value={vet.id}>{vet.name}</option>)}</select></label>
        </div>
        <div className="appointment-time-grid">
          <label className="field">예약 날짜<input name="appointmentDate" type="date" value={form.appointmentDate} onChange={change} min={minimumDate} required /></label>
          <label className="field">시<select name="appointmentHour" value={form.appointmentHour} onChange={change} required><option value="">시 선택</option>{Array.from({ length: 24 }, (_, index) => index + 1).map((hourOption) => <option key={hourOption} value={hourOption}>{hourOption}시</option>)}</select></label>
          <label className="field">분<select name="appointmentMinute" value={form.appointmentMinute} onChange={change} required><option value="">분 선택</option><option value="00">00분</option><option value="30">30분</option></select></label>
        </div>
        <p className="field-hint">30분 단위로 접수할 수 있습니다. 24시는 선택한 날짜의 다음 날 00시대로 저장됩니다.</p>
        {form.vetId && scheduleDate && <div className="vet-schedule" aria-live="polite">
          <strong>수의사 예약 현황 · {scheduleDate}</strong>
          {scheduleLoading ? <p>예약 현황을 불러오는 중...</p> : scheduleError ? <p className="schedule-error">{scheduleError} <button className="text-link" type="button" onClick={() => { setScheduleError(''); setScheduleLoading(true); setScheduleRetryKey((value) => value + 1) }}>다시 불러오기</button></p> : bookedTimes.length ? <p>이미 예약된 시간: {[...new Set(bookedTimes)].sort().join(', ')}</p> : <p>해당 날짜에 잡힌 예약이 없습니다.</p>}
          {!scheduleLoading && !scheduleError && selectedTime && bookedTimes.includes(selectedTime) && <small className="schedule-error">선택한 시간은 이미 예약되어 있습니다. 다른 시간을 선택하세요.</small>}
        </div>}
        <label className="field">진료 사유 (선택)<textarea name="reason" value={form.reason} onChange={change} maxLength={255} rows="4" /></label>
        <div className="form-actions"><button className="button button-secondary" type="button" onClick={back}>취소</button><button className="button" type="submit" disabled={saving}>{saving ? '저장 중...' : editing ? '변경 저장' : '예약 신청'}</button></div>
      </form>
    </>}
  </section>
}
