import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisiblePages = 5;

  // Determinar quais páginas mostrar
  let visiblePages = pages;
  if (totalPages > maxVisiblePages) {
    const start = Math.max(
      Math.min(
        currentPage - Math.floor(maxVisiblePages / 2),
        totalPages - maxVisiblePages + 1
      ),
      1
    );
    visiblePages = pages.slice(start - 1, start - 1 + maxVisiblePages);
  }

  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-center">
      <ul className="flex items-center gap-1">
        {/* Botão Anterior */}
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`
              p-2 rounded-lg
              ${currentPage === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:bg-gray-100'
              }
            `}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </li>

        {/* Primeira página */}
        {visiblePages[0] > 1 && (
          <>
            <li>
              <button
                onClick={() => onPageChange(1)}
                className={`
                  px-3 py-1 rounded-lg
                  ${currentPage === 1
                    ? 'bg-[#b49d6b] text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                  }
                `}
              >
                1
              </button>
            </li>
            {visiblePages[0] > 2 && (
              <li className="px-2 text-gray-500">...</li>
            )}
          </>
        )}

        {/* Páginas visíveis */}
        {visiblePages.map(page => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              className={`
                px-3 py-1 rounded-lg
                ${currentPage === page
                  ? 'bg-[#b49d6b] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
                }
              `}
            >
              {page}
            </button>
          </li>
        ))}

        {/* Última página */}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <li className="px-2 text-gray-500">...</li>
            )}
            <li>
              <button
                onClick={() => onPageChange(totalPages)}
                className={`
                  px-3 py-1 rounded-lg
                  ${currentPage === totalPages
                    ? 'bg-[#b49d6b] text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                  }
                `}
              >
                {totalPages}
              </button>
            </li>
          </>
        )}

        {/* Botão Próximo */}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`
              p-2 rounded-lg
              ${currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-500 hover:bg-gray-100'
              }
            `}
            aria-label="Next page"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </li>
      </ul>
    </nav>
  );
}
