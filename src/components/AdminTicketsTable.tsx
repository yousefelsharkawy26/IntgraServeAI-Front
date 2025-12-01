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
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import useDebounce from '@/hooks/useDebounce';
import { useAllTickets } from '@/features/admin/useAllTickets';
import { IAllTicketsParams } from '@/services/admin/apiAllTickets';
import ModalTicketDetailsById from '@/features/admin/ModalTicketDetailsById';
import {
  ticketPriorityBGColors,
  ticketStatusBGColors,
} from '@/utils/constants';
import ModalAcceptDeleteAdminTicket from '@/features/admin/ModalAcceptDeleteAdminTicket';
import AdminTicketsFilters from './AdminTicketsFilters';

const AdminTicketsTable = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] =
    useState<IAllTicketsParams['sort_by']>('created_at');

  const [statusFilter, setStatusFilter] = useState<
    IAllTicketsParams['status'] | undefined
  >(undefined);
  const [priorityFilter, setPriorityFilter] = useState<
    IAllTicketsParams['priority'] | undefined
  >(undefined);
  const [typeFilter, setTypeFilter] = useState<
    IAllTicketsParams['ticket_type'] | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 800);

  const { dataAllTickets, isLoadingAllTickets } = useAllTickets({
    page: currentPage,
    limit: itemsPerPage,
    sort_by: sortBy,
    search:
      debouncedSearchQuery && debouncedSearchQuery.trim() !== ''
        ? debouncedSearchQuery
        : null,
    status: statusFilter,
    priority: priorityFilter,
    ticket_type: typeFilter,
  });

  const totalPages =
    dataAllTickets?.total && dataAllTickets.limit
      ? Math.ceil(dataAllTickets?.total / dataAllTickets?.limit)
      : 0;

  const startIndex = (currentPage - 1) * itemsPerPage;

  const currentTickets = dataAllTickets?.tickets ?? [];

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
        <CardTitle>All Tickets</CardTitle>
        <CardDescription>A list of all tickets in the system</CardDescription>
      </CardHeader>

      <CardContent>
        <AdminTicketsFilters
          status={statusFilter}
          priority={priorityFilter}
          ticket_type={typeFilter}
          search={searchQuery ?? ''}
          sortBy={sortBy}
          onChange={(filters) => {
            setStatusFilter(filters.status);
            setPriorityFilter(filters.priority);
            setTypeFilter(filters.ticket_type);
            setSearchQuery(filters.search ?? '');
            if (filters.sortBy) setSortBy(filters.sortBy);
            setCurrentPage(1);
          }}
        />

        {/* Table */}
        <Table>
          <TableCaption>
            Showing {startIndex + 1} to {startIndex + currentTickets.length}{' '}
            tickets
          </TableCaption>

          <TableHeader>
            <TableRow>
              <TableHead className="px-1!">#</TableHead>
              <TableHead className="px-1!">Title</TableHead>
              <TableHead className="px-1!">Customer</TableHead>
              <TableHead className="px-1!">Status</TableHead>
              <TableHead className="px-1!">Priority</TableHead>
              <TableHead className="px-1!">Type</TableHead>
              <TableHead className="px-1!">Assignee</TableHead>
              <TableHead className="px-1!">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoadingAllTickets ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center">
                  Loading tickets...
                </TableCell>
              </TableRow>
            ) : currentTickets.length > 0 ? (
              currentTickets.map((ticket, index) => (
                <TableRow
                  key={`ticket-row-${ticket.id}`}
                  className="hover:bg-muted/40 cursor-pointer"
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    setIsModalOpen(true);
                  }}
                >
                  <TableCell
                    key={`cell-1-${ticket.id}`}
                    className="px-1! font-medium"
                  >
                    {startIndex + 1 + index}
                  </TableCell>

                  <TableCell key={`cell-2-${ticket.id}`} className="px-1!">
                    {ticket.title}
                  </TableCell>

                  <TableCell key={`cell-3-${ticket.id}`} className="px-1!">
                    <div className="flex flex-col">
                      <span className="">{ticket.customer_name}</span>
                      <span className="text-zinc-500">
                        {ticket.customer_email}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell
                    key={`cell-4-${ticket.id}`}
                    className="px-1! capitalize"
                  >
                    <span
                      className={`rounded-full px-2! py-1! ${ticketStatusBGColors(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                  </TableCell>

                  <TableCell
                    key={`cell-5-${ticket.id}`}
                    className="px-1! capitalize"
                  >
                    <span
                      className={`rounded-full px-2! py-1! ${ticketPriorityBGColors(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </span>
                  </TableCell>

                  <TableCell key={`cell-6-${ticket.id}`} className="px-1!">
                    {ticket.ticket_type}
                  </TableCell>
                  <TableCell key={`cell-7-${ticket.id}`} className="px-1!">
                    {ticket.assignee_name ?? '------'}
                  </TableCell>

                  <TableCell key={`cell-8-${ticket.id}`} className="px-1!">
                    {new Date(ticket.created_at).toLocaleString()}
                  </TableCell>

                  <TableCell
                    key={`cell-9-${ticket.id}`}
                    className="px-1! text-right"
                  >
                    <Button
                      className="cursor-pointer rounded-md bg-transparent p-2! text-red-600! duration-300 hover:bg-red-800/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicketId(ticket.id);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center">
                  No tickets found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="mt-4! flex flex-col gap-4 border-t pt-4! md:flex-row md:items-center md:justify-between">
          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Rows per page:
            </span>

            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[70px] cursor-pointer px-2!">
                <SelectValue />
              </SelectTrigger>

              <SelectContent className="px-2! py-2!">
                <SelectItem className="cursor-pointer" value="5">
                  5
                </SelectItem>
                <SelectItem className="cursor-pointer" value="10">
                  10
                </SelectItem>
                <SelectItem className="cursor-pointer" value="20">
                  20
                </SelectItem>
                <SelectItem className="cursor-pointer" value="50">
                  50
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page navigation */}
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

      {/* Modal for viewing ticket details */}
      <ModalTicketDetailsById
        ticketId={selectedTicketId}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <ModalAcceptDeleteAdminTicket
        ticketId={selectedTicketId}
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </Card>
  );
};

export default AdminTicketsTable;
