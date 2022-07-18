const fs = require('fs');
const rl = require('readline');
const axios = require('axios');

const EURO = 'EUR';
const CASH_IN = 'cash_in';
const CASH_OUT = 'cash_out';
const USER_TYPE_NATURAL = 'natural';

processLineByLine = async () => {
  const fileStream = fs.createReadStream('input.json');
  let jsonString = '';

  const readline = rl.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of readline) {
    jsonString += line;
  }

  const jsonData = JSON.parse(jsonString)
  readJsonData(jsonData)

}

readJsonData = (jsonData) => {
  jsonData.forEach(async (item) => {
    const getdata = await calculateFees(item);
    process.stdout.write(`${getdata.toFixed(2).toString()}\n`);
  });

}

feesForCashIn = async (item) => {
  try {
    return await axios('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-in')
      .then(response => {
        const totalCommission = (item.operation.amount * response.data.percents) / 100;
        return totalCommission < response.data.max.amount ? totalCommission : response.data.max.amount;
      })
      .catch(error => {
        console.log(error)
      })
  }
  catch (error) {
    console.log(error)
  }
}

feesForCashOutNatural = async (item) => {
  try {
    return await axios('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/natural')
      .then(response => {
        const totalAmountForCommision = response.data.week_limit.amount > item.operation.amount ?
          item.operation.amount : item.operation.amount - response.data.week_limit.amount
        return (totalAmountForCommision * response.data.percents) / 100;
      })
      .catch(error => {
        console.log(error)
      })
  } catch (error) {
    console.log(error)
  }
}

feesForCashOutJuridical = async (item) => {
  try {
    return await axios('http://private-38e18c-uzduotis.apiary-mock.com/config/cash-out/juridical')
      .then(response => {
        const totalCommission = (item.operation.amount * response.data.percents) / 100;
        return totalCommission < response.data.min.amount ? response.data.min.amount : totalCommission;
      })
      .catch(error => {
        console.log(error)
      })
  } catch (error) {
    console.log(error)
  }
}


calculateFees = (item) => {
  if (item.operation.currency !== EURO) return;

  switch (item.type) {
    case CASH_IN:
      return feesForCashIn(item)
    case CASH_OUT:
      return item.user_type === USER_TYPE_NATURAL ? feesForCashOutNatural(item) :
        feesForCashOutJuridical(item);
  }
}

processLineByLine();



