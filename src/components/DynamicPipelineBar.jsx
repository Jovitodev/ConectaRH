export default function DynamicPipelineBar({ totalSteps, currentStep, steps = [], compact = false }) {
  const segments = Array.from({ length: totalSteps }, (_, i) => ({
    isCompleted: i < currentStep,
    isCurrent: i === currentStep,
    isPending: i > currentStep,
  }))

  const currentStepName = steps[currentStep] || ''
  const total = steps.length || totalSteps

  return (
    <div className="w-full">
      <div className="flex w-full items-stretch gap-1">
        {segments.map((seg, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-500 ${
              seg.isCompleted
                ? 'bg-emerald-500'
                : seg.isCurrent
                  ? 'bg-primary'
                  : 'bg-slate-200 dark:bg-muted'
            }`}
            title={steps[i] || `Etapa ${i + 1}`}
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-medium text-primary">
          Etapa {Math.min(currentStep + 1, total)} de {total}
          {currentStepName && <span className="text-muted-foreground">: {currentStepName}</span>}
        </span>
        {!compact && (
          <span className="flex items-center gap-2 text-muted-foreground">
            {segments.filter((s) => s.isCompleted).length} concluídas ·{' '}
            {segments.filter((s) => s.isPending).length} pendentes
          </span>
        )}
      </div>
    </div>
  )
}
