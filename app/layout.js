import './globals.css'

export const metadata = {
  title: 'File Converter Pro | Transform Your Data',
  description: 'Convert between CSV, Excel, JSON, HTML, Markdown, XML and more with our powerful, beautiful converter tool.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
