/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

const {Block} = require("./block");


class Blockchain {


    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if (this.height === -1) {
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block
     * YES: The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     *
     * YES: You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`
     *
     * ...At the end you need to
     * YES: create the `block hash`
     * and
     * YES: push the block into the chain array.
     * YES: Don't forget to update the `this.height` Comment - >>> why maintain height variable when we can always resolve height via chain.length.
     * Note: the symbol `_` in the method name indicates in the javascript convention
     * that this method is a private method.
     */
    _addBlock(block) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                // block height
                block.height = this.chain.length;
                // UTC timestamp
                block.time = new Date().getTime().toString().slice(0, -3);
                if (self.chain.length > 0) {
                    // previous block hash
                    // assuming resolving chain.length is thread safe since Node is single threaded
                    block.previousBlockHash = self.chain[self.chain.length - 1].hash;
                }
                // SHA256 requires a string of data
                block.hash = SHA256(JSON.stringify(block)).toString();
                self.chain.push(block);
                self.height = self.chain.length;
                console.log("Added new block to chain: " + JSON.stringify(block));
                resolve();
            } catch (e) {
                console.log("Error adding new block to chain: " + e.toString());
                reject(e);
            }
        });


    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            var message = `${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`;
            resolve(message);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. YES: Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. YES: Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. YES: Check if the time elapsed is less than 5 minutes
     * 4. YES: Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. YES: Create the block and add it to the chain
     * 6. YES: Resolve with the block added.
     * @param {*} address
     * @param {*} message
     * @param {*} signature
     * @param {*} star
     */
    submitStar(address, message, signature, star) {
        console.log("Blockchain submitStar");
        let self = this;
        return new Promise(async (resolve, reject) => {
            try {
                let timeOfMessage = parseInt(message.split(':')[1]);
                let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));
                let elapsedTime = currentTime - timeOfMessage;
                // if there is a long timeout here for testing,
                // I don't want new messages to sign at the moment
                let millisIn5Minutes = 5 * 60;
                if (elapsedTime > millisIn5Minutes) {
                    reject("Message age is greater than 5 minutes");
                    return;
                }
                bitcoinMessage.verify(message, address, signature);
                // create new block
                var bodyObject = {
                    "address": address,
                    "message": message,
                    "signature": signature,
                    "star": star
                };

                let block = new Block(JSON.stringify(bodyObject));
                console.log("Adding Block");
                await self._addBlock(block);
                console.log("Block added with hash: " + block.hash);
                resolve(block);
            } catch (error) {
                console.log("Block not added error:" + error);
                reject(error);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash
     */
    getBlockByHash(hash) {
        let self = this;
        console.log("Blockchain getBlockByHash");
        return new Promise((resolve, reject) => {

            // don't bang me because I don't understand the syntax and behavior
            // of javascript looping and array filtering
            // I'm going old school with readable, debugable for loops
            // I'll figure it out next project or maybe never, who knows.
            // inexperienced developers under-rate verbose, debuggable, explainable, readable code
            self.chain.forEach(function (block, index) {
                console.log("Hash for block " + index + " =" + block.hash);
            });

            let matchingBlock = null;
            self.chain.forEach(function (block, index) {
                if (block.hash == hash) {
                    matchingBlock = block;
                }
            });

//            let matchingBlock = self.chain.filter(item => item.getBodyData().hash === hash)[0];
            if (matchingBlock) {
                resolve(matchingBlock);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object
     * with the height equal to the parameter `height`
     * @param {*} height
     */
    getBlockByHeight(height) {
        console.log("Blockchain getBlockByHeight");
        let self = this;
        return new Promise((resolve, reject) => {
            let block = self.chain.filter(p => p.height === height)[0];
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address
     */
    getStarsByWalletAddress(address) {
        let self = this;

        console.log("Blockchain getStarsByWalletAddress");

        return new Promise((resolve, reject) => {
            let stars = [];
            self.chain.forEach(function (block, index) {
                // This is the proper place to not look at the body data
                // of the Genesis Block, not in Block.getBodyData()
                if (index != 0) {
                    // don't look at the Genesis Block
                    try {
                        const myObjString = block.getBodyData();
                        const myObj = JSON.parse(block.getBodyData());

                        const starObject = myObj["star"];
                        const starAddress = myObj["address"];
                        if (starAddress == address) {
                            console.log("Found star for address: " + address);
                            console.log("Star object is : " + starObject);
                            stars.push(starObject);
                        }
                    } catch (err) {
                        reject("Error getting Star data");
                    }
                }

            });

            if (stars != null) {
                resolve(stars);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        console.log("Blockchain validateChain");
        let self = this;
        let errorLog = [];
        return new Promise(async (resolve, reject) => {
            self.chain.forEach(b => b.validate().catch(err => errorLog.push(err)));
            if (errorLog.length > 0) {
                reject(errorLog);
            } else {
                resolve(errorLog);
            }
        });
    }

    getAllBlocks() {
        console.log("Blockchain getAllBlocks");
        let chainClone = this.chain.slice(0);
        return chainClone;
    }
}

module.exports.Blockchain = Blockchain;   