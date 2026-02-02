___
**Kuroscan** - The bot that offers fast reclaims over idle accounts

![Static Badge](https://img.shields.io/badge/demo-live-brightgreen%3F)  ![Static Badge](https://img.shields.io/badge/framework-grammy-blue)  ![Static Badge](https://img.shields.io/badge/Licence-MIT-orange)  ![Static Badge](https://img.shields.io/badge/blockchain-solana-%238C0EEB)  ![Static Badge](https://img.shields.io/badge/platform-telegram-%2385DAF4)

What is Kuroscan 🤔?

Kuroscan is a telegram bot that **creates sponsored system accounts**, **tracks rent-exempt balances**, and **safely reclaims unused SOL** — without risking accidental rent drains.

In other words , Kuroscan is a **Solana account sponsorship and lifecycle management system**

___
##### Why Kuroscan ?

| Params     | Dashboard                                                                                                                        | Kuroscan                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| UI         | Users have to open browsers preferably on desktop for better UI                                                                  | Offers a **Simple** **telegram** **bot** with easy commands and an interactive UI                                             |
| Recyclable | Developers will be required to add sensitive info , retweak **UI** **components**                                                | Developers can simply clone the bot , refractor the code however they see fit and run on their **preferred** hosting platform |
| Fast       | Dashboards require a whole web page to be loaded in order to view data , this can be slower on low-end devices and slow networks | Kuroscan replies almost immediately thanks to the fast responses via Telegram Servers.Responses are as little as bytes.       |
|            |                                                                                                                                  |                                                                                                                               |


```text
 ------------------                       -------------------------
 |   KORA NODE    |  -------------------  |        KUROSCAN       |
 ------------------                       -------------------------
		|
		|
		|
		|
		|    Kora sponsors the account
		|
		|
		|
		|
		|
------------------------
|	Sponsored Account  |
------------------------								
```

___
To run Kuroscan you'll need you need to visit [BotFather](https://t.me/botfather) to acquire your **own** bot token

###### Prerequisites

- [Nodejs](https://nodejs.org/en) v22 or later
- Basic Knowledge of telegram bots, typescript, Solana
- A telegram account

##### Quick Start

Clone the repository

```shell
git clone https://github.com/Mofe-Bankole/kuroscan
```

Install Dependencies

```
npm install
```

Add bot token to env file

```env
BOT_TOKEN =xxxxxxxxxxxxxxxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Run the bot 

```
npm run start
```

Commands

| Command      | Parameters | Description                                                                                                                                     |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| /stats       | none       | Shows you the bots current stats                                                                                                                |
| /create      | none       | Creates a new system account signed by the operator keypair                                                                                     |
| /reclaim     | public key | Reclaims rent from supplied account<br>(**NOTE** : This will only work if the operator created this account and you have the accounts keypair ) |
| /reclaim-all | none       | Reclaims rent from all earlier created / supplied accounts                                                                                      |
| /verify      | public key | Checks if an account can be reclaimed and shows all info concerning relclaiment                                                                 |
| /info        | public key | Scans the blockchain for all info about the supplied account and returns as a message                                                           |


> [!NOTE] NOTE
> Accounts created by Kuroscan can only be reclaimed if the account and the operator sign the operations

#### Responses

/stats --- Returns the bots stats

```text

```