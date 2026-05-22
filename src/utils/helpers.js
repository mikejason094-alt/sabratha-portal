export function getGradeColor(grade) {
  if (!grade) return 'text-gray-400'
  const num = parseFloat(grade)
  if (num >= 3.7) return 'text-green-600'
  if (num >= 3.0) return 'text-blue-600'
  if (num >= 2.0) return 'text-yellow-600'
  return 'text-red-600'
}

export function getLetterGradeColor(grade) {
  if (!grade) return 'text-gray-400'
  if (grade.startsWith('A')) return 'text-green-600 bg-green-50'
  if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50'
  if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
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
  const graded = courses.filter((c) => c.points != null)
  if (graded.length === 0) return 0
  const total = graded.reduce((sum, c) => sum + c.points * c.credits, 0)
  const credits = graded.reduce((sum, c) => sum + c.credits, 0)
  return credits > 0 ? (total / credits).toFixed(2) : 0
}
