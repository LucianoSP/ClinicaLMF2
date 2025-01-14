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
  UserGroupIcon,
  BanknotesIcon,
  CalendarIcon,
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
    name: 'Agendamentos',
    href: '/agendamento',
    icon: CalendarIcon
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
        <div className="flex items-start justify-center flex-shrink-0 px-8 mb-4">
          <BanknotesIcon className="h-13 w-13 text-white/90 mr-4 -mt-1" />
          <div className="flex flex-col" style={{ lineHeight: '0.9' }}>
            <h1 className="text-xl text-white font-light tracking-wider">
              Gestão de Faturamento
            </h1>
            <h1 className="text-xl text-white font-light tracking-wider">

            </h1>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-4 py-2.5 text-[15px] font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive ? 'text-white' : 'text-white/80'
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
