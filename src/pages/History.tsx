export default function History() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1
          className="mb-2 font-bold"
          style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-h1)' }}
        >
          Historial
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body)' }}>
          Resultados semanales
        </p>
      </div>
    </div>
  )
}
