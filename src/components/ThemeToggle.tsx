import { Moon, Settings2, Sun } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useThemeContext } from '@/providers/context/theme-context/ThemeContext';

const ThemeToggle = () => {
  const { setTheme } = useThemeContext();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem]! w-[1.2rem]! scale-100! rotate-0! transition-all! dark:scale-0! dark:-rotate-90!" />
          <Moon className="absolute h-[1.2rem]! w-[1.2rem]! scale-0! rotate-90! transition-all! dark:scale-100! dark:rotate-0!" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="px-2!">
        <DropdownMenuItem className="cursor-pointer m-1! p-1!" onClick={() => setTheme('light')}>
          <Sun className="h-[1.2rem]! w-[1.2rem]!" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer m-1! p-1!" onClick={() => setTheme('dark')}>
          <Moon className="h-[1.2rem]! w-[1.2rem]!" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer m-1! p-1!" onClick={() => setTheme('system')}>
          <Settings2 className="h-[1.2rem]! w-[1.2rem]!" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
