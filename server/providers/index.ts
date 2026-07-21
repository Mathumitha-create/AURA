import { commodityProvider } from "./commodityProvider";
import { governmentDataProvider } from "./governmentDataProvider";
import { maritimeProvider } from "./maritimeProvider";
import { newsProvider } from "./newsProvider";
import { weatherProvider } from "./weatherProvider";

export const providers = [
  newsProvider,
  commodityProvider,
  weatherProvider,
  maritimeProvider,
  governmentDataProvider
];

export {
  newsProvider,
  commodityProvider,
  weatherProvider,
  maritimeProvider,
  governmentDataProvider
};
