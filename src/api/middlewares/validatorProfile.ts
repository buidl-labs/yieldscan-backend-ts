import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IStakingInfo } from '../../interfaces/IStakingInfo';
import { HttpError, getLinkedValidators } from '../../services/utils';

const validatorProfile = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const id = req.params.id;
    const Validators = Container.get('Validators') as mongoose.Model<IStakingInfo & mongoose.Document>;

    const data = await Validators.aggregate([
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
          from: 'accountidentities',
          localField: 'nominators.nomId',
          foreignField: 'stashId',
          as: 'nomInfo',
        },
      },
      {
        $lookup: {
          from: 'validatoridentities',
          localField: 'stashId',
          foreignField: 'stashId',
          as: 'additionalInfo',
        },
      },
    ]);

    if (data.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }

    data.map((x) => {
      x.commission = x.commission / Math.pow(10, 7);
      x.totalStake = x.totalStake / Math.pow(10, 18);
      x.ownStake = x.ownStake / Math.pow(10, 18);
      x.othersStake = x.totalStake - x.ownStake;
      x.numOfNominators = x.nominators.length;
      x.estimatedPoolReward = x.estimatedPoolReward / Math.pow(10, 18);
      x.name = x.info[0] !== undefined ? x.info[0].display : null;
    });

    const stakingInfo = data.map((x) => {
      const nominatorsInfo = x.nominators.map((y) => {
        y.stake = x.isElected ? y.stake / Math.pow(10, 18) : null;
        const name = x.nomInfo.filter((z) => y.nomId == z.stashId);
        return { nomId: y.nomId, stake: y.stake, name: name[0] !== undefined ? name[0].display : null };
      });
      return {
        ownStake: x.ownStake,
        othersStake: x.othersStake,
        totalStake: x.totalStake,
        isElected: x.isElected,
        isNextElected: x.isNextElected,
        isWaiting: x.isWaiting,
        nominatorsInfo: nominatorsInfo,
      };
    });

    const keyStats = data.map(
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
      data[0].info[0] !== undefined
        ? data[0].info.map((x) => {
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

    const transparencyScores =
      data[0].info[0] !== undefined
        ? data[0].info.map((x) => {
            const nameScore = x.display !== null ? 20 : 0;
            const emailScore = x.email !== null ? 50 : 0;
            const legalScore = x.legal !== null ? 100 : 0;
            const riotScore = x.riot !== null ? 50 : 0;
            const twitterScore = x.twitter !== null ? 40 : 0;
            const webScore = x.web !== null ? 70 : 0;
            const totalScore = nameScore + emailScore + legalScore + riotScore + twitterScore + webScore;
            return {
              name: nameScore,
              email: emailScore,
              legal: legalScore,
              riot: riotScore,
              twitter: twitterScore,
              web: webScore,
              total: totalScore !== 330 ? totalScore : 400,
            };
          })
        : [{}];

    const additionalInfo =
      data[0].additionalInfo[0] !== (undefined || null)
        ? data[0].additionalInfo.map((x) => {
            return {
              vision: x.vision,
              members:
                x.members !== (undefined || null)
                  ? x.members.map((y) => {
                      return {
                        member: y.member,
                        role: y.role !== undefined ? y.role : null,
                        twitter: y.twitter !== undefined ? y.twitter : null,
                      };
                    })
                  : [],
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
        transparencyScores: transparencyScores[0],
      })
      .status(200);
  } catch (e) {
    Logger.error('🔥 Error fetching validator data: %o', e);
    return next(e);
  }
};

export default validatorProfile;
