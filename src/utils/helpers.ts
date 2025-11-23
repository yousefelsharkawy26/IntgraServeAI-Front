export const getLastCopiedText = async () => {
  try {
    const text = await navigator.clipboard.readText();
    return text;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    return null;
  }
};

export const checkOnlyKeyboardDigits = (
  event: React.KeyboardEvent<HTMLInputElement>,
) => {
  if (!/[0-9]/.test(event.key)) event.preventDefault();
};

export function generateRandomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const getRandomWidthClass = () => {
  const widths = [
    'w-1/4',
    'w-1/3',
    'w-1/2',
    'w-2/3',
    'w-3/4',
    'w-4/6',
    'w-5/12',
  ];
  return widths[generateRandomInteger(0, widths.length - 1)];
};

export const formatMessageTime = (timestamp: string) => {
  const date = new Date(timestamp);
  let hour = date.getHours();
  const period = hour < 12 ? 'AM' : 'PM';
  hour = hour % 12 || 12; // convert to 12-hour format
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute} ${period}`;
};

export const calculateWidthInUnitCH = (element: HTMLElement | null): number => {
  if (!element) return 0;

  const fontSize = window.getComputedStyle(element).fontSize;
  const fontSizeInPixels = parseFloat(fontSize);

  const charWidth = fontSizeInPixels * 0.4;

  const widthInPixels = element.offsetWidth;
  const widthInUnitCH = widthInPixels / charWidth;

  return widthInUnitCH;
};

export const getFirstAndLastName = (
  fullName: string,
): { firstName: string; lastName: string } => {
  const nameParts = fullName?.trim()?.split(' ');

  const firstName = nameParts?.[0];
  const lastName = nameParts?.[nameParts.length - 1];

  return { firstName, lastName };
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    if (diffInMinutes === 1) {
      return '1 minute ago';
    } else {
      return `${diffInMinutes} minutes ago`;
    }
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    if (diffInHours === 1) {
      return '1 hour ago';
    } else {
      return `${diffInHours} hours ago`;
    }
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    if (diffInDays === 1) {
      return '1 day ago';
    } else {
      return `${diffInDays} days ago`;
    }
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    if (diffInWeeks === 1) {
      return '1 week ago';
    } else {
      return `${diffInWeeks} weeks ago`;
    }
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    if (diffInMonths === 1) {
      return '1 month ago';
    } else {
      return `${diffInMonths} months ago`;
    }
  }

  const diffInYears = Math.floor(diffInDays / 365);
  if (diffInYears === 1) {
    return '1 year ago';
  } else {
    return `${diffInYears} years ago`;
  }
};
