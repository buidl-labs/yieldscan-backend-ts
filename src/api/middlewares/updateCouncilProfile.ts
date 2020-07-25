import { Container } from 'typedi';
import mongoose from 'mongoose';
import { ICouncilIdentity } from '../../interfaces/ICouncilIdentity';
import { HttpError } from '../../services/utils';
import { ICouncil } from '../../interfaces/ICouncil';

const updateCouncilProfile = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const id = req.params.id;
    const data = req.body;
    const { vision, members } = data;

    const Council = Container.get('Council') as mongoose.Model<ICouncil & mongoose.Document>;
    const councilMember = await Council.aggregate([
      {
        $match: {
          accountId: id,
        },
      },
    ]);
    if (councilMember[0] == undefined) {
      throw new HttpError(404, 'No active council member id found for this id');
    }

    const CouncilIdentity = Container.get('CouncilIdentity') as mongoose.Model<ICouncilIdentity & mongoose.Document>;

    const updatedVision = vision !== undefined ? vision : null;

    const updatedMembers = members !== undefined ? members : null;

    await CouncilIdentity.updateOne(
      { accountId: id },
      { $set: { accountId: id, vision: updatedVision, members: updatedMembers } },
      { upsert: true },
    );
    return res.status(200).json({ status: 200, message: 'Info updated' });
  } catch (e) {
    Logger.error('🔥 Error fetching validator data: %o', e);
    return next(e);
  }
};

export default updateCouncilProfile;
