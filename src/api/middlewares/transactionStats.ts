import { Container } from 'typedi';
import mongoose from 'mongoose';
import { HttpError } from '../../services/utils';
import { ITransactionData } from '../../interfaces/ITransactionData';
import { isNil, groupBy } from 'lodash';

const transactionStats = async (req, res, next) => {
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

    const groupedData = groupBy(result, 'stashId');
    let totalAmountCurrentlyManaged = 0;
    for (const [key, value] of Object.entries(groupedData)) {
      totalAmountCurrentlyManaged += value[value.length - 1].stake;
    }
    const totalAmountRedistributed = result.reduce((a, b) => a + b.stake, 0);
    const successfulTransactions = result.filter((x) => x.successful);
    return res
      .json({
        uniqueUsers: Object.keys(groupedData).length,
        totalAmountRedistributed: totalAmountRedistributed,
        totalAmountCurrentlyManaged: totalAmountCurrentlyManaged,
        totalTransactions: result.length,
        successfulTransactions: successfulTransactions.length,
        transactionsGroupedByStashId: groupedData,
      })
      .status(200);
  } catch (e) {
    Logger.error('🔥 Error generating risk-sets: %o', e);
    return next(e);
  }
};

export default transactionStats;
