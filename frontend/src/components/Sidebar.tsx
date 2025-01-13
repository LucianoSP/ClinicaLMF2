'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  TableCellsIcon,
  CloudIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const navigation = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon
  },
  {
    name: 'Pacientes',
    href: '/pacientes',
    icon: UserGroupIcon
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
    name: 'Storage',
    href: '/storage',
    icon: CloudIcon
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
    <div className="flex flex-col w-64 sidebar-bg min-h-screen shadow-lg">
      <div className="flex flex-col flex-grow pt-6">
        <div className="flex flex-col items-center justify-center flex-shrink-0 px-4 mb-8 space-y-1">
          <h1 className="text-xl font-semibold text-white text-center">
            Sistema de Controle
          </h1>
          <h2 className="text-lg text-white/80 text-center">
            Faturamento
          </h2>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-4 py-2.5 text-[15px] font-medium rounded-lg transition-all duration-200 ${isActive
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-white' : 'text-white/80'
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
