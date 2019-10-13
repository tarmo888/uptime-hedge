/*jslint node: true */
'use strict';
const { promisify } = require('util');
const Koa = require('koa');
const app = new Koa();
const cors = require('koa2-cors');
const mount = require('koa-mount');
const serve = require('koa-static');
const flashMessage = require('koa-flash-message');
const session = require('koa-session');
const render = require('koa-ejs');
const koaBody = require('koa-body');
const constants = require('ocore/constants.js');
const storage = require('ocore/storage.js');
const conf = require('ocore/conf');
const db = require('ocore/db');
const composer = require('ocore/composer.js');
const network = require('ocore/network.js');
const eventBus = require('ocore/event_bus');
const validationUtils = require('ocore/validation_utils');
const headlessWallet = require('headless-obyte');
const device = require('ocore/device.js');
const objectHash = require('ocore/object_hash.js');
const moment = require('moment');
const base64url = require('base64url');
const walletGeneral = require('ocore/wallet_general');

const pairingProtocol = process.env.testnet ? 'byteball-tn:' : 'byteball:';

Array.prototype.forEachAsync = async function(fn) {
	for (let t of this) { await fn(t) }
}
// Response item too list all offers
let responseModified = [];
var assocDevice2Email = {};
var assocDeposit2Device = {};
let serviceProvider = {};
let insuranceAmount = {};
let betAction = {}
let exchangeRates;

app.use(koaBody());
render(app, {
	root: __dirname + '/view',
	layout: 'template',
	viewExt: 'html',
	cache: false,
	debug: false
});


async function sendOffer(ctx) {
	ctx.body = {data:responseModified}
}
async function sendRates(ctx) {
	ctx.body = {data:exchangeRates}
}

app.use(serve(__dirname + '/public'));

app.keys = [conf.salt];
app.use(session(app))
app.use(flashMessage.default);

app.use(cors({
	origin: function(ctx) {
		return '*';
	}
}));


async function page(ctx) {
	// ctx.flashMessage.success = 'Success.';
	// ctx.flashMessage.danger = 'Error.';

	await ctx.render('page', {
		content: 'some text',
		moment,
	});
}
app.use(mount('/api-currencies', sendRates));
app.use(mount('/api-offers', sendOffer));
app.use(mount('/', page));

async function parseText(from_address, text) {
	let arrSignedMessageMatches = text.match(/\(signed-message:(.+?)\)/);
	let arrProfileMatches = text.match(/\(profile:(.+?)\)/);
	let challenge_email = 'This is my email attested address';

	if (arrSignedMessageMatches) {
		let signedMessageBase64 = arrSignedMessageMatches[1];
		let validation = require('ocore/validation.js');
		let signedMessageJson = Buffer.from(signedMessageBase64, 'base64').toString('utf8');
		try{
			var objSignedMessage = JSON.parse(signedMessageJson);
		}
		catch(e){
			return;
		}
		validation.validateSignedMessage(objSignedMessage, err => {
			if (err)
				return device.sendMessageToDevice(from_address, 'text', err);

			let wallet_address = objSignedMessage.authors[0].address;
			if (objSignedMessage.signed_message == challenge_email) {
				if (assocDevice2Email[from_address]) {
					return device.sendMessageToDevice(from_address, 'text', 'Already got all your data.');
				}
				network.requestFromLightVendor('light/get_attestations', {address: wallet_address}, (ws, request, response) => {
					if (response.error){
						console.error('light/get_attestations failed: '+response.error);
						return;
					}
					let arrAttestations = response;
					if (!Array.isArray(arrAttestations)){
						console.error('light/get_attestations response is not an array: '+response);
						return;
					}
					if (arrAttestations.length === 0){
						return device.sendMessageToDevice(from_address, 'text', "Not an attested address.");
					}
					//console.error('attestations', arrAttestations);
					arrAttestations.forEachAsync(async (attestation) => {
						if (!assocDevice2Email[from_address] && conf.arrEmailAttestors.indexOf(attestation.attestor_address) !== -1 && attestation.profile.email) {
							assocDevice2Email[from_address] = attestation.profile;
							device.sendMessageToDevice(from_address, 'text', 'Thank you. You can have verified your email.');
						}
						else {
							device.sendMessageToDevice(from_address, 'text', 'Found attestation, but no email.');
						}
					});
				});
			}
			else {
				return device.sendMessageToDevice(from_address, 'text', "You signed a wrong message: "+objSignedMessage.signed_message);
			}
		});
	}
	else if (arrProfileMatches) {
		const privateProfile = require('ocore/private_profile.js');
		let privateProfileJsonBase64 = arrProfileMatches[1];
		let objPrivateProfile = privateProfile.getPrivateProfileFromJsonBase64(privateProfileJsonBase64);
		privateProfile.parseAndValidatePrivateProfile(objPrivateProfile, (err, address, attestor_address) => {
			if (err)
				return device.sendMessageToDevice(from_address, 'text', err);
			if (conf.arrEmailAttestors.indexOf(attestor_address) !== -1) {
				if (assocDevice2Email[from_address]) {
					return device.sendMessageToDevice(from_address, 'text', 'Thank you. We already got your data.');
				}
				let profile = privateProfile.parseSrcProfile(objPrivateProfile.src_profile);
				if (!profile.email) {
					return device.sendMessageToDevice(from_address, 'text', 'Email missing from the attestation.');
				}
				assocDevice2Email[from_address] = profile;
				privateProfile.savePrivateProfile(objPrivateProfile, address, attestor_address);
				return device.sendMessageToDevice(from_address, 'text', 'Thank you. You can have verified your email.');
			}
			else {
				return device.sendMessageToDevice(from_address, 'text', "We don't recognize the attestor "+attestor_address+" who attested your profile.");
			}
		});
	}
	else {
		if (text == 'email') {
			device.sendMessageToDevice(from_address, 'text', 'Please provide your private email [...](profile-request:email) or sign this message with single-address wallet, which has publicly attested email address [...](sign-message-request:'+ challenge_email +').\nIf you haven\'t verified your email address yet then please do it with Email Attestation bot from Bot Store.\n[I want to offer bet](command:offer bet)');
		} else if (text == 'offer bet') {
			betAction[from_address] = 'offer';
			device.sendMessageToDevice(from_address, 'text', 'I want to insure my server on: \n [Amazon Web Services](command:serviceProvider/aws) \n [Google Cloud](command:serviceProvider/google) \n [Azure](command:serviceProvider/azure) \n [Zone](command:serviceProvider/zone) \n');
		} else if (text == 'take bet') {
			betAction[from_address] = 'take';

			let response = {
				responseTimestamp: '13.10.2019 15:21:55',
				serviceProvider: 'Google Cloud',
				insuranceAmount: 37.930257032192,
				payAmount: 18.965128516096,
				willCrash: 1
			}
			responseModified.push(response);

			if (responseModified.length) {
				let message = `List of available bets: \n\n`;

				let rate = exchangeRates.GBYTE_USD;

				responseModified.forEach(function callback(offer, index) {
					message += `[${offer.serviceProvider} - ${offer.insuranceAmount} (Pay this much: ${offer.payAmount})](command:take/${index}) \n`;
				});

				device.sendMessageToDevice(from_address, 'text', message);

			} else {
				device.sendMessageToDevice(from_address, 'text', 'No available offers');
				device.sendMessageToDevice(from_address, 'text', 'Choose an action: \n [Insure](command:offer bet) \n [Invest](command:take bet)');
			}

		} else if (betAction[from_address] == 'offer') {
			if (text.includes('serviceProvider/')) {
				serviceProvider[from_address] = text.split('/')[1];
				device.sendMessageToDevice(from_address, 'text', 'For the sum: \n [50€](command:insuranceAmount/50) \n [200€](command:insuranceAmount/200) \n [500€](command:insuranceAmount/500) \n [1000€](command:insuranceAmount/1000) \n [5000€](command:insuranceAmount/5000) \n');
			} else if (serviceProvider[from_address]) {
				if (text.includes('insuranceAmount/')) {
					insuranceAmount[from_address] = text.split('/')[1];
					let payAmount1 = insuranceAmount[from_address]/10;
					let payAmount2 = payAmount1*2;
					let payAmount3 = payAmount1*4;
					let payAmount4 = payAmount1*6;
					let payAmount5 = payAmount1*8;
					device.sendMessageToDevice(from_address, 'text', `And the price I\'m willing to pay is: \n [${payAmount1}€](command:payAmount/${payAmount1}) \n [${payAmount2}€](command:payAmount/${payAmount2}) \n [${payAmount3}€](command:payAmount/${payAmount3}) \n [${payAmount4}€](command:payAmount/${payAmount4}) \n [${payAmount5}€](command:payAmount/${payAmount5}) \n`);
				} else if (insuranceAmount[from_address]) {
					if (text.includes('payAmount/')) {
						let payAmount = text.split('/')[1];
						let rate = exchangeRates.GBYTE_USD;

						const data = {
							serviceProvider: serviceProvider[from_address],
							insuranceAmount: Math.floor(insuranceAmount[from_address] * rate),
							payAmount: Math.floor(payAmount * rate),
							willCrash: 1,
						};

						const json_string = JSON.stringify(data);

						device.sendMessageToDevice(from_address, 'text', `[Hedge it](byteball:${conf.aaAddress}?amount=${data.payAmount}&base64data=${base64url(json_string)})`);
						device.sendMessageToDevice(from_address, 'text', 'Choose an action: \n [Insure](command:offer bet) \n [Invest](command:take bet)');

						delete betAction[from_address];
						delete insuranceAmount[from_address];
						delete serviceProvider[from_address];
					}
				}
			}
		} else if (betAction[from_address] == 'take') {

			let index = text.split('/')[1];
			let rate = exchangeRates.GBYTE_USD;

			let offer = responseModified[index]
			const data = {
				serviceProvider: offer.serviceProvider,
				insuranceAmount: Math.floor((offer.insuranceAmount)* rate),
				payAmount: Math.floor((offer.insuranceAmount - offer.payAmount)* rate),
				willCrash: Number(!offer.willCrash),
			};
			const json_string = JSON.stringify(data);
			device.sendMessageToDevice(from_address, 'text', `[Take offer](byteball:${conf.aaAddress}?amount=${data.payAmount}&base64data=${base64url(json_string)})`);
			device.sendMessageToDevice(from_address, 'text', 'Choose an action: \n [Insure](command:offer bet) \n [Invest](command:take bet)');
			delete betAction[from_address];
		} else {
			device.sendMessageToDevice(from_address, 'text', 'Hi! Choose an action: \n [Insure](command:offer bet) \n [Invest](command:take bet)');
		}
	}
}

eventBus.once('headless_wallet_ready', () => {
	walletGeneral.addWatchedAddress(conf.aaAddress, () => {
		eventBus.on('aa_response_from_aa-' + conf.aaAddress, objAAResponse => {
			//Dummy data
			// const response = {
			// 	responseTimestamp: '1570969315',
			// 	serviceProvider: 'Google Cloud',
			// 	insuranceAmount: '3000000',
			// 	payAmount: '100000000',
			// 	willCrash: 0

			// }
			let response = {
				responseTimestamp: objAAResponse.objaobjResponseUnit.timestamp,
				serviceProvider: objaobjResponseUnit.response.serviceProvider,
				insuranceAmount: objaobjResponseUnit.response.insuranceAmount,
				payAmount: objaobjResponseUnit.response.payAmount,
				willCrash: objaobjResponseUnit.response.willCrash
			}
			responseModified.push(response);

			return

		});
	});
	headlessWallet.setupChatEventHandlers();

	eventBus.on("rates_updated", () => {
		exchangeRates = network.exchangeRates;
	});
	eventBus.on('paired', parseText);
	eventBus.on('text', parseText);
	app.listen(conf.webPort);

});

eventBus.on('new_my_transactions', async (arrUnits) => {
	const device = require('ocore/device.js');

	let rows = await db.query("SELECT unit, address, amount FROM outputs WHERE unit IN(?) AND asset IS NULL;", [arrUnits]);
	if (rows.length === 0) return;
	rows.forEachAsync(async (row) => {
		if (!assocDeposit2Device[row.address]) return;
		device.sendMessageToDevice(assocDeposit2Device[row.address], 'text', "Received your payment of " + row.amount + " bytes.\nWaiting for the transaction to confirm, it can take 5-15 minutes.");
	});
});

eventBus.on('my_transactions_became_stable', async (arrUnits) => {
	const device = require('ocore/device.js');

	let rows = await db.query("SELECT unit, address, amount FROM outputs WHERE unit IN(?) AND asset IS NULL;", [arrUnits]);
	if (rows.length === 0) return;
	rows.forEachAsync(async (row) => {
		if (!assocDeposit2Device[row.address]) return;
		device.sendMessageToDevice(assocDeposit2Device[row.address], 'text', "Your payment of " + row.amount + " bytes is confirmed.");
		delete assocDeposit2Device[row.address];
	});
});


process.on('unhandledRejection', up => { throw up; });
