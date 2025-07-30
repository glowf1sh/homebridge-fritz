/**
 * Axios Digest Authentication Interceptor
 * 
 * @url https://github.com/glowf1sh/homebridge-fritz-new
 * @license MIT
 */

const crypto = require('crypto');

/**
 * Adds Digest authentication logic to an Axios instance.
 * @param {import('axios').AxiosInstance} axiosInstance The Axios instance to enhance.
 * @param {object} options Credentials { username, password }.
 */
function addDigestAuthInterceptor(axiosInstance, options) {
  // Digest authentication state (held through closure)
  let digestState = null;

  const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

  const parseAuthHeader = (header) => {
    const parts = header.substring(header.indexOf(' ') + 1).split(',').map(p => p.trim());
    const details = {};
    for (const part of parts) {
      const [key, value] = part.split(/=(.*)/s);
      details[key] = value.replace(/"/g, '');
    }
    return details;
  };

  // === REQUEST INTERCEPTOR ===
  // Adds the auth header if we already have one.
  axiosInstance.interceptors.request.use((config) => {
    if (digestState && digestState.authHeader) {
      config.headers['Authorization'] = digestState.authHeader;
    }
    return config;
  });

  // === RESPONSE ERROR INTERCEPTOR ===
  // Handles the 401 challenge from the server.
  axiosInstance.interceptors.response.use(
    (response) => response, // Pass through successful responses
    async (error) => {
      const { config, response } = error;

      // Only react to 401 errors with Digest challenge
      if (!response || response.status !== 401 || !response.headers['www-authenticate']) {
        return Promise.reject(error);
      }

      const authDetails = parseAuthHeader(response.headers['www-authenticate']);
      
      // If nonce changed or we don't have one yet, reset state
      if (!digestState || digestState.nonce !== authDetails.nonce) {
        digestState = { ...authDetails, nc: 0 };
      }

      // Increment nonce counter
      digestState.nc += 1;
      const ncHex = digestState.nc.toString(16).padStart(8, '0');
      const cnonce = crypto.randomBytes(8).toString('hex');

      const HA1 = md5(`${options.username}:${digestState.realm}:${options.password}`);
      const HA2 = md5(`${config.method.toUpperCase()}:${config.url}`);
      const responseHash = md5(`${HA1}:${digestState.nonce}:${ncHex}:${cnonce}:${digestState.qop}:${HA2}`);

      // Build and save the Authorization header for the next request
      digestState.authHeader = `Digest username="${options.username}", realm="${digestState.realm}", nonce="${digestState.nonce}", uri="${config.url}", qop=${digestState.qop}, nc=${ncHex}, cnonce="${cnonce}", response="${responseHash}", opaque="${digestState.opaque}"`;
      
      // Retry the original request with the new header
      config.headers['Authorization'] = digestState.authHeader;
      return axiosInstance(config);
    }
  );
}

module.exports = { addDigestAuthInterceptor };