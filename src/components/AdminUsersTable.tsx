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
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
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

  const [modalActions, setModalActions] = useState<
    Record<string, string | null>
  >({});

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

  const { dataListAllUsers } = useListAllUsers({
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

  const handleModalActionChange = (userId: string, action: string) => {
    setModalActions((prev) => ({
      ...prev,
      [userId]: action,
    }));

    setSelectedUserId(userId);
  };

  return (
    <Card className="p-6!">
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>A list of all users in the system</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Sort selector */}
        <div className="mb-4 flex flex-row items-center gap-3">
          <div className="flex flex-row items-center gap-3">
            <span className="text-muted-foreground text-sm">Sort by:</span>
            <Select
              value={sortBy}
              onValueChange={(val: string) => {
                setSortBy(val as IListAllUsersParams['sort_by']);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] px-3!">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="px-3! py-2!">
                <SelectItem value="last_login">Last Login</SelectItem>
                <SelectItem value="created_at">Created At</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-row items-center gap-3">
            <span className="text-muted-foreground text-sm whitespace-nowrap!">
              search:
            </span>
            <Input
              placeholder="Search with email / full name"
              className="w-[250px] px-3!"
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
            {currentUsers.length > 0 ? (
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
                      className={`inline-flex items-center rounded-full px-2.5! py-0.5! text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-200 text-gray-800 dark:bg-red-800 dark:text-gray-200'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Sleep'}
                    </span>
                  </TableCell>
                  <TableCell
                    key={`cell-6-${user.id}`}
                    className="px-1! text-right"
                  >
                    <div className="flex flex-row items-center justify-end gap-2!">
                      <Button
                        className={`h-6 w-6 cursor-pointer rounded-full p-0 text-[0.675rem] ${user.is_active ? 'bg-red-800 hover:bg-red-700' : 'bg-green-800 hover:bg-green-700'} text-white`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivateToggle(user.id, user.is_active);
                        }}
                        disabled={isLoadingActivateAndDeactivate}
                      >
                        {user.is_active ? 'off' : 'on'}
                      </Button>
                      <Select
                        onValueChange={(action) =>
                          handleModalActionChange(user.id, action)
                        }
                        value={modalActions[user.id] || ''}
                      >
                        <SelectTrigger className="my-1! h-6! cursor-pointer px-2!">
                          <Settings />
                        </SelectTrigger>
                        <SelectContent className="px-2! py-2!">
                          <SelectItem
                            className="cursor-pointer py-0.5!"
                            value="updateBasic"
                          >
                            Update Info
                          </SelectItem>
                          <SelectItem
                            className="cursor-pointer py-0.5!"
                            value="updatePassword"
                          >
                            Update Password
                          </SelectItem>
                          <SelectItem
                            className="cursor-pointer py-0.5!"
                            value="updateRoles"
                          >
                            Update Roles
                          </SelectItem>
                          <SelectItem
                            className="cursor-pointer py-0.5!"
                            value="viewLogs"
                          >
                            View Logs
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="mt-4! flex flex-col gap-4 border-t pt-4! md:flex-row md:items-center md:justify-between">
          {/* Items per page selector */}
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

          {/* Page info and navigation */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                className="cursor-pointer"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
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

      <ModalUserById
        userId={selectedUserId}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <ModalUpdateUserBasic
        open={modalActions[selectedUserId as string] === 'updateBasic'}
        onClose={() =>
          setModalActions((prev) => ({
            ...prev,
            [selectedUserId as string]: null,
          }))
        }
        userId={selectedUserId}
      />

      <ModalUpdateUserPassword
        open={modalActions[selectedUserId as string] === 'updatePassword'}
        onClose={() =>
          setModalActions((prev) => ({
            ...prev,
            [selectedUserId as string]: null,
          }))
        }
        userId={selectedUserId}
      />

      <ModalUpdateUserRoles
        open={modalActions[selectedUserId as string] === 'updateRoles'}
        onClose={() =>
          setModalActions((prev) => ({
            ...prev,
            [selectedUserId as string]: null,
          }))
        }
        userId={selectedUserId}
      />

      <ModalUserLogs
        open={modalActions[selectedUserId as string] === 'viewLogs'}
        onClose={() =>
          setModalActions((prev) => ({
            ...prev,
            [selectedUserId as string]: null,
          }))
        }
        userId={selectedUserId}
      />
    </Card>
  );
};

export default AdminUsersTable;
