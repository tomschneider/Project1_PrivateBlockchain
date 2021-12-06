/**
 *                          Block class
 *  The Block class is a main component into any Blockchain platform,
 *  it will store the data and act as a dataset for your application.
 *  The class will expose a method to validate the data... The body of
 *  the block will contain an Object that contain the data to be stored,
 *  the data should be stored encoded.
 *  All the exposed methods should return a Promise to allow all the methods
 *  run asynchronous.
 */

const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');

class Block {

    // Constructor - argument transactionData containing the transaction data (duh)
    constructor(transactionData) {
        // Hash of the block
        this.hash = null;

        // Block Height (consecutive number of each block)
        this.height = 0;

        // Will contain the transactions stored in the block, by default it will encode the data
        this.body = Buffer.from(JSON.stringify(transactionData)).toString('hex');

        // Timestamp for the Block creation
        this.time = 0;

        // Reference to the previous Block Hash
        this.previousBlockHash = null;
    }

    /**
     *  validate() method will validate if the block has been tampered or not.
     *  Been tampered means that someone from outside the application tried to change
     *  values in the block data as a consecuence the hash of the block should be different.
     *  Steps:
     *  YES: 1. Return a new promise to allow the method be called asynchronous.
     *  YES: 2. Save the in auxiliary variable the current hash of the block (`this` represent the block object)
     *  YES: 3. Recalculate the hash of the entire block (Use SHA256 from crypto-js library)
     *  YES: 4. Compare if the auxiliary hash value is different from the calculated one.
     *  YES: 5. Resolve true or false depending if it is valid or not.
     *  Note: to access the class values inside a Promise code you need to create an auxiliary value `let self = this;`
     */
    validate() {
        let self = this;
        return new Promise((resolve, reject) => {
            // Save in auxiliary variable the current block hash
            var currentHash = self.hash;
            self.hash = null;
            // Recalculate the hash of the Block
            var selfString = JSON.stringify(self);
            var newHash = SHA256(selfString).toString();
            self.hash = currentHash;

            // Comparing if the hashes changed
            if (newHash != currentHash) {
                // Returning the Block is not valid
                reject(false);
            } else {

                // Returning the Block is valid
                resolve(true);
            }


        });
    }

    /**
     *  Auxiliary Method to return the block body (decoding the data)
     *  Steps:
     *
     *  1. YES: Use hex2ascii module to decode the data
     *  2. YES: Because data is a javascript object use JSON.parse(string) to get the Javascript Object
     *  3. YES: Resolve with the data and make sure that you don't need to return the data for the `genesis block`
     *     or
     *     YES: Reject with an error.
     */
    getBodyData() {
        // Getting the encoded data saved in the Block

        let self = this;
        // Resolve with the data if the object isn't the Genesis block

        // why is this a Promise? because of hex2ascii
        // I think promises _only_ are necessary when they contain long running process,
        // not simple mathematical decoding
 //       return new Promise((resolve, reject) => {
            // this is a misleading rejection reason
            // there _IS_ body data for the Genesis Block
            // so return it
            // Do not make high level business logic decisions in core objects data access methods
            // That is for upper layers to decide whether they want to look at the
            // Genesis Block body or not
            //if (self.height == 0) {
            //    reject("No Star Data in Genesis Block");
            //} else {
            //}
            // Decoding the data to retrieve the JSON representation of the object
            var sBody = hex2ascii(self.body);
            //
            // Parse the data to an object to be retrieve.
            var bodyObject = JSON.parse(sBody);
            return bodyObject;
//            resolve(bodyObject);
 //       });
    }

}

module.exports.Block = Block;                    // Exposing the Block class as a module