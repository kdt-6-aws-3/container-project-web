import { useNavigate } from 'react-router'
import { Action } from '@/shared/components/Action'

export function HomePage() {
  const navigate = useNavigate()

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">PETCLINIC · CARE RECORD</span>
          <h1>반려동물의 오늘을<br /><em>더 건강하게.</em></h1>
          <p>보호자와 반려동물 정보, 진료 기록을 한곳에서 확인하고 관리하세요.</p>
          <div className="hero-actions">
            <Action onClick={() => navigate('/owners')}>보호자 찾기 →</Action>
            <Action secondary onClick={() => navigate('/owners/new')}>새 보호자 등록</Action>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span>🐾</span><strong>PetClinic</strong><small>함께하는 건강 기록</small>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <span className="eyebrow">QUICK ACCESS</span>
          <h2>무엇을 도와드릴까요?</h2>
        </div>
        <div className="feature-grid">
          <button className="feature-card" onClick={() => navigate('/owners')}>
            <span>🔎</span><strong>보호자 검색</strong><small>보호자와 반려동물 기록 찾기</small><b>바로가기 →</b>
          </button>
          <button className="feature-card" onClick={() => navigate('/owners/new')}>
            <span>✍️</span><strong>보호자 등록</strong><small>새 보호자 정보 입력하기</small><b>바로가기 →</b>
          </button>
          <button className="feature-card" onClick={() => navigate('/vets')}>
            <span>🩺</span><strong>수의사 안내</strong><small>수의사와 전문 분야 확인하기</small><b>바로가기 →</b>
          </button>
          <button className="feature-card" onClick={() => navigate('/appointments')}>
            <span>📅</span><strong>진료 접수 내역</strong><small>접수 현황 조회와 신규 예약 신청</small><b>바로가기 →</b>
          </button>
        </div>
      </section>
    </>
  )
}
