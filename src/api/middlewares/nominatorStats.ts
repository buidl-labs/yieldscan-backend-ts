import { Container } from 'typedi';
import mongoose from 'mongoose';
import { INominatorStats } from '../../interfaces/INominatorStats';
import { HttpError } from '../../services/utils';

const nominatorStats = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  const networkName = baseUrl.includes('polkadot') ? 'polkadot' : 'kusama';
  try {
    const NominatorStats = Container.get(networkName + 'NominatorStats') as mongoose.Model<
      INominatorStats & mongoose.Document
    >;
    const data = await NominatorStats.find();

    if (data.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }

    const result = {
      stats: {
        nominatorsCount: data[0].nomCount,
        totalRewards: data[0].totalRewards,
        totalAmountStaked: data[0].totalAmountStaked,
        nomMinStake: data[0].nomMinStake,
      },
    };

    return res.status(200).json(result);
  } catch (e) {
    Logger.error('🔥 Error fetching nominators data: %o', e);
    return next(e);
  }
};

export default nominatorStats;
