const Web3 = require('web3')
const quorumjs = require('./quorumjs')
const remixPlugin = require('remix-plugin')
const { createIframeClient } = remixPlugin
const devMode = { port: 8080 }
const client = createIframeClient({ devMode })
const txHelper = require('./txHelper')
const copy = require('copy-text-to-clipboard')
const ethers = require('ethers')
const ethJSUtil = require('ethereumjs-util')
const $ = require('jquery')
require('./index.css')

import JSONFormatter from 'json-formatter-js'

// global variables
let compileResult
let fileName
let provider 
let qweb3
let contracts = {}
let contractMap = []

// Listen on remix ide event
client.on(
  'solidity',
  'compilationFinished',
  (file, source, languageVersion, data) => {
    fileName = file
    compileResult = { data, source }
    console.log(compileResult)
    try {
    for(let file in compileResult.data.contracts) {
      let fileContracts = compileResult.data.contracts[file]
      for(let contractName in fileContracts) {
        let key = contractName + ":" + file
        contracts[key] = fileContracts[contractName]
        contracts[key].contractName = contractName
        contracts[key].file = file
        contracts[key].key = key
    	}
    }
    let contractItemTag = "";
    for(let key in contracts) {
      let file = contracts[key].file
      let contractName = contracts[key].contractName
      let displayName = contractName + " (" + file + ")";
    	contractItemTag += '<option value="'+ key +'">'+displayName+'</option>';
    }
    $("#contracts").html(contractItemTag)
    $("#contracts").trigger("change")
    } catch (e) {console.error(e)}
  },
)


client.on('network', 'providerChanged', async (provider, e) => {
	console.log(await client.call('network', 'detectNetwork'))  
})


// functions for ui action

function getSelectedAccount() {
  let account = $("#txorigin").find("option:selected").val()
  return account
}

function getSelectedContract() {
  let selected = $("#contracts").val()
  return contracts[selected]
}

function omitAddress(address) {
  return address.substring(0, 6) + "..." + address.substring(address.length - 5)
}

global.connectProvider = async function() {
  provider = $("#provider").val()
  global.qweb3 = qweb3 = new Web3(
    new Web3.providers.HttpProvider(provider)
  )
  quorumjs.extend(qweb3)
  console.log(qweb3.version)

  let accountBalance = {}
  let accounts = await qweb3.eth.getAccounts()
  for(let i in accounts) {
    let account = accounts[i]
    let balance = await qweb3.eth.getBalance(account)
    accountBalance[account] = balance;
  }

  let accountTag = `${Object.keys(accountBalance).map((address)=>{
    return `<option value="${address}">${omitAddress(address)} (${(accountBalance[address] / 1e+18).toFixed(2)} ether)</option>`
  })}`

  $("#txorigin").html(accountTag)
}

function emptyInputs (inputArray) {
  var valArray = inputArray
  for (var k = 0; k < valArray.length; k++) {
    valArray[k].value = ''
  }
  this.basicInputField.value = ''
}


function makeMultiVal (inputString, inputArray) {
  if (inputString) {
    // inputString = inputString.replace(/(^|,\s+|,)(\d+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted number by quoted number
    inputString = inputString.replace(/(^|,\s+|,)(0[xX][0-9a-fA-F]+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted hex string by quoted hex string
    var inputJSON = JSON.parse('[' + inputString + ']')
    var multiInputs = inputArray
    for (var k = 0; k < multiInputs.length; k++) {
      if (inputJSON[k]) {
        multiInputs[k].value = JSON.stringify(inputJSON[k])
      }
    }
  }
}

function getMultiValsString (inputArray) {
  var valArray = inputArray
  var ret = ''
  var valArrayTest = []

  for (var j = 0; j < valArray.length; j++) {
    if (ret !== '') ret += ','
    var elVal = valArray[j].value
    valArrayTest.push(elVal)
    // elVal = elVal.replace(/(^|,\s+|,)(\d+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted number by quoted number
    elVal = elVal.replace(/(^|,\s+|,)(0[xX][0-9a-fA-F]+)(\s+,|,|$)/g, '$1"$2"$3') // replace non quoted hex string by quoted hex string
    try {
      JSON.parse(elVal)
    } catch (e) {
      elVal = '"' + elVal + '"'
    }
    ret += elVal
  }
  var valStringTest = valArrayTest.join('')
  if (valStringTest) {
    return ret
  } else {
    return ''
  }
}

function getMultiValsArray (inputArray) {
  var valArray = inputArray
  var ret = []
  for (var j = 0; j < valArray.length; j++) {
    var elVal = valArray[j].value
    try {
      var parsed = JSON.parse(elVal)
      ret.push(parsed)
    } catch(e) {
      ret.push(elVal)  
    }
  }
  return ret
}

function getGasLimit() {
  return $("#gasLimit").val()
}

function getValueWei() {
  const number = $('#value').val()
  const select = $('#unit option:selected')
  const selectedUnit = select.data("unit")
  let unit = 'ether' // default
  if (['ether', 'finney', 'gwei', 'wei'].indexOf(selectedUnit) >= 0) {
    unit = selectedUnit
  }
  return global.qweb3.utils.toWei(number, unit)
}


function getFunctionProto (funABI) {
  if(funABI.type == 'fallback')
    return 'fallback'

  return funABI.name + '(' + funABI.inputs.map((value) => {
      if (value.components) {
        let fullType = txHelper.makeFullTypeDefinition(value)
        return fullType.replace(/tuple/g, '') // return of makeFullTypeDefinition might contain `tuple`, need to remove it cause `methodIdentifier` (fnName) does not include `tuple` keyword
      } else {
        return value.type
      }
    }).join(',') + ')'
}

function showTooltip(message) {
  let tooltip = $("#tooltip")
  tooltip.text(message)
  tooltip.css("left", (document.documentElement.clientWidth - tooltip.width()) / 2)
  tooltip.css("top", document.documentElement.scrollTop + (document.documentElement.clientHeight - tooltip.height()) / 2)
  tooltip.fadeIn('fast', function () {
    $(this).delay(1500).fadeOut('fast');
  });
}

function getPrivateForArray() {
  let privateForString = $("#privateFor").val()
  if(privateForString.length == 0)
    return null

  let privateForArray = privateForString.split(",")  
  return privateForArray
}

function deployLog(message, append) {
  if(append)
    $("#deployMessage").html($("#deployMessage").text() + "<br/>" + message)
  else
    $("#deployMessage").text(message)
}

function decodeResponse (response, fnabi) {
  // Only decode if there supposed to be fields
  if (fnabi.outputs && fnabi.outputs.length > 0) {
    try {
      var i

      var outputTypes = []
      for (i = 0; i < fnabi.outputs.length; i++) {
        var type = fnabi.outputs[i].type
        outputTypes.push(type.indexOf('tuple') === 0 ? helper.makeFullTypeDefinition(fnabi.outputs[i]) : type)
      }

      if (!response.length) response = new Uint8Array(32 * fnabi.outputs.length) // ensuring the data is at least filled by 0 cause `AbiCoder` throws if there's not engouh data
      // decode data
      var abiCoder = new ethers.utils.AbiCoder()
      var decodedObj = abiCoder.decode(outputTypes, response)

      var json = {}
      for (i = 0; i < outputTypes.length; i++) {
        var name = fnabi.outputs[i].name
        json[i] = outputTypes[i] + ': ' + (name ? name + ' ' + decodedObj[i] : decodedObj[i])
      }

      return json
    } catch (e) {
      return { error: 'Failed to decode output: ' + e }
    }
  }
  return {}
}


function addDeployedContract(key, address, name, abi) {
  let actions = []
  txHelper.sortAbiFunction(abi)
  $.each(abi, (i, funABI) =>{
    if (funABI.type !== 'function' && funABI.type !== 'fallback') {
      return
    }

    actions.push({
      title: funABI.name + (funABI.payable ? ' (payable)' : ''),
      name: funABI.type !== 'fallback' ? funABI.name : '(fallback)',
      proto: getFunctionProto(funABI),
      inputs: funABI.type !== 'fallback' ? funABI.inputs : [],
      view: funABI.type !== 'fallback' ? funABI.constant : false,
      argsStr: txHelper.inputParametersDeclarationToString(funABI.inputs)
    })
  })

  let contractInstance = {
    key,
    address,
    name,
    actions
  }

  contractMap[address] = contractInstance;
  let contractInstanceTag = tplContractInstance(contractInstance)
  $("#instanceContainer").append($(contractInstanceTag))

}

global.deployContract = function() {
  if(global.qweb3) {
    let selectedContract = getSelectedContract()
    let valsArray = getMultiValsArray($("#formDeployArgs input").toArray())
    let account = getSelectedAccount()
    let gasLimit = getGasLimit()
    let contract = new qweb3.eth.Contract(selectedContract.abi)
    let privateForArray = getPrivateForArray()
    
    contract.deploy({
      data: "0x" + selectedContract.evm.bytecode.object,
      arguments: valsArray
    }).send({
      from: account, 
      gas: gasLimit,
      privateFor: privateForArray
    }).on("transactionHash", function(transactionHash){
      deployLog("Contract tx hash: " + transactionHash + " waiting to be mined...", false)
      console.log("Contract transaction send: TransactionHash: " + transactionHash + " waiting to be mined...")
    }).on("error", function(error){
      deployLog("err deploy contract: " + error, true)
      console.log("err deploy contract: " + error)
    })
    .then(function(instance){
      // deployLog("Contract mined! Address: " + instance._address, true)
      console.log("Contract mined! Address: " + instance._address)
      console.log(instance)

      addDeployedContract(selectedContract.key, instance._address, selectedContract.contractName, selectedContract.abi)   
    });
  }
}

global.atAddress = function() {
  var address = $("#contractAddress").val()
  let selectedContract = getSelectedContract()
  addDeployedContract(selectedContract.key, address, selectedContract.contractName, selectedContract.abi)
}


global.quorumjs = quorumjs


// string literal templates functions

const tplActionParam = ({title, name, inputs, view, proto, argsStr})=>`
<div class="contractActionsContainer">
    <div data-func="${name}" data-proto="${proto}" class="contractProperty ${inputs.length > 0 ? 'hasArgs' : 'constant'}">
        <div class="contractActionsContainerSingle" style="display: flex;">
            <button class="instanceButton btn btn-sm ${view ? 'btn-info' : 'btn-warning'}" title="${title}">${name}</button>
            ${inputs.length > 0 ? `<input placeholder="${argsStr}" title="${argsStr}"><i title="${name}" class="fas fa-angle-down methCaret" ${view ? 'style="visibility: hidden;"':''}></i>` : ''}
        </div>
        <div class="contractActionsContainerMulti" style="display: none;">
            <div class="contractActionsContainerMultiInner text-dark">
                <div class="multiHeader">
                    <div class="multiTitle">${name}</div><i class="fas fa-angle-up methCaret"></i>
                </div>
                <div>
                    ${inputs.map(input => `
                        ${tplContractArg(input)}
                    `).join("")}
                </div>
                <div class="group multiArg">
                    <button class="instanceButton btn-warning" title="${title}">transact</button><i title="Encode values of input fields &amp; copy to clipboard" aria-hidden="true" class="copyIcon far fa-clipboard"></i></div>
                </div>
        </div>
    </div>
    <div class="value"></div>
</div>
`

const tplContractInstance = ({key, address, name, actions})=>`
<div id="instance${address}" data-address="${address}" data-key="${key}" class="instance">
  <div class="title alert alert-secondary p-2">
      <button class="btn titleExpander"><i aria-hidden="true" class="fas fa-angle-down"></i></button>
      <div class="input-group nameNbuts">
          <div class="titleText input-group-prepend"><span class="input-group-text spanTitleText">${name} at ${omitAddress(address)} (blockchain) </span></div>
          <div class="btn-group">
              <button class="btn p-1 btn-secondary"><i title="Copy value to clipboard" aria-hidden="true" class="copyIcon far fa-clipboard"></i></button>
              <button title="Remove from the list" class="udappClose p-1 btn btn-secondary"><i aria-hidden="true" class="closeIcon fas fa-times"></i></button>
          </div>
      </div>
  </div>
  <div class="cActionsWrapper" style="display: none">
    ${actions.map((action)=>tplActionParam(action)).join("")}
    <div class="text-dark result"></div>
  </div>
`

const tplContractArg = (data)=>`<div class="multiArg"><label for="${data.name}">${data.name}: </label><input placeholder="${data.type}" title="${data.name}" name="${data.name}"></div>`

// event for components

$("#contracts").on("change", function(){
  let selected = $(this).val()
  let abi = contracts[selected].abi;
  let constructorInterface = txHelper.getConstructorInterface(abi)
  let argBody = $("#multiBody")
  argBody.html("")
  constructorInterface.inputs.forEach((arg)=>{
    let argTag = tplContractArg(arg)
    argBody.append($(argTag))
  })
})

$(".account .copyIcon").on("click", function(){
  let account = getSelectedAccount()
  copy(account)
  showTooltip('Copied!')
})

$("#instanceContainer").on("click", ".titleExpander", function(){
  let actionsWrapper = $(this).parents(".instance").find(".cActionsWrapper")
  actionsWrapper.toggle()
  if(actionsWrapper.is(":visible")) {
    $(this).find("> i").addClass("fa-angle-up")
    $(this).find("> i").removeClass("fa-angle-down")
  } else {
    $(this).find("> i").addClass("fa-angle-down")
    $(this).find("> i").removeClass("fa-angle-up")
  }
})

$("#instanceContainer").on("click", ".contractActionsContainerSingle .methCaret", function(){
  let contractProperty = $(this).parents(".contractProperty")
  contractProperty.find(".contractActionsContainerMulti").show()
  contractProperty.find(".contractActionsContainerSingle").hide()
  makeMultiVal(contractProperty.find(".contractActionsContainerSingle input").val(), 
    contractProperty.find(".contractActionsContainerMulti input").toArray())
})

$("#instanceContainer").on("click", ".contractActionsContainerMulti .methCaret", function(){
  let contractProperty = $(this).parents(".contractProperty")
  contractProperty.find(".contractActionsContainerMulti").hide()
  contractProperty.find(".contractActionsContainerSingle").show()
  let multiValString = getMultiValsString(contractProperty.find(".contractActionsContainerMulti input").toArray())
  if (multiValString) 
    contractProperty.find(".contractActionsContainerSingle input").val(multiValString)

})

$("#instanceContainer").on("click", ".title .copyIcon", function(){
  let address = $(this).parents(".instance").data("address")
  copy(address)
  showTooltip('Copied!')
})

$("#instanceContainer").on("click", ".title .udappClose", function(){
  let instance = $(this).parents(".instance")
  let address = instance.data("address")
  
  let contractInstance = contractMap[address];
  delete contractMap[address]
  $(this).parents('.instance')
  instance.remove()
})

$("#instanceContainer").on("click", ".contractActionsContainerMulti .copyIcon", function(){
  let contractProperty = $(this).parents(".contractProperty")
  let key =  contractProperty.parents(".instance").data("key")
  let proto = contractProperty.data("proto")
  let valsArray = getMultiValsArray(contractProperty.find(".contractActionsContainerMulti input").toArray())
  let funABI = txHelper.getFunction(contracts[key].abi, proto)

  let encoded = txHelper.encodeParams(funABI, valsArray)
  if(encoded) {
    copy(encoded)
    showTooltip('Copied!')
  }
})

$("#instanceContainer").on("click", ".instanceButton", function(){
  // transact ! 
  let contractProperty = $(this).parents(".contractProperty")
  let resultValue = contractProperty.parents(".contractActionsContainer").find(".value")
  let address = contractProperty.parents(".instance").data("address")
  let key =  contractProperty.parents(".instance").data("key")
  let contract = new qweb3.eth.Contract(contracts[key].abi, address)
  let gasLimit = getGasLimit()
  let value = getValueWei()
  let account = getSelectedAccount()
  let func = contractProperty.data("func")
  let proto = contractProperty.data("proto")
  let funABI = txHelper.getFunction(contracts[key].abi, proto)
  let constant = !funABI ? false : funABI.constant
  let isFallback = !funABI
  let privateForArray = getPrivateForArray()

  let isMulti = contractProperty.find(".contractActionsContainerMulti").is(":visible")
  if(!isMulti) {
    makeMultiVal(contractProperty.find(".contractActionsContainerSingle input").val(), 
    contractProperty.find(".contractActionsContainerMulti input").toArray())
  }

  let valsArray = getMultiValsArray(contractProperty.find(".contractActionsContainerMulti input").toArray())  
  if(isFallback) {
    qweb3.eth.sendTransaction({
      from: account,
      gas: gasLimit,
      value,
      privateFor: privateForArray
    }, function(err, transactionHash) {
      if (err) {
        resultValue.text(err)
        console.log(err);
      } else {
        resultValue.text("Contract tx hash: " + transactionHash + " waiting to be mined...")
      }
    })
    .on("receipt", (receipt)=>{
      resultValue.text("")
      const formatter = new JSONFormatter(receipt);
      $(formatter.render()).appendTo(resultValue)
      console.log(receipt)
        // qweb3.eth.getTransactionReceipt(transactionHash)
        // .then((receipt)=>{
          
        // });
    }); 
  } else {
    let method = contract.methods[func].apply(contract, valsArray)
    if(constant) {
      method.call()
      .then(function(result){
        resultValue.text(JSON.stringify(result))
        console.log(result)
      })
      .catch(function(error) {
        resultValue.text("err call contract: " + error)
        console.log("err call contract: " + error)
      })

    } else {
      method.send({
        from: account, 
        gas: gasLimit,
        value,
        privateFor: privateForArray
      }).on("transactionHash", function(transactionHash){
        resultValue.text("Contract tx hash: " + transactionHash + " waiting to be mined...")
        console.log("Contract transaction send: TransactionHash: " + transactionHash + " waiting to be mined...")
      }).on("error", function(error){
        resultValue.text("err send tx: " + error)
        console.log("err send tx: " + error)
      })
      .then(function(instance){
        resultValue.text("")
        const formatter = new JSONFormatter(instance);
        $(formatter.render()).appendTo(resultValue)
        console.log(instance)
      });
    }
  }
})
