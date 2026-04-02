// const YahooFinance = require("yahoo-finance2").default;
// const yahooFinance = new YahooFinance();

// function getPeriod1ByRange(range) {
//   const now = new Date();
//   const period1 = new Date(now);
//   switch (range) {
//     case "1d": period1.setDate(now.getDate() - 1); break;
//     case "5d": period1.setDate(now.getDate() - 5); break;
//     case "1mo": period1.setMonth(now.getMonth() - 1); break;
//     case "3mo": period1.setMonth(now.getMonth() - 3); break;
//     case "6mo": period1.setMonth(now.getMonth() - 6); break;
//     case "1y": period1.setFullYear(now.getFullYear() - 1); break;
//     case "2y": period1.setFullYear(now.getFullYear() - 2); break;
//     case "5y": period1.setFullYear(now.getFullYear() - 5); break;
//     case "10y": period1.setFullYear(now.getFullYear() - 10); break;
//     case "ytd": return new Date(now.getFullYear(), 0, 1);
//     case "max": return new Date("2000-01-01");
//     default: period1.setMonth(now.getMonth() - 1); break;
//   }
//   return period1;
// }

// exports.getChart = async (yahooSymbol, range, interval) => {
//   const period1 = getPeriod1ByRange(range);
//   const period2 = new Date();
//   return await yahooFinance.chart(yahooSymbol, { period1, period2, interval });
// };

// exports.getQuote = async (yahooSymbol) => {
//   return await yahooFinance.quote(yahooSymbol);
// };