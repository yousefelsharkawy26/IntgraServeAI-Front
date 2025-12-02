import {
  Edit,
  Eye,
  Settings,
  Tickets,
  Users,
  SquareCheckBig,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { Link, useLocation } from 'react-router';
import { useState } from 'react';

interface ISidebarItem {
  title: string;
  url?: string;
  icon: React.ElementType;
  allowedRoles?: userByTokenRolesEnumT[];
  children?: ISidebarItem[];
}

const items: ISidebarItem[] = [
  {
    title: 'Users',
    url: '/dash/users',
    icon: Users,
    allowedRoles: ['Admin'],
  },
  {
    title: 'Tickets',
    icon: Tickets,
    children: [
      {
        title: 'Show Tickets',
        url: '/dash/tickets/show',
        icon: Eye,
        allowedRoles: ['Admin'],
      },
      {
        title: 'Unassigned Tickets',
        url: '/dash/tickets/unassigned',
        icon: SquareCheckBig,
        allowedRoles: ['Support User', 'Tech User'],
      },
      {
        title: 'Manage Tickets',
        url: '/dash/tickets/manage',
        icon: Edit,
        allowedRoles: ['Support User', 'Tech User'],
      },
    ],
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
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    items.forEach((item) => {
      if (
        item.children &&
        item.children.some((child) => location.pathname.startsWith(child.url!))
      ) {
        state[item.title] = true;
      }
    });
    return state;
  });

  const canSee = (item: ISidebarItem) =>
    !item.allowedRoles ||
    dataUser?.roles.some((r) => item.allowedRoles!.includes(r));

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };
  return (
    <Sidebar className="mt-auto! h-[calc(100%-4rem)]!">
      <SidebarHeader />
      <SidebarTrigger className="absolute top-2 -right-7 cursor-pointer rounded-md rounded-l-none border border-l-0 border-zinc-500 bg-zinc-500/40" />
      <SidebarContent className="px-4!">
        <SidebarGroupLabel>Admin</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              if (item.children && item.children.some(canSee)) {
                const isOpen = openGroups[item.title] ?? false;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className="flex items-center justify-between rounded-md px-3!"
                      onClick={() => toggleGroup(item.title)}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="mr-2 size-5" />
                        <span>{item.title}</span>
                      </div>

                      <span className="ml-2">{isOpen ? '▾' : '▸'}</span>
                    </SidebarMenuButton>

                    {isOpen && (
                      <SidebarGroupContent className="mt-1! pl-4!">
                        <SidebarMenu>
                          {item.children.filter(canSee).map((child) => (
                            <SidebarMenuItem key={child.title}>
                              <SidebarMenuButton
                                className={`${
                                  location.pathname === child.url
                                    ? 'bg-zinc-500/30'
                                    : ''
                                } rounded-md px-3!`}
                                asChild
                              >
                                <Link to={child.url!}>
                                  <child.icon className="mr-2" />
                                  <span>{child.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    )}
                  </SidebarMenuItem>
                );
              }

              if (canSee(item)) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      className={`${
                        location.pathname === item.url ? 'bg-zinc-500/30' : ''
                      } rounded-md px-3!`}
                      asChild
                    >
                      <Link to={item.url!}>
                        <item.icon className="mr-2" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return null;
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarContent>

      <SidebarFooter />
    </Sidebar>
  );
};

export default AppSidebar;
