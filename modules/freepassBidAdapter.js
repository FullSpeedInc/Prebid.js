import {registerBidder} from 'src/adapters/bidderFactory';
import {logMessage} from "../src/utils";
import {BANNER} from "../src/mediaTypes";
import {ortbConverter} from '../libraries/ortbConverter/converter.js'

// TODO: Update with official URL or make it configurable?
const BIDDER_SERVICE_URL = 'http://127.0.0.1:8080/bid';

const converter = ortbConverter({
  context: {
    netRevenue: true,
    ttl: 30
  }
});

function prepareUserInfo(user, freepassId) {
  let userInfo = user || {};
  let extendedUserInfo = userInfo.ext || {};

  if (!freepassId.userId) {
    throw new Error('FreePass UserID is not defined');
  }
  userInfo.id = freepassId.userId;

  if (freepassId.commonId) {
    extendedUserInfo.fuid = freepassId.commonId;
  }
  userInfo.ext = extendedUserInfo;

  return userInfo;
}

function prepareDeviceInfo(device, freepassId) {
  let deviceInfo = device || {};
  let extendedDeviceInfo = deviceInfo.ext || {};

  extendedDeviceInfo.is_accurate_ip = 0;
  if (freepassId.userIp) {
    deviceInfo.ip = freepassId.userIp;
    extendedDeviceInfo.is_accurate_ip = 1;
  }
  deviceInfo.ext = extendedDeviceInfo;

  return deviceInfo;
}

export const spec = {
  code: 'freepass',
  supportedMediaTypes: [BANNER],

  isBidRequestValid(bid) {
    logMessage('Validating bid: ', bid);
    let freepassUserId = bid.userId.freepassId || {};
    return !!bid.adUnitCode && !!freepassUserId.userId;
  },

  buildRequests(validBidRequests, bidderRequest) {
    logMessage('Preparing bid request: ', validBidRequests);
    logMessage('Using bidder request: ', bidderRequest);

    const data = converter.toORTB({
      bidderRequest: bidderRequest,
      bidRequests: validBidRequests,
      // TODO: Try to autodetect mediaType from bidRequest
      context: { mediaType: BANNER }
    });
    logMessage('Interpreted ORTB bid request: ', data);

    let freepassId = validBidRequests[0].userId.freepassId || {};
    data.user = prepareUserInfo(data.user, freepassId);
    data.device = prepareDeviceInfo(data.device, freepassId);

    logMessage('Augmented ORTB bid request user: ', data.user);
    logMessage('Augmented ORTB bid request device: ', data.user);

    return {
      method: 'POST',
      url: validBidRequests[0].params.bidServiceUrl || BIDDER_SERVICE_URL,
      data
    };
  },

  interpretResponse(serverResponse, bidRequest) {
    logMessage('Interpreting server response: ', serverResponse);
    logMessage('Bid request: ', bidRequest);
    const bids = converter.fromORTB({request: bidRequest.data, response: serverResponse.body}).bids;
    logMessage('Interpreted ORTB bids: ', bids);

    return bids;
  },
};

registerBidder(spec);
