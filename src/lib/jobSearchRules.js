export function jobAreas(job, areaCatalog = []) {
  return job.areas?.length ? job.areas : [areaCatalog.find((area) => area.id === job.sector)?.label].filter(Boolean)
}

export function enrollmentStatus(job, today = new Date().toISOString().slice(0, 10)) {
  if (job.applicationStart && today < job.applicationStart) return 'futura'
  if (job.applicationEnd && today > job.applicationEnd) return 'encerrada'
  return 'aberta'
}

export function matchesJobFilters(job, { search = '', location = '', state = '', city = '', model = 'all', areas = [], salaryMin = null, salaryMax = null }, areaCatalog = []) {
  const query = search.trim().toLowerCase()
  if (query && !`${job.title} ${job.company}`.toLowerCase().includes(query)) return false
  if (location.trim() && !job.location.toLowerCase().includes(location.trim().toLowerCase())) return false
  if (state && !job.location.toLowerCase().endsWith(`, ${state.toLowerCase()}`)) return false
  if (city && !job.location.toLowerCase().startsWith(`${city.toLowerCase()},`)) return false
  if (model !== 'all' && job.model !== model) return false
  if (areas.length && !areas.some((area) => jobAreas(job, areaCatalog).includes(area))) return false
  if (salaryMin !== null && (!Number.isFinite(job.salaryMax) || job.salaryMax < salaryMin)) return false
  if (salaryMax !== null && (!Number.isFinite(job.salaryMin) || job.salaryMin > salaryMax)) return false
  return true
}
