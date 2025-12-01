import {
  ticketPriorityEnumT,
  ticketStatusEnumT,
} from '@/schema/admin/allTicketsSchema';

const ticketPriorityBGColors = (ticketPriority: ticketPriorityEnumT) => {
  return ticketPriority === 'urgent'
    ? 'bg-red-600/30'
    : ticketPriority === 'high'
      ? 'bg-orange-600/30'
      : ticketPriority === 'medium'
        ? 'bg-yellow-600/30'
        : ticketPriority === 'low'
          ? 'bg-green-600/30'
          : '';
};

const ticketStatusBGColors = (ticketStatus: ticketStatusEnumT) => {
  return ticketStatus === 'canceled'
    ? 'bg-red-600/30'
    : ticketStatus === 'closed'
      ? 'bg-sky-600/30'
      : ticketStatus === 'pending'
        ? 'bg-yellow-600/30'
        : ticketStatus === 'resolved'
          ? 'bg-green-600/30'
          : ticketStatus === 'open'
            ? 'bg-blue-600/30'
            : ticketStatus === 'escalated'
              ? 'bg-orange-600/30'
              : ticketStatus === 'in_progress'
                ? 'bg-linear-180 from-green-600/30 to-yellow-600/30'
                : '';
};

export { ticketPriorityBGColors, ticketStatusBGColors };
