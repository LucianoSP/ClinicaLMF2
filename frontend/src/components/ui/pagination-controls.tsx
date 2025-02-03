'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PaginationControlsProps {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  showItemsPerPageSelector?: boolean
}

export function PaginationControls({
  currentPage = 1,
  itemsPerPage = 10,
  totalItems = 0,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPageSelector = true,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex justify-between items-center">
      {showItemsPerPageSelector && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Itens por página:</span>
          <Select
            defaultValue={itemsPerPage.toString()}
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              onItemsPerPageChange(Number(value))
              onPageChange(1)
            }}
          >
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Anterior
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}
