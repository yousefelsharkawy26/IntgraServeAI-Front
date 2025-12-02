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
import { ChevronLeft, ChevronRight, Eye, Mail } from 'lucide-react';
import { useState } from 'react';
import useDebounce from '@/hooks/useDebounce';
import { useMyTickets } from '@/features/user/useMyTickets';
import { IMyTicketsParams } from '@/services/user/apiMyTickets';
import {
  ticketPriorityBGColors,
  ticketStatusBGColors,
} from '@/utils/constants'; // Assumed utility for colors
import MyTicketsFilters from './AdminTicketsFilters'; // You would create this similar to AdminFilters

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
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  Loading your tickets...
                </TableCell>
              </TableRow>
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
                <TableCell colSpan={7} className="py-10! text-center">
                  You haven't submitted any tickets yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Section */}
        <div className="mt-4 flex flex-col gap-4 border-t pt-4! md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Rows per page:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[70px] px-3!">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="px-2! py-1!" value="5">
                  5
                </SelectItem>
                <SelectItem className="px-2! py-1!" value="10">
                  10
                </SelectItem>
                <SelectItem className="px-2! py-1!" value="20">
                  20
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyTicketsTable;
