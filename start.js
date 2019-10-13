/*jslint node: true */
'use strict';
const { promisify } = require('util');
const Koa = require('koa');
const app = new Koa();
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

const pairingProtocol = process.env.testnet ? 'byteball-tn:' : 'byteball:';

Array.prototype.forEachAsync = async function(fn) {
	for (let t of this) { await fn(t) }
}

let assocDevice2Email = {};
let assocDeposit2Device = {};

let responseModified = {
    responseTimestamp: null,
    serviceProvider: null,
    insuranceAmount: null,
    payAmount: null,
    willCrash: null
}

app.use(koaBody());
render(app, {
	root: __dirname + '/view',
	layout: 'template',
	viewExt: 'html',
	cache: false,
	debug: false
});


async function sendData(ctx) {
    ctx.body = responseModified
}
app.use(serve(__dirname + '/public'));

app.keys = [conf.salt];
app.use(session(app))
app.use(flashMessage.default);


async function page(ctx) {
	// ctx.flashMessage.success = 'Success.';
	// ctx.flashMessage.danger = 'Error.';

	await ctx.render('page', {
		content: 'some text',
		moment,
	});
}
app.use(mount('/api', sendData));
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
			device.sendMessageToDevice(from_address, 'text', 'Please provide your private email [...](profile-request:email) or sign this message with single-address wallet, which has publicly attested email address [...](sign-message-request:'+ challenge_email +').\nIf you haven\'t verified your email address yet then please do it with Email Attestation bot from Bot Store.\n[How to get the Email Attestation bot from Bot Store?](command:email attestation?)');
		}
		else {
			device.sendMessageToDevice(from_address, 'text', 'Hi');
		}
	}
}

eventBus.once('headless_wallet_ready', () => {

	walletGeneral.addWatchedAddress(aa_address, () => {
        eventBus.on('aa_response_from_aa-' + aa_address, objAAResponse => {
            responseModified.responseTimestamp = objAAResponse.objaobjResponseUnit.timestamp
            responseModified.serviceProvider = objaobjResponseUnit.response.serviceProvider
            responseModified.insuranceAmount = objaobjResponseUnit.response.insuranceAmount
            responseModified.payAmount = objaobjResponseUnit.response.payAmount
            responseModified.willCrash = objaobjResponseUnit.response.willCrash
            console.error(responseModified)
            // for (const key of Object.keys(responseModified)) {
            //     if (!responseModified[key]) {
            //         console.error(key, ' is missing, stopping.')
            //     }
            // }
            return

        });
    });
	headlessWallet.setupChatEventHandlers();

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
