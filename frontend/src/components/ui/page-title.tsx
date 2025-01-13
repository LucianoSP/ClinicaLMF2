interface PageTitleProps {
  children: React.ReactNode
  description?: string
}

export function PageTitle({ children, description }: PageTitleProps) {
  return (
    <div>
      <h1>{children}</h1>
      {description && (
        <p className="text-sm text-muted-foreground content-padding">
          {description}
        </p>
      )}
    </div>
  )
}
