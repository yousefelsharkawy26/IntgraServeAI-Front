const TicketsUser = () => {
  return (
    <div className="space-y-6!">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="ml-6! text-3xl font-bold tracking-tight">
            Tickets Management
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
      {/* <AdminUsersTable /> */}
      {/* User Activity Table */}
      {/* <AdminUserActivityTable /> */}
    </div>
  );
};

export default TicketsUser;
