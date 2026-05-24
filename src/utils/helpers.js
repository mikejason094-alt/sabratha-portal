export function getScoreColor(score) {
  if (score == null) return 'text-zinc-600'
  if (score >= 90) return 'text-green-400 bg-green-500/10'
  if (score >= 80) return 'text-blue-400 bg-blue-500/10'
  if (score >= 70) return 'text-yellow-400 bg-yellow-500/10'
  return 'text-red-400 bg-red-500/10'
}

export function getGradeColor(grade) {
  if (!grade) return 'text-zinc-500'
  const num = parseFloat(grade)
  if (num >= 90) return 'text-green-400'
  if (num >= 80) return 'text-blue-400'
  if (num >= 70) return 'text-yellow-400'
  return 'text-red-400'
}

export function getStatusColor(status) {
  switch (status) {
    case 'completed': return 'badge-success'
    case 'in-progress': return 'badge-warning'
    case 'upcoming': return 'badge-info'
    default: return 'badge-info'
  }
}

export function getStatusLabel(status) {
  switch (status) {
    case 'completed': return { en: 'Completed', ar: 'مكتمل' }
    case 'in-progress': return { en: 'In Progress', ar: 'جاري' }
    case 'upcoming': return { en: 'Upcoming', ar: 'قادم' }
    default: return { en: status, ar: status }
  }
}

export function getCategoryColor(category) {
  switch (category) {
    case 'announcement': return 'badge-info'
    case 'event': return 'badge-warning'
    default: return 'badge-info'
  }
}

export function getCategoryLabel(category) {
  switch (category) {
    case 'announcement': return { en: 'Announcement', ar: 'إعلان' }
    case 'event': return { en: 'Event', ar: 'فعالية' }
    default: return { en: category, ar: category }
  }
}

export function calculateGpa(courses) {
  if (!courses || courses.length === 0) return 0
  const graded = courses.filter((c) => c.score != null)
  if (graded.length === 0) return 0
  const total = graded.reduce((sum, c) => sum + c.score * c.credits, 0)
  const credits = graded.reduce((sum, c) => sum + c.credits, 0)
  return credits > 0 ? Math.round((total / credits) * 100) / 100 : 0
}
