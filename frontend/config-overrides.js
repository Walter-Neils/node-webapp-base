module.exports = function override(config, env) {
    console.log('override')
    let loaders = config.resolve
    loaders.fallback = {
        "fs": false,
        "tls": false,
        "net": false,
        "assert": require.resolve("assert/"),
        "buffer": require.resolve("buffer/"),
        "stream-browserify": require.resolve("stream-browserify"),
        "stream": require.resolve("stream-browserify"),
    }

    return config
}
