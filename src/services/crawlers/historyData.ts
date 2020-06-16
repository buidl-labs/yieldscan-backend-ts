const ValidatorHistory = require("../../models/validatorHistory");

const { wait } = require("../utils")
module.exports = {
    start: async function(api) {
        const eraIndex = await module.exports.getEraIndexes(api);
        console.log("eraIndex");
        console.log(eraIndex);
        if (eraIndex.length !== 0) {
            await module.exports.storeValidatorHistory(api, eraIndex);
        }
    },
    getRewards: async function(api, eraIndex) {
        try {
            const rewards = await Promise.all(
                eraIndex.map((i) => api.query.staking.erasValidatorReward(i))
            );
            return rewards;
        } catch (error) {
            console.log('caught error while fetching pointsHistoryWithTotalReward. Retrying in 15s');
            await wait(15000);
            await module.exports.getRewards(api, eraIndex);
        }
    },

    getSlashes: async function(api, pointsHistory) {
        const slashes = {};
        // console.log(pointsHistory)
        for (let i = 0; i < pointsHistory.length; i++) {
            const individuals = Object.keys(pointsHistory[i].erasRewardPoints.individual).filter(x => !Object.keys(slashes).includes(x))
            // console.log(individuals)
            const slashInfo = await Promise.all(
                individuals.map((val) => api.derive.staking.ownSlashes(val))
            );
            // console.log(slashInfo)
            individuals.map((x,index) =>{
                slashes[x] = slashInfo[index]
            })
            // console.log(slashes);
        }
        return slashes;
    },
    
    getEraIndexes: async function(api) {
        // get the latest eraIndex from the DB
        const lastIndexDB = await ValidatorHistory.find({})
            .sort({ eraIndex: -1 })
            .limit(1);
        // console.log(lastIndexDB);
        const historyDepth = await api.query.staking.historyDepth();
        const currentEra = await api.query.staking.currentEra();
        const lastAvailableEra = currentEra - historyDepth;
        // console.log(lastAvailableEra);
        // console.log(lastIndexDB.length);
        
        // check whether there is any previous data available inside the DB
        if (lastIndexDB.length !== 0) {
            // console.log(lastIndexDB[0].eraIndex);
            
            // check whether available eraIndex from DB is not very old
            if (lastIndexDB[0].eraIndex >= lastAvailableEra) {
                const indexCount = currentEra - lastIndexDB[0].eraIndex - 1;
                // console.log(indexCount);
                const eraIndex = [...Array(indexCount).keys()].map(
                    (i) => i + (lastIndexDB[0].eraIndex + 1)
                );
                return eraIndex;
            }
        }
        const eraIndex = [...Array(historyDepth.toNumber()).keys()].map(
            (i) => i + lastAvailableEra
        );
        return eraIndex;
    },
    
    storeValidatorHistory: async function(api, eraIndex) {
        const rewardsWithEraIndex = {};
        const totalRewards = await module.exports.getRewards(api, eraIndex);
        // console.log("got total rewards");
        // console.log('totalRewards', JSON.stringify(totalRewards))
        totalRewards.forEach((x, i) => {
            rewardsWithEraIndex[eraIndex[i]] = x;
        });
        const erasRewardPointsArr = await Promise.all(
            eraIndex.map((i) => api.query.staking.erasRewardPoints(i))
        );
    
        const pointsHistory = eraIndex.map((i, index) => {
            return { eraIndex: i, erasRewardPoints: erasRewardPointsArr[index] };
        });
        // console.log(JSON.stringify(pointsHistory))
        console.log("waiting 15s");
        await wait(15000);
        
         

        pointsHistory.map((x) => {
            //   console.log(x)
            x.totalReward = rewardsWithEraIndex[x.eraIndex];
            // console.log(x)
            return x;
        });
        //   console.log(JSON.stringify(pointsHistory));
        // Todo remove JSON.parse(JSON.stringify)
        const pointsHistoryWithTotalReward = JSON.parse(
            JSON.stringify(pointsHistory)
        );

        const slashes = await module.exports.getSlashes(api, pointsHistoryWithTotalReward);
        // console.log(JSON.stringify(slashes))
    
        const valPrefs = {};
        const valExposure = {};
        const rewards = [];
    
        // console.log(pointsHistoryWithTotalReward.length)
        for (let i = 0; i < pointsHistoryWithTotalReward.length; i++) {
            // const element = pointsHistoryWithTotalReward[i];
            console.log("waiting 5 secs");
            await wait(5000);
            valExposure[
                pointsHistoryWithTotalReward[i].eraIndex
            ] = await Promise.all(
                Object.keys(
                    pointsHistoryWithTotalReward[i].erasRewardPoints.individual
                ).map((x) =>
                    api.query.staking.erasStakers(
                        pointsHistoryWithTotalReward[i].eraIndex,
                        x.toString()
                    )
                )
            );
            valPrefs[pointsHistoryWithTotalReward[i].eraIndex] = await Promise.all(
                Object.keys(
                    pointsHistoryWithTotalReward[i].erasRewardPoints.individual
                ).map((x) =>
                    api.query.staking.erasValidatorPrefs(
                        pointsHistoryWithTotalReward[i].eraIndex,
                        x.toString()
                    )
                )
            );
    
            Object.keys(
                pointsHistoryWithTotalReward[i].erasRewardPoints.individual
            ).forEach((y, index) => {
                //
                // poolReward = eraPoints/totalErapoints * totalReward
                // validatorReward = (eraPoints/totalErapoints * totalReward) * ownStake/totalStake + commission
                //
    
                // poolreward calculation
                const poolReward =
                    (pointsHistoryWithTotalReward[i].erasRewardPoints.individual[
                        y
                    ] /
                        pointsHistoryWithTotalReward[i].erasRewardPoints.total) *
                    pointsHistoryWithTotalReward[i].totalReward;
                // console.log(poolReward)
    
                // validator reward calculation
                const validatorReward =
                    ((pointsHistoryWithTotalReward[i].erasRewardPoints.individual[
                        y
                    ] /
                        pointsHistoryWithTotalReward[i].erasRewardPoints.total) *
                        pointsHistoryWithTotalReward[i].totalReward *
                        parseInt(
                            valExposure[pointsHistoryWithTotalReward[i].eraIndex][
                                index
                            ].own
                        )) /
                        parseInt(
                            valExposure[pointsHistoryWithTotalReward[i].eraIndex][
                                index
                            ].total
                        ) +
                    parseInt(
                        valPrefs[pointsHistoryWithTotalReward[i].eraIndex][index]
                            .commission
                    );
                // console.log(validatorReward)
    
                // nominator info calculation
                const nominatorsRewards = valExposure[
                    pointsHistoryWithTotalReward[i].eraIndex
                ][index].others.map((x) => {
                    const nomId = x.who.toString();
                    const nomReward =
                        (((pointsHistoryWithTotalReward[i].erasRewardPoints
                            .individual[y] /
                            pointsHistoryWithTotalReward[i].erasRewardPoints
                                .total) *
                            pointsHistoryWithTotalReward[i].totalReward -
                            parseInt(
                                valPrefs[pointsHistoryWithTotalReward[i].eraIndex][
                                    index
                                ].commission
                            )) *
                            parseInt(x.value)) /
                        parseInt(
                            valExposure[pointsHistoryWithTotalReward[i].eraIndex][
                                index
                            ].total
                        );
                    return {
                        nomId: nomId,
                        nomReward: nomReward,
                        nomStake: parseInt(x.value),
                    };
                });
                // console.log(JSON.stringify(nominatorsRewards))
                const slashInfo = slashes[y].filter(x => parseInt(x.era) == pointsHistoryWithTotalReward[i].eraIndex)
                // console.log(slashInfo)
                rewards.push({
                    poolReward: poolReward,
                    validatorReward: validatorReward,
                    stashId: y,
                    totalReward: pointsHistoryWithTotalReward[i].totalReward,
                    commission: parseInt(
                        valPrefs[pointsHistoryWithTotalReward[i].eraIndex][index]
                            .commission
                    ),
                    eraIndex: pointsHistoryWithTotalReward[i].eraIndex,
                    eraPoints:
                        pointsHistoryWithTotalReward[i].erasRewardPoints.individual[
                            y
                        ],
                    totalEraPoints:
                        pointsHistoryWithTotalReward[i].erasRewardPoints.total,
                    nominatorsRewards: nominatorsRewards,
                    slashCount: parseInt(slashInfo[0].total)
                });
            });
        }
        
        // insert data into DB
        await ValidatorHistory.insertMany(rewards);
        // console.log(rewards);
    },
};
