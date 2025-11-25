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
import { useUserProfile } from '@/features/admin/useUserProfile';
import ModalUserLogs from '@/features/admin/ModalUserLogsById'; // Adjust path to where you saved the Logs modal
import ModalUpdateProfile from '@/features/admin/ModalUpdateProfile';
import ModalChangePassword from '@/features/admin/ModalChangePassword';
import useLogout from '@/features/authentication/logout/useLogout';

const ProfileMenu = () => {
  const { dataProfile, isLoadingProfile } = useUserProfile();
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
  if (isLoadingProfile) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  // Fallback if data fails
  if (!dataProfile) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 border hover:border-primary/50 transition-colors">
              {/* You can add an image src here if your API provides avatar_url */}
              <AvatarImage src="" alt={dataProfile.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(dataProfile.full_name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-60 p-4!" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1 mb-3!">
              <p className="text-sm font-medium leading-none mb-1!">
                {dataProfile.full_name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {dataProfile.email}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem 
                className="cursor-pointer px-2! py-1.5!"
                onClick={() => setIsUpdateProfileOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              <span>Update Profile</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              className="cursor-pointer px-2! py-1.5!"
              onClick={() => setIsChangePasswordOpen(true)}>
              <Key className="mr-2 h-4 w-4" />
              <span>Change Password</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuGroup>
            <DropdownMenuItem 
              className="cursor-pointer px-2! py-1.5!"
              onClick={() => setIsLogsOpen(true)}
            >
              <FileClock className="mr-2 h-4 w-4" />
              <span>Show Logs</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="cursor-pointer px-1.5! py-1.5! text-red-600 focus:text-red-100 focus:bg-red-800/10"
            onClick={() => mutateLogout()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Audit Logs Modal */}
      
        

      <ModalUpdateProfile
        open={isUpdateProfileOpen}
        onClose={() => setIsUpdateProfileOpen(false)}
        currentUser={dataProfile}
        />

      <ModalChangePassword 
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        />

      <ModalUserLogs
          open={isLogsOpen}
          onClose={() => setIsLogsOpen(false)}
          userId={dataProfile.id}
        />
    </>
  );
};

export default ProfileMenu;