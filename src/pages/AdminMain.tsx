import { ReactNode } from 'react';

interface IProps {
  children: ReactNode;
}

const AdminMain = ({ children }: IProps) => {
  return <div className="!mt-[4rem] w-full !px-2">{children}</div>;
};

export default AdminMain;
