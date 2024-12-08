'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

const navigation = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon
  },
  {
    name: 'Atendimentos',
    href: '/atendimentos',
    icon: DocumentTextIcon
  },
  {
    name: 'Excel',
    href: '/excel',
    icon: TableCellsIcon
  },
  {
    name: 'Auditoria',
    href: '/auditoria',
    icon: DocumentTextIcon
  },
  {
    name: 'Raiz',
    href: '/raiz',
    icon: HomeIcon
  }
];

export function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col w-64 sidebar-bg min-h-screen">
        <div className="flex flex-col flex-grow pt-5">
          <div className="flex items-center justify-center flex-shrink-0 px-4 mb-5">
            <Image
              src="/icones/logo.png"
              alt="Clínica Larissa Logo"
              width={150}
              height={150}
              className="w-auto h-auto"
              priority
            />
          </div>
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <div
                key={item.name}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white/90"
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-6 w-6 text-white/90"
                  aria-hidden="true"
                />
                {item.name}
              </div>
            ))}
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-64 sidebar-bg min-h-screen">
      <div className="flex flex-col flex-grow pt-5">
        <div className="flex items-center justify-center flex-shrink-0 px-4 mb-5">
          <Image
            src="/icones/logo.png"
            alt="Clínica Larissa Logo"
            width={150}
            height={150}
            className="w-auto h-auto"
            priority
          />
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                  ? 'bg-[#877347] text-white font-semibold'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 ${isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
                    }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
