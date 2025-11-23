import { Card } from '@/components/ui/card';
import FormLogin from '@/features/authentication/login/FormLogin';

const Login = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="flex w-[90%] flex-col rounded-lg !p-3 shadow-lg sm:w-[400px]">
        <h3 className="text-center text-3xl font-bold">Login</h3>
        <FormLogin classNames={{ inputClassName: '!px-2' }} />
      </Card>
    </div>
  );
};

export default Login;
