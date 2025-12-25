````md
# 📦 Telegram Mini Apps Parser (Node.js Package)

This Node.js package provides a simple way to **parse Telegram Mini Apps** using **TypeScript**. It allows you to extend and customize the parsing process by implementing an abstract class called `ParserService`.

---

## 🚀 Features

- **Extendable**: Inherit the abstract `ParserService` to customize parsing logic.
- **Proxy support**: Supports using proxy servers for parsing.
- **Telegram userbot rotation**: Use multiple userbots with different proxies not to be rate-limited by a Mini App.
- **Timeout control**: Manage worker timeouts between parsing iterations.
- **Flexible Configuration**: Configure the bot, authentication endpoint, and more.

---

## 🛠 Tech Stack

- **Node.js**
- **TypeScript**
- **npm**

---

## 📦 Installation

To install the package, use the following command:

```bash
npm install telegram-mini-apps-parser
````

---

## 🧑‍💻 Usage

To use this package, you need to create a new class that extends `ParserService` and implements its methods.

### 1. Import the Required Entities

In your `index.ts` file, import the necessary entities:

```typescript
import { ParserService, UserBot, ParserServiceOptions, SocksProxyAgent } from 'telegram-mini-apps-parser';
```

### 2. Define Your Custom Parser Class

Create a new class that extends `ParserService` and implements its abstract methods. Make sure to call `super()` with the required parameters.

```typescript

## 🎮 Example Code

Here is a full example of how to set up and use the parser:

import { ParserService, UserBot, ParserServiceOptions, WorkerResponse } from 'telegram-mini-apps-parser';

class MyParser extends ParserService<AuthTokenPayload, AuthTokenResponse, WorkerResponse> {
  constructor(userBots: UserBot[], parserName: string, options: ParserServiceOptions) {
    super(userBots, parserName, options);
  }

  * `authToken`: The token for authorization.
  * `initData`: Initialization data sent by Telegram to identify the user in the Mini App.
  * `proxyAgent`: The proxy configuration.
  * `workerParams`: An array of custom parameters that were passed during initialization, if applicable.
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

const options: ParserServiceOptions = {
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
console.log('Parsing completed!');
}).catch((error) => {
console.error('Parsing error:', error);
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

   * `stringSession`: Session string.   //You can use some Telegram userbot library (e.g. GramJS) to obtain it 
   * `apiId`: Your Telegram API ID. //Read more about API_ID and API_HASH: https://core.telegram.org/api/obtaining_api_id
   * `apiHash`: Your Telegram API hash.
   * `username`: The username of the bot.
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

3. **options**: An object of type `ParserServiceOptions`, containing:

   * `botUsername`: The bot's username you are willing to parse
   * `appBaseUrl`: The base URL of the Telegram Mini App (e.g., `https://your-app.com`). To obtain it, open web version of Telegram and use developer's console to identify. Check the URL when the app gets auth user
   * `authEndpoint`: The authentication endpoint (e.g., `/api/v1/auth`).    
   * `authRefererHeader`: The referer header for the authentication request. Check it the same ^
   * `workerTimeout`: Timeout control for workers in milliseconds. Can be:

     * `false`: No timeout. If `false` is provided, then `init()` function call will return a function that can be called any time with custom WorkerResponse provided to generic ParseService class. 
     * `number`: A fixed timeout value.
     * `function`: A function that returns a timeout value based on certain conditions.
   * `userBotDataExpirationTime`: The expiration time of user bot data (defaults to 55 minutes).

Example options:

```typescript
const options: ParserServiceOptions = {
  botUsername: 'myBotUsername',
  appBaseUrl: 'https://your-app.com',
  authEndpoint: '/api/v1/auth',
  authRefererHeader: 'https://your-app.com/login',
  workerTimeout: 10000,  // 10 seconds timeout
  userBotDataExpirationTime: 3300000,  // 55 minutes
};
```

### 4. Instantiate and Run Your Parser

Once you've defined your parser class, instantiate it, call the `init()` method to start the parser, and run the parsing process.

```typescript
const myParser = new MyParser(userBots, 'MyCustomParser', options);

// Initialize the parser:
//1. If workerTimeout is either 'number' or a function that returns a 'number', it simply starts parsing iterations. 
myParser.init().then(() => {
  console.log('Parsing started!');
}).catch((error) => {
  console.error('Initialization error:', error);
});

//2. If workerTimeout is 'false', it returns a function that you can call with custom params that will be available as a rest param in the implemented worker function.
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

## 🧠 `ParserService` as a Generic Class

`ParserService` is a **generic class** with three parameters that you need to provide:

1. **AuthTokenPayload**: The data that needs to be sent to the endpoint for authentication in the Telegram Mini App.
2. **AuthTokenResponse**: The data returned by the Telegram Mini App in response to a successful authentication. This usually contains the Telegram account information and the JWT token.
3. **WorkerResponse**: The custom response that the implemented worker function returns. This can be any custom data depending on the parsing requirements.

---

## 📝 Functions to Implement

To fully customize your parser, you need to implement the following methods:

### 1. **worker()** — Custom worker function

This function will be automatically passed the following arguments:

* `authToken`: The token for authorization.
* `initData`: Initialization data sent by Telegram to identify the user in the Mini App.
* `proxyAgent`: The proxy configuration.
* `workerParams`: An array of custom parameters that were passed during initialization, if applicable.

```typescript
worker<WorkerParams extends Array<any>>(authToken: string, initData: string, proxyAgent: SocksProxyAgent, ...workerParams: WorkerParams): Promise<void> {
  throw new Error("Method not implemented.");
}
```

### 2. **extractAuthToken()** — Extract the authorization token

Implement this function to extract the token from the `AuthTokenResponse` returned by the Telegram Mini App.

```typescript
extractAuthToken(authTokenResponse: AuthTokenResponse): Promise<string> {
  throw new Error("Method not implemented.");
}
```

### 3. **formAuthTokenPayload()** — Create the payload for authorization

This function is responsible for creating the payload data required for obtaining the auth token.

```typescript
formAuthTokenPayload(initData: string, userData: UserData): Promise<AuthTokenPayload> {
  throw new Error("Method not implemented.");
}
```

### 4. **getCustomHeaders()** — Create custom headers

If specific headers are required by the Mini App, you should implement this function to return them. If no custom headers are needed, simply return an empty object.

```typescript
getCustomHeaders(initData: string): Promise<HeadersInit> {
  throw new Error("Method not implemented.");
}
```

---