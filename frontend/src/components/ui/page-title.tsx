interface PageTitleProps {
  children: React.ReactNode
  description?: string
}

export function PageTitle({ children, description }: PageTitleProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">
        {children}
      </h1>
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}
