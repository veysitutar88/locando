import { getTenant } from '@/shared/tenant/context';
import { TenantNotFound } from './_components/tenant-not-found';

export default async function Home() {
  const tenant = await getTenant();
  if (!tenant) return <TenantNotFound />;
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-2">{tenant.name}</h1>
        <p className="text-zinc-600">slug: {tenant.slug}</p>
        <p className="text-zinc-500 text-sm mt-2">
          Tenant resolution works. Locando is live.
        </p>
      </div>
    </main>
  );
}
