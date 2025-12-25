# 📦 Telegram Mini Apps Parser (Node.js Package)

This Node.js package provides a simple way to **parse Telegram Mini Apps** using **TypeScript**. It allows you to extend and customize the parsing process by implementing an abstract class called `TelegramMiniAppParser`.

---

🧩 Project Overview

This project automatically retrieves initData from Telegram and authorizes your userbot to access the desired Telegram Mini App. Once authorized, you can implement custom logic in the worker function to make requests as a regular Telegram user.

---

## 🚀 Features

- **Extendable**: Inherit the abstract `TelegramMiniAppParser` to customize parsing logic.
- **Proxy support**: Supports using proxy servers for parsing.
- **Telegram userbot rotation**: Use multiple userbots with different proxies not to be rate-limited by a Mini App.
- **Timeout control**: Manage worker timeouts between parsing iterations.
- **Flexible Configuration**: Configure the bot, authentication endpoint, and more.

---

## 🛠 Tech Stack

- **Node.js**
- **TypeScript**
- **GramJS** for Telegram userbot authorization
- **Winston** for logging purposes

---

📚 Terminology
Few terms if you are not familiar with TMA's or Telegram userbots.

1. Telegram Mini App (TMA)

A Telegram Mini App (TMA) is a lightweight web application integrated into Telegram. It allows users to interact with services directly within Telegram without leaving the app, offering features like games, bots, and more.

2. initData

initData is the initialization data sent by Telegram to the Mini App. It contains user-specific information, such as session details, that helps identify and authenticate the user within the app.

3. userBot

A userBot is a bot that mimics a regular Telegram user to interact with the Telegram API. Unlike typical bots, userBots simulate user actions like sending messages and joining groups, often used for automation or scraping within Telegram. To use Telegram account as a userbot you will need apiId and apiHash. Read more: https://core.telegram.org/api/obtaining_api_id

---

## 📦 Installation

To install the package, use the following command:

```bash
npm install telegram-TMAs-parser
````

---

## 🧑‍💻 Usage

To use this package, you need to create a new class that extends `TelegramMiniAppParser` and implements its methods.

### 1. Import the Required Entities

In your file, import the necessary entities:

```typescript
import { TelegramMiniAppParser, TelegramMiniAppParserOptions, UserBot, UserData, SocksProxyAgent  } from 'telegram-TMAs-parser';
```

### 2. Define Your Custom Parser Class

Create a new class that extends `TelegramMiniAppParser` and implements its abstract methods. Make sure to call `super()` with the required parameters.

```typescript
## 🎮 Example Code

Here is a full example of how to set up and use the parser:

import { TelegramMiniAppParser, TelegramMiniAppParserOptions, UserBot, UserData, SocksProxyAgent } from 'telegram-TMAs-parser';

class MyParser extends TelegramMiniAppParser<AuthTokenPayload, AuthTokenResponse, WorkerResponse> {
  constructor(userBots: UserBot[], parserName: string, options: TelegramMiniAppParserOptions) {
    super(userBots, parserName, options);
  }

  async worker(authToken: string, initData: string, proxyAgent: SocksProxyAgent, ...workerParams: any[]): Promise<void> {
    console.log('Running worker...');
    // Implement your custom worker logic here
  }

  async extractAuthToken(authTokenResponse: AuthTokenResponse): Promise<string> {
    // Extract auth token from the response
    return authTokenResponse.token;
  }

  async formAuthTokenPayload(initData: string, userData: UserData): Promise<AuthTokenPayload> {
    // Form the authentication payload
    return { token: 'your-auth-token' };
  }

  async getCustomHeaders(initData: string): Promise<HeadersInit> {
    // Create custom headers, or return an empty object if not needed
    return {};
  }
}

const userBots: UserBot[] = [
  {
    stringSession: 'yourStringSessionHere',
    apiId: 123456,
    apiHash: 'yourApiHashHere',
    username: 'yourBotUsername',
    proxy: {
      ip: 'proxyIpHere',
      port: 'proxyPortHere',
      username: 'proxyUser',
      password: 'proxyPassword'
    }
  }
];

const options: TelegramMiniAppParserOptions = {
  botUsername: 'myBotUsername',
  appBaseUrl: 'https://your-app.com',
  authEndpoint: '/api/v1/auth',
  authRefererHeader: 'https://your-app.com/login',
  workerTimeout: 10000,  // 10 seconds timeout
  userBotDataExpirationTime: 3300000,  // 55 minutes
};

const myParser = new MyParser(userBots, 'MyCustomParser', options);

// Initialize the parser (this will start the parsing process)
myParser.init().then(() => {
console.log('Parsing started!');
}).catch((error) => {
console.error('Initialization error:', error);
});

// Optionally, stop the worker after parsing
myParser.shutdown().then(() => {
console.log('Worker has been shut down.');
}).catch((error) => {
console.error('Shutdown error:', error);
});

```

### 3. Pass the Required Parameters to `super()`

When calling `super()`, you need to pass the following parameters:

1. **userBots**: An array of `UserBot` objects, where each object contains:

   * `stringSession`: Session string. You can use Telegram userbot libraries (e.g. GramJS) to obtain it. It is used to authorize userbot wihtout asking the mobile code each time
   * `apiId`: Your Telegram API ID. 
   * `apiHash`: Your Telegram API hash.
   * `username`: The username of the userbot.
   * `proxy`: SOCKS5 Proxy configuration.

   Example:

   ```typescript
   const userBots: UserBot[] = [
     {
       stringSession: 'yourStringSessionHere',
       apiId: 123456,
       apiHash: 'yourApiHashHere',
       username: 'yourUserBotUsername',
       proxy: {
         ip: 'proxyIpHere',
         port: 'proxyPortHere',
         username: 'proxyUser', //Proxy authentication username
         password: 'proxyPassword'  //Proxy authentication password
       }
     }
   ];
   ```

2. **parserName**: A string representing the name of your parser (for logging purposes).

3. **options**: An object of type `TelegramMiniAppParserOptions`, containing:

   * `botUsername`: Telegram bot's username that you use to open the TMA that you are willing to parse
   * `appBaseUrl`: The base URL of the Telegram Mini App (e.g., `https://backend.TMA.com`). To obtain it, open web version of Telegram and use developer's console to identify the URL that is used by the TMA for requests
   * `authEndpoint`: The authentication endpoint (e.g., `/api/v1/auth`).    
   * `authRefererHeader`: The referer header for the authentication request. You can get it by inspecting requests to the authentication endpoint of the TMA
   * `workerTimeout`: Timeout control for workers in milliseconds. Keep in mind that the timeout is only set after the worker finished its job to avoid parallel jobs running.

     * `false`: No timeout. If `false` is provided, then `init()` function call returns a function that can be called any time to launch worker. This function returns `WorkerResponse` in case of success or `undefined` in case of failure job's iteration. `WorkerParams` can be passed to this function and will be available in your custom `worker()` function as rest parameters. 
     * `number`: A fixed timeout value. 
     * `function`: A function that returns a timeout value based on certain conditions.
   * `userBotDataExpirationTime`: The expiration time (in ms) of userbot data. Your TMA's JWT TTL. Defaults to 55 minutes. 

Example options:

```typescript
const options: TelegramMiniAppParserOptions = {
  botUsername: 'MiniApp_bot',
  appBaseUrl: 'https://backend.TMA.com',
  authEndpoint: '/api/v1/auth',
  authRefererHeader: 'https://TMA.com/',
  workerTimeout: 10000,  // 10 seconds timeout
  userBotDataExpirationTime: 3300000,  // 55 minutes
};
```

### 4. Instantiate and Run Your Parser

Once you've defined your parser class, instantiate it, call the `init()` method to start the parser.

```typescript
const myParser = new MyParser(userBots, 'MyCustomParser', options);

```
If workerTimeout is either `number` or a function that returns a `number`, `init()` call simply starts parsing iterations.
```typescript
myParser.init().then(() => {
  console.log('Parsing started!');
}).catch((error) => {
  console.error('Initialization error:', error);
});
```

If `false` is provided, then `init()` function call returns a function that can be called any time to launch worker. This function returns `Promise<WorkerResponse | undefined>`. `WorkerResponse` is returned in case of success and `undefined` is returned in case of unsuccessful job iteration. `WorkerParams` can be passed to this function and will be available in your custom `worker()` function as rest parameters. 
```typescript
const parse: (...workerParams: WorkerParams) => Promise<WorkerResponse | undefined> = await myParser.init();
const parsingResponse: WorkerResponse | undefined = await parse(myCustomParam, anotherCustomParam);
```

### 5. Shutting Down the Worker (Optional)

If you are using `workerTimeout` to control the frequency of the parsing, and you want to stop the worker after finishing the task, you should call the `shutdown()` method.

Example:

```typescript
// After completing parsing, call shutdown to stop the worker
myParser.shutdown().then(() => {
  console.log('Worker has been shut down.');
}).catch((error) => {
  console.error('Shutdown error:', error);
});
```

---

## 🧠 `TelegramMiniAppParser` as a Generic Class

`TelegramMiniAppParser` is a **generic class** with three parameters that you need to provide:

1. **AuthTokenPayload**: The data that needs to be sent to the endpoint for authentication in the Telegram Mini App. You can investigate it by inspecting the requests made while opening the Telegram Mini App in Telegram Web.  
2. **AuthTokenResponse**: The data returned by the Telegram Mini App in response to a successful authentication. This usually contains the Telegram account information and the JWT token. Similarly, you can inspect in Telegram Web while opening the TMA. 
3. **WorkerResponse**: The custom response that the implemented worker function returns. This can be any custom data depending on the parsing requirements.

---

## 📝 Functions to Implement

To fully customize your parser, you need to implement the following methods:

### 1. **worker()** — Custom worker function

The following arguments will be automatically passed to this function in case you need any of them for your custom worker logic (e.g. making requests to the TMA)

* `authToken`: The token for authorization. Usually, a JWT. 
* `initData`: Initialization data sent by Telegram to identify the user in the Mini App.
* `proxyAgent`: The proxy configuration.
* `workerParams`: An array of custom parameters that will be passed if `workerTimeout` is set to `false`. 

```typescript
async worker<WorkerParams extends Array<any>>(authToken: string, initData: string, proxyAgent: SocksProxyAgent, ...workerParams: WorkerParams): Promise<void> {
  throw new Error("Method not implemented.");
}
```

### 2. **extractAuthToken()** — Extract the authorization token

Implement this function to extract the token from the `AuthTokenResponse` returned by the Telegram Mini App. You should return a `string`.

```typescript
async extractAuthToken(authTokenResponse: AuthTokenResponse) {
    return `Bearer ${authTokenResponse.JWT}`;
}
```

### 3. **formAuthTokenPayload()** — Create the payload for authorization

This function is responsible for creating the payload data required for obtaining the auth token. You should return a formed data that will be sent to the TMA to authenticate a userbot.

```typescript
## 🎮 Example Code
async formAuthTokenPayload(_: string, userData: UserData) {
    return userData;
}

//UserData type
interface UserData {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    language_code: string;
    is_premium: boolean;
    allows_write_to_pm: boolean;
    photo_url: string;
}
```

### 4. **getCustomHeaders()** — Create custom headers

If specific headers are required by the Mini App, you should implement this function to return them. If no custom headers are needed, simply return an empty object.

```typescript
## 🎮 Example Code
async getCustomHeaders(initData: string) {
  return {
    'X-Init-Data': initData
  };
}
```

---