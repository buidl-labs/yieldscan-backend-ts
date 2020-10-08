import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IValidatorIdentity } from '../../interfaces/IValidatorIdentity';
import { HttpError } from '../../services/utils';
import { IStakingInfo } from '../../interfaces/IStakingInfo';

const updateProfile = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  const networkName = baseUrl.includes('polkadot') ? 'polkadot' : 'kusama';
  try {
    const id = req.params.id;
    const data = req.body;
    const { vision, members } = data;

    const Validators = Container.get(networkName + 'Validators') as mongoose.Model<IStakingInfo & mongoose.Document>;
    const validator = await Validators.aggregate([
      {
        $match: {
          stashId: id,
        },
      },
    ]);
    if (validator[0] == undefined) {
      throw new HttpError(404, 'No validator id found for this id');
    }

    const ValidatorIdentity = Container.get(networkName + 'ValidatorIdentity') as mongoose.Model<
      IValidatorIdentity & mongoose.Document
    >;

    const updatedVision = vision !== undefined ? vision : null;

    const updatedMembers = members !== undefined ? members : null;

    await ValidatorIdentity.updateOne(
      { stashId: id },
      { $set: { stashId: id, vision: updatedVision, members: updatedMembers } },
      { upsert: true },
    );
    return res.status(200).json({ status: 200, message: 'Info updated' });
  } catch (e) {
    Logger.error('🔥 Error fetching validator data: %o', e);
    return next(e);
  }
};

export default updateProfile;
