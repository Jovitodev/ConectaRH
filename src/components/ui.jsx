export function SectorBadge({ sectorId, sectors }) {
  const sector = sectors.find((s) => s.id === sectorId)
  if (!sector) return null
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${sector.color}`}
    >
      {sector.label}
    </span>
  )
}

export function ModelBadge({ model }) {
  const styles = {
    Presencial: 'bg-slate-100 text-slate-700 border-slate-200',
    Híbrido: 'bg-sky-50 text-sky-800 border-sky-200',
    Remoto: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${styles[model] || styles.Presencial}`}
    >
      {model}
    </span>
  )
}

export function SectionTitle({ title, subtitle, icon: Icon }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {Icon && (
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
      <div>
        <h2 className="font-poppins text-xl font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}
