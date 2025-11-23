import { useUserActivityUsers } from '@/features/admin/useUserActivity';
import { IUserActivityParams } from '@/services/admin/apiUserActivity';
import { useState } from 'react';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ModalUserById from '@/features/admin/ModalUserById';
import ModalUpdateUserBasic from '@/features/admin/ModalUpdateUserBasic';
import ModalUpdateUserPassword from '@/features/admin/ModalUpdateUserPassword';
import ModalUpdateUserRoles from '@/features/admin/ModalUpdateUserRoles';
import { Spinner } from './ui/spinner';

const AdminUserActivityTable = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [sortBy, setSortBy] =
    useState<IUserActivityParams['sort_by']>('last_login');

  const [modalActions, setModalActions] = useState<
    Record<string, string | null>
  >({});

  const { dataUserActivityUsers, isLoadingUserActivityUsers } =
    useUserActivityUsers({
      page: currentPage,
      limit: itemsPerPage,
      sort_by: sortBy,
    });

  const dataAllUsersActivity =
    dataUserActivityUsers && !('detail' in dataUserActivityUsers)
      ? dataUserActivityUsers
      : undefined;

  const totalPages =
    dataAllUsersActivity?.total && dataAllUsersActivity.limit
      ? Math.ceil(dataAllUsersActivity?.total / dataAllUsersActivity?.limit)
      : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = dataAllUsersActivity?.users || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // const handleModalActionChange = (userId: string, action: string) => {
  //   setModalActions((prev) => ({
  //     ...prev,
  //     [userId]: action,
  //   }));

  //   setSelectedUserId(userId);
  // };

  return (
    <Card className="!p-6">
      <CardHeader>
        <CardTitle>User Activity</CardTitle>
        <CardDescription>Track recent logins and inactivity</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Sort selector */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-muted-foreground text-sm">Sort by:</span>
          <Select
            value={sortBy}
            onValueChange={(val: string) => {
              setSortBy(val as IUserActivityParams['sort_by']);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[150px] !px-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="!px-3 !py-2">
              <SelectItem value="last_login">Last Login</SelectItem>
              <SelectItem value="created_at">Created At</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableCaption>
            Showing {startIndex + 1} to {endIndex} users
          </TableCaption>

          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Days Since Login</TableHead>
              <TableHead>Status</TableHead>
              {/* <TableHead className="text-right">Actions</TableHead> */}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoadingUserActivityUsers ? (
              <TableRow>
                <TableCell colSpan={7} className="!mx-auto py-10 text-center">
                  <Spinner className="!mx-auto size-6" />
                </TableCell>
              </TableRow>
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
                  <TableCell>{startIndex + 1 + index}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>

                  {/* last_login */}
                  <TableCell>
                    {user.last_login
                      ? user.last_login.toLocaleString()
                      : 'Never logged in'}
                  </TableCell>

                  {/* days_since_login */}
                  <TableCell>
                    {user.days_since_login !== null
                      ? `${user.days_since_login} days`
                      : '—'}
                  </TableCell>

                  {/* status */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full !px-2.5 !py-0.5 text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Sleep'}
                    </span>
                  </TableCell>

                  {/* <TableCell className="text-right">
                    <Select
                      onValueChange={(action) =>
                        handleModalActionChange(user.id, action)
                      }
                      value={modalActions[user.id] || ''}
                    >
                      <SelectTrigger className="!my-1 !ml-auto !h-6 cursor-pointer !px-2">
                        <Settings />
                      </SelectTrigger>
                      <SelectContent className="!px-2 !py-2">
                        <SelectItem
                          className="cursor-pointer !py-0.5"
                          value="updateBasic"
                        >
                          Update Info
                        </SelectItem>
                        <SelectItem
                          className="cursor-pointer !py-0.5"
                          value="updatePassword"
                        >
                          Update Password
                        </SelectItem>
                        <SelectItem
                          className="cursor-pointer !py-0.5"
                          value="updateRoles"
                        >
                          Update Roles
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell> */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="!mt-4 flex flex-col gap-4 border-t !pt-4 md:flex-row md:items-center md:justify-between">
          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              Rows per page:
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-[70px] cursor-pointer !px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="!px-2 !py-2">
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
    </Card>
  );
};

export default AdminUserActivityTable;
