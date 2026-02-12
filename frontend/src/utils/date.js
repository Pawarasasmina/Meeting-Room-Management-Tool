export const toLocalDatetimeInput = (date) => new Date(date).toISOString().slice(0, 16);

export const formatDateTime = (date) =>
  new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
