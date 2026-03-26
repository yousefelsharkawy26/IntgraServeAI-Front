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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  MoreHorizontal,
  Pencil,
  KeyRound,
  Shield,
  ScrollText,
  Users,
} from 'lucide-react';
import TableSkeleton from './ui/TableSkeleton';
import EmptyState from './ui/EmptyState';
import { useState } from 'react';
import { useListAllUsers } from '@/features/admin/useListAllUsers';
import ModalUserById from '@/features/admin/ModalUserById';
import ModalUpdateUserBasic from '@/features/admin/ModalUpdateUserBasic';
import ModalUpdateUserPassword from '@/features/admin/ModalUpdateUserPassword';
import ModalUpdateUserRoles from '@/features/admin/ModalUpdateUserRoles';
import { useActivateAndDeactivate } from '@/features/admin/useActivateAndDeactivate';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import ModalUserLogs from '@/features/admin/ModalUserLogsById';
import { IListAllUsersParams } from '@/services/admin/apiListAllUsers';
import { Input } from './ui/input';
import useDebounce from '@/hooks/useDebounce';
import TablePagination from './ui/TablePagination';

type ActiveModal = { userId: string; action: string } | null;

const AdminUsersTable = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [sortBy, setSortBy] =
    useState<IListAllUsersParams['sort_by']>('last_login');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);

  const queryClient = useQueryClient();

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const { mutateActivateAndDeactivate, isLoadingActivateAndDeactivate } =
    useActivateAndDeactivate();

  const handleActivateToggle = (userId: string, isActive: boolean) => {
    const action = isActive ? 'deactivate' : 'activate';
    mutateActivateAndDeactivate(
      {
        activeType: action,
        data: { user_ids: [userId] },
      },
      {
        onSuccess: (data) => {
          toast.success(data.message);
          queryClient.invalidateQueries({ queryKey: ['listAllUsers'] });
          queryClient.invalidateQueries({ queryKey: ['userActivity'] });
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to create user');
        },
      },
    );
  };

  const { dataListAllUsers, isLoadingListAllUsers } = useListAllUsers({
    page: currentPage,
    limit: itemsPerPage,
    sort_by: sortBy,
    search:
      debouncedSearchQuery && debouncedSearchQuery.trim() !== ''
        ? debouncedSearchQuery
        : null,
  });

  const dataAllUsers =
    dataListAllUsers && !('detail' in dataListAllUsers)
      ? dataListAllUsers
      : undefined;

  const totalPages =
    dataAllUsers?.total && dataAllUsers.limit
      ? Math.ceil(dataAllUsers?.total / dataAllUsers?.limit)
      : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = dataAllUsers?.users || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const openModal = (userId: string, action: string) => {
    setSelectedUserId(userId);
    setActiveModal({ userId, action });
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <Card className="p-6!">
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>A list of all users in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Sort selector */}
        <div className="mb-4! flex flex-row items-center gap-3!">
          <div className="flex flex-row items-center gap-3!">
            <span className="text-muted-foreground text-sm">Sort by:</span>
            <Select
              value={sortBy}
              onValueChange={(val: string) => {
                setSortBy(val as IListAllUsersParams['sort_by']);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]! cursor-pointer px-3!">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="px-3! py-2!">
                <SelectItem className="cursor-pointer" value="last_login">
                  Last Login
                </SelectItem>
                <SelectItem className="cursor-pointer" value="created_at">
                  Created At
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-row items-center gap-3!">
            <span className="text-muted-foreground text-sm whitespace-nowrap!">
              search:
            </span>
            <Input
              placeholder="Search with email / full name"
              className="w-[250px]! px-3!"
              type="search"
              value={searchQuery ?? ''}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <Table>
          <TableCaption>
            Showing {startIndex + 1} to {endIndex} users
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="px-1!">#</TableHead>
              <TableHead className="px-1!">Name</TableHead>
              <TableHead className="px-1!">Email</TableHead>
              <TableHead className="px-1!">Role</TableHead>
              <TableHead className="px-1!">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingListAllUsers ? (
              <TableSkeleton rows={itemsPerPage} cols={6} />
            ) : currentUsers.length > 0 ? (
              currentUsers.map((user, index) => (
                <TableRow
                  key={`Row-${user.id}`}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setIsModalOpen(true);
                  }}
                >
                  <TableCell
                    className="px-1! font-medium"
                    key={`cell-1-${user.id}`}
                  >
                    {startIndex + 1 + index}
                  </TableCell>
                  <TableCell className="px-1!" key={`cell-2-${user.id}`}>
                    {user.full_name}
                  </TableCell>
                  <TableCell className="px-1!" key={`cell-3-${user.id}`}>
                    {user.email}
                  </TableCell>
                  <TableCell className="px-1!" key={`cell-4-${user.id}`}>
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="mr-0.5! inline-flex items-center rounded-full bg-blue-200 px-2.5! py-0.5! text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {role}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell className="px-1!" key={`cell-5-${user.id}`}>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5! py-0.5! text-xs font-medium ${user.is_active
                          ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-200 text-gray-800 dark:bg-red-800 dark:text-gray-200'
                        }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell
                    key={`cell-6-${user.id}`}
                    className="px-1! text-right"
                  >
                    <div className="flex flex-row items-center justify-end gap-2!">
                      {/* Activate / Deactivate toggle button */}
                      <Button
                        size="sm"
                        className={`h-6! w-14! cursor-pointer rounded-full p-0! text-[0.675rem]! font-semibold ${user.is_active
                            ? 'bg-red-600 hover:bg-red-500'
                            : 'bg-green-700 hover:bg-green-600'
                          } text-white`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivateToggle(user.id, user.is_active);
                        }}
                        disabled={isLoadingActivateAndDeactivate}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </Button>

                      {/* Actions dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7! w-7! cursor-pointer rounded-full p-0!"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4! w-4!" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(user.id, 'updateBasic');
                            }}
                          >
                            <Pencil className="h-4! w-4!" />
                            Edit Info
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(user.id, 'updatePassword');
                            }}
                          >
                            <KeyRound className="h-4! w-4!" />
                            Change Password
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(user.id, 'updateRoles');
                            }}
                          >
                            <Shield className="h-4! w-4!" />
                            Update Roles
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(user.id, 'viewLogs');
                            }}
                          >
                            <ScrollText className="h-4! w-4!" />
                            View Logs
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState
                    icon={Users}
                    title="No users found"
                    description="Try adjusting your search"
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

      <ModalUserById
        userId={selectedUserId}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <ModalUpdateUserBasic
        open={activeModal?.action === 'updateBasic'}
        onClose={closeModal}
        userId={activeModal?.userId ?? null}
      />
      <ModalUpdateUserPassword
        open={activeModal?.action === 'updatePassword'}
        onClose={closeModal}
        userId={activeModal?.userId ?? null}
      />
      <ModalUpdateUserRoles
        open={activeModal?.action === 'updateRoles'}
        onClose={closeModal}
        userId={activeModal?.userId ?? null}
      />
      <ModalUserLogs
        open={activeModal?.action === 'viewLogs'}
        onClose={closeModal}
        userId={activeModal?.userId ?? null}
      />
    </Card>
  );
};

export default AdminUsersTable;
