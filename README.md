### Remix Quorum Plugin

------------

This is Remix IDE plugin to handle private transaction for quorum. This make developer test quorum's main feature easily in Remix IDE without cakeshop installation.

### Features

This plugin supports:

- **Deploy & send transaction with privateFor parameter.**

Plugin supports almost all of features in original `Run & Deploy transaction` plugin in ide such as:

- Connect to geth node (also quorum node)
- Setting account, gas limit, transfer value
- Deploy smart contract which is compiled on remix ide
- Copy address, encoded parameter
- Supports ABIEncoderV2 type such as tuple
- Supports JSON Treeview to check results of send transaction's more easily

And not support:

- Transactions recorded feature
- Sign a message using account key



### Prerequisite

- Running quorum geth nodes

  - Without cors policy (--rpccorsdomain "*" option) to get connection with remix ide

- nodejs & npm

  

### Installation

1. Clone repository

2. Enter into directory using command line

3. `npm install` 

4. (if you changes code and want to rebuild, `npm run build`)

5. `npm run start`

6. In Remix IDE plugin manager, click "Connect to a Local Plugin" 

7. Input plugin name (such as "Quorum"), display name, Url (http://localhost:8081/index.html)

   Check network, solidity, vyper in notifications group.
   Check "Side Panel" in Location in remix group.
   Click OK

8. New tab will appears in side panel.



### Usage

Basically, usage is same with original deploy & transaction tab in remix ide. 

Input the privateFor field to publish only to specific nodes before deploy or send transaction. This field only used when deploying contract or sending transactions (orange buttons). To input multiple values in privateFor field, just input public keys separated by commas.

If other node which can't see contract try to call or send transaction, gas error will occured. 



