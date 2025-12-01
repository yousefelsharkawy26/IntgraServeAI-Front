import {
  ticketPriorityEnumT,
  ticketStatusEnumT,
  ticketTypeEnumT,
} from '@/schema/admin/allTicketsSchema';
import { useState } from 'react';
import { Button } from './ui/button';
import { motion } from 'motion/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';

interface IProps {
  status?: ticketStatusEnumT;
  priority?: ticketPriorityEnumT;
  ticket_type?: ticketTypeEnumT;
  search?: string;
  sortBy?: 'created_at' | 'updated_at';
  onChange: (filters: {
    status?: ticketStatusEnumT;
    priority?: ticketPriorityEnumT;
    ticket_type?: ticketTypeEnumT;
    search?: string;
    sortBy?: 'created_at' | 'updated_at';
  }) => void;
}

const AdminTicketsFilters = ({
  status,
  priority,
  ticket_type,
  search,
  sortBy,
  onChange,
}: IProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleFilterChange = (
    key: 'status' | 'priority' | 'ticket_type' | 'search' | 'sortBy',
    value:
      | ticketStatusEnumT
      | ticketPriorityEnumT
      | ticketTypeEnumT
      | string
      | 'created_at'
      | 'updated_at'
      | undefined,
  ) => {
    onChange({
      status,
      priority,
      ticket_type,
      search,
      sortBy: 'created_at',
      [key]: value,
    });
  };

  const handleReset = () => {
    onChange({
      status: undefined,
      priority: undefined,
      ticket_type: undefined,
      search: '',
    });
  };
  return (
    <div className="mb-4">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 cursor-pointer px-3!"
      >
        {isOpen ? 'Hide Filters' : 'Show Filters'}
      </Button>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="mt-2 flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Status</span>
            <Select
              value={status}
              onValueChange={(val) => handleFilterChange('status', val)}
            >
              <SelectTrigger className="w-[150px] cursor-pointer px-3!">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer px-3! py-2!" value="open">
                  Open
                </SelectItem>
                <SelectItem
                  className="cursor-pointer px-3! py-2!"
                  value="in_progress"
                >
                  In Progress
                </SelectItem>
                <SelectItem
                  className="cursor-pointer px-3! py-2!"
                  value="pending"
                >
                  Pending
                </SelectItem>
                <SelectItem
                  className="cursor-pointer px-3! py-2!"
                  value="escalated"
                >
                  Escalated
                </SelectItem>
                <SelectItem
                  className="cursor-pointer px-3! py-2!"
                  value="resolved"
                >
                  Resolved
                </SelectItem>
                <SelectItem
                  className="cursor-pointer px-3! py-2!"
                  value="closed"
                >
                  Closed
                </SelectItem>
                <SelectItem
                  className="cursor-pointer px-3! py-2!"
                  value="canceled"
                >
                  Canceled
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Filter */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Sort by</span>
            <Select
              value={sortBy}
              onValueChange={(val) => handleFilterChange('sortBy', val)}
            >
              <SelectTrigger className="w-[150px] cursor-pointer px-3!">
                <SelectValue placeholder="Created At" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  className="cursor-pointer px-3! py-2!"
                  value="created_at"
                >
                  Created At
                </SelectItem>
                <SelectItem
                  className="cursor-pointer px-3! py-2!"
                  value="updated_at"
                >
                  Updated At
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Priority</span>
            <Select
              value={priority}
              onValueChange={(val) => handleFilterChange('priority', val)}
            >
              <SelectTrigger className="w-[120px] cursor-pointer px-3!">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  className="cursor-pointer px-3! py-2!"
                  value="urgent"
                >
                  Urgent
                </SelectItem>
                <SelectItem className="cursor-pointer px-3! py-2!" value="high">
                  High
                </SelectItem>
                <SelectItem
                  className="cursor-pointer px-3! py-2!"
                  value="medium"
                >
                  Medium
                </SelectItem>
                <SelectItem className="cursor-pointer px-3! py-2!" value="low">
                  Low
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Type</span>
            <Select
              value={ticket_type}
              onValueChange={(val) => handleFilterChange('ticket_type', val)}
            >
              <SelectTrigger className="w-[120px] cursor-pointer px-3!">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="cursor-pointer px-3! py-2!" value="tech">
                  Tech
                </SelectItem>
                <SelectItem
                  className="cursor-pointer px-3! py-2!"
                  value="support"
                >
                  Support
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="flex flex-col">
            <span className="text-muted-foreground text-sm">Search</span>
            <Input
              placeholder="Search by title or email"
              value={search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-[250px] px-3!"
            />
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <Button
              className="cursor-pointer px-3!"
              variant="ghost"
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminTicketsFilters;
