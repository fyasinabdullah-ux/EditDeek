export const metadata = {
  title: 'EditDeek',
  description: 'Welcome to EditDeek',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
