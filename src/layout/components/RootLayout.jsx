import { useEffect } from 'react'
import { Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import '../styles/app.css'

export function RootLayout() {
  useEffect(() => { localStorage.removeItem('petclinic-react-demo-v1') }, [])

  const navigate = useNavigate()
  const location = useLocation()

  const webAvailabilityZone = document.querySelector('meta[name="web-availability-zone"]')?.content
  const webInstanceId = document.querySelector('meta[name="web-instance-id"]')?.content

  const isOwnerScreen = location.pathname.startsWith('/owners')
  const isAppointmentScreen = location.pathname.startsWith('/appointments')

  return (
    <div className="site">
      <ScrollRestoration />
      <header className="site-header">
        <button className="brand" onClick={() => navigate('/')} aria-label="PetClinic 홈">
          <span>✦</span> PetClinic
        </button>
        <nav aria-label="주 메뉴">
          <button className={location.pathname === '/' ? 'active' : ''} onClick={() => navigate('/')}>홈</button>
          <button className={isOwnerScreen ? 'active' : ''} onClick={() => navigate('/owners')}>보호자</button>
          <button className={location.pathname === '/vets' ? 'active' : ''} onClick={() => navigate('/vets')}>수의사</button>
          <button className={isAppointmentScreen ? 'active' : ''} onClick={() => navigate('/appointments')}>진료 접수</button>
        </nav>
      </header>
      <main>
        <Outlet />
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
