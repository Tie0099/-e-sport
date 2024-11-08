module.exports = {
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const antStyles = /antd\/.*?\/style.*?/;
      config.externals = [
        ...config.externals,
        (context, request, callback) => {
          if (request.match(antStyles)) return callback();
          callback();
        },
      ];

      config.module.rules.unshift({
        test: antStyles,
        use: 'null-loader',
      });
    }
    return config;
  },
};
