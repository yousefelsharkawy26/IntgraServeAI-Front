import { useState } from 'react';
import { LogOut, User, Key, FileClock } from 'lucide-react';

// UI Components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Hooks & Modals
import ModalUserLogs from '@/features/admin/ModalUserLogsById'; // Adjust path to where you saved the Logs modal
import ModalUpdateProfile from '@/features/admin/ModalUpdateProfile';
import ModalChangePassword from '@/features/admin/ModalChangePassword';
import useLogout from '@/features/authentication/logout/useLogout';
import { useAuthContext } from '@/providers/context/auth-context/AuthContext';

const ProfileMenu = () => {
  const { dataUser, isLoadingUser } = useAuthContext();
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isUpdateProfileOpen, setIsUpdateProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const { mutateLogout } = useLogout();

  // Helper to get initials (e.g., "System Administrator" -> "SA")
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Loading Skeleton
  if (isLoadingUser) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  // Fallback if data fails
  if (!dataUser) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 cursor-pointer rounded-full"
          >
            <Avatar className="hover:border-primary/50 h-10 w-10 border transition-colors">
              {/* You can add an image src here if your API provides avatar_url */}
              <AvatarImage src="" alt={dataUser.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(dataUser.full_name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-60 p-4!" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="mb-3! flex flex-col space-y-1">
              <p className="mb-1! text-sm leading-none font-medium">
                {dataUser.full_name}
              </p>
              <p className="text-muted-foreground text-xs leading-none">
                {dataUser.email}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer px-2! py-1.5!"
              onClick={() => setIsUpdateProfileOpen(true)}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Update Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer px-2! py-1.5!"
              onClick={() => setIsChangePasswordOpen(true)}
            >
              <Key className="mr-2 h-4 w-4" />
              <span>Change Password</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          {dataUser.roles.includes('Admin') && (
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer px-2! py-1.5!"
                onClick={() => setIsLogsOpen(true)}
              >
                <FileClock className="mr-2 h-4 w-4" />
                <span>Show Logs</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer px-1.5! py-1.5! text-red-600 focus:bg-red-800/10 focus:text-red-100"
            onClick={() => mutateLogout()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Audit Logs Modal */}

      <ModalUpdateProfile
        open={isUpdateProfileOpen}
        onClose={() => setIsUpdateProfileOpen(false)}
        currentUser={dataUser}
      />

      <ModalChangePassword
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {dataUser.roles.includes('Admin') && (
        <ModalUserLogs
          open={isLogsOpen}
          onClose={() => setIsLogsOpen(false)}
          userId={dataUser.id}
        />
      )}
    </>
  );
};

export default ProfileMenu;
