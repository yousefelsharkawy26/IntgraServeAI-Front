import MyTicketsTable from '@/components/MyTicketsTable';
import ModalTicketDetailsById from '@/features/shared/ModalTicketDetailsById';
import ModalTicketWorkstation from '@/features/user/ModalTicketWorkstation';
import { useState } from 'react';

const TicketsUser = () => {
  const [isTicketDetailsModalOpen, setIsTicketDetailsModalOpen] =
    useState(false);
  const [isTicketWorkstationModalOpen, setIsTicketWorkstationModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  return (
    <div className="space-y-6!">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="ml-6! text-3xl font-bold tracking-tight">
            Manage Tickets
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and view users tickets
          </p>
        </div>
        <div className="flex flex-row gap-3">
          {/* <ModalUsersStatistics
            triggerButton={
              <Button className="cursor-pointer gap-2 p-3!">
                <ChartArea className="h-4 w-4" />
                Show Users Statistics
              </Button>
            }
          />
          <ModalCreateUser
            triggerButton={
              <Button className="cursor-pointer gap-2 p-3!">
                <UserPlus className="h-4 w-4" />
                Add New User
              </Button>
            }
          /> */}
        </div>
      </div>

      {/* Users Table */}
      <MyTicketsTable
        setIsTicketDetailsModalOpen={setIsTicketDetailsModalOpen}
        setIsTicketWorkstationModalOpen={setIsTicketWorkstationModalOpen}
        setSelectedTicketId={setSelectedTicketId}
      />

      <ModalTicketDetailsById
        ticketId={selectedTicketId}
        open={isTicketDetailsModalOpen}
        onClose={() => setIsTicketDetailsModalOpen(false)}
      />

      <ModalTicketWorkstation
        ticketId={selectedTicketId}
        open={isTicketWorkstationModalOpen}
        onClose={() => setIsTicketWorkstationModalOpen(false)}
      />

      {/* User Activity Table */}
      {/* <AdminUserActivityTable /> */}
    </div>
  );
};

export default TicketsUser;
