interface StepItemProps {
    number: number
    title: string
    description: string
    isLast?: boolean
  }
  
  export function StepItem({ number, title, description, isLast = false }: StepItemProps) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-4 relative">
          <span className="text-xl font-bold text-white">{number}</span>
          {!isLast && (
            <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent top-1/2 left-full hidden md:block"></div>
          )}
        </div>
        <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>
    )
  }
  