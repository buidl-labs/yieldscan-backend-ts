import { Container } from 'typedi';
import mongoose from 'mongoose';
import { INominatorStats } from '../../interfaces/INominatorStats';
import { getNetworkDetails, HttpError } from '../../services/utils';
import { isNil } from 'lodash';

const nominatorStats = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  try {
    const networkDetails = getNetworkDetails(baseUrl);
    if (isNil(networkDetails)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }
    const NominatorStats = Container.get(networkDetails.name + 'NominatorStats') as mongoose.Model<
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
