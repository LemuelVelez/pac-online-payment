interface SectionHeadingProps {
    title: string
    description?: string
    className?: string
}

export function SectionHeading({ title, description, className = "" }: SectionHeadingProps) {
    return (
        <div className={`text-center mb-8 ${className}`}>
            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            {description && <p className="text-gray-300 mx-auto">{description}</p>}
        </div>
    )
}
