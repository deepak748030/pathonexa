/**
 * Metro shim for `react-native-ping`.
 *
 * `react-native-thermal-printer` imports `react-native-ping` for optional
 * network/IP printing (PathoNexa only uses Bluetooth), so we stub it here
 * to avoid the Metro "Unable to resolve react-native-ping" bundling error.
 */
const ping = () => Promise.resolve(false);

module.exports = { ping, default: { ping } };
