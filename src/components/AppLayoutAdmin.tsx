import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { Navbar } from './Navbar';
import { SidebarInset, SidebarProvider } from './ui/sidebar';
import AppSidebar from './AppSidebar';

const AppLayoutAdmin = () => {
  return (
    <SidebarProvider>
      {/* <div className={'flex h-[100dvh] flex-col overflow-x-hidden'}> */}
      <AppSidebar />
      <Navbar />
      <SidebarInset className="flex flex-1 flex-col">
        <main className="flex-1 overflow-auto">
          <div className={'my-5 ml-auto! flex flex-col px-4 py-3!'}>
            <Toaster className="select-none" />
            <Outlet />
          </div>
        </main>
      </SidebarInset>
      {/* </div> */}
    </SidebarProvider>
  );
};

export default AppLayoutAdmin;
