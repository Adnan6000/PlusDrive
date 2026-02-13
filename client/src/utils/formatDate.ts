export const fixDateDisplay = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // This gets the day based on the Local Time of the user, not UTC
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }); 
};