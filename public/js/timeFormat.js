
function formatTime(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diff = Math.floor((now - created) / 1000); // Difference in seconds

  if (diff < 60) {
    return `${diff} second${diff === 1 ? '' : 's'} ago`;
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else if (diff < 2592000) {
    const days = Math.floor(diff / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  } else if (diff < 31536000) {
    const months = Math.floor(diff / 2592000);
    return `${months} month${months === 1 ? '' : 's'} ago`;
  } else {
    const years = Math.floor(diff / 31536000);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
}
