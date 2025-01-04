const { getDefaultConfig } = require('@react-native/metro-config');
const { mergeConfig } = require('metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'), // This transforms SVGs into components
  },
  resolver: {
    assetExts: ['svg', ...getDefaultConfig().resolver.assetExts], // Add 'svg' to asset extensions
    sourceExts: ['svg', ...getDefaultConfig().resolver.sourceExts], // Add 'svg' to source extensions
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), // Add this line
config)