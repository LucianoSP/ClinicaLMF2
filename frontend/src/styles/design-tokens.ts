/**
 * Design Tokens - Clínica Larissa
 * Este arquivo contém todos os padrões visuais utilizados no sistema
 */

export const colors = {
  // Cores Principais
  primary: {
    main: '#8B4513', // Marrom principal (títulos, textos importantes)
    light: '#D2B48C', // Marrom claro
    dark: '#6b342f', // Marrom escuro
  },
  
  // Cores de Ação
  action: {
    main: '#b49d6b', // Cor principal dos botões
    hover: '#a08b5f', // Cor hover dos botões
    delete: '#8B4513', // Cor para ações de exclusão
    deleteHover: '#7a3d10', // Cor hover para ações de exclusão
    download: '#b49d6b', // Cor para ações de download
    downloadHover: '#a08b5f', // Cor hover para ações de download
  },

  // Cores de Estado
  state: {
    success: '#10B981', // Verde para sucesso
    error: '#EF4444', // Vermelho para erro
    warning: '#F59E0B', // Amarelo para avisos
    info: '#3B82F6', // Azul para informações
  },

  // Cores de Texto
  text: {
    primary: '#1F2937', // Texto principal
    secondary: '#6B7280', // Texto secundário
    disabled: '#9CA3AF', // Texto desabilitado
  },

  // Cores de Background
  background: {
    primary: '#FFFFFF', // Background principal
    secondary: '#F3F4F6', // Background secundário
    disabled: '#E5E7EB', // Background desabilitado
  },

  // Cores de Borda
  border: {
    light: '#E5E7EB',
    main: '#D1D5DB',
    dark: '#9CA3AF',
  }
};

export const typography = {
  // Famílias de Fonte
  fontFamily: {
    main: 'Inter, sans-serif', // Fonte principal
  },

  // Tamanhos de Fonte
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
  },

  // Pesos de Fonte
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const spacing = {
  // Espaçamentos
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
};

export const components = {
  // Botões
  button: {
    base: `
      flex items-center gap-1 
      px-3 py-1.5 
      text-sm 
      rounded 
      transition-colors
    `,
    primary: `
      bg-[#b49d6b] 
      text-white 
      hover:bg-[#a08b5f]
      disabled:opacity-50
    `,
    secondary: `
      bg-[#8B4513] 
      text-white 
      hover:bg-[#7a3d10]
      disabled:opacity-50
    `,
  },

  // Inputs
  input: {
    base: `
      w-full
      px-3 py-2
      rounded-md
      border border-gray-300
      focus:outline-none
      focus:ring-2
      focus:ring-[#b49d6b]
      focus:border-transparent
    `,
  },

  // Tabelas
  table: {
    header: `
      text-left 
      text-gray-600
      font-medium
      py-3
      px-4
    `,
    cell: `
      py-2
      px-4
      border-t
      border-gray-200
    `,
  },

  // Cards
  card: {
    base: `
      bg-white
      rounded-lg
      shadow-sm
      overflow-hidden
    `,
    header: `
      px-6
      py-4
      border-b
      border-gray-200
    `,
    body: `
      px-6
      py-4
    `,
  },

  // Ícones
  icon: {
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    },
  },
};

export const effects = {
  // Sombras
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
  },

  // Transições
  transition: {
    fast: 'transition duration-150',
    normal: 'transition duration-300',
    slow: 'transition duration-500',
  },

  // Bordas Arredondadas
  borderRadius: {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  },
};

// Breakpoints para responsividade
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Exemplo de uso:
/*
import { colors, typography, components } from '@/styles/design-tokens';

// Em um componente:
<button 
  className={`${components.button.base} ${components.button.primary}`}
>
  Botão Primário
</button>

// Ou para cores:
<h1 style={{ color: colors.primary.main }}>
  Título
</h1>
*/
