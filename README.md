# customradio V:1.13.3

An online radio station browser with the ability to create a radio.txt file for use in Hiby digital audio players.

> Sourcecode for <https://radiotxt.site>

Hosts a database of [Icecast](https://icecast.org/) stations so users can listen and add them to a custom list. Users can download the list in .txt format for use in a [Hiby](https://store.hiby.com/) digital audio player.

## Environment Variables

- **LOG_LEVEL** = *console and file log level: Defaults to INFO*

- **BLACKLIST** = *IP addresses blocked from reporting playmin or inList and genre searches*

- **SESSION_SECRET** = *Session key*

- **COOKIE_SECRET** = *Cookie key*

- **REDIS_URL** = *url for connectiong to redis instance*

- **REDIS_PASSWORD** = *password for redis instance*

- **MONGODB_URL** = *mongodb instance url*

- **WORKOS_API_KEY** = *workod api key*

- **WORKOS_CLIENT_ID** = *workos client id*

- **OPENAI_API_KEY** = *openai api key (used for creating translation files, not needed or used in finished container)*

- **ADMIN_ID** = *workos userid of site administrator*



### contact me

<admin@dough10.me>