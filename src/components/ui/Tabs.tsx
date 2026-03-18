import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../utils/cn';
import type { ComponentPropsWithoutRef } from 'react';

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex w-full items-center gap-1 rounded-xl bg-gray-100 p-1.5',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2.5',
        'text-sm font-semibold text-gray-500 transition-all',
        'hover:text-gray-700 hover:bg-gray-50',
        'data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-blue-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
