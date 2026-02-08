import { CurrentRoute } from '#/app/parallel-routes/_ui/current-route';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export const echoCurrentURL = () => {
  const pathname = usePathname();

  // console.log(52.8, CurrentRoute());
};
