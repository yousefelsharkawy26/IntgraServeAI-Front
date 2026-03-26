import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: string) => void;
  pageSizeOptions?: number[];
}

const TablePagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 20, 50],
}: TablePaginationProps) => {
  return (
    <div className="mt-4! flex flex-col gap-4! border-t! pt-4! md:flex-row md:items-center md:justify-between">
      {/* Rows per page */}
      <div className="flex items-center gap-2!">
        <span className="text-muted-foreground text-sm">Rows per page:</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={onItemsPerPageChange}
        >
          <SelectTrigger className="w-[70px]! cursor-pointer px-2!">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="px-2! py-2!">
            {pageSizeOptions.map((size) => (
              <SelectItem
                key={size}
                className="cursor-pointer"
                value={size.toString()}
              >
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2!">
        <span className="text-muted-foreground text-sm">
          Page {currentPage} of {totalPages || 1}
        </span>
        <div className="flex gap-1!">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4! w-4!" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= (totalPages || 1)}
          >
            <ChevronRight className="h-4! w-4!" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;
