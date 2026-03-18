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
        'inline-flex w-full items-center gap-2 rounded-xl bg-transparent p-0',
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
        'flex-1 inline-flex items-center justify-center whitespace-nowrap px-4 py-2.5',
        'text-sm font-semibold transition-all cursor-pointer',
        'text-gray-400 border-b-2 border-transparent',
        'hover:text-gray-700 hover:border-gray-300',
        'data-[state=active]:text-blue-600 data-[state=active]:border-blue-600',
        'focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
