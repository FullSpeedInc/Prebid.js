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

    let freepassUserId = validBidRequests[0].userId.freepassId || {};
    data.user.id = freepassUserId.userId;
    data.user.ext = {};
    if (freepassUserId.commonId) {
      data.user.ext.fuid = freepassUserId.commonId;
    }
    if (freepassUserId.userIp) {
      data.user.ext.userIp = freepassUserId.userIp;
    }
    logMessage('Augmented ORTB bid request user: ', data.user);

    return {
      method: 'POST',
      url: BIDDER_SERVICE_URL,
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
