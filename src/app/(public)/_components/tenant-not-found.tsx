export function TenantNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Restaurant not found</h1>
        <p className="text-zinc-600 mb-1">
          The address you entered doesn&apos;t match any restaurant on Locando.
        </p>
        <p className="text-zinc-500 text-sm">
          Diese Adresse gehört zu keinem Restaurant auf Locando.
        </p>
      </div>
    </main>
  );
}
