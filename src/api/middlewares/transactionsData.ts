import { Container } from 'typedi';
import mongoose from 'mongoose';
import { HttpError } from '../../services/utils';
import { ITransactionData } from '../../interfaces/ITransactionData';
import { isNil } from 'lodash';

const transactionsData = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  const networkName = baseUrl.includes('polkadot') ? 'polkadot' : 'kusama';
  try {
    const TransactionData = Container.get(networkName + 'TransactionData') as mongoose.Model<
      ITransactionData & mongoose.Document
    >;

    const sortedData = await TransactionData.find();

    if (sortedData.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }

    const result = sortedData
      .filter((x) => !isNil(x.transactionHash))
      .map(({ stashId, network, alreadyBonded, stake, transactionHash, successful, createdAt }) => ({
        stashId,
        network,
        alreadyBonded,
        stake,
        transactionHash,
        successful,
        createdAt,
      }));
    return res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error generating risk-sets: %o', e);
    return next(e);
  }
};

export default transactionsData;
