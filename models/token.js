const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
				tokenId: {
					type: String,
					required: true
				},
        tokenOwner: {
					type: String,
					required: true
				},
        approvedForSale: Boolean,
        listing: { 
					listed: Boolean,
					seller: {
					type: String,
				},
					price: {
					type: Number,
				}
				 },
        approvedForTrade: Boolean,
        listedForTrade: Boolean,
        card: {
          cardNumber: {
					type: Number,
					required: true
				},
          cardName: {
					type: String,
					required: true
				},
          cardText: {
					type: String,
					required: true
				},
          cardRarity: {
					type: String,
					required: true
				},
          fileName: {
					type: String,
					required: true
				},
        },

})

module.exports = mongoose.model('token', tokenSchema)