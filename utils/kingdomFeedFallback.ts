export const shouldRetryFeedWithoutDestination = (error: any) => {
  const message = [error?.message, error?.details, error?.hint, error?.code].filter(Boolean).join(' | ');
  return error?.code === '42703' && /posts\.destination|destination/i.test(message);
};
