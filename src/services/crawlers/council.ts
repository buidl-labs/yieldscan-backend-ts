import { Container } from 'typedi';
import mongoose from 'mongoose';

import { ICouncil } from '../../interfaces/ICouncil';
import { wait } from '../utils';

module.exports = {
  start: async function (api) {
    const Logger = Container.get('logger');
    Logger.info('start council');
    const members = await api.derive.elections.info();

    const prime = await api.query.council.prime();

    const balances = await Promise.all(members.members.map((x) => api.derive.balances.all(x[0].toString())));

    const backers = await api.derive.council.votes();

    const membersWithBackers = members.members.map((x) => {
      const backersInfo = backers
        .filter((y) => y[1].votes.includes(x[0]))
        .map((y) => {
          const backer = y[0].toString();
          const stake = parseInt(y[1].stake);
          return { backer: backer, stake: stake };
        });
      const accountId = x[0].toString();
      const isPrime = accountId == prime.toString();
      const stake = parseInt(x[1]);
      const totalBalance = balances.filter((y) => y.accountId.toString() == accountId);
      return {
        accountId: accountId,
        stake: stake,
        isPrime: isPrime,
        isRunnersUp: false,
        backersInfo: backersInfo,
        totalBalance: parseInt(totalBalance[0].votingBalance),
      };
    });

    const runnersUpbalances = await Promise.all(members.runnersUp.map((x) => api.derive.balances.all(x[0].toString())));

    const runnersUpWithBackers = members.runnersUp.map((x) => {
      const backersInfo = backers
        .filter((y) => y[1].votes.includes(x[0]))
        .map((y) => {
          const backer = y[0].toString();
          const stake = parseInt(y[1].stake);
          return { backer: backer, stake: stake };
        });
      const accountId = x[0].toString();
      const isPrime = accountId == prime.toString();
      const stake = parseInt(x[1]);
      const totalBalance = runnersUpbalances.filter((y) => y.accountId.toString() == accountId);
      return {
        accountId: accountId,
        stake: stake,
        isPrime: isPrime,
        isRunnersUp: true,
        backersInfo: backersInfo,
        totalBalance: parseInt(totalBalance[0].votingBalance),
      };
    });

    const result = membersWithBackers.concat(runnersUpWithBackers);

    const Council = Container.get('Council') as mongoose.Model<ICouncil & mongoose.Document>;
    try {
      await Council.deleteMany({});
      await wait(2000);
      await Council.insertMany(result);
    } catch (error) {
      Logger.error('Error while updating council table', error);
    }
    Logger.info('stop council');
    return;
  },
};
