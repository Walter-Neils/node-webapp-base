module.exports = function override(config, env) {

    const newConfig = {
        ...config,
        resolve: {
            ...config.resolve,
            fallback: {
                ...config.resolve.fallback,
                "buffer": require.resolve("buffer/"),
            }
        }
    };
    return newConfig;
};