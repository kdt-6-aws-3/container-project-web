import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { clinicApi } from '@/config/ApiService'
import { Action } from '@/shared/components/Action'
import { Notice } from '@/shared/components/Notice'
import { errorText, fullName } from '@/shared/utils/format'

export function OwnersPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ content: [], page: 1, totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    clinicApi.listOwners(filter, page, 5)
      .then((data) => {
        if (!active) return
        if (filter && data.totalElements === 1 && data.content.length === 1) {
          navigate('/owners/' + data.content[0].id)
          return
        }
        setResult(data)
      })
      .catch((e) => { if (active) setError(errorText(e)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filter, page, navigate])

  function search(e) {
    e.preventDefault()
    const nextFilter = query.trim()
    if (nextFilter === filter && page === 1) return
    setLoading(true)
    setError('')
    setPage(1)
    setFilter(nextFilter)
  }

  function changePage(nextPage) {
    setLoading(true)
    setError('')
    setPage(nextPage)
  }

  const owners = result.content ?? []
  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OWNERS</span>
          <h1>보호자 찾기</h1>
          <p>이름으로 검색하거나 전체 보호자 목록을 확인하세요.</p>
        </div>
        <Action onClick={() => navigate('/owners/new')}>+ 새 보호자</Action>
      </div>
      <form className="search-row" onSubmit={search}>
        <label htmlFor="owner-search" className="sr-only">보호자 이름</label>
        <input
          id="owner-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="보호자 이름을 입력하세요"
        />
        <Action type="submit">검색</Action>
      </form>
      {error && <Notice tone="error">{error}</Notice>}
      {loading ? (
        <p className="empty">불러오는 중...</p>
      ) : error ? null : owners.length === 0 ? (
        <p className="empty">검색 결과가 없습니다.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>보호자</th><th>주소</th><th>전화번호</th><th></th></tr></thead>
            <tbody>
              {owners.map((owner) => (
                <tr key={owner.id}>
                  <td><strong>{fullName(owner)}</strong></td>
                  <td>{owner.address}</td>
                  <td>{owner.phone}</td>
                  <td>
                    <button className="text-link" onClick={() => navigate('/owners/' + owner.id)}>
                      상세 보기 →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && !error && result.totalPages > 1 && (
        <div className="pagination">
          <Action secondary disabled={page <= 1} onClick={() => changePage(page - 1)}>이전</Action>
          <span>{result.page} / {result.totalPages} 페이지 · 총 {result.totalElements}명</span>
          <Action secondary disabled={page >= result.totalPages} onClick={() => changePage(page + 1)}>다음</Action>
        </div>
      )}
    </section>
  )
}
