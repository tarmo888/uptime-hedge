/*jslint node: true */
'use strict';
const fs = require('fs');
const db = require('ocore/db.js');

Array.prototype.forEachAsync = async function(fn) {
	for (let t of this) { await fn(t) }
}

db_import();

async function db_import() {
	let db_sql = fs.readFileSync('db.sql', 'utf8');
	let queries = db_sql.split('-- query separator');
	await queries.forEachAsync(async (sql) => {
		if (sql) {
			console.log(await db.query(sql, []));
			console.log(sql);
		}
	});
	process.exit();
}