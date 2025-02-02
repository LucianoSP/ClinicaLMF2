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
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui/button';

const navigation = [
  {
    name: 'Home',
    href: '/dashboard',
    icon: HomeIcon
  },
  {
    name: 'Cadastros',
    href: '/cadastros',
    icon: DocumentTextIcon
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
    name: 'Guias Unimed',
    href: '/unimed',
    icon: DocumentIcon
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
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-blue-600 via-blue-500 to-blue-400 shadow-lg flex flex-col z-50">
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-center flex-shrink-0 px-8 mb-4 pt-6">
          <BanknotesIcon className="h-8 w-8 text-white mr-3" />
          <h1 className="text-xl text-white font-medium tracking-wider">
            Gestão de Faturamento
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-4 py-2.5 text-[15px] font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-700/30 text-white shadow-sm backdrop-blur-sm'
                    : 'text-white/90 hover:bg-blue-700/20 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-white/90 group-hover:text-white'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="p-4 border-t border-white/20">
            <div className="flex flex-col space-y-2 text-sm">
              <div className="text-white font-medium">{user.nome}</div>
              <div className="text-xs text-white/90">{user.email}</div>
              <Button
                variant="ghost"
                className="w-full justify-start text-white/90 hover:text-white hover:bg-blue-700/20"
                onClick={handleLogout}
              >
                Sair
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
