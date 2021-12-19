var totalUSDSpent = 0;
var totalBTCOwned = 0;
const veryGoodMessage = `<div class=\"good-evaluation\"><h1>YES!</h1><br><p>Wowee, they've got themselves up `;
const goodMessage = `<div class=\"good-evaluation\"><h1>Yes</h1><br><p>They're up by a modest `;
const neutralMessage = `<div><h1>:|</h1><br><p>They're neither up nor down, but watch this percentage and maybe it'll change: `;
const badMessage = `<div class=\"bad-evaluation\"><h1>No</h1><br><p>They're down by a modest `;
const veryBadMessage = `<div class=\"bad-evaluation\"><h1>NO!</h1><br><p>Oopsie woopsie! They're very down! How much? `;
const shillMessage = `<br><div class=\"shill-message\"><i>Would you also like to irresponsibly gamble away your country's finances? Consider signing up for an account on <a href="https://ftx.com/profile#a=iselsalvadorup">FTX</a> or <a href="https://accounts.binance.com/en/register?ref=DVISPZG8">Binance</a>.</i></div>`;


const getLocalData = async () => {
  return {
    "transactions": [
      {
        "date": "2021-12-04",
        "ticker": "BTC",
        "direction": "Buy",
        "amount": 50,
        "price_in_usd": 100000,
        "high_price_confidence": false,
        "sources": ["https://twitter.com/nayibbukele/status/1467000621354135555",
                    "https://web.archive.org/web/20211204051954/https://twitter.com/nayibbukele/status/1467000621354135555"]
      },

      {
        "date": "2021-12-05",
        "ticker": "BTC",
        "direction": "Buy",
        "amount": 50,
        "price_in_usd": 100000,
        "high_price_confidence": true,
        "sources": ["https://twitter.com/nayibbukele/status/1467000621354135555",
                    "https://web.archive.org/web/20211204051954/https://twitter.com/nayibbukele/status/1467000621354135555"]
      }
  ]
  };
};

const numberFormatter = (number) => {
  return number.toLocaleString(navigator.language, {maximumFractionDigits: 2});
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
  profitInPercent = (profitInUSD/totalUSDSpent)*100;
  document.getElementById('price-display').innerHTML = `
    BTC/USD: ${BTCUSD}`;
  document.getElementById('position-evaluation').innerHTML = evaluatePosition(profitInPercent) + 
                                                              Math.abs(profitInPercent).toFixed(2) + 
                                                              `%, or $${numberFormatter(profitInUSD)}</div>` + 
                                                              shillMessage;
};

const evaluatePosition = (percentageGained) => {
  switch(true){
      case percentageGained >= 5:
        return veryGoodMessage;
      case percentageGained > 0 && percentageGained < 5:
        return goodMessage;
      case percentageGained == 0:
        return neutralMessage;
      case percentageGained < 0 && percentageGained > -5:
        return badMessage;
      case percentageGained <= -5:
        return veryBadMessage;
      default:
        return 'it\'s loading dude calm down jesus please just calm down look it\'ll be better in a few seconds trust me please no stop get away from me';
  }

}

const buildTable = async (BTCUSD) => {
  const data = await await getLocalData();
  let table = `<table class="table">
      <thead>
          <tr>
              <th>Date</th>
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
          <td>${tx.date}</td>
          <td>${relativeProfit.toFixed(2)}%</td>
          <td>${tx.direction}</td>
          <td>${tx.amount} ${tx.ticker}</td>
          <td>$${numberFormatter(tx.price_in_usd)}${tx.high_price_confidence ? '' : '*'}</td>
          <td>${sources.join('')}</td>
          </tr>`;
  });

  table += `</tbody></table><br>
            <p><i>* No primary source providing a price is available</i></p>
            <p> <b>Total BTC owned</b>: ${BTCOwned} BTC<br>
                <b>Average price</b>: $${numberFormatter((USDSpent/BTCOwned))}</p>

            <br>`;

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