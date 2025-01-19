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
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui/button';

const navigation = [
  {
    name: 'Home',
    href: '/',
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
    <div className="flex flex-col w-64 sidebar-bg min-h-screen shadow-lg">
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-center flex-shrink-0 px-8 mb-4 pt-6">
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

        {/* Informações do usuário e botão de logout */}
        {user && (
          <div className="mt-auto p-4 border-t border-white/10">
            <div className="mb-4">
              <p className="text-white font-medium truncate">{user.nome}</p>
              <p className="text-white/70 text-sm truncate">{user.email}</p>
              <p className="text-white/70 text-sm capitalize">{user.tipo_usuario}</p>
            </div>
            <Button 
              variant="outline" 
              className="w-full text-white hover:text-white hover:bg-white/10 border-white/20"
              onClick={handleLogout}
            >
              Sair
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
