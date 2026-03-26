import { Skeleton } from './skeleton';
import { TableCell, TableRow } from './table';

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

const TableSkeleton = ({ rows = 5, cols = 7 }: TableSkeletonProps) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow key={`skel-row-${rowIdx}`}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <TableCell key={`skel-cell-${rowIdx}-${colIdx}`} className="px-1!">
              <Skeleton className="h-4! w-full! rounded!" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};

export default TableSkeleton;
