import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IValidatorIdentity } from '../../interfaces/IValidatorIdentity';
import { HttpError, getLinkedValidators } from '../../services/utils';
import { IStakingInfo } from '../../interfaces/IStakingInfo';

const updateProfile = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const id = req.params.id;
    const data = req.body;
    const { stashId, connectedStashId, vision, members } = data;

    const SessionValidators = Container.get('SessionValidators') as mongoose.Model<IStakingInfo & mongoose.Document>;
    const validator = await SessionValidators.aggregate([
      {
        $match: {
          stashId: stashId,
        },
      },
    ]);
    if (stashId !== connectedStashId || connectedStashId !== id) {
      throw new HttpError(401, 'Unauthorized');
    }
    if (validator[0] == undefined) {
      throw new HttpError(404, 'No active validator id found for this id');
    }

    const ValidatorIdentity = Container.get('ValidatorIdentity') as mongoose.Model<
      IValidatorIdentity & mongoose.Document
    >;

    const updatedVision = vision !== undefined ? vision : null;

    const updatedMembers = members !== undefined ? members : null;

    await ValidatorIdentity.updateOne(
      { stashId: stashId },
      { $set: { stashId: stashId, vision: updatedVision, members: updatedMembers, lastUpdate: '$$NOW' } },
      { upsert: true },
    );
    return res.status(200).json({ status: 200, message: 'Info updated' });
  } catch (e) {
    Logger.error('🔥 Error fetching validator data: %o', e);
    return next(e);
  }
};

export default updateProfile;
