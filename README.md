# express-color-logger



A colorized, security-conscious HTTP request logger for Express, powered by [Morgan](https://www.npmjs.com/package/morgan).



See HTTP methods, response status codes, and request durations at a glance.



## Features



- Color-coded HTTP methods inspired by API development tools.

- Color-coded HTTP response status codes.

- Response-time highlighting for slow requests.

- Query strings excluded from logged URLs by default.

- Request bodies are never logged.

- Automatic color detection, respecting the `NO_COLOR` environment variable.

- Configurable output stream and response-time thresholds.

- TypeScript support with generated type declarations.



## Requirements



- Node.js 18 or newer

- Express 4.18 or newer

- Morgan 1.10 or newer



## Installation



```bash

npm install express-color-logger express morgan

```



## Quick start



```ts

import express from 'express';

import { colorLogger } from 'express-color-logger';



const app = express();



app.use(colorLogger());



app.get('/', (_req, res) => {

  res.send('Hello, world!');

});



app.listen(3000, () => {

  console.log('Server running on port 3000');

});

```



## Configuration



```ts

app.use(

  colorLogger({

    colorize: true,

    slowThresholdMs: 500,

    verySlowThresholdMs: 1000,

  }),

);

```



| Option | Type | Default | Description |

|---|---|---|---|

| `colorize` | `boolean` | Automatically detected | Enables or disables ANSI colors. |

| `slowThresholdMs` | `number` | `500` | Duration at or above which requests are considered slow. |

| `verySlowThresholdMs` | `number` | `1000` | Duration above which requests are considered very slow. |

| `stream` | Writable-like object | `process.stdout` | Destination for log output; must provide a `write` method. |



Both thresholds must be non-negative finite numbers. `verySlowThresholdMs` must be greater than or equal to `slowThresholdMs`.



## Color scheme



| Log field | Color behavior |

|---|---|

| HTTP method | GET: green; POST: yellow; PUT: blue; PATCH: purple; DELETE: red; other methods: gray |

| Response status | 2xx: green; 3xx: blue; 4xx: yellow; 5xx: red |

| Response duration | Below the slow threshold: cyan; slow: yellow; very slow: red |



Colors may look different depending on your terminal.



## Security notes



- Query strings are omitted from the displayed URL to help prevent accidental exposure of tokens and other sensitive values.

- Request bodies are not logged.

- URL paths can still contain sensitive information. Avoid putting secrets or personal information in path segments.

- This middleware does not redact data from other middleware's logs.



## Development



```bash

npm install

npm run build

npm run typecheck

npm test

```



## License



MIT

