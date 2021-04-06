import { Container } from 'typedi';
import mongoose from 'mongoose';
import { getNetworkDetails, HttpError } from '../../services/utils';
import { IValidatorRiskSets } from '../../interfaces/IValidatorRiskSets';
import { isNil } from 'lodash';

const risk_set_only = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  try {
    const networkDetails = getNetworkDetails(baseUrl);
    if (isNil(networkDetails)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }
    const ValidatorRiskSets = Container.get(networkDetails.name + 'ValidatorRiskSets') as mongoose.Model<
      IValidatorRiskSets & mongoose.Document
    >;

    const sortedData = await ValidatorRiskSets.find();

    if (sortedData.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }
    const result = {
      lowriskset: sortedData[0].lowriskset,
      medriskset: sortedData[0].medriskset,
      highriskset: sortedData[0].highriskset,
    };
    return res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error generating risk-sets: %o', e);
    return next(e);
  }
};

export default risk_set_only;
