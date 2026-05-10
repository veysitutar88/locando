import { getTenant } from '@/shared/tenant/context';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { TenantNotFound } from './_components/tenant-not-found';

export default async function Home() {
  const tenant = await getTenant();
  if (!tenant) return <TenantNotFound />;
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{tenant.name}</CardTitle>
          <CardDescription>slug: {tenant.slug}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-600">
            Tenant resolution works. Locando is live.
          </p>
          <Button disabled fullWidth>
            Book a table — coming soon
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
