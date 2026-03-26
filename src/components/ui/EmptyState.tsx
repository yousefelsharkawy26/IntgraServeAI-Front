import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3! py-14! text-center">
      <div className="bg-muted rounded-full p-4!">
        <Icon className="text-muted-foreground h-8! w-8!" />
      </div>
      <div className="space-y-1!">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
