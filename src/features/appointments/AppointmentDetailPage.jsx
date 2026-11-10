import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { clinicApi } from '@/config/ApiService'

const statusText = {
  REQUESTED: '접수 대기',
  CONFIRMED: '예약 확정',
  CANCELLED: '취소',
  COMPLETED: '진료 완료',
}
const isClosed = (status) => status === 'CANCELLED' || status === 'COMPLETED'
const errorText = (error) => error instanceof Error ? error.message : '요청을 처리하지 못했습니다.'
const displayDateTime = (value) => value ? value.replace('T', ' ').slice(0, 16) : '-'

export function AppointmentDetailPage() {
  const { appointmentId } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    clinicApi.getAppointment(appointmentId)
      .then(setAppointment)
      .catch((e) => setError(errorText(e)))
      .finally(() => setLoading(false))
  }, [appointmentId])

  async function changeStatus(status) {
    if ((status === 'CANCELLED' || status === 'COMPLETED') &&
      !window.confirm(status === 'CANCELLED' ? '예약을 취소할까요? 취소 후에는 상태를 바꿀 수 없습니다.' : '진료를 완료 처리할까요? 완료 후에는 상태를 바꿀 수 없습니다.')) return
    setBusy(true); setError('')
    try { setAppointment(await clinicApi.updateAppointmentStatus(appointmentId, status)) }
    catch (e) { setError(errorText(e)) }
    finally { setBusy(false) }
  }

  async function remove() {
    if (!window.confirm('이 예약을 영구 삭제할까요? 기록을 남기려면 예약 취소를 사용하세요.')) return
    setBusy(true); setError('')
    try { await clinicApi.deleteAppointment(appointmentId); navigate('/appointments') }
    catch (e) { setError(errorText(e)); setBusy(false) }
  }

  if (loading) return <section className="page"><p className="empty">불러오는 중...</p></section>
  if (!appointment) return <section className="page"><div className="notice notice-error" role="alert">{error || '예약을 찾을 수 없습니다.'}</div></section>

  return <section className="page narrow">
    <button className="back-link" onClick={() => navigate('/appointments')}>← 접수 내역</button>
    <span className="eyebrow">APPOINTMENT</span><h1>진료 접수 상세</h1>
    {error && <div className="notice notice-error" role="alert">{error}</div>}
    <div className="detail-card">
      <div><small>접수 번호</small><strong>#{appointment.id}</strong></div>
      <div><small>상태</small><strong>{statusText[appointment.status] || appointment.status}</strong></div>
      <div><small>예약 일시</small><strong>{displayDateTime(appointment.appointmentAt)}</strong></div>
      <div><small>반려동물</small><strong>{appointment.petName} (ID {appointment.petId})</strong></div>
      <div><small>병원</small><strong>{appointment.hospitalName}</strong></div>
      <div><small>수의사</small><strong>{appointment.vetName}</strong></div>
      <div><small>진료 사유</small><strong>{appointment.reason || '-'}</strong></div>
      <div><small>신청 일시</small><strong>{displayDateTime(appointment.createdAt)}</strong></div>
    </div>
    <div className="inline-actions appointment-actions">
      {!isClosed(appointment.status) && <>
        <button className="button button-secondary" disabled={busy} onClick={() => navigate('/appointments/' + appointmentId + '/edit')}>예약 변경</button>
        {appointment.status === 'REQUESTED' && <button className="button" disabled={busy} onClick={() => changeStatus('CONFIRMED')}>예약 확정</button>}
        {appointment.status === 'CONFIRMED' && <button className="button" disabled={busy} onClick={() => changeStatus('COMPLETED')}>진료 완료</button>}
        <button className="button button-secondary" disabled={busy} onClick={() => changeStatus('CANCELLED')}>예약 취소</button>
      </>}
      <button className="button button-secondary danger" disabled={busy} onClick={remove}>예약 삭제</button>
    </div>
  </section>
}
