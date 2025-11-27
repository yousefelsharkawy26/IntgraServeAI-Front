import { Settings, Users } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from './ui/sidebar';
import { userByTokenRolesEnumT } from '@/schema/userByTokenSchema';
import { useAuthContext } from '@/providers/context/auth-context/AuthContext';
import { Link } from 'react-router';

interface ISidebarItem {
  title: string;
  url: string;
  icon: React.ElementType;
  allowedRoles?: userByTokenRolesEnumT[];
}

const items: ISidebarItem[] = [
  {
    title: 'Users',
    url: '/dash/users',
    icon: Users,
    allowedRoles: ['Admin'],
  },
  {
    title: 'Page-1',
    url: '/dash/page-1',
    icon: Settings,
    allowedRoles: ['Support User'],
  },
  {
    title: 'Page-2',
    url: '/dash/page-2',
    icon: Settings,
    allowedRoles: ['Support User'],
  },
  {
    title: 'Page-3',
    url: '/dash/page-3',
    icon: Settings,
    allowedRoles: ['Tech User'],
  },
  {
    title: 'Page-4',
    url: '/dash/page-4',
    icon: Settings,
    allowedRoles: ['Support User'],
  },
];

const AppSidebar = () => {
  const { dataUser } = useAuthContext();

  const filteredItems = items.filter(
    (item) =>
      !item.allowedRoles ||
      (dataUser?.roles.some((role) => item.allowedRoles?.includes(role)) ??
        false),
  );
  return (
    <Sidebar className="mt-auto! h-[calc(100%-4rem)]!">
      <SidebarHeader />
      <SidebarTrigger className="absolute top-2 -right-7 cursor-pointer rounded-md rounded-l-none border border-l-0 border-zinc-500 bg-zinc-500/40" />
      <SidebarContent className="px-4!">
        <SidebarGroup />
        <SidebarGroupLabel>Admin</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {filteredItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link to={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};

export default AppSidebar;
