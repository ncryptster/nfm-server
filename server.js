require("dotenv").config();
const Web3 = require("web3");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Token = require("./models/token");
const nfm = require("./data/development/nfm");
const marketplace = require("./data/development/marketplace");
const Cards = require("./data/cardData");
const web3 = new Web3("https://data-seed-prebsc-1-s1.binance.org:8545");
const router = require("express").Router();
const nfmContract = new web3.eth.Contract(nfm.ABI, nfm.ContractAddress);
const marketplaceContact = new web3.eth.Contract( marketplace.ABI, marketplace.ContractAddress );

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true, });
const db = mongoose.connection;
db.on("error", () => console.error(error));
db.once("open", () => console.log("Conneted to Database"));

router.post("/", async (req, res) => { await getNewTokens(); res.json({message: 'okay got it '}) });
router.get("/", async (req, res) => { try { const tokens = await Token.find(); res.send(tokens); } catch (err) { res.status(500).json({ message: err.message, }); } });
router.patch("/:tokenId", async (req, res) => {
	let smToken = await createToken(req.params.tokenId);
	let dbToken = await Token.findOne({
		tokenId: req.params.tokenId,
	});
	if (smToken.tokenOwner != dbToken.tokenOwner) {
		dbToken.tokenOwner = smToken.tokenOwner;
	}
	if (smToken.listing != dbToken.listing) {
		dbToken.listing = smToken.listing;
	}
	if (smToken.approvedForSale != dbToken.approvedForSale) {
		dbToken.approvedForSale = smToken.approvedForSale;
	}
	try {
		const updatedToken = await dbToken.save();
		res.json(updatedToken);
	} catch (err) {
		console.error(err);
	}
});
router.delete('/', async (req, res) => { await Token.deleteMany({}) });
app.use(express.json());
app.use(function (req, res, next) { res.header("Access-Control-Allow-Origin", "*"); res.header( "Access-Control-Allow-Headers", "Origin, x-Requested-With, Content-Type, Accept" ); next(); });
app.use("/tokens", router);
app.listen(process.env.PORT || 5000, () => console.log("Server Started"));

async function getNewTokens() {
  console.log("Searching....");
  const totalSupply = await nfmContract.methods.totalSupply().call();
  const currentTotalTokens = (await Token.find()).length;
  if (totalSupply != currentTotalTokens) {for (let tokenId = currentTotalTokens; tokenId < totalSupply; tokenId++) { const token = await createToken(tokenId); try { const newToken = await token.save(); } catch (err) { console.error(err); } }};
  const dblistedTokens = await Token.find({'listing.listed': true})
	const smlistedTokens = await marketplaceContact.methods.seeActiveListings().call()
	if (dblistedTokens.length != smlistedTokens.length) {
    for (let i = 0; i < smlistedTokens.length; i++) {
      const tokenId = smlistedTokens[i];
      const dbtoken = await Token.findOne({ tokenId: tokenId });
      const smlisting = await marketplaceContact.methods
        .tokenIdToAuction(tokenId)
        .call();
      dbtoken.listing.listed = true;
      dbtoken.listing.seller = smlisting.seller;
      dbtoken.listing.price = smlisting.price;
      dbtoken.save();
    }
  }
	
}

async function createToken(tokenId) {
	let tokenOwner = await nfmContract.methods.ownerOf(tokenId).call();
  let cardNumber = (await nfmContract.methods.meme(tokenId).call())[1];
  let cardData = Cards.filter((card) => {
    return card.cardNumber === cardNumber;
  })[0];
  const token = new Token({
    tokenId: tokenId,
    tokenOwner: tokenOwner,
    approvedForSale: false,
    listing: {
      listed: false,
      seller: '',
      price: 0,
    },
    approvedForTrade: false,
    listedForTrade: false,
    card: {
      cardNumber: cardData.cardNumber,
      cardName: cardData.cardName,
      cardText: cardData.cardText,
      cardRarity: cardData.cardRarity,
      fileName: cardData.fileName,
    },
  });
  return token;
}

getNewTokens();
