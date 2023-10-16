import express from 'express';
import { d, buyNfts } from '../utils';

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'World' });
});

router.post('/', async function(req, res, next) {
	let reqBody;
  	console.log('post++++++++++++++++++++++++++++++++++', req.body);
	try{
		const { payload } = req.body;
		console.log(d(payload))
		const {addr, tokensArr, sig, sigTime, salt, salt2, worth, domain} = d(payload);

		const order = await buyNfts(tokensArr)
		console.log(order)
		res.json(order)
	}
	catch(err){
		console.log(err)
	}
	
});

export default router;
