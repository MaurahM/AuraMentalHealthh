const Subscription = require('../models/Subscription');

exports.activateSubscription = async (userId, plan) => {
  await Subscription.updateMany(
    { user: userId, status: 'active' },
    { status: 'expired' }
  );

  const start = new Date();
  const end = new Date(start);

  if (plan === 'monthly') end.setMonth(end.getMonth() + 1);
  if (plan === 'annual') end.setFullYear(end.getFullYear() + 1);

  return await Subscription.create({
    user: userId,
    plan,
    startDate: start,
    endDate: end,
    status: 'active',
  });
};
