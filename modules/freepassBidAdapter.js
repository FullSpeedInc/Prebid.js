
import {registerBidder} from 'src/adapters/bidderFactory';
import {logMessage} from "../src/utils";
import {BANNER} from "../src/mediaTypes";
export const spec = {
  code: 'freepass',
  supportedMediaTypes: [BANNER],

  isBidRequestValid(bid) {
    logMessage('Validating bid: ', bid);
    // TODO: validate bid
    return true;
  },

  buildRequests(validBidRequests, bidderRequest) {
    logMessage('Preparing bid request: ', validBidRequests, bidderRequest);
    // TODO: prepare payload
    return {
      method: 'POST',
      url: 'http://127.0.0.1/bid',
      data: JSON.stringify({}) // What data and format does BidderService need?
    };
  },

  interpretResponse(serverResponse, bidRequest) {
    logMessage('Parsing server response');
    // TODO: parse server response
    return []; // What data and format does BidderService return?
  },


};

registerBidder(spec);
