const dayjs = require("dayjs");

const canSendAgain = (lastSent, waitMinutes = 1) => {
  const now = dayjs();

  if (!lastSent) return { allowed: true };

  const nextAllowed = dayjs(lastSent).add(waitMinutes, "minute");

  if (now.isAfter(nextAllowed)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    secondsLeft: nextAllowed.diff(now, "second"),
  };
};

module.exports = canSendAgain;
