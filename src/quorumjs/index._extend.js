const RawTransactionManager = require("./rawTransactionManager");

const extend = function(web3, apis) {
  let allApis = false;

  if (!apis) {
    allApis = true;
  }

  // eslint-disable-next-line
  web3.quorum = {};

  if (allApis || apis.includes("raft")) {
    const methods = [
      new web3._extend.Method({
        name: "addPeer",
        call: "raft_addPeer",
        params: 1
      }),
      new web3._extend.Method({
        name: "removePeer",
        call: "raft_removePeer",
        params: 1
      }),
      new web3._extend.Method({
        name: "getRole",
        call: "raft_role",
        params: 0
      }),
      new web3._extend.Method({
        name: "leader",
        call: "raft_leader",
        params: 0
      }),
      new web3._extend.Method({
        name: "cluster",
        call: "raft_cluster",
        params: 0
      })
    ];

    web3._extend({
      property: "raft",
      methods
    });

    // eslint-disable-next-line
    web3.quorum.raft = web3.raft;
  }

  if (allApis || apis.includes("istanbul")) {
    const prefix = "istanbul_";

    const methods = [
      new web3._extend.Method({
        name: "getSnapshot",
        call: `${prefix}getSnapshot`,
        params: 1
      }),
      new web3._extend.Method({
        name: "getSnapshotAtHash",
        call: `${prefix}getSnapshotAtHash`,
        params: 1
      }),
      new web3._extend.Method({
        name: "getValdators",
        call: `${prefix}getValidators`,
        params: 1
      }),
      new web3._extend.Method({
        name: "getValdatorsAtHash",
        call: `${prefix}getValidatorsAtHash`,
        params: 1
      }),
      new web3._extend.Method({
        name: "propose",
        call: `${prefix}propose`,
        params: 2
      }),
      new web3._extend.Method({
        name: "discard",
        call: `${prefix}discard`,
        params: 1
      }),
      new web3._extend.Method({
        name: "candidates",
        call: `${prefix}candidates`,
        params: 0
      })
    ];

    web3._extend({
      property: "istanbul",
      methods
    });

    // eslint-disable-next-line
    web3.quorum.istanbul = web3.istanbul;
  }

  if (allApis || apis.includes("eth")) {
    const methods = [
      new web3._extend.Method({
        name: "sendRawPrivateTransaction",
        call: "eth_sendRawPrivateTransaction",
        params: 2
      }),
      new web3._extend.Method({
        name: "storageRoot",
        call: "eth_storageRoot",
        params: 2,
        inputFormatter: [web3._extend.formatters.inputAddressFormatter, null]
      }),
      new web3._extend.Method({
        name: "getQuorumPayload",
        call: "eth_getQuorumPayload",
        params: 1
      })
    ];

    web3._extend({
      property: "eth",
      methods
    });

    // eslint-disable-next-line
    web3.quorum.eth = {
      sendRawPrivateTransaction: web3.eth.sendRawPrivateTransaction,
      storageRoot: web3.eth.storageRoot,
      getQuorumPayload: web3.eth.getQuorumPayload
    };
  }
};

module.exports = {
  extend,
  RawTransactionManager
};
