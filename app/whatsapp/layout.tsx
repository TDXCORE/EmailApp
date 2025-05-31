export default function WhatsAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
} 