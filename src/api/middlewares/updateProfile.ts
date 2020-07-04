import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IYieldScanIdentity } from '../../interfaces/IYieldScanIdentity';
import { HttpError, getLinkedValidators } from '../../services/utils';
import { IStakingInfo } from '../../interfaces/IStakingInfo';

const updateProfile = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    // if (req.headers['origin'] !== 'https://developer.mozilla.org') {
    //   throw new HttpError(403, 'Invalid Request');
    // }
    const data = req.body;
    const { stashId, connectedStashId, vision, members } = data;
    // console.log(stashId);
    // console.log(connectedStashId);
    // console.log(vision);
    // console.log(members);

    const SessionValidators = Container.get('SessionValidators') as mongoose.Model<IStakingInfo & mongoose.Document>;
    const validator = await SessionValidators.aggregate([
      {
        $match: {
          stashId: stashId,
        },
      },
    ]);
    if (validator[0] == undefined) {
      throw new HttpError(404, 'No active validator id found for this id');
    }
    if (stashId !== connectedStashId) {
      throw new HttpError(401, 'Unauthorized');
    }

    const YieldScanIdentity = Container.get('YieldScanIdentity') as mongoose.Model<
      IYieldScanIdentity & mongoose.Document
    >;

    const updatedVision = vision !== undefined ? vision : null;

    const updatedMembers = members !== undefined ? members : null;

    await YieldScanIdentity.updateOne(
      { stashId: stashId },
      { $set: { stashId: stashId, vision: updatedVision, members: updatedMembers, lastUpdate: '$$NOW' } },
      { upsert: true },
    );
    return res.status(200).send('hello');
  } catch (e) {
    Logger.error('🔥 Error fetching validator data: %o', e);
    return next(e);
  }
};

export default updateProfile;
