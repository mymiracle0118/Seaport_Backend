import express from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';

import cookieParser from 'cookie-parser';
import logger from 'morgan';


import { d, getOffer, getConsideration, buyNfts } from './utils';

import indexRouter from './routes/index';
// import usersRouter from './routes/users';

var app = express();

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

app.use('/', indexRouter);
// app.use('/users', usersRouter);

export default app;
