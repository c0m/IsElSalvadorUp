var totalUSDSpent = 0;
var totalBTCOwned = 0;

const getLocalData = async () => {
  return {
    "transactions": [
      {
        "date": "2021-12-04",
        "ticker": "BTC",
        "direction": "Buy",
        "amount": 51,
        "price_in_usd": 48670,
        "high_price_confidence": false,
        "sources": ["https://twitter.com/nayibbukele/status/1467000621354135555",
                    "https://web.archive.org/web/20211204051954/https://twitter.com/nayibbukele/status/1467000621354135555"]
      },

      {
        "date": "2021-12-05",
        "ticker": "BTC",
        "direction": "Sell",
        "amount": 50,
        "price_in_usd": 48660,
        "high_price_confidence": true,
        "sources": ["https://twitter.com/nayibbukele/status/1467000621354135555",
                    "https://web.archive.org/web/20211204051954/https://twitter.com/nayibbukele/status/1467000621354135555"]
      }
  ]
  };
};

const getExchangeRate = async (base, currency) => {
  const response = await fetch(`https://api.coinbase.com/v2/prices/${base}-${currency}/spot`);
  const cbData = await response.json();

  if(!cbData.data || cbData.data.base !== base || cbData.data.currency !== currency) {
      console.log(cbData);

      throw Error('Invalid Coinbase data');
  }

  return parseFloat(cbData.data.amount);
};

const updatePriceDisplay = (BTCUSD) => {
  var currentValueOfBTCOwned = totalBTCOwned * BTCUSD;
  var profitInUSD = currentValueOfBTCOwned - totalUSDSpent;
  var profitInPercent = (profitInUSD/totalUSDSpent)-1;
  document.getElementById('price-display').innerHTML = `
    BTC/USD: ${BTCUSD} 
    Total profit: $${profitInUSD.toFixed(2)} (${profitInPercent.toFixed(2)}%)`;
};

const buildTable = async (BTCUSD) => {
  const data = await await getLocalData();
  let table = `<table class="table">
      <thead>
          <tr>
              <th>Profit %</th>
              <th>Direction</th>
              <th>Amount</th>
              <th>Price(USD) per</th>
              <th>Source</th>
          </tr>
      </thead>
      <tbody>`;
  

  var BTCOwned = 0;
  var USDSpent = 0;

  data.transactions.forEach((tx) => {
      BTCOwned += tx.direction === 'Buy' ? tx.amount : -tx.amount;
      USDSpent += tx.direction === 'Buy' ? tx.amount * tx.price_in_usd : -tx.amount * tx.price_in_usd;
      const relativeProfit = ((BTCUSD/tx.price_in_usd)-1)/(tx.direction === 'Sell' ? -1 : 1);

      const sources = tx.sources.map((source, index) => {
          return `<a href="${source}" target="_blank">[${index+1}]</a>`;
      })

      table += `<tr>
          <td>${relativeProfit.toFixed(2)}%</td>
          <td>${tx.direction}</td>
          <td>${tx.amount} ${tx.ticker}</td>
          <td>$${tx.price_in_usd}${tx.high_price_confidence ? '' : '*'}</td>
          <td>${sources.join('')}</td>
          </tr>`;
  });

  table += `</tbody></table><br>

            <br><p><i>* No primary source providing a price is available</i></p>`;

  totalBTCOwned = BTCOwned;
  totalUSDSpent = USDSpent;
  
  document.getElementById('transaction-table').innerHTML = table;
};

const init = async () => {
  const intervalFunc = async () => {
      if(intervalBusy) {
          console.log('Busy, skip');

          return;
      }

      intervalBusy = true;
      document.getElementById('error').classList.add('d-none');

      try {
          const BTCUSD = await getExchangeRate('BTC', 'USD');

          updatePriceDisplay(BTCUSD);
          buildTable(BTCUSD);
      } catch(error) {
          console.error(error);

          document.getElementById('error').innerHTML = error.message;
          document.getElementById('error').classList.remove('d-none');
      } finally {
          intervalBusy = false;
      }
  };

  var intervalBusy = false;

  await intervalFunc();

  let interval = setInterval(intervalFunc, 3000);
}