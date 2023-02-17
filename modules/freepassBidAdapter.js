import {registerBidder} from 'src/adapters/bidderFactory';
import {logMessage} from "../src/utils";
import {BANNER} from "../src/mediaTypes";
import {ortbConverter} from '../libraries/ortbConverter/converter.js'

// TODO: Update with official URL or make it configurable
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

    // TODO: validate bid
    //   - must have required ortb params
    //   - must have required freepass params
    //   - must have required GAM params
    //   - etc.

    return !!bid.adUnitCode;
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
    logMessage('Interpreted ORTB bid request: ', JSON.stringify(data));
    // TODO: Add user data to bid request

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
    logMessage('Interpreted ORTB bids: ', JSON.stringify(bids));

    return bids;
  },
};

registerBidder(spec);
