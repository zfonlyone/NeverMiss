module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      '@babel/plugin-transform-export-namespace-from',
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@components': './app/components',
            '@screens': './app/screens',
            '@services': './app/services',
            '@models': './app/models',
            '@assets': './assets',
          },
        },
      ],
    ],
    env: {
      production: {
        plugins: [
          'transform-remove-console',
        ]
      }
    }
  };
}; 