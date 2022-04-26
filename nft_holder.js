Moralis = require("moralis/node");

const NFTS = [
  "0xed5af388653567af2f388e6224dc7c4b3241c544",
  "0x8a90cab2b38dba80c64b7734e58ee1db38b8992e",
  "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
];

const initMoralis = async () => {
  //   Moralis init code
  const serverUrl = "https://crywl6ozluix.usemoralis.com:2053/server";
  const appId = "XKjMTk1OXRy4k6bNCJLPK00zfxrgziuZDbmj3NLx";
  const masterKey = "VXRjFO3sUHeOdKqiL3GpYZ27BqE9vFl6kX1sWXLD";
  const moralisSecret =
    "6QiwHrVwcyuXDrHJ43GqaNZDNgtOwqQJMl4G0ySOu33OyI4tFxZg5n65FLHKuvxT";

  await Moralis.start({ serverUrl, appId, masterKey, moralisSecret });

  //   const web3Provider = await Moralis.enableWeb3({
  //     privateKey: "YOUR-PRIVATE-KEY",
  //   });
  //   console.log(web3Provider);
};

const checkAddress = async (_address) => {
  //   get mainnet transactions for the current user
  //   const transactions = await Moralis.Web3API.account.getTransactions();

  //   get ETH transactions for a given address
  //   with most recent transactions appearing first
  const options = {
    chain: "eth",
    address: _address,
    from_date: "Feb 1 2022",
    // to_date: "Feb 1 2022",
    // order: "desc",
    // from_block: "0",
  };
  const addresses = [];
  const transactions = await Moralis.Web3API.account.getTransactions(options);
  transactions.result.map((element) => {
    if (!addresses.includes(element.from_address))
      addresses.push(element.from_address);
  });
  console.log(addresses);
};

const parseTransactionPage = (owners, cnts, transactions) => {
  const len = transactions.length;
  let i = 0;
  for (; i < len; i++) {
    const time_stamp = transactions[i].block_timestamp;
    const date = time_stamp.split("-");
    // console.log(date);
    if (Number(date[1]) == 1 || Number(date[0]) < 2022) break;
    const { from_address, to_address } = transactions[i];
    const from_index = owners.findIndex((element) => element == from_address);
    const to_index = owners.findIndex((element) => element == to_address);
    if (cnts[to_index]) cnts[to_index]--;
    else {
      owners[to_index] = 0;
      if (from_index == -1) {
        owners.push(from_address);
        cnts.push(1);
      } else cnts[from_index]++;
    }
  }
  return i < len;
};

const main = async () => {
  console.log("Moralis Initializing...");
  await initMoralis();

  const nft_adress = NFTS[0];
  const total_owners = await Moralis.Web3API.token.getNFTOwners({
    address: nft_adress,
    chain: "eth",
  });
  let nft_owners = total_owners.result.map((element) => element.owner_of);
  let i = 0;
  const total_amount = total_owners.total;
  // console.log(total_amount);
  const page_size = 500;
  for (i = page_size; i < total_amount; i += page_size) {
    const offest_owners = await Moralis.Web3API.token.getNFTOwners({
      address: nft_adress,
      chain: "eth",
      offset: i,
    });
    nft_owners.push(...offest_owners.result.map((element) => element.owner_of));
  }
  const result_owners = [];
  const result_cnts = [];
  nft_owners.map((element) => {
    if (!result_owners.includes(element)) {
      result_owners.push(element);
      result_cnts.push(1);
      // console.log(element);
    } else {
      const inex = result_owners.findIndex((_element) => element == _element);
      result_cnts[inex]++;
    }
  });
  // console.log(result_cnts);

  const total_transfers = await Moralis.Web3API.token.getContractNFTTransfers({
    address: nft_adress,
  });
  const total_cnt =
    total_transfers.total > 10000 ? 10000 : total_transfers.total;
  let bEnd = parseTransactionPage(
    result_owners,
    result_cnts,
    total_transfers.result
  );
  if (!bEnd) {
    for (i = page_size; i < total_cnt; i += page_size) {
      const offset_transfers =
        await Moralis.Web3API.token.getContractNFTTransfers({
          address: nft_adress,
          chain: "eth",
          offset: i,
        });
      if (
        parseTransactionPage(
          result_owners,
          result_cnts,
          offset_transfers.result
        )
      )
        break;
    }
  }
  const len = result_owners.length;
  for (i = 0; i < len; i++)
    if (result_owners[i] != 0 && result_cnts[i] != 0)
      console.log(result_owners[i]);
};

main();
