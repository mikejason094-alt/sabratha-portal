import { useTranslation } from 'react-i18next'

export default function Loading() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-500 text-sm">{t('common.loading')}</p>
      </div>
    </div>
  )
}
