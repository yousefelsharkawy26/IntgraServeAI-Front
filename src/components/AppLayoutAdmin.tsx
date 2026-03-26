import { Outlet } from 'react-router';
import { Navbar } from './Navbar';
import { SidebarInset, SidebarProvider } from './ui/sidebar';
import AppSidebar from './AppSidebar';

const AppLayoutAdmin = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Navbar />
      <SidebarInset className="flex flex-1 flex-col bg-background">
        <main className="mt-16! flex-1 overflow-auto">
          <div className={'flex flex-col px-6! py-5!'}>
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayoutAdmin;
