// CampusPulse Frontend Utilities
export const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  } catch (e) {
    return dateStr;
  }
};

export default { formatDate };

