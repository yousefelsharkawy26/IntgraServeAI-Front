import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReactNode } from 'react';
import { useUsersStatistics } from './useUsersStatistics';
import { Spinner } from '@/components/ui/spinner';

interface IProps {
  triggerButton: ReactNode;
}

const ModalUsersStatistics = ({ triggerButton }: IProps) => {
  const { dataUsersStatistics, isLoadingUsersStatistics } =
    useUsersStatistics();
  return (
    <Dialog>
      <div>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="!p-5 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>
              This users statistics, total users and active users and inactive
              users, ...etc
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {isLoadingUsersStatistics ? (
              <div className="flex justify-center py-10">
                <Spinner className="size-6" />
              </div>
            ) : dataUsersStatistics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-md border !px-2 !py-0.5">
                    <div className="text-sm text-gray-500">Total Users</div>
                    <div className="text-lg font-semibold">
                      {dataUsersStatistics.total_users}
                    </div>
                  </div>
                  <div className="rounded-md border !px-2 !py-0.5">
                    <div className="text-sm text-gray-500">Active Users</div>
                    <div className="text-lg font-semibold">
                      {dataUsersStatistics.active_users}
                    </div>
                  </div>
                  <div className="rounded-md border !px-2 !py-0.5">
                    <div className="text-sm text-gray-500">Inactive Users</div>
                    <div className="text-lg font-semibold">
                      {dataUsersStatistics.inactive_users}
                    </div>
                  </div>
                  <div className="rounded-md border !px-2 !py-0.5">
                    <div className="text-sm text-gray-500">
                      Confirmed Emails
                    </div>
                    <div className="text-lg font-semibold">
                      {dataUsersStatistics.confirmed_emails}
                    </div>
                  </div>
                  <div className="rounded-md border !px-2 !py-0.5">
                    <div className="text-sm text-gray-500">
                      Unconfirmed Emails
                    </div>
                    <div className="text-lg font-semibold">
                      {dataUsersStatistics.unconfirmed_emails}
                    </div>
                  </div>
                  <div className="rounded-md border !px-2 !py-0.5">
                    <div className="text-sm text-gray-500">
                      Recent Registrations
                    </div>
                    <div className="text-lg font-semibold">
                      {dataUsersStatistics.recent_registrations}
                    </div>
                  </div>
                  <div className="col-span-2 rounded-md border !px-2 !py-0.5">
                    <div className="text-sm text-gray-500">Recent Logins</div>
                    <div className="text-lg font-semibold">
                      {dataUsersStatistics.recent_logins}
                    </div>
                  </div>
                </div>

                <div className="!mt-4">
                  <div className="mb-2 text-sm font-medium text-gray-500">
                    Users by Role
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(dataUsersStatistics.users_by_role).map(
                      ([role, count]) => (
                        <div
                          key={role}
                          className="flex justify-between rounded-md border !px-2 !py-0.5"
                        >
                          <span>{role}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-gray-500">
                No statistics available
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                className="cursor-pointer !px-3"
                id="close-create-user"
                variant="outline"
              >
                Cancel
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default ModalUsersStatistics;
