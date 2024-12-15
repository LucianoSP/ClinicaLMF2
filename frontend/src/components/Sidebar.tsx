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

const navigation = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon
  },
  {
    name: 'Fichas de Presença',
    href: '/fichas-presenca',
    icon: DocumentTextIcon
  },
  {
    name: 'Execuções',
    href: '/excel',
    icon: TableCellsIcon
  },
  {
    name: 'Auditoria',
    href: '/auditoria',
    icon: ChartBarIcon
  }
];

export function Sidebar() {
  const pathname = usePathname();

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
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-[#8f732b] text-white'
                    : 'text-white/90 hover:bg-[#8f732b]/50'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-6 w-6 ${
                    isActive ? 'text-white' : 'text-white/90'
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
