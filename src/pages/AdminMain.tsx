import { ReactNode } from 'react';
import { Outlet } from 'react-router';

interface IProps {
  children?: ReactNode;
}

const AdminMain = ({ children }: IProps) => {
  return children ? (
    <div className="mt-16! w-full px-2!">{children}</div>
  ) : (
    <Outlet />
  );
};

export default AdminMain;
