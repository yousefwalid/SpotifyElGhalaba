const AppError = require('./../utils/appError');
const User = require('./../models/userModel');

const getOnlineDevicesCount = user => {
  let count = 0;
  user.devices.forEach(device => {
    if (device.isActive) count += 1;
  });
  return count;
};

const getMaxOnlineDevicesCount = type => (type === 'premium' ? 3 : 1);

const addDevice = async (user, device) => {
  const maxOnlineDevicesCount = getMaxOnlineDevicesCount(user.type);
  const userOnlineDeviceCount = getOnlineDevicesCount(user);
  if (userOnlineDeviceCount === maxOnlineDevicesCount)
    throw new AppError(
      'You reached the maximum number of online devices.',
      403
    );
};
