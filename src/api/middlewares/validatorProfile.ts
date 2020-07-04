import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { HttpError, getLinkedValidators } from '../../services/utils';
import { removeListener } from 'process';

const validatorProfile = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const id = req.params.id;
    const SessionValidators = Container.get('SessionValidators') as mongoose.Model<IStakingInfo & mongoose.Document>;

    const sortedData = await SessionValidators.aggregate([
      {
        $match: {
          stashId: id,
        },
      },
      {
        $lookup: {
          from: 'accountidentities',
          localField: 'stashId',
          foreignField: 'stashId',
          as: 'info',
        },
      },
      {
        $lookup: {
          from: 'yieldscanidentities',
          localField: 'stashId',
          foreignField: 'stashId',
          as: 'additionalInfo',
        },
      },
    ]);

    if (sortedData.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }

    sortedData.map((x) => {
      x.commission = x.commission / Math.pow(10, 7);
      x.totalStake = x.totalStake / Math.pow(10, 12);
      x.ownStake = x.ownStake / Math.pow(10, 12);
      x.othersStake = x.nominators.reduce((a, b) => a + b.stake, 0) / Math.pow(10, 12);
      x.numOfNominators = x.nominators.length;
      x.estimatedPoolReward = x.estimatedPoolReward / Math.pow(10, 12);
      x.name = x.info[0] !== undefined ? x.info[0].display : null;
    });

    const stakingInfo = sortedData.map((x) => {
      const nominatorsInfo = x.nominators.map((x) => {
        x.stake = x.stake / Math.pow(10, 12);
        return { nomId: x.nomId, stake: x.stake };
      });
      return {
        ownStake: x.ownStake,
        nominatorsInfo: nominatorsInfo,
      };
    });

    const keyStats = sortedData.map(
      ({
        stashId,
        commission,
        ownStake,
        othersStake,
        estimatedPoolReward,
        numOfNominators,
        rewardsPer100KSM,
        riskScore,
      }) => ({
        stashId,
        commission,
        ownStake,
        othersStake,
        estimatedPoolReward,
        numOfNominators,
        rewardsPer100KSM,
        riskScore,
      }),
    );

    const socialInfo =
      sortedData[0].info[0] !== undefined
        ? sortedData[0].info.map((x) => {
            return {
              name: x.display,
              email: x.email,
              legal: x.legal,
              riot: x.riot,
              twitter: x.twitter,
              web: x.web,
            };
          })
        : [{}];

    const additionalInfo =
      sortedData[0].additionalInfo[0] !== undefined
        ? sortedData[0].additionalInfo.map((x) => {
            return {
              vision: x.vision,
              members: x.members.map((y) => {
                return {
                  member: y.member,
                  role: y.role !== undefined ? y.role : null,
                  twitter: y.twitter !== undefined ? y.twitter : null,
                };
              }),
            };
          })
        : [{}];

    const linkedValidators = await getLinkedValidators(socialInfo[0], keyStats[0].stashId);

    return res
      .json({
        keyStats: keyStats[0],
        stakingInfo: stakingInfo[0],
        socialInfo: socialInfo[0],
        additionalInfo: additionalInfo[0],
        linkedValidators: linkedValidators,
      })
      .status(200);
  } catch (e) {
    Logger.error('🔥 Error fetching validator data: %o', e);
    return next(e);
  }
};

export default validatorProfile;
