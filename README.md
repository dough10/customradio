# customradio V:1.10.5

An online radio station browser with the ability to export a radio.txt file for use in Hiby digital audio players.

![Mobile](src/screenshots/375x667.png)

![desktop](src/screenshots/1280x720.png)

> Sourcecode for <https://customradio.dough10.me>

Hosts a database of [Icecast](https://icecast.org/) stations so users can listen and add them to a custom list. Users can download the list in .txt format for use in a [Hiby](https://store.hiby.com/) digital audio player.

## Requires

- **MongoDB**
- **Redis**

### Environment Variables

- **DB_HOST** = *Mongodb connection url*
    > mongodb://username:password@localhost:27017
- **REDIS_HOST** = *redis server address*
    > 127.0.0.1
- **REDIS_PORT** = *redis server port*
    > 6379
- **REDIS_PASSWORD** = *password for redis server*
    > supersecretpassword123
- **TOKEN** = *access token for submissing to /csp-report endpoint*
    > proxy_set_header Authorization "Bearer abcdefg123456"

### NPM Dependencies

- **axios**: *^1.7.4*
- **compression**: *^1.7.4*
- **dotenv**: *^16.4.5*
- **express**: *^4.19.2*
- **express-validator**: *^7.1.0*
- **he**: *^1.2.0*
- **ioredis**: *^5.4.1*
- **mime-types**: *^2.1.35*
- **mongodb**: *^6.8.0*
- **multer**: *^1.4.5-lts.1*
- **node-schedule**: *^2.1.1*
- **prom-client**: *^15.1.3*
- **validator**: *^13.12.0*
- **xml2js**: *^0.6.2*

### NPM Dev Dependencies

- **@babel/core**: *^7.24.9*
- **@babel/preset-env**: *^7.24.8*
- **@open-wc/testing**: *^4.0.0*
- **@web/test-runner**: *^0.18.2*
- **@webpack-cli/generators**: *^3.0.7*
- **axios-mock-adapter**: *^2.0.0*
- **babel-loader**: *^9.1.3*
- **chai**: *^5.1.1*
- **clean-webpack-plugin**: *^4.0.0*
- **copy-webpack-plugin**: *^12.0.2*
- **css-loader**: *^7.1.2*
- **css-minimizer-webpack-plugin**: *^7.0.0*
- **html-critical-webpack-plugin**: *^2.1.0*
- **html-webpack-plugin**: *^5.6.0*
- **jsdoc-to-markdown**: *^8.0.3*
- **jshint**: *^2.13.6*
- **mini-css-extract-plugin**: *^2.9.0*
- **mocha**: *^10.7.3*
- **terser-webpack-plugin**: *^5.3.10*
- **version-incrementer**: *^0.1.1*
- **webpack**: *^5.93.0*
- **webpack-cli**: *^5.1.4*
- **webpack-merge**: *^6.0.1*

### contact me

<admin@dough10.me>
