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
    const { accountId, stashId, connectedStashId, vision, members } = data;

    if (stashId !== connectedStashId || connectedStashId !== id) {
      throw new HttpError(401, 'Unauthorized');
    }

    const Council = Container.get('Council') as mongoose.Model<ICouncil & mongoose.Document>;
    const councilMember = await Council.aggregate([
      {
        $match: {
          accountId: accountId,
        },
      },
    ]);
    if (councilMember[0] == undefined) {
      throw new HttpError(404, 'No active council member id found for this id');
    }
    if (accountId !== connectedStashId) {
      throw new HttpError(401, 'Unauthorized');
    }

    const CouncilIdentity = Container.get('CouncilIdentity') as mongoose.Model<ICouncilIdentity & mongoose.Document>;

    const updatedVision = vision !== undefined ? vision : null;

    const updatedMembers = members !== undefined ? members : null;

    await CouncilIdentity.updateOne(
      { accountId: accountId },
      { $set: { accountId: accountId, vision: updatedVision, members: updatedMembers, lastUpdate: '$$NOW' } },
      { upsert: true },
    );
    return res.status(200).json({ status: 200, message: 'Info updated' });
  } catch (e) {
    Logger.error('🔥 Error fetching validator data: %o', e);
    return next(e);
  }
};

export default updateCouncilProfile;
