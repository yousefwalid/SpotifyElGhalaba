//These services are not used in the project till now.
/* istanbul ignore file */
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

// const setActiveDevice = async (user, deviceId) => {
//   if (user.devices.length > 0) {
//     await User.findOneAndUpdate(
//       { _id: user._id },
//       {
//         $set: { 'devices.$[].isActive': false }
//       }
//     );
//     user = await User.findOneAndUpdate(
//       { _id: user._id, 'devices._id': deviceId },
//       { $set: { 'devices.$.isActive': true } },
//       { new: true, runValidators: true }
//     );
//   }
//   return user;
// };

/**
 * @description Sets all user devices active status to false
 * @param {Object} user The user document
 * @returns {UserObject}
 */
const setAllDevicesInactive = async user => {
  if (user.devices.length > 0) {
    await User.findOneAndUpdate(
      {
        _id: user._id
      },
      {
        $set: {
          'devices.$[].isActive': false
        }
      }
    );
  }
  return user;
};

/**
 * @description Adds a device to users' devices
 * @param {Object} user The user document
 * @param {device} device The device object
 * @returns {UserObject}  The updated user object
 * @todo make the logic of adding devices for different users (user/artist)
 */
const addDevice2 = async (user, device) => {
  // if (user.devices.length < 3) {
  //   user = await User.findByIdAndUpdate(
  //     user._id,
  //     {
  //       $push: {
  //         devices: {
  //           name: device.client.name,
  //           type: device.device.type,
  //           isActive: true
  //         }
  //       }
  //     },
  //     { new: true, runValidators: true }
  //   );
  // } else {
  //   let deviceId;
  //   for (let i = 0; i < 3; i += 1) {
  //     if (!user.devices[i].isActive) {
  //       deviceId = user.devices[i]._id;
  //       break;
  //     }
  //   }
  //   user = await User.findOneAndUpdate(
  //     {
  //       _id: user._id,
  //       'devices._id': deviceId
  //     },
  //     {
  //       $set: {
  //         'devices.$': {
  //           name: device.client.name,
  //           type: device.device.type,
  //           isActive: true
  //         }
  //       }
  //     },
  //     { new: true, runValidators: true }
  //   );
  // }
  // return user;
};
/**
 * @description Gets the id of the first inactive device from the users' devices.
 * @param {Object} user The user document
 * @returns {deviceId}  The device id
 */
const getFirstInactiveDevice = user => {
  let deviceId;

  for (let i = 0; i < 3; i += 1) {
    if (!user.devices[i].isActive) {
      deviceId = user.devices[i]._id;
      break;
    }
  }
  return deviceId;
};

/**
 * @description Replaces a user device by another device.
 * @param {UserObject} user The user document.
 * @param {ObjectId} deviceId The id of the device to be replaced.
 * @param {Object} device The new device object.
 * @returns {UserObject}  The updated user document.
 */
const replaceUserDevice = async (user, deviceId, device) => {
  user = await User.findOneAndUpdate(
    {
      _id: user._id,
      'devices._id': deviceId
    },
    {
      $set: {
        'devices.$': {
          name: device.client.name,
          type: device.device.type,
          isActive: true
        }
      }
    },
    {
      new: true,
      runValidators: true
    }
  );
  return user;
};
