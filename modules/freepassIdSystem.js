/**
 * This module adds FreePass to the User ID module
 * The {@link module:modules/userId} module is required
 * @module modules/freepassIdSystem
 * @requires module:modules/userId
 */

import {logMessage, isStr, generateUUID} from '../src/utils.js';
import {ajax} from '../src/ajax.js';
import { submodule } from '../src/hook.js';

const MODULE_NAME = 'freepassId';
const IPSERVICE_URL = 'http://127.0.0.1:8080/ipinfo'; // TODO: Review IP service with Daiki-san

function createIdCallback(config, consentData, cacheIdObj) {
  logMessage('Creating FreePass UserId Callback with arguments:', config, consentData, cacheIdObj);

  let ipAjaxCb = (userIdCb) => {
    ajax(
      isStr(config.ipServiceUrl) ? config.ipServiceUrl : IPSERVICE_URL,
      {
        success: (response) => {
          let data = JSON.parse(response);
          logMessage('Successfully obtained IP info: ', data);
          let ip = data.ip ?? undefined;
          logMessage('IP: ' + ip);

          let userId = {
            commonid: config.params.commonid,
            ip: ip
          };
          logMessage('Generated FreePass UserId: ', userId);
          userIdCb(userId);
        },
        error: (error) => {
          logMessage('Failed to retrieve IP info: ', error);
          userId();
        }
      },
      undefined,
      {method: 'GET'}
    );
  };

  let freepassCb = userIdCb => ipAjaxCb(userIdCb);

  return function (userIdCb) { freepassCb(userIdCb); };
}

/** @type {Submodule} */
export const freepassIdSubmodule = {

  name: MODULE_NAME,

  /* Maybe we need a Global Vendor ID in case targeting EU customers */
  /* gvlid: '', */

  /**
   *
   * @param {Object|string} value
   * @param {SubmoduleConfig|undefined} config
   * @return {(Object|undefined)}
   */
  decode(value, config) {
    logMessage('decoding: ', value);
    logMessage('config: ', config);

    return {
      [MODULE_NAME]: value,
    };
  },

  /**
   * Actions to obtain ID
   *
   * @param {SubmoduleConfig} config
   * @param {ConsentData|undefined} consentData
   * @param {(Object|undefined)} cacheIdObj
   * return {(IdResponse|undefined)} A response object that contains id and/or callback.
   */
  getId(config, consentData, cacheIdObj) {
    if (config.params.commonid === undefined) {
      throw new Error('Missing parameter commonid');
    }

    return {
      // TODO: confirm id information needed
      id: {commonid: config.params.commonid, fuid: generateUUID()},
      callback: createIdCallback(config, consentData, cacheIdObj)
    };
  },
};

submodule('userId', freepassIdSubmodule);
