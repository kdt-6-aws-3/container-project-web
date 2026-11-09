import { useCallback, useEffect, useState } from 'react'
import { Appointments, AppointmentDetails, AppointmentForm } from './Appointments'
import { HomePage } from './pages/HomePage'
import { OwnersPage } from './pages/OwnersPage'
import { OwnerDetailPage } from './pages/OwnerDetailPage'
import { OwnerFormPage } from './pages/OwnerFormPage'
import { PetFormPage } from './pages/PetFormPage'
import { VisitFormPage } from './pages/VisitFormPage'
import { VetsPage } from './pages/VetsPage'
import './App.css'

export default function App() {
  useEffect(() => { localStorage.removeItem('petclinic-react-demo-v1') }, [])

  const [screen, setScreen] = useState({ name: 'home', nonce: 0 })
  const go = useCallback((name, params = {}) => {
    setScreen({ name, ...params, nonce: Date.now() + Math.random() })
    window.scrollTo(0, 0)
  }, [])

  const webAvailabilityZone = document.querySelector('meta[name="web-availability-zone"]')?.content
  const webInstanceId = document.querySelector('meta[name="web-instance-id"]')?.content

  const isOwnerScreen = ['owners', 'owner', 'ownerForm', 'petForm', 'visitForm'].includes(screen.name)
  const isAppointmentScreen = ['appointments', 'appointment', 'appointmentForm'].includes(screen.name)

  return (
    <div className="site">
      <header className="site-header">
        <button className="brand" onClick={() => go('home')} aria-label="PetClinic 홈">
          <span>✦</span> PetClinic
        </button>
        <nav aria-label="주 메뉴">
          <button className={screen.name === 'home' ? 'active' : ''} onClick={() => go('home')}>홈</button>
          <button className={isOwnerScreen ? 'active' : ''} onClick={() => go('owners')}>보호자</button>
          <button className={screen.name === 'vets' ? 'active' : ''} onClick={() => go('vets')}>수의사</button>
          <button className={isAppointmentScreen ? 'active' : ''} onClick={() => go('appointments')}>진료 접수</button>
        </nav>
      </header>
      <main key={screen.nonce}>
        {screen.name === 'home' && <HomePage go={go} />}
        {screen.name === 'owners' && <OwnersPage go={go} />}
        {screen.name === 'owner' && <OwnerDetailPage ownerId={screen.ownerId} go={go} />}
        {screen.name === 'ownerForm' && <OwnerFormPage ownerId={screen.ownerId} go={go} />}
        {screen.name === 'petForm' && <PetFormPage ownerId={screen.ownerId} petId={screen.petId} go={go} />}
        {screen.name === 'visitForm' && <VisitFormPage ownerId={screen.ownerId} petId={screen.petId} visitId={screen.visitId} go={go} />}
        {screen.name === 'vets' && <VetsPage />}
        {screen.name === 'appointments' && <Appointments go={go} petId={screen.petId} />}
        {screen.name === 'appointment' && <AppointmentDetails appointmentId={screen.appointmentId} go={go} />}
        {screen.name === 'appointmentForm' && <AppointmentForm appointmentId={screen.appointmentId} ownerId={screen.ownerId} petId={screen.petId} go={go} />}
      </main>
      <footer className="site-footer">
        <span>✦ PetClinic</span>
        <small>
          반려동물과 보호자를 위한 건강 기록
          {webAvailabilityZone && <> · WEB 가용 영역: {webAvailabilityZone}</>}
          {webInstanceId && <> · WEB 인스턴스 ID: {webInstanceId}</>}
        </small>
      </footer>
    </div>
  )
}
