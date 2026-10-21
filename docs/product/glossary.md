# Glossary

Use these terms with these meanings in code, docs, and the UI.

| Term | Meaning |
|---|---|
| **Cross-sectional selection** | Rank a universe of stocks on one date. Buy the top names. Rebalance on a schedule. |
| **Universe** | The set of stocks a strategy may choose from on a date. The universe must exclude stocks that did not exist or could not be traded on that date. |
| **Factor** | A number computed from data that ranks stocks on one characteristic, such as value, momentum, or quality. |
| **Strategy spec** | The structured object the agent produces from a question: universe, filters, factors, weights, rebalance, and constraints. It is the input to the engine. |
| **Screen** | A rule that removes stocks from the universe before ranking. The Sharia screen is one. |
| **Sharia screen** | An explicit set of business-activity and financial-ratio rules. It returns compliant, non-compliant, or unknown. |
| **Backtest** | A run of a strategy spec over a historical window with a stated cost model. |
| **Point-in-time data** | Data as it was known on the date of the decision. A later restatement must not enter an earlier backtest. |
| **Look-ahead bias** | Using information that was not available at the decision date. A backtest with look-ahead is invalid. |
| **Survivorship bias** | Testing only on stocks that still exist today. Delisted names must stay in the historical universe. |
| **Rebalance** | The scheduled point where the portfolio is rebuilt from the current ranking. |
| **Annual return** | The compounded yearly return of the strategy over the test window, as a decimal. |
| **Max drawdown** | The largest peak-to-trough loss over the test window, as a negative decimal. |
| **Sharpe ratio** | Mean excess return divided by return volatility. State the risk-free rate used. |
| **Signals file** | `model/signals.json`, the single data contract between the model and the web app. See `../../model/CONTRACT.md`. |
| **Agent layer** | The language-model component. It translates a question into a strategy spec and explains results. It does not compute numbers. |
| **Decision support** | A tool that shows evidence and limits. It is not advice, and it does not execute trades. |
