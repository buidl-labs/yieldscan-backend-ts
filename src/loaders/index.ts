import express from 'express';
import mongoose from 'mongoose';

import config from '../config';
import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjector';
import mongooseLoader from './mongoose';
import Logger from './logger';
// We have to import at least all the events once so they can be triggered
import './events';

import ValidatorHistory from '../models/validatorHistory';
import ActiveNominators from '../models/activeNominators';
import TotalRewardHistory from '../models/totalRewardHistory';
import AccountIdentity from '../models/accountIdentity';
import Validators from '../models/validators';
import NominatorHistory from '../models/nominatorHistory';
import ValidatorIdentity from '../models/validatorIdentity';
import Council from '../models/council';
import CouncilIdentity from '../models/councilIdentity';
import NominatorStats from '../models/nominatorStats';
import ValidatorRiskSets from '../models/validatorRiskSets';

import { IValidatorHistory } from '../interfaces/IValidatorHistory';
import { ICouncilIdentity } from '../interfaces/ICouncilIdentity';
import { ITotalRewardHistory } from '../interfaces/ITotalRewardHistory';
import { IAccountIdentity } from '../interfaces/IAccountIdentity';
import { IStakingInfo } from '../interfaces/IStakingInfo';
import { INominatorHistory } from '../interfaces/INominatorHistory';
import { IActiveNominators } from '../interfaces/IActiveNominators';
import { IValidatorIdentity } from '../interfaces/IValidatorIdentity';
import { ICouncil } from '../interfaces/ICouncil';
import { INominatorStats } from '../interfaces/INominatorStats';
import { IValidatorRiskSets } from '../interfaces/IValidatorRiskSets';

export default async ({ expressApp }: { expressApp: express.Application }): Promise<void> => {
  const mongoConnection = await mongooseLoader();
  Logger.info('✌️ DB loaded and connected!');

  function generateModels(networks) {
    const models = [];
    networks.map((network) => {
      const model = [
        {
          name: network.name + 'ValidatorHistory',
          model: mongoose.model<IValidatorHistory & mongoose.Document>(
            network.name + 'validatorHistory',
            ValidatorHistory,
          ),
        },
        {
          name: network.name + 'TotalRewardHistory',
          model: mongoose.model<ITotalRewardHistory & mongoose.Document>(
            network.name + 'totalRewardHistory',
            TotalRewardHistory,
          ),
        },
        {
          name: network.name + 'AccountIdentity',
          model: mongoose.model<IAccountIdentity & mongoose.Document>(
            network.name + 'accountIdentity',
            AccountIdentity,
          ),
        },
        {
          name: network.name + 'Validators',
          model: mongoose.model<IStakingInfo & mongoose.Document>(network.name + 'Validators', Validators),
        },
        {
          name: network.name + 'NominatorHistory',
          model: mongoose.model<INominatorHistory & mongoose.Document>(
            network.name + 'nominatorHistory',
            NominatorHistory,
          ),
        },
        {
          name: network.name + 'ActiveNominators',
          model: mongoose.model<IActiveNominators & mongoose.Document>(
            network.name + 'activeNominators',
            ActiveNominators,
          ),
        },
        {
          name: network.name + 'ValidatorIdentity',
          model: mongoose.model<IValidatorIdentity & mongoose.Document>(
            network.name + 'ValidatorIdentity',
            ValidatorIdentity,
          ),
        },
        {
          name: network.name + 'NominatorStats',
          model: mongoose.model<INominatorStats & mongoose.Document>(network.name + 'NominatorStats', NominatorStats),
        },
        {
          name: network.name + 'ValidatorRiskSets',
          model: mongoose.model<IValidatorRiskSets & mongoose.Document>(
            network.name + 'ValidatorRiskSets',
            ValidatorRiskSets,
          ),
        },
        {
          name: network.name + 'Council',
          model: mongoose.model<ICouncil & mongoose.Document>(network.name + 'council', Council),
        },
        {
          name: network.name + 'CouncilIdentity',
          model: mongoose.model<ICouncilIdentity & mongoose.Document>(
            network.name + 'CouncilIdentity',
            CouncilIdentity,
          ),
        },
      ];
      models.push(...model);
    });
    return models;
  }

  const models = generateModels(config.networks);

  await dependencyInjectorLoader({
    mongoConnection,
    models,
  });

  Logger.info('✌️ Dependency Injector loaded');

  await expressLoader({ app: expressApp });
  Logger.info('✌️ Express loaded');
};
