import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { Navbar } from './Navbar';

const AppLayout = () => {
  return (
    <div className={'flex h-[100dvh] flex-col overflow-x-hidden'}>
      <Navbar />
      <main className="flex-1">
        <div
          className={
            'container mx-auto my-5 flex flex-col px-4 sm:px-6 lg:px-8'
          }
        >
          <Toaster className="select-none" />
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
