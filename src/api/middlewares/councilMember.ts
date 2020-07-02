import { Container } from 'typedi';
import mongoose from 'mongoose';
import { HttpError } from '../../services/utils';
import { ICouncil } from '../../interfaces/ICouncil';

const councilMember = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const id = req.params.id;
    const Council = Container.get('Council') as mongoose.Model<ICouncil & mongoose.Document>;

    const data = await Council.aggregate([
      {
        $match: {
          member: id,
        },
      },
      {
        $lookup: {
          from: 'accountidentities',
          localField: 'member',
          foreignField: 'stashId',
          as: 'info',
        },
      },
    ]);

    console.log(data);

    if (data.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }

    // const totalRewards = data[0].validatorsInfo.reduce((a, b) => a + b.estimatedReward, 0) / Math.pow(10, 12);
    // const totalAmountStaked = data[0].validatorsInfo.reduce((a, b) => a + b.nomStake, 0) / Math.pow(10, 12);
    // const validatorsInfo = data[0].validatorsInfo.map((x) => {
    //   const name = data[0].info.filter((valId) => valId.stashId == x.stashId);
    //   return {
    //     stashId: x.stashId,
    //     riskScore: x.riskScore,
    //     totalStake: x.totalStake / Math.pow(10, 12),
    //     estimatedPoolReward: x.estimatedReward / Math.pow(10, 12),
    //     commission: x.commission / Math.pow(10, 7),
    //     nomStake: x.nomStake / Math.pow(10, 12),
    //     claimedRewardEras: x.claimedRewards,
    //     name: name[0] !== undefined ? name[0].display : null,
    //   };
    // });

    // const result = {
    //   nomId: data[0].nomId,
    //   stats: {
    //     totalAmountStaked: totalAmountStaked,
    //     estimatedRewards: totalRewards,
    //     earnings: data[0].dailyEarnings,
    //   },
    //   validatorsInfo: validatorsInfo,
    // };

    return res.json(data).status(200);
  } catch (e) {
    Logger.error('🔥 Error generating user data: %o', e);
    return next(e);
  }
};

export default councilMember;
