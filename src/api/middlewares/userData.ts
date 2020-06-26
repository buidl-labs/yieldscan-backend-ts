import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IActiveNominators } from '../../interfaces/IActiveNominators';

const userData = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const id = req.params.id;
    const ActiveNominators = Container.get('ActiveNominators') as mongoose.Model<IActiveNominators & mongoose.Document>;
    const data: Array<IActiveNominators> = await ActiveNominators.find({ nomId: id }).lean();

    if (data.length == 0) {
      res.json({ message: 'No data found!' }).status(302);
    }

    const totalRewards = data[0].validatorsInfo.reduce((a, b) => a + b.estimatedReward, 0);
    const totalAmountStaked = data[0].validatorsInfo.reduce((a, b) => a + b.nomStake, 0);

    const result = {
      nomId: data[0].nomId,
      stats: {
        totalAmountStaked: totalAmountStaked,
        estimatedRewards: totalRewards,
        earnings: data[0].dailyEarnings,
      },
      validatorsInfo: data[0].validatorsInfo,
    };

    res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error attaching user to req: %o', e);
    return next(e);
  }
};

export default userData;
