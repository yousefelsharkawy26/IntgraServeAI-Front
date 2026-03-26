import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { Loader2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import useDebounce from '@/hooks/useDebounce';
import { useUnassignedTickets } from '@/features/user/useUnassignedTickets';
import { IUnassignedTicketsParams } from '@/services/user/apiUnassignedTickets';
import {
  ticketPriorityBGColors,
  ticketStatusBGColors,
} from '@/utils/constants';
import {
  ticketPriorityEnumT,
  ticketSortByEnumT,
} from '@/schema/shared/allTicketsSchema';
import { useAssignTicket } from '@/features/user/useAssignTicket';
import TablePagination from './ui/TablePagination';
import TableSkeleton from './ui/TableSkeleton';
import EmptyState from './ui/EmptyState';
import { TicketCheck } from 'lucide-react';

const UnassignedTicketsTable = () => {
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] =
    useState<IUnassignedTicketsParams['sort_by']>('created_at');

  // Only Priority Filter is needed
  const [priorityFilter, setPriorityFilter] = useState<
    IUnassignedTicketsParams['priority'] | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 800);

  // Hook Call
  const { dataUnassignedTickets, isLoadingUnassignedTickets } =
    useUnassignedTickets({
      page: currentPage,
      limit: itemsPerPage,
      sort_by: sortBy,
      search:
        debouncedSearchQuery && debouncedSearchQuery.trim() !== ''
          ? debouncedSearchQuery
          : null,
      priority: priorityFilter,
    });
  const { assignTicket, isAssigning } = useAssignTicket();
  const [loadingTicketId, setLoadingTicketId] = useState<string | null>(null);

  const handleClaimTicket = (ticketId: string) => {
    setLoadingTicketId(ticketId);
    assignTicket(ticketId, {
      onSettled: () => setLoadingTicketId(null),
    });
  };

  const totalPages =
    dataUnassignedTickets?.total && dataUnassignedTickets.limit
      ? Math.ceil(dataUnassignedTickets?.total / dataUnassignedTickets?.limit)
      : 0;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTickets = dataUnassignedTickets?.tickets ?? [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <Card className="p-6!">
      <CardHeader>
        <CardTitle>Unassigned Tickets</CardTitle>
        <CardDescription>
          Tickets waiting to be assigned to an agent
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Local Filters Section (Inline for simplicity since params are few) */}
        <div className="mb-6! flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Input
            placeholder="Search tickets..."
            className="max-w-xs px-3!"
            value={searchQuery ?? ''}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="flex gap-2">
            <Select
              value={priorityFilter ?? 'all'}
              onValueChange={(val) =>
                setPriorityFilter(
                  val === 'all' ? undefined : (val as ticketPriorityEnumT),
                )
              }
            >
              <SelectTrigger className="w-[150px] px-3!">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="px-2! py-1!" value="all">
                  All Priorities
                </SelectItem>
                <SelectItem className="px-2! py-1!" value="urgent">
                  Urgent
                </SelectItem>
                <SelectItem className="px-2! py-1!" value="high">
                  High
                </SelectItem>
                <SelectItem className="px-2! py-1!" value="medium">
                  Medium
                </SelectItem>
                <SelectItem className="px-2! py-1!" value="low">
                  Low
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as ticketSortByEnumT)}
            >
              <SelectTrigger className="w-[150px] px-3!">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="px-2! py-1!" value="created_at">
                  Newest First
                </SelectItem>
                <SelectItem className="px-2! py-1!" value="updated_at">
                  Recently Updated
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableCaption>
            Showing {startIndex + 1} to {startIndex + currentTickets.length}{' '}
            tickets
          </TableCaption>

          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">Action</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoadingUnassignedTickets ? (
              <TableSkeleton rows={itemsPerPage} cols={7} />
            ) : currentTickets.length > 0 ? (
              currentTickets.map((ticket, index) => (
                <TableRow
                  key={`unassigned-${ticket.id}`}
                  className="hover:bg-muted/40 cursor-pointer"
                >
                  <TableCell className="font-medium">
                    {startIndex + 1 + index}
                  </TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{ticket.customer_name}</span>
                      <span className="text-muted-foreground text-xs">
                        {ticket.customer_email}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="capitalize">
                    <span
                      className={`rounded-full px-2! py-1! text-xs ${ticketStatusBGColors(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                  </TableCell>

                  <TableCell className="capitalize">
                    <span
                      className={`rounded-full px-2! py-1! text-xs ${ticketPriorityBGColors(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </span>
                  </TableCell>

                  <TableCell>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </TableCell>

                  <TableCell className="text-right">
                    {/* Primary Action: Assign to Me / Claim */}
                    <Button
                      size="sm"
                      className="w-full cursor-pointer gap-2 bg-blue-600 text-white hover:bg-blue-700"
                      disabled={isAssigning && loadingTicketId === ticket.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaimTicket(ticket.id);
                      }}
                    >
                      {isAssigning && loadingTicketId === ticket.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Wait
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Claim
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={TicketCheck}
                    title="No unassigned tickets"
                    description="All tickets are assigned — great work!"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </CardContent>
    </Card>
  );
};

export default UnassignedTicketsTable;
