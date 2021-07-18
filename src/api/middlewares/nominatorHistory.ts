import { Container } from 'typedi';
import mongoose from 'mongoose';

import { getNetworkDetails, HttpError } from '../../services/utils';
import { isNil } from 'lodash';
import { IValidatorHistory } from '../../interfaces/IValidatorHistory';
import { ITotalRewardHistory } from '../../interfaces/ITotalRewardHistory';

const nominatorHistory = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  const queryId = req.query?.id;
  const activeEra = Number(req.query?.activeEra);

  try {
    if (isNil(queryId)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }

    if (isNaN(activeEra) || activeEra === 0) {
      Logger.error('🔥 Invalid active era: %o');
      throw new HttpError(404, 'Invalid active era');
    }

    const networkDetails = getNetworkDetails(baseUrl);
    if (isNil(networkDetails)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }
    const ValidatorHistory = Container.get(networkDetails.name + 'ValidatorHistory') as mongoose.Model<
      IValidatorHistory & mongoose.Document
    >;

    const TotalRewardHistory = Container.get(networkDetails.name + 'TotalRewardHistory') as mongoose.Model<
      ITotalRewardHistory & mongoose.Document
    >;

    const erasInAMonth = networkDetails.erasPerDay * 30;

    const erasArray = [...Array(erasInAMonth).keys()].map((i) => activeEra - 1 - i);

    const historyData = await ValidatorHistory.aggregate([
      // { $unwind: '$nominatorsInfo' },
      {
        $match: { $and: [{ eraIndex: { $in: erasArray } }, { 'nominatorsInfo.nomId': queryId }] },
      },
      {
        $sort: { eraIndex: -1 },
      },
      // {
      //   $limit: 30 * networkDetails.erasPerDay,
      // },
      {
        $addFields: { othersStake: { $sum: '$nominatorsInfo.nomStake' } },
      },
      // {
      //   $project: {  }
      // }
      // {
      //   $group: {
      //     _id: '$nominatorsInfo.nomId',
      //     totalStakeAmount: { $sum: '$nominatorsInfo.nomStake' },
      //     stakeAmountArr: { $push: '$nominatorsInfo.nomStake' },
      //     eraIndex: { $push: '$eraIndex' },
      //     count: { $sum: 1 },
      //   },
      // },
    ]);

    if (historyData.length === 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No Data found');
    }

    const eraIndexArr = historyData.map((x) => x.eraIndex);

    const rewardsData = await TotalRewardHistory.find({ eraIndex: { $in: eraIndexArr } });

    if (rewardsData.length === 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }

    const arr = historyData.map((x) => {
      x.ownStake = x.totalStake - x.othersStake;
      x.nominatorsInfo
        .sort((a, b) => {
          return a.nomStake - b.nomStake;
        })
        .slice(-networkDetails.maxNomAllowed);

      // for taking care of oversubscribed case
      x.newOthersStake = x.nominatorsInfo.reduce((acc, nom) => acc + nom.nomStake, 0);
      x.newTotalStake = x.ownStake + x.newOthersStake;
      x.nominatorsInfo = x.nominatorsInfo.filter((nom) => nom.nomId === queryId);
      x.eraTotalReward = rewardsData
        .filter((data) => data.eraIndex === x.eraIndex)
        .reduce((previous, reward) => reward.eraTotalReward, 0);
      // x.commission = x.commission / Math.pow(10, 9);
      x.poolReward = (x.eraPoints / x.totalEraPoints) * x.eraTotalReward;

      x.nomId = x.nominatorsInfo.filter((nom) => nom.nomId === queryId)[0].nomId;
      x.nomStake = x.nominatorsInfo.filter((nom) => nom.nomId === queryId)[0].nomStake;

      x.nomReward = Math.floor(
        ((x.poolReward - (x.commission / Math.pow(10, 9)) * x.poolReward) * x.nominatorsInfo[0].nomStake) /
          (100 + x.newTotalStake),
      );

      return {
        nomReward: x.nomReward,
        stashId: x.stashId,
        eraIndex: x.eraIndex,
        nomId: x.nomId,
        commission: x.commission,
        nomStake: x.nomStake,
      };
    });

    // const nomTotalReward = arr.reduce((acc, x) => (x.nomReward ? acc + x.nomReward : acc), 0);

    return res.status(200).json(arr);
  } catch (e) {
    Logger.error('🔥 Error fetching nominators data: %o', e);
    return next(e);
  }
};

export default nominatorHistory;
