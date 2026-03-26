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
import { Eye, Mail, Ticket } from 'lucide-react';
import TableSkeleton from './ui/TableSkeleton';
import EmptyState from './ui/EmptyState';
import { useState } from 'react';
import useDebounce from '@/hooks/useDebounce';
import { useMyTickets } from '@/features/user/useMyTickets';
import { IMyTicketsParams } from '@/services/user/apiMyTickets';
import {
  ticketPriorityBGColors,
  ticketStatusBGColors,
} from '@/utils/constants';
import MyTicketsFilters from './AdminTicketsFilters';
import TablePagination from './ui/TablePagination';

interface IProps {
  setSelectedTicketId: (id: string) => void;
  setIsTicketDetailsModalOpen: (isOpen: boolean) => void;
  setIsTicketWorkstationModalOpen: (isOpen: boolean) => void;
}

const MyTicketsTable = ({
  setSelectedTicketId,
  setIsTicketDetailsModalOpen,
  setIsTicketWorkstationModalOpen,
}: IProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] =
    useState<IMyTicketsParams['sort_by']>('created_at');

  const [statusFilter, setStatusFilter] = useState<
    IMyTicketsParams['status'] | undefined
  >(undefined);
  const [priorityFilter, setPriorityFilter] = useState<
    IMyTicketsParams['priority'] | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 800);

  // Using the new Hook
  const { dataMyTickets, isLoadingMyTickets } = useMyTickets({
    page: currentPage,
    limit: itemsPerPage,
    sort_by: sortBy,
    search:
      debouncedSearchQuery && debouncedSearchQuery.trim() !== ''
        ? debouncedSearchQuery
        : null,
    status: statusFilter,
    priority: priorityFilter,
  });

  const totalPages =
    dataMyTickets?.total && dataMyTickets.limit
      ? Math.ceil(dataMyTickets?.total / dataMyTickets?.limit)
      : 0;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTickets = dataMyTickets?.tickets ?? [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const openTicketDetails = (id: string) => {
    setSelectedTicketId(id);
    setIsTicketDetailsModalOpen(true);
  };

  const openTicketWorkstation = (id: string) => {
    setSelectedTicketId(id);
    setIsTicketWorkstationModalOpen(true);
  };

  return (
    <Card className="p-6!">
      <CardHeader>
        <CardTitle>My Tickets</CardTitle>
        <CardDescription>View and track your submitted tickets</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Filters Component (Optional / Same logic as Admin) */}
        <MyTicketsFilters
          status={statusFilter}
          priority={priorityFilter}
          search={searchQuery ?? ''}
          sortBy={sortBy}
          onChange={(filters) => {
            setStatusFilter(filters.status);
            setPriorityFilter(filters.priority);
            setSearchQuery(filters.search ?? '');
            if (filters.sortBy) setSortBy(filters.sortBy);
            setCurrentPage(1);
          }}
        />

        {/* Table */}
        <Table className="mt-4!">
          <TableCaption>
            Showing {startIndex + 1} to {startIndex + currentTickets.length}{' '}
            tickets
          </TableCaption>

          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoadingMyTickets ? (
              <TableSkeleton rows={itemsPerPage} cols={7} />
            ) : currentTickets.length > 0 ? (
              currentTickets.map((ticket, index) => (
                <TableRow
                  key={`my-ticket-${ticket.id}`}
                  className="hover:bg-muted/40"
                  onClick={() => openTicketDetails(ticket.id)}
                >
                  <TableCell className="font-medium">
                    {startIndex + 1 + index}
                  </TableCell>

                  <TableCell>{ticket.title}</TableCell>

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

                  <TableCell>{ticket.ticket_type}</TableCell>

                  <TableCell>
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTicketWorkstation(ticket.id);
                      }}
                    >
                      <Mail className="m-1! h-5 w-5 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-10 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTicketDetails(ticket.id);
                      }}
                    >
                      <Eye className="m-1! h-5 w-5 text-blue-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    icon={Ticket}
                    title="No tickets found"
                    description="Try adjusting your filters or search term"
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

export default MyTicketsTable;
