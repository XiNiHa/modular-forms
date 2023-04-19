import { useRouteData, Outlet } from 'solid-start';
import { createServerData$ } from 'solid-start/server';
import { Header, Footer } from '~/components';
import { Framework, FrameworkProvider, frameworks } from '~/contexts';
import { frameworkCookie } from '~/cookies';

export function routeData() {
  return {
    getCookie: createServerData$<Framework>(async (_, { request }) => {
      const framework = await frameworkCookie.parse(
        request.headers.get('Cookie')
      );
      return frameworks.includes(framework) ? framework : 'solid';
    }),
  };
}

export default function Layout() {
  // Use route data
  const { getCookie } = useRouteData<typeof routeData>();

  return (
    <FrameworkProvider cookie={getCookie()!}>
      <Header />
      <Outlet />
      <Footer />
    </FrameworkProvider>
  );
}
