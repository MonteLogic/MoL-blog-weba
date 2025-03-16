import { SummarySelection } from '#/ui/summary-selection';
import { auth } from '@clerk/nextjs';
import { tursoClient } from '#/db/index';
import { routes } from '#/db/schema';
import { eq } from 'drizzle-orm';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
type JsonObject = { [Key: string]: JsonValue };

export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { orgId } = auth();
  const currentDate = new Date().toISOString().split('T')[0];
  const initSelectedDate = (searchParams.date as string) || currentDate;
  const initSelectedRoute = searchParams.route as string;

  const db = tursoClient();
  const uniqueRoutes = await db
    .select()
    .from(routes)
    .where(eq(routes.organizationID, orgId ?? ''));

  const formattedRoutes: [string, string, JsonObject][] = uniqueRoutes.map(
    (route: any) => [
      route.routeIDFromPostOffice,
      route.routeNiceName,
      route.allocatedShifts
        ? (JSON.parse(route.allocatedShifts) as JsonObject)
        : ({} as JsonObject),
    ],
  );

  // Check if both date and route are present in the URL params
  const shouldPerformInitialSearch =
    typeof searchParams.date === 'string' &&
    typeof searchParams.route === 'string';

  return (
    <div className="space-y-4">
      <div className="text-gray-200/100">
        <h2 className="text-xl font-medium">Summary Page</h2>
      </div>
      <SummarySelection
        //@ts-ignore
        initRoutes={formattedRoutes}
        initSelectedDate={initSelectedDate}
        initSelectedRoute={initSelectedRoute}
        shouldPerformInitialSearch={shouldPerformInitialSearch}
      />
    </div>
  );
}
