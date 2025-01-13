interface PageTitleProps {
  children: React.ReactNode
  description?: string
}

export function PageTitle({ children, description }: PageTitleProps) {
  return (
    <div className="space-y-1.5">
      <h1 className="page-title">{children}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}
