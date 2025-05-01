export const formatTime = (date: Date | string) => {
  // Ensure we have a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (date: Date | string) => {
  // Ensure we have a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time from 24-hour string to 12-hour format
export const formatTimeFromString = (time: string) => {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export function formatShortDate(isoString: string): string {
  return formatDate(new Date(isoString)).split(",")[0];
}

export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  // Ensure we have Date objects
  const startObj = startDate instanceof Date ? startDate : new Date(startDate);
  const endObj = endDate instanceof Date ? endDate : new Date(endDate);

  const start = startObj.toLocaleDateString([], {
    month: 'short',
    day: 'numeric'
  });

  const end = endObj.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return `${start} - ${end}`;
}
