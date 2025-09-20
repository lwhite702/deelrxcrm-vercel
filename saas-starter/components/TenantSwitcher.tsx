'use client';

import useSWR, { mutate } from 'swr';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TenantSwitcher() {
  const { data } = useSWR('/api/tenant/list', fetcher);
  const [isPending, startTransition] = useTransition();

  async function switchTenant(id: string) {
    await fetch('/api/tenant/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: id })
    });
    startTransition(() => {
      mutate('/api/tenant/kpis');
    });
  }

  if (!data?.length) return null;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Tenant
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Switch tenant</TooltipContent>
      </Tooltip>
      <DropdownMenuContent>
        {data.map((t: any) => (
          <DropdownMenuItem key={t.id} onClick={() => switchTenant(t.id)}>
            {t.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
