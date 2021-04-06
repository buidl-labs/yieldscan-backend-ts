import { Container } from 'typedi';
import mongoose from 'mongoose';
import { ITotalRewardHistory } from '../../interfaces/ITotalRewardHistory';
import { INominatorHistory } from '../../interfaces/INominatorHistory';
import { getNetworkDetails, HttpError } from '../../services/utils';
import { isNil } from 'lodash';

const top_nominator = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  try {
    const networkDetails = getNetworkDetails(baseUrl);
    if (isNil(networkDetails)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }
    const TotalRewardHistory = Container.get(networkDetails.name + 'TotalRewardHistory') as mongoose.Model<
      ITotalRewardHistory & mongoose.Document
    >;
    const lastIndexDB = await TotalRewardHistory.find({}).sort({ eraIndex: -1 }).limit(1);

    const eraIndex = lastIndexDB[0].eraIndex;
    const eraTotalReward = lastIndexDB[0].eraTotalReward;

    const NominatorHistory = Container.get(networkDetails.name + 'NominatorHistory') as mongoose.Model<
      INominatorHistory & mongoose.Document
    >;
    const sortedData = await NominatorHistory.aggregate([
      {
        $match: {
          eraIndex: eraIndex,
        },
      },
    ]);

    sortedData.map((x) => {
      x.nomEraReward = x.validatorsInfo.reduce((a, b) => {
        const commission = b.commission / Math.pow(10, 9);
        const totalStake = b.totalStake / Math.pow(10, networkDetails.decimalPlaces);
        const nomStake = b.nomStake / Math.pow(10, networkDetails.decimalPlaces);
        const poolReward =
          ((eraTotalReward / Math.pow(10, networkDetails.decimalPlaces)) * b.eraPoints) / b.totalEraPoints;
        const reward = (poolReward - commission * poolReward) * (nomStake / totalStake);
        return a + reward;
      }, 0);
      x.nomTotalStake = x.validatorsInfo.reduce((a, b) => {
        const nomStake = b.nomStake / Math.pow(10, networkDetails.decimalPlaces);
        return a + nomStake;
      }, 0);
      x.nominations = x.validatorsInfo.length;
    });

    const max = sortedData.reduce(
      (prev, current) => {
        return prev.nomEraReward > current.nomEraReward ? prev : current;
      },
      { nomEraReward: 0 },
    );

    return res.status(200).json(max);
  } catch (e) {
    Logger.error('🔥 Error fetching max-set: %o', e);
    return next(e);
  }
};

export default top_nominator;
