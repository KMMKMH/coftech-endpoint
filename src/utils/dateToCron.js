const dateToCron = (dateString) => {
  const date = new Date(dateString);

  const minutes = date.getMinutes();
  const hours = date.getHours();
  const dayOfMonth = date.getDate();
  const month = date.getMonth() + 1;
  const dayOfWeek = date.getDay();

  return `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
};

module.exports = dateToCron;
