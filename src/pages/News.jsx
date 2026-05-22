import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { useData } from '../hooks/useData'
import { newsService } from '../services/dataService'
import { getCategoryColor, getCategoryLabel } from '../utils/helpers'
import Loading from '../components/Loading'

export default function News() {
  const { t } = useTranslation()
  const { lang } = useApp()
  const isAr = lang === 'ar'
  const { data: articles, loading } = useData(() => newsService.getAll())
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  if (loading) return <Loading />

  const categories = ['all', ...new Set(articles?.map((a) => a.category) || [])]
  const filtered = filter === 'all' ? (articles || []) : (articles || []).filter((a) => a.category === filter)

  return (
    <div>
      <h1 className="page-title">{t('news.title')}</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm text-gray-500 font-medium self-center">{t('news.categories')}:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filter === cat ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {cat === 'all' ? t('news.all') : isAr && cat === 'announcement' ? 'إعلانات' : cat === 'announcement' ? 'Announcements'
            : isAr && cat === 'event' ? 'فعاليات' : cat === 'event' ? 'Events' : cat}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((article) => {
            const isExpanded = expanded === article.id
            const catLabel = getCategoryLabel(article.category)
            return (
              <div key={article.id} className="card">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {article.category === 'event' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      )}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs ${getCategoryColor(article.category)}`}>
                        {isAr ? catLabel.ar : catLabel.en}
                      </span>
                      <span className="text-xs text-gray-400">{article.date}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{isAr ? article.titleAr : article.titleEn}</h3>
                    <p className="text-sm text-gray-600">
                      {isExpanded ? (isAr ? article.contentAr : article.contentEn) : (isAr ? article.summaryAr : article.summaryEn)}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400">{article.author}</span>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : article.id)}
                        className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                        {isExpanded ? t('common.close') : t('news.readMore')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-400">{t('news.noNews')}</p>
        </div>
      )}
    </div>
  )
}
