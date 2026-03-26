import { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { Input } from './ui/input';
import { HTMLInputAutoCompleteAttribute, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface IProps<T extends FieldValues> {
  className?: string;
  isShow?: boolean;
  field: ControllerRenderProps<T>;
  autoComplete?: HTMLInputAutoCompleteAttribute;
  placeholder?: string;
}

const InputPassword = <T extends FieldValues>({
  className = '',
  isShow = false,
  field,
  autoComplete,
  placeholder = 'Enter your password',
}: IProps<T>) => {
  const [showPassword, setShowPassword] = useState(isShow);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  return (
    <div className="relative">
      <Input
        className={className}
        placeholder={placeholder}
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        {...field}
      />
      <button
        type="button"
        onClick={togglePasswordVisibility}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3! -translate-y-1/2! cursor-pointer transition-colors"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
};

export default InputPassword;
