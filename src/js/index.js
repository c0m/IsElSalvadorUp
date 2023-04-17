// Constants
const API_URL = "https://api.coinbase.com/v2/prices/BTC-USD/spot";
const TRANSACTIONS_URL = "/data/transactions.json";
const REFRESH_INTERVAL = 3000;

// DOM elements
const priceDisplay = document.getElementById("price-display");
const positionEvaluation = document.getElementById("position-evaluation");
const transactionTable = document.getElementById("transaction-table");
const errorElement = document.getElementById("error");

// State
let totalUSDSpent = 0;
let totalBTCOwned = 0;
let intervalBusy = false;

// Helper functions
const numberFormatter = (number) => {
  return number.toLocaleString(navigator.language, { maximumFractionDigits: 2 });
};

const getJSON = async (url) => {
  const response = await fetch(url);
  const data = await response.json();
  return data;
};

const getExchangeRate = async () => {
  const data = await getJSON(API_URL);
  return parseFloat(data.data.amount);
};

const updatePriceDisplay = (BTCUSD) => {
  priceDisplay.textContent = `BTC/USD: ${BTCUSD}`;
};

const evaluatePosition = (percentageGained) => {
  // Determine the theme based on percentageGained
  let theme;
  if (percentageGained >= 1000) {
    theme = "extremely-positive";
  } else if (percentageGained >= 100) {
    theme = "very-positive";
  } else if (percentageGained >= 10) {
    theme = "positive";
  } else if (percentageGained >= 5) {
    theme = "mildly-positive";
  } else if (percentageGained >= -5) {
    theme = "neutral";
  } else if (percentageGained >= -30) {
    theme = "mildly-negative";
  } else if (percentageGained >= -75) {
    theme = "negative";
  } else {
    theme = "grim";
  }

  // Update the class for the body element to reflect the theme
  document.body.className = theme;

  // Update the position-evaluation element
  positionEvaluation.innerHTML = `
    <div class="evaluation">
      <h1>${theme.toUpperCase()}</h1>
      <p>
        ${Math.abs(percentageGained).toFixed(2)}%
      </p>
    </div>
  `;
};

const buildTransactionTable = async (BTCUSD) => {
  const data = await getLocalData();
  let table = `
    <table class="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Direction</th>
          <th>Amount</th>
          <th>Price(USD) per</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>`;

  data.transactions.forEach((tx) => {
    const sources = tx.sources.map((source, index) => {
      return `<a href="${source}" target="_blank">[${index + 1}]</a>`;
    });

    table += `
      <tr>
        <td>${tx.date}</td>
        <td>${tx.direction}</td>
        <td>${tx.amount} ${tx.ticker}</td>
        <td>$${numberFormatter(tx.price_in_usd)}${tx.high_price_confidence ? '' : '*'}</td>
        <td>${sources.join('')}</td>
      </tr>`;
  });

  table += `
      </tbody>
    </table>
    <br>
    <p class="tiny-message"><i>* No primary source providing a price is available. This is a guess based on a time shortly before the President's tweet.</i></p>
    <p><b>Total BTC owned</b>: ${BTCOwned} BTC<br>
       <b>Average price</b>: $${numberFormatter((USDSpent / BTCOwned))}</p>
    <br>`;

  document.getElementById('transaction-table').innerHTML = table;
};

const updatePage = async () => {
  if (intervalBusy) return;

  intervalBusy = true;
  errorElement.classList.add("d-none");

  try {
    const [BTCUSD, data] = await Promise.all([getExchangeRate(), getTransactions()]);

    updatePriceDisplay(BTCUSD);
    buildTransactionTable(data.transactions);

    const currentValueOfBTCOwned = totalBTCOwned * BTCUSD;
    const profitInUSD = currentValueOfBTCOwned - totalUSDSpent;
    const profitInPercent = (profitInUSD / totalUSDSpent) * 100;
    evaluatePosition(profitInPercent);
  } catch (error) {
    console.error(error);
    errorElement.textContent = error.message;
    errorElement.classList.remove("d-none");
  } finally {
    intervalBusy = false;
  }
};

const fetchTransactionsData = async () => {
  const response = await fetch("data/transactions.json");
  const data = await response.json();
  return data.transactions;
};



const init = async () => {
  const transactions = await fetchTransactionsData();
  console.log("Transactions data:", transactions); // Add this line to log the fetched transactions data
  buildTransactionTable(transactions);
  changeThemeBasedOnProfit(transactions);
  await updatePage();
  setInterval(updatePage, REFRESH_INTERVAL);
};

init();